import { useInventory } from '../api/use-inventory'
import { InventoryCard } from './inventory-card'
import type { InventoryItem, InventoryCategory } from '@/types/database'

interface InventoryListProps {
  filter: InventoryCategory | 'all'
  onEditItem?: (item: InventoryItem) => void
  onTransaction?: (item: InventoryItem) => void
}

export function InventoryList({ filter, onEditItem, onTransaction }: InventoryListProps) {
  const { data: items, isLoading, error } = useInventory()

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
    if (filter === 'all') return true
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
          <svg className="h-8 w-8 text-secondary-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
        </div>
        <p className="mt-4 text-sm font-medium text-foreground">Sem itens</p>
        <p className="mt-1 text-xs text-muted">Ainda não existem itens nesta categoria.</p>
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
        />
      ))}
    </div>
  )
}
