import { useState, useRef, useMemo, useEffect } from 'react'
import { X, Upload, Landmark, Coins, ExternalLink, Lock, Trash2, Package, Plus } from 'lucide-react'
import type { FinancialMovement, FinancialType, FinancialAccount } from '@/types/database'
import { supabase } from '@/lib/supabase'

import { useHardwareBack } from '@/hooks/use-hardware-back'
import { UnsavedDialog } from '@/components/ui/unsaved-dialog'
import { CustomSelect } from '@/components/ui/custom-select'
import { CustomDialog } from '@/components/ui/custom-dialog'
import { useEvents } from '@/features/events/api/use-events'
import { useInventory } from '@/features/inventory/api/use-inventory'
import { cn } from '@/lib/utils'

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

const INVENTORY_CATEGORIES_OPTIONS = [
  { label: 'Consumíveis', value: 'consumivel' },
  { label: 'Alimentos', value: 'alimento' },
  { label: 'Equipamento', value: 'mobilizado' },
]

const CATEGORY_LABELS: Record<string, string> = {
  consumivel: 'Consumíveis',
  alimento: 'Alimentos',
  mobilizado: 'Equipamento',
  equipamento: 'Equipamento',
}

export interface InventoryEntryPayload {
  id?: string
  name: string
  category: 'consumivel' | 'alimento' | 'mobilizado'
  quantity: number
  unit?: string
}

