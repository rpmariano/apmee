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

export interface InventoryPurchaseItem {
  name: string
  category: 'consumivel' | 'alimento' | 'mobilizado'
  quantity: number
  unit?: string
}

export interface ProcessInventoryPurchasesParams {
  items: InventoryPurchaseItem[]
  eventId?: string | null
  description?: string
  queryClient: any
}

/**
 * Automates inventory stock entry, transaction history, and event allocation
 * when one or more inventory items are purchased through an expense.
 */
export async function processInventoryPurchases({
  items,
  eventId,
  description,
  queryClient,
}: ProcessInventoryPurchasesParams) {
  if (!items || items.length === 0) return

  // 1. Fetch current active inventory items
  const { data: existingItems } = await (supabase as any)
    .from('inventory_items')
    .select('*')
    .is('deleted_at', null)

  const itemsList = [...(existingItems || [])]

  for (const item of items) {
    if (!item.name || !item.name.trim() || item.quantity <= 0) continue

    const trimmedName = item.name.trim()
    const existing = itemsList.find(
      (i: any) => i.name.toLowerCase() === trimmedName.toLowerCase()
    )

    let finalItemId = existing?.id

    if (existing) {
      const updatedQty = (existing.quantity || 0) + item.quantity
      await (supabase as any)
        .from('inventory_items')
        .update({ quantity: updatedQty })
        .eq('id', existing.id)

      existing.quantity = updatedQty
    } else {
      const { data: createdItem, error: createItemErr } = await (supabase as any)
        .from('inventory_items')
        .insert({
          name: trimmedName,
          category: item.category,
          quantity: item.quantity,
          unit: item.unit || 'un',
          min_stock: 0,
        })
        .select()
        .single()

      if (!createItemErr && createdItem) {
        finalItemId = createdItem.id
        itemsList.push(createdItem)
      }
    }

    if (finalItemId) {
      // 2. Insert transaction in inventory_transactions
      await (supabase as any)
        .from('inventory_transactions')
        .insert({
          item_id: finalItemId,
          type: 'in',
          quantity: item.quantity,
          event_id: eventId || null,
          notes: `Compra via Tesouraria: ${description || 'Despesa'}`,
        })

      // 3. If linked to an event, allocate items to event_inventory
      if (eventId) {
        const { data: existingEventItem } = await (supabase as any)
          .from('event_inventory')
          .select('*')
          .eq('event_id', eventId)
          .eq('item_id', finalItemId)
          .maybeSingle()

        if (existingEventItem) {
          await (supabase as any)
            .from('event_inventory')
            .update({ quantity: existingEventItem.quantity + item.quantity })
            .eq('id', existingEventItem.id)
        } else {
          await (supabase as any)
            .from('event_inventory')
            .insert({
              event_id: eventId,
              item_id: finalItemId,
              quantity: item.quantity,
            })
        }
      }
    }
  }

  // 4. Invalidate related caches
  queryClient.invalidateQueries({ queryKey: ['inventory'] })
  queryClient.invalidateQueries({ queryKey: ['inventory-transactions'] })
  queryClient.invalidateQueries({ queryKey: ['captive-stock'] })
  if (eventId) {
    queryClient.invalidateQueries({ queryKey: ['event-inventory', eventId] })
    queryClient.invalidateQueries({ queryKey: ['event-inventory'] })
  }
}

