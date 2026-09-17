import { useState, useRef } from 'react'
import { X, Upload } from 'lucide-react'
import type { FinancialMovement, FinancialType } from '@/types/database'
import { supabase } from '@/lib/supabase'

import { useHardwareBack } from '@/hooks/use-hardware-back'
import { UnsavedDialog } from '@/components/ui/unsaved-dialog'
import { CustomSelect } from '@/components/ui/custom-select'
import { useEvents } from '@/features/events/api/use-events'

const INCOME_CATEGORIES = [
  { label: 'Quotas de Sócios', value: 'Quotas de Sócios' },
  { label: 'Eventos / Festas', value: 'Eventos / Festas' },
  { label: 'Venda de Merchandising', value: 'Venda de Merchandising' },
  { label: 'Donativos / Patrocínios', value: 'Donativos / Patrocínios' },
  { label: 'Subsídios', value: 'Subsídios' },
  { label: 'Outras Receitas', value: 'Outras Receitas' }
]

const EXPENSE_CATEGORIES = [
  { label: 'Material Escolar / Didático', value: 'Material Escolar / Didático' },
  { label: 'Eventos / Festas', value: 'Eventos / Festas' },
  { label: 'Bens e Equipamentos', value: 'Bens e Equipamentos' },
  { label: 'Serviços Administrativos', value: 'Serviços Administrativos' },
  { label: 'Manutenção / Obras', value: 'Manutenção / Obras' },
  { label: 'Comunicação / Marketing', value: 'Comunicação / Marketing' },
  { label: 'Outras Despesas', value: 'Outras Despesas' }
]

interface MovementFormProps {
  movement?: FinancialMovement
  onClose: () => void
  onSubmit: (data: Partial<FinancialMovement>) => void
  isLoading?: boolean
}

// Convert ISO to YYYY-MM-DD for date input
function toDateString(isoString?: string | null) {
  if (!isoString) return new Date().toISOString().split('T')[0]
  return isoString.split('T')[0]
}

