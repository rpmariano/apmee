import { useMemo } from 'react'
import { RotateCcw, Wallet } from 'lucide-react'
import { MovementCard } from './movement-card'
import { useEvents } from '@/features/events/api/use-events'
import type { FinancialMovement } from '@/types/database'

interface MovementListProps {
  movements?: FinancialMovement[]
  isLoading: boolean
  onEdit?: (movement: FinancialMovement) => void
  onClearFilters?: () => void
  isFiltered?: boolean
}

export function MovementList({
  movements = [],
  isLoading,
  onEdit,
  onClearFilters,
  isFiltered,
}: MovementListProps) {
  const { data: events } = useEvents()

  // Map event_id to event title
  const eventsById = useMemo(() => {
    const map: Record<string, string> = {}
    events?.forEach((e) => {
      map[e.id] = e.title
    })
    return map
  }, [events])

  if (isLoading) {
    return (
      <div className="flex flex-col gap-2 py-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-14 w-full animate-pulse rounded-[var(--radius-card)] bg-warm-100" />
        ))}
      </div>
    )
  }

  if (movements.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 text-center rounded-[var(--radius-card)] border border-dashed border-warm-200 bg-warm-50/50">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-warm-100">
          <Wallet className="h-6 w-6 text-secondary-400" />
        </div>
        <p className="mt-3 text-sm font-bold text-foreground">
          {isFiltered ? 'Nenhum movimento encontrado' : 'Sem Movimentos Registados'}
        </p>
        <p className="mt-1 text-xs text-secondary-500 max-w-[260px]">
          {isFiltered
            ? 'Não existem registos de tesouraria que correspondam aos filtros selecionados.'
            : 'Ainda não foram registadas receitas ou despesas nesta conta.'}
        </p>

        {isFiltered && onClearFilters && (
          <button
            type="button"
            onClick={onClearFilters}
            className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-warm-200 bg-surface px-3 py-1.5 text-xs font-semibold text-secondary-700 hover:bg-warm-100 transition-colors active:scale-95"
          >
            <RotateCcw className="h-3 w-3" />
            <span>Limpar Filtros</span>
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2 py-2">
      {movements.map((movement) => (
        <MovementCard
          key={movement.id}
          movement={movement}
          onEdit={onEdit}
          eventName={movement.event_id ? eventsById[movement.event_id] : undefined}
        />
      ))}
    </div>
  )
}
