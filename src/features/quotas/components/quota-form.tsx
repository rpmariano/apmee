import { useState, useRef } from 'react'
import { X, Upload } from 'lucide-react'
import type { Quota } from '@/types/database'
import { useContacts } from '@/features/contacts/api/use-contacts'
import { supabase } from '@/lib/supabase'

import { useHardwareBack } from '@/hooks/use-hardware-back'
import { UnsavedDialog } from '@/components/ui/unsaved-dialog'
import { CustomSelect } from '@/components/ui/custom-select'

interface QuotaFormProps {
  quota?: Quota
  onClose: () => void
  onSubmit: (data: Partial<Quota>) => void
  isLoading?: boolean
}

function toDateString(isoString?: string | null) {
  if (!isoString) return new Date().toISOString().split('T')[0]
  return isoString.split('T')[0]
}

export function QuotaForm({ quota, onClose, onSubmit, isLoading }: QuotaFormProps) {

  
  const [showUnsaved, setShowUnsaved] = useState(false)
  const [isEditing, setIsEditing] = useState(!quota)
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

  const [contactId, setContactId] = useState(quota?.contact_id ?? '')
  const [year, setYear] = useState(quota?.year ?? new Date().getFullYear())
  const [amount, setAmount] = useState(quota?.amount ?? '15')
  const [paid, setPaid] = useState(quota?.paid ?? false)
  const [paidDate, setPaidDate] = useState(quota?.paid_date ? toDateString(quota.paid_date) : '')
  const [paymentMethod, setPaymentMethod] = useState(quota?.payment_method ?? '')
  const [file, setFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)

  const isDirty = (
    contactId !== (quota?.contact_id ?? '') ||
    year !== (quota?.year ?? new Date().getFullYear()) ||
    amount !== (quota?.amount ?? '15') ||
    paid !== (quota?.paid ?? false) ||
    paidDate !== (quota?.paid_date ? toDateString(quota.paid_date) : '') ||
    paymentMethod !== (quota?.payment_method ?? '') ||
    file !== null
  )


  // Fetch contacts to populate the dropdown
  const { data: contacts, isLoading: isLoadingContacts } = useContacts('members')

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
      } catch (err) {
        console.error('Error uploading receipt:', err)
        alert('Erro ao fazer upload do recibo. Verifique se o bucket "receipts" foi criado no Supabase.')
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
      receipt_url: finalReceiptUrl,
    })
  }

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-background">
      <div className="flex items-center justify-between border-b border-warm-200 bg-surface px-4 py-4">
        <h2 className="text-lg font-bold text-foreground">
          {!isEditing ? 'Detalhes' : (quota ? 'Editar' : 'Novo')}
        </h2>
        <button onClick={handleCloseClick} className="rounded-full p-2 text-muted hover:bg-warm-100">
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <form ref={formRef}   id="quota-form"  onSubmit={handleSubmit} className="flex flex-col gap-4">
          
          <div className="flex flex-col gap-1.5 z-[60]">
            <label className="text-sm font-medium text-secondary-700">Associado <span className="text-primary-500">*</span></label>
            <CustomSelect disabled={!isEditing || !!quota} 
              value={contactId}
              onChange={(val) => setContactId(val)}
              options={(contacts || []).map(c => ({ label: c.name, value: c.id }))}
              placeholder={isLoadingContacts ? 'A carregar associados...' : 'Selecione o associado'}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-secondary-700">Ano Letivo / Civil <span className="text-primary-500">*</span></label>
              <input disabled={!isEditing} 
                type="number"
                min="2000"
                max="2100"
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                required
                className="rounded-[var(--radius-button)] border border-warm-200 bg-surface px-3 py-2 text-sm focus:border-primary-400 focus:outline-none focus:ring-1 focus:ring-primary-400"
              />
            </div>
            
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-secondary-700">Valor (€) <span className="text-primary-500">*</span></label>
              <input disabled={!isEditing} 
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

          <label className="flex items-center gap-3 rounded-[var(--radius-card)] border border-warm-200 bg-surface p-4">
            <input disabled={!isEditing} 
              type="checkbox"
              checked={paid}
              onChange={(e) => setPaid(e.target.checked)}
              className="h-5 w-5 rounded border-warm-300 text-primary-500 focus:ring-primary-400"
            />
            <div className="flex flex-col">
              <span className="font-bold text-foreground">Quota Paga</span>
              <span className="text-xs text-muted">Marcar esta quota como regularizada.</span>
            </div>
          </label>

          {paid && (
            <div className="grid grid-cols-2 gap-4 rounded-[var(--radius-card)] bg-warm-50 p-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-secondary-700">Data de Pagamento</label>
                <input disabled={!isEditing} 
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
                  onChange={(val) => setPaymentMethod(val)}
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
          )}

          {paid && (
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-secondary-700">Upload de Recibo (Opcional)</label>
              
              <label className="flex cursor-pointer flex-col items-center justify-center rounded-[var(--radius-card)] border-2 border-dashed border-warm-200 bg-surface py-6 text-center transition-colors hover:bg-warm-50">
                <Upload className="mb-2 h-6 w-6 text-secondary-400" />
                <span className="text-sm font-medium text-foreground">
                  {file ? file.name : 'Tocar para anexar recibo'}
                </span>
                <span className="mt-1 text-xs text-muted">PDF ou Imagem</span>
                <input disabled={!isEditing} 
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

        
<div className="border-t border-warm-200 bg-surface p-4">
          {isEditing ? (
            <button
          type="submit"
          form="quota-form"
          disabled={isLoading || isUploading || isLoadingContacts}
          className="flex w-full items-center justify-center rounded-[var(--radius-button)] bg-primary-400 py-3 text-sm font-medium text-white shadow-sm transition-all hover:bg-primary-500 active:scale-95 disabled:opacity-50"
        >
          {isUploading ? 'A anexar recibo...' : isLoading ? 'A Guardar...' : 'Guardar Quota'}
        </button>
          ) : (
            <button
              type="button"
              onClick={(e) => { e.preventDefault(); setIsEditing(true); }}
              className="flex w-full items-center justify-center rounded-[var(--radius-button)] bg-primary-400 py-3 text-sm font-medium text-white shadow-sm transition-all hover:bg-primary-500 active:scale-95"
            >
              Editar Quota
            </button>
          )}
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
</div>
  )
}
