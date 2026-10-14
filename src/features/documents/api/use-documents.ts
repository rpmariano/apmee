import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { AppDocument, DocumentStatus } from '../types'

const DOCUMENTS_QUERY_KEY = 'documents'
const LOCAL_STORAGE_KEY = 'apmee_fallback_documents'

function getLocalFallback(): AppDocument[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveLocalFallback(docs: AppDocument[]) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(docs))
  } catch {
    // ignore
  }
}

export function useDocuments() {
  return useQuery({
    queryKey: [DOCUMENTS_QUERY_KEY],
    queryFn: async () => {
      try {
        const { data, error } = await (supabase as any)
          .from('documents')
          .select('*')
          .is('deleted_at', null)
          .order('created_at', { ascending: false })

        if (error) {
          // If table doesn't exist in Supabase yet, use local fallback
          if (
            error.code === '42P01' ||
            error.message?.includes('relation "documents" does not exist') ||
            error.message?.includes('schema cache')
          ) {
            console.warn('Tabela documents ainda não existe no Supabase. A usar armazenamento local.')
            return getLocalFallback()
          }
          throw error
        }

        return (data || []) as AppDocument[]
      } catch (err: any) {
        console.warn('Falha ao carregar documentos do Supabase, a recorrer ao fallback local:', err)
        return getLocalFallback()
      }
    },
  })
}

export async function uploadDocumentFile(file: File): Promise<{
  fileUrl: string
  fileName: string
  fileSize: number
  fileType: string
}> {
  const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
  const storagePath = `${Date.now()}-${Math.random().toString(36).substring(2, 7)}-${safeName}`

  let uploadSuccess = false
  let publicUrl = ''

  // 1. Try 'documents' bucket
  try {
    const { error: docBucketError } = await (supabase as any).storage
      .from('documents')
      .upload(storagePath, file)

    if (!docBucketError) {
      const { data } = (supabase as any).storage
        .from('documents')
        .getPublicUrl(storagePath)
      publicUrl = data?.publicUrl || ''
      uploadSuccess = true
    }
  } catch {
    // Continue to fallback
  }

  // 2. If 'documents' bucket failed, try 'receipts' bucket which exists
  if (!uploadSuccess) {
    try {
      const { error: receiptsError } = await (supabase as any).storage
        .from('receipts')
        .upload(storagePath, file)

      if (!receiptsError) {
        const { data } = (supabase as any).storage
          .from('receipts')
          .getPublicUrl(storagePath)
        publicUrl = data?.publicUrl || ''
        uploadSuccess = true
      }
    } catch {
      // Continue to fallback
    }
  }

  // 3. If storage upload failed completely, convert to Data URL for resilience
  if (!uploadSuccess || !publicUrl) {
    publicUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  return {
    fileUrl: publicUrl,
    fileName: file.name,
    fileSize: file.size,
    fileType: file.type || 'application/octet-stream',
  }
}

export function useCreateDocument() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: {
      title: string
      file_name: string
      file_url: string
      file_size?: number
      file_type?: string
      category: string
      status: DocumentStatus
      notes?: string | null
    }) => {
      const { data: { session } } = await supabase.auth.getSession()
      const user = session?.user

      const docData = {
        ...payload,
        uploaded_by: user?.id || null,
        uploaded_by_name: user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Utilizador',
      }

      try {
        const { data, error } = await (supabase as any)
          .from('documents')
          .insert(docData)
          .select()
          .single()

        if (error) {
          if (
            error.code === '42P01' ||
            error.message?.includes('relation "documents" does not exist') ||
            error.message?.includes('schema cache')
          ) {
            // Save to local fallback
            const localDoc: AppDocument = {
              id: crypto.randomUUID(),
              ...docData,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            }
            const existing = getLocalFallback()
            saveLocalFallback([localDoc, ...existing])
            return localDoc
          }
          throw error
        }

        return data as AppDocument
      } catch (err: any) {
        // Fallback local save
        const localDoc: AppDocument = {
          id: crypto.randomUUID(),
          ...docData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
        const existing = getLocalFallback()
        saveLocalFallback([localDoc, ...existing])
        return localDoc
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [DOCUMENTS_QUERY_KEY] })
    },
  })
}

export function useUpdateDocument() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<AppDocument> & { id: string }) => {
      try {
        const { data, error } = await (supabase as any)
          .from('documents')
          .update({
            ...updates,
            updated_at: new Date().toISOString(),
          })
          .eq('id', id)
          .select()
          .single()

        if (error) {
          // Fallback update local
          const existing = getLocalFallback()
          const updated = existing.map((d) => (d.id === id ? { ...d, ...updates } : d))
          saveLocalFallback(updated)
          return updated.find((d) => d.id === id)
        }

        return data as AppDocument
      } catch {
        const existing = getLocalFallback()
        const updated = existing.map((d) => (d.id === id ? { ...d, ...updates } : d))
        saveLocalFallback(updated)
        return updated.find((d) => d.id === id)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [DOCUMENTS_QUERY_KEY] })
    },
  })
}

export function useDeleteDocument() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      try {
        const { error } = await (supabase as any)
          .from('documents')
          .update({ deleted_at: new Date().toISOString() })
          .eq('id', id)

        if (error) {
          const existing = getLocalFallback()
          saveLocalFallback(existing.filter((d) => d.id !== id))
          return id
        }

        return id
      } catch {
        const existing = getLocalFallback()
        saveLocalFallback(existing.filter((d) => d.id !== id))
        return id
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [DOCUMENTS_QUERY_KEY] })
    },
  })
}
