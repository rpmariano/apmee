import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AppShell } from '@/components/layout/app-shell'
import LoginPage from '@/pages/login'
import HomePage from '@/pages/home'
import CalendarPage from '@/pages/calendar'
import EmailPage from '@/pages/email'
import MenuPage from '@/pages/menu'
import ContactsPage from '@/pages/contacts'
import EventsPage from '@/pages/events'
import TasksPage from '@/pages/tasks'
import InventoryPage from '@/pages/inventory'
import TreasuryPage from '@/pages/treasury'
import QuotasPage from '@/pages/quotas'
import BoardPage from '@/pages/board'

/**
 * App root — sets up the router with all application routes.
 * Uses BrowserRouter with basename for GitHub Pages deployment.
 */
export default function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <Routes>
        {/* Public route */}
        <Route path="/login" element={<LoginPage />} />

        {/* Protected routes — wrapped by AppShell (auth check + layout) */}
        <Route element={<AppShell />}>
          {/* Bottom nav routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/calendario" element={<CalendarPage />} />
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
    </BrowserRouter>
  )
}