export function MovementForm({ movement, onClose, onSubmit, isLoading }: MovementFormProps) {

  
  const [showUnsaved, setShowUnsaved] = useState(false)
  const [isEditing, setIsEditing] = useState(!movement)
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

  const [type, setType] = useState<FinancialType>(movement?.type ?? 'expense')
  const [amount, setAmount] = useState(movement?.amount ?? '')
  const [description, setDescription] = useState(movement?.description ?? '')
  const [category, setCategory] = useState(movement?.category ?? '')
  const [eventId, setEventId] = useState(movement?.event_id ?? '')
  const { data: events } = useEvents()
  const [date, setDate] = useState(toDateString(movement?.date))
  const [file, setFile] = useState<File | null>(null)

  const isDirty = (
    type !== (movement?.type ?? 'expense') ||
    amount !== (movement?.amount ?? '') ||
    description !== (movement?.description ?? '') ||
    category !== (movement?.category ?? '') ||
    eventId !== (movement?.event_id ?? '') ||
    date !== toDateString(movement?.date) ||
    file !== null
  )

  const [isUploading, setIsUploading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Add time part to make it a valid TIMESTAMPTZ
    const dateIso = date ? new Date(`${date}T12:00:00Z`).toISOString() : new Date().toISOString()

    let finalReceiptUrl = movement?.receipt_url || null

    if (file) {
      try {
        setIsUploading(true)
        const fileExt = file.name.split('.').pop()
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
        
        const { error: uploadError } = await (supabase as any).storage
          .from('receipts')
          .upload(fileName, file)

        if (uploadError) throw uploadError

        const { data } = (supabase as any).storage
          .from('receipts')
          .getPublicUrl(fileName)

        finalReceiptUrl = data.publicUrl
      } catch (err) {
        console.error('Error uploading file:', err)
        alert('Erro ao fazer upload da fatura. Verifique se o bucket "receipts" foi criado no Supabase.')
        setIsUploading(false)
        return // Stop submission if upload fails
      }
    }

    onSubmit({
      type,
      amount: Number(amount),
      description,
      category: category || null,
      date: dateIso,
      receipt_url: finalReceiptUrl,
    })
  }

  return (
    <div className="fixed inset-0 z-[100] flex justify-center bg-warm-100">{/* Phone container */}<div className="flex w-full max-w-[430px] flex-col bg-background shadow-xl">
      <div className="flex items-center justify-between border-b border-warm-200 bg-surface px-4 py-4">
        <h2 className="text-lg font-bold text-foreground">
          {!isEditing ? 'Detalhes' : (movement ? 'Editar Movimento' : 'Novo Movimento')}
        </h2>
        <button onClick={handleCloseClick} className="rounded-full p-2 text-muted hover:bg-warm-100">
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <form ref={formRef}   id="movement-form"  onSubmit={handleSubmit} className="flex flex-col gap-4">
          
          {/* Type Toggle */}
          <div className="flex rounded-[var(--radius-button)] bg-warm-100 p-1">
            <button
              type="button"
              onClick={() => {
                setType('expense')
                setCategory('')
              }}
              className={`flex-1 rounded-md py-2 text-sm font-medium transition-all ${
                type === 'expense' ? 'bg-white text-red-600 shadow-sm' : 'text-secondary-600 hover:text-foreground'
              }`}
            >
              Despesa
            </button>
            <button
              type="button"
              onClick={() => {
                setType('income')
                setCategory('')
              }}
              className={`flex-1 rounded-md py-2 text-sm font-medium transition-all ${
                type === 'income' ? 'bg-white text-green-600 shadow-sm' : 'text-secondary-600 hover:text-foreground'
              }`}
            >
              Receita
            </button>
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
              className="rounded-[var(--radius-button)] border border-warm-200 bg-surface px-3 py-2 text-lg font-bold text-foreground focus:border-primary-400 focus:outline-none focus:ring-1 focus:ring-primary-400"
              placeholder="0.00"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-secondary-700">Descrição <span className="text-primary-500">*</span></label>
            <input disabled={!isEditing} 
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              className="rounded-[var(--radius-button)] border border-warm-200 bg-surface px-3 py-2 text-sm focus:border-primary-400 focus:outline-none focus:ring-1 focus:ring-primary-400"
              placeholder="Ex: Compra de Resmas de Papel"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5 z-[60]">
              <label className="text-sm font-medium text-secondary-700">Categoria</label>
              <CustomSelect disabled={!isEditing} 
                value={category}
                onChange={(val) => setCategory(val)}
                options={type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES}
                placeholder="Selecione ou crie..."
                creatable
              />
            </div>
            
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-secondary-700">Data <span className="text-primary-500">*</span></label>
              <input disabled={!isEditing} 
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="rounded-[var(--radius-button)] border border-warm-200 bg-surface px-3 py-2 text-sm focus:border-primary-400 focus:outline-none focus:ring-1 focus:ring-primary-400"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5 z-[50]">
              <label className="text-sm font-medium text-secondary-700">Evento (Opcional)</label>
              <CustomSelect disabled={!isEditing} 
                value={eventId}
                onChange={(val) => setEventId(val)}
                options={(events || []).map(e => ({ label: e.title, value: e.id }))}
                placeholder="Sem evento"
              />
            </div>

          <div className="my-2 border-t border-warm-200" />

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-secondary-700">Fatura / Comprovativo</label>
            
            <label className="flex cursor-pointer flex-col items-center justify-center rounded-[var(--radius-card)] border-2 border-dashed border-warm-200 bg-surface py-6 text-center transition-colors hover:bg-warm-50">
              <Upload className="mb-2 h-6 w-6 text-secondary-400" />
              <span className="text-sm font-medium text-foreground">
                {file ? file.name : 'Tocar para enviar documento'}
              </span>
              <span className="mt-1 text-xs text-muted">Imagens ou PDF</span>
              <input disabled={!isEditing} 
                type="file"
                accept="image/*,.pdf"
                className="hidden"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
            </label>
            
            {movement?.receipt_url && !file && (
              <p className="text-xs text-green-600">Fatura atual anexada.</p>
            )}
          </div>

        
<div className="border-t border-warm-200 bg-surface p-4">
          {isEditing ? (
            <button
          type="submit"
          form="movement-form"
          disabled={isLoading || isUploading}
          className="flex w-full items-center justify-center rounded-[var(--radius-button)] bg-primary-400 py-3 text-sm font-medium text-white shadow-sm transition-all hover:bg-primary-500 active:scale-95 disabled:opacity-50"
        >
          {isUploading ? 'A enviar documento...' : isLoading ? 'A Guardar...' : 'Guardar Movimento'}
        </button>
          ) : (
            <button
              type="button"
              onClick={(e) => { e.preventDefault(); setIsEditing(true); }}
              className="flex w-full items-center justify-center rounded-[var(--radius-button)] bg-primary-400 py-3 text-sm font-medium text-white shadow-sm transition-all hover:bg-primary-500 active:scale-95"
            >
              Editar Movimento
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
</div>
  )
}
