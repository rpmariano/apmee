import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/providers/auth-provider'
import { BottomNav } from './bottom-nav'

/**
 * Main application shell — wraps authenticated routes with
 * the header, content area, and bottom navigation bar.
 * 
 * On desktop, the app is constrained to a mobile-width container
 * centered on screen with a subtle border, simulating a phone viewport.
 */
export function AppShell() {
  const { isAuthenticated, isLoading } = useAuth()

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
    <div className="flex min-h-screen justify-center bg-warm-100">
      {/* Phone-width container */}
      <div className="relative flex w-full max-w-[430px] flex-col min-h-screen bg-background shadow-xl">
        {/* Main content area — scrollable, with bottom padding for nav bar */}
        <main className="flex-1 overflow-y-auto pb-20">
          <Outlet />
        </main>

        {/* Bottom navigation bar — fixed at bottom, constrained to container */}
        <BottomNav />
      </div>
    </div>
  )
}
