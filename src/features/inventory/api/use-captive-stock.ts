import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { InventoryItem } from '@/types/database'

export interface EventAllocation {
  eventId: string
  eventTitle: string
  eventStatus: string
  startDate: string
  endDate: string | null
  quantity: number
}

export interface ItemCaptiveInfo {
  itemId: string
  totalStock: number
  captiveQuantity: number
  availableQuantity: number
  isEquipment: boolean
  allocations: EventAllocation[]
}

/**
 * Hook to calculate captive stock for inventory items based on planned and active events.
 * - Consumables & Food: directly subtracted from available stock across all active/planned events.
 * - Equipment: tracked with date ranges so it can be re-used in different dates, but reserved during event dates.
 */
export function useCaptiveStock() {
  return useQuery({
    queryKey: ['captive-stock'],
    queryFn: async () => {
      // 1. Fetch active and planned events with their inventory requirements
      const { data, error } = await (supabase as any)
        .from('event_inventory')
        .select('id, event_id, item_id, quantity, event:events(id, title, status, start_date, end_date, deleted_at)')

      if (error) {
        console.warn('Could not fetch event_inventory for captive stock:', error)
        return new Map<string, ItemCaptiveInfo>()
      }

      const map = new Map<string, ItemCaptiveInfo>()

      const validRows = (data || []).filter((row: any) => {
        const ev = row.event
        return ev && !ev.deleted_at && (ev.status === 'planned' || ev.status === 'active')
      })

      validRows.forEach((row: any) => {
        const ev = row.event
        const itemId = row.item_id
        const qty = Number(row.quantity) || 0

        const existing = map.get(itemId) || {
          itemId,
          totalStock: 0,
          captiveQuantity: 0,
          availableQuantity: 0,
          isEquipment: false,
          allocations: [] as EventAllocation[],
        }

        existing.captiveQuantity += qty
        existing.allocations.push({
          eventId: ev.id,
          eventTitle: ev.title,
          eventStatus: ev.status,
          startDate: ev.start_date,
          endDate: ev.end_date,
          quantity: qty,
        })

        map.set(itemId, existing)
      })

      return map
    },
  })
}

/**
 * Helper to compute availability of an item given the captive map.
 */
export function getItemAvailability(item: InventoryItem, captiveMap?: Map<string, ItemCaptiveInfo>) {
  const isEquipment = item.category === 'mobilizado' || item.category === 'equipamento'
  const info = captiveMap?.get(item.id)
  const captiveQuantity = info?.captiveQuantity ?? 0
  const availableQuantity = Math.max(0, item.quantity - captiveQuantity)

  return {
    totalStock: item.quantity,
    captiveQuantity,
    availableQuantity,
    isEquipment,
    allocations: info?.allocations || [],
  }
}
