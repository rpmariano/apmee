import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/providers/auth-provider'
import { APP_NAME } from '@/lib/constants'
import { MenuAlerts } from '@/components/ui/menu-alerts'
import { useDashboardStats } from '@/features/dashboard/api/use-dashboard-stats'
import { cn } from '@/lib/utils'

/**
 * Dashboard / Home page
 * - Hero section with next upcoming event
 * - Horizontal carousel of future events
 */
export default function HomePage() {
  const { user } = useAuth()
  const { data: stats, isLoading } = useDashboardStats()
  const navigate = useNavigate()

  return (
    <div className="px-4 pt-6 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted">Olá,</p>
          <h1 className="text-xl font-bold text-foreground">
            {user?.displayName ?? user?.email?.split('@')[0] ?? 'Utilizador'}
          </h1>
        </div>
        
        <MenuAlerts />
      </div>

      {/* Hero - Next Event */}
      <div 
        onClick={() => {
          if (stats?.nextEvent?.id) {
            navigate(`/agenda?edit=${stats.nextEvent.id}`)
          } else {
            navigate('/agenda')
          }
        }}
        className={cn(
          "mt-6 rounded-[var(--radius-card)] bg-primary-400 p-6 text-white shadow-md transition-all cursor-pointer active:scale-[0.98] hover:shadow-lg"
        )}
      >
        <p className="text-xs font-medium uppercase tracking-wider opacity-80">
          Próximo Evento
        </p>
        <h2 className="mt-2 text-lg font-bold">
          {isLoading ? 'A carregar...' : stats?.nextEvent?.title ?? 'Nenhum evento agendado'}
        </h2>
        <p className="mt-1 text-sm opacity-90">
          {stats?.nextEvent?.start_date 
            ? new Date(stats.nextEvent.start_date).toLocaleDateString('pt-PT', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })
            : 'Crie o primeiro evento através do botão +'}
        </p>
      </div>

      {/* Quick Stats */}
      <div className="mt-6 grid grid-cols-2 gap-3">
        <StatCard
          to="/contactos"
          label="Contactos"
          value={isLoading ? '-' : stats?.contacts.toString() ?? '0'}
          color="bg-warm-100 hover:bg-warm-200 transition-colors"
          textColor="text-secondary-700"
        />
        <StatCard
          to="/eventos"
          label="Eventos Ativos"
          value={isLoading ? '-' : stats?.events.toString() ?? '0'}
          color="bg-primary-100 hover:bg-primary-200 transition-colors"
          textColor="text-primary-700"
        />
        <StatCard
          to="/tarefas"
          label="Tarefas Pendentes"
          value={isLoading ? '-' : stats?.tasks.toString() ?? '0'}
          color="bg-secondary-100 hover:bg-secondary-200 transition-colors"
          textColor="text-secondary-700"
        />
        <StatCard
          to="/tesouraria"
          label="Em Caixa"
          value={isLoading ? '-' : new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(stats?.balance || 0)}
          color="bg-warm-200 hover:bg-warm-300 transition-colors"
          textColor="text-secondary-700"
        />
      </div>

      {/* App name footer */}
      <p className="mt-8 text-center text-xs text-muted">{APP_NAME}</p>
    </div>
  )
}

function StatCard({
  to,
  label,
  value,
  color,
  textColor,
}: {
  to: string
  label: string
  value: string
  color: string
  textColor: string
}) {
  return (
    <Link
      to={to}
      className={`flex flex-col rounded-[var(--radius-card)] ${color} p-4 shadow-sm active:scale-95`}
    >
      <p className={`text-2xl font-bold ${textColor}`}>{value}</p>
      <p className="mt-1 text-xs text-muted">{label}</p>
    </Link>
  )
}
