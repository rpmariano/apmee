import { Link } from 'react-router-dom'
import {
  Users,
  CalendarDays,
  ListTodo,
  Package,
  Wallet,
  Receipt,
  Eye,
  Shield,
} from 'lucide-react'
import { usePermissions } from '@/hooks/use-permissions'
import { cn } from '@/lib/utils'

interface MenuItem {
  to: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  color: string
  module?: string
  superadminOnly?: boolean
}

const menuItems: MenuItem[] = [
  { to: '/contactos', label: 'Contactos', icon: Users, color: 'bg-primary-100 text-primary-600' },
  { to: '/agenda', label: 'Agenda & Eventos', icon: CalendarDays, color: 'bg-warm-200 text-secondary-600' },
  { to: '/tarefas', label: 'Tarefas', icon: ListTodo, color: 'bg-secondary-100 text-secondary-600' },
  { to: '/inventario', label: 'Inventário', icon: Package, color: 'bg-warm-100 text-secondary-700' },
  { to: '/tesouraria', label: 'Tesouraria', icon: Wallet, color: 'bg-primary-200 text-primary-700', module: 'treasury' },
  { to: '/quotas', label: 'Quotas', icon: Receipt, color: 'bg-warm-300 text-secondary-700', module: 'quotas' },
  { to: '/board', label: 'Direção', icon: Shield, color: 'bg-secondary-200 text-secondary-700', superadminOnly: true },
]

import { MenuAlerts } from '@/components/ui/menu-alerts'

/**
 * Full-screen hamburger menu with a 2-column grid of pastel cards.
 * Shows a read-only indicator (eye icon) on financial modules for nivel_2 users.
 */
export default function MenuPage() {
  const { isSuperAdmin, isFinancialReadOnly } = usePermissions()
  

  return (
    <div className="px-4 pt-6 pb-24">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-foreground">Menu</h1>
        <MenuAlerts />
      </div>

      {/* Search bar placeholder */}
      <div className="mt-4">
        <input
          type="search"
          aria-label="Pesquisar no menu"
          placeholder="Pesquisar..."
          className="w-full rounded-[var(--radius-button)] border border-warm-200 bg-surface px-4 py-2.5 text-sm text-foreground placeholder:text-muted focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-200"
        />
      </div>

      {/* 2-column grid of module cards */}
      <div className="mt-6 grid grid-cols-2 gap-3">
        {menuItems
          .filter((item) => !item.superadminOnly || isSuperAdmin)
          .map((item) => {
          const isReadOnly =
            isFinancialReadOnly() && item.module && ['treasury', 'quotas'].includes(item.module)

          return (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                'relative flex flex-col items-center gap-3 rounded-[var(--radius-card)] p-6 shadow-sm transition-all hover:shadow-md active:scale-[0.97]',
                item.color
              )}
            >
              {/* Read-only badge */}
              {isReadOnly && (
                <div className="absolute right-2 top-2">
                  <Eye className="h-4 w-4 opacity-50" />
                </div>
              )}
              <item.icon className="h-8 w-8" />
              <span className="text-sm font-semibold">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
