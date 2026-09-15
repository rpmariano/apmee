import { ArrowDownRight, ArrowUpRight, Calendar, ExternalLink } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { pt } from 'date-fns/locale'
import type { FinancialMovement } from '@/types/database'
import { cn } from '@/lib/utils'

interface MovementCardProps {
  movement: FinancialMovement
  onEdit?: (movement: FinancialMovement) => void
}

export function MovementCard({ movement, onEdit }: MovementCardProps) {
  const isIncome = movement.type === 'income'
  
  return (
    <div 
      className={cn(
        "flex flex-col gap-2 rounded-[var(--radius-card)] border bg-surface p-4 shadow-sm transition-all",
        onEdit && "cursor-pointer hover:shadow-md"
      )}
      onClick={() => onEdit && onEdit(movement)}
    >
      <div className="flex items-start justify-between gap-4">
        
        {/* Icon & Details */}
        <div className="flex items-start gap-3">
          <div className={cn(
            "mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
            isIncome ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
          )}>
            {isIncome ? <ArrowUpRight className="h-5 w-5" /> : <ArrowDownRight className="h-5 w-5" />}
          </div>
          
          <div className="flex flex-col">
            <span className="font-bold text-foreground leading-tight">{movement.description}</span>
            {movement.category && (
              <span className="mt-0.5 text-xs font-medium text-secondary-500 uppercase tracking-wide">
                {movement.category}
              </span>
            )}
            
            <div className="mt-2 flex items-center gap-1.5 text-xs text-secondary-600">
              <Calendar className="h-3.5 w-3.5 opacity-70" />
              <span>
                {format(parseISO(movement.date), "d 'de' MMMM, yyyy", { locale: pt })}
              </span>
            </div>
          </div>
        </div>

        {/* Amount */}
        <div className={cn(
          "shrink-0 font-black text-lg",
          isIncome ? "text-green-600" : "text-foreground"
        )}>
          {isIncome ? '+' : '-'}
          {Number(movement.amount).toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' })}
        </div>

      </div>

      {movement.receipt_url && (
        <div className="mt-2 flex border-t border-warm-100 pt-3">
          <a
            href={movement.receipt_url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-1.5 text-xs font-medium text-primary-500 hover:text-primary-600"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Ver Comprovativo
          </a>
        </div>
      )}
    </div>
  )
}
