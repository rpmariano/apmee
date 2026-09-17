import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AppShell } from '@/components/layout/app-shell'
import { Loader2 } from 'lucide-react'

// Lazy-loaded route components for optimal performance and chunk splitting
const LoginPage = lazy(() => import('@/pages/login'))
const HomePage = lazy(() => import('@/pages/home'))
const EmailPage = lazy(() => import('@/pages/email'))
const MenuPage = lazy(() => import('@/pages/menu'))
const ContactsPage = lazy(() => import('@/pages/contacts'))
const EventsPage = lazy(() => import('@/pages/events'))
const TasksPage = lazy(() => import('@/pages/tasks'))
const InventoryPage = lazy(() => import('@/pages/inventory'))
const TreasuryPage = lazy(() => import('@/pages/treasury'))
const QuotasPage = lazy(() => import('@/pages/quotas'))
const BoardPage = lazy(() => import('@/pages/board'))

function RouteFallback() {
  return (
    <div className="flex h-full min-h-[50vh] items-center justify-center">
      <div className="flex flex-col items-center gap-2">
        <Loader2 className="h-6 w-6 animate-spin text-primary-500" />
        <span className="text-xs font-medium text-muted">A carregar...</span>
      </div>
    </div>
  )
}

/**
 * App root — sets up the router with code-split application routes.
 * Uses BrowserRouter with basename for GitHub Pages deployment.
 */
export default function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          {/* Public route */}
          <Route path="/login" element={<LoginPage />} />

          {/* Protected routes — wrapped by AppShell (auth check + layout) */}
          <Route element={<AppShell />}>
            {/* Bottom nav routes */}
            <Route path="/" element={<HomePage />} />
            <Route path="/agenda" element={<EventsPage />} />
            <Route path="/calendario" element={<EventsPage />} />
            <Route path="/email" element={<EmailPage />} />
            <Route path="/menu" element={<MenuPage />} />

            {/* Module routes (accessed via hamburger menu) */}
            <Route path="/contactos" element={<ContactsPage />} />
            <Route path="/eventos" element={<EventsPage />} />
            <Route path="/tarefas" element={<TasksPage />} />
            <Route path="/inventario" element={<InventoryPage />} />
            <Route path="/tesouraria" element={<TreasuryPage />} />
            <Route path="/quotas" element={<QuotasPage />} />
            <Route path="/board" element={<BoardPage />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}
