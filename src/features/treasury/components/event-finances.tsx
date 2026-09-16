import { useState } from 'react'
import { useEvents } from '@/features/events/api/use-events'
import { useMovements } from '@/features/treasury/api/use-treasury'
import { CustomSelect } from '@/components/ui/custom-select'
import { MovementCard } from '@/features/treasury/components/movement-card'
import type { FinancialMovement } from '@/types/database'

interface EventFinancesProps {
  onEditMovement: (movement: FinancialMovement) => void
}

export function EventFinances({ onEditMovement }: EventFinancesProps) {
  const [selectedEventId, setSelectedEventId] = useState<string>('')
  const { data: events, isLoading: isLoadingEvents } = useEvents()
  const { data: movements, isLoading: isLoadingMovements } = useMovements()

  if (isLoadingEvents || isLoadingMovements) {
    return (
      <div className="flex flex-col gap-3 py-4 animate-pulse">
        <div className="h-10 w-full rounded-md bg-warm-100" />
        <div className="h-32 w-full rounded-xl bg-warm-100" />
      </div>
    )
  }

  const eventOptions = (events || []).map(e => ({ label: e.title, value: e.id }))

  const eventMovements = (movements || []).filter(m => m.event_id === selectedEventId)
  
  const totalIncome = eventMovements
    .filter(m => m.type === 'income')
    .reduce((sum, m) => sum + m.amount, 0)
    
  const totalExpense = eventMovements
    .filter(m => m.type === 'expense')
    .reduce((sum, m) => sum + m.amount, 0)
    
  const balance = totalIncome - totalExpense

  return (
    <div className="flex flex-col gap-6 py-4 px-4">
      <div className="flex flex-col gap-1.5 z-[50]">
        <label className="text-sm font-bold text-secondary-700">Selecione o Evento</label>
        <CustomSelect
          value={selectedEventId}
          onChange={(val) => setSelectedEventId(val)}
          options={eventOptions}
          placeholder="Escolha um evento..."
        />
      </div>

      {selectedEventId ? (
        <>
          <div className="grid grid-cols-3 gap-2">
            <div className="flex flex-col rounded-[var(--radius-card)] bg-green-50 p-3">
              <span className="text-xs font-medium text-green-700">Receitas</span>
              <span className="text-sm font-bold text-green-700">{totalIncome.toFixed(2)}€</span>
            </div>
            <div className="flex flex-col rounded-[var(--radius-card)] bg-red-50 p-3">
              <span className="text-xs font-medium text-red-700">Despesas</span>
              <span className="text-sm font-bold text-red-700">{totalExpense.toFixed(2)}€</span>
            </div>
            <div className="flex flex-col rounded-[var(--radius-card)] bg-primary-50 p-3">
              <span className="text-xs font-medium text-primary-700">Saldo</span>
              <span className="text-sm font-bold text-primary-700">{balance.toFixed(2)}€</span>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <h3 className="text-sm font-bold uppercase tracking-wider text-secondary-600">
              Movimentos do Evento
            </h3>
            {eventMovements.length === 0 ? (
              <p className="text-sm text-muted text-center py-4">Nenhum movimento registado para este evento.</p>
            ) : (
              eventMovements.map(movement => (
                <MovementCard 
                  key={movement.id}
                  movement={movement}
                  onEdit={onEditMovement}
                />
              ))
            )}
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <p className="mt-4 text-sm font-medium text-foreground">Sem evento selecionado</p>
          <p className="mt-1 text-xs text-muted">Escolha um evento acima para ver as suas contas.</p>
        </div>
      )}
    </div>
  )
}
