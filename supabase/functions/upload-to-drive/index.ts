import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Convert base64 / PEM RSA private key to CryptoKey
async function importPrivateKey(pem: string): Promise<CryptoKey> {
  const cleanPem = pem
    .replace(/-----BEGIN PRIVATE KEY-----/g, '')
    .replace(/-----END PRIVATE KEY-----/g, '')
    .replace(/\s+/g, '')

  const binaryDer = Uint8Array.from(atob(cleanPem), (c) => c.charCodeAt(0))

  return await crypto.subtle.importKey(
    'pkcs8',
    binaryDer.buffer,
    {
      name: 'RSASSA-PKCS1-v1_5',
      hash: 'SHA-256',
    },
    false,
    ['sign']
  )
}

// Base64URL helper
function base64UrlEncode(str: string): string {
  return btoa(str)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

function base64UrlEncodeBuffer(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return base64UrlEncode(binary)
}

// Get Google OAuth2 Access Token using RS256 signed JWT
async function getGoogleAccessToken(serviceAccountJson: any): Promise<string> {
  const now = Math.floor(Date.now() / 1000)
  const header = {
    alg: 'RS256',
    typ: 'JWT',
  }

  const payload = {
    iss: serviceAccountJson.client_email,
    scope: 'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/drive',
    aud: serviceAccountJson.token_uri || 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now,
  }

  const encodedHeader = base64UrlEncode(JSON.stringify(header))
  const encodedPayload = base64UrlEncode(JSON.stringify(payload))
  const unsignedToken = `${encodedHeader}.${encodedPayload}`

  const privateKey = await importPrivateKey(serviceAccountJson.private_key)
  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    privateKey,
    new TextEncoder().encode(unsignedToken)
  )

  const jwt = `${unsignedToken}.${base64UrlEncodeBuffer(signature)}`

  const tokenRes = await fetch(serviceAccountJson.token_uri || 'https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  })

  if (!tokenRes.ok) {
    const errText = await tokenRes.text()
    throw new Error(`Google OAuth error (${tokenRes.status}): ${errText}`)
  }

  const tokenData = await tokenRes.json()
  return tokenData.access_token
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 1. Verify caller has authenticated session token
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Sessão não autorizada. Faça login na plataforma.' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 2. Read Secrets
    const saKeyEnv = Deno.env.get('GOOGLE_SERVICE_ACCOUNT_KEY')
    const folderId = Deno.env.get('GOOGLE_DRIVE_FOLDER_ID')

    if (!saKeyEnv) {
      return new Response(
        JSON.stringify({
          error: 'Chave GOOGLE_SERVICE_ACCOUNT_KEY não configurada nos segredos do Supabase.',
          code: 'GOOGLE_CREDENTIALS_MISSING',
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    let serviceAccount: any
    try {
      serviceAccount = JSON.parse(saKeyEnv)
    } catch {
      // If passed as base64
      try {
        serviceAccount = JSON.parse(atob(saKeyEnv))
      } catch (_e) {
        return new Response(
          JSON.stringify({ error: 'Formato inválido para GOOGLE_SERVICE_ACCOUNT_KEY. Deve ser JSON.' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

    // 3. Extract uploaded file from multipart form data
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const customName = formData.get('name') as string | null

    if (!file) {
      return new Response(
        JSON.stringify({ error: 'Nenhum ficheiro fornecido no corpo do pedido.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const fileName = customName || file.name
    const mimeType = file.type || 'application/octet-stream'

    // 4. Obtain access token
    const accessToken = await getGoogleAccessToken(serviceAccount)

    // 5. Upload file to Google Drive v3 API (Multipart Upload)
    const boundary = `-------boundary_${Date.now()}`
    const metadata: any = {
      name: fileName,
      mimeType: mimeType,
    }
    if (folderId) {
      metadata.parents = [folderId]
    }

    const fileBuffer = await file.arrayBuffer()
    const metadataPart = `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}\r\n`
    const mediaHeader = `--${boundary}\r\nContent-Type: ${mimeType}\r\n\r\n`
    const footer = `\r\n--${boundary}--`

    const enc = new TextEncoder()
    const part1 = enc.encode(metadataPart)
    const part2 = enc.encode(mediaHeader)
    const part3 = new Uint8Array(fileBuffer)
    const part4 = enc.encode(footer)

    const fullPayload = new Uint8Array(part1.length + part2.length + part3.length + part4.length)
    fullPayload.set(part1, 0)
    fullPayload.set(part2, part1.length)
    fullPayload.set(part3, part1.length + part2.length)
    fullPayload.set(part4, part1.length + part2.length + part3.length)

    const uploadRes = await fetch(
      'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink,webContentLink,size,mimeType',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': `multipart/related; boundary=${boundary}`,
        },
        body: fullPayload,
      }
    )

    if (!uploadRes.ok) {
      const errText = await uploadRes.text()
      console.error('Google Drive upload error:', errText)
      return new Response(
        JSON.stringify({ error: `Erro no upload do Google Drive: ${errText}` }),
        { status: uploadRes.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const driveFile = await uploadRes.json()

    // 6. Set sharing permission to 'anyone with the link can view'
    try {
      await fetch(`https://www.googleapis.com/drive/v3/files/${driveFile.id}/permissions`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          role: 'reader',
          type: 'anyone',
        }),
      })
    } catch (permErr) {
      console.warn('Could not set public link permission:', permErr)
    }

    // 7. Return metadata
    const result = {
      id: driveFile.id,
      name: driveFile.name,
      url: driveFile.webViewLink || `https://drive.google.com/file/d/${driveFile.id}/view`,
      webContentLink: driveFile.webContentLink,
      size: driveFile.size ? Number(driveFile.size) : file.size,
      type: driveFile.mimeType || mimeType,
      drive_file_id: driveFile.id,
      provider: 'google_drive',
      uploaded_at: new Date().toISOString(),
    }

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err: any) {
    console.error('Server error in upload-to-drive:', err)
    return new Response(
      JSON.stringify({ error: err?.message || 'Erro inesperado no servidor ao processar o upload.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
