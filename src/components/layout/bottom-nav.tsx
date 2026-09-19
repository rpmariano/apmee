import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Home, Calendar, Wallet, Menu, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { QuickActionsSheet } from './quick-actions-sheet'

const leftNavItems = [
  { to: '/', icon: Home, label: 'Início', matchPaths: ['/'] },
  { to: '/agenda', icon: Calendar, label: 'Agenda', matchPaths: ['/agenda', '/calendario', '/eventos'] },
]

const rightNavItems = [
  { to: '/tesouraria', icon: Wallet, label: 'Tesouraria', matchPaths: ['/tesouraria'] },
  { to: '/menu', icon: Menu, label: 'Menu', matchPaths: ['/menu', '/contactos', '/inventario', '/quotas', '/board', '/email', '/tarefas'] },
]

/**
 * Bottom navigation bar — fixed at the bottom of the phone container.
 * Features 4 primary navigation tabs and a fixed elevated "+" Quick Action button in the center.
 * "Tarefas" has moved to the Menu grid, keeping the 5-slot navigation bar clean and balanced.
 */
export function BottomNav() {
  const location = useLocation()
  const [isSheetOpen, setIsSheetOpen] = useState(false)

  const handleScrollToTop = () => {
    const mainEl = document.querySelector('main')
    if (mainEl) {
      mainEl.scrollTo({ top: 0, behavior: 'smooth' })
    }
    window.scrollTo({ top: 0, behavior: 'smooth' })
    if (document.documentElement) {
      document.documentElement.scrollTo({ top: 0, behavior: 'smooth' })
    }
    if (document.body) {
      document.body.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const renderNavItem = (item: (typeof leftNavItems)[0]) => {
    const isActive = item.matchPaths.includes(location.pathname)

    return (
      <Link
        key={item.to}
        to={item.to}
        onClick={() => {
          if (isActive) {
            handleScrollToTop()
          }
        }}
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
  }

  return (
    <>
      <nav
        className="sticky bottom-0 z-50 border-t border-warm-200 bg-surface shadow-lg pb-[max(0.625rem,env(safe-area-inset-bottom))] pt-1"
        aria-label="Navegação Principal"
      >
        <div className="flex items-center justify-around">
          {leftNavItems.map(renderNavItem)}

          {/* Central Prominent '+' Action Button */}
          <div className="flex flex-1 flex-col items-center">
            <button
              type="button"
              onClick={() => setIsSheetOpen((prev) => !prev)}
              aria-label="Criar novo registo"
              aria-expanded={isSheetOpen}
              className={cn(
                '-mt-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary-500 text-white shadow-md ring-4 ring-surface transition-all duration-200 ease-out hover:bg-primary-600 active:scale-90',
                isSheetOpen && 'rotate-45 bg-secondary-800'
              )}
            >
              <Plus className="h-6 w-6 transition-transform duration-200" strokeWidth={2.5} />
            </button>
            <span className="mt-0.5 text-xs font-medium text-secondary-600 leading-tight">
              Criar
            </span>
          </div>

          {rightNavItems.map(renderNavItem)}
        </div>
      </nav>

      <QuickActionsSheet isOpen={isSheetOpen} onClose={() => setIsSheetOpen(false)} />
    </>
  )
}
