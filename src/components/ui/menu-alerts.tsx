import { useState, useEffect } from 'react'
import { Bell, X, AlertTriangle } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { InventoryItem } from '@/types/database'
import { cn } from '@/lib/utils'

export function MenuAlerts() {
  const [isOpen, setIsOpen] = useState(false)
  const [readItems, setReadItems] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('read_low_stock') || '[]')
    } catch {
      return []
    }
  })

  // Fetch inventory
  const { data: inventory } = useQuery({
    queryKey: ['inventory-alerts'],
    queryFn: async () => {
      const { data } = await (supabase as any).from('inventory_items')
        .select('*')
        .is('deleted_at', null)
      return (data || []) as InventoryItem[]
    }
  })

  const lowStockItems = (inventory || []).filter(
    item => item.min_stock !== null && item.min_stock > 0 && item.quantity <= item.min_stock
  )

  // Sync read items (remove ones that are no longer low stock)
  useEffect(() => {
    if (inventory) {
      const currentLowStockIds = lowStockItems.map(i => i.id)
      const validReadItems = readItems.filter(id => currentLowStockIds.includes(id))
      if (validReadItems.length !== readItems.length) {
        setReadItems(validReadItems)
        localStorage.setItem('read_low_stock', JSON.stringify(validReadItems))
      }
    }
  }, [inventory, lowStockItems.length, readItems])

  const unreadItems = lowStockItems.filter(item => !readItems.includes(item.id))
  const hasUnread = unreadItems.length > 0
  const hasAlerts = lowStockItems.length > 0

  const handleOpen = () => {
    setIsOpen(true)
    if (hasUnread) {
      const newRead = [...new Set([...readItems, ...unreadItems.map(i => i.id)])]
      setReadItems(newRead)
      localStorage.setItem('read_low_stock', JSON.stringify(newRead))
    }
  }

  return (
    <>
      <button 
        type="button"
        onClick={handleOpen}
        className="relative flex h-10 w-10 items-center justify-center rounded-full text-secondary-600 hover:bg-warm-100 transition-colors active:scale-95"
        title={hasAlerts ? `${lowStockItems.length} alerta(s) de stock` : 'Alertas'}
        aria-label="Alertas"
      >
        {/* Bell Icon */}
        <Bell 
          className={cn(
            "h-5 w-5 transition-colors", 
            hasAlerts 
              ? "text-primary-600" 
              : "text-secondary-600"
          )} 
        />

        {/* Calm Notification Badge */}
        {hasAlerts && (
          <span className={cn(
            "absolute right-1.5 top-1.5 z-20 flex h-2.5 w-2.5 rounded-full ring-2 ring-background",
            hasUnread ? "bg-primary-500 animate-pulse" : "bg-amber-500"
          )} />
        )}
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-[100] flex justify-center bg-warm-100/80 backdrop-blur-sm animate-in fade-in">{/* Phone container */}<div className="flex w-full max-w-[430px] flex-col bg-background shadow-xl">
          <div className="flex flex-1 flex-col justify-end">
            <div className="flex h-[80vh] flex-col rounded-t-3xl bg-surface shadow-2xl animate-in slide-in-from-bottom-full">
              <div className="flex items-center justify-between border-b border-warm-200 px-6 py-4">
                <div className="flex items-center gap-2">
                  <Bell className={cn("h-5 w-5", hasAlerts ? "text-primary-600" : "text-secondary-600")} />
                  <h2 className="text-lg font-bold text-foreground">
                    Alertas {hasAlerts && `(${lowStockItems.length})`}
                  </h2>
                </div>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="rounded-full p-2 text-muted hover:bg-warm-100"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4">
                {lowStockItems.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-50 text-green-500">
                      <Bell className="h-8 w-8" />
                    </div>
                    <p className="mt-4 text-sm font-medium text-foreground">Tudo tranquilo!</p>
                    <p className="mt-1 text-xs text-muted">Não há alertas de stock no momento.</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    {lowStockItems.map(item => (
                      <div key={item.id} className="flex gap-3 rounded-[var(--radius-card)] border border-fuchsia-200 bg-fuchsia-50/70 p-3">
                        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-primary-600" />
                        <div>
                          <p className="text-sm font-bold text-fuchsia-950">{item.name}</p>
                          <p className="text-sm text-fuchsia-800">
                            Atingiu o stock mínimo! Tem {item.quantity} (mínimo: {item.min_stock})
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
</div>
      )}
    </>
  )
}
