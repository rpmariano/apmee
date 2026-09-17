import { AlertTriangle, AlertCircle, CheckCircle2, Info } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface CustomDialogProps {
  isOpen: boolean
  title: string
  description?: string | React.ReactNode
  variant?: 'warning' | 'danger' | 'info' | 'success'
  confirmLabel?: string
  cancelLabel?: string
  onConfirm: () => void
  onCancel?: () => void
  isLoading?: boolean
}

/**
 * Custom modal dialog to replace native browser window.alert and window.confirm.
 * Supports warning, danger, info, and success variants.
 */
export function CustomDialog({
  isOpen,
  title,
  description,
  variant = 'warning',
  confirmLabel = 'OK',
  cancelLabel,
  onConfirm,
  onCancel,
  isLoading,
}: CustomDialogProps) {
  if (!isOpen) return null

  const isConfirm = !!cancelLabel

  const icons = {
    warning: <AlertTriangle className="h-6 w-6 text-orange-600" />,
    danger: <AlertCircle className="h-6 w-6 text-red-600" />,
    info: <Info className="h-6 w-6 text-primary-500" />,
    success: <CheckCircle2 className="h-6 w-6 text-green-600" />,
  }

  const iconBgs = {
    warning: 'bg-orange-100',
    danger: 'bg-red-100',
    info: 'bg-primary-100',
    success: 'bg-green-100',
  }

  const confirmBtnStyles = {
    warning: 'bg-orange-500 hover:bg-orange-600 text-white',
    danger: 'bg-red-500 hover:bg-red-600 text-white',
    info: 'bg-secondary-900 hover:bg-secondary-800 text-white',
    success: 'bg-green-600 hover:bg-green-700 text-white',
  }

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm transition-all animate-in fade-in duration-200">
      <div className="w-full max-w-sm rounded-[var(--radius-card)] bg-surface p-6 shadow-2xl animate-in zoom-in-95 duration-200 border border-warm-200">
        <div className="flex items-start gap-3">
          <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-full', iconBgs[variant])}>
            {icons[variant]}
          </div>
          <div className="flex-1">
            <h3 className="text-base font-bold text-foreground">{title}</h3>
            {description && (
              <div className="mt-1.5 text-xs leading-relaxed text-secondary-600 whitespace-pre-line">
                {description}
              </div>
            )}
          </div>
        </div>

        <div className={cn('mt-6 flex gap-2', isConfirm ? 'flex-row' : 'flex-col')}>
          {isConfirm && onCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={isLoading}
              className="flex-1 rounded-[var(--radius-button)] bg-warm-100 py-2.5 text-xs font-bold text-secondary-700 transition-all hover:bg-warm-200 active:scale-95 disabled:opacity-50"
            >
              {cancelLabel}
            </button>
          )}
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={cn(
              'flex-1 rounded-[var(--radius-button)] py-2.5 text-xs font-bold transition-all active:scale-95 disabled:opacity-50',
              confirmBtnStyles[variant]
            )}
          >
            {isLoading ? 'A processar...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
