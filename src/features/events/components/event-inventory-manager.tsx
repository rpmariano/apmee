import { useState, useEffect, useRef } from 'react'
import { Plus, Minus, Trash2, Package, AlertTriangle } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { CustomSelect } from '@/components/ui/custom-select'
import { CustomDialog } from '@/components/ui/custom-dialog'
import { useInventory, useCreateItem } from '@/features/inventory/api/use-inventory'
import { useEventInventoryStatus, type EventInventoryRequirement } from '../api/use-event-inventory-status'
import type { InventoryCategory } from '@/types/database'
import { cn } from '@/lib/utils'

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

interface EventInventoryManagerProps {
  eventId: string
  eventStatus: string
  isEditing: boolean
  onDirtyChange?: (isDirty: boolean) => void
  onShortagesChange?: (
    shortages: { requirement: EventInventoryRequirement; available: number }[],
    hasShortages: boolean
  ) => void
  onRegisterSaveHandler?: (handler: (() => Promise<void>) | null) => void
  /** Mantido para retrocompatibilidade */
  onRegisterPendingHandler?: (handler: (() => Promise<void>) | null) => void
}

export function EventInventoryManager({
  eventId,
  eventStatus,
  isEditing,
  onDirtyChange,
  onShortagesChange,
  onRegisterSaveHandler,
  onRegisterPendingHandler,
}: EventInventoryManagerProps) {
  const queryClient = useQueryClient()
  const { data: inventory } = useInventory()
  const createItemMutation = useCreateItem()
  const { requirements, isLoading } = useEventInventoryStatus(eventId)

  // Local requirements state (staged in memory until the event form is saved)
  const [localRequirements, setLocalRequirements] = useState<EventInventoryRequirement[]>([])
  const [initialRequirements, setInitialRequirements] = useState<EventInventoryRequirement[]>([])
  const [isInitialized, setIsInitialized] = useState(false)
  const lastEventIdRef = useRef(eventId)

  // Form state for adding
  const [activeCategory, setActiveCategory] = useState<InventoryCategory>('consumivel')
  const [selectedItemValue, setSelectedItemValue] = useState('')
  const [quantity, setQuantity] = useState(1)

  // In-line editing quantities map { [reqId]: number }
  const [editingQuantities, setEditingQuantities] = useState<Record<string, number>>({})

  // Custom dialog state
  const [deleteReqId, setDeleteReqId] = useState<string | null>(null)
  const [dialogConfig, setDialogConfig] = useState<{
    isOpen: boolean
    title: string
    description?: string
    variant?: 'warning' | 'danger' | 'info' | 'success'
    confirmLabel?: string
  }>({ isOpen: false, title: '' })

  // Determine whether inventory has uncommitted changes
  const isDirty = (() => {
    if (!isInitialized) return false
    // If user has typed something in the selection input that wasn't added yet
    if (selectedItemValue.trim().length > 0) return true

    if (localRequirements.length !== initialRequirements.length) return true

    for (const req of localRequirements) {
      if (req.id.startsWith('temp_')) return true
      const orig = initialRequirements.find((i) => i.id === req.id)
      if (!orig) return true
      if (orig.quantity !== req.quantity) return true
    }

    return false
  })()

  // Reset initialization when switching events
  useEffect(() => {
    if (lastEventIdRef.current !== eventId) {
      lastEventIdRef.current = eventId
      setIsInitialized(false)
    }
  }, [eventId])

  // Initialize or update localRequirements from database query
  useEffect(() => {
    if (requirements) {
      if (!isInitialized) {
        setLocalRequirements(requirements)
        setInitialRequirements(requirements)
        setIsInitialized(true)
      } else if (!isDirty) {
        setLocalRequirements(requirements)
        setInitialRequirements(requirements)
      }
    }
  }, [requirements, isInitialized, isDirty])

  // Calculate live shortages based on staged local requirements
  const shortages = (localRequirements || [])
    .map((req) => {
      const stockItem = inventory?.find((i) => i.id === req.item_id)
      const available = stockItem?.quantity ?? 0
      return { requirement: req, available }
    })
    .filter(({ requirement, available }) => requirement.quantity > available)

  const hasShortages = shortages.length > 0

  useEffect(() => {
    onShortagesChange?.(shortages, hasShortages)
  }, [shortages.length, hasShortages, onShortagesChange])

  // Notify parent of dirty state changes
  useEffect(() => {
    if (isInitialized) {
      onDirtyChange?.(isDirty)
    }
  }, [isDirty, isInitialized, onDirtyChange])

  const handleAdd = (e?: React.MouseEvent | React.FormEvent) => {
    e?.preventDefault()
    e?.stopPropagation()

    if (!selectedItemValue.trim()) return

    const trimmed = selectedItemValue.trim()
    const existingItem = inventory?.find(
      (i) => i.id === trimmed || i.name.toLowerCase() === trimmed.toLowerCase()
    )

    if (existingItem) {
      const existingReqIndex = localRequirements.findIndex((r) => r.item_id === existingItem.id)
      if (existingReqIndex >= 0) {
        setLocalRequirements((prev) =>
          prev.map((r, idx) =>
            idx === existingReqIndex ? { ...r, quantity: r.quantity + quantity } : r
          )
        )
      } else {
        const newReq: EventInventoryRequirement = {
          id: `temp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          event_id: eventId,
          item_id: existingItem.id,
          quantity,
          item: existingItem,
        }
        setLocalRequirements((prev) => [...prev, newReq])
      }
    } else {
      // New item name typed by user (creatable)
      const tempItemId = `temp_item_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`
      const tempItem: any = {
        id: tempItemId,
        name: trimmed,
        category: activeCategory,
        quantity: 0,
        unit: 'un',
        min_stock: 0,
        isNewCatalogItem: true,
      }
      const newReq: EventInventoryRequirement = {
        id: `temp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        event_id: eventId,
        item_id: tempItemId,
        quantity,
        item: tempItem,
      }
      setLocalRequirements((prev) => [...prev, newReq])
    }

    setSelectedItemValue('')
    setQuantity(1)
  }

  const handleUpdateQuantity = (reqId: string, newQty: number) => {
    if (newQty <= 0) return
    setLocalRequirements((prev) =>
      prev.map((r) => (r.id === reqId ? { ...r, quantity: newQty } : r))
    )
  }

  const handleDeleteItem = (reqId: string) => {
    setLocalRequirements((prev) => prev.filter((r) => r.id !== reqId))
  }

  // Persist all staged inventory changes to database
  const saveInventory = async () => {
    let currentList = [...localRequirements]

    // If an item was typed in the select input and hasn't been added yet, incorporate it
    if (selectedItemValue.trim()) {
      const trimmed = selectedItemValue.trim()
      const existing = inventory?.find(
        (i) => i.id === trimmed || i.name.toLowerCase() === trimmed.toLowerCase()
      )
      if (existing) {
        const existIdx = currentList.findIndex((r) => r.item_id === existing.id)
        if (existIdx >= 0) {
          currentList = currentList.map((r, idx) =>
            idx === existIdx ? { ...r, quantity: r.quantity + quantity } : r
          )
        } else {
          currentList.push({
            id: `temp_${Date.now()}`,
            event_id: eventId,
            item_id: existing.id,
            quantity,
            item: existing,
          })
        }
      } else {
        const tempItemId = `temp_item_${Date.now()}`
        currentList.push({
          id: `temp_${Date.now()}`,
          event_id: eventId,
          item_id: tempItemId,
          quantity,
          item: {
            id: tempItemId,
            name: trimmed,
            category: activeCategory,
            quantity: 0,
            unit: 'un',
            min_stock: 0,
            isNewCatalogItem: true,
          } as any,
        })
      }
    }

    // 1. Delete removed items
    const toDelete = initialRequirements.filter(
      (init) => !currentList.some((curr) => curr.id === init.id)
    )
    if (toDelete.length > 0) {
      const { error: delErr } = await (supabase as any)
        .from('event_inventory')
        .delete()
        .in(
          'id',
          toDelete.map((d) => d.id)
        )
      if (delErr) {
        console.error('Error deleting event_inventory items:', delErr)
        throw delErr
      }
    }

    // 2. Update modified quantities
    const toUpdate = currentList.filter((curr) => {
      const init = initialRequirements.find((i) => i.id === curr.id)
      return init && init.quantity !== curr.quantity
    })
    for (const item of toUpdate) {
      const { error: updErr } = await (supabase as any)
        .from('event_inventory')
        .update({ quantity: item.quantity })
        .eq('id', item.id)
      if (updErr) {
        console.error('Error updating event_inventory item:', updErr)
        throw updErr
      }
    }

    // 3. Insert new items
    const toInsert = currentList.filter(
      (curr) => curr.id.startsWith('temp_') || !initialRequirements.some((i) => i.id === curr.id)
    )
    for (const item of toInsert) {
      let finalItemId = item.item_id
      if ((item.item as any)?.isNewCatalogItem) {
        const createdCatalogItem = await createItemMutation.mutateAsync({
          name: item.item!.name,
          category: item.item!.category,
          quantity: 0,
          unit: 'un',
          min_stock: 0,
        })
        finalItemId = createdCatalogItem.id
      }

      const { error: insErr } = await (supabase as any)
        .from('event_inventory')
        .insert({
          event_id: eventId,
          item_id: finalItemId,
          quantity: item.quantity,
        })
      if (insErr) {
        console.error('Error inserting event_inventory item:', insErr)
        throw insErr
      }
    }

    // Update initial requirements to match current list so isDirty becomes false
    setInitialRequirements(currentList)
    setLocalRequirements(currentList)
    setSelectedItemValue('')

    queryClient.invalidateQueries({ queryKey: ['event-inventory', eventId] })
    queryClient.invalidateQueries({ queryKey: ['inventory'] })
    queryClient.invalidateQueries({ queryKey: ['captive-stock'] })
  }

  // Register save handler with parent form
  useEffect(() => {
    if (onRegisterSaveHandler) {
      onRegisterSaveHandler(saveInventory)
    }
    if (onRegisterPendingHandler) {
      onRegisterPendingHandler(saveInventory)
    }
  }, [
    onRegisterSaveHandler,
    onRegisterPendingHandler,
    localRequirements,
    initialRequirements,
    selectedItemValue,
    quantity,
    activeCategory,
    inventory,
    eventId,
  ])

  const isCompleted = eventStatus === 'completed'
  const isCancelled = eventStatus === 'cancelled'
  const isLocked = isCompleted || isCancelled || !isEditing

  // Group requirements by category
  const groupedRequirements = (localRequirements || []).reduce(
    (acc, req) => {
      const cat = req.item?.category || 'outro'
      if (!acc[cat]) acc[cat] = []
      acc[cat].push(req)
      return acc
    },
    {} as Record<string, typeof localRequirements>
  )

  // Build select options — filtered by category and exclude already added
  const itemOptions = (inventory || [])
    .filter((i) => i.category === activeCategory)
    .filter((i) => {
      const alreadyAdded = localRequirements?.some((r) => r.item_id === i.id)
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
              disabled={!selectedItemValue.trim()}
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
        {isLoading && !isInitialized ? (
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
                            {req.item?.name || 'Item'}
                          </p>
                          <div className="flex items-center gap-2">
                            {!isEditing || isCompleted || isCancelled ? (
                              <p className="text-xs text-muted">
                                Necessário: {req.quantity}
                              </p>
                            ) : null}
                            {isShort && (
                              <span className="text-xs font-bold text-orange-700">
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
                                if (req.quantity > 1) {
                                  handleUpdateQuantity(req.id, req.quantity - 1)
                                }
                              }}
                              disabled={req.quantity <= 1}
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
                                  handleUpdateQuantity(req.id, val)
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
                                    handleUpdateQuantity(req.id, val)
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
                                handleUpdateQuantity(req.id, req.quantity + 1)
                              }}
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
            handleDeleteItem(deleteReqId)
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
