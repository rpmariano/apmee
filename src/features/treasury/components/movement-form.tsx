import { useState, useRef, useMemo } from 'react'
import { X, Upload, Landmark, Coins, ExternalLink, Lock, Trash2 } from 'lucide-react'
import type { FinancialMovement, FinancialType, FinancialAccount } from '@/types/database'
import { supabase } from '@/lib/supabase'

import { useHardwareBack } from '@/hooks/use-hardware-back'
import { UnsavedDialog } from '@/components/ui/unsaved-dialog'
import { CustomSelect } from '@/components/ui/custom-select'
import { CustomDialog } from '@/components/ui/custom-dialog'
import { useEvents } from '@/features/events/api/use-events'

import { useInventory } from '@/features/inventory/api/use-inventory'

const INCOME_CATEGORIES = [
  { label: 'Quotas de Sócios', value: 'Quotas de Sócios' },
  { label: 'Eventos / Festas', value: 'Eventos / Festas' },
  { label: 'Venda de Merchandising', value: 'Venda de Merchandising' },
  { label: 'Donativos / Patrocínios', value: 'Donativos / Patrocínios' },
  { label: 'Subsídios', value: 'Subsídios' },
  { label: 'Outras Receitas', value: 'Outras Receitas' }
]

const EXPENSE_CATEGORIES = [
  { label: 'Consumíveis', value: 'Consumíveis' },
  { label: 'Alimentos', value: 'Alimentos' },
  { label: 'Equipamento', value: 'Equipamento' },
  { label: 'Material escolar', value: 'Material escolar' },
  { label: 'Serviços', value: 'Serviços' },
]

export interface InventoryEntryPayload {
  name: string
  category: 'consumivel' | 'alimento' | 'mobilizado'
  quantity: number
  unit?: string
}

export type MovementFormData = Partial<FinancialMovement> & {
  inventoryItem?: InventoryEntryPayload
}

interface MovementFormProps {
  movement?: FinancialMovement
  initialEventId?: string
  onClose: () => void
  onSubmit: (data: MovementFormData) => void
  onDelete?: (id: string) => Promise<void>
  isLoading?: boolean
  readOnly?: boolean
}

// Convert ISO to YYYY-MM-DD for date input
function toDateString(isoString?: string | null) {
  if (!isoString) return new Date().toISOString().split('T')[0]
  return isoString.split('T')[0]
}

