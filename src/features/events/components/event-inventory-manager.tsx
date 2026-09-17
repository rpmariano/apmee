import { useState } from 'react'
import { Plus, Trash2, Package, AlertTriangle } from 'lucide-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { CustomSelect } from '@/components/ui/custom-select'
import { useInventory, useCreateItem } from '@/features/inventory/api/use-inventory'
import { useEventInventoryStatus } from '../api/use-event-inventory-status'
import type { InventoryCategory } from '@/types/database'
import { cn } from '@/lib/utils'

const INVENTORY_CATEGORIES_OPTIONS = [
  { label: 'Consumíveis', value: 'consumivel' },
  { label: 'Alimentos', value: 'alimento' },
  { label: 'Mobilizado', value: 'mobilizado' },
]

const CATEGORY_LABELS: Record<string, string> = {
  consumivel: 'Consumíveis',
  alimento: 'Alimentos',
  mobilizado: 'Mobilizado',
}

const ITEMS_BY_CATEGORY: Record<string, string[]> = {
  consumivel: ['Pratos de papel', 'Pratos de Plástico', 'Talheres', 'Guardanapos', 'Copos de plástico'],
  alimento: ['Pacote batata frita', 'Pacote de pipocas', 'Sumos Naturais', 'Refrigerantes', 'Água', 'Pão cachorro', 'Salsicha'],
  mobilizado: ['Microfone', 'Coluna', 'Máquina Café'],
}

interface EventInventoryManagerProps {
  eventId: string
  eventStatus: string
  isEditing: boolean
}

