import React, { createContext, useContext, useState, useCallback } from 'react'
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react'
import { cn } from '@/lib/utils'

export type ToastType = 'success' | 'error' | 'info'

export interface ToastItem {
  id: string
  message: string
  type: ToastType
  duration?: number
}

interface ToastContextType {
  toast: {
    success: (message: string, duration?: number) => void
    error: (message: string, duration?: number) => void
    info: (message: string, duration?: number) => void
  }
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const addToast = useCallback(
    (message: string, type: ToastType = 'info', duration = 3500) => {
      const id = `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`
      const newItem: ToastItem = { id, message, type, duration }

      setToasts((prev) => [...prev.slice(-2), newItem])

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id)
        }, duration)
      }
    },
    [removeToast]
  )

  const toast = {
    success: (message: string, duration?: number) => addToast(message, 'success', duration),
    error: (message: string, duration?: number) => addToast(message, 'error', duration),
    info: (message: string, duration?: number) => addToast(message, 'info', duration),
  }

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}

      {/* Mobile-contained Toast Notification Layer */}
      <div 
        aria-live="polite" 
        className="pointer-events-none fixed top-4 left-1/2 -translate-x-1/2 z-[110] flex w-full max-w-[410px] flex-col gap-2 px-3"
      >
        {toasts.map((item) => {
          const isSuccess = item.type === 'success'
          const isError = item.type === 'error'

          return (
            <div
              key={item.id}
              role="status"
              className={cn(
                'pointer-events-auto flex items-center justify-between gap-3 rounded-2xl border px-4 py-3 shadow-lg transition-all animate-in fade-in slide-in-from-top-3',
                isSuccess && 'border-emerald-200 bg-white text-emerald-900 shadow-emerald-900/10',
                isError && 'border-red-200 bg-white text-red-900 shadow-red-900/10',
                !isSuccess && !isError && 'border-warm-200 bg-white text-secondary-900 shadow-secondary-900/10'
              )}
            >
              <div className="flex items-center gap-3">
                {isSuccess && <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />}
                {isError && <AlertCircle className="h-5 w-5 shrink-0 text-red-600" />}
                {!isSuccess && !isError && <Info className="h-5 w-5 shrink-0 text-primary-500" />}
                <p className="text-xs font-semibold leading-snug">{item.message}</p>
              </div>

              <button
                type="button"
                onClick={() => removeToast(item.id)}
                aria-label="Fechar notificação"
                className="rounded-full p-1 text-secondary-400 hover:bg-warm-100 hover:text-secondary-700 active:scale-95"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return {
    toast: context.toast,
    ...context.toast,
  }
}
