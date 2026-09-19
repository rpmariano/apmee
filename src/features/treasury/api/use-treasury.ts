import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { FinancialMovement } from '@/types/database'
import { getQuotaDeduplicationKey, isMovementMatchingQuota } from '@/lib/quota-utils'

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

      // 2. Fetch active quotas to reconcile against the Single Source of Truth
      let activeQuotas: any[] = []
      try {
        const { data: qData } = await (supabase as any)
          .from('quotas')
          .select('id, contact_id, year, paid, movement_id, contact:contacts(name)')
          .is('deleted_at', null)
        if (qData) activeQuotas = qData
      } catch (qErr) {
        console.warn('Aviso ao carregar quotas para reconciliação:', qErr)
      }

      const raw = (data as any[]) || []
      const seenQuotaKeys = new Set<string>()
      const duplicateIdsToSoftDelete: string[] = []
      const normalized: FinancialMovement[] = []

      // Identify unpaid quotas to purge their movements
      const unpaidMovementIds = new Set<string>()
      const unpaidQuotas = activeQuotas.filter((q) => !q.paid)
      for (const uq of unpaidQuotas) {
        if (uq.movement_id) unpaidMovementIds.add(uq.movement_id)
      }

      for (const m of raw) {
        const item: FinancialMovement = {
          ...m,
          account: m.account || 'banco',
        }

        if (m.category === 'Quotas de Sócios') {
          // A. If this movement is explicitly linked to an unpaid quota, soft delete & discard!
          if (unpaidMovementIds.has(m.id)) {
            duplicateIdsToSoftDelete.push(m.id)
            continue
          }

          // B. If this movement matches an unpaid quota by name/year and has no paid quota matching, discard!
          if (activeQuotas.length > 0) {
            const matchesUnpaid = unpaidQuotas.some((uq) =>
              isMovementMatchingQuota(m, null, uq.contact?.name || '', uq.year)
            )
            if (matchesUnpaid) {
              const matchesAnyPaid = activeQuotas.some(
                (pq) => pq.paid && isMovementMatchingQuota(m, pq.movement_id, pq.contact?.name || '', pq.year)
              )
              if (!matchesAnyPaid) {
                duplicateIdsToSoftDelete.push(m.id)
                continue
              }
            }
          }

          // C. Enhanced deduplication key (handles diacritics, middle names, school years)
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

      // Background cleanup: soft delete duplicate/orphan records in Supabase so database remains clean
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
