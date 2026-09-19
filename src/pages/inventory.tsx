import { useState, useEffect } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { X, Calendar, ArrowLeft } from 'lucide-react'
import { InventoryList } from '@/features/inventory/components/inventory-list'
import { InventoryForm } from '@/features/inventory/components/inventory-form'
import { TransactionForm } from '@/features/inventory/components/transaction-form'
import { useCreateItem, useUpdateItem, useDeleteItem } from '@/features/inventory/api/use-inventory'
import { useEvents } from '@/features/events/api/use-events'
import type { InventoryItem, InventoryCategory } from '@/types/database'
import { CustomDialog } from '@/components/ui/custom-dialog'
import { CustomSelect } from '@/components/ui/custom-select'
import { useToast } from '@/components/ui/toast'
import { getFriendlyErrorMessage } from '@/lib/error-utils'
import { MenuAlerts } from '@/components/ui/menu-alerts'
import { cn } from '@/lib/utils'
import { usePermissions } from '@/hooks/use-permissions'

type FilterValue = InventoryCategory | 'all'

const tabs: { value: FilterValue; label: string }[] = [
  { value: 'all', label: 'Todos' },
  { value: 'consumivel', label: 'Consumíveis' },
  { value: 'alimento', label: 'Alimentos' },
  { value: 'mobilizado', label: 'Equipamento' },
]

