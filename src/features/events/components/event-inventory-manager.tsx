import { useState, useEffect } from 'react'
import { Plus, Minus, Trash2, Package, AlertTriangle } from 'lucide-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { CustomSelect } from '@/components/ui/custom-select'
import { CustomDialog } from '@/components/ui/custom-dialog'
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

interface EventInventoryManagerProps {
  eventId: string
  eventStatus: string
  isEditing: boolean
  onRegisterPendingHandler?: (handler: (() => Promise<void>) | null) => void
}

export function EventInventoryManager({
  eventId,
  eventStatus,
  isEditing,
  onRegisterPendingHandler,
}: EventInventoryManagerProps) {
  const queryClient = useQueryClient()
  const { data: inventory } = useInventory()
  const createItemMutation = useCreateItem()
  const { requirements, shortages, hasShortages, isLoading } = useEventInventoryStatus(eventId)

  // Form state for adding
  const [activeCategory, setActiveCategory] = useState<InventoryCategory>('consumivel')
  const [selectedItemValue, setSelectedItemValue] = useState('')
  const [quantity, setQuantity] = useState(1)

  // In-line editing quantities map { [reqId]: number }
  const [editingQuantities, setEditingQuantities] = useState<Record<string, number>>({})

  // Custom dialog state (replaces window.alert and window.confirm)
  const [deleteReqId, setDeleteReqId] = useState<string | null>(null)
  const [dialogConfig, setDialogConfig] = useState<{
    isOpen: boolean
    title: string
    description?: string
    variant?: 'warning' | 'danger' | 'info' | 'success'
    confirmLabel?: string
  }>({ isOpen: false, title: '' })

  const addMutation = useMutation({
    mutationFn: async (itemId: string) => {
      const { error } = await (supabase as any)
        .from('event_inventory')
        .insert({ event_id: eventId, item_id: itemId, quantity })
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event-inventory', eventId] })
      setSelectedItemValue('')
      setQuantity(1)
    },
    onError: (err: any) => {
      console.error('Error adding item to event:', err)
      setDialogConfig({
        isOpen: true,
        title: 'Erro ao Adicionar Material',
        description: err?.message || 'Verifique as permissões na base de dados.',
        variant: 'danger',
        confirmLabel: 'Entendido',
      })
    },
  })

  const updateQuantityMutation = useMutation({
    mutationFn: async ({ reqId, quantity }: { reqId: string; quantity: number }) => {
      const { error } = await (supabase as any)
        .from('event_inventory')
        .update({ quantity })
        .eq('id', reqId)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event-inventory', eventId] })
    },
    onError: (err: any) => {
      console.error('Error updating quantity:', err)
      setDialogConfig({
        isOpen: true,
        title: 'Erro ao Atualizar Quantidade',
        description: err?.message || 'Não foi possível atualizar a quantidade.',
        variant: 'danger',
        confirmLabel: 'Entendido',
      })
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
    onError: (err: any) => {
      console.error('Error removing item from event:', err)
      setDialogConfig({
        isOpen: true,
        title: 'Erro ao Remover Material',
        description: err?.message || 'Tente novamente.',
        variant: 'danger',
        confirmLabel: 'Entendido',
      })
    },
  })

  const handleAdd = async (e?: React.MouseEvent | React.FormEvent) => {
    e?.preventDefault()
    e?.stopPropagation()

    if (!selectedItemValue.trim()) return

    // Check if the selectedItemValue matches an existing inventory item ID or exact name
    const existingItem = inventory?.find(
      (i) => i.id === selectedItemValue || i.name.toLowerCase() === selectedItemValue.trim().toLowerCase()
    )

    if (!existingItem) {
      // It's a new item name typed by the user, so create it first
      try {
        const newItem = await createItemMutation.mutateAsync({
          name: selectedItemValue.trim(),
          category: activeCategory,
          quantity: 0,
          unit: 'un',
          min_stock: 0,
        })
        await addMutation.mutateAsync(newItem.id)
        queryClient.invalidateQueries({ queryKey: ['inventory'] })
      } catch (err: any) {
        console.error('Failed to create item:', err)
        setDialogConfig({
          isOpen: true,
          title: 'Erro ao Criar Item',
          description: err?.message || 'Não foi possível criar o item no inventário.',
          variant: 'danger',
          confirmLabel: 'Entendido',
        })
      }
    } else {
      // It's an existing item
      try {
        await addMutation.mutateAsync(existingItem.id)
      } catch (err: any) {
        console.error('Failed to add item to event:', err)
      }
    }
  }

  // Register pending handler with parent form so submitting the event also saves pending items
  useEffect(() => {
    if (onRegisterPendingHandler) {
      if (selectedItemValue.trim()) {
        onRegisterPendingHandler(async () => {
          await handleAdd()
        })
      } else {
        onRegisterPendingHandler(null)
      }
    }
  }, [onRegisterPendingHandler, selectedItemValue, activeCategory, quantity, inventory])

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

  // Build select options — filtered by category and exclude already added
  const itemOptions = (inventory || [])
    .filter((i) => i.category === activeCategory)
    .filter((i) => {
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
        <div className="flex flex-col gap-3 rounded-[var(--radius-card)] bg-warm-50 p-4 border border-warm-200">
          
          <div className="flex flex-col gap-1.5 z-[50]">
            <label className="text-xs font-medium text-secondary-700">Categoria</label>
            <div className="flex gap-2">
              {INVENTORY_CATEGORIES_OPTIONS.map((cat) => (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => {
                    setActiveCategory(cat.value as InventoryCategory)
                    setSelectedItemValue('')
                  }}
                  className={cn(
                    'flex-1 rounded-full px-2 py-1.5 text-xs font-medium transition-colors',
                    activeCategory === cat.value
                      ? 'bg-secondary-900 text-white'
                      : 'bg-warm-100 text-secondary-600 hover:bg-warm-200'
                  )}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-1.5 z-[40]">
            <label className="text-xs font-medium text-secondary-700">Nome do Item</label>
            <CustomSelect
              value={selectedItemValue}
              onChange={(val) => setSelectedItemValue(val)}
              options={itemOptions}
              placeholder="Selecione ou escreva..."
              creatable
            />
          </div>

          <div className="flex items-end gap-3">
            <div className="flex flex-1 flex-col gap-1.5">
              <label htmlFor="inv-event-qty" className="text-xs font-medium text-secondary-700">Qtd. Necessária</label>
              <input
                id="inv-event-qty"
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    e.stopPropagation()
                    handleAdd()
                  }
                }}
                className="rounded-md border border-warm-200 px-3 py-2 text-sm focus:border-primary-400 focus:outline-none"
              />
            </div>
            <button
              type="button"
              onClick={handleAdd}
              disabled={
                addMutation.isPending ||
                createItemMutation.isPending ||
                !selectedItemValue.trim()
              }
              className="flex items-center justify-center gap-1.5 rounded-md bg-secondary-900 px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-secondary-800 disabled:opacity-50 h-[38px]"
            >
              <Plus className="h-4 w-4" />
              <span>Adicionar</span>
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
                            {!isEditing || isCompleted || isCancelled ? (
                              <p className="text-xs text-muted">
                                Necessário: {req.quantity}
                              </p>
                            ) : null}
                            {isShort && (
                              <span className="text-[10px] font-bold text-orange-700">
                                (Stock: {available})
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Editing controls for quantity & removal */}
                      {isEditing && !isCompleted && !isCancelled && (
                        <div className="flex items-center gap-2">
                          {/* Quantity stepper control */}
                          <div className="flex items-center rounded-lg border border-warm-300 bg-warm-50 p-0.5 shadow-sm">
                            <button
                              type="button"
                              onClick={() => {
                                const current = req.quantity
                                if (current > 1) {
                                  updateQuantityMutation.mutate({ reqId: req.id, quantity: current - 1 })
                                }
                              }}
                              disabled={req.quantity <= 1 || updateQuantityMutation.isPending}
                              className="flex h-7 w-7 items-center justify-center rounded-md text-secondary-700 transition-colors hover:bg-warm-200 active:scale-95 disabled:opacity-30"
                              title="Diminuir quantidade"
                            >
                              <Minus className="h-3.5 w-3.5" />
                            </button>

                            <input
                              type="number"
                              min="1"
                              aria-label="Editar quantidade"
                              value={editingQuantities[req.id] !== undefined ? editingQuantities[req.id] : req.quantity}
                              onChange={(e) => {
                                const val = parseInt(e.target.value) || 0
                                setEditingQuantities((prev) => ({ ...prev, [req.id]: val }))
                              }}
                              onBlur={() => {
                                const val = editingQuantities[req.id]
                                if (val !== undefined && val > 0 && val !== req.quantity) {
                                  updateQuantityMutation.mutate({ reqId: req.id, quantity: val })
                                }
                                setEditingQuantities((prev) => {
                                  const copy = { ...prev }
                                  delete copy[req.id]
                                  return copy
                                })
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault()
                                  const val = editingQuantities[req.id]
                                  if (val !== undefined && val > 0 && val !== req.quantity) {
                                    updateQuantityMutation.mutate({ reqId: req.id, quantity: val })
                                  }
                                  setEditingQuantities((prev) => {
                                    const copy = { ...prev }
                                    delete copy[req.id]
                                    return copy
                                  })
                                }
                              }}
                              className="w-12 text-center text-xs font-bold text-foreground bg-transparent focus:bg-surface focus:outline-none focus:ring-1 focus:ring-primary-400 rounded py-1"
                              title="Clique para editar o valor"
                            />

                            <button
                              type="button"
                              onClick={() => {
                                updateQuantityMutation.mutate({ reqId: req.id, quantity: req.quantity + 1 })
                              }}
                              disabled={updateQuantityMutation.isPending}
                              className="flex h-7 w-7 items-center justify-center rounded-md text-secondary-700 transition-colors hover:bg-warm-200 active:scale-95 disabled:opacity-30"
                              title="Aumentar quantidade"
                            >
                              <Plus className="h-3.5 w-3.5" />
                            </button>
                          </div>

                          {/* Delete item button */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              setDeleteReqId(req.id)
                            }}
                            className="rounded-md p-1.5 text-red-500 hover:bg-red-50 active:bg-red-100 transition-colors"
                            title="Remover material"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Confirmation Dialog for Item Deletion */}
      <CustomDialog
        isOpen={!!deleteReqId}
        title="Remover Material"
        description="Tem a certeza que deseja remover este material da lista de necessidades do evento?"
        variant="danger"
        confirmLabel="Remover"
        cancelLabel="Cancelar"
        onConfirm={() => {
          if (deleteReqId) {
            removeMutation.mutate(deleteReqId)
            setDeleteReqId(null)
          }
        }}
        onCancel={() => setDeleteReqId(null)}
      />

      {/* Generic Error / Info Custom Dialog */}
      <CustomDialog
        isOpen={dialogConfig.isOpen}
        title={dialogConfig.title}
        description={dialogConfig.description}
        variant={dialogConfig.variant || 'danger'}
        confirmLabel={dialogConfig.confirmLabel || 'OK'}
        onConfirm={() => setDialogConfig((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  )
}
