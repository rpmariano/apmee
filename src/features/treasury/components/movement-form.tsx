import { useState } from 'react'
import { X } from 'lucide-react'
import type { FinancialMovement, FinancialType } from '@/types/database'

interface MovementFormProps {
  movement?: FinancialMovement
  onClose: () => void
  onSubmit: (data: Partial<FinancialMovement>) => void
  isLoading?: boolean
}

// Convert ISO to YYYY-MM-DD for date input
function toDateString(isoString?: string | null) {
  if (!isoString) return new Date().toISOString().split('T')[0]
  return isoString.split('T')[0]
}

export function MovementForm({ movement, onClose, onSubmit, isLoading }: MovementFormProps) {
  const [type, setType] = useState<FinancialType>(movement?.type ?? 'expense')
  const [amount, setAmount] = useState(movement?.amount ?? '')
  const [description, setDescription] = useState(movement?.description ?? '')
  const [category, setCategory] = useState(movement?.category ?? '')
  const [date, setDate] = useState(toDateString(movement?.date))
  const [receiptUrl, setReceiptUrl] = useState(movement?.receipt_url ?? '')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Add time part to make it a valid TIMESTAMPTZ
    const dateIso = date ? new Date(`${date}T12:00:00Z`).toISOString() : new Date().toISOString()

    onSubmit({
      type,
      amount: Number(amount),
      description,
      category: category || null,
      date: dateIso,
      receipt_url: receiptUrl || null,
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background">
      <div className="flex items-center justify-between border-b border-warm-200 bg-surface px-4 py-4">
        <h2 className="text-lg font-bold text-foreground">
          {movement ? 'Editar Movimento' : 'Novo Movimento'}
        </h2>
        <button onClick={onClose} className="rounded-full p-2 text-muted hover:bg-warm-100">
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <form id="movement-form" onSubmit={handleSubmit} className="flex flex-col gap-4">
          
          {/* Type Toggle */}
          <div className="flex rounded-[var(--radius-button)] bg-warm-100 p-1">
            <button
              type="button"
              onClick={() => setType('expense')}
              className={`flex-1 rounded-md py-2 text-sm font-medium transition-all ${
                type === 'expense' ? 'bg-white text-red-600 shadow-sm' : 'text-secondary-600 hover:text-foreground'
              }`}
            >
              Despesa
            </button>
            <button
              type="button"
              onClick={() => setType('income')}
              className={`flex-1 rounded-md py-2 text-sm font-medium transition-all ${
                type === 'income' ? 'bg-white text-green-600 shadow-sm' : 'text-secondary-600 hover:text-foreground'
              }`}
            >
              Receita
            </button>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-secondary-700">Valor (€) <span className="text-primary-500">*</span></label>
            <input
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
            <label className="text-sm font-medium text-secondary-700">Descrição <span className="text-primary-500">*</span></label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              className="rounded-[var(--radius-button)] border border-warm-200 bg-surface px-3 py-2 text-sm focus:border-primary-400 focus:outline-none focus:ring-1 focus:ring-primary-400"
              placeholder="Ex: Compra de Resmas de Papel"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-secondary-700">Categoria</label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="rounded-[var(--radius-button)] border border-warm-200 bg-surface px-3 py-2 text-sm focus:border-primary-400 focus:outline-none focus:ring-1 focus:ring-primary-400"
                placeholder="Ex: Material Escolar"
              />
            </div>
            
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-secondary-700">Data <span className="text-primary-500">*</span></label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="rounded-[var(--radius-button)] border border-warm-200 bg-surface px-3 py-2 text-sm focus:border-primary-400 focus:outline-none focus:ring-1 focus:ring-primary-400"
              />
            </div>
          </div>

          <div className="my-2 border-t border-warm-200" />

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-secondary-700">Link do Comprovativo / Fatura</label>
            <input
              type="url"
              value={receiptUrl}
              onChange={(e) => setReceiptUrl(e.target.value)}
              className="rounded-[var(--radius-button)] border border-warm-200 bg-surface px-3 py-2 text-sm focus:border-primary-400 focus:outline-none focus:ring-1 focus:ring-primary-400"
              placeholder="https://..."
            />
            <p className="text-xs text-muted">Acesso na cloud ao recibo para justificação de contas.</p>
          </div>

        </form>
      </div>

      <div className="border-t border-warm-200 bg-surface p-4">
        <button
          type="submit"
          form="movement-form"
          disabled={isLoading}
          className="flex w-full items-center justify-center rounded-[var(--radius-button)] bg-primary-400 py-3 text-sm font-medium text-white shadow-sm transition-all hover:bg-primary-500 active:scale-95 disabled:opacity-50"
        >
          {isLoading ? 'A Guardar...' : 'Guardar Movimento'}
        </button>
      </div>
    </div>
  )
}
