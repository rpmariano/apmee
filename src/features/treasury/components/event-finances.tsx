import { useState } from 'react'
import { useEvents } from '@/features/events/api/use-events'
import { useMovements } from '@/features/treasury/api/use-treasury'
import { CustomSelect } from '@/components/ui/custom-select'
import { MovementCard } from '@/features/treasury/components/movement-card'
import type { FinancialMovement } from '@/types/database'

interface EventFinancesProps {
  onEditMovement: (movement: FinancialMovement) => void
  initialEventId?: string
}

export function EventFinances({ onEditMovement, initialEventId }: EventFinancesProps) {
  const [selectedEventId, setSelectedEventId] = useState<string>(initialEventId || '')
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

  // Sort Festas first with icons
  const eventOptions = (events || [])
    .slice()
    .sort((a, b) => {
      const aIsFesta = a.event_type === 'festa' ? 0 : 1
      const bIsFesta = b.event_type === 'festa' ? 0 : 1
      return aIsFesta - bIsFesta
    })
    .map((e) => ({
      label: `${e.event_type === 'festa' ? '🎉' : '📋'} ${e.title}`,
      value: e.id,
    }))

  const eventMovements = (movements || []).filter((m) => m.event_id === selectedEventId)

  const totalIncome = eventMovements
    .filter((m) => m.type === 'income')
    .reduce((sum, m) => sum + Number(m.amount), 0)

  const totalExpense = eventMovements
    .filter((m) => m.type === 'expense')
    .reduce((sum, m) => sum + Number(m.amount), 0)

  const balance = totalIncome - totalExpense
  const selectedEvent = events?.find((e) => e.id === selectedEventId)

  return (
    <div className="flex flex-col gap-5 py-3 px-4">
      <div className="flex flex-col gap-1.5 z-[50]">
        <label className="text-xs font-bold uppercase tracking-wider text-secondary-600">
          Selecione o Evento / Atividade
        </label>
        <CustomSelect
          value={selectedEventId}
          onChange={(val) => setSelectedEventId(val)}
          options={eventOptions}
          placeholder="Escolha um evento..."
        />
      </div>

      {selectedEventId ? (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-3 gap-2">
            <div className="flex flex-col rounded-[var(--radius-card)] border border-green-200 bg-green-50 p-3">
              <span className="text-xs font-semibold text-green-700">Receitas</span>
              <span className="text-sm font-black text-green-800 tracking-tight">
                +{totalIncome.toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' })}
              </span>
            </div>
            <div className="flex flex-col rounded-[var(--radius-card)] border border-red-200 bg-red-50 p-3">
              <span className="text-xs font-semibold text-red-700">Despesas</span>
              <span className="text-sm font-black text-red-800 tracking-tight">
                -{totalExpense.toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' })}
              </span>
            </div>
            <div className="flex flex-col rounded-[var(--radius-card)] border border-primary-200 bg-primary-50 p-3">
              <span className="text-xs font-semibold text-primary-700">Saldo Líquido</span>
              <span
                className={`text-sm font-black tracking-tight ${
                  balance >= 0 ? 'text-primary-900' : 'text-red-700'
                }`}
              >
                {balance.toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' })}
              </span>
            </div>
          </div>

          {/* Movements List */}
          <div className="flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-secondary-600">
                Movimentos de {selectedEvent?.title}
              </h3>
              <span className="text-xs text-secondary-500 font-medium">
                {eventMovements.length} transação(ões)
              </span>
            </div>

            {eventMovements.length === 0 ? (
              <div className="rounded-[var(--radius-card)] border border-dashed border-warm-200 bg-warm-50/50 p-6 text-center">
                <p className="text-sm font-semibold text-foreground">Sem movimentos registados</p>
                <p className="text-xs text-secondary-500 mt-1">
                  Ainda não foram registadas despesas ou receitas para esta celebração.
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {eventMovements.map((movement) => (
                  <MovementCard
                    key={movement.id}
                    movement={movement}
                    onEdit={onEditMovement}
                    eventName={selectedEvent?.title}
                  />
                ))}
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 text-center rounded-[var(--radius-card)] border border-dashed border-warm-200 bg-warm-50/40">
          <p className="text-sm font-bold text-foreground">Sem evento selecionado</p>
          <p className="mt-1 text-xs text-secondary-500">
            Escolha uma festa ou reunião acima para auditar o respetivo centro de custos.
          </p>
        </div>
      )}
    </div>
  )
}
