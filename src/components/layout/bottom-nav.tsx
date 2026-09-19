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
                'group relative flex flex-1 flex-col items-center gap-0.5 py-1.5 text-xs transition-colors active:scale-95',
                isActive
                  ? 'text-primary-600 font-bold'
                  : 'text-secondary-600 hover:text-secondary-800'
              )}
            >
              <div
                className={cn(
                  'flex h-7 w-12 items-center justify-center rounded-full transition-all duration-200 ease-out',
                  isActive
                    ? 'bg-primary-100/80 text-primary-600'
                    : 'text-secondary-500 group-hover:bg-warm-100/60'
                )}
              >
                <item.icon
                  className={cn(
                    'h-5 w-5 transition-transform duration-200 ease-out',
                    isActive ? 'scale-105' : 'scale-100'
                  )}
                  strokeWidth={isActive ? 2.5 : 2}
                />
              </div>
              <span className="leading-tight">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
