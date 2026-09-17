import { useState } from 'react'
import { X, ArrowDownRight, ArrowUpRight } from 'lucide-react'
import type { InventoryItem } from '@/types/database'
import { useCreateInventoryTransaction } from '../api/use-inventory-transactions'
import { useEvents } from '@/features/events/api/use-events'
import { CustomSelect } from '@/components/ui/custom-select'
import { CustomDialog } from '@/components/ui/custom-dialog'

interface TransactionFormProps {
  item: InventoryItem
  onClose: () => void
}

export function TransactionForm({ item, onClose }: TransactionFormProps) {
  const [type, setType] = useState<'in' | 'out'>('out')
  const [quantity, setQuantity] = useState(1)
  const [eventId, setEventId] = useState('')
  const [notes, setNotes] = useState('')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const { data: events } = useEvents()
  const createMutation = useCreateInventoryTransaction()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (quantity <= 0) return

    try {
      await createMutation.mutateAsync({
        item_id: item.id,
        type,
        quantity,
        event_id: eventId || null,
        notes: notes || null
      })
      onClose()
    } catch (err: any) {
      console.error(err)
      setErrorMessage(err?.message || 'Erro ao registar movimento.')
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-background/80 backdrop-blur-sm">
      <div className="flex flex-1 flex-col justify-end sm:justify-center sm:items-center p-4">
        <div className="w-full max-w-md rounded-3xl bg-surface shadow-2xl overflow-hidden flex flex-col animate-in slide-in-from-bottom-8">
          
          <div className="flex items-center justify-between border-b border-warm-200 bg-surface px-6 py-4">
            <h2 className="text-lg font-bold text-foreground">
              Movimento de Stock
            </h2>
            <button onClick={onClose} aria-label="Fechar formulário" className="rounded-full p-2 text-muted hover:bg-warm-100">
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="p-6">
            <div className="mb-6 rounded-xl bg-warm-50 p-4 border border-warm-100 text-center">
              <p className="text-sm text-secondary-600">Item</p>
              <p className="text-lg font-bold text-foreground">{item.name}</p>
              <p className="text-sm font-medium text-muted mt-1">Stock atual: {item.quantity}</p>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              
              <div className="flex rounded-[var(--radius-button)] bg-warm-100 p-1">
                <button
                  type="button"
                  onClick={() => setType('in')}
                  className={
                    "flex-1 flex items-center justify-center gap-2 rounded-md py-2 text-sm font-bold transition-all " +
                    (type === 'in' ? 'bg-white text-green-600 shadow-sm' : 'text-secondary-600 hover:text-foreground')
                  }
                >
                  <ArrowDownRight className="h-4 w-4" />
                  Entrada
                </button>
                <button
                  type="button"
                  onClick={() => setType('out')}
                  className={
                    "flex-1 flex items-center justify-center gap-2 rounded-md py-2 text-sm font-bold transition-all " +
                    (type === 'out' ? 'bg-white text-red-600 shadow-sm' : 'text-secondary-600 hover:text-foreground')
                  }
                >
                  <ArrowUpRight className="h-4 w-4" />
                  Saída
                </button>
              </div>

              <div className="flex flex-col gap-1.5 z-[60]">
                <label className="text-sm font-medium text-secondary-700">Evento Associado (Opcional)</label>
                <CustomSelect
                  value={eventId}
                  onChange={(val) => setEventId(val)}
                  options={(events || []).map(e => ({ label: e.title, value: e.id }))}
                  placeholder="Sem evento"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="trans-quantity" className="text-sm font-medium text-secondary-700">Quantidade</label>
                  <input id="trans-quantity"
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                    required
                    className="rounded-[var(--radius-button)] border border-warm-200 bg-surface px-3 py-2 text-lg font-bold text-center focus:border-primary-400 focus:outline-none focus:ring-1 focus:ring-primary-400"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="trans-notes" className="text-sm font-medium text-secondary-700">Notas (Opcional)</label>
                <textarea id="trans-notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  className="w-full rounded-[var(--radius-button)] border border-warm-200 bg-surface px-3 py-2 text-sm focus:border-primary-400 focus:outline-none focus:ring-1 focus:ring-primary-400"
                  placeholder="Ex: Restou da festa..."
                />
              </div>

              <button
                type="submit"
                disabled={createMutation.isPending || quantity <= 0}
                className="mt-2 w-full rounded-[var(--radius-button)] bg-primary-500 px-4 py-3 text-sm font-bold text-white shadow-sm transition-transform hover:bg-primary-600 active:scale-95 disabled:opacity-50 disabled:active:scale-100"
              >
                {createMutation.isPending ? 'A registar...' : 'Registar Movimento'}
              </button>
            </form>
          </div>
        </div>
      </div>

      <CustomDialog
        isOpen={!!errorMessage}
        title="Erro no movimento"
        description={errorMessage || ''}
        variant="danger"
        confirmLabel="OK"
        onConfirm={() => setErrorMessage(null)}
      />
    </div>
  )
}
