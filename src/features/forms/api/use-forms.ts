import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { AppForm, FormStatus } from '../types'

const FORMS_QUERY_KEY = 'forms'
const LOCAL_STORAGE_KEY = 'apmee_fallback_forms'

function getLocalFallback(): AppForm[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveLocalFallback(forms: AppForm[]) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(forms))
  } catch {
    // ignore
  }
}

export function useForms() {
  return useQuery({
    queryKey: [FORMS_QUERY_KEY],
    queryFn: async () => {
      try {
        const { data, error } = await (supabase as any)
          .from('forms')
          .select('*')
          .is('deleted_at', null)
          .order('created_at', { ascending: false })

        if (error) {
          // If table doesn't exist in Supabase yet, use local fallback
          if (
            error.code === '42P01' ||
            error.message?.includes('relation "forms" does not exist') ||
            error.message?.includes('schema cache')
          ) {
            console.warn('Tabela forms ainda não existe no Supabase. A usar armazenamento local.')
            return getLocalFallback()
          }
          throw error
        }

        return (data || []) as AppForm[]
      } catch (err: any) {
        console.warn('Falha ao carregar formulários do Supabase, a recorrer ao fallback local:', err)
        return getLocalFallback()
      }
    },
  })
}

export function useCreateForm() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: {
      title: string
      url: string
      description?: string
      category: string
      status: FormStatus
    }) => {
      const now = new Date().toISOString()

      // Fetch active user info if available
      const { data: authData } = await supabase.auth.getUser()
      const user = authData?.user
      const userName =
        user?.user_metadata?.full_name ||
        user?.user_metadata?.name ||
        user?.email?.split('@')[0] ||
        'Utilizador'

      const record: Partial<AppForm> = {
        title: payload.title,
        url: payload.url,
        description: payload.description || null,
        category: payload.category,
        status: payload.status,
        created_by: user?.id || null,
        created_by_name: userName,
        created_at: now,
        updated_at: now,
        deleted_at: null,
      }

      try {
        const { data, error } = await (supabase as any)
          .from('forms')
          .insert([record])
          .select()
          .single()

        if (error) {
          if (
            error.code === '42P01' ||
            error.message?.includes('relation "forms" does not exist') ||
            error.message?.includes('schema cache')
          ) {
            console.warn('Tabela forms não encontrada. A guardar formulário no fallback local.')
            const localItem: AppForm = {
              ...(record as any),
              id: `local-form-${Date.now()}`,
            }
            const current = getLocalFallback()
            const updated = [localItem, ...current]
            saveLocalFallback(updated)
            return localItem
          }
          throw error
        }

        return data as AppForm
      } catch (err: any) {
        console.warn('Erro ao inserir no Supabase, a usar fallback local:', err)
        const localItem: AppForm = {
          ...(record as any),
          id: `local-form-${Date.now()}`,
        }
        const current = getLocalFallback()
        const updated = [localItem, ...current]
        saveLocalFallback(updated)
        return localItem
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [FORMS_QUERY_KEY] })
    },
  })
}

export function useUpdateForm() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      id,
      ...updates
    }: {
      id: string
      title?: string
      url?: string
      description?: string | null
      category?: string
      status?: FormStatus
    }) => {
      const now = new Date().toISOString()
      const payload = {
        ...updates,
        updated_at: now,
      }

      // Check if it's local fallback item
      if (id.startsWith('local-form-')) {
        const current = getLocalFallback()
        const next = current.map((f) => (f.id === id ? { ...f, ...payload } : f))
        saveLocalFallback(next)
        return next.find((f) => f.id === id)
      }

      try {
        const { data, error } = await (supabase as any)
          .from('forms')
          .update(payload)
          .eq('id', id)
          .select()
          .single()

        if (error) {
          // Fallback to local
          const current = getLocalFallback()
          const next = current.map((f) => (f.id === id ? { ...f, ...payload } : f))
          saveLocalFallback(next)
          return next.find((f) => f.id === id)
        }

        return data as AppForm
      } catch {
        const current = getLocalFallback()
        const next = current.map((f) => (f.id === id ? { ...f, ...payload } : f))
        saveLocalFallback(next)
        return next.find((f) => f.id === id)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [FORMS_QUERY_KEY] })
    },
  })
}

export function useDeleteForm() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const now = new Date().toISOString()

      if (id.startsWith('local-form-')) {
        const current = getLocalFallback()
        const next = current.filter((f) => f.id !== id)
        saveLocalFallback(next)
        return
      }

      try {
        // Soft delete
        const { error } = await (supabase as any)
          .from('forms')
          .update({ deleted_at: now })
          .eq('id', id)

        if (error) {
          // If fail, soft delete local
          const current = getLocalFallback()
          const next = current.filter((f) => f.id !== id)
          saveLocalFallback(next)
        }
      } catch {
        const current = getLocalFallback()
        const next = current.filter((f) => f.id !== id)
        saveLocalFallback(next)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [FORMS_QUERY_KEY] })
    },
  })
}
