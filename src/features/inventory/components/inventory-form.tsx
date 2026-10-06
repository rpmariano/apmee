import { useState, useRef } from 'react'
import { X, Trash2, CalendarCheck } from 'lucide-react'
import type { InventoryItem, InventoryCategory } from '@/types/database'
import type { ItemCaptiveInfo } from '../api/use-captive-stock'
import { cn } from '@/lib/utils'

import { useHardwareBack } from '@/hooks/use-hardware-back'
import { UnsavedDialog } from '@/components/ui/unsaved-dialog'
import { CustomSelect } from '@/components/ui/custom-select'
import { CustomDialog } from '@/components/ui/custom-dialog'

const INVENTORY_CATEGORIES = [
  { label: 'Consumíveis', value: 'consumivel' },
  { label: 'Alimentos', value: 'alimento' },
  { label: 'Equipamento', value: 'mobilizado' }
]

const ITEMS_BY_CATEGORY: Record<string, string[]> = {
  'consumivel': ['Pratos de papel', 'Pratos de Plástico', 'Talheres', 'Guardanapos', 'Copos de plástico'],
  'alimento': ['Pacote batata frita', 'Pacote de pipocas', 'Sumos Naturais', 'Refrigerantes', 'Água', 'Pão cachorro', 'Salsicha'],
  'mobilizado': ['Microfone', 'Coluna', 'Máquina Café'],
  'equipamento': ['Microfone', 'Coluna', 'Máquina Café']
}

