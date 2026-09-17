import { useState, useMemo } from 'react'
import {
  X,
  SlidersHorizontal,
  RotateCcw,
  Check,
  Calendar as CalendarIcon,
  Landmark,
  Coins,
  ArrowUpRight,
  ArrowDownRight,
  Layers,
} from 'lucide-react'
import {
  parseISO,
  startOfMonth,
  endOfMonth,
  subMonths,
  startOfYear,
  endOfYear,
  isWithinInterval,
  isAfter,
  isBefore,
} from 'date-fns'
import { useEvents } from '@/features/events/api/use-events'
import { CustomSelect } from '@/components/ui/custom-select'
import type { FinancialMovement, FinancialType, FinancialAccount } from '@/types/database'
import { cn } from '@/lib/utils'

export type PeriodPreset =
  | 'all'
  | 'current_month'
  | 'last_month'
  | 'school_year'
  | 'current_year'
  | 'custom'

export interface TreasuryFilters {
  account: 'all' | FinancialAccount
  type: 'all' | FinancialType
  eventId: string // 'all' or event UUID
  periodPreset: PeriodPreset
  startDate: string // YYYY-MM-DD
  endDate: string // YYYY-MM-DD
}

export const DEFAULT_TREASURY_FILTERS: TreasuryFilters = {
  account: 'all',
  type: 'all',
  eventId: 'all',
  periodPreset: 'all',
  startDate: '',
  endDate: '',
}

export function isFilterCustom(filters: TreasuryFilters): boolean {
  return (
    filters.account !== 'all' ||
    filters.type !== 'all' ||
    filters.eventId !== 'all' ||
    filters.periodPreset !== 'all' ||
    Boolean(filters.startDate) ||
    Boolean(filters.endDate)
  )
}

/**
 * Filter movements by the given criteria
 */
export function filterMovements(
  movements: FinancialMovement[],
  filters: TreasuryFilters
): FinancialMovement[] {
  const now = new Date()

  // Determine date bounds based on periodPreset
  let rangeStart: Date | null = null
  let rangeEnd: Date | null = null

  if (filters.periodPreset === 'current_month') {
    rangeStart = startOfMonth(now)
    rangeEnd = endOfMonth(now)
  } else if (filters.periodPreset === 'last_month') {
    const prev = subMonths(now, 1)
    rangeStart = startOfMonth(prev)
    rangeEnd = endOfMonth(prev)
  } else if (filters.periodPreset === 'current_year') {
    rangeStart = startOfYear(now)
    rangeEnd = endOfYear(now)
  } else if (filters.periodPreset === 'school_year') {
    // Portuguese school year: Sep 1 to Aug 31
    const currentYear = now.getFullYear()
    const currentMonth = now.getMonth() // 0-indexed: 8 is September
    if (currentMonth >= 8) {
      rangeStart = new Date(currentYear, 8, 1, 0, 0, 0)
      rangeEnd = new Date(currentYear + 1, 7, 31, 23, 59, 59)
    } else {
      rangeStart = new Date(currentYear - 1, 8, 1, 0, 0, 0)
      rangeEnd = new Date(currentYear, 7, 31, 23, 59, 59)
    }
  } else if (filters.periodPreset === 'custom') {
    if (filters.startDate) {
      rangeStart = new Date(`${filters.startDate}T00:00:00`)
    }
    if (filters.endDate) {
      rangeEnd = new Date(`${filters.endDate}T23:59:59`)
    }
  }

  return movements.filter((movement) => {
    // 0. Event Filter
    if (filters.eventId && filters.eventId !== 'all') {
      if (movement.event_id !== filters.eventId) {
        return false
      }
    }

    // 1. Account Filter
    const mAccount = movement.account || 'banco'
    if (filters.account !== 'all' && mAccount !== filters.account) {
      return false
    }

    // 2. Type Filter
    if (filters.type !== 'all' && movement.type !== filters.type) {
      return false
    }

    // 3. Date Filter
    if (rangeStart || rangeEnd) {
      try {
        const mDate = parseISO(movement.date)
        if (rangeStart && rangeEnd) {
          if (!isWithinInterval(mDate, { start: rangeStart, end: rangeEnd })) {
            return false
          }
        } else if (rangeStart && isBefore(mDate, rangeStart)) {
          return false
        } else if (rangeEnd && isAfter(mDate, rangeEnd)) {
          return false
        }
      } catch {
        // if invalid date, keep
      }
    }

    return true
  })
}

interface MovementFiltersSheetProps {
  isOpen: boolean
  onClose: () => void
  filters: TreasuryFilters
  onApplyFilters: (filters: TreasuryFilters) => void
  movements: FinancialMovement[]
}

