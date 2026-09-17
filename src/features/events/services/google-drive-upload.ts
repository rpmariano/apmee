import { supabase } from '@/lib/supabase'
import type { EventDocument } from '@/types/database'

/**
 * Uploads a meeting document (Minutes, Notice, Budget, Presentation)
 * directly to the association's Google Drive via the secure Supabase Edge Function.
 */
export async function uploadDocumentToGoogleDrive(
  file: File,
  customName?: string
): Promise<EventDocument> {
  // Validate file size (max 25MB for Google Drive edge upload)
  const MAX_SIZE = 25 * 1024 * 1024
  if (file.size > MAX_SIZE) {
    throw new Error('O ficheiro é demasiado grande. O tamanho máximo permitido é 25MB.')
  }

  const formData = new FormData()
  formData.append('file', file)
  if (customName) {
    formData.append('name', customName)
  }

  // Invoke the Edge Function
  const { data, error } = await supabase.functions.invoke('upload-to-drive', {
    body: formData,
  })

  if (error) {
    console.error('Error invoking upload-to-drive function:', error)
    
    // Check if function not found or credentials missing
    const msg = error.message || ''
    if (msg.includes('404') || msg.includes('not found') || msg.includes('Failed to send')) {
      throw new Error(
        'A função de upload para o Google Drive ainda não foi publicada no Supabase. Consulte o guia de configuração em docs/google-drive-setup.md ou anexe via link do Google Drive.'
      )
    }

    if (msg.includes('GOOGLE_CREDENTIALS_MISSING') || msg.includes('Chave GOOGLE_SERVICE_ACCOUNT_KEY')) {
      throw new Error(
        'As credenciais do Google Drive ainda não foram configuradas nos segredos do Supabase. Consulte docs/google-drive-setup.md.'
      )
    }

    throw new Error(msg || 'Erro ao carregar o documento para o Google Drive. Tente novamente.')
  }

  if (!data || !data.url) {
    throw new Error('Resposta inválida do servidor de upload para o Google Drive.')
  }

  return {
    id: data.id || crypto.randomUUID(),
    name: data.name || file.name,
    url: data.url,
    size: data.size || file.size,
    type: data.type || file.type,
    drive_file_id: data.drive_file_id,
    provider: 'google_drive',
    uploaded_at: data.uploaded_at || new Date().toISOString(),
  }
}
