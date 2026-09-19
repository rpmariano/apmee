import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Users,
  Package,
  Receipt,
  Eye,
  Shield,
} from 'lucide-react'
import { usePermissions } from '@/hooks/use-permissions'
import { useAuth } from '@/providers/auth-provider'
import { CustomDialog } from '@/components/ui/custom-dialog'
import { LogOut } from 'lucide-react'
import { MenuAlerts } from '@/components/ui/menu-alerts'
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
  { to: '/inventario', label: 'Inventário', icon: Package, color: 'bg-warm-100 text-secondary-700' },
  { to: '/quotas', label: 'Quotas', icon: Receipt, color: 'bg-warm-300 text-secondary-700', module: 'quotas' },
  { to: '/board', label: 'Direção', icon: Shield, color: 'bg-secondary-200 text-secondary-700', superadminOnly: true },
]

/**
 * Full-screen hamburger menu with a 2-column grid of pastel cards.
 * Shows a read-only indicator (eye icon) on financial modules for nivel_2 users.
 * Includes user profile summary and secure logout action.
 */
export default function MenuPage() {
  const { isSuperAdmin, isFinancialReadOnly } = usePermissions()
  const { user, signOut } = useAuth()
  const [searchQuery, setSearchQuery] = useState('')
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false)
  const [isSigningOut, setIsSigningOut] = useState(false)

  const handleSignOut = async () => {
    setIsSigningOut(true)
    try {
      await signOut()
    } catch (err) {
      console.error('Erro ao terminar sessão:', err)
      setIsSigningOut(false)
      setIsLogoutDialogOpen(false)
    }
  }

  const userInitials = (user?.displayName || user?.email || 'AP')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()

  const filteredItems = menuItems
    .filter((item) => !item.superadminOnly || isSuperAdmin)
    .filter((item) => {
      if (!searchQuery.trim()) return true
      const q = searchQuery.toLowerCase().trim()
      return item.label.toLowerCase().includes(q) || (item.module && item.module.toLowerCase().includes(q))
    })

  return (
    <div className="px-4 pt-6 pb-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-foreground">Menu</h1>
        <MenuAlerts />
      </div>

      {/* Search bar */}
      <div className="mt-4">
        <input
          type="search"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          aria-label="Pesquisar no menu"
          placeholder="Pesquisar módulos (ex: Quotas, Inventário, Contactos)..."
          className="w-full rounded-[var(--radius-button)] border border-warm-200 bg-surface px-4 py-2.5 text-sm text-foreground placeholder:text-muted focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-200"
        />
      </div>

      {filteredItems.length === 0 ? (
        <div className="mt-12 flex flex-col items-center justify-center text-center">
          <p className="text-sm font-medium text-foreground">Nenhum módulo encontrado</p>
          <p className="mt-1 text-xs text-muted">Não existem módulos correspondentes a "{searchQuery}".</p>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-2 gap-3">
          {filteredItems.map((item) => {
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
      )}

      {/* User profile & Logout */}
      <div className="mt-8 rounded-[var(--radius-card)] border border-warm-200 bg-surface p-4 shadow-xs">
        <div className="flex items-center gap-3">
          {user?.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt={user.displayName || 'Utilizador'}
              className="h-11 w-11 rounded-full object-cover border-2 border-primary-500"
            />
          ) : (
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 border-primary-500 bg-transparent text-sm font-bold text-primary-600">
              {userInitials}
            </div>
          )}

          <div className="min-w-0 flex-1">
            <h3 className="truncate text-sm font-bold text-foreground leading-tight">
              {user?.displayName || 'Membro da Direção'}
            </h3>
            <p className="truncate text-xs text-muted">
              {user?.email}
            </p>
            <div className="mt-1 flex items-center gap-1.5">
              <span className="inline-flex items-center rounded-full bg-warm-100 px-2 py-0.5 text-xs font-medium text-secondary-700">
                {user?.role ? user.role : isSuperAdmin ? 'Administração' : 'Direção'}
              </span>
              {isFinancialReadOnly() && (
                <span className="inline-flex items-center rounded-full bg-warm-200 px-2 py-0.5 text-xs font-medium text-secondary-600">
                  Leitura Financeira
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-warm-200">
          <button
            type="button"
            onClick={() => setIsLogoutDialogOpen(true)}
            className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-[var(--radius-button)] border border-red-200 bg-red-50/70 px-4 py-2.5 text-sm font-semibold text-red-700 transition-all hover:bg-red-100 active:scale-[0.98]"
          >
            <LogOut className="h-4 w-4" />
            <span>Terminar Sessão</span>
          </button>
        </div>
      </div>

      {/* Institutional footer */}
      <div className="mt-6 text-center">
        <p className="text-xs font-medium text-muted">APMEE EB Cobre · Associação de Pais e Mães</p>
        <p className="mt-0.5 text-xs text-muted/80">Escola Básica do Cobre, Cascais</p>
      </div>

      {/* Logout Confirmation Dialog */}
      <CustomDialog
        isOpen={isLogoutDialogOpen}
        title="Terminar Sessão"
        description="Tens a certeza que pretendes sair da aplicação da APMEE neste dispositivo?"
        variant="danger"
        confirmLabel="Terminar Sessão"
        cancelLabel="Cancelar"
        isLoading={isSigningOut}
        onConfirm={handleSignOut}
        onCancel={() => setIsLogoutDialogOpen(false)}
      />
    </div>
  )
}
