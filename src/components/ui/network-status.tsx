import { useState, useEffect } from 'react'
import { WifiOff, Wifi } from 'lucide-react'

export function NetworkStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [showReconnected, setShowReconnected] = useState(false)

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      setShowReconnected(true)
      const timer = setTimeout(() => setShowReconnected(false), 3500)
      return () => clearTimeout(timer)
    }

    const handleOffline = () => {
      setIsOnline(false)
      setShowReconnected(false)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  if (!isOnline) {
    return (
      <div 
        role="alert" 
        className="flex items-center justify-center gap-2 bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-all"
      >
        <WifiOff className="h-3.5 w-3.5 shrink-0" />
        <span>Modo offline — a navegar com dados locais em cache</span>
      </div>
    )
  }

  if (showReconnected) {
    return (
      <div 
        role="status" 
        className="flex items-center justify-center gap-2 bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-all animate-in fade-in"
      >
        <Wifi className="h-3.5 w-3.5 shrink-0" />
        <span>Ligação à internet restabelecida</span>
      </div>
    )
  }

  return null
}
