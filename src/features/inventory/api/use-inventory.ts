import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { InventoryItem } from '@/types/database'

const INVENTORY_QUERY_KEY = 'inventory'

export function useInventory() {
  return useQuery({
    queryKey: [INVENTORY_QUERY_KEY],
    queryFn: async () => {
      const { data, error } = await (supabase as any).from('inventory_items')
        .select('*')
        .is('deleted_at', null)
        .order('name', { ascending: true })

      if (error) throw error
      return data as InventoryItem[]
    },
  })
}

export function useCreateItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (newItem: any) => {
      const { data, error } = await (supabase as any).from('inventory_items')
        .insert(newItem)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [INVENTORY_QUERY_KEY] })
    },
  })
}

export function useUpdateItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...updates }: any) => {
      const { data, error } = await (supabase as any).from('inventory_items')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [INVENTORY_QUERY_KEY] })
    },
  })
}

export function useDeleteItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const updates: any = { deleted_at: new Date().toISOString() }
      const { error } = await (supabase as any).from('inventory_items')
        .update(updates)
        .eq('id', id)

      if (error) throw error
      return id
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [INVENTORY_QUERY_KEY] })
    },
  })
}
