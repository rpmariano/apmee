import { NavLink } from 'react-router-dom'
import { Home, Calendar, Mail, Menu } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { to: '/', icon: Home, label: 'Home' },
  { to: '/calendario', icon: Calendar, label: 'Calendário' },
  { to: '/email', icon: Mail, label: 'Email' },
  { to: '/menu', icon: Menu, label: 'Menu' },
]

/**
 * Bottom navigation bar — fixed at the bottom of the phone container.
 * Uses sticky positioning so it stays within the max-width container on desktop.
 */
export function BottomNav() {
  return (
    <nav className="sticky bottom-0 z-50 border-t border-warm-200 bg-surface shadow-lg">
      <div className="flex items-center justify-around">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                'flex flex-1 flex-col items-center gap-1 py-3 text-xs transition-colors',
                isActive
                  ? 'text-primary-500 font-semibold'
                  : 'text-secondary-400 hover:text-secondary-600'
              )
            }
          >
            {({ isActive }) => (
              <>
                <item.icon
                  className={cn(
                    'h-5 w-5',
                    isActive ? 'text-primary-500' : 'text-secondary-400'
                  )}
                  strokeWidth={isActive ? 2.5 : 2}
                />
                <span>{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
