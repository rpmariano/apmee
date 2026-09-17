import { MenuAlerts } from '@/components/ui/menu-alerts'

/**
 * Email — placeholder page (Phase 2)
 */
export default function EmailPage() {
  return (
    <div className="px-4 pt-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-foreground">Email</h1>
        <MenuAlerts />
      </div>
      <p className="mt-2 text-sm text-muted">
        Módulo de email — disponível na Fase 2 (integração Gmail API).
      </p>
    </div>
  )
}
