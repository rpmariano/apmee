import { AlertTriangle, MapPin, Package, ArrowRightLeft, CalendarCheck } from 'lucide-react'
import type { InventoryItem } from '@/types/database'
import type { ItemCaptiveInfo } from '../api/use-captive-stock'
import { cn } from '@/lib/utils'

interface InventoryCardProps {
  item: InventoryItem
  onEdit?: (item: InventoryItem) => void
  onTransaction?: (item: InventoryItem) => void
  captiveInfo?: ItemCaptiveInfo
  eventRequirementQty?: number
}

const categoryLabels: Record<string, string> = {
  consumivel: 'Consumível',
  alimento: 'Alimento',
  mobilizado: 'Equipamento',
  equipamento: 'Equipamento',
}

export function InventoryCard({ item, onEdit, onTransaction, captiveInfo, eventRequirementQty }: InventoryCardProps) {
  const isLowStock = item.min_stock !== null && item.quantity <= item.min_stock
  const categoryLabel = categoryLabels[item.category] || item.category
  const isEquipment = item.category === 'mobilizado' || item.category === 'equipamento'
  const hasCaptive = !!(captiveInfo && captiveInfo.captiveQuantity > 0)

  return (
    <div className={cn(
      "flex flex-col gap-2 rounded-[var(--radius-card)] border border-warm-200 bg-surface p-4 shadow-sm transition-all hover:shadow-md",
      isLowStock && "border-orange-200 bg-orange-50/60",
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
          
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-bold text-foreground leading-tight">
                {item.name}
              </h3>
              {isLowStock && (
                <span className="flex items-center gap-1 rounded-full bg-orange-100 px-2 py-0.5 text-xs font-bold text-orange-700">
                  <AlertTriangle className="h-3 w-3" />
                  Stock Baixo
                </span>
              )}
              {eventRequirementQty !== undefined && (
                <span className="flex items-center gap-1 rounded-full bg-primary-100 px-2 py-0.5 text-xs font-bold text-primary-800 border border-primary-200">
                  <CalendarCheck className="h-3 w-3" />
                  No evento: {eventRequirementQty} {item.unit || 'un'}
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

      {/* Stock Metrics and Action Button */}
      <div className="mt-2 flex items-center justify-between border-t border-warm-200 pt-3">
        <div className="flex flex-col">
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-black text-foreground">
              {item.quantity}
            </span>
            <span className="text-sm font-medium text-muted">
              {item.unit || 'un'}
            </span>
            <span className="text-xs text-muted ml-1 font-normal">(total)</span>
          </div>

          {/* Captive Stock Badges */}
          {hasCaptive && captiveInfo && (
            <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs">
              <span className="rounded bg-amber-100 px-1.5 py-0.2 text-[11px] font-semibold text-amber-800 border border-amber-200">
                {isEquipment ? `Reservado: ${captiveInfo.captiveQuantity}` : `Cativo: ${captiveInfo.captiveQuantity}`}
              </span>
              <span className="rounded bg-emerald-50 px-1.5 py-0.2 text-[11px] font-bold text-emerald-800 border border-emerald-200">
                Disp.: {captiveInfo.availableQuantity}
              </span>
            </div>
          )}
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