export type MovementFormData = Partial<FinancialMovement> & {
  inventoryItem?: InventoryEntryPayload
  inventoryItems?: InventoryEntryPayload[]
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

export function MovementForm({
  movement,
  initialEventId,
  onClose,
  onSubmit,
  onDelete,
  isLoading,
  readOnly = false,
}: MovementFormProps) {
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

  const isInventoryCategory =
    type === 'expense' &&
    (category === 'Consumíveis' || category === 'Alimentos' || category === 'Equipamento')

  const mappedInventoryCategory: 'consumivel' | 'alimento' | 'mobilizado' =
    category === 'Consumíveis'
      ? 'consumivel'
      : category === 'Alimentos'
      ? 'alimento'
      : 'mobilizado'

  // Multi-item inventory purchase list
  const [inventoryItemsList, setInventoryItemsList] = useState<InventoryEntryPayload[]>([])
  const [currentItemName, setCurrentItemName] = useState('')
  const [currentItemCategory, setCurrentItemCategory] = useState<'consumivel' | 'alimento' | 'mobilizado'>('consumivel')
  const [currentItemQuantity, setCurrentItemQuantity] = useState(1)
  const [currentItemUnit, setCurrentItemUnit] = useState('un')

  // Automatically update the default category of the item when the expense category changes
  useEffect(() => {
    if (isInventoryCategory) {
      setCurrentItemCategory(mappedInventoryCategory)
    }
  }, [category, isInventoryCategory, mappedInventoryCategory])

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

  // Filter inventory items matching the selected currentItemCategory
  const filteredInventoryOptions = useMemo(() => {
    return inventoryItems
      .filter(
        (i) =>
          i.category === currentItemCategory ||
          (currentItemCategory === 'mobilizado' && (i.category as any) === 'equipamento')
      )
      .map((i) => ({
        label: `${i.name} (Stock atual: ${i.quantity} ${i.unit || 'un'})`,
        value: i.name,
      }))
  }, [inventoryItems, currentItemCategory])

  const [date, setDate] = useState(toDateString(movement?.date))
  const [file, setFile] = useState<File | null>(null)

  const isDirty =
    type !== (movement?.type ?? 'expense') ||
    account !== (movement?.account ?? 'banco') ||
    amount !== (movement?.amount ?? '') ||
    description !== (movement?.description ?? '') ||
    category !== (movement?.category ?? '') ||
    eventId !== (movement?.event_id ?? initialEventId ?? '') ||
    date !== toDateString(movement?.date) ||
    inventoryItemsList.length > 0 ||
    currentItemName.trim() !== '' ||
    file !== null

  const [isUploading, setIsUploading] = useState(false)

  const handleAddItemToList = (e?: React.MouseEvent) => {
    e?.preventDefault()
    e?.stopPropagation()

    if (!currentItemName.trim()) return
    const trimmed = currentItemName.trim()
    const qty = Math.max(1, Number(currentItemQuantity) || 1)
    const unit = currentItemUnit.trim() || 'un'

    setInventoryItemsList((prev) => {
      const existingIdx = prev.findIndex(
        (i) => i.name.toLowerCase() === trimmed.toLowerCase()
      )
      if (existingIdx >= 0) {
        return prev.map((item, idx) =>
          idx === existingIdx ? { ...item, quantity: item.quantity + qty } : item
        )
      } else {
        return [
          ...prev,
          {
            id: `temp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
            name: trimmed,
            category: currentItemCategory,
            quantity: qty,
            unit,
          },
        ]
      }
    })

    setCurrentItemName('')
    setCurrentItemQuantity(1)
    setCurrentItemUnit('un')
  }

  const handleRemoveItem = (indexToRemove: number) => {
    setInventoryItemsList((prev) => prev.filter((_, idx) => idx !== indexToRemove))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Consolidate list including any pending item in inputs
    let allItems = [...inventoryItemsList]
    if (currentItemName.trim()) {
      const trimmed = currentItemName.trim()
      const qty = Math.max(1, Number(currentItemQuantity) || 1)
      const unit = currentItemUnit.trim() || 'un'
      const existingIdx = allItems.findIndex(
        (i) => i.name.toLowerCase() === trimmed.toLowerCase()
      )
      if (existingIdx >= 0) {
        allItems[existingIdx] = {
          ...allItems[existingIdx],
          quantity: allItems[existingIdx].quantity + qty,
        }
      } else {
        allItems.push({
          id: `temp_${Date.now()}`,
          name: trimmed,
          category: currentItemCategory,
          quantity: qty,
          unit,
        })
      }
    }

    // Required inventory item validation when inventory category is picked
    if (type === 'expense' && isInventoryCategory && !isExistingMovement) {
      if (allItems.length === 0) {
        setErrorMessage(
          'Para despesas de inventário, é obrigatório adicionar pelo menos um artigo adquirido à lista.'
        )
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

        const { data } = (supabase as any).storage.from('receipts').getPublicUrl(fileName)

        finalReceiptUrl = data.publicUrl
      } catch (err: any) {
        console.error('Error uploading file:', err)
        setErrorMessage(
          err?.message ||
            'Erro ao fazer upload da fatura. Verifique se o bucket "receipts" foi criado no Supabase.'
        )
        setIsUploading(false)
        return
      }
    }

    const itemsSummary = allItems.map((i) => i.name).join(', ')
    const effectiveDesc =
      description.trim() ||
      (allItems.length > 0 ? `Compra de ${itemsSummary}` : '')

    onSubmit({
      type,
      account,
      amount: Number(amount),
      description: effectiveDesc,
      category: category || null,
      event_id: eventId || null,
      date: dateIso,
      receipt_url: finalReceiptUrl,
      ...(isInventoryCategory && !isExistingMovement && allItems.length > 0
        ? {
            inventoryItems: allItems,
            inventoryItem: allItems[0],
          }
        : {}),
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
    <div className="fixed inset-0 z-[110] flex justify-center bg-black/40 backdrop-blur-xs transition-opacity animate-in fade-in duration-200">
      <div className="flex w-full max-w-[430px] flex-col bg-background shadow-2xl animate-in slide-in-from-bottom-6 duration-200 ease-out">
        {/* Header */}
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
            <button
              onClick={handleCloseClick}
              aria-label="Fechar formulário"
              className="rounded-full p-2 text-muted hover:bg-warm-100"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Form Body */}
        <div className="flex-1 overflow-y-auto p-4">
          <form ref={formRef} id="movement-form" onSubmit={handleSubmit} className="flex flex-col gap-4">
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
                    type === 'expense'
                      ? 'bg-white text-red-600 shadow-sm'
                      : 'text-secondary-600 hover:text-foreground'
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
                    type === 'income'
                      ? 'bg-white text-green-600 shadow-sm'
                      : 'text-secondary-600 hover:text-foreground'
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

            {/* Amount */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="mov-amount" className="text-sm font-medium text-secondary-700">
                Valor Total (€) <span className="text-primary-500">*</span>
              </label>
              <input
                id="mov-amount"
                disabled={!isEditing}
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

            {/* Description */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="mov-desc" className="text-sm font-medium text-secondary-700">
                Descrição <span className="text-primary-500">*</span>
              </label>
              <input
                id="mov-desc"
                disabled={!isEditing}
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                className="rounded-[var(--radius-button)] border border-warm-200 bg-surface px-3 py-2 text-sm focus:border-primary-400 focus:outline-none focus:ring-1 focus:ring-primary-400"
                placeholder="Ex: Fatura supermercado para a Festa da Primavera"
              />
            </div>

            {/* Category & Date */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5 z-[60]">
                <label className="text-sm font-medium text-secondary-700">Categoria</label>
                <CustomSelect
                  disabled={!isEditing}
                  value={category}
                  onChange={(val) => setCategory(val)}
                  options={type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES}
                  placeholder="Selecione ou crie..."
                  creatable
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="mov-date" className="text-sm font-medium text-secondary-700">
                  Data <span className="text-primary-500">*</span>
                </label>
                <input
                  id="mov-date"
                  disabled={!isEditing}
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                  className="rounded-[var(--radius-button)] border border-warm-200 bg-surface px-3 py-2 text-sm focus:border-primary-400 focus:outline-none focus:ring-1 focus:ring-primary-400"
                />
              </div>
            </div>

            {/* Multi-item Inventory Purchase Section */}
            {isInventoryCategory && (
              <div className="rounded-xl border border-primary-200 bg-primary-50/50 p-3.5 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Package className="h-4 w-4 text-primary-700" />
                    <span className="text-xs font-bold uppercase tracking-wider text-primary-900">
                      Artigos Comprados (Inventário)
                    </span>
                  </div>
                  {inventoryItemsList.length > 0 && (
                    <span className="text-xs font-bold text-primary-800 bg-primary-200/80 px-2.5 py-0.5 rounded-full">
                      {inventoryItemsList.length} {inventoryItemsList.length === 1 ? 'artigo' : 'artigos'}
                    </span>
                  )}
                </div>

                {/* List of items already added to this expense */}
                {inventoryItemsList.length > 0 && (
                  <div className="flex flex-col gap-2">
                    {inventoryItemsList.map((item, idx) => (
                      <div
                        key={item.id || idx}
                        className="flex items-center justify-between rounded-lg border border-primary-200 bg-surface p-2.5 shadow-xs"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary-100 text-xs font-bold text-primary-800">
                            {idx + 1}
                          </span>
                          <div className="truncate">
                            <p className="text-sm font-bold text-foreground truncate">{item.name}</p>
                            <p className="text-xs text-secondary-500">
                              {item.quantity} {item.unit || 'un'} · {CATEGORY_LABELS[item.category] || item.category}
                            </p>
                          </div>
                        </div>
                        {isEditing && (
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(idx)}
                            className="rounded-md p-1.5 text-red-500 hover:bg-red-50 transition-colors"
                            title="Remover artigo da lista"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Sub-form to add an item to the list */}
                {isEditing && (
                  <div className="flex flex-col gap-2.5 rounded-lg border border-dashed border-primary-300 bg-white/80 p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-secondary-800">
                        {inventoryItemsList.length === 0
                          ? '1. Adicionar primeiro artigo:'
                          : 'Adicionar outro artigo à fatura:'}
                      </span>
                    </div>

                    {/* Category pills for the specific item */}
                    <div className="flex gap-1.5">
                      {INVENTORY_CATEGORIES_OPTIONS.map((cat) => (
                        <button
                          key={cat.value}
                          type="button"
                          onClick={() => setCurrentItemCategory(cat.value as any)}
                          className={cn(
                            'flex-1 rounded-md px-2 py-1 text-[11px] font-semibold transition-colors',
                            currentItemCategory === cat.value
                              ? 'bg-primary-600 text-white shadow-xs'
                              : 'bg-warm-100 text-secondary-600 hover:bg-warm-200'
                          )}
                        >
                          {cat.label}
                        </button>
                      ))}
                    </div>

                    {/* Item selection */}
                    <div className="flex flex-col gap-1 z-[55]">
                      <label className="text-xs font-medium text-secondary-700">
                        Nome do Artigo <span className="text-primary-500">*</span>
                      </label>
                      <CustomSelect
                        value={currentItemName}
                        onChange={(val) => setCurrentItemName(val)}
                        options={filteredInventoryOptions}
                        placeholder="Selecione existente ou escreva novo..."
                        creatable
                      />
                    </div>

                    {/* Quantity & Unit */}
                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex flex-col gap-1">
                        <label className="text-xs font-medium text-secondary-700">
                          Quantidade <span className="text-primary-500">*</span>
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={currentItemQuantity}
                          onChange={(e) => setCurrentItemQuantity(Math.max(1, Number(e.target.value)))}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault()
                              handleAddItemToList()
                            }
                          }}
                          className="rounded-[var(--radius-button)] border border-warm-200 bg-surface px-3 py-1.5 text-sm font-bold text-center focus:border-primary-400 focus:outline-none"
                        />
                      </div>

                      <div className="flex flex-col gap-1">
                        <label className="text-xs font-medium text-secondary-700">Unidade</label>
                        <input
                          type="text"
                          value={currentItemUnit}
                          onChange={(e) => setCurrentItemUnit(e.target.value)}
                          placeholder="un, cx, kg..."
                          className="rounded-[var(--radius-button)] border border-warm-200 bg-surface px-3 py-1.5 text-sm focus:border-primary-400 focus:outline-none"
                        />
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleAddItemToList}
                      disabled={!currentItemName.trim()}
                      className="mt-1 flex items-center justify-center gap-1.5 rounded-md bg-secondary-900 py-2 text-xs font-bold text-white shadow-xs hover:bg-secondary-800 active:scale-95 disabled:opacity-40 transition-all"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>Adicionar Artigo à Lista</span>
                    </button>
                  </div>
                )}

                <p className="text-xs text-secondary-600 leading-tight">
                  {inventoryItemsList.length > 0 || currentItemName.trim()
                    ? `Estes artigos darão entrada no inventário e ${
                        eventId
                          ? 'ficarão automaticamente atribuídos à lista de material da celebração selecionada.'
                          : 'ficarão disponíveis no stock geral.'
                      }`
                    : 'Adicione os artigos constantes nesta despesa (ex: garfos, copos, sumos...).'}
                </p>
              </div>
            )}

            {/* Event Association */}
            <div className="flex flex-col gap-1.5 z-[50]">
              <label className="text-sm font-medium text-secondary-700">Evento / Celebração (Opcional)</label>
              <CustomSelect
                disabled={!isEditing}
                value={eventId}
                onChange={(val) => setEventId(val)}
                options={eventOptions}
                placeholder="Sem evento associado"
              />
            </div>

            {/* Receipt Upload */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-secondary-700">Fatura / Recibo</label>

              {movement?.receipt_url && !file && (
                <div className="mb-2 flex items-center justify-between rounded-[var(--radius-card)] border border-warm-200 bg-surface p-2.5">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <ExternalLink className="h-4 w-4 shrink-0 text-primary-500" />
                    <a
                      href={movement.receipt_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="truncate text-xs font-bold text-primary-600 hover:underline"
                    >
                      Ver Comprovativo Atual
                    </a>
                  </div>
                  {isEditing && (
                    <span className="text-[10px] text-muted">Carregue abaixo para substituir</span>
                  )}
                </div>
              )}

              {isEditing && (
                <div className="flex items-center gap-2">
                  <label
                    htmlFor="mov-receipt-file"
                    className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-[var(--radius-button)] border border-dashed border-warm-300 bg-surface px-3 py-3 text-sm text-secondary-600 hover:border-primary-400 hover:bg-warm-50 transition-colors"
                  >
                    <Upload className="h-4 w-4 text-muted" />
                    <span className="truncate">{file ? file.name : 'Selecionar ficheiro...'}</span>
                    <input
                      id="mov-receipt-file"
                      type="file"
                      accept="image/*,application/pdf"
                      onChange={(e) => setFile(e.target.files?.[0] || null)}
                      className="hidden"
                    />
                  </label>
                  {file && (
                    <button
                      type="button"
                      onClick={() => setFile(null)}
                      className="rounded-full p-2 text-muted hover:bg-warm-100"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              )}
            </div>
          </form>
        </div>

        {/* Footer Actions */}
        {isEditing && (
          <div className="border-t border-warm-200 bg-surface p-4">
            <button
              type="submit"
              form="movement-form"
              disabled={isLoading || isUploading}
              className="flex w-full items-center justify-center rounded-[var(--radius-button)] bg-primary-400 py-3 text-sm font-medium text-white shadow-sm transition-all hover:bg-primary-500 active:scale-95 disabled:opacity-50"
            >
              {isLoading || isUploading ? 'A Guardar...' : movement ? 'Guardar Alterações' : 'Registar Movimento'}
            </button>
          </div>
        )}
      </div>

      {/* Unsaved Dialog */}
      <UnsavedDialog
        isOpen={showUnsaved}
        onCancel={() => setShowUnsaved(false)}
        onDiscard={() => {
          setShowUnsaved(false)
          onClose()
        }}
        onSave={handleSaveAndClose}
      />

      {/* Delete Confirm Dialog */}
      <CustomDialog
        isOpen={showDeleteConfirm}
        title="Eliminar Movimento?"
        description="Tem a certeza de que pretende eliminar este movimento financeiro? O registo será arquivado mas não eliminado permanentemente."
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
        title="Erro no Formulário"
        description={errorMessage || ''}
        variant="danger"
        confirmLabel="Entendido"
        onConfirm={() => setErrorMessage(null)}
      />
    </div>
  )
}
