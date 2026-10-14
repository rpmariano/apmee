import { Component, type ErrorInfo, type ReactNode } from 'react'
import { AlertTriangle, RotateCcw, Home } from 'lucide-react'

interface ErrorBoundaryProps {
  children: ReactNode
  fallbackTitle?: string
  fallbackMessage?: string
  onReset?: () => void
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = {
    hasError: false,
    error: null,
  }

  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error caught by ErrorBoundary:', error, errorInfo)
  }

  private handleReload = () => {
    window.location.reload()
  }

  private handleGoHome = () => {
    this.setState({ hasError: false, error: null })
    window.location.href = import.meta.env.BASE_URL || '/'
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-[60vh] flex-col items-center justify-center p-6 text-center animate-in fade-in duration-200">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 shadow-sm mb-4">
            <AlertTriangle className="h-7 w-7" />
          </div>

          <h2 className="text-lg font-bold text-foreground">
            {this.props.fallbackTitle || 'Ocorreu um erro inesperado'}
          </h2>

          <p className="mt-1.5 max-w-xs text-xs text-secondary-600 leading-relaxed">
            {this.props.fallbackMessage ||
              'A aplicação encontrou um problema ao processar o ecrã. Pode recarregar ou voltar à página principal.'}
          </p>

          {import.meta.env.DEV && this.state.error && (
            <div className="mt-3 max-w-sm rounded-lg bg-red-50 p-3 text-left text-[11px] text-red-800 font-mono overflow-x-auto border border-red-200">
              {this.state.error.message}
            </div>
          )}

          <div className="mt-6 flex flex-col sm:flex-row items-center gap-2.5 w-full max-w-xs">
            <button
              type="button"
              onClick={this.handleReload}
              className="flex w-full items-center justify-center gap-2 rounded-[var(--radius-button)] bg-primary-500 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-primary-600 active:scale-95 transition-all"
            >
              <RotateCcw className="h-4 w-4" />
              <span>Recarregar Aplicação</span>
            </button>

            <button
              type="button"
              onClick={this.handleGoHome}
              className="flex w-full items-center justify-center gap-2 rounded-[var(--radius-button)] border border-warm-200 bg-surface py-2.5 text-xs font-semibold text-secondary-700 hover:bg-warm-100 active:scale-95 transition-all"
            >
              <Home className="h-4 w-4" />
              <span>Voltar ao Início</span>
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
