import { useMemo } from 'react'
import { PackageOpen } from 'lucide-react'
import { useInventory } from '../api/use-inventory'
import { InventoryCard } from './inventory-card'
import { useCaptiveStock } from '../api/use-captive-stock'
import { useEventInventoryStatus } from '@/features/events/api/use-event-inventory-status'
import type { InventoryItem, InventoryCategory } from '@/types/database'

interface InventoryListProps {
  filter: InventoryCategory | 'all'
  eventFilter?: string | 'all'
  onEditItem?: (item: InventoryItem) => void
  onTransaction?: (item: InventoryItem) => void
}

export function InventoryList({ filter, eventFilter = 'all', onEditItem, onTransaction }: InventoryListProps) {
  const { data: items, isLoading: isInvLoading, error } = useInventory()
  const { data: captiveMap, isLoading: isCaptiveLoading } = useCaptiveStock()

  const isSpecificEvent = eventFilter && eventFilter !== 'all'
  const { requirements, isLoading: isEventReqsLoading } = useEventInventoryStatus(isSpecificEvent ? eventFilter : undefined)

  const eventReqsMap = useMemo(() => {
    const map = new Map<string, number>()
    if (requirements) {
      requirements.forEach((req) => {
        map.set(req.item_id, req.quantity)
      })
    }
    return map
  }, [requirements])

  const isLoading = isInvLoading || isCaptiveLoading || (isSpecificEvent && isEventReqsLoading)

  if (isLoading) {
    return (
      <div className="flex flex-col gap-3 py-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-32 w-full animate-pulse rounded-[var(--radius-card)] bg-warm-100" />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="py-8 text-center text-sm text-red-500">
        Ocorreu um erro ao carregar o inventário.
      </div>
    )
  }

  const filteredItems = (items || []).filter((item) => {
    // 1. Event filter: if active, item must be part of that event's requirements
    if (isSpecificEvent && !eventReqsMap.has(item.id)) {
      return false
    }

    // 2. Category tab filter
    if (filter === 'all') return true
    if (filter === 'mobilizado' || (filter as any) === 'equipamento') {
      return item.category === 'mobilizado' || (item.category as any) === 'equipamento'
    }
    return item.category === filter
  })

  // Sort: Low stock items first, then alphabetical
  const sortedItems = [...filteredItems].sort((a, b) => {
    const aLowStock = a.min_stock !== null && a.quantity <= a.min_stock
    const bLowStock = b.min_stock !== null && b.quantity <= b.min_stock
    
    if (aLowStock && !bLowStock) return -1
    if (!aLowStock && bLowStock) return 1
    
    return a.name.localeCompare(b.name)
  })

  if (sortedItems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-warm-100">
          <PackageOpen className="h-8 w-8 text-secondary-400" />
        </div>
        <p className="mt-4 text-sm font-medium text-foreground">Sem itens</p>
        <p className="mt-1 text-xs text-muted">
          {isSpecificEvent
            ? 'Não existem artigos de inventário associados a este evento.'
            : 'Ainda não existem itens nesta categoria.'}
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3 py-4">
      {sortedItems.map((item) => (
        <InventoryCard 
          key={item.id} 
          item={item} 
          onEdit={onEditItem}
          onTransaction={onTransaction}
          captiveInfo={captiveMap?.get(item.id)}
          eventRequirementQty={isSpecificEvent ? eventReqsMap.get(item.id) : undefined}
        />
      ))}
    </div>
  )
}