export function EventInventoryManager({ eventId, eventStatus, isEditing }: EventInventoryManagerProps) {
  const queryClient = useQueryClient()
  const { data: inventory } = useInventory()
  const createItemMutation = useCreateItem()
  const { requirements, shortages, hasShortages, isLoading } = useEventInventoryStatus(eventId)

  // Form state for adding
  const [selectedItemId, setSelectedItemId] = useState('')
  const [newItemName, setNewItemName] = useState('')
  const [newItemCategory, setNewItemCategory] = useState<InventoryCategory>('consumivel')
  const [quantity, setQuantity] = useState(1)
  const [isCreatingNew, setIsCreatingNew] = useState(false)

  const addMutation = useMutation({
    mutationFn: async (itemId: string) => {
      const { error } = await (supabase as any)
        .from('event_inventory')
        .insert({ event_id: eventId, item_id: itemId, quantity })
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event-inventory', eventId] })
      setSelectedItemId('')
      setNewItemName('')
      setQuantity(1)
      setIsCreatingNew(false)
    },
  })

  const removeMutation = useMutation({
    mutationFn: async (reqId: string) => {
      const { error } = await (supabase as any)
        .from('event_inventory')
        .delete()
        .eq('id', reqId)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event-inventory', eventId] })
    },
  })

  const handleAdd = async (e?: React.MouseEvent | React.FormEvent) => {
    e?.preventDefault()
    e?.stopPropagation()

    if (isCreatingNew) {
      if (!newItemName.trim()) return
      try {
        const newItem = await createItemMutation.mutateAsync({
          name: newItemName.trim(),
          category: newItemCategory,
          quantity: 0,
          unit: 'un',
          min_stock: 0,
        })
        await addMutation.mutateAsync(newItem.id)
        queryClient.invalidateQueries({ queryKey: ['inventory'] })
      } catch (err) {
        console.error('Failed to create item:', err)
        alert('Erro ao criar o item.')
      }
    } else {
      if (!selectedItemId) return
      addMutation.mutate(selectedItemId)
    }
  }

  const isCompleted = eventStatus === 'completed'
  const isCancelled = eventStatus === 'cancelled'
  const isLocked = isCompleted || isCancelled || !isEditing

  // Group requirements by category
  const groupedRequirements = (requirements || []).reduce(
    (acc, req) => {
      const cat = req.item?.category || 'outro'
      if (!acc[cat]) acc[cat] = []
      acc[cat].push(req)
      return acc
    },
    {} as Record<string, typeof requirements>
  )

  // Build select options — all inventory items (even zero stock in planned mode)
  const itemOptions = (inventory || [])
    .filter((i) => {
      // Don't show items already added
      const alreadyAdded = requirements?.some((r) => r.item_id === i.id)
      return !alreadyAdded
    })
    .map((i) => ({
      label: `${i.name} (Stock: ${i.quantity})`,
      value: i.id,
    }))

  const shortageMap = new Map(shortages.map((s) => [s.requirement.id, s.available]))

  return (
    <div className="flex flex-col gap-4 border-t border-warm-200 pt-6 mt-2">
      <h3 className="text-sm font-bold uppercase tracking-wider text-secondary-600">
        Material do Inventário
      </h3>

      {/* Shortage alert */}
      {hasShortages && (
        <div className="flex items-start gap-2 rounded-[var(--radius-card)] border border-orange-200 bg-orange-50 p-3">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-orange-600" />
          <div>
            <p className="text-xs font-bold text-orange-800">Provisão Insuficiente</p>
            <p className="mt-0.5 text-xs text-orange-700">
              {shortages.length} item(ns) sem stock suficiente. Adquira o material em falta antes de concluir o evento.
            </p>
          </div>
        </div>
      )}

      {isLocked && !hasShortages && (
        <div className="rounded-[var(--radius-card)] bg-warm-100 p-3 text-xs text-secondary-600">
          {isCompleted
            ? 'O evento está Concluído. A lista de material está bloqueada e os movimentos de stock já foram processados automaticamente.'
            : isCancelled
              ? 'O evento está Cancelado. A lista de material está bloqueada.'
              : 'Entre em modo de edição para gerir o material.'}
        </div>
      )}

      {/* Add form — only when editing and not locked by status */}
      {isEditing && !isCompleted && !isCancelled && (
        <div
          className="flex flex-col gap-3 rounded-[var(--radius-card)] bg-warm-50 p-4 border border-warm-200"
        >
          {/* Toggle between existing / new item */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setIsCreatingNew(false)}
              className={cn(
                'rounded-full px-3 py-1 text-xs font-medium transition-colors',
                !isCreatingNew
                  ? 'bg-secondary-900 text-white'
                  : 'bg-warm-100 text-secondary-600 hover:bg-warm-200'
              )}
            >
              Item Existente
            </button>
            <button
              type="button"
              onClick={() => setIsCreatingNew(true)}
              className={cn(
                'rounded-full px-3 py-1 text-xs font-medium transition-colors',
                isCreatingNew
                  ? 'bg-secondary-900 text-white'
                  : 'bg-warm-100 text-secondary-600 hover:bg-warm-200'
              )}
            >
              + Criar Novo
            </button>
          </div>

          {isCreatingNew ? (
            <>
              <div className="flex flex-col gap-1.5 z-[50]">
                <label className="text-xs font-medium text-secondary-700">Categoria</label>
                <CustomSelect
                  value={newItemCategory}
                  onChange={(val) => setNewItemCategory(val as InventoryCategory)}
                  options={INVENTORY_CATEGORIES_OPTIONS}
                />
              </div>
              <div className="flex flex-col gap-1.5 z-[40]">
                <label className="text-xs font-medium text-secondary-700">Nome do Item</label>
                <CustomSelect
                  value={newItemName}
                  onChange={(val) => setNewItemName(val)}
                  options={(ITEMS_BY_CATEGORY[newItemCategory] || []).map((n) => ({
                    label: n,
                    value: n,
                  }))}
                  placeholder="Selecione ou escreva..."
                  creatable
                />
              </div>
            </>
          ) : (
            <div className="flex flex-col gap-1.5 z-[50]">
              <label className="text-xs font-medium text-secondary-700">Adicionar Item</label>
              <CustomSelect
                value={selectedItemId}
                onChange={(val) => setSelectedItemId(val)}
                options={itemOptions}
                placeholder="Escolha um item do inventário..."
              />
            </div>
          )}

          <div className="flex items-end gap-3">
            <div className="flex flex-1 flex-col gap-1.5">
              <label className="text-xs font-medium text-secondary-700">Qtd. Necessária</label>
              <input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                className="rounded-md border border-warm-200 px-3 py-2 text-sm focus:border-primary-400 focus:outline-none"
              />
            </div>
            <button
              type="button"
              onClick={handleAdd}
              disabled={
                addMutation.isPending ||
                createItemMutation.isPending ||
                (isCreatingNew ? !newItemName.trim() : !selectedItemId)
              }
              className="rounded-md bg-secondary-600 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-secondary-700 disabled:opacity-50"
            >
              <Plus className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}

      {/* Requirements list grouped by category */}
      <div className="flex flex-col gap-4">
        {isLoading ? (
          <div className="h-10 w-full animate-pulse rounded-md bg-warm-100" />
        ) : Object.keys(groupedRequirements).length === 0 ? (
          <p className="text-xs text-muted text-center py-2">
            Nenhum material associado a este evento.
          </p>
        ) : (
          Object.entries(groupedRequirements).map(([cat, reqs]) => (
            <div key={cat}>
              <h4 className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-secondary-500">
                <Package className="h-3.5 w-3.5" />
                {CATEGORY_LABELS[cat] || cat}
              </h4>
              <div className="flex flex-col gap-2">
                {(reqs || []).map((req) => {
                  const isShort = shortageMap.has(req.id)
                  const available = shortageMap.get(req.id) ?? 0

                  return (
                    <div
                      key={req.id}
                      className={cn(
                        'flex items-center justify-between rounded-md border bg-surface p-3 shadow-sm',
                        isShort
                          ? 'border-orange-200 bg-orange-50'
                          : 'border-warm-200'
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            'flex h-8 w-8 items-center justify-center rounded-md',
                            isShort
                              ? 'bg-orange-100 text-orange-600'
                              : 'bg-warm-100 text-secondary-600'
                          )}
                        >
                          <Package className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-foreground">
                            {req.item?.name || 'Item removido'}
                          </p>
                          <div className="flex items-center gap-2">
                            <p className="text-xs text-muted">
                              Necessário: {req.quantity}
                            </p>
                            {isShort && (
                              <span className="text-[10px] font-bold text-orange-700">
                                (Stock: {available})
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      {isEditing && !isCompleted && !isCancelled && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            removeMutation.mutate(req.id)
                          }}
                          className="rounded-md p-2 text-red-500 hover:bg-red-50 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
