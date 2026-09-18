import { useState, useRef } from 'react'
import { Plus } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { QuotaList } from '@/features/quotas/components/quota-list'
import { QuotaForm } from '@/features/quotas/components/quota-form'
import { useQuotas, useCreateQuota, useUpdateQuota, useDeleteQuota } from '@/features/quotas/api/use-quotas'
import { useContacts } from '@/features/contacts/api/use-contacts'
import { usePermissions } from '@/hooks/use-permissions'
import type { QuotaWithContact } from '@/features/quotas/components/quota-card'
import type { Quota } from '@/types/database'
import { cn } from '@/lib/utils'
import { supabase } from '@/lib/supabase'
import { formatSchoolYear } from '@/lib/school-year'
import { CustomDialog } from '@/components/ui/custom-dialog'
import { useToast } from '@/components/ui/toast'
import { getFriendlyErrorMessage } from '@/lib/error-utils'
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
  const isSubmittingRef = useRef(false)

  const queryClient = useQueryClient()
  const { data: quotas, isLoading } = useQuotas()
  const { data: contacts } = useContacts('all')
  const createMutation = useCreateQuota()
  const updateMutation = useUpdateQuota()
  const deleteMutation = useDeleteQuota()
  const { toast } = useToast()
  
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

  const getContactName = (contactId: string) => {
    return contacts?.find((c) => c.id === contactId)?.name || editingQuota?.contact?.name || 'Associado'
  }

  const handleSubmitForm = async (data: Partial<Quota>) => {
    // Guard against duplicate / concurrent submission
    if (isSubmittingRef.current) return
    isSubmittingRef.current = true

    try {
      const targetId = (data as any).id || editingQuota?.id
      const contactName = data.contact_id ? getContactName(data.contact_id) : (editingQuota?.contact?.name || 'Associado')
      const targetYear = data.year ?? editingQuota?.year ?? 2026
      const yearFormatted = formatSchoolYear(targetYear)
      const isPaid = !!data.paid
      let movementId = editingQuota?.movement_id || null

      // If movementId is null (e.g. before DB migration), search if an active movement already exists in treasury
      if (!movementId) {
        const { data: existingMovs } = await (supabase as any)
          .from('financial_movements')
          .select('id')
          .eq('category', 'Quotas de Sócios')
          .ilike('description', `Quota ${yearFormatted} — ${contactName}%`)
          .is('deleted_at', null)
          .order('created_at', { ascending: false })
          .limit(1)

        if (existingMovs && existingMovs.length > 0) {
          movementId = existingMovs[0].id
        }
      }

      if (isPaid) {
        const movementPayload = {
          type: 'income',
          account: data.account || 'banco',
          category: 'Quotas de Sócios',
          description: `Quota ${yearFormatted} — ${contactName}`,
          amount: Number(data.amount),
          date: data.paid_date || new Date().toISOString(),
          receipt_url: data.receipt_url || null,
          deleted_at: null,
        }

        if (movementId) {
          // Update linked financial movement
          const { error: movErr } = await (supabase as any)
            .from('financial_movements')
            .update(movementPayload)
            .eq('id', movementId)

          if (movErr) console.warn('Aviso ao atualizar movimento financeiro associado:', movErr)
        } else {
          // Create new financial movement
          const { data: newMov, error: movErr } = await (supabase as any)
            .from('financial_movements')
            .insert(movementPayload)
            .select('id')
            .single()

          if (!movErr && newMov?.id) {
            movementId = newMov.id
          } else if (movErr) {
            console.warn('Aviso ao criar movimento financeiro da quota:', movErr)
          }
        }
      } else if (movementId) {
        // Quota marked unpaid: soft delete linked financial movement
        const { error: movDelErr } = await (supabase as any)
          .from('financial_movements')
          .update({ deleted_at: new Date().toISOString() })
          .eq('id', movementId)

        if (movDelErr) console.warn('Aviso ao anular movimento financeiro:', movDelErr)
        movementId = null
      }

      const { id: _ignoredId, ...payloadWithoutId } = data as any
      const quotaPayload: any = {
        ...payloadWithoutId,
        movement_id: movementId,
        account: isPaid ? (data.account || 'banco') : null,
      }

      if (targetId) {
        try {
          await updateMutation.mutateAsync({ id: targetId, ...quotaPayload } as any)
        } catch (err: any) {
          if (
            err?.code === '42703' ||
            err?.message?.includes('column') ||
            err?.message?.includes('movement_id') ||
            err?.message?.includes('account')
          ) {
            const { movement_id, account, ...fallbackPayload } = quotaPayload
            await updateMutation.mutateAsync({ id: targetId, ...fallbackPayload } as any)
          } else {
            throw err
          }
        }
        toast.success('Quota atualizada com sucesso!')
      } else {
        try {
          await createMutation.mutateAsync(quotaPayload as any)
        } catch (err: any) {
          if (
            err?.code === '42703' ||
            err?.message?.includes('column') ||
            err?.message?.includes('movement_id') ||
            err?.message?.includes('account')
          ) {
            const { movement_id, account, ...fallbackPayload } = quotaPayload
            await createMutation.mutateAsync(fallbackPayload as any)
          } else {
            throw err
          }
        }
        toast.success('Quota registada com sucesso!')
      }

      // Invalidate both treasury and quotas queries so balances & lists reflect immediately
      queryClient.invalidateQueries({ queryKey: ['treasury'] })
      queryClient.invalidateQueries({ queryKey: ['quotas'] })
      handleCloseForm()
    } catch (error: any) {
      console.error('Failed to save quota:', error)
      setErrorMessage(getFriendlyErrorMessage(error, 'Erro ao guardar quota. Tente novamente.'))
    } finally {
      isSubmittingRef.current = false
    }
  }

  const handleDeleteQuota = async (id: string) => {
    try {
      const quotaToDelete = quotas?.find((q) => q.id === id)

      // Best-effort cleanup of linked treasury movement (must never block quota deletion)
      try {
        let movId = quotaToDelete?.movement_id

        if (!movId && quotaToDelete?.paid) {
          const contactName = quotaToDelete.contact?.name
          if (contactName) {
            const { data: existingMovs } = await (supabase as any)
              .from('financial_movements')
              .select('id')
              .eq('category', 'Quotas de Sócios')
              .ilike('description', `%${contactName}%`)
              .is('deleted_at', null)
              .order('created_at', { ascending: false })
              .limit(1)

            if (existingMovs && existingMovs.length > 0) {
              movId = existingMovs[0].id
            }
          }
        }

        if (movId) {
          await (supabase as any)
            .from('financial_movements')
            .update({ deleted_at: new Date().toISOString() })
            .eq('id', movId)
        }
      } catch (movErr) {
        console.warn('Aviso ao anular movimento financeiro associado:', movErr)
      }

      await deleteMutation.mutateAsync(id)
      queryClient.invalidateQueries({ queryKey: ['treasury'] })
      queryClient.invalidateQueries({ queryKey: ['quotas'] })
      queryClient.invalidateQueries({ queryKey: ['contacts'] })
      toast.success('Quota eliminada com sucesso!')
      handleCloseForm()
    } catch (error: any) {
      console.error('Failed to delete quota:', error)
      setErrorMessage(getFriendlyErrorMessage(error, 'Erro ao eliminar quota.'))
      throw error
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
          isLoading={createMutation.isPending || updateMutation.isPending || deleteMutation.isPending}
          onDelete={canWriteQuotas ? handleDeleteQuota : undefined}
        />
      )}

      <CustomDialog
        isOpen={!!errorMessage}
        title={errorMessage?.toLowerCase().includes('eliminar') ? 'Erro ao eliminar quota' : 'Erro ao guardar quota'}
        description={errorMessage || ''}
        variant="danger"
        confirmLabel="OK"
        onConfirm={() => setErrorMessage(null)}
      />
    </div>
  )
}
