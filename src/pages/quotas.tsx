import { useState, useRef, useMemo, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Plus, Search, ArrowLeft } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { QuotaList } from '@/features/quotas/components/quota-list'
import { QuotaForm } from '@/features/quotas/components/quota-form'
import { QuotaSummary } from '@/features/quotas/components/quota-summary'
import { useQuotas, useCreateQuota, useUpdateQuota, useDeleteQuota } from '@/features/quotas/api/use-quotas'
import { useContacts } from '@/features/contacts/api/use-contacts'
import { usePermissions } from '@/hooks/use-permissions'
import type { QuotaWithContact } from '@/features/quotas/components/quota-card'
import type { Quota, FinancialMovement } from '@/types/database'
import { cn } from '@/lib/utils'
import { supabase } from '@/lib/supabase'
import { formatSchoolYear, getCurrentSchoolYear, getSchoolYearOptions } from '@/lib/school-year'
import { isMovementMatchingQuota, getQuotaDeduplicationKey } from '@/lib/quota-utils'
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
  const [searchParams, setSearchParams] = useSearchParams()
  const isNew = searchParams.get('new') === '1' || searchParams.get('new') === 'true'
  const [activeTab, setActiveTab] = useState<FilterValue>('all')
  const [selectedYear, setSelectedYear] = useState<number>(getCurrentSchoolYear())
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingQuota, setEditingQuota] = useState<QuotaWithContact | undefined>()
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const isSubmittingRef = useRef(false)

  const schoolYearOptions = useMemo(() => getSchoolYearOptions(4, 1), [])

  const queryClient = useQueryClient()
  const { data: quotas, isLoading } = useQuotas()
  const { data: contacts } = useContacts('all')
  const createMutation = useCreateQuota()
  const updateMutation = useUpdateQuota()
  const deleteMutation = useDeleteQuota()
  const { toast } = useToast()
  
  const { canWrite, isFinancialReadOnly } = usePermissions()
  const canWriteQuotas = canWrite('quotas')

  useEffect(() => {
    if (isNew && !isFormOpen && !editingQuota) {
      setIsFormOpen(true)
    }
  }, [isNew, isFormOpen, editingQuota])

  const handleEditQuota = (quota: QuotaWithContact) => {
    if (!canWriteQuotas) return
    setEditingQuota(quota)
    setIsFormOpen(true)
  }

  const handleCloseForm = () => {
    setIsFormOpen(false)
    setEditingQuota(undefined)
    if (searchParams.get('new')) {
      const nextParams = new URLSearchParams(searchParams)
      nextParams.delete('new')
      setSearchParams(nextParams, { replace: true })
    }
  }

  const getContactName = (contactId: string) => {
    return contacts?.find((c) => c.id === contactId)?.name || editingQuota?.contact?.name || 'Associado'
  }

  // Auto-cleanup on mount: detect and soft-delete any legacy duplicate quota movements in database
  useEffect(() => {
    async function runDeduplication() {
      try {
        const [{ data: activeMovs }, { data: allQuotas }] = await Promise.all([
          (supabase as any)
            .from('financial_movements')
            .select('id, category, description, created_at, updated_at')
            .eq('category', 'Quotas de Sócios')
            .is('deleted_at', null)
            .order('updated_at', { ascending: false })
            .order('created_at', { ascending: false }),
          (supabase as any)
            .from('quotas')
            .select('id, paid, movement_id, year, contact:contacts(name)')
            .is('deleted_at', null),
        ])

        if (!activeMovs || activeMovs.length === 0) return

        const seenKeys = new Set<string>()
        const idsToPurge = new Set<string>()

        // 1. Purge movements belonging to unpaid quotas
        const quotasList = (allQuotas as any[]) || []
        const unpaidQuotas = quotasList.filter((q) => !q.paid)
        const paidQuotas = quotasList.filter((q) => q.paid)

        for (const uq of unpaidQuotas) {
          if (uq.movement_id) idsToPurge.add(uq.movement_id)
        }

        for (const mov of activeMovs) {
          if (idsToPurge.has(mov.id)) continue

          // If matches unpaid quota and no matching paid quota
          const isUnpaidMatch = unpaidQuotas.some((uq) =>
            isMovementMatchingQuota(mov, null, uq.contact?.name || '', uq.year)
          )
          if (isUnpaidMatch) {
            const hasMatchingPaid = paidQuotas.some((pq) =>
              isMovementMatchingQuota(mov, pq.movement_id, pq.contact?.name || '', pq.year)
            )
            if (!hasMatchingPaid) {
              idsToPurge.add(mov.id)
              continue
            }
          }

          // 2. Deduplicate using enhanced key
          const key = getQuotaDeduplicationKey(mov.description)
          if (key) {
            if (seenKeys.has(key)) {
              idsToPurge.add(mov.id)
            } else {
              seenKeys.add(key)
            }
          }
        }

        if (idsToPurge.size > 0) {
          const { error } = await (supabase as any)
            .from('financial_movements')
            .update({ deleted_at: new Date().toISOString() })
            .in('id', Array.from(idsToPurge))

          if (!error) {
            queryClient.invalidateQueries({ queryKey: ['treasury'] })
            queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
          }
        }
      } catch (err) {
        console.warn('Aviso na deduplicação em segundo plano:', err)
      }
    }

    runDeduplication()
  }, [queryClient])

  const handleSubmitForm = async (data: Partial<Quota>) => {
    // Guard against duplicate / concurrent submission
    if (isSubmittingRef.current) return
    isSubmittingRef.current = true

    try {
      const targetId = (data as any).id || editingQuota?.id
      const contactName = (data.contact_id ? getContactName(data.contact_id) : (editingQuota?.contact?.name || 'Associado')).trim()
      const targetYear = data.year ?? editingQuota?.year ?? getCurrentSchoolYear()
      const yearFormatted = formatSchoolYear(targetYear)
      const isPaid = !!data.paid
      let movementId = editingQuota?.movement_id || null

      // Fetch all active quota movements in treasury to find matches and prevent any duplicates
      const { data: allActiveQuotaMovs } = await (supabase as any)
        .from('financial_movements')
        .select('*')
        .eq('category', 'Quotas de Sócios')
        .is('deleted_at', null)
        .order('updated_at', { ascending: false })
        .order('created_at', { ascending: false })

      // Find all movements matching this quota (either by direct movementId or by member name + school year)
      const matchingMovs: FinancialMovement[] = (allActiveQuotaMovs || []).filter((m: FinancialMovement) =>
        isMovementMatchingQuota(m, movementId, contactName, targetYear)
      )

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

        if (matchingMovs.length > 0) {
          // Identify primary movement: prefer existing linked movementId, otherwise the most recent match
          const primaryMov = matchingMovs.find((m) => m.id === movementId) || matchingMovs[0]
          movementId = primaryMov.id

          // Update primary movement with latest details
          const { error: movErr } = await (supabase as any)
            .from('financial_movements')
            .update(movementPayload)
            .eq('id', movementId)

          if (movErr) console.warn('Aviso ao atualizar movimento financeiro associado:', movErr)

          // Soft delete any duplicate movements found for this member/year!
          const duplicateIds = matchingMovs
            .filter((m) => m.id !== movementId)
            .map((m) => m.id)

          if (duplicateIds.length > 0) {
            await (supabase as any)
              .from('financial_movements')
              .update({ deleted_at: new Date().toISOString() })
              .in('id', duplicateIds)
          }
        } else {
          // No movement exists yet: create single new movement
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
      } else {
        // Quota is unpaid or marked unpaid: soft delete ALL matching movements
        if (matchingMovs.length > 0) {
          const idsToDelete = matchingMovs.map((m) => m.id)
          const { error: movDelErr } = await (supabase as any)
            .from('financial_movements')
            .update({ deleted_at: new Date().toISOString() })
            .in('id', idsToDelete)

          if (movDelErr) console.warn('Aviso ao anular movimento financeiro:', movDelErr)
        }
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

      // Invalidate treasury, quotas, and dashboard queries so balances & lists reflect immediately
      queryClient.invalidateQueries({ queryKey: ['treasury'] })
      queryClient.invalidateQueries({ queryKey: ['quotas'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
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

      // Best-effort cleanup of ALL linked treasury movements (must never block quota deletion)
      try {
        const contactName = quotaToDelete?.contact?.name || 'Associado'
        const targetYear = quotaToDelete?.year ?? getCurrentSchoolYear()
        const movId = quotaToDelete?.movement_id

        const { data: allActiveQuotaMovs } = await (supabase as any)
          .from('financial_movements')
          .select('*')
          .eq('category', 'Quotas de Sócios')
          .is('deleted_at', null)

        const matchingMovs = (allActiveQuotaMovs || []).filter((m: FinancialMovement) =>
          isMovementMatchingQuota(m, movId, contactName, targetYear)
        )

        if (matchingMovs.length > 0) {
          const idsToDelete = matchingMovs.map((m: FinancialMovement) => m.id)
          await (supabase as any)
            .from('financial_movements')
            .update({ deleted_at: new Date().toISOString() })
            .in('id', idsToDelete)
        }
      } catch (movErr) {
        console.warn('Aviso ao anular movimentos financeiros associados:', movErr)
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
    <div className="relative min-h-[calc(100vh-4rem)] bg-background pb-4">
      <div className="sticky top-0 z-10 bg-background/95 pb-2 pt-6 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Link
                to="/menu"
                aria-label="Voltar ao Menu"
                className="flex h-9 w-9 items-center justify-center rounded-full text-secondary-600 hover:bg-warm-100 hover:text-foreground active:scale-95 transition-all -ml-1"
              >
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <h1 className="text-xl font-bold text-foreground">Quotas</h1>
              {isFinancialReadOnly() && (
                <span className="rounded-full bg-warm-200 px-2 py-0.5 text-xs font-medium text-secondary-600">
                  Apenas leitura
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5">
              {canWriteQuotas && (
                <button
                  type="button"
                  onClick={() => setIsFormOpen(true)}
                  aria-label="+ Registar nova quota"
                  className="flex items-center gap-1 rounded-full bg-primary-500 px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-primary-600 transition-all active:scale-95 shrink-0"
                >
                  <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
                  <span>Criar</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  const next = !isSearchOpen
                  setIsSearchOpen(next)
                  if (!next) setSearchQuery('')
                }}
                aria-label={isSearchOpen ? "Fechar pesquisa" : "Abrir pesquisa"}
                className={cn(
                  "rounded-full p-2 transition-colors hover:bg-warm-100",
                  isSearchOpen ? "bg-warm-200 text-primary-600" : "text-muted hover:text-foreground"
                )}
              >
                <Search className="h-5 w-5" />
              </button>
              <MenuAlerts />
            </div>
          </div>

          {/* Search Bar (Expandable) */}
          {isSearchOpen && (
            <div className="mt-3 animate-in fade-in slide-in-from-top-2">
              <input
                type="search"
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                aria-label="Pesquisar quotas"
                placeholder="Pesquisar por associado, educando ou turma..."
                className="w-full rounded-[var(--radius-button)] border border-warm-200 bg-surface px-4 py-2 text-sm text-foreground placeholder:text-muted focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-200"
              />
            </div>
          )}
        </div>

        {/* Tabs & School Year Row */}
        <div className="mt-4 flex items-center justify-between gap-2 px-4 pb-2">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide">
            {tabs.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setActiveTab(tab.value)}
                className={cn(
                  'whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium transition-colors',
                  activeTab === tab.value
                    ? 'bg-primary-500 text-white shadow-xs font-semibold'
                    : 'bg-warm-100 text-secondary-600 hover:bg-warm-200'
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Seletor de Ano Letivo */}
          <div className="shrink-0">
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              aria-label="Filtrar por Ano Letivo"
              className="rounded-full border border-warm-200 bg-surface px-3 py-1 text-xs font-bold text-secondary-800 shadow-2xs focus:border-primary-400 focus:outline-none focus:ring-1 focus:ring-primary-300"
            >
              {schoolYearOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Quota Summary Card */}
      <div className="px-4 pt-3 pb-1">
        <QuotaSummary
          quotas={quotas || []}
          selectedYear={selectedYear}
          isLoading={isLoading}
        />
      </div>

      <div className="px-4">
        <QuotaList 
          quotas={quotas} 
          filter={activeTab} 
          searchQuery={searchQuery}
          selectedYear={selectedYear}
          isLoading={isLoading} 
          onEdit={canWriteQuotas ? handleEditQuota : undefined} 
        />
      </div>

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
