import { useState } from 'react'
import { Plus } from 'lucide-react'
import { InventoryList } from '@/features/inventory/components/inventory-list'
import { InventoryForm } from '@/features/inventory/components/inventory-form'
import { TransactionForm } from '@/features/inventory/components/transaction-form'
import { useCreateItem, useUpdateItem } from '@/features/inventory/api/use-inventory'
import type { InventoryItem, InventoryCategory } from '@/types/database'
import { CustomDialog } from '@/components/ui/custom-dialog'
import { useToast } from '@/components/ui/toast'
import { getFriendlyErrorMessage } from '@/lib/error-utils'
import { MenuAlerts } from '@/components/ui/menu-alerts'
import { cn } from '@/lib/utils'

type FilterValue = InventoryCategory | 'all'

const tabs: { value: FilterValue; label: string }[] = [
  { value: 'all', label: 'Todos' },
  { value: 'consumivel', label: 'Consumíveis' },
  { value: 'alimento', label: 'Alimentos' },
  { value: 'mobilizado', label: 'Mobilizado' },
]

export default function InventoryPage() {
  const [activeTab, setActiveTab] = useState<FilterValue>('all')
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<InventoryItem | undefined>()
  const [transactionItem, setTransactionItem] = useState<InventoryItem | undefined>()
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const createMutation = useCreateItem()
  const updateMutation = useUpdateItem()
  const { toast } = useToast()

  const handleEditItem = (item: InventoryItem) => {
    setEditingItem(item)
    setIsFormOpen(true)
  }

  const handleCloseForm = () => {
    setIsFormOpen(false)
    setEditingItem(undefined)
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

  return (
    <div className="relative min-h-[calc(100vh-4rem)] bg-background">
      <div className="sticky top-0 z-10 bg-background/95 pb-2 pt-6 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="px-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-foreground">Inventário</h1>
          <MenuAlerts />
        </div>

        <div className="mt-4 flex gap-2 overflow-x-auto px-4 pb-2 scrollbar-hide">
          {tabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={cn(
                'whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium transition-colors',
                activeTab === tab.value
                  ? 'bg-secondary-900 text-white shadow-sm'
                  : 'bg-warm-100 text-secondary-600 hover:bg-warm-200'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4">
        <InventoryList filter={activeTab} onEditItem={handleEditItem} onTransaction={(item) => setTransactionItem(item)} />
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
          isLoading={createMutation.isPending || updateMutation.isPending}
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
