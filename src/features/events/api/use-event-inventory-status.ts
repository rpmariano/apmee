import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { InventoryItem } from '@/types/database'

export interface EventInventoryRequirement {
  id: string
  event_id: string
  item_id: string
  quantity: number
  item: InventoryItem | null
}

export interface EventInventoryStatus {
  requirements: EventInventoryRequirement[]
  shortages: { requirement: EventInventoryRequirement; available: number }[]
  hasShortages: boolean
  isLoading: boolean
}

/**
 * Hook that fetches event inventory requirements and compares them
 * against current stock to detect shortages.
 */
export function useEventInventoryStatus(eventId: string | undefined): EventInventoryStatus {
  const { data: requirements, isLoading: loadingReqs } = useQuery({
    queryKey: ['event-inventory', eventId],
    queryFn: async () => {
      if (!eventId) return []
      const { data, error } = await (supabase as any)
        .from('event_inventory')
        .select('*, item:inventory_items(*)')
        .eq('event_id', eventId)
      if (error) throw error
      return (data || []) as EventInventoryRequirement[]
    },
    enabled: !!eventId,
  })

  const { data: inventory, isLoading: loadingInv } = useQuery({
    queryKey: ['inventory'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('inventory_items')
        .select('*')
        .is('deleted_at', null)
      if (error) throw error
      return (data || []) as InventoryItem[]
    },
  })

  const reqs = requirements || []
  const inv = inventory || []

  const shortages = reqs
    .map((req) => {
      const stockItem = inv.find((i) => i.id === req.item_id)
      const available = stockItem?.quantity ?? 0
      return { requirement: req, available }
    })
    .filter(({ requirement, available }) => requirement.quantity > available)

  return {
    requirements: reqs,
    shortages,
    hasShortages: shortages.length > 0,
    isLoading: loadingReqs || loadingInv,
  }
}
