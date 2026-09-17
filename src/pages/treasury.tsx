import { useState, useMemo } from 'react'
import { Plus, SlidersHorizontal, X } from 'lucide-react'
import { TreasurySummary, type TreasuryViewMode } from '@/features/treasury/components/treasury-summary'
import { MovementList } from '@/features/treasury/components/movement-list'
import { EventFinances } from '@/features/treasury/components/event-finances'
import { MovementForm } from '@/features/treasury/components/movement-form'
import {
  MovementFiltersSheet,
  type TreasuryFilters,
  DEFAULT_TREASURY_FILTERS,
  filterMovements,
  isFilterCustom,
} from '@/features/treasury/components/movement-filters-sheet'
import { useMovements, useCreateMovement, useUpdateMovement } from '@/features/treasury/api/use-treasury'
import { usePermissions } from '@/hooks/use-permissions'
import type { FinancialMovement } from '@/types/database'
import { cn } from '@/lib/utils'
import { CustomDialog } from '@/components/ui/custom-dialog'
import { useToast } from '@/components/ui/toast'
import { getFriendlyErrorMessage } from '@/lib/error-utils'
import { MenuAlerts } from '@/components/ui/menu-alerts'

type MainTab = 'movements' | 'events'

export default function TreasuryPage() {
  const [mainTab, setMainTab] = useState<MainTab>('movements')
  const [summaryMode, setSummaryMode] = useState<TreasuryViewMode>('consolidado')
  const [filters, setFilters] = useState<TreasuryFilters>({ ...DEFAULT_TREASURY_FILTERS })
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingMovement, setEditingMovement] = useState<FinancialMovement | undefined>()
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const { data: movements = [], isLoading } = useMovements()
  const createMutation = useCreateMovement()
  const updateMutation = useUpdateMovement()
  const { toast } = useToast()

  const { canWrite } = usePermissions()
  const canWriteTreasury = canWrite('treasury')

  // Filtered movements based on homebanking filters
  const filteredMovements = useMemo(() => {
    return filterMovements(movements, filters)
  }, [movements, filters])

  const isFilterActive = isFilterCustom(filters)

  // Count active filters for badge
  const activeFiltersCount = useMemo(() => {
    let count = 0
    if (filters.account !== 'all') count++
    if (filters.type !== 'all') count++
    if (filters.periodPreset !== 'all') count++
    return count
  }, [filters])

  // Period label for summary badge
  const periodLabel = useMemo(() => {
    if (filters.periodPreset === 'current_month') return 'Este Mês'
    if (filters.periodPreset === 'last_month') return 'Mês Anterior'
    if (filters.periodPreset === 'school_year') return 'Ano Letivo'
    if (filters.periodPreset === 'current_year') return 'Ano Civil'
    if (filters.periodPreset === 'custom') {
      if (filters.startDate && filters.endDate) {
        return `${filters.startDate} a ${filters.endDate}`
      }
      return 'Intervalo'
    }
    return undefined
  }, [filters])

  const handleEditMovement = (movement: FinancialMovement) => {
    if (!canWriteTreasury) return
    setEditingMovement(movement)
    setIsFormOpen(true)
  }

  const handleCloseForm = () => {
    setIsFormOpen(false)
    setEditingMovement(undefined)
  }

  const handleClearFilters = () => {
    setFilters({ ...DEFAULT_TREASURY_FILTERS })
  }

  const handleSubmitForm = async (data: Partial<FinancialMovement>) => {
    try {
      if (editingMovement) {
        await updateMutation.mutateAsync({ id: editingMovement.id, ...data })
        toast.success('Movimento atualizado com sucesso!')
      } else {
        await createMutation.mutateAsync(data as any)
        toast.success('Movimento registado com sucesso!')
      }
      handleCloseForm()
    } catch (error: any) {
      console.error('Failed to save movement:', error)
      setErrorMessage(getFriendlyErrorMessage(error, 'Erro ao guardar o movimento. Tente novamente.'))
    }
  }

  return (
    <div className="relative min-h-[calc(100vh-4rem)] bg-background pb-24">
      {/* Sticky Header */}
      <div className="sticky top-0 z-10 bg-background/95 pb-2 pt-5 backdrop-blur supports-[backdrop-filter]:bg-background/80 border-b border-warm-200/60">
        <div className="px-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black text-foreground">Tesouraria</h1>
          </div>
          <MenuAlerts />
        </div>

        {/* View Mode Navigation & Filter Trigger */}
        <div className="mt-3.5 flex items-center justify-between gap-2 px-4 pb-1">
          {/* Main Tabs: Movimentos | Por Evento */}
          <div className="flex rounded-full bg-warm-100 p-1 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setMainTab('movements')}
              className={cn(
                'rounded-full px-3.5 py-1.5 transition-all',
                mainTab === 'movements'
                  ? 'bg-secondary-900 text-white shadow-xs'
                  : 'text-secondary-600 hover:text-foreground'
              )}
            >
              Movimentos
            </button>
            <button
              type="button"
              onClick={() => setMainTab('events')}
              className={cn(
                'rounded-full px-3.5 py-1.5 transition-all',
                mainTab === 'events'
                  ? 'bg-secondary-900 text-white shadow-xs'
                  : 'text-secondary-600 hover:text-foreground'
              )}
            >
              Por Evento
            </button>
          </div>

          {/* Filter Menu Trigger (Homebanking Style) */}
          {mainTab === 'movements' && (
            <button
              type="button"
              onClick={() => setIsFilterOpen(true)}
              aria-label="Abrir filtros de extrato"
              className={cn(
                'relative flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-all active:scale-95',
                isFilterActive
                  ? 'border-primary-500 bg-primary-50 text-primary-800 shadow-xs'
                  : 'border-warm-200 bg-surface text-secondary-600 hover:bg-warm-50 shadow-xs'
              )}
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              <span>Filtros</span>
              {isFilterActive && (
                <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-primary-500 px-1 text-xs font-bold text-white leading-none">
                  {activeFiltersCount}
                </span>
              )}
            </button>
          )}
        </div>

        {/* Active Filter Chips Bar */}
        {mainTab === 'movements' && isFilterActive && (
          <div className="mt-2.5 flex items-center gap-1.5 overflow-x-auto px-4 pb-1 scrollbar-hide">
            {filters.account !== 'all' && (
              <span className="inline-flex items-center gap-1 rounded-full bg-secondary-100 px-2.5 py-0.5 text-xs font-semibold text-secondary-800 shrink-0">
                <span>Conta: {filters.account === 'banco' ? 'Banco' : 'Caixa'}</span>
                <button
                  type="button"
                  onClick={() => setFilters((f) => ({ ...f, account: 'all' }))}
                  aria-label="Remover filtro de conta"
                  className="rounded-full p-0.5 hover:bg-secondary-200"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}

            {filters.type !== 'all' && (
              <span className="inline-flex items-center gap-1 rounded-full bg-secondary-100 px-2.5 py-0.5 text-xs font-semibold text-secondary-800 shrink-0">
                <span>Tipo: {filters.type === 'income' ? 'Receitas' : 'Despesas'}</span>
                <button
                  type="button"
                  onClick={() => setFilters((f) => ({ ...f, type: 'all' }))}
                  aria-label="Remover filtro de tipo"
                  className="rounded-full p-0.5 hover:bg-secondary-200"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}

            {filters.periodPreset !== 'all' && (
              <span className="inline-flex items-center gap-1 rounded-full bg-secondary-100 px-2.5 py-0.5 text-xs font-semibold text-secondary-800 shrink-0">
                <span>Período: {periodLabel}</span>
                <button
                  type="button"
                  onClick={() =>
                    setFilters((f) => ({
                      ...f,
                      periodPreset: 'all',
                      startDate: '',
                      endDate: '',
                    }))
                  }
                  aria-label="Remover filtro de data"
                  className="rounded-full p-0.5 hover:bg-secondary-200"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}

            <button
              type="button"
              onClick={handleClearFilters}
              className="text-xs font-semibold text-primary-600 hover:text-primary-700 underline shrink-0 ml-1"
            >
              Limpar tudo
            </button>
          </div>
        )}
      </div>

      {/* Body Content */}
      {mainTab === 'events' ? (
        <EventFinances onEditMovement={handleEditMovement} />
      ) : (
        <div className="px-4 mt-3 space-y-5">
          {/* Demonstração de Resultados (Consolidado, Banco e Caixa) */}
          <TreasurySummary
            movements={filteredMovements}
            isLoading={isLoading}
            viewMode={summaryMode}
            onViewModeChange={setSummaryMode}
            periodLabel={periodLabel}
          />

          {/* Extrato de Movimentos (Compacto / Colapsado) */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div>
                <h3 className="font-bold text-foreground text-sm">Extrato de Movimentos</h3>
                <p className="text-xs text-secondary-500">
                  {filteredMovements.length} movimento(s) registado(s)
                </p>
              </div>

              {isFilterActive && (
                <span className="text-xs font-medium text-primary-600">
                  (Filtros ativos)
                </span>
              )}
            </div>

            <MovementList
              movements={filteredMovements}
              isLoading={isLoading}
              onEdit={canWriteTreasury ? handleEditMovement : undefined}
              onClearFilters={handleClearFilters}
              isFiltered={isFilterActive}
            />
          </div>
        </div>
      )}

      {/* Floating Action Button (FAB) anchored to 430px container */}
      {canWriteTreasury && (
        <button
          type="button"
          aria-label="Registar novo movimento financeiro"
          className="fixed bottom-24 right-6 min-[430px]:right-[calc(50%-215px+1.5rem)] z-20 flex h-14 w-14 items-center justify-center rounded-full bg-primary-400 text-white shadow-lg transition-transform hover:scale-105 hover:bg-primary-500 active:scale-95"
          onClick={() => setIsFormOpen(true)}
        >
          <Plus className="h-6 w-6" />
        </button>
      )}

      {/* Movement Modal Form */}
      {isFormOpen && (
        <MovementForm
          movement={editingMovement}
          onClose={handleCloseForm}
          onSubmit={handleSubmitForm}
          isLoading={createMutation.isPending || updateMutation.isPending}
        />
      )}

      {/* Homebanking Filters Slide-up Sheet */}
      <MovementFiltersSheet
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        filters={filters}
        onApplyFilters={setFilters}
        movements={movements}
      />

      {/* Error Alert Dialog */}
      <CustomDialog
        isOpen={!!errorMessage}
        title="Erro ao guardar movimento"
        description={errorMessage || ''}
        variant="danger"
        confirmLabel="OK"
        onConfirm={() => setErrorMessage(null)}
      />
    </div>
  )
}
