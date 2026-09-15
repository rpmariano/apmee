import { MoreVertical, Minus, Plus, AlertTriangle, MapPin, Package } from 'lucide-react'
import type { InventoryItem, InventoryCategory } from '@/types/database'
import { cn } from '@/lib/utils'

interface InventoryCardProps {
  item: InventoryItem
  onEdit?: (item: InventoryItem) => void
  onUpdateQuantity?: (item: InventoryItem, newQuantity: number) => void
}

const categoryLabels: Record<InventoryCategory, string> = {
  duravel: 'Durável',
  consumivel: 'Consumível',
}

export function InventoryCard({ item, onEdit, onUpdateQuantity }: InventoryCardProps) {
  const isLowStock = item.min_stock !== null && item.quantity <= item.min_stock
  const categoryLabel = categoryLabels[item.category] || item.category

  const handleDecrement = () => {
    if (item.quantity > 0 && onUpdateQuantity) {
      onUpdateQuantity(item, item.quantity - 1)
    }
  }

  const handleIncrement = () => {
    if (onUpdateQuantity) {
      onUpdateQuantity(item, item.quantity + 1)
    }
  }

  return (
    <div className={cn(
      "flex flex-col gap-3 rounded-[var(--radius-card)] border bg-surface p-4 shadow-sm transition-all hover:shadow-md",
      isLowStock ? "border-red-200 bg-red-50/30" : "border-warm-200"
    )}>
      <div className="flex items-start justify-between">
        
        {/* Item Info */}
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-warm-100 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-secondary-600">
              {categoryLabel}
            </span>
            {isLowStock && (
              <span className="flex items-center gap-1 rounded-md bg-red-100 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-red-700">
                <AlertTriangle className="h-3 w-3" />
                Stock Baixo
              </span>
            )}
          </div>
          
          <h3 className="mt-2 font-bold text-foreground leading-tight">{item.name}</h3>
          
          {/* Location & Unit */}
          <div className="mt-2 flex flex-col gap-1 text-sm text-secondary-600">
            {item.location && (
              <div className="flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 opacity-70" />
                <span>{item.location}</span>
              </div>
            )}
            {item.unit && (
              <div className="flex items-center gap-1.5">
                <Package className="h-3.5 w-3.5 opacity-70" />
                <span>Unidade: {item.unit}</span>
              </div>
            )}
          </div>
        </div>

        {/* Options */}
        {onEdit && (
          <button
            onClick={() => onEdit(item)}
            className="ml-2 rounded-full p-2 text-muted transition-colors hover:bg-warm-100 hover:text-foreground"
          >
            <MoreVertical className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Quick Quantity Actions */}
      <div className="mt-2 flex items-center justify-between border-t border-warm-100 pt-3">
        <div className="flex flex-col">
          <span className="text-xs text-muted">Quantidade</span>
          <span className="text-xl font-black text-foreground">
            {item.quantity} <span className="text-sm font-normal text-secondary-500">{item.unit || 'un'}</span>
          </span>
        </div>

        {onUpdateQuantity && (
          <div className="flex items-center gap-1 rounded-[var(--radius-button)] bg-warm-100 p-1">
            <button
              onClick={handleDecrement}
              disabled={item.quantity <= 0}
              className="flex h-10 w-10 items-center justify-center rounded-md bg-surface text-secondary-700 shadow-sm transition-transform active:scale-95 disabled:opacity-50"
            >
              <Minus className="h-5 w-5" />
            </button>
            <div className="w-4 text-center text-xs font-bold text-muted"></div>
            <button
              onClick={handleIncrement}
              className="flex h-10 w-10 items-center justify-center rounded-md bg-surface text-secondary-700 shadow-sm transition-transform active:scale-95"
            >
              <Plus className="h-5 w-5" />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