interface InventoryFormProps {
  item?: InventoryItem
  onClose: () => void
  onSubmit: (data: Partial<InventoryItem>) => void
  isLoading?: boolean
  onDelete?: (id: string) => Promise<void>
  captiveInfo?: ItemCaptiveInfo
}
export function InventoryForm({ item, onClose, onSubmit, isLoading, onDelete, captiveInfo }: InventoryFormProps) {

  const isExistingItem = !!item
  const [showUnsaved, setShowUnsaved] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
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

  const [name, setName] = useState(item?.name ?? '')
  const [category, setCategory] = useState<InventoryCategory>(item?.category ?? 'consumivel')
  const [quantity, setQuantity] = useState(item?.quantity ?? 0)
  const [unit, setUnit] = useState(item?.unit ?? 'un')
  const [minStock, setMinStock] = useState(item?.min_stock ?? 0)
  const [location, setLocation] = useState(item?.location ?? '')
  const [notes, setNotes] = useState(item?.notes ?? '')

  const isDirty = (
    name !== (item?.name ?? '') ||
    category !== (item?.category ?? 'consumivel') ||
    quantity !== (item?.quantity ?? 0) ||
    unit !== (item?.unit ?? 'un') ||
    minStock !== (item?.min_stock ?? 0) ||
    location !== (item?.location ?? '') ||
    notes !== (item?.notes ?? '')
  )


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    onSubmit({
      name: name.trim(),
      category,
      quantity: Number(quantity) || 0,
      unit: unit.trim() || 'un',
      min_stock: Number(minStock) || 0,
      location: location.trim() || null,
      notes: notes.trim() || null,
    })
  }

  const handleConfirmDelete = async () => {
    if (!item || !onDelete) return
    setIsDeleting(true)
    try {
      await onDelete(item.id)
      onClose()
    } catch (err: any) {
      console.error('Failed to delete item:', err)
    } finally {
      setIsDeleting(false)
      setShowDeleteConfirm(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex justify-center bg-black/40 backdrop-blur-xs transition-opacity animate-in fade-in duration-200">{/* Phone container */}<div className="flex w-full max-w-[430px] flex-col bg-background shadow-2xl animate-in slide-in-from-bottom-6 duration-200 ease-out">
      <div className="flex items-center justify-between border-b border-warm-200 bg-surface px-4 py-4">
        <h2 className="text-lg font-bold text-foreground">
          {item ? 'Editar Item' : 'Novo Item'}
        </h2>
        <div className="flex items-center gap-1">
          {isExistingItem && onDelete && (
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              aria-label="Eliminar item"
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
        <form ref={formRef} id="inventory-form" onSubmit={handleSubmit} className="flex flex-col gap-4">
          
          {/* Alerta de Stock Cativo em Eventos */}
          {captiveInfo && captiveInfo.captiveQuantity > 0 && (
            <div className="flex items-start gap-2.5 rounded-[var(--radius-button)] border border-primary-200 bg-primary-50 p-3 text-xs text-primary-900 shadow-2xs">
              <CalendarCheck className="h-4 w-4 shrink-0 text-primary-600 mt-0.5" />
              <div className="flex-1">
                <span className="font-bold">Item associado a eventos ativos:</span>{' '}
                <span>
                  {captiveInfo.captiveQuantity} {item?.unit || 'un'} reservada(s) (
                  {captiveInfo.allocations.map((a) => a.eventTitle).join(', ')}
                  ).
                </span>
              </div>
            </div>
          )}

          {/* 1. Categoria */}
          <div className="flex flex-col gap-1.5 z-[80]">
            <label className="text-sm font-medium text-secondary-700">
              Categoria <span className="text-primary-500">*</span>
            </label>
            <CustomSelect disabled={!isEditing} 
              value={category}
              onChange={(val) => setCategory(val as InventoryCategory)}
              options={INVENTORY_CATEGORIES}
            />
          </div>

          {/* 2. Nome do Item */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="inv-name" className="text-sm font-medium text-secondary-700">
              Nome do Item <span className="text-primary-500">*</span>
            </label>
            <input
              id="inv-name"
              disabled={!isEditing}
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="rounded-[var(--radius-button)] border border-warm-200 bg-surface px-3 py-2 text-sm focus:border-primary-400 focus:outline-none focus:ring-1 focus:ring-primary-400"
              placeholder="Ex: Guardanapos, Copos de papel, Microfone..."
            />
            {isEditing && ITEMS_BY_CATEGORY[category] && ITEMS_BY_CATEGORY[category].length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                <span className="text-[11px] font-medium text-muted">Sugestões:</span>
                {ITEMS_BY_CATEGORY[category].map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => setName(suggestion)}
                    className={cn(
                      "rounded-full px-2 py-0.5 text-xs transition-colors cursor-pointer active:scale-95",
                      name === suggestion
                        ? "bg-primary-100 text-primary-800 font-semibold border border-primary-300"
                        : "bg-warm-100 text-secondary-600 hover:bg-warm-200 hover:text-foreground"
                    )}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="inv-quantity" className="text-sm font-medium text-secondary-700">Quantidade <span className="text-primary-500">*</span></label>
              <input id="inv-quantity" disabled={!isEditing} 
                type="number"
                min="0"
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                required
                className="rounded-[var(--radius-button)] border border-warm-200 bg-surface px-3 py-2 text-sm focus:border-primary-400 focus:outline-none focus:ring-1 focus:ring-primary-400"
              />
            </div>
            
            <div className="flex flex-col gap-1.5">
              <label htmlFor="inv-unit" className="text-sm font-medium text-secondary-700">Unidade</label>
              <input id="inv-unit" disabled={!isEditing} 
                type="text"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="rounded-[var(--radius-button)] border border-warm-200 bg-surface px-3 py-2 text-sm focus:border-primary-400 focus:outline-none focus:ring-1 focus:ring-primary-400"
                placeholder="Ex: un, cx, kg"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="inv-min-stock" className="text-sm font-medium text-secondary-700">Stock Mínimo (Alerta)</label>
            <input id="inv-min-stock" disabled={!isEditing} 
              type="number"
              min="0"
              value={minStock}
              onChange={(e) => setMinStock(Number(e.target.value))}
              className="rounded-[var(--radius-button)] border border-warm-200 bg-surface px-3 py-2 text-sm focus:border-primary-400 focus:outline-none focus:ring-1 focus:ring-primary-400"
              placeholder="Avisar se descer de..."
            />
          </div>

          <div className="my-2 border-t border-warm-200" />

          <div className="flex flex-col gap-1.5">
            <label htmlFor="inv-location" className="text-sm font-medium text-secondary-700">Localização</label>
            <input id="inv-location" disabled={!isEditing} 
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="rounded-[var(--radius-button)] border border-warm-200 bg-surface px-3 py-2 text-sm focus:border-primary-400 focus:outline-none focus:ring-1 focus:ring-primary-400"
              placeholder="Ex: Armário 2, Sala da Associação"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="inv-notes" className="text-sm font-medium text-secondary-700">Observações</label>
            <textarea id="inv-notes" disabled={!isEditing} 
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="resize-none rounded-[var(--radius-card)] border border-warm-200 bg-surface px-3 py-2 text-sm focus:border-primary-400 focus:outline-none focus:ring-1 focus:ring-primary-400"
              placeholder="Detalhes sobre o estado de conservação, etc."
            />
          </div>
        </form>
      </div>

      <div className="shrink-0 border-t border-warm-200 bg-surface p-4 pb-[max(1rem,env(safe-area-inset-bottom))] flex flex-col gap-2">
        {isExistingItem && onDelete && (
          <button
            type="button"
            onClick={() => setShowDeleteConfirm(true)}
            disabled={isDeleting}
            className="flex w-full items-center justify-center rounded-[var(--radius-button)] border border-red-200 bg-red-50/70 py-2.5 text-sm font-medium text-red-600 transition-all hover:bg-red-100 active:scale-95 disabled:opacity-50"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Eliminar Item
          </button>
        )}
        <button
          type="submit"
          form="inventory-form"
          disabled={isLoading}
          className="flex w-full items-center justify-center rounded-[var(--radius-button)] bg-primary-500 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-primary-600 active:scale-95 disabled:opacity-50"
        >
          {isLoading ? 'A Guardar...' : (item ? 'Guardar Item' : 'Criar Item')}
        </button>
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
        isOpen={showDeleteConfirm}
        title="Eliminar Item?"
        description={
          captiveInfo && captiveInfo.captiveQuantity > 0
            ? `ATENÇÃO: "${item?.name}" tem ${captiveInfo.captiveQuantity} unidade(s) alocadas a eventos ativos (${captiveInfo.allocations.map((a) => a.eventTitle).join(', ')}). Tem a certeza que pretende eliminar este item do inventário?`
            : `Tem a certeza que pretende eliminar "${item?.name}"? Esta ação não pode ser revertida.`
        }
        variant="danger"
        confirmLabel="Sim, Eliminar"
        cancelLabel="Cancelar"
        isLoading={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />
</div>
</div>
  )
}
