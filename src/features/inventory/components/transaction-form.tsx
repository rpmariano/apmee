import { useState } from 'react'
import { X, ArrowDownRight, ArrowUpRight, HeartHandshake, AlertCircle } from 'lucide-react'
import type { InventoryItem } from '@/types/database'
import { useCreateInventoryTransaction } from '../api/use-inventory-transactions'
import { useCaptiveStock, getItemAvailability } from '../api/use-captive-stock'
import { CustomDialog } from '@/components/ui/custom-dialog'

interface TransactionFormProps {
  item: InventoryItem
  onClose: () => void
}

type OutReason = 'quebra_stock' | 'doacao'

export function TransactionForm({ item, onClose }: TransactionFormProps) {
  const [type, setType] = useState<'in' | 'out'>('out')
  const [outReason, setOutReason] = useState<OutReason>('quebra_stock')
  const [quantity, setQuantity] = useState(1)
  const [notes, setNotes] = useState('')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const { data: captiveMap } = useCaptiveStock()
  const availability = getItemAvailability(item, captiveMap)
  const createMutation = useCreateInventoryTransaction()

  const maxAllowedOut = availability.availableQuantity

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (quantity <= 0) return

    // Validation for outbound
    if (type === 'out' && quantity > maxAllowedOut) {
      setErrorMessage(
        `Não é possível retirar ${quantity} unidades. Apenas ${maxAllowedOut} unidades estão disponíveis para saída manual (${availability.captiveQuantity} unidade(s) estão cativas para eventos programados).`
      )
      return
    }

    const reasonLabel = type === 'in'
      ? 'Doação'
      : outReason === 'quebra_stock'
      ? 'Quebra de stock'
      : 'Doação'

    const fullNotes = notes.trim()
      ? `${reasonLabel} — ${notes.trim()}`
      : reasonLabel

    try {
      await createMutation.mutateAsync({
        item_id: item.id,
        type,
        quantity,
        event_id: null, // Regra: movimentos manuais de inventário nunca são associados a eventos
        notes: fullNotes,
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
            {/* Item info & captive status */}
            <div className="mb-5 rounded-xl bg-warm-50 p-4 border border-warm-200 text-center">
              <p className="text-xs font-semibold uppercase tracking-wider text-secondary-500">Item</p>
              <p className="text-lg font-bold text-foreground">{item.name}</p>
              <div className="mt-2 flex items-center justify-center gap-2 text-xs">
                <span className="rounded bg-warm-200/70 px-2 py-0.5 font-semibold text-secondary-700">
                  Stock Total: {item.quantity} {item.unit || 'un'}
                </span>
                {availability.captiveQuantity > 0 && (
                  <span className="rounded bg-amber-100 px-2 py-0.5 font-semibold text-amber-800 border border-amber-200">
                    Cativo: {availability.captiveQuantity}
                  </span>
                )}
                <span className="rounded bg-emerald-100 px-2 py-0.5 font-bold text-emerald-800 border border-emerald-200">
                  Disponível: {availability.availableQuantity}
                </span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              
              {/* Type Switcher: Entrada vs Saída */}
              <div className="flex rounded-[var(--radius-button)] bg-warm-100 p-1">
                <button
                  type="button"
                  onClick={() => setType('in')}
                  className={
                    "flex-1 flex items-center justify-center gap-2 rounded-md py-2 text-sm font-bold transition-all " +
                    (type === 'in' ? 'bg-white text-green-700 shadow-sm' : 'text-secondary-600 hover:text-foreground')
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

              {/* Motivo do Movimento */}
              {type === 'in' ? (
                <div className="rounded-xl border border-green-200 bg-green-50/70 p-3.5 flex items-center gap-3">
                  <HeartHandshake className="h-5 w-5 text-green-700 shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-green-900">Motivo de Entrada: Doação</p>
                    <p className="text-[11px] text-green-800 leading-tight mt-0.5">
                      Entradas diretas em inventário correspondem a doações à associação.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-secondary-600">
                    Motivo da Saída <span className="text-primary-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setOutReason('quebra_stock')}
                      className={`
                        rounded-xl border p-3 text-left transition-all text-xs font-semibold
                        ${outReason === 'quebra_stock'
                          ? 'border-red-400 bg-red-50 text-red-800 shadow-xs'
                          : 'border-warm-200 bg-surface text-secondary-600 hover:bg-warm-50'}
                      `}
                    >
                      <span className="block font-bold">Quebra de stock</span>
                      <span className="text-[11px] text-muted font-normal mt-0.5 block">Danos, perda ou validade</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setOutReason('doacao')}
                      className={`
                        rounded-xl border p-3 text-left transition-all text-xs font-semibold
                        ${outReason === 'doacao'
                          ? 'border-blue-400 bg-blue-50 text-blue-800 shadow-xs'
                          : 'border-warm-200 bg-surface text-secondary-600 hover:bg-warm-50'}
                      `}
                    >
                      <span className="block font-bold">Doação</span>
                      <span className="text-[11px] text-muted font-normal mt-0.5 block">Cedência / oferta</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Quantity */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label htmlFor="trans-quantity" className="text-xs font-semibold uppercase tracking-wider text-secondary-600">
                    Quantidade <span className="text-primary-500">*</span>
                  </label>
                  {type === 'out' && (
                    <span className="text-xs text-muted">
                      Máximo disponível: <strong className="text-foreground">{maxAllowedOut}</strong>
                    </span>
                  )}
                </div>
                <input
                  id="trans-quantity"
                  type="number"
                  min="1"
                  max={type === 'out' ? maxAllowedOut : undefined}
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
                  required
                  className="rounded-[var(--radius-button)] border border-warm-200 bg-surface px-3 py-2.5 text-lg font-bold text-center focus:border-primary-400 focus:outline-none focus:ring-1 focus:ring-primary-400"
                />
              </div>

              {/* Notes */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="trans-notes" className="text-xs font-semibold uppercase tracking-wider text-secondary-600">
                  Observações adicionais <span className="text-xs font-normal text-muted">(opcional)</span>
                </label>
                <textarea
                  id="trans-notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  className="w-full rounded-[var(--radius-button)] border border-warm-200 bg-surface px-3 py-2 text-sm focus:border-primary-400 focus:outline-none focus:ring-1 focus:ring-primary-400"
                  placeholder={type === 'in' ? 'Ex: Doador / Família Silva' : 'Ex: Embalagem danificada no transporte...'}
                />
              </div>

              {type === 'out' && availability.captiveQuantity > 0 && (
                <div className="flex items-start gap-2 rounded-xl bg-amber-50 border border-amber-200 p-2.5 text-xs text-amber-800">
                  <AlertCircle className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
                  <span>
                    Existem {availability.captiveQuantity} unidade(s) cativas para eventos programados que não podem ser dadas como saída direta.
                  </span>
                </div>
              )}

              <button
                type="submit"
                disabled={createMutation.isPending || quantity <= 0 || (type === 'out' && quantity > maxAllowedOut)}
                className="mt-2 w-full rounded-[var(--radius-button)] bg-primary-500 px-4 py-3 text-sm font-bold text-white shadow-sm transition-transform hover:bg-primary-600 active:scale-95 disabled:opacity-50 disabled:active:scale-100"
              >
                {createMutation.isPending ? 'A registar...' : 'Confirmar Movimento'}
              </button>
            </form>
          </div>
        </div>
      </div>

      <CustomDialog
        isOpen={!!errorMessage}
        title="Movimento não permitido"
        description={errorMessage || ''}
        variant="danger"
        confirmLabel="OK"
        onConfirm={() => setErrorMessage(null)}
      />
    </div>
  )
}

