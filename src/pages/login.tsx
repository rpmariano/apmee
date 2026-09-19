import { useAuth } from '@/providers/auth-provider'
import { Navigate, useSearchParams } from 'react-router-dom'
import { APP_NAME } from '@/lib/constants'
import { AlertCircle, Mail, RotateCw } from 'lucide-react'

/**
 * Login page — shown to unauthenticated users.
 * Features the APMEE logo, a Google sign-in button, and supportive guidance if unauthorized.
 */
export default function LoginPage() {
  const { isAuthenticated, isLoading, signIn, authError, clearAuthError } = useAuth()
  const [searchParams] = useSearchParams()

  const urlError = searchParams.get('error_description') || searchParams.get('error')
  const displayError = authError || urlError

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary-200 border-t-primary-500" />
      </div>
    )
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 py-12">
      <div className="flex w-full max-w-sm flex-col items-center gap-6">
        {/* Logo */}
        <img
          src={`${import.meta.env.BASE_URL}logo.jpeg`}
          alt={`Logo ${APP_NAME}`}
          className="h-36 w-36 rounded-full object-cover shadow-md"
        />

        {/* Title */}
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground">{APP_NAME}</h1>
          <p className="mt-1 text-sm text-muted">
            Plataforma de Gestão da Associação
          </p>
        </div>

        {/* Supportive Unauthorized / Error Guidance */}
        {displayError && (
          <div className="w-full rounded-[var(--radius-card)] border border-amber-200 bg-amber-50/80 p-4 shadow-xs animate-in fade-in duration-200">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-2 text-xs">
                <p className="font-bold text-amber-900">
                  Acesso Restrito / Não Autorizado
                </p>
                <p className="text-amber-800 leading-relaxed">
                  A conta {authError && authError.includes('@') ? (
                    <strong className="font-semibold text-amber-950">{authError}</strong>
                  ) : (
                    'utilizada'
                  )}{' '}
                  não se encontra registada com permissão de acesso à plataforma.
                </p>
                <div className="rounded-lg bg-white/70 p-2.5 border border-amber-200/60">
                  <p className="text-muted leading-relaxed">
                    Se é membro dos órgãos sociais ou da equipa da APMEE e precisa de acesso, contacte o administrador:
                  </p>
                  <a
                    href="mailto:apmee.cobre@gmail.com"
                    className="mt-1.5 inline-flex items-center gap-1.5 font-semibold text-primary-600 hover:text-primary-700 underline"
                  >
                    <Mail className="h-3.5 w-3.5" />
                    <span>apmee.cobre@gmail.com</span>
                  </a>
                </div>
                <button
                  type="button"
                  onClick={() => clearAuthError()}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-amber-900 hover:underline pt-1"
                >
                  <RotateCw className="h-3 w-3" />
                  <span>Tentar com outra conta</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Google sign-in button */}
        <button
          onClick={signIn}
          className="flex w-full items-center justify-center gap-3 rounded-[var(--radius-button)] border border-warm-300 bg-surface px-6 py-3.5 text-sm font-medium text-foreground shadow-sm transition-all hover:bg-warm-50 hover:shadow-md active:scale-[0.98]"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
          <span>Entrar com Google</span>
        </button>

        {/* Footer */}
        <p className="text-xs text-muted">
          Acesso restrito a membros autorizados da APMEE
        </p>
      </div>
    </div>
  )
}
