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
        onClick={handleOpen}
        className="relative rounded-full p-2 text-secondary-600 hover:bg-warm-100 transition-colors"
      >
        <Bell className={cn("h-6 w-6", hasUnread && "animate-pulse text-orange-500")} />
        {hasUnread && (
          <span className="absolute right-1.5 top-1.5 flex h-3 w-3 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white ring-2 ring-background animate-bounce" />
        )}
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-[100] flex justify-center bg-warm-100/80 backdrop-blur-sm animate-in fade-in">{/* Phone container */}<div className="flex w-full max-w-[430px] flex-col bg-background shadow-xl">
          <div className="flex flex-1 flex-col justify-end">
            <div className="flex h-[80vh] flex-col rounded-t-3xl bg-surface shadow-2xl animate-in slide-in-from-bottom-full">
              <div className="flex items-center justify-between border-b border-warm-200 px-6 py-4">
                <div className="flex items-center gap-2">
                  <Bell className="h-5 w-5 text-secondary-600" />
                  <h2 className="text-lg font-bold text-foreground">Alertas</h2>
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
                      <div key={item.id} className="flex gap-3 rounded-[var(--radius-card)] border border-orange-200 bg-orange-50 p-3">
                        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-orange-500" />
                        <div>
                          <p className="text-sm font-bold text-orange-900">{item.name}</p>
                          <p className="text-sm text-orange-700">
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
