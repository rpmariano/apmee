import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { FinancialMovement } from '@/types/database'
import { reconcileQuotasAndMovements } from '@/lib/quota-utils'

const TREASURY_QUERY_KEY = 'treasury'

export function useMovements() {
  return useQuery({
    queryKey: [TREASURY_QUERY_KEY],
    queryFn: async () => {
      // 1. Fetch active financial movements
      const { data, error } = await (supabase as any)
        .from('financial_movements')
        .select('*')
        .is('deleted_at', null)
        .order('date', { ascending: false })
        .order('created_at', { ascending: false })

      if (error) throw error

      // 2. Fetch quotas to reconcile against the Single Source of Truth
      let quotas: any[] = []
      try {
        const { data: qData, error: qErr } = await (supabase as any)
          .from('quotas')
          .select('*, contact:contacts(name)')
        if (!qErr && qData) {
          quotas = qData
        } else {
          // Fallback in case relation fails
          const { data: fallbackData } = await (supabase as any)
            .from('quotas')
            .select('*')
          if (fallbackData) quotas = fallbackData
        }
      } catch (qErr) {
        console.warn('Aviso ao carregar quotas para reconciliação:', qErr)
      }

      const raw = (data as FinancialMovement[]) || []

      // 3. Strict 1-to-1 reconciliation & purge of orphan/duplicate quota movements
      const { validMovements, idsToSoftDelete, quotaLinksToUpdate } = reconcileQuotasAndMovements(
        raw,
        quotas
      )

      // 4. Background cleanup: soft delete duplicate/orphan records in Supabase
      if (idsToSoftDelete.length > 0) {
        (supabase as any)
          .from('financial_movements')
          .update({ deleted_at: new Date().toISOString() })
          .in('id', idsToSoftDelete)
          .then(({ error: cleanErr }: any) => {
            if (cleanErr) {
              console.warn('Aviso ao purgar quotas duplicadas/órfãs na BD:', cleanErr)
            }
          })
      }

      // 5. Background repair: link quotas to their primary movement_id in Supabase
      if (quotaLinksToUpdate.length > 0) {
        for (const link of quotaLinksToUpdate) {
          (supabase as any)
            .from('quotas')
            .update({ movement_id: link.movementId })
            .eq('id', link.quotaId)
            .then(({ error: linkErr }: any) => {
              if (linkErr) {
                console.warn('Aviso ao sincronizar movement_id da quota:', linkErr)
              }
            })
        }
      }

      return validMovements
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
