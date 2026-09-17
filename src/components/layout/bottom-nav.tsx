import { Link, useLocation } from 'react-router-dom'
import { Home, Calendar, ListTodo, Wallet, Menu } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { to: '/', icon: Home, label: 'Início', matchPaths: ['/'] },
  { to: '/agenda', icon: Calendar, label: 'Agenda', matchPaths: ['/agenda', '/calendario', '/eventos'] },
  { to: '/tarefas', icon: ListTodo, label: 'Tarefas', matchPaths: ['/tarefas'] },
  { to: '/tesouraria', icon: Wallet, label: 'Tesouraria', matchPaths: ['/tesouraria'] },
  { to: '/menu', icon: Menu, label: 'Menu', matchPaths: ['/menu', '/contactos', '/inventario', '/quotas', '/board', '/email'] },
]

/**
 * Bottom navigation bar — fixed at the bottom of the phone container.
 * Constrained to 5 primary items as defined in DESIGN.md.
 */
export function BottomNav() {
  const location = useLocation()

  return (
    <nav className="sticky bottom-0 z-50 border-t border-warm-200 bg-surface shadow-lg pb-[max(0.625rem,env(safe-area-inset-bottom))] pt-1" aria-label="Navegação Principal">
      <div className="flex items-center justify-around">
        {navItems.map((item) => {
          const isActive = item.matchPaths.includes(location.pathname)

          return (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                'flex flex-1 flex-col items-center gap-1 py-2.5 text-xs transition-all active:scale-95',
                isActive
                  ? 'text-primary-600 font-bold'
                  : 'text-secondary-600 hover:text-secondary-800'
              )}
            >
              <item.icon
                className={cn(
                  'h-5 w-5 transition-transform',
                  isActive ? 'text-primary-600 scale-110' : 'text-secondary-500'
                )}
                strokeWidth={isActive ? 2.5 : 2}
              />
              <span className="leading-tight">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
