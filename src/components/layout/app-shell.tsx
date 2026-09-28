import { useEffect, useRef } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '@/providers/auth-provider'
import { AppHeader } from './app-header'
import { BottomNav } from './bottom-nav'
import { NetworkStatus } from '@/components/ui/network-status'

/**
 * Main application shell — wraps authenticated routes with
 * the header, content area, and bottom navigation bar.
 * 
 * On desktop, the app is constrained to a mobile-width container
 * centered on screen with a subtle border, simulating a phone viewport.
 */
export function AppShell() {
  const { isAuthenticated, isLoading } = useAuth()
  const location = useLocation()
  const mainRef = useRef<HTMLElement>(null)

  useEffect(() => {
    if (mainRef.current) {
      mainRef.current.scrollTop = 0
    }
  }, [location.pathname])

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary-200 border-t-primary-400" />
          <p className="text-sm text-muted">A carregar...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return (
    <div className="flex h-screen h-[100dvh] justify-center bg-warm-100 overflow-hidden">
      {/* Phone-width container */}
      <div className="relative flex w-full max-w-[430px] flex-col h-full bg-background shadow-xl overflow-hidden">
        <NetworkStatus />
        {/* Global institutional top header — present on all screens */}
        <AppHeader />

        {/* Main content area — the dedicated scrollable container */}
        <main ref={mainRef} className="flex-1 min-h-0 overflow-y-auto overscroll-contain">
          <Outlet />
        </main>

        {/* Bottom navigation bar — permanently fixed at bottom of container */}
        <BottomNav />
      </div>
    </div>
  )
}
