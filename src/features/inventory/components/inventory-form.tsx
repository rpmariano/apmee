import { useState, useRef } from 'react'
import { X } from 'lucide-react'
import type { InventoryItem, InventoryCategory } from '@/types/database'

import { useHardwareBack } from '@/hooks/use-hardware-back'
import { UnsavedDialog } from '@/components/ui/unsaved-dialog'
import { CustomSelect } from '@/components/ui/custom-select'

const INVENTORY_CATEGORIES = [
  { label: 'Consumíveis', value: 'consumivel' },
  { label: 'Alimentos', value: 'alimento' },
  { label: 'Mobilizado', value: 'mobilizado' }
]

const ITEMS_BY_CATEGORY: Record<string, string[]> = {
  'consumivel': ['Pratos de papel', 'Pratos de Plástico', 'Talheres', 'Guardanapos', 'Copos de plástico'],
  'alimento': ['Pacote batata frita', 'Pacote de pipocas', 'Sumos Naturais', 'Refrigerantes', 'Água', 'Pão cachorro', 'Salsicha'],
  'mobilizado': ['Microfone', 'Coluna', 'Máquina Café']
}

interface InventoryFormProps {
  item?: InventoryItem
  onClose: () => void
  onSubmit: (data: Partial<InventoryItem>) => void
  isLoading?: boolean

}
export function InventoryForm({ item, onClose, onSubmit, isLoading }: InventoryFormProps) {

  
  const [showUnsaved, setShowUnsaved] = useState(false)
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
    onSubmit({
      name,
      category,
      quantity,
      unit: unit || 'un',
      min_stock: minStock,
      location: location || null,
      notes: notes || null,
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background">
      <div className="flex items-center justify-between border-b border-warm-200 bg-surface px-4 py-4">
        <h2 className="text-lg font-bold text-foreground">
          {item ? 'Editar Item' : 'Novo Item'}
        </h2>
        <button onClick={handleCloseClick} className="rounded-full p-2 text-muted hover:bg-warm-100">
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <form ref={formRef}   id="inventory-form"  onSubmit={handleSubmit} className="flex flex-col gap-4">
          
          <div className="flex flex-col gap-1.5 z-[70]">
            <label className="text-sm font-medium text-secondary-700">Nome do Item <span className="text-primary-500">*</span></label>
            <CustomSelect
              value={name}
              onChange={(val) => setName(val)}
              options={(ITEMS_BY_CATEGORY[category] || []).map(i => ({ label: i, value: i }))}
              placeholder="Selecione ou crie..."
              creatable
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-secondary-700">Categoria</label>
            <CustomSelect
              value={category}
              onChange={(val) => {
                setCategory(val as InventoryCategory)
                setName('')
              }}
              options={INVENTORY_CATEGORIES}
            />
  
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-secondary-700">Quantidade <span className="text-primary-500">*</span></label>
              <input
                type="number"
                min="0"
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                required
                className="rounded-[var(--radius-button)] border border-warm-200 bg-surface px-3 py-2 text-sm focus:border-primary-400 focus:outline-none focus:ring-1 focus:ring-primary-400"
              />
            </div>
            
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-secondary-700">Unidade</label>
              <input
                type="text"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="rounded-[var(--radius-button)] border border-warm-200 bg-surface px-3 py-2 text-sm focus:border-primary-400 focus:outline-none focus:ring-1 focus:ring-primary-400"
                placeholder="Ex: un, cx, kg"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-secondary-700">Stock Mínimo (Alerta)</label>
            <input
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
            <label className="text-sm font-medium text-secondary-700">Localização</label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="rounded-[var(--radius-button)] border border-warm-200 bg-surface px-3 py-2 text-sm focus:border-primary-400 focus:outline-none focus:ring-1 focus:ring-primary-400"
              placeholder="Ex: Armário 2, Sala da Associação"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-secondary-700">Observações</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="resize-none rounded-[var(--radius-card)] border border-warm-200 bg-surface px-3 py-2 text-sm focus:border-primary-400 focus:outline-none focus:ring-1 focus:ring-primary-400"
              placeholder="Detalhes sobre o estado de conservação, etc."
            />
          </div>

        
<div className="border-t border-warm-200 bg-surface p-4">
        <button
          type="submit"
          form="inventory-form"
          disabled={isLoading}
          className="flex w-full items-center justify-center rounded-[var(--radius-button)] bg-primary-400 py-3 text-sm font-medium text-white shadow-sm transition-all hover:bg-primary-500 active:scale-95 disabled:opacity-50"
        >
          {isLoading ? 'A Guardar...' : 'Guardar Item'}
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
</div>
  )
}
