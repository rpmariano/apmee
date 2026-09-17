import { useState } from 'react'
import { Plus } from 'lucide-react'
import { TreasurySummary } from '@/features/treasury/components/treasury-summary'
import { MovementList } from '@/features/treasury/components/movement-list'
import { EventFinances } from '@/features/treasury/components/event-finances'
import { MovementForm } from '@/features/treasury/components/movement-form'
import { useMovements, useCreateMovement, useUpdateMovement } from '@/features/treasury/api/use-treasury'
import { usePermissions } from '@/hooks/use-permissions'
import type { FinancialMovement, FinancialType } from '@/types/database'
import { cn } from '@/lib/utils'
import { CustomDialog } from '@/components/ui/custom-dialog'
import { MenuAlerts } from '@/components/ui/menu-alerts'

type FilterValue = FinancialType | 'all' | 'events'

const tabs: { value: FilterValue; label: string }[] = [
  { value: 'all', label: 'Todos' },
  { value: 'income', label: 'Receitas' },
  { value: 'expense', label: 'Despesas' },
  { value: 'events', label: 'Eventos' },
]

export default function TreasuryPage() {
  const [activeTab, setActiveTab] = useState<FilterValue>('all')
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingMovement, setEditingMovement] = useState<FinancialMovement | undefined>()
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const { data: movements, isLoading } = useMovements()
  const createMutation = useCreateMovement()
  const updateMutation = useUpdateMovement()
  
  const { canWrite } = usePermissions()
  const canWriteTreasury = canWrite('treasury')

  const handleEditMovement = (movement: FinancialMovement) => {
    if (!canWriteTreasury) return
    setEditingMovement(movement)
    setIsFormOpen(true)
  }

  const handleCloseForm = () => {
    setIsFormOpen(false)
    setEditingMovement(undefined)
  }

  const handleSubmitForm = async (data: Partial<FinancialMovement>) => {
    try {
      if (editingMovement) {
        await updateMutation.mutateAsync({ id: editingMovement.id, ...data })
      } else {
        await createMutation.mutateAsync(data as any)
      }
      handleCloseForm()
    } catch (error: any) {
      console.error('Failed to save movement:', error)
      setErrorMessage(error?.message || 'Erro ao guardar o movimento. Tente novamente.')
    }
  }

  return (
    <div className="relative min-h-[calc(100vh-4rem)] bg-background pb-20">
      <div className="sticky top-0 z-10 bg-background/95 pb-2 pt-6 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="px-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-foreground">Tesouraria</h1>
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

      {activeTab === 'events' ? (
        <EventFinances onEditMovement={handleEditMovement} />
      ) : (
        <div className="px-4 mt-2">
          <TreasurySummary movements={movements} isLoading={isLoading} />
          
          <div className="mt-6">
            <h3 className="font-bold text-foreground mb-2">Movimentos</h3>
            <MovementList 
              movements={movements} 
              filter={activeTab as any} 
              isLoading={isLoading} 
              onEdit={canWriteTreasury ? handleEditMovement : undefined} 
            />
          </div>
        </div>
      )}

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

      {isFormOpen && (
        <MovementForm
          movement={editingMovement}
          onClose={handleCloseForm}
          onSubmit={handleSubmitForm}
          isLoading={createMutation.isPending || updateMutation.isPending}
        />
      )}

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
