import { useState } from 'react'
import { X, ArrowLeftRight, Landmark, Coins, ArrowRight, Trash2 } from 'lucide-react'
import type { FinancialAccount } from '@/types/database'

import { useHardwareBack } from '@/hooks/use-hardware-back'
import { CustomDialog } from '@/components/ui/custom-dialog'

interface TransferFormProps {
  onClose: () => void
  onSubmit: (data: {
    fromAccount: FinancialAccount
    toAccount: FinancialAccount
    amount: number
    date: string
    notes?: string
  }) => Promise<void>
  isLoading?: boolean
  /** If provided, renders the view of an existing transfer (read-only pair display) */
  existingTransferId?: string
  existingDescription?: string
  existingAmount?: number
  existingDate?: string
  existingFromAccount?: FinancialAccount
  existingToAccount?: FinancialAccount
  onDelete?: (transferId: string) => Promise<void>
}

function toDateString(isoString?: string | null) {
  if (!isoString) return new Date().toISOString().split('T')[0]
  return isoString.split('T')[0]
}

export function TransferForm({
  onClose,
  onSubmit,
  isLoading,
  existingTransferId,
  existingDescription,
  existingAmount,
  existingDate,
  existingFromAccount,
  onDelete,
}: TransferFormProps) {
  const isExisting = !!existingTransferId

  // Direction: fromAccount → toAccount
  const [fromAccount, setFromAccount] = useState<FinancialAccount>(existingFromAccount ?? 'banco')
  const toAccount: FinancialAccount = fromAccount === 'banco' ? 'caixa' : 'banco'

  const [amount, setAmount] = useState(existingAmount?.toString() ?? '')
  const [date, setDate] = useState(toDateString(existingDate))
  const [notes, setNotes] = useState(existingDescription?.replace(/Transferência (para|de) (Banco|Caixa) ?— ?/, '') ?? '')

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  useHardwareBack(true, onClose)

  const handleSwap = () => {
    if (isExisting) return
    setFromAccount((prev) => (prev === 'banco' ? 'caixa' : 'banco'))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const numAmount = parseFloat(amount)
    if (!numAmount || numAmount <= 0) return
    setIsSaving(true)
    try {
      await onSubmit({ fromAccount, toAccount, amount: numAmount, date, notes: notes.trim() || undefined })
    } finally {
      setIsSaving(false)
    }
  }

  const handleConfirmDelete = async () => {
    if (!existingTransferId || !onDelete) return
    setIsDeleting(true)
    try {
      await onDelete(existingTransferId)
      onClose()
    } finally {
      setIsDeleting(false)
      setShowDeleteConfirm(false)
    }
  }

  const fromIcon = fromAccount === 'banco'
    ? <Landmark className="h-5 w-5 text-blue-400" />
    : <Coins className="h-5 w-5 text-amber-400" />
  const toIcon = toAccount === 'banco'
    ? <Landmark className="h-5 w-5 text-blue-400" />
    : <Coins className="h-5 w-5 text-amber-400" />
  const fromLabel = fromAccount === 'banco' ? 'Banco' : 'Caixa'
  const toLabel = toAccount === 'banco' ? 'Banco' : 'Caixa'

  return (
    <div className="fixed inset-0 z-[100] flex justify-center bg-black/40 backdrop-blur-xs transition-opacity animate-in fade-in duration-200">
      <div className="flex w-full max-w-[430px] flex-col bg-background shadow-2xl animate-in slide-in-from-bottom-6 duration-200 ease-out">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-warm-200 bg-surface px-4 py-4">
          <div className="flex items-center gap-2">
            <ArrowLeftRight className="h-5 w-5 text-primary-500" />
            <h2 className="text-lg font-bold text-foreground">
              {isExisting ? 'Transferência' : 'Nova Transferência'}
            </h2>
          </div>
          <div className="flex items-center gap-1">
            {isExisting && onDelete && (
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                aria-label="Eliminar transferência"
                className="rounded-full p-2 text-red-400 hover:bg-red-50"
              >
                <Trash2 className="h-5 w-5" />
              </button>
            )}
            <button onClick={onClose} aria-label="Fechar" className="rounded-full p-2 text-muted hover:bg-warm-100">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4">
          <form id="transfer-form" onSubmit={handleSubmit} className="flex flex-col gap-5">

            {/* Direction Selector */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-secondary-700">Direção da Transferência</label>

              <div className="flex items-center gap-2">
                {/* From account — toggle button */}
                <button
                  type="button"
                  onClick={handleSwap}
                  disabled={isExisting}
                  className={`
                    flex flex-1 flex-col items-center gap-1.5 rounded-[var(--radius-card)] border-2 p-3 text-center transition-all
                    ${fromAccount === 'banco'
                      ? 'border-blue-400 bg-blue-50 text-blue-800'
                      : 'border-amber-400 bg-amber-50 text-amber-800'}
                    ${isExisting ? 'cursor-default opacity-80' : 'hover:opacity-90 active:scale-95'}
                  `}
                >
                  {fromIcon}
                  <span className="text-xs font-bold">{fromLabel}</span>
                  <span className="text-xs text-muted">De</span>
                </button>

                {/* Swap Button */}
                <button
                  type="button"
                  onClick={handleSwap}
                  disabled={isExisting}
                  aria-label="Inverter direção"
                  className={`
                    flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-warm-200 bg-surface text-secondary-500 transition-all
                    ${isExisting ? 'cursor-default opacity-40' : 'hover:bg-warm-100 active:scale-95'}
                  `}
                >
                  <ArrowRight className="h-4 w-4" />
                </button>

                {/* To account — display only */}
                <div className={`
                  flex flex-1 flex-col items-center gap-1.5 rounded-[var(--radius-card)] border-2 p-3 text-center
                  ${toAccount === 'banco'
                    ? 'border-blue-200 bg-blue-50/50 text-blue-700'
                    : 'border-amber-200 bg-amber-50/50 text-amber-700'}
                `}>
                  {toIcon}
                  <span className="text-xs font-bold">{toLabel}</span>
                  <span className="text-xs text-muted">Para</span>
                </div>
              </div>

              <p className="text-xs text-muted">
                {isExisting
                  ? `Transferência de ${fromLabel} para ${toLabel}`
                  : 'Toque na conta de origem ou na seta para inverter a direção.'}
              </p>
            </div>

            {/* Amount */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="transfer-amount" className="text-sm font-medium text-secondary-700">
                Valor (€) <span className="text-primary-500">*</span>
              </label>
              <input
                id="transfer-amount"
                type="number"
                step="0.01"
                min="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                readOnly={isExisting}
                placeholder="0,00"
                className="rounded-[var(--radius-button)] border border-warm-200 bg-surface px-3 py-2 text-sm focus:border-primary-400 focus:outline-none focus:ring-1 focus:ring-primary-400 read-only:bg-warm-50 read-only:text-secondary-500"
              />
            </div>

            {/* Date */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="transfer-date" className="text-sm font-medium text-secondary-700">
                Data <span className="text-primary-500">*</span>
              </label>
              <input
                id="transfer-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                readOnly={isExisting}
                className="rounded-[var(--radius-button)] border border-warm-200 bg-surface px-3 py-2 text-sm focus:border-primary-400 focus:outline-none focus:ring-1 focus:ring-primary-400 read-only:bg-warm-50 read-only:text-secondary-500"
              />
            </div>

            {/* Notes */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="transfer-notes" className="text-sm font-medium text-secondary-700">
                Motivo / Nota <span className="text-xs font-normal text-muted">(opcional)</span>
              </label>
              <input
                id="transfer-notes"
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                readOnly={isExisting}
                placeholder="Ex: Levantamento para pagar fornecedor"
                className="rounded-[var(--radius-button)] border border-warm-200 bg-surface px-3 py-2 text-sm focus:border-primary-400 focus:outline-none focus:ring-1 focus:ring-primary-400 read-only:bg-warm-50 read-only:text-secondary-500"
              />
            </div>

            {/* Info note */}
            <div className="rounded-[var(--radius-card)] bg-warm-50 border border-warm-200 px-3 py-2.5 text-xs text-secondary-600">
              <strong>ℹ️ Sobre transferências:</strong> Este movimento não altera o saldo total da associação — apenas redistribui o dinheiro entre Banco e Caixa. Ficam registados dois movimentos espelhados no extrato.
            </div>

          </form>
        </div>

        {/* Footer */}
        {!isExisting && (
          <div className="border-t border-warm-200 bg-surface p-4">
            <button
              type="submit"
              form="transfer-form"
              disabled={isLoading || isSaving}
              className="flex w-full items-center justify-center gap-2 rounded-[var(--radius-button)] bg-primary-400 py-3 text-sm font-medium text-white shadow-sm transition-all hover:bg-primary-500 active:scale-95 disabled:opacity-50"
            >
              <ArrowLeftRight className="h-4 w-4" />
              {(isLoading || isSaving) ? 'A registar...' : `Transferir ${fromLabel} → ${toLabel}`}
            </button>
          </div>
        )}

        {isExisting && onDelete && (
          <div className="border-t border-warm-200 bg-surface p-4">
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              disabled={isDeleting}
              className="flex w-full items-center justify-center gap-2 rounded-[var(--radius-button)] border border-red-200 bg-red-50/70 py-2.5 text-sm font-medium text-red-600 transition-all hover:bg-red-100 active:scale-95 disabled:opacity-50"
            >
              <Trash2 className="h-4 w-4" />
              Eliminar Transferência
            </button>
          </div>
        )}

        <CustomDialog
          isOpen={showDeleteConfirm}
          title="Eliminar Transferência?"
          description="Tem a certeza que pretende eliminar esta transferência? Os dois movimentos associados serão eliminados e os saldos de ambas as contas serão revertidos."
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
