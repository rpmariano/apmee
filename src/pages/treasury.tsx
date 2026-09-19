import { useState, useMemo, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { useEvents } from '@/features/events/api/use-events'
import { Plus, SlidersHorizontal, X, ArrowLeftRight } from 'lucide-react'
import { TreasurySummary, type TreasuryViewMode } from '@/features/treasury/components/treasury-summary'
import { MovementList } from '@/features/treasury/components/movement-list'
import { MovementForm } from '@/features/treasury/components/movement-form'
import { TransferForm } from '@/features/treasury/components/transfer-form'
import {
  MovementFiltersSheet,
  type TreasuryFilters,
  DEFAULT_TREASURY_FILTERS,
  filterMovements,
  isFilterCustom,
} from '@/features/treasury/components/movement-filters-sheet'
import { useMovements, useCreateMovement, useUpdateMovement, useDeleteMovement } from '@/features/treasury/api/use-treasury'
import { useCreateTransfer, useDeleteTransfer } from '@/features/treasury/api/use-transfer'
import { usePermissions } from '@/hooks/use-permissions'
import type { FinancialMovement, FinancialAccount } from '@/types/database'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'
import { CustomDialog } from '@/components/ui/custom-dialog'
import { useToast } from '@/components/ui/toast'
import { getFriendlyErrorMessage } from '@/lib/error-utils'
import { MenuAlerts } from '@/components/ui/menu-alerts'

export default function TreasuryPage() {
  const queryClient = useQueryClient()
  const [searchParams, setSearchParams] = useSearchParams()
  const urlEventId = searchParams.get('event')
  const { data: events = [] } = useEvents()

  const [summaryMode, setSummaryMode] = useState<TreasuryViewMode>('consolidado')
  const [filters, setFilters] = useState<TreasuryFilters>(() => ({
    ...DEFAULT_TREASURY_FILTERS,
    eventId: urlEventId || 'all',
  }))

  useEffect(() => {
    if (urlEventId && filters.eventId !== urlEventId) {
      setFilters((prev) => ({ ...prev, eventId: urlEventId }))
    }
  }, [urlEventId, filters.eventId])
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isTransferOpen, setIsTransferOpen] = useState(false)
  const [editingMovement, setEditingMovement] = useState<FinancialMovement | undefined>()
  const [viewingTransfer, setViewingTransfer] = useState<FinancialMovement | undefined>()
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const { data: movements = [], isLoading } = useMovements()
  const createMutation = useCreateMovement()
  const updateMutation = useUpdateMovement()
  const deleteMutation = useDeleteMovement()
  const createTransferMutation = useCreateTransfer()
  const deleteTransferMutation = useDeleteTransfer()
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
    if (filters.eventId !== 'all') count++
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
    if (movement.category === 'transferencia') {
      setViewingTransfer(movement)
      setIsTransferOpen(true)
    } else {
      setEditingMovement(movement)
      setIsFormOpen(true)
    }
  }

  const handleCloseForm = () => {
    setIsFormOpen(false)
    setEditingMovement(undefined)
  }

  const handleClearFilters = () => {
    setFilters({ ...DEFAULT_TREASURY_FILTERS })
    if (urlEventId) setSearchParams({})
  }

  const handleCreateTransfer = async (data: {
    fromAccount: FinancialAccount
    toAccount: FinancialAccount
    amount: number
    date: string
    notes?: string
  }) => {
    try {
      await createTransferMutation.mutateAsync(data)
      toast.success('Transferência registada com sucesso!')
      setIsTransferOpen(false)
      setViewingTransfer(undefined)
    } catch (error: any) {
      console.error('Failed to execute transfer:', error)
      setErrorMessage(getFriendlyErrorMessage(error, 'Erro ao efetuar transferência.'))
    }
  }

  const handleDeleteTransfer = async (transferId: string) => {
    try {
      await deleteTransferMutation.mutateAsync(transferId)
      toast.success('Transferência eliminada e saldos revertidos!')
      setIsTransferOpen(false)
      setViewingTransfer(undefined)
    } catch (error: any) {
      console.error('Failed to delete transfer:', error)
      setErrorMessage(getFriendlyErrorMessage(error, 'Erro ao eliminar transferência.'))
    }
  }

  const handleSubmitForm = async (data: any) => {
    try {
      const { inventoryItem, ...movementData } = data

      if (editingMovement) {
        await updateMutation.mutateAsync({ id: editingMovement.id, ...movementData })
        toast.success('Movimento atualizado com sucesso!')
      } else {
        await createMutation.mutateAsync(movementData as any)

        // Automatic Inventory Entry & Event Association when an inventory item was bought
        if (inventoryItem) {
          try {
            // 1. Check if item already exists in inventory_items
            const { data: existingItems } = await (supabase as any)
              .from('inventory_items')
              .select('*')
              .is('deleted_at', null)

            const existing = (existingItems || []).find(
              (i: any) => i.name.toLowerCase() === inventoryItem.name.trim().toLowerCase()
            )

            let finalItemId = existing?.id

            if (existing) {
              const updatedQty = (existing.quantity || 0) + inventoryItem.quantity
              await (supabase as any)
                .from('inventory_items')
                .update({ quantity: updatedQty })
                .eq('id', existing.id)
            } else {
              const { data: createdItem, error: createItemErr } = await (supabase as any)
                .from('inventory_items')
                .insert({
                  name: inventoryItem.name.trim(),
                  category: inventoryItem.category,
                  quantity: inventoryItem.quantity,
                  unit: inventoryItem.unit || 'un',
                  min_stock: 0,
                })
                .select()
                .single()

              if (!createItemErr && createdItem) {
                finalItemId = createdItem.id
              }
            }

            // 2. Register entry transaction in inventory
            if (finalItemId) {
              await (supabase as any)
                .from('inventory_transactions')
                .insert({
                  item_id: finalItemId,
                  type: 'in',
                  quantity: inventoryItem.quantity,
                  event_id: movementData.event_id || null,
                  notes: `Compra via Tesouraria: ${movementData.description || 'Despesa'}`,
                })

              // 3. If an event is selected, also allocate this item to that event!
              if (movementData.event_id) {
                const { data: existingEventItem } = await (supabase as any)
                  .from('event_inventory')
                  .select('*')
                  .eq('event_id', movementData.event_id)
                  .eq('item_id', finalItemId)
                  .maybeSingle()

                if (existingEventItem) {
                  await (supabase as any)
                    .from('event_inventory')
                    .update({ quantity: existingEventItem.quantity + inventoryItem.quantity })
                    .eq('id', existingEventItem.id)
                } else {
                  await (supabase as any)
                    .from('event_inventory')
                    .insert({
                      event_id: movementData.event_id,
                      item_id: finalItemId,
                      quantity: inventoryItem.quantity,
                    })
                }
                queryClient.invalidateQueries({ queryKey: ['event-inventory', movementData.event_id] })
              }
            }

            queryClient.invalidateQueries({ queryKey: ['inventory'] })
            queryClient.invalidateQueries({ queryKey: ['inventory-transactions'] })
            queryClient.invalidateQueries({ queryKey: ['captive-stock'] })
          } catch (invErr) {
            console.warn('Erro ao atualizar inventário a partir da despesa:', invErr)
          }
        }

        toast.success('Movimento registado com sucesso!')
      }
      handleCloseForm()
    } catch (error: any) {
      console.error('Failed to save movement:', error)
      setErrorMessage(getFriendlyErrorMessage(error, 'Erro ao guardar o movimento. Tente novamente.'))
    }
  }

  const handleDeleteMovement = async (id: string) => {
    try {
      await deleteMutation.mutateAsync(id)
      toast.success('Movimento financeiro eliminado!')
      handleCloseForm()
    } catch (error: any) {
      console.error('Failed to delete movement:', error)
      setErrorMessage(getFriendlyErrorMessage(error, 'Erro ao eliminar o movimento. Tente novamente.'))
    }
  }

  return (
    <div className="relative min-h-[calc(100vh-4rem)] bg-background pb-4">
      {/* Sticky Header */}
      <div className="sticky top-0 z-10 bg-background/95 pb-2 pt-5 backdrop-blur supports-[backdrop-filter]:bg-background/80 border-b border-warm-200/60">
        <div className="px-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black text-foreground">Tesouraria</h1>
          </div>
          <MenuAlerts />
        </div>

        {/* Action Header: Transferir & Filtros */}
        <div className="mt-3.5 flex items-center justify-between gap-2 px-4 pb-1">
          <div>
            {canWriteTreasury && (
              <button
                type="button"
                onClick={() => {
                  setViewingTransfer(undefined)
                  setIsTransferOpen(true)
                }}
                aria-label="Transferir montantes entre Banco e Caixa"
                className="flex items-center gap-1.5 rounded-full border border-warm-200 bg-surface px-3.5 py-1.5 text-xs font-semibold text-secondary-800 hover:bg-warm-50 shadow-xs transition-all active:scale-95"
              >
                <ArrowLeftRight className="h-3.5 w-3.5 text-primary-500" />
                <span>Transferir</span>
              </button>
            )}
          </div>

          {/* Filter Menu Trigger (Homebanking Style) */}
          <button
            type="button"
            onClick={() => setIsFilterOpen(true)}
            aria-label="Abrir filtros de extrato"
            className={cn(
              'relative flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-all active:scale-95',
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
        </div>

        {/* Active Filter Chips Bar */}
        {isFilterActive && (
          <div className="mt-2.5 flex items-center gap-1.5 overflow-x-auto px-4 pb-1 scrollbar-hide">
            {filters.eventId !== 'all' && (
              <span className="inline-flex items-center gap-1 rounded-full bg-primary-100 px-2.5 py-0.5 text-xs font-semibold text-primary-800 shrink-0 border border-primary-200">
                <span>Evento: {events.find((e) => e.id === filters.eventId)?.title || 'Evento'}</span>
                <button
                  type="button"
                  onClick={() => {
                    setFilters((f) => ({ ...f, eventId: 'all' }))
                    if (urlEventId) setSearchParams({})
                  }}
                  aria-label="Remover filtro de evento"
                  className="rounded-full p-0.5 hover:bg-primary-200"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
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

      {/* Body Content: Resumo & Extrato */}
      <div className="px-4 mt-3 space-y-5">
        {/* Demonstração de Resultados (Consolidado, Banco e Caixa) */}
        <TreasurySummary
          movements={filteredMovements}
          isLoading={isLoading}
          viewMode={summaryMode}
          onViewModeChange={setSummaryMode}
          periodLabel={periodLabel}
        />

        {/* Extrato de Movimentos */}
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
            onEdit={handleEditMovement}
            onClearFilters={handleClearFilters}
            isFiltered={isFilterActive}
          />
        </div>
      </div>

      {/* Floating Action Button (FAB) anchored to 430px container */}
      {canWriteTreasury && (
        <button
          type="button"
          aria-label="Registar novo movimento financeiro"
          className="fixed bottom-[calc(4.75rem+env(safe-area-inset-bottom,0px))] right-5 min-[430px]:right-[calc(50%-215px+1.25rem)] z-40 flex h-14 w-14 items-center justify-center rounded-full bg-primary-500 text-white shadow-xl hover:bg-primary-600 active:scale-95 transition-all"
          onClick={() => setIsFormOpen(true)}
        >
          <Plus className="h-6 w-6" />
        </button>
      )}

      {/* Movement Modal Form */}
      {isFormOpen && (
        <MovementForm
          movement={editingMovement}
          initialEventId={filters.eventId !== 'all' ? filters.eventId : undefined}
          onClose={handleCloseForm}
          onSubmit={handleSubmitForm}
          onDelete={canWriteTreasury ? handleDeleteMovement : undefined}
          isLoading={createMutation.isPending || updateMutation.isPending || deleteMutation.isPending}
          readOnly={!canWriteTreasury}
        />
      )}

      {/* Transfer Modal Form */}
      {isTransferOpen && (
        <TransferForm
          onClose={() => {
            setIsTransferOpen(false)
            setViewingTransfer(undefined)
          }}
          onSubmit={handleCreateTransfer}
          isLoading={createTransferMutation.isPending || deleteTransferMutation.isPending}
          existingTransferId={viewingTransfer?.transfer_id || viewingTransfer?.id}
          existingDescription={viewingTransfer?.description}
          existingAmount={viewingTransfer?.amount}
          existingDate={viewingTransfer?.date}
          existingFromAccount={viewingTransfer?.type === 'expense' ? viewingTransfer.account : (viewingTransfer?.account === 'banco' ? 'caixa' : 'banco')}
          existingToAccount={viewingTransfer?.type === 'income' ? viewingTransfer.account : (viewingTransfer?.account === 'banco' ? 'caixa' : 'banco')}
          onDelete={canWriteTreasury ? handleDeleteTransfer : undefined}
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
        title="Erro na Tesouraria"
        description={errorMessage || ''}
        variant="danger"
        confirmLabel="OK"
        onConfirm={() => setErrorMessage(null)}
      />
    </div>
  )
}
