import { useState, useRef, useMemo } from 'react'
import { X, Upload, Trash2, UserPlus, Landmark, Coins } from 'lucide-react'
import type { Quota, FinancialAccount } from '@/types/database'
import { useContacts, useCreateContact } from '@/features/contacts/api/use-contacts'
import { useQuotas } from '../api/use-quotas'
import { getCurrentSchoolYear, getSchoolYearOptions, formatSchoolYear } from '@/lib/school-year'
import { supabase } from '@/lib/supabase'

import { useHardwareBack } from '@/hooks/use-hardware-back'
import { UnsavedDialog } from '@/components/ui/unsaved-dialog'
import { CustomSelect } from '@/components/ui/custom-select'
import { CustomDialog } from '@/components/ui/custom-dialog'

interface QuotaFormProps {
  quota?: Quota
  onClose: () => void
  onSubmit: (data: Partial<Quota>) => void
  isLoading?: boolean
  onDelete?: (id: string) => Promise<void>
}

function toDateString(isoString?: string | null) {
  if (!isoString) return new Date().toISOString().split('T')[0]
  return isoString.split('T')[0]
}

export function QuotaForm({ quota, onClose, onSubmit, isLoading, onDelete }: QuotaFormProps) {
  const isExistingQuota = !!quota
  const [showUnsaved, setShowUnsaved] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const isEditing = true
  const formRef = useRef<HTMLFormElement>(null)

  const handleCloseClick = () => {
    if (isDirty) setShowUnsaved(true)
    else onClose()
  }

  useHardwareBack(true, handleCloseClick)

  const handleSaveAndClose = () => {
    setShowUnsaved(false)
    formRef.current?.requestSubmit()
  }

  const handleConfirmDelete = async () => {
    if (!quota || !onDelete) return
    setIsDeleting(true)
    try {
      await onDelete(quota.id)
      onClose()
    } finally {
      setIsDeleting(false)
      setShowDeleteConfirm(false)
    }
  }

  const [contactId, setContactId] = useState(quota?.contact_id ?? '')
  const [year, setYear] = useState<number>(quota?.year ?? getCurrentSchoolYear())
  const [amount, setAmount] = useState(quota?.amount ?? '15')
  const [paid, setPaid] = useState(quota?.paid ?? false)
  const [paidDate, setPaidDate] = useState(quota?.paid_date ? toDateString(quota.paid_date) : '')
  const [paymentMethod, setPaymentMethod] = useState(quota?.payment_method ?? '')
  const [account, setAccount] = useState<FinancialAccount>(quota?.account ?? 'banco')
  const [file, setFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)

  // Quick Create Member Modal State
  const [showNewMemberDialog, setShowNewMemberDialog] = useState(false)
  const [newMemberName, setNewMemberName] = useState('')
  const [isCreatingMember, setIsCreatingMember] = useState(false)

  const schoolYearOptions = useMemo(() => getSchoolYearOptions(4, 1), [])

  // Fetch contacts and all quotas to calculate eligibility
  const { data: contacts, isLoading: isLoadingContacts } = useContacts('all')
  const { data: allQuotas = [] } = useQuotas()
  const createContactMutation = useCreateContact()

  // Find contact IDs that already have a paid quota in the selected school year
  const paidContactIdsThisYear = useMemo(() => {
    const set = new Set<string>()
    allQuotas.forEach((q) => {
      if (q.year === year && q.paid && q.id !== quota?.id) {
        set.add(q.contact_id)
      }
    })
    return set
  }, [allQuotas, year, quota?.id])

  // Filter contacts to only members who have not yet paid quota this school year
  const eligibleContacts = useMemo(() => {
    return (contacts || []).filter((c) => {
      // If editing, always include currently assigned contact
      if (c.id === contactId) return true
      // Exclude if already paid in this school year
      if (paidContactIdsThisYear.has(c.id)) return false
      // Must be an associado or member
      return c.is_member || c.category === 'associado'
    })
  }, [contacts, contactId, paidContactIdsThisYear])

  const isDirty = (
    contactId !== (quota?.contact_id ?? '') ||
    year !== (quota?.year ?? getCurrentSchoolYear()) ||
    amount !== (quota?.amount ?? '15') ||
    paid !== (quota?.paid ?? false) ||
    paidDate !== (quota?.paid_date ? toDateString(quota.paid_date) : '') ||
    paymentMethod !== (quota?.payment_method ?? '') ||
    account !== (quota?.account ?? 'banco') ||
    file !== null
  )


  const handleQuickCreateMember = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMemberName.trim()) return
    try {
      setIsCreatingMember(true)
      const created = await createContactMutation.mutateAsync({
        name: newMemberName.trim(),
        category: 'associado',
        is_member: true,
      } as any)
      if (created?.id) {
        setContactId(created.id)
      }
      setNewMemberName('')
      setShowNewMemberDialog(false)
    } catch (err: any) {
      console.error('Failed to quick create member:', err)
      setErrorMessage(err?.message || 'Erro ao criar associado.')
    } finally {
      setIsCreatingMember(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    let finalReceiptUrl = quota?.receipt_url || null

    if (file) {
      try {
        setIsUploading(true)
        const fileExt = file.name.split('.').pop()
        const fileName = `quotas/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
        
        const { error: uploadError } = await (supabase as any).storage
          .from('receipts')
          .upload(fileName, file)

        if (uploadError) throw uploadError

        const { data } = (supabase as any).storage
          .from('receipts')
          .getPublicUrl(fileName)

        finalReceiptUrl = data.publicUrl
      } catch (err: any) {
        console.error('Error uploading receipt:', err)
        setErrorMessage(err?.message || 'Erro ao fazer upload do recibo. Verifique se o bucket "receipts" foi criado no Supabase.')
        setIsUploading(false)
        return
      }
    }

    const finalPaidDate = paid && paidDate ? new Date(`${paidDate}T12:00:00Z`).toISOString() : null

    onSubmit({
      contact_id: contactId,
      year: Number(year),
      amount: Number(amount),
      paid,
      paid_date: finalPaidDate,
      payment_method: paymentMethod || null,
      account: paid ? account : null,
      receipt_url: finalReceiptUrl,
    })
  }

  return (
    <div className="fixed inset-0 z-[100] flex justify-center bg-black/40 backdrop-blur-xs transition-opacity animate-in fade-in duration-200">{/* Phone container */}<div className="flex w-full max-w-[430px] flex-col bg-background shadow-2xl animate-in slide-in-from-bottom-6 duration-200 ease-out">
      <div className="flex items-center justify-between border-b border-warm-200 bg-surface px-4 py-4">
        <h2 className="text-lg font-bold text-foreground">
          {quota ? 'Editar Quota' : 'Nova Quota'}
        </h2>
        <div className="flex items-center gap-1">
          {isExistingQuota && onDelete && (
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              aria-label="Eliminar quota"
              className="rounded-full p-2 text-red-400 hover:bg-red-50"
            >
              <Trash2 className="h-5 w-5" />
            </button>
          )}
          <button onClick={handleCloseClick} aria-label="Fechar formulário" className="rounded-full p-2 text-muted hover:bg-warm-100">
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <form ref={formRef}   id="quota-form"  onSubmit={handleSubmit} className="flex flex-col gap-4">
          
          <div className="flex flex-col gap-1.5 z-[60]">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-secondary-700">
                Associado <span className="text-primary-500">*</span>
              </label>
              {!isExistingQuota && (
                <button
                  type="button"
                  onClick={() => setShowNewMemberDialog(true)}
                  className="flex items-center gap-1 text-xs font-semibold text-primary-600 hover:text-primary-700 hover:underline"
                >
                  <UserPlus className="h-3.5 w-3.5" />
                  <span>+ Novo Associado</span>
                </button>
              )}
            </div>
            <CustomSelect disabled={!isEditing || !!quota} 
              value={contactId}
              onChange={(val) => setContactId(val)}
              options={eligibleContacts.map(c => ({ 
                label: `${c.name}${c.metadata?.educando ? ` (${c.metadata.educando})` : ''}${c.is_member ? ' [Sócio]' : ''}`, 
                value: c.id 
              }))}
              placeholder={isLoadingContacts ? 'A carregar associados...' : eligibleContacts.length === 0 ? 'Sem associados pendentes para este ano' : 'Selecione o associado'}
              required
            />
            <span className="text-xs text-muted">
              Apenas surgem associados que ainda não pagaram quota no ano letivo {formatSchoolYear(year)}.
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5 z-[55]">
              <label className="text-sm font-medium text-secondary-700">Ano Letivo <span className="text-primary-500">*</span></label>
              <CustomSelect disabled={!isEditing} 
                value={String(year)}
                onChange={(val) => setYear(Number(val))}
                options={schoolYearOptions.map(opt => ({
                  label: opt.label,
                  value: String(opt.value),
                }))}
                required
              />
            </div>
            
            <div className="flex flex-col gap-1.5">
              <label htmlFor="quota-amount" className="text-sm font-medium text-secondary-700">Valor (€) <span className="text-primary-500">*</span></label>
              <input id="quota-amount" disabled={!isEditing} 
                type="number"
                step="0.01"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                className="rounded-[var(--radius-button)] border border-warm-200 bg-surface px-3 py-2 text-sm focus:border-primary-400 focus:outline-none focus:ring-1 focus:ring-primary-400"
              />
            </div>
          </div>

          <div className="my-2 border-t border-warm-200" />

          <label htmlFor="quota-paid" className="flex items-center gap-3 rounded-[var(--radius-card)] border border-warm-200 bg-surface p-4">
            <input id="quota-paid" disabled={!isEditing} 
              type="checkbox"
              checked={paid}
              onChange={(e) => setPaid(e.target.checked)}
              className="h-5 w-5 rounded border-warm-300 text-primary-500 focus:ring-primary-400"
            />
            <div className="flex flex-col">
              <span className="font-bold text-foreground">Quota Paga</span>
              <span className="text-xs text-muted">Marcar esta quota como regularizada e registar na tesouraria.</span>
            </div>
          </label>

          {paid && (
            <div className="flex flex-col gap-3 rounded-[var(--radius-card)] bg-warm-50 p-4 border border-warm-200/80">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="quota-paid-date" className="text-xs font-medium text-secondary-700">Data de Pagamento</label>
                  <input id="quota-paid-date" disabled={!isEditing} 
                    type="date"
                    value={paidDate}
                    onChange={(e) => setPaidDate(e.target.value)}
                    required={paid}
                    className="rounded-[var(--radius-button)] border border-warm-200 bg-surface px-3 py-2 text-sm focus:border-primary-400 focus:outline-none focus:ring-1 focus:ring-primary-400"
                  />
                </div>
                <div className="flex flex-col gap-1.5 z-[50]">
                  <label className="text-xs font-medium text-secondary-700">Método</label>
                  <CustomSelect disabled={!isEditing} 
                    value={paymentMethod}
                    onChange={(val) => {
                      setPaymentMethod(val)
                      if (val === 'numerario') setAccount('caixa')
                      else if (val === 'transferencia' || val === 'mbway') setAccount('banco')
                    }}
                    options={[
                      { label: '(Não definido)', value: '' },
                      { label: 'Numerário', value: 'numerario' },
                      { label: 'MB Way', value: 'mbway' },
                      { label: 'Transferência Bancária', value: 'transferencia' },
                    ]}
                    placeholder="(Não definido)"
                  />
                </div>
              </div>

              {/* Conta de Tesouraria */}
              <div className="flex flex-col gap-1.5 pt-1">
                <label className="text-xs font-semibold uppercase tracking-wider text-secondary-600">
                  Conta de Tesouraria <span className="text-primary-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2 rounded-[var(--radius-button)] bg-warm-200/70 p-1">
                  <button
                    type="button"
                    disabled={!isEditing}
                    onClick={() => setAccount('banco')}
                    className={`flex items-center justify-center gap-2 rounded-md py-2 text-sm font-semibold transition-all ${
                      account === 'banco'
                        ? 'bg-white text-secondary-900 shadow-sm'
                        : 'text-secondary-600 hover:text-foreground'
                    }`}
                  >
                    <Landmark className="h-4 w-4 text-blue-600" />
                    <span>Banco</span>
                  </button>
                  <button
                    type="button"
                    disabled={!isEditing}
                    onClick={() => setAccount('caixa')}
                    className={`flex items-center justify-center gap-2 rounded-md py-2 text-sm font-semibold transition-all ${
                      account === 'caixa'
                        ? 'bg-white text-secondary-900 shadow-sm'
                        : 'text-secondary-600 hover:text-foreground'
                    }`}
                  >
                    <Coins className="h-4 w-4 text-amber-600" />
                    <span>Caixa</span>
                  </button>
                </div>
                <span className="text-xs text-secondary-500">
                  O valor entra diretamente na conta {account === 'banco' ? 'Bancária' : 'de Caixa'} na Tesouraria.
                </span>
              </div>
            </div>
          )}

          {paid && (
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-secondary-700">Upload de Recibo (Opcional)</label>
              
              <label htmlFor="quota-receipt" className="flex cursor-pointer flex-col items-center justify-center rounded-[var(--radius-card)] border-2 border-dashed border-warm-200 bg-surface py-6 text-center transition-colors hover:bg-warm-50">
                <Upload className="mb-2 h-6 w-6 text-secondary-400" />
                <span className="text-sm font-medium text-foreground">
                  {file ? file.name : 'Tocar para anexar recibo'}
                </span>
                <span className="mt-1 text-xs text-muted">PDF ou Imagem</span>
                <input id="quota-receipt" disabled={!isEditing} 
                  type="file"
                  accept="image/*,.pdf"
                  className="hidden"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                />
              </label>
              
              {quota?.receipt_url && !file && (
                <p className="text-xs text-green-600">Recibo atual já se encontra anexado.</p>
              )}
            </div>
          )}

        
<div className="border-t border-warm-200 bg-surface p-4 flex flex-col gap-2">
          {isExistingQuota && onDelete && (
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              disabled={isDeleting}
              className="flex w-full items-center justify-center rounded-[var(--radius-button)] border border-red-200 bg-red-50/70 py-2.5 text-sm font-medium text-red-600 transition-all hover:bg-red-100 active:scale-95 disabled:opacity-50"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Eliminar Quota
            </button>
          )}
          <button
            type="submit"
            form="quota-form"
            disabled={isLoading || isUploading || isLoadingContacts}
            className="flex w-full items-center justify-center rounded-[var(--radius-button)] bg-primary-400 py-3 text-sm font-medium text-white shadow-sm transition-all hover:bg-primary-500 active:scale-95 disabled:opacity-50"
          >
            {isUploading ? 'A anexar recibo...' : isLoading ? 'A Guardar...' : (quota ? 'Guardar Quota' : 'Registar Quota')}
          </button>
        </div>
</form>
      </div>

      
    
      <UnsavedDialog
        isOpen={showUnsaved}
        onCancel={() => setShowUnsaved(false)}
        onDiscard={() => {
          setShowUnsaved(false)
          onClose()
        }}
        onSave={handleSaveAndClose}
      />

      <CustomDialog
        isOpen={!!errorMessage}
        title="Erro no comprovativo"
        description={errorMessage || ''}
        variant="danger"
        confirmLabel="OK"
        onConfirm={() => setErrorMessage(null)}
      />

      <CustomDialog
        isOpen={showDeleteConfirm}
        title="Eliminar Quota?"
        description="Tem a certeza que pretende eliminar esta quota? Esta ação não pode ser revertida."
        variant="danger"
        confirmLabel="Sim, Eliminar"
        cancelLabel="Cancelar"
        isLoading={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />

      {/* Quick Add Member Modal */}
      {showNewMemberDialog && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-[var(--radius-card)] bg-surface p-5 shadow-2xl border border-warm-200 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-base font-bold text-foreground">Criar Novo Associado</h3>
              <button
                type="button"
                onClick={() => {
                  setShowNewMemberDialog(false)
                  setNewMemberName('')
                }}
                className="rounded-full p-1 text-muted hover:bg-warm-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="text-xs text-secondary-500 mb-4">
              Introduza o nome do associado. O contacto será criado imediatamente e poderá completar os restantes dados mais tarde nos Contactos.
            </p>
            <form onSubmit={handleQuickCreateMember} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="new-member-name" className="text-xs font-semibold text-secondary-700">
                  Nome do Associado <span className="text-primary-500">*</span>
                </label>
                <input
                  id="new-member-name"
                  type="text"
                  autoFocus
                  required
                  value={newMemberName}
                  onChange={(e) => setNewMemberName(e.target.value)}
                  placeholder="Nome completo"
                  className="rounded-[var(--radius-button)] border border-warm-200 bg-surface px-3 py-2 text-sm focus:border-primary-400 focus:outline-none focus:ring-1 focus:ring-primary-400"
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-warm-100">
                <button
                  type="button"
                  onClick={() => {
                    setShowNewMemberDialog(false)
                    setNewMemberName('')
                  }}
                  className="rounded-lg px-3 py-1.5 text-xs font-medium text-secondary-600 hover:bg-warm-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isCreatingMember || !newMemberName.trim()}
                  className="rounded-lg bg-primary-500 px-4 py-1.5 text-xs font-bold text-white hover:bg-primary-600 disabled:opacity-50"
                >
                  {isCreatingMember ? 'A criar...' : 'Criar e Selecionar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  </div>
  )
}