export function MovementForm({ movement, initialEventId, onClose, onSubmit, onDelete, isLoading, readOnly = false }: MovementFormProps) {
  const isExistingMovement = Boolean(movement?.id || movement)
  const [showUnsaved, setShowUnsaved] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const isEditing = !readOnly
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
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
  const [account, setAccount] = useState<FinancialAccount>(movement?.account ?? 'banco')
  const [amount, setAmount] = useState(movement?.amount ?? '')
  const [description, setDescription] = useState(movement?.description ?? '')
  const [category, setCategory] = useState(movement?.category ?? '')
  const [eventId, setEventId] = useState(movement?.event_id ?? initialEventId ?? '')
  const { data: events = [] } = useEvents()
  const { data: inventoryItems = [] } = useInventory()

  const isInventoryCategory = type === 'expense' && (
    category === 'Consumíveis' || category === 'Alimentos' || category === 'Equipamento'
  )

  const mappedInventoryCategory: 'consumivel' | 'alimento' | 'mobilizado' =
    category === 'Consumíveis' ? 'consumivel' : category === 'Alimentos' ? 'alimento' : 'mobilizado'

  const [inventoryItemName, setInventoryItemName] = useState('')
  const [inventoryQuantity, setInventoryQuantity] = useState(1)
  const [inventoryUnit, setInventoryUnit] = useState('un')

  // Format and sort events: Festas first (main cost centers), then Reuniões
  const eventOptions = useMemo(() => {
    const sorted = [...events].sort((a, b) => {
      const aIsFesta = a.event_type === 'festa' ? 0 : 1
      const bIsFesta = b.event_type === 'festa' ? 0 : 1
      return aIsFesta - bIsFesta
    })
    return sorted.map((e) => ({
      label: `${e.event_type === 'festa' ? '🎉' : '📋'} ${e.title}`,
      value: e.id,
    }))
  }, [events])

  // Filter inventory items matching the selected category
  const filteredInventoryOptions = useMemo(() => {
    if (!isInventoryCategory) return []
    return inventoryItems
      .filter((i) => i.category === mappedInventoryCategory || (mappedInventoryCategory === 'mobilizado' && (i.category as any) === 'equipamento'))
      .map((i) => ({ label: `${i.name} (Stock atual: ${i.quantity} ${i.unit || 'un'})`, value: i.name }))
  }, [inventoryItems, isInventoryCategory, mappedInventoryCategory])

  const [date, setDate] = useState(toDateString(movement?.date))
  const [file, setFile] = useState<File | null>(null)

  const isDirty = (
    type !== (movement?.type ?? 'expense') ||
    account !== (movement?.account ?? 'banco') ||
    amount !== (movement?.amount ?? '') ||
    description !== (movement?.description ?? '') ||
    category !== (movement?.category ?? '') ||
    eventId !== (movement?.event_id ?? '') ||
    date !== toDateString(movement?.date) ||
    inventoryItemName !== '' ||
    file !== null
  )

  const [isUploading, setIsUploading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Required inventory item validation when inventory category is picked
    if (type === 'expense' && isInventoryCategory && !isExistingMovement) {
      if (!inventoryItemName.trim()) {
        setErrorMessage('Para despesas de inventário, é obrigatório selecionar ou criar o artigo adquirido.')
        return
      }
      if (inventoryQuantity <= 0) {
        setErrorMessage('A quantidade adquirida de inventário deve ser maior que zero.')
        return
      }
    }
    
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
      } catch (err: any) {
        console.error('Error uploading file:', err)
        setErrorMessage(err?.message || 'Erro ao fazer upload da fatura. Verifique se o bucket "receipts" foi criado no Supabase.')
        setIsUploading(false)
        return // Stop submission if upload fails
      }
    }

    const effectiveDesc = description.trim() || (isInventoryCategory ? `Aquisição de ${inventoryItemName.trim()}` : '')

    onSubmit({
      type,
      account,
      amount: Number(amount),
      description: effectiveDesc,
      category: category || null,
      event_id: eventId || null,
      date: dateIso,
      receipt_url: finalReceiptUrl,
      ...(isInventoryCategory && !isExistingMovement ? {
        inventoryItem: {
          name: inventoryItemName.trim(),
          category: mappedInventoryCategory,
          quantity: inventoryQuantity,
          unit: inventoryUnit || 'un',
        },
      } : {}),
    })
  }

  const handleConfirmDelete = async () => {
    if (!movement?.id || !onDelete) return
    try {
      setIsDeleting(true)
      await onDelete(movement.id)
      setShowDeleteConfirm(false)
    } catch (err: any) {
      console.error('Failed to delete movement:', err)
      setErrorMessage(err.message || 'Erro ao eliminar movimento.')
      setIsDeleting(false)
      setShowDeleteConfirm(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex justify-center bg-black/40 backdrop-blur-xs transition-opacity animate-in fade-in duration-200">{/* Phone container */}<div className="flex w-full max-w-[430px] flex-col bg-background shadow-2xl animate-in slide-in-from-bottom-6 duration-200 ease-out">
      <div className="flex items-center justify-between border-b border-warm-200 bg-surface px-4 py-4">
        <h2 className="text-lg font-bold text-foreground">
          {readOnly ? 'Detalhes do Movimento' : movement ? 'Editar Movimento' : 'Novo Movimento'}
        </h2>
        <div className="flex items-center gap-1">
          {isExistingMovement && isEditing && onDelete && (
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              aria-label="Eliminar movimento"
              title="Eliminar movimento"
              className="rounded-full p-2 text-muted hover:bg-red-50 hover:text-red-600 active:scale-95 transition-all"
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
        <form ref={formRef}   id="movement-form"  onSubmit={handleSubmit} className="flex flex-col gap-4">
          
          {/* Type Toggle */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-secondary-600">
                Tipo de Movimento
              </label>
              {isExistingMovement && (
                <span className="flex items-center gap-1 text-xs font-medium text-muted">
                  <Lock className="h-3 w-3 text-secondary-400" />
                  Não alterável após criação
                </span>
              )}
            </div>
            <div className="flex rounded-[var(--radius-button)] bg-warm-100 p-1">
              <button
                type="button"
                disabled={isExistingMovement || !isEditing}
                onClick={() => {
                  setType('expense')
                  setCategory('')
                }}
                className={`flex-1 rounded-md py-2 text-sm font-medium transition-all ${
                  type === 'expense' ? 'bg-white text-red-600 shadow-sm' : 'text-secondary-600 hover:text-foreground'
                } ${isExistingMovement ? 'cursor-not-allowed opacity-60' : ''}`}
              >
                Despesa
              </button>
              <button
                type="button"
                disabled={isExistingMovement || !isEditing}
                onClick={() => {
                  setType('income')
                  setCategory('')
                }}
                className={`flex-1 rounded-md py-2 text-sm font-medium transition-all ${
                  type === 'income' ? 'bg-white text-green-600 shadow-sm' : 'text-secondary-600 hover:text-foreground'
                } ${isExistingMovement ? 'cursor-not-allowed opacity-60' : ''}`}
              >
                Receita
              </button>
            </div>
          </div>

          {/* Account Toggle */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-secondary-600">
              Conta de Tesouraria <span className="text-primary-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2 rounded-[var(--radius-button)] bg-warm-100 p-1">
              <button
                type="button"
                disabled={!isEditing}
                onClick={() => setAccount('banco')}
                className={`flex items-center justify-center gap-2 rounded-md py-2 text-sm font-semibold transition-all ${
                  account === 'banco'
                    ? 'bg-white text-secondary-900 shadow-sm'
                    : 'text-secondary-600 hover:text-foreground'
                } ${!isEditing ? 'cursor-not-allowed opacity-60' : ''}`}
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
                } ${!isEditing ? 'cursor-not-allowed opacity-60' : ''}`}
              >
                <Coins className="h-4 w-4 text-amber-600" />
                <span>Caixa</span>
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="mov-amount" className="text-sm font-medium text-secondary-700">Valor (€) <span className="text-primary-500">*</span></label>
            <input id="mov-amount" disabled={!isEditing} 
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
            <label htmlFor="mov-desc" className="text-sm font-medium text-secondary-700">Descrição <span className="text-primary-500">*</span></label>
            <input id="mov-desc" disabled={!isEditing} 
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
              <label htmlFor="mov-date" className="text-sm font-medium text-secondary-700">Data <span className="text-primary-500">*</span></label>
              <input id="mov-date" disabled={!isEditing} 
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="rounded-[var(--radius-button)] border border-warm-200 bg-surface px-3 py-2 text-sm focus:border-primary-400 focus:outline-none focus:ring-1 focus:ring-primary-400"
              />
            </div>
          </div>

          {/* Artigo de Inventário (Obrigatório para categorias de inventário) */}
          {isInventoryCategory && (
            <div className="rounded-xl border border-primary-200 bg-primary-50/50 p-3.5 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-primary-900">
                  📦 Entrada em Inventário
                </span>
                <span className="text-xs font-semibold text-primary-700 bg-primary-100 px-2 py-0.5 rounded-full">
                  {category}
                </span>
              </div>

              <div className="flex flex-col gap-1.5 z-[55]">
                <label className="text-xs font-medium text-secondary-700">
                  Artigo de Inventário <span className="text-primary-500">*</span>
                </label>
                <CustomSelect
                  disabled={!isEditing}
                  value={inventoryItemName}
                  onChange={(val) => setInventoryItemName(val)}
                  options={filteredInventoryOptions}
                  placeholder="Selecione existente ou digite novo..."
                  creatable
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="inv-entry-qty" className="text-xs font-medium text-secondary-700">
                    Quantidade <span className="text-primary-500">*</span>
                  </label>
                  <input
                    id="inv-entry-qty"
                    disabled={!isEditing}
                    type="number"
                    min="1"
                    value={inventoryQuantity}
                    onChange={(e) => setInventoryQuantity(Math.max(1, Number(e.target.value)))}
                    required
                    className="rounded-[var(--radius-button)] border border-warm-200 bg-surface px-3 py-2 text-sm font-bold text-center focus:border-primary-400 focus:outline-none"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label htmlFor="inv-entry-unit" className="text-xs font-medium text-secondary-700">
                    Unidade
                  </label>
                  <input
                    id="inv-entry-unit"
                    disabled={!isEditing}
                    type="text"
                    value={inventoryUnit}
                    onChange={(e) => setInventoryUnit(e.target.value)}
                    placeholder="un, cx, kg..."
                    className="rounded-[var(--radius-button)] border border-warm-200 bg-surface px-3 py-2 text-sm focus:border-primary-400 focus:outline-none"
                  />
                </div>
              </div>

              <p className="text-xs text-secondary-600 leading-tight">
                {inventoryItemName
                  ? `Serão adicionadas ${inventoryQuantity} ${inventoryUnit} de "${inventoryItemName}" ao inventário.`
                  : 'Ao gravar, o artigo será criado ou atualizado no inventário.'}
                {eventId ? ' Como selecionou um evento, o artigo será também associado à lista desse evento.' : ''}
              </p>
            </div>
          )}

          <div className="flex flex-col gap-1.5 z-[50]">
              <label className="text-sm font-medium text-secondary-700">Evento (Opcional)</label>
              <CustomSelect disabled={!isEditing} 
                value={eventId}
                onChange={(val) => setEventId(val)}
                options={eventOptions}
                placeholder="Sem evento associado"
              />
            </div>

          <div className="my-2 border-t border-warm-200" />

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-secondary-700">Fatura / Comprovativo</label>
            
            <label htmlFor="mov-receipt" className="flex cursor-pointer flex-col items-center justify-center rounded-[var(--radius-card)] border-2 border-dashed border-warm-200 bg-surface py-6 text-center transition-colors hover:bg-warm-50">
              <Upload className="mb-2 h-6 w-6 text-secondary-400" />
              <span className="text-sm font-medium text-foreground">
                {file ? file.name : 'Tocar para enviar documento'}
              </span>
              <span className="mt-1 text-xs text-muted">Imagens ou PDF</span>
              <input id="mov-receipt" disabled={!isEditing} 
                type="file"
                accept="image/*,.pdf"
                className="hidden"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
            </label>
            
            {movement?.receipt_url && !file && (
              <div className="mt-1 flex items-center justify-between rounded-lg bg-warm-50 border border-warm-200 px-3 py-2">
                <span className="text-xs text-green-700 font-medium">✓ Comprovativo anexado</span>
                <a
                  href={movement.receipt_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-primary-600 hover:text-primary-700 underline"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  <span>Ver Fatura / Recibo</span>
                </a>
              </div>
            )}
          </div>

        
        <div className="border-t border-warm-200 bg-surface p-4 flex flex-col gap-2.5">
          {isExistingMovement && isEditing && onDelete && (
            <button
              type="button"
              disabled={isLoading || isUploading || isDeleting}
              onClick={() => setShowDeleteConfirm(true)}
              className="flex w-full items-center justify-center gap-2 rounded-[var(--radius-button)] border border-red-200 bg-red-50/70 py-2.5 text-xs font-bold text-red-600 transition-all hover:bg-red-100 hover:border-red-300 active:scale-95 disabled:opacity-50"
            >
              <Trash2 className="h-4 w-4 text-red-500" />
              <span>Eliminar Movimento</span>
            </button>
          )}

          {readOnly ? (
            <button
              type="button"
              onClick={onClose}
              className="flex w-full items-center justify-center rounded-[var(--radius-button)] bg-secondary-900 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-secondary-800 active:scale-95"
            >
              Fechar
            </button>
          ) : (
            <button
              type="submit"
              form="movement-form"
              disabled={isLoading || isUploading || isDeleting}
              className="flex w-full items-center justify-center rounded-[var(--radius-button)] bg-primary-400 py-3 text-sm font-medium text-white shadow-sm transition-all hover:bg-primary-500 active:scale-95 disabled:opacity-50"
            >
              {isUploading ? 'A enviar documento...' : isLoading ? 'A Guardar...' : (movement ? 'Guardar Movimento' : 'Registar Movimento')}
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

      {/* Delete Confirmation Dialog */}
      <CustomDialog
        isOpen={showDeleteConfirm}
        title="Eliminar Movimento?"
        description="Tem a certeza de que pretende eliminar este movimento financeiro? Esta ação pode ser revertida por um administrador."
        variant="danger"
        confirmLabel="Sim, Eliminar"
        cancelLabel="Cancelar"
        isLoading={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />

      {/* Error Dialog */}
      <CustomDialog
        isOpen={!!errorMessage}
        title="Erro no movimento"
        description={errorMessage || ''}
        variant="danger"
        confirmLabel="OK"
        onConfirm={() => setErrorMessage(null)}
      />
    </div>
  </div>
  )
}
