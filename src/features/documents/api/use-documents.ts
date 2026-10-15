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
      const localDocs = getLocalFallback().filter((d) => !d.deleted_at)
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
            return localDocs
          }
          throw error
        }

        const supabaseDocs = (data || []) as AppDocument[]
        if (supabaseDocs.length === 0) {
          return localDocs
        }

        const supabaseIds = new Set(supabaseDocs.map((d) => d.id))
        const remainingLocal = localDocs.filter((d) => !supabaseIds.has(d.id))
        return [...supabaseDocs, ...remainingLocal]
      } catch (err: any) {
        console.warn('Falha ao carregar documentos do Supabase, a recorrer ao fallback local:', err)
        return localDocs
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
      // 1. Unconditionally remove from local fallback storage
      const existing = getLocalFallback()
      saveLocalFallback(existing.filter((d) => d.id !== id))

      // 2. Try to clean up storage if we have the file url
      try {
        const cachedDocs = queryClient.getQueryData<AppDocument[]>([DOCUMENTS_QUERY_KEY])
        const targetDoc = cachedDocs?.find((d) => d.id === id)
        if (targetDoc?.file_url) {
          const match = targetDoc.file_url.match(/\/(documents|receipts)\/([^?#]+)/)
          if (match) {
            const bucket = match[1]
            const path = decodeURIComponent(match[2])
            await (supabase as any).storage.from(bucket).remove([path])
          }
        }
      } catch (storageErr) {
        console.warn('Não foi possível remover ficheiro do storage:', storageErr)
      }

      // 3. Attempt hard delete in Supabase first
      const { error: hardErr } = await (supabase as any)
        .from('documents')
        .delete()
        .eq('id', id)

      // If hard delete succeeded, we are done!
      if (!hardErr) {
        return id
      }

      console.warn('Hard delete falhou no Supabase, a tentar soft-delete (deleted_at):', hardErr)

      // 4. If hard delete failed (e.g. RLS restricts DELETE to superadmin), attempt soft-delete WITHOUT .select()
      // Crucial: do NOT append .select() here, as PostgreSQL RETURNING runs the SELECT RLS policy on the row,
      // which fails since deleted_at IS NOT NULL.
      const { error: softErr } = await (supabase as any)
        .from('documents')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id)

      if (softErr) {
        console.error('Ambos os métodos de remoção falharam no Supabase:', { hardErr, softErr })
        throw new Error(hardErr.message || softErr.message || 'Erro ao eliminar documento no Supabase.')
      }

      return id
    },
    onMutate: async (id: string) => {
      // Optimistic update: cancel ongoing refetches and immediately remove doc from cache
      await queryClient.cancelQueries({ queryKey: [DOCUMENTS_QUERY_KEY] })
      const previousDocs = queryClient.getQueryData<AppDocument[]>([DOCUMENTS_QUERY_KEY])

      queryClient.setQueryData<AppDocument[]>([DOCUMENTS_QUERY_KEY], (old = []) =>
        old.filter((d) => d.id !== id)
      )

      return { previousDocs }
    },
    onError: (_err, _id, context) => {
      // Rollback to previous docs on failure
      if (context?.previousDocs) {
        queryClient.setQueryData([DOCUMENTS_QUERY_KEY], context.previousDocs)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: [DOCUMENTS_QUERY_KEY] })
    },
  })
}
