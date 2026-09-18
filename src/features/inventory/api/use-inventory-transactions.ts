import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { InventoryTransaction } from '@/types/database'

export function useInventoryTransactions(itemId?: string) {
  return useQuery({
    queryKey: ['inventory-transactions', itemId],
    queryFn: async () => {
      let query = supabase
        .from('inventory_transactions')
        .select('*, event:events(title), item:inventory_items(name)')
        .order('created_at', { ascending: false })

      if (itemId) {
        query = query.eq('item_id', itemId)
      }

      const { data, error } = await query
      if (error) throw error
      return data as (InventoryTransaction & { event?: { title: string }, item?: { name: string } })[]
    }
  })
}

export function useCreateInventoryTransaction() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (transaction: Omit<InventoryTransaction, 'id' | 'created_at' | 'created_by'>) => {
      // 1. Insert transaction record
      const { data, error } = await supabase
        .from('inventory_transactions')
        .insert(transaction as any)
        .select()
        .single()

      if (error) throw error

      // 2. Update stock quantity in inventory_items
      const { data: itemData, error: itemError } = await (supabase as any)
        .from('inventory_items')
        .select('quantity')
        .eq('id', transaction.item_id)
        .single()

      if (!itemError && itemData) {
        const currentQty = itemData.quantity || 0
        const delta = transaction.type === 'in' ? transaction.quantity : -transaction.quantity
        const newQty = Math.max(0, currentQty + delta)

        await (supabase as any)
          .from('inventory_items')
          .update({ quantity: newQty })
          .eq('id', transaction.item_id)
      }

      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-transactions'] })
      queryClient.invalidateQueries({ queryKey: ['inventory'] })
      queryClient.invalidateQueries({ queryKey: ['inventory-alerts'] })
    }
  })
}