export default function InventoryPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const urlEventId = searchParams.get('event')
  const isNew = searchParams.get('new') === '1' || searchParams.get('new') === 'true'

  const [activeTab, setActiveTab] = useState<FilterValue>('all')
  const [selectedEventId, setSelectedEventId] = useState<string>(urlEventId || 'all')
  const [isEventSelectorOpen, setIsEventSelectorOpen] = useState(false)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<InventoryItem | undefined>()
  const [transactionItem, setTransactionItem] = useState<InventoryItem | undefined>()
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const { data: events = [] } = useEvents()
  const createMutation = useCreateItem()
  const updateMutation = useUpdateItem()
  const deleteMutation = useDeleteItem()
  const { toast } = useToast()
  const { canWrite } = usePermissions()
  const canWriteInventory = canWrite('inventory')

  useEffect(() => {
    if (urlEventId && selectedEventId !== urlEventId) {
      setSelectedEventId(urlEventId)
    }
  }, [urlEventId, selectedEventId])

  useEffect(() => {
    if (isNew && !isFormOpen && !editingItem) {
      setIsFormOpen(true)
    }
  }, [isNew, isFormOpen, editingItem])

  const selectedEventTitle = events.find((e) => e.id === selectedEventId)?.title

  const handleEditItem = (item: InventoryItem) => {
    setEditingItem(item)
    setIsFormOpen(true)
  }

  const handleCloseForm = () => {
    setIsFormOpen(false)
    setEditingItem(undefined)
    if (searchParams.get('new')) {
      const nextParams = new URLSearchParams(searchParams)
      nextParams.delete('new')
      setSearchParams(nextParams, { replace: true })
    }
  }

  const handleClearEventFilter = () => {
    setSelectedEventId('all')
    if (urlEventId) setSearchParams({})
  }

  const handleSubmitForm = async (data: Partial<InventoryItem>) => {
    try {
      if (editingItem) {
        await updateMutation.mutateAsync({ id: editingItem.id, ...data })
        toast.success('Item de inventário atualizado!')
      } else {
        await createMutation.mutateAsync(data as any)
        toast.success('Item adicionado ao inventário!')
      }
      handleCloseForm()
    } catch (error: any) {
      console.error('Failed to save item:', error)
      setErrorMessage(getFriendlyErrorMessage(error, 'Erro ao guardar o item. Tente novamente.'))
    }
  }

  const handleDeleteItem = async (id: string) => {
    await deleteMutation.mutateAsync(id)
    toast.success('Item eliminado do inventário!')
  }

  return (
    <div className="relative min-h-[calc(100vh-4rem)] bg-background">
      <div className="sticky top-0 z-10 bg-background/95 pb-2 pt-6 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="px-4 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Link
              to="/menu"
              aria-label="Voltar ao Menu"
              className="flex h-9 w-9 items-center justify-center rounded-full text-secondary-600 hover:bg-warm-100 hover:text-foreground active:scale-95 transition-all -ml-1"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <h1 className="text-xl font-bold text-foreground">Inventário</h1>
          </div>
          <MenuAlerts />
        </div>

        <div className="mt-3.5 px-4 flex items-center justify-between gap-2">
          {/* Category Tabs */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide flex-1">
            {tabs.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setActiveTab(tab.value)}
                className={cn(
                  'whitespace-nowrap rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors',
                  activeTab === tab.value
                    ? 'bg-secondary-900 text-white shadow-sm'
                    : 'bg-warm-100 text-secondary-600 hover:bg-warm-200'
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Event Filter Trigger */}
          <button
            type="button"
            onClick={() => setIsEventSelectorOpen((prev) => !prev)}
            aria-label="Filtrar inventário por evento"
            className={cn(
              'flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold shrink-0 transition-all active:scale-95',
              selectedEventId !== 'all'
                ? 'border-primary-500 bg-primary-50 text-primary-800 shadow-xs'
                : 'border-warm-200 bg-surface text-secondary-600 hover:bg-warm-50 shadow-xs'
            )}
          >
            <Calendar className="h-3.5 w-3.5" />
            <span>{selectedEventId !== 'all' ? 'Evento' : 'Filtro Evento'}</span>
            {selectedEventId !== 'all' && (
              <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-primary-500 px-1 text-xs font-bold text-white leading-none">
                1
              </span>
            )}
          </button>
        </div>

        {/* Active Event Filter Chip */}
        {selectedEventId !== 'all' && (
          <div className="mt-2.5 px-4 flex items-center gap-1.5 pb-1">
            <span className="inline-flex items-center gap-1 rounded-full bg-primary-100 px-2.5 py-0.5 text-xs font-semibold text-primary-800 border border-primary-200 shrink-0">
              <span>Evento: {selectedEventTitle || 'Evento'}</span>
              <button
                type="button"
                onClick={handleClearEventFilter}
                aria-label="Remover filtro de evento"
                className="rounded-full p-0.5 hover:bg-primary-200"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
            <button
              type="button"
              onClick={handleClearEventFilter}
              className="text-xs font-semibold text-primary-600 hover:text-primary-700 underline shrink-0 ml-1"
            >
              Limpar filtro
            </button>
          </div>
        )}
      </div>

      <div className="px-4">
        <InventoryList
          filter={activeTab}
          eventFilter={selectedEventId}
          onEditItem={handleEditItem}
          onTransaction={(item) => setTransactionItem(item)}
        />
      </div>

      {/* Slide-up Bottom Sheet for Event Filter */}
      {isEventSelectorOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => setIsEventSelectorOpen(false)}
        >
          <div
            className="w-full max-w-[430px] rounded-t-2xl sm:rounded-2xl bg-surface border-t sm:border border-warm-200 p-5 shadow-2xl animate-in slide-in-from-bottom-4 duration-200 flex flex-col gap-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-foreground">Filtrar por Evento</h3>
                <p className="text-xs text-muted">Selecione o evento para ver os itens alocados</p>
              </div>
              <button
                type="button"
                onClick={() => setIsEventSelectorOpen(false)}
                className="rounded-full p-2 text-muted hover:bg-warm-100 transition-colors"
                aria-label="Fechar seletor"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <CustomSelect
              searchable
              value={selectedEventId}
              onChange={(val) => {
                setSelectedEventId(val)
                if (val === 'all') {
                  if (urlEventId) setSearchParams({})
                } else {
                  setSearchParams({ event: val })
                }
                setIsEventSelectorOpen(false)
              }}
              options={[
                { label: 'Todos os Eventos (Mostrar todo o inventário)', value: 'all' },
                ...events.map((e) => ({
                  label: `${e.event_type === 'festa' ? '🎉 ' : '📅 '}${e.title}`,
                  value: e.id,
                })),
              ]}
              placeholder="Pesquisar evento..."
            />

            {selectedEventId !== 'all' && (
              <button
                type="button"
                onClick={() => {
                  handleClearEventFilter()
                  setIsEventSelectorOpen(false)
                }}
                className="w-full rounded-[var(--radius-button)] border border-warm-200 py-2.5 text-xs font-semibold text-secondary-600 hover:bg-warm-50 transition-colors"
              >
                Limpar Filtro de Evento
              </button>
            )}
          </div>
        </div>
      )}

      {transactionItem && (
        <TransactionForm
          item={transactionItem}
          onClose={() => setTransactionItem(undefined)}
        />
      )}

      {isFormOpen && (
      <InventoryForm
          item={editingItem}
          onClose={handleCloseForm}
          onSubmit={handleSubmitForm}
          isLoading={createMutation.isPending || updateMutation.isPending || deleteMutation.isPending}
          onDelete={canWriteInventory ? handleDeleteItem : undefined}
        />
      )}

      <CustomDialog
        isOpen={!!errorMessage}
        title="Erro ao guardar item"
        description={errorMessage || ''}
        variant="danger"
        confirmLabel="OK"
        onConfirm={() => setErrorMessage(null)}
      />
    </div>
  )
}
