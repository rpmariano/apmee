import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Quota } from '@/types/database'

const QUOTAS_QUERY_KEY = 'quotas'

export function useQuotas() {
  return useQuery({
    queryKey: [QUOTAS_QUERY_KEY],
    queryFn: async () => {
      // Fetch quotas AND the related contact name + metadata (educando, turma)
      const { data, error } = await (supabase as any)
        .from('quotas')
        .select('*, contact:contacts(name, email, metadata)')
        .is('deleted_at', null)
        .order('year', { ascending: false })
        .order('created_at', { ascending: false })

      if (error) throw error
      return data as (Quota & { contact: { name: string; email: string | null; metadata?: Record<string, any> } })[]
    },
  })
}

export function useCreateQuota() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (newQuota: any) => {
      const { data, error } = await (supabase as any)
        .from('quotas')
        .insert(newQuota)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUOTAS_QUERY_KEY] })
    },
  })
}

export function useUpdateQuota() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...updates }: any) => {
      const { data, error } = await (supabase as any)
        .from('quotas')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUOTAS_QUERY_KEY] })
    },
  })
}

export function useDeleteQuota() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      // 1. Attempt soft delete
      const { error: softError } = await (supabase as any)
        .from('quotas')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id)

      if (softError) {
        console.warn('Soft delete failed on quotas, attempting hard delete fallback:', softError)
        // 2. Fallback to hard delete if soft delete errors
        const { error: hardError } = await (supabase as any)
          .from('quotas')
          .delete()
          .eq('id', id)

        if (hardError) {
          throw softError || hardError
        }
      }
      return id
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUOTAS_QUERY_KEY] })
      queryClient.invalidateQueries({ queryKey: ['treasury'] })
      queryClient.invalidateQueries({ queryKey: ['contacts'] })
    },
  })
}
