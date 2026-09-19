import { useState } from 'react'
import { Link } from 'react-router-dom'
import { LogOut, X, Menu, Shield } from 'lucide-react'
import { useAuth } from '@/providers/auth-provider'
import { usePermissions } from '@/hooks/use-permissions'
import { CustomDialog } from '@/components/ui/custom-dialog'

export function UserHeaderProfile() {
  const { user, signOut } = useAuth()
  const { isSuperAdmin, isFinancialReadOnly } = usePermissions()
  const [isOpen, setIsOpen] = useState(false)
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false)
  const [isSigningOut, setIsSigningOut] = useState(false)

  const userInitials = (user?.displayName || user?.email || 'AP')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()

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

  return (
    <>
      {/* Touch Target Button for Avatar */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="flex h-10 w-10 items-center justify-center rounded-full text-foreground hover:bg-warm-100 transition-colors active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-400"
        aria-label="Abrir perfil de utilizador"
        title={user?.displayName || user?.email || 'Perfil'}
      >
        {user?.avatarUrl ? (
          <img
            src={user.avatarUrl}
            alt={user.displayName || 'Utilizador'}
            className="h-8 w-8 rounded-full object-cover border-2 border-primary-500 shadow-xs"
          />
        ) : (
          <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-primary-500 bg-transparent text-xs font-bold text-primary-600 shadow-xs">
            {userInitials}
          </div>
        )}
      </button>

      {/* Quick Profile Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs transition-opacity animate-in fade-in duration-200">
          <div className="w-full max-w-xs rounded-[var(--radius-card)] border border-warm-200 bg-surface p-5 shadow-2xl animate-in zoom-in-95 duration-200">
            {/* Header with Close */}
            <div className="flex items-center justify-between border-b border-warm-100 pb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-secondary-500">
                A Minha Conta
              </span>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded-full p-1 text-muted hover:bg-warm-100 hover:text-foreground transition-colors"
                aria-label="Fechar"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Profile Info */}
            <div className="flex flex-col items-center text-center pt-4 pb-2">
              {user?.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={user.displayName || 'Utilizador'}
                  className="h-16 w-16 rounded-full object-cover border-2 border-primary-500 shadow-sm"
                />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-primary-500 bg-warm-50 text-base font-bold text-primary-600 shadow-sm">
                  {userInitials}
                </div>
              )}

              <h3 className="mt-3 font-bold text-foreground text-sm leading-tight truncate max-w-[240px]">
                {user?.displayName || 'Membro da Associação'}
              </h3>
              <p className="mt-0.5 text-xs text-muted truncate max-w-[240px]">
                {user?.email}
              </p>

              <div className="mt-2.5 flex flex-wrap items-center justify-center gap-1.5">
                <span className="inline-flex items-center gap-1 rounded-full bg-primary-50 px-2.5 py-0.5 text-xs font-semibold text-primary-700 border border-primary-200">
                  <Shield className="h-3 w-3" />
                  <span>{user?.role ? user.role : isSuperAdmin ? 'Administração' : 'Direção'}</span>
                </span>
                {isFinancialReadOnly() && (
                  <span className="inline-flex items-center rounded-full bg-warm-200 px-2 py-0.5 text-xs font-medium text-secondary-600">
                    Leitura Financeira
                  </span>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="mt-4 flex flex-col gap-2 border-t border-warm-100 pt-3">
              <Link
                to="/menu"
                onClick={() => setIsOpen(false)}
                className="flex items-center justify-center gap-2 rounded-[var(--radius-button)] bg-warm-100 py-2.5 text-xs font-bold text-secondary-700 hover:bg-warm-200 transition-colors active:scale-95"
              >
                <Menu className="h-4 w-4 text-secondary-500" />
                <span>Abrir Menu Completo</span>
              </Link>

              <button
                type="button"
                onClick={() => {
                  setIsOpen(false)
                  setIsLogoutDialogOpen(true)
                }}
                className="flex items-center justify-center gap-2 rounded-[var(--radius-button)] border border-red-200 bg-red-50/70 py-2.5 text-xs font-bold text-red-600 hover:bg-red-100 transition-colors active:scale-95"
              >
                <LogOut className="h-4 w-4" />
                <span>Terminar Sessão</span>
              </button>
            </div>
          </div>
        </div>
      )}

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
    </>
  )
}
