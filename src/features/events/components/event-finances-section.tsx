import { useState } from 'react'
import { Plus, Wallet, ExternalLink, ArrowUpRight, ArrowDownRight, Landmark, Coins } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useMovements, useCreateMovement } from '@/features/treasury/api/use-treasury'
import { MovementForm } from '@/features/treasury/components/movement-form'
import { usePermissions } from '@/hooks/use-permissions'
import { format, parseISO } from 'date-fns'
import { pt } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import type { FinancialMovement } from '@/types/database'

interface EventFinancesSectionProps {
  eventId: string
  eventTitle: string
}

export function EventFinancesSection({ eventId, eventTitle }: EventFinancesSectionProps) {
  const { data: movements = [], isLoading } = useMovements()
  const createMutation = useCreateMovement()
  const { canWrite } = usePermissions()
  const canWriteTreasury = canWrite('treasury')

  const [isMovementModalOpen, setIsMovementModalOpen] = useState(false)

  if (isLoading) {
    return <div className="h-28 w-full animate-pulse rounded-[var(--radius-card)] bg-warm-100" />
  }

  const eventMovements = movements.filter((m) => m.event_id === eventId)

  const income = eventMovements
    .filter((m) => m.type === 'income')
    .reduce((sum, m) => sum + Number(m.amount), 0)

  const expense = eventMovements
    .filter((m) => m.type === 'expense')
    .reduce((sum, m) => sum + Number(m.amount), 0)

  const balance = income - expense

  const handleCreateMovement = async (data: Partial<FinancialMovement>) => {
    try {
      await createMutation.mutateAsync({
        ...data,
        event_id: eventId,
      } as any)
      setIsMovementModalOpen(false)
    } catch (err) {
      console.error('Failed to create movement for event:', err)
    }
  }

  return (
    <div className="flex flex-col gap-3 rounded-[var(--radius-card)] border border-warm-200 bg-surface p-4 shadow-xs">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
            <Wallet className="h-4 w-4" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-foreground leading-tight">Finanças & Orçamento</h4>
            <p className="text-xs text-secondary-500">Receitas e despesas de {eventTitle}</p>
          </div>
        </div>

        <Link
          to={`/treasury?event=${eventId}`}
          className="flex items-center gap-1 text-xs font-semibold text-primary-600 hover:text-primary-700 underline"
        >
          <span>Tesouraria</span>
          <ExternalLink className="h-3 w-3" />
        </Link>
      </div>

      {/* Financial Metrics */}
      <div className="grid grid-cols-3 gap-2 pt-1">
        <div className="flex flex-col rounded-xl border border-green-200 bg-green-50/70 p-2.5">
          <div className="flex items-center gap-1 text-xs font-semibold text-green-700">
            <ArrowUpRight className="h-3 w-3" />
            <span>Receitas</span>
          </div>
          <span className="mt-1 text-sm font-black text-green-800 tracking-tight">
            +{income.toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' })}
          </span>
        </div>

        <div className="flex flex-col rounded-xl border border-red-200 bg-red-50/70 p-2.5">
          <div className="flex items-center gap-1 text-xs font-semibold text-red-700">
            <ArrowDownRight className="h-3 w-3" />
            <span>Despesas</span>
          </div>
          <span className="mt-1 text-sm font-black text-red-800 tracking-tight">
            -{expense.toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' })}
          </span>
        </div>

        <div className="flex flex-col rounded-xl border border-primary-200 bg-primary-50/70 p-2.5">
          <span className="text-xs font-semibold text-primary-800">Saldo</span>
          <span
            className={cn(
              'mt-1 text-sm font-black tracking-tight',
              balance >= 0 ? 'text-primary-900' : 'text-red-700'
            )}
          >
            {balance.toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' })}
          </span>
        </div>
      </div>

      {/* Movements mini-list */}
      {eventMovements.length > 0 ? (
        <div className="mt-1 flex flex-col gap-1.5 border-t border-warm-200/80 pt-2.5">
          <span className="text-xs font-bold uppercase tracking-wider text-secondary-500">
            Transações ({eventMovements.length})
          </span>
          <div className="flex flex-col gap-1.5 max-h-48 overflow-y-auto pr-1">
            {eventMovements.map((mov) => {
              const isInc = mov.type === 'income'
              const isBanco = (mov.account || 'banco') === 'banco'
              return (
                <div
                  key={mov.id}
                  className="flex items-center justify-between rounded-lg border border-warm-100 bg-warm-50/40 px-2.5 py-1.5 text-xs"
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <span
                      className={cn(
                        'flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold',
                        isInc ? 'bg-green-100 text-green-700' : 'bg-red-50 text-red-600'
                      )}
                    >
                      {isInc ? '+' : '-'}
                    </span>
                    <span className="truncate font-semibold text-foreground">{mov.description}</span>
                    <span className="shrink-0 text-secondary-400">
                      {format(parseISO(mov.date), 'dd MMM', { locale: pt })}
                    </span>
                    {isBanco ? (
                      <span className="inline-flex items-center gap-0.5 text-xs text-blue-700">
                        <Landmark className="h-2.5 w-2.5" />
                        Banco
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-0.5 text-xs text-amber-700">
                        <Coins className="h-2.5 w-2.5" />
                        Caixa
                      </span>
                    )}
                  </div>
                  <span
                    className={cn(
                      'shrink-0 font-bold ml-2',
                      isInc ? 'text-green-700' : 'text-foreground'
                    )}
                  >
                    {isInc ? '+' : '-'}
                    {Number(mov.amount).toLocaleString('pt-PT', {
                      style: 'currency',
                      currency: 'EUR',
                    })}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      ) : (
        <p className="text-xs text-secondary-500 italic py-1">
          Ainda não foram registadas despesas ou receitas para esta celebração.
        </p>
      )}

      {/* Quick Add Movement Button */}
      {canWriteTreasury && (
        <button
          type="button"
          onClick={() => setIsMovementModalOpen(true)}
          className="mt-1 flex items-center justify-center gap-1.5 rounded-full border border-warm-300 bg-surface py-2 text-xs font-bold text-secondary-700 hover:bg-warm-100 transition-colors active:scale-95"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Registar Despesa / Receita para esta Festa</span>
        </button>
      )}

      {/* Movement Modal Form */}
      {isMovementModalOpen && (
        <MovementForm
          initialEventId={eventId}
          onClose={() => setIsMovementModalOpen(false)}
          onSubmit={handleCreateMovement}
          isLoading={createMutation.isPending}
        />
      )}
    </div>
  )
}
