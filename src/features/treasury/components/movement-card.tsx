import {
  ArrowDownRight,
  ArrowUpRight,
  Landmark,
  Coins,
} from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { pt } from 'date-fns/locale'
import type { FinancialMovement } from '@/types/database'
import { cn } from '@/lib/utils'

interface MovementCardProps {
  movement: FinancialMovement
  onEdit?: (movement: FinancialMovement) => void
  eventName?: string
}

export function MovementCard({ movement, onEdit, eventName }: MovementCardProps) {
  const isIncome = movement.type === 'income'
  const isBanco = (movement.account || 'banco') === 'banco'

  const parsedDate = parseISO(movement.date)
  const compactDate = format(parsedDate, "d 'de' MMM", { locale: pt })

  // If there is an associated event, display the event's name in place of generic category;
  // otherwise fallback to category
  const eventOrCategory = eventName || movement.category

  const handleClick = () => {
    if (onEdit) {
      onEdit(movement)
    }
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          handleClick()
        }
      }}
      aria-label={`Ver detalhes de ${movement.description}`}
      className={cn(
        'group flex items-center justify-between gap-3 p-3 rounded-[var(--radius-card)] border bg-surface transition-all duration-150 outline-none',
        'border-warm-200 shadow-xs hover:border-warm-300 hover:shadow-sm focus-visible:ring-2 focus-visible:ring-primary-400',
        onEdit && 'cursor-pointer active:scale-[0.99] hover:bg-warm-50/70'
      )}
    >
      {/* Left: Icon & Core Details */}
      <div className="flex items-center gap-2.5 min-w-0 flex-1">
        <div
          className={cn(
            'flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-transform',
            isIncome ? 'bg-green-100 text-green-700' : 'bg-red-50 text-red-600'
          )}
        >
          {isIncome ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
        </div>

        <div className="flex flex-col min-w-0 flex-1">
          <span className="truncate text-sm font-semibold text-foreground leading-tight">
            {movement.description}
          </span>

          <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-secondary-500">
            <span>{compactDate}</span>
            <span>•</span>
            {isBanco ? (
              <span className="inline-flex items-center gap-1 rounded bg-blue-50 px-1.5 py-0.2 text-xs font-semibold text-blue-700 border border-blue-200/80">
                <Landmark className="h-2.5 w-2.5" />
                Banco
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded bg-amber-50 px-1.5 py-0.2 text-xs font-semibold text-amber-700 border border-amber-200/80">
                <Coins className="h-2.5 w-2.5" />
                Caixa
              </span>
            )}

            {eventOrCategory && (
              <span className={cn(
                "truncate max-w-[180px] text-xs font-medium",
                eventName ? "text-primary-700 font-semibold" : "text-secondary-500"
              )}>
                • {eventOrCategory}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Right: Amount */}
      <div
        className={cn(
          'text-right font-black text-sm min-[380px]:text-base tracking-tight shrink-0',
          isIncome ? 'text-green-600' : 'text-foreground'
        )}
      >
        {isIncome ? '+' : '-'}
        {Number(movement.amount).toLocaleString('pt-PT', {
          style: 'currency',
          currency: 'EUR',
        })}
      </div>
    </div>
  )
}
