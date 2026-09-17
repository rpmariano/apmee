import { useState } from 'react'
import {
  ArrowDownRight,
  ArrowUpRight,
  ChevronDown,
  ExternalLink,
  Edit2,
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
  const [isExpanded, setIsExpanded] = useState(false)
  const isIncome = movement.type === 'income'
  const isBanco = (movement.account || 'banco') === 'banco'

  const parsedDate = parseISO(movement.date)
  const compactDate = format(parsedDate, "d 'de' MMM", { locale: pt })
  const fullDate = format(parsedDate, "EEEE, d 'de' MMMM 'de' yyyy", { locale: pt })

  const toggleExpand = (e: React.MouseEvent) => {
    // If clicking directly on an anchor or button inside, do not toggle
    const target = e.target as HTMLElement
    if (target.closest('a') || target.closest('button')) return
    setIsExpanded((prev) => !prev)
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={toggleExpand}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          setIsExpanded((prev) => !prev)
        }
      }}
      aria-expanded={isExpanded}
      className={cn(
        'group flex flex-col rounded-[var(--radius-card)] border bg-surface transition-all duration-200 outline-none',
        'border-warm-200 shadow-xs hover:border-warm-300 hover:shadow-sm focus-visible:ring-2 focus-visible:ring-primary-400',
        isExpanded && 'border-primary-300 shadow-sm bg-warm-50/50'
      )}
    >
      {/* Compact Main Row (Collapsed by default) */}
      <div className="flex items-center justify-between gap-3 p-3 cursor-pointer">
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

              {movement.category && (
                <span className="hidden min-[380px]:inline-block truncate max-w-[120px] text-xs text-secondary-500">
                  • {movement.category}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right: Amount & Chevron */}
        <div className="flex items-center gap-2 shrink-0">
          <div
            className={cn(
              'text-right font-black text-sm min-[380px]:text-base tracking-tight',
              isIncome ? 'text-green-600' : 'text-foreground'
            )}
          >
            {isIncome ? '+' : '-'}
            {Number(movement.amount).toLocaleString('pt-PT', {
              style: 'currency',
              currency: 'EUR',
            })}
          </div>

          <ChevronDown
            className={cn(
              'h-4 w-4 text-secondary-400 transition-transform duration-200',
              isExpanded && 'rotate-180 text-primary-600'
            )}
          />
        </div>
      </div>

      {/* Expanded Accordion Details */}
      {isExpanded && (
        <div className="border-t border-warm-200/80 bg-warm-50/80 p-3 pt-2.5 text-xs animate-in fade-in slide-in-from-top-1 duration-150">
          <div className="grid grid-cols-1 gap-2 min-[380px]:grid-cols-2">
            <div className="flex flex-col gap-0.5">
              <span className="text-secondary-400 font-medium">Data Completa:</span>
              <span className="font-semibold text-foreground capitalize">{fullDate}</span>
            </div>

            <div className="flex flex-col gap-0.5">
              <span className="text-secondary-400 font-medium">Conta / Meio:</span>
              <span className="font-semibold text-foreground">
                {isBanco ? 'Conta Bancária (Banco)' : 'Dinheiro Físico em Caixa (Numerário)'}
              </span>
            </div>

            {movement.category && (
              <div className="flex flex-col gap-0.5">
                <span className="text-secondary-400 font-medium">Categoria:</span>
                <span className="font-semibold text-foreground">{movement.category}</span>
              </div>
            )}

            {(eventName || movement.event_id) && (
              <div className="flex flex-col gap-0.5">
                <span className="text-secondary-400 font-medium">Evento Associado:</span>
                <span className="font-semibold text-primary-700">
                  {eventName || 'Evento Vinculado'}
                </span>
              </div>
            )}
          </div>

          {/* Action Row */}
          <div className="mt-3 flex items-center justify-between border-t border-warm-200 pt-2.5">
            {movement.receipt_url ? (
              <a
                href={movement.receipt_url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center gap-1.5 rounded-full bg-surface border border-warm-200 px-2.5 py-1 text-xs font-semibold text-primary-600 hover:bg-warm-100 transition-colors"
              >
                <ExternalLink className="h-3 w-3" />
                <span>Ver Comprovativo</span>
              </a>
            ) : (
              <span className="text-muted italic">Sem comprovativo anexado</span>
            )}

            {onEdit && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  onEdit(movement)
                }}
                className="inline-flex items-center gap-1.5 rounded-full bg-secondary-900 px-3 py-1 text-xs font-semibold text-white hover:bg-secondary-800 transition-colors active:scale-95"
              >
                <Edit2 className="h-3 w-3" />
                <span>Editar</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
