import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { FinancialMovement } from '@/types/database'

const TREASURY_QUERY_KEY = 'treasury'

export function useMovements() {
  return useQuery({
    queryKey: [TREASURY_QUERY_KEY],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('financial_movements')
        .select('*')
        .is('deleted_at', null)
        .order('date', { ascending: false })

      if (error) throw error

      // Ensure every movement has a default account if not yet set in database
      const normalized = (data as any[]).map((m) => ({
        ...m,
        account: m.account || 'banco',
      }))

      return normalized as FinancialMovement[]
    },
  })
}

export function useCreateMovement() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (newMovement: any) => {
      const payload = {
        ...newMovement,
        account: newMovement.account || 'banco',
      }

      // Try inserting with account
      let { data, error } = await (supabase as any)
        .from('financial_movements')
        .insert(payload)
        .select()
        .single()

      // Resilience fallback: if account column does not exist yet in database
      if (error) {
        const errMsg = error.message || ''
        if (
          error.code === '42703' ||
          error.code === 'PGRST204' ||
          errMsg.includes('account') ||
          errMsg.includes('column')
        ) {
          const fallbackPayload = { ...payload }
          delete fallbackPayload.account
          const retry = await (supabase as any)
            .from('financial_movements')
            .insert(fallbackPayload)
            .select()
            .single()

          if (retry.error) throw retry.error
          data = { ...retry.data, account: payload.account || 'banco' }
          error = null
        } else {
          throw error
        }
      }

      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [TREASURY_QUERY_KEY] })
    },
  })
}

export function useUpdateMovement() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...updates }: any) => {
      const payload = { ...updates }

      let { data, error } = await (supabase as any)
        .from('financial_movements')
        .update(payload)
        .eq('id', id)
        .select()
        .single()

      // Resilience fallback: if account column does not exist yet in database
      if (error) {
        const errMsg = error.message || ''
        if (
          error.code === '42703' ||
          error.code === 'PGRST204' ||
          errMsg.includes('account') ||
          errMsg.includes('column')
        ) {
          const fallbackPayload = { ...payload }
          delete fallbackPayload.account
          const retry = await (supabase as any)
            .from('financial_movements')
            .update(fallbackPayload)
            .eq('id', id)
            .select()
            .single()

          if (retry.error) throw retry.error
          data = { ...retry.data, account: payload.account || 'banco' }
          error = null
        } else {
          throw error
        }
      }

      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [TREASURY_QUERY_KEY] })
    },
  })
}

export function useDeleteMovement() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any)
        .from('financial_movements')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id)

      if (error) throw error
      return id
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [TREASURY_QUERY_KEY] })
    },
  })
}
