import { MovementCard } from './movement-card'
import type { FinancialMovement, FinancialType } from '@/types/database'

interface MovementListProps {
  movements?: FinancialMovement[]
  filter: FinancialType | 'all'
  isLoading: boolean
  onEdit?: (movement: FinancialMovement) => void
}

export function MovementList({ movements, filter, isLoading, onEdit }: MovementListProps) {
  if (isLoading) {
    return (
      <div className="flex flex-col gap-3 py-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 w-full animate-pulse rounded-[var(--radius-card)] bg-warm-100" />
        ))}
      </div>
    )
  }

  const filteredMovements = (movements || []).filter((m) => {
    if (filter === 'all') return true
    return m.type === filter
  })

  if (filteredMovements.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-warm-100">
          <svg className="h-8 w-8 text-secondary-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <p className="mt-4 text-sm font-medium text-foreground">Sem Movimentos</p>
        <p className="mt-1 text-xs text-muted">Não existem transações registadas.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3 py-4">
      {filteredMovements.map((movement) => (
        <MovementCard key={movement.id} movement={movement} onEdit={onEdit} />
      ))}
    </div>
  )
}
