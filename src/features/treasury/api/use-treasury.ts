import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { FinancialMovement } from '@/types/database'
import { getQuotaDeduplicationKey } from '@/lib/quota-utils'

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
        .order('created_at', { ascending: false })

      if (error) throw error

      const raw = (data as any[]) || []
      const seenQuotaKeys = new Set<string>()
      const duplicateIdsToSoftDelete: string[] = []
      const normalized: FinancialMovement[] = []

      for (const m of raw) {
        const item: FinancialMovement = {
          ...m,
          account: m.account || 'banco',
        }

        if (m.category === 'Quotas de Sócios') {
          const deduplicationKey = getQuotaDeduplicationKey(m.description)
          if (deduplicationKey) {
            if (seenQuotaKeys.has(deduplicationKey)) {
              // Duplicate quota detected!
              duplicateIdsToSoftDelete.push(m.id)
              continue
            }
            seenQuotaKeys.add(deduplicationKey)
          }
        }

        normalized.push(item)
      }

      // Background cleanup: soft delete duplicate records in Supabase so database remains clean
      if (duplicateIdsToSoftDelete.length > 0) {
        (supabase as any)
          .from('financial_movements')
          .update({ deleted_at: new Date().toISOString() })
          .in('id', duplicateIdsToSoftDelete)
          .then(({ error: cleanErr }: any) => {
            if (cleanErr) {
              console.warn('Aviso ao limpar quotas duplicadas na BD:', cleanErr)
            }
          })
      }

      return normalized
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

      const { data, error } = await (supabase as any)
        .from('financial_movements')
        .insert(payload)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [TREASURY_QUERY_KEY] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
    },
  })
}

export function useUpdateMovement() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...updates }: any) => {
      const payload = { ...updates }

      const { data, error } = await (supabase as any)
        .from('financial_movements')
        .update(payload)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [TREASURY_QUERY_KEY] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
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
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
    },
  })
}
