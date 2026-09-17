import {   AlertTriangle, MapPin, Package, ArrowRightLeft } from 'lucide-react'
import type { InventoryItem, InventoryCategory } from '@/types/database'
import { cn } from '@/lib/utils'

interface InventoryCardProps {
  item: InventoryItem
  onEdit?: (item: InventoryItem) => void
  onTransaction?: (item: InventoryItem) => void
}

const categoryLabels: Record<InventoryCategory, string> = {
  consumivel: 'Consumível',
  alimento: 'Alimento',
  mobilizado: 'Mobilizado',
}

export function InventoryCard({ item, onEdit, onTransaction }: InventoryCardProps) {
  const isLowStock = item.min_stock !== null && item.quantity <= item.min_stock
  const categoryLabel = categoryLabels[item.category] || item.category

  return (
    <div className={cn(
      "flex flex-col gap-2 rounded-[var(--radius-card)] border border-warm-200 bg-surface p-4 shadow-sm transition-all hover:shadow-md",
      isLowStock && "border-orange-200 bg-orange-50",
      onEdit && "cursor-pointer active:scale-[0.98]"
    )}
    onClick={() => onEdit && onEdit(item)}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-1 items-start gap-3">
          <div className={cn(
            "mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-button)]",
            isLowStock ? "bg-orange-100 text-orange-600" : "bg-warm-100 text-secondary-600"
          )}>
            <Package className="h-5 w-5" />
          </div>
          
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-foreground leading-tight">
                {item.name}
              </h3>
              {isLowStock && (
                <span className="flex items-center gap-1 rounded-full bg-orange-100 px-2 py-0.5 text-xs font-bold text-orange-700">
                  <AlertTriangle className="h-3 w-3" />
                  Stock Baixo
                </span>
              )}
            </div>
            
            <p className="mt-0.5 text-xs text-secondary-600 font-medium">
              {categoryLabel}
            </p>

            {item.location && (
              <p className="mt-1 flex items-center gap-1 text-xs text-muted">
                <MapPin className="h-3 w-3" />
                {item.location}
              </p>
            )}

            {item.notes && (
              <p className="mt-1 line-clamp-2 text-xs text-muted">{item.notes}</p>
            )}
          </div>
        </div>

        
      </div>

      <div className="mt-2 flex items-center justify-between border-t border-warm-200 pt-3">
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-black text-foreground">
            {item.quantity}
          </span>
          <span className="text-sm font-medium text-muted">
            {item.unit}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {onTransaction && (
            <button
              onClick={(e) => { e.stopPropagation(); onTransaction(item); }}
              className="flex items-center justify-center gap-1.5 rounded-[var(--radius-button)] border border-primary-200 bg-primary-50 px-3 py-1.5 text-xs font-bold text-primary-700 transition-colors hover:bg-primary-100 active:scale-95"
            >
              <ArrowRightLeft className="h-3.5 w-3.5" />
              Movimentar
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