export function MovementFiltersSheet({
  isOpen,
  onClose,
  filters: initialFilters,
  onApplyFilters,
  movements,
}: MovementFiltersSheetProps) {
  const [draft, setDraft] = useState<TreasuryFilters>(initialFilters)
  const { data: events = [] } = useEvents()

  // Format and sort events: Festas first, then Reuniões
  const eventOptions = useMemo(() => {
    const sorted = [...events].sort((a, b) => {
      const aIsFesta = a.event_type === 'festa' ? 0 : 1
      const bIsFesta = b.event_type === 'festa' ? 0 : 1
      return aIsFesta - bIsFesta
    })
    return [
      { label: 'Todos os Eventos / Gerais', value: 'all' },
      ...sorted.map((e) => ({
        label: `${e.event_type === 'festa' ? '🎉' : '📋'} ${e.title}`,
        value: e.id,
      })),
    ]
  }, [events])

  // Real-time matching count with draft filters
  const matchingMovements = useMemo(() => {
    return filterMovements(movements, draft)
  }, [movements, draft])

  if (!isOpen) return null

  const handleReset = () => {
    setDraft({ ...DEFAULT_TREASURY_FILTERS })
  }

  const handleApply = () => {
    onApplyFilters(draft)
    onClose()
  }

  const isChanged = isFilterCustom(draft)

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/40 backdrop-blur-xs transition-opacity animate-in fade-in duration-200">
      <div
        className="flex max-h-[90vh] w-full max-w-[430px] flex-col rounded-t-[1.5rem] bg-surface shadow-2xl animate-in slide-in-from-bottom-6 duration-200 ease-out"
        role="dialog"
        aria-modal="true"
        aria-label="Filtros da Tesouraria"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-warm-200 px-5 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-50 text-primary-600">
              <SlidersHorizontal className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground">Filtros da Tesouraria</h2>
              <p className="text-xs text-secondary-500">Extrato por conta, tipo e datas</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar filtros"
            className="rounded-full p-2 text-secondary-500 hover:bg-warm-100 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Filter Options */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {/* Section 1: Conta (Banco vs Caixa) */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-secondary-600">
              Conta de Tesouraria
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setDraft((d) => ({ ...d, account: 'all' }))}
                className={cn(
                  'flex flex-col items-center justify-center gap-1 rounded-[var(--radius-card)] border p-2.5 text-xs font-semibold transition-all',
                  draft.account === 'all'
                    ? 'border-primary-500 bg-primary-50 text-primary-700 shadow-xs'
                    : 'border-warm-200 bg-surface text-secondary-600 hover:bg-warm-50'
                )}
              >
                <Layers className="h-4 w-4" />
                <span>Todas</span>
              </button>

              <button
                type="button"
                onClick={() => setDraft((d) => ({ ...d, account: 'banco' }))}
                className={cn(
                  'flex flex-col items-center justify-center gap-1 rounded-[var(--radius-card)] border p-2.5 text-xs font-semibold transition-all',
                  draft.account === 'banco'
                    ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-xs'
                    : 'border-warm-200 bg-surface text-secondary-600 hover:bg-warm-50'
                )}
              >
                <Landmark className="h-4 w-4 text-blue-600" />
                <span>Banco</span>
              </button>

              <button
                type="button"
                onClick={() => setDraft((d) => ({ ...d, account: 'caixa' }))}
                className={cn(
                  'flex flex-col items-center justify-center gap-1 rounded-[var(--radius-card)] border p-2.5 text-xs font-semibold transition-all',
                  draft.account === 'caixa'
                    ? 'border-amber-500 bg-amber-50 text-amber-700 shadow-xs'
                    : 'border-warm-200 bg-surface text-secondary-600 hover:bg-warm-50'
                )}
              >
                <Coins className="h-4 w-4 text-amber-600" />
                <span>Caixa</span>
              </button>
            </div>
          </div>

          {/* Section 2: Tipo de Movimento */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-secondary-600">
              Tipo de Movimento
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setDraft((d) => ({ ...d, type: 'all' }))}
                className={cn(
                  'flex items-center justify-center gap-1 rounded-[var(--radius-card)] border py-2 px-3 text-xs font-semibold transition-all',
                  draft.type === 'all'
                    ? 'border-primary-500 bg-primary-50 text-primary-700 shadow-xs'
                    : 'border-warm-200 bg-surface text-secondary-600 hover:bg-warm-50'
                )}
              >
                <span>Todos</span>
              </button>

              <button
                type="button"
                onClick={() => setDraft((d) => ({ ...d, type: 'income' }))}
                className={cn(
                  'flex items-center justify-center gap-1 rounded-[var(--radius-card)] border py-2 px-3 text-xs font-semibold transition-all',
                  draft.type === 'income'
                    ? 'border-green-500 bg-green-50 text-green-700 shadow-xs'
                    : 'border-warm-200 bg-surface text-secondary-600 hover:bg-warm-50'
                )}
              >
                <ArrowUpRight className="h-3.5 w-3.5 text-green-600" />
                <span>Receitas</span>
              </button>

              <button
                type="button"
                onClick={() => setDraft((d) => ({ ...d, type: 'expense' }))}
                className={cn(
                  'flex items-center justify-center gap-1 rounded-[var(--radius-card)] border py-2 px-3 text-xs font-semibold transition-all',
                  draft.type === 'expense'
                    ? 'border-red-500 bg-red-50 text-red-700 shadow-xs'
                    : 'border-warm-200 bg-surface text-secondary-600 hover:bg-warm-50'
                )}
              >
                <ArrowDownRight className="h-3.5 w-3.5 text-red-600" />
                <span>Despesas</span>
              </button>
            </div>
          </div>

          {/* Section: Evento Associado */}
          <div className="space-y-2 z-[60]">
            <label className="text-xs font-bold uppercase tracking-wider text-secondary-600">
              Evento Associado (Festas / Atividades)
            </label>
            <CustomSelect
              value={draft.eventId}
              onChange={(val) => setDraft((d) => ({ ...d, eventId: val }))}
              options={eventOptions}
              placeholder="Filtrar por evento..."
            />
          </div>

          {/* Section 3: Período do Ano */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-secondary-600">
              Período Temporal
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'all', label: 'Todo o Histórico' },
                { id: 'current_month', label: 'Este Mês' },
                { id: 'last_month', label: 'Mês Anterior' },
                { id: 'school_year', label: 'Ano Letivo Atual' },
                { id: 'current_year', label: 'Ano Civil' },
                { id: 'custom', label: 'Intervalo de Datas' },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() =>
                    setDraft((d) => ({
                      ...d,
                      periodPreset: item.id as PeriodPreset,
                    }))
                  }
                  className={cn(
                    'flex items-center justify-between rounded-[var(--radius-card)] border px-3 py-2 text-xs font-semibold transition-all text-left',
                    draft.periodPreset === item.id
                      ? 'border-primary-500 bg-primary-50 text-primary-800 shadow-xs'
                      : 'border-warm-200 bg-surface text-secondary-600 hover:bg-warm-50'
                  )}
                >
                  <span>{item.label}</span>
                  {draft.periodPreset === item.id && <Check className="h-3.5 w-3.5 text-primary-600" />}
                </button>
              ))}
            </div>
          </div>

          {/* Section 4: Range de Datas Personalizado (se custom selecionado) */}
          {draft.periodPreset === 'custom' && (
            <div className="space-y-3 rounded-[var(--radius-card)] border border-primary-200 bg-primary-50/40 p-3.5 animate-in fade-in slide-in-from-top-1 duration-150">
              <div className="flex items-center gap-1.5 text-xs font-bold text-primary-900">
                <CalendarIcon className="h-3.5 w-3.5" />
                <span>Intervalo Personalizado (Estilo Banco)</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label htmlFor="filter-start-date" className="text-xs font-medium text-secondary-700">
                    Data Inicial (De)
                  </label>
                  <input
                    id="filter-start-date"
                    type="date"
                    value={draft.startDate}
                    onChange={(e) => setDraft((d) => ({ ...d, startDate: e.target.value }))}
                    className="rounded-[var(--radius-button)] border border-warm-200 bg-surface px-2.5 py-1.5 text-xs text-foreground focus:border-primary-400 focus:outline-none focus:ring-1 focus:ring-primary-400"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label htmlFor="filter-end-date" className="text-xs font-medium text-secondary-700">
                    Data Final (Até)
                  </label>
                  <input
                    id="filter-end-date"
                    type="date"
                    value={draft.endDate}
                    onChange={(e) => setDraft((d) => ({ ...d, endDate: e.target.value }))}
                    className="rounded-[var(--radius-button)] border border-warm-200 bg-surface px-2.5 py-1.5 text-xs text-foreground focus:border-primary-400 focus:outline-none focus:ring-1 focus:ring-primary-400"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center gap-3 border-t border-warm-200 bg-surface px-5 py-4">
          <button
            type="button"
            onClick={handleReset}
            disabled={!isChanged}
            className="flex items-center gap-1.5 rounded-full border border-warm-200 bg-surface px-3.5 py-2.5 text-xs font-semibold text-secondary-600 hover:bg-warm-50 disabled:opacity-40 transition-all"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Repor</span>
          </button>

          <button
            type="button"
            onClick={handleApply}
            className="flex flex-1 items-center justify-center gap-2 rounded-full bg-primary-500 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-primary-600 active:scale-95 transition-all"
          >
            <span>Ver {matchingMovements.length} Movimento(s)</span>
          </button>
        </div>
      </div>
    </div>
  )
}
