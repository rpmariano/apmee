import { useState } from 'react'
import { Plus, Trash2, Package } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { CustomSelect } from '@/components/ui/custom-select'
import { useInventory } from '@/features/inventory/api/use-inventory'

interface EventInventoryManagerProps {
  eventId: string
  eventStatus: string
}

export function EventInventoryManager({ eventId, eventStatus }: EventInventoryManagerProps) {
  const queryClient = useQueryClient()
  const { data: inventory } = useInventory()
  
  const [selectedItemId, setSelectedItemId] = useState('')
  const [quantity, setQuantity] = useState(1)

  const { data: requirements, isLoading } = useQuery({
    queryKey: ['event-inventory', eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('event_inventory')
        .select('*, item:inventory_items(*)')
        .eq('event_id', eventId)
      
      if (error) throw error
      return data
    }
  })

  const addMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('event_inventory')
        .insert({ event_id: eventId, item_id: selectedItemId, quantity } as any)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event-inventory', eventId] })
      setSelectedItemId('')
      setQuantity(1)
    }
  })

  const removeMutation = useMutation({
    mutationFn: async (reqId: string) => {
      const { error } = await supabase
        .from('event_inventory')
        .delete()
        .eq('id', reqId)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event-inventory', eventId] })
    }
  })

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedItemId || quantity <= 0) return
    
    // Check max stock
    const item = inventory?.find(i => i.id === selectedItemId)
    if (item && quantity > item.quantity) {
      alert(`Não é possível requisitar ${quantity}. Só existem ${item.quantity} no inventário.`)
      return
    }

    addMutation.mutate()
  }

  const isCompleted = eventStatus === 'completed'
  const isCancelled = eventStatus === 'cancelled'
  const isLocked = isCompleted || isCancelled

  return (
    <div className="flex flex-col gap-4 border-t border-warm-200 pt-6 mt-2">
      <h3 className="text-sm font-bold uppercase tracking-wider text-secondary-600">
        Material do Inventário
      </h3>

      {isLocked && (
        <div className="rounded-[var(--radius-card)] bg-warm-100 p-3 text-xs text-secondary-600">
          O evento está {isCompleted ? 'Concluído' : 'Cancelado'}. A lista de material está bloqueada e os movimentos de stock já foram processados automaticamente.
        </div>
      )}

      {!isLocked && (
        <form onSubmit={handleAdd} className="flex flex-col gap-3 rounded-[var(--radius-card)] bg-warm-50 p-4 border border-warm-200">
          <div className="flex flex-col gap-1.5 z-[50]">
            <label className="text-xs font-medium text-secondary-700">Adicionar Item</label>
            <CustomSelect
              value={selectedItemId}
              onChange={(val) => setSelectedItemId(val)}
              options={(inventory || []).filter(i => i.quantity > 0).map(i => ({ 
                label: `${i.name} (Disponível: ${i.quantity})`, 
                value: i.id 
              }))}
              placeholder="Escolha um item com stock..."
            />
          </div>
          
          <div className="flex items-end gap-3">
            <div className="flex flex-1 flex-col gap-1.5">
              <label className="text-xs font-medium text-secondary-700">Qtd.</label>
              <input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                className="rounded-md border border-warm-200 px-3 py-2 text-sm focus:border-primary-400 focus:outline-none"
              />
            </div>
            <button
              type="submit"
              disabled={addMutation.isPending || !selectedItemId}
              className="rounded-md bg-secondary-600 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-secondary-700 disabled:opacity-50"
            >
              <Plus className="h-5 w-5" />
            </button>
          </div>
        </form>
      )}

      <div className="flex flex-col gap-2">
        {isLoading ? (
          <div className="h-10 w-full animate-pulse rounded-md bg-warm-100" />
        ) : requirements?.length === 0 ? (
          <p className="text-xs text-muted text-center py-2">Nenhum material associado a este evento.</p>
        ) : (
          requirements?.map((req: any) => (
            <div key={req.id} className="flex items-center justify-between rounded-md border border-warm-200 bg-surface p-3 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-warm-100 text-secondary-600">
                  <Package className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground">{req.item?.name}</p>
                  <p className="text-xs text-muted">Qtd: {req.quantity}</p>
                </div>
              </div>
              {!isLocked && (
                <button
                  type="button"
                  onClick={() => removeMutation.mutate(req.id)}
                  className="rounded-md p-2 text-red-500 hover:bg-red-50 transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
