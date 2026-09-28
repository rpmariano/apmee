import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

/**
 * Email — placeholder page (Phase 2)
 */
export default function EmailPage() {
  return (
    <div className="min-h-full pb-6">
      <div className="sticky top-0 z-20 bg-background/95 px-4 pt-3.5 pb-3 backdrop-blur supports-[backdrop-filter]:bg-background/80 border-b border-warm-200/60">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Link
              to="/menu"
              aria-label="Voltar ao Menu"
              className="flex h-9 w-9 items-center justify-center rounded-full text-secondary-600 hover:bg-warm-100 hover:text-foreground active:scale-95 transition-all -ml-1"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <h1 className="text-xl font-bold text-foreground">Email</h1>
          </div>
        </div>
      </div>
      <div className="px-4 pt-4">
        <p className="text-sm text-muted">
          Módulo de email — disponível na Fase 2 (integração Gmail API).
        </p>
      </div>
    </div>
  )
}
