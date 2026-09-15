import { useInventory, useUpdateItem } from '../api/use-inventory'
import { InventoryCard } from './inventory-card'
import type { InventoryItem, InventoryCategory } from '@/types/database'

interface InventoryListProps {
  category: InventoryCategory | 'all'
  onEditItem?: (item: InventoryItem) => void
}

export function InventoryList({ category, onEditItem }: InventoryListProps) {
  const { data: items, isLoading, error } = useInventory()
  const updateMutation = useUpdateItem()

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
    if (category === 'all') return true
    return item.category === category
  })

  const handleUpdateQuantity = async (item: InventoryItem, newQuantity: number) => {
    await updateMutation.mutateAsync({
      id: item.id,
      quantity: newQuantity,
    })
  }

  if (filteredItems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-warm-100">
          <svg className="h-8 w-8 text-secondary-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
        </div>
        <p className="mt-4 text-sm font-medium text-foreground">Inventário Vazio</p>
        <p className="mt-1 text-xs text-muted">Não existem itens nesta categoria.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3 py-4">
      {filteredItems.map((item) => (
        <InventoryCard 
          key={item.id} 
          item={item} 
          onEdit={onEditItem} 
          onUpdateQuantity={handleUpdateQuantity} 
        />
      ))}
    </div>
  )
}
