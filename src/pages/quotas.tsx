import { useState } from 'react'
import { Plus } from 'lucide-react'
import { QuotaList } from '@/features/quotas/components/quota-list'
import { QuotaForm } from '@/features/quotas/components/quota-form'
import { useQuotas, useCreateQuota, useUpdateQuota } from '@/features/quotas/api/use-quotas'
import { usePermissions } from '@/hooks/use-permissions'
import type { QuotaWithContact } from '@/features/quotas/components/quota-card'
import type { Quota } from '@/types/database'
import { cn } from '@/lib/utils'
import { CustomDialog } from '@/components/ui/custom-dialog'
import { MenuAlerts } from '@/components/ui/menu-alerts'

type FilterValue = 'all' | 'paid' | 'unpaid'

const tabs: { value: FilterValue; label: string }[] = [
  { value: 'all', label: 'Todas' },
  { value: 'paid', label: 'Pagas' },
  { value: 'unpaid', label: 'Pendentes' },
]

export default function QuotasPage() {
  const [activeTab, setActiveTab] = useState<FilterValue>('all')
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingQuota, setEditingQuota] = useState<QuotaWithContact | undefined>()
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const { data: quotas, isLoading } = useQuotas()
  const createMutation = useCreateQuota()
  const updateMutation = useUpdateQuota()
  
  const { canWrite, isFinancialReadOnly } = usePermissions()
  const canWriteQuotas = canWrite('quotas')

  const handleEditQuota = (quota: QuotaWithContact) => {
    if (!canWriteQuotas) return
    setEditingQuota(quota)
    setIsFormOpen(true)
  }

  const handleCloseForm = () => {
    setIsFormOpen(false)
    setEditingQuota(undefined)
  }

  const handleSubmitForm = async (data: Partial<Quota>) => {
    try {
      if (editingQuota) {
        // @ts-ignore
        await updateMutation.mutateAsync({ id: editingQuota.id, ...data } as any)
      } else {
        // @ts-ignore
        await createMutation.mutateAsync(data as any)
      }
      handleCloseForm()
    } catch (error: any) {
      console.error('Failed to save quota:', error)
      setErrorMessage(error?.message || 'Erro ao guardar quota. Tente novamente.')
    }
  }

  return (
    <div className="relative min-h-[calc(100vh-4rem)] bg-background pb-20">
      <div className="sticky top-0 z-10 bg-background/95 pb-2 pt-6 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="px-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-foreground">Quotas</h1>
            {isFinancialReadOnly() && (
              <span className="rounded-full bg-warm-200 px-2 py-0.5 text-xs font-medium text-secondary-600">
                Apenas leitura
              </span>
            )}
          </div>
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
        <QuotaList 
          quotas={quotas} 
          filter={activeTab} 
          isLoading={isLoading} 
          onEdit={canWriteQuotas ? handleEditQuota : undefined} 
        />
      </div>

      {canWriteQuotas && (
        <button
          type="button"
          aria-label="Registar nova quota"
          className="fixed bottom-24 right-6 min-[430px]:right-[calc(50%-215px+1.5rem)] z-20 flex h-14 w-14 items-center justify-center rounded-full bg-primary-400 text-white shadow-lg transition-transform hover:scale-105 hover:bg-primary-500 active:scale-95"
          onClick={() => setIsFormOpen(true)}
        >
          <Plus className="h-6 w-6" />
        </button>
      )}

      {isFormOpen && (
        <QuotaForm
          quota={editingQuota}
          onClose={handleCloseForm}
          onSubmit={handleSubmitForm}
          isLoading={createMutation.isPending || updateMutation.isPending}
        />
      )}

      <CustomDialog
        isOpen={!!errorMessage}
        title="Erro ao guardar quota"
        description={errorMessage || ''}
        variant="danger"
        confirmLabel="OK"
        onConfirm={() => setErrorMessage(null)}
      />
    </div>
  )
}
