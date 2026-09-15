import { useAuth } from '@/providers/auth-provider'
import { APP_NAME } from '@/lib/constants'

/**
 * Dashboard / Home page
 * - Hero section with next upcoming event
 * - Horizontal carousel of future events
 */
export default function HomePage() {
  const { user } = useAuth()

  return (
    <div className="px-4 pt-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted">Olá,</p>
          <h1 className="text-xl font-bold text-foreground">
            {user?.displayName ?? user?.email?.split('@')[0] ?? 'Utilizador'}
          </h1>
        </div>
        {/* Notification bell — placeholder for Phase 2 */}
        <button className="relative rounded-full bg-surface p-2 shadow-sm">
          <svg
            className="h-6 w-6 text-secondary-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0"
            />
          </svg>
        </button>
      </div>

      {/* Hero — Next Event */}
      <div className="mt-6 rounded-[var(--radius-card)] bg-primary-400 p-6 text-white shadow-md">
        <p className="text-xs font-medium uppercase tracking-wider opacity-80">
          Próximo Evento
        </p>
        <h2 className="mt-2 text-lg font-bold">Nenhum evento agendado</h2>
        <p className="mt-1 text-sm opacity-90">
          Crie o primeiro evento através do botão +
        </p>
      </div>

      {/* Quick Stats */}
      <div className="mt-6 grid grid-cols-2 gap-3">
        <StatCard
          label="Contactos"
          value="0"
          color="bg-warm-100"
          textColor="text-secondary-700"
        />
        <StatCard
          label="Eventos"
          value="0"
          color="bg-primary-100"
          textColor="text-primary-700"
        />
        <StatCard
          label="Tarefas"
          value="0"
          color="bg-secondary-100"
          textColor="text-secondary-700"
        />
        <StatCard
          label="Inventário"
          value="0"
          color="bg-warm-200"
          textColor="text-secondary-700"
        />
      </div>

      {/* App name footer */}
      <p className="mt-8 text-center text-xs text-muted">{APP_NAME}</p>
    </div>
  )
}

function StatCard({
  label,
  value,
  color,
  textColor,
}: {
  label: string
  value: string
  color: string
  textColor: string
}) {
  return (
    <div
      className={`rounded-[var(--radius-card)] ${color} p-4 shadow-sm`}
    >
      <p className={`text-2xl font-bold ${textColor}`}>{value}</p>
      <p className="mt-1 text-xs text-muted">{label}</p>
    </div>
  )
}
