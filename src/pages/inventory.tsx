import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Plus, X, Calendar } from 'lucide-react'
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

  const selectedEventTitle = events.find((e) => e.id === selectedEventId)?.title

  const handleEditItem = (item: InventoryItem) => {
    setEditingItem(item)
    setIsFormOpen(true)
  }

  const handleCloseForm = () => {
    setIsFormOpen(false)
    setEditingItem(undefined)
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
          <h1 className="text-xl font-bold text-foreground">Inventário</h1>
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

        {/* Event Selector Dropdown when toggled */}
        {isEventSelectorOpen && (
          <div className="mt-2.5 px-4 pb-2 animate-in fade-in duration-150">
            <div className="rounded-xl border border-warm-200 bg-surface p-3 shadow-md flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-foreground">Filtrar por Evento</span>
                <button
                  type="button"
                  onClick={() => setIsEventSelectorOpen(false)}
                  className="rounded-full p-1 text-muted hover:bg-warm-100"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
              <CustomSelect
                value={selectedEventId}
                onChange={(val) => {
                  setSelectedEventId(val)
                  setIsEventSelectorOpen(false)
                }}
                options={[
                  { label: 'Todos os Eventos (Mostrar todo o inventário)', value: 'all' },
                  ...events.map((e) => ({
                    label: `${e.event_type === 'festa' ? '🎉 ' : '📅 '}${e.title}`,
                    value: e.id,
                  })),
                ]}
                placeholder="Selecione um evento..."
              />
            </div>
          </div>
        )}

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

      <button
        type="button"
        aria-label="Adicionar item ao inventário"
        className="fixed bottom-24 right-6 min-[430px]:right-[calc(50%-215px+1.5rem)] z-20 flex h-14 w-14 items-center justify-center rounded-full bg-primary-400 text-white shadow-lg transition-transform hover:scale-105 hover:bg-primary-500 active:scale-95"
        onClick={() => setIsFormOpen(true)}
      >
        <Plus className="h-6 w-6" />
      </button>

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
