import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/providers/auth-provider'
import { APP_NAME } from '@/lib/constants'
import { Calendar, ChevronRight, Plus, CheckSquare, Clock } from 'lucide-react'
import { MenuAlerts } from '@/components/ui/menu-alerts'
import { useDashboardStats } from '@/features/dashboard/api/use-dashboard-stats'
import { useTasks } from '@/features/tasks/api/use-tasks'
import { cn } from '@/lib/utils'

/**
 * Dashboard / Home page
 * - Hero section with next upcoming event
 * - Quick stats grid
 * - As Minhas Tarefas (urgent/pending tasks preview)
 */
export default function HomePage() {
  const { user } = useAuth()
  const { data: stats, isLoading } = useDashboardStats()
  const { data: tasks, isLoading: isTasksLoading } = useTasks()
  const navigate = useNavigate()

  const pendingTasks = (tasks || []).filter((t) => t.status !== 'done')

  const priorityWeight: Record<string, number> = {
    urgent: 0,
    high: 1,
    medium: 2,
    low: 3,
  }

  const topTasks = [...pendingTasks]
    .sort((a, b) => {
      const pA = priorityWeight[a.priority] ?? 4
      const pB = priorityWeight[b.priority] ?? 4
      if (pA !== pB) return pA - pB
      if (a.due_date && b.due_date) {
        return new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
      }
      if (a.due_date) return -1
      if (b.due_date) return 1
      return 0
    })
    .slice(0, 3)

  return (
    <div className="px-4 pt-6 pb-4">
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
        role="button"
        tabIndex={0}
        aria-label={stats?.nextEvent?.id ? `Ver detalhes do próximo evento: ${stats.nextEvent.title}` : 'Abrir Agenda'}
        onClick={() => {
          if (stats?.nextEvent?.id) {
            navigate(`/agenda?edit=${stats.nextEvent.id}`)
          } else {
            navigate('/agenda')
          }
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            if (stats?.nextEvent?.id) {
              navigate(`/agenda?edit=${stats.nextEvent.id}`)
            } else {
              navigate('/agenda')
            }
          }
        }}
        className={cn(
          "mt-6 rounded-[var(--radius-card)] bg-primary-500 p-6 text-white shadow-md transition-all cursor-pointer active:scale-[0.98] hover:bg-primary-600 hover:shadow-lg outline-none focus-visible:ring-2 focus-visible:ring-primary-300"
        )}
      >
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wider text-white/80">
            Próximo Evento
          </p>
          <Calendar className="h-4 w-4 text-white/80" />
        </div>
        
        <h2 className="mt-2 text-lg font-bold">
          {isLoading ? 'A carregar...' : stats?.nextEvent?.title ?? 'Nenhum evento agendado'}
        </h2>
        
        <p className="mt-1 text-sm text-white/90">
          {stats?.nextEvent?.start_date 
            ? new Date(stats.nextEvent.start_date).toLocaleDateString('pt-PT', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })
            : 'Consulte a agenda ou marque a próxima reunião ou festa escolar.'}
        </p>

        <div className="mt-4">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3.5 py-1.5 text-xs font-semibold backdrop-blur-xs hover:bg-white/30 transition-colors">
            {stats?.nextEvent?.id ? (
              <>
                <span>Ver detalhes na Agenda</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </>
            ) : (
              <>
                <Plus className="h-3.5 w-3.5" />
                <span>Abrir Agenda</span>
              </>
            )}
          </span>
        </div>
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
          to="/agenda"
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

      {/* As Minhas Tarefas / Tarefas Prioritárias */}
      <div className="mt-8">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <CheckSquare className="h-4 w-4 text-primary-600" />
            <h2 className="text-sm font-bold text-foreground">As Minhas Tarefas</h2>
          </div>
          <Link
            to="/tarefas"
            className="flex items-center gap-0.5 text-xs font-semibold text-primary-600 hover:text-primary-700 transition-colors"
          >
            <span>Ver todas ({pendingTasks.length})</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {isTasksLoading ? (
          <div className="space-y-2.5">
            <div className="h-16 w-full animate-pulse rounded-[var(--radius-card)] bg-warm-100" />
            <div className="h-16 w-full animate-pulse rounded-[var(--radius-card)] bg-warm-100" />
          </div>
        ) : topTasks.length === 0 ? (
          <div className="rounded-[var(--radius-card)] border border-dashed border-warm-200 bg-surface/60 p-5 text-center">
            <p className="text-xs font-medium text-secondary-600">
              Sem tarefas pendentes neste momento! 🎉
            </p>
            <p className="mt-0.5 text-xs text-muted">
              Todas as atividades da Associação estão em dia.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {topTasks.map((task) => (
              <div
                key={task.id}
                role="button"
                tabIndex={0}
                aria-label={`Ver tarefa ${task.title}`}
                onClick={() => navigate(`/tarefas?edit=${task.id}`)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    navigate(`/tarefas?edit=${task.id}`)
                  }
                }}
                className="group flex items-center justify-between gap-3 rounded-[var(--radius-card)] border border-warm-200 bg-surface p-3.5 shadow-xs transition-all duration-200 hover:border-primary-200 hover:shadow-sm cursor-pointer active:scale-[0.98] outline-none focus-visible:ring-2 focus-visible:ring-primary-400"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold shrink-0 transition-colors',
                        task.priority === 'urgent' && 'bg-red-50 text-red-700 border border-red-200',
                        task.priority === 'high' && 'bg-orange-50 text-orange-700 border border-orange-200',
                        task.priority === 'medium' && 'bg-primary-50 text-primary-700 border border-primary-200',
                        task.priority === 'low' && 'bg-warm-100 text-secondary-600 border border-warm-200'
                      )}
                    >
                      {task.priority === 'urgent'
                        ? 'Urgente'
                        : task.priority === 'high'
                        ? 'Alta'
                        : task.priority === 'medium'
                        ? 'Média'
                        : 'Baixa'}
                    </span>
                    {task.status === 'in_progress' && (
                      <span className="inline-flex items-center gap-1 text-xs text-amber-600 font-medium">
                        <Clock className="h-3 w-3" />
                        <span>Em Curso</span>
                      </span>
                    )}
                  </div>
                  <p className="mt-1.5 truncate text-xs font-bold text-foreground group-hover:text-primary-600 transition-colors">
                    {task.title}
                  </p>
                  {task.due_date && (
                    <p className="mt-0.5 flex items-center gap-1 text-xs text-muted">
                      <Calendar className="h-3 w-3" />
                      <span>
                        Prazo:{' '}
                        {new Date(task.due_date).toLocaleDateString('pt-PT', {
                          day: 'numeric',
                          month: 'short',
                        })}
                      </span>
                    </p>
                  )}
                </div>
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted group-hover:bg-warm-100 group-hover:text-primary-600 transition-all duration-200">
                  <ChevronRight className="h-4 w-4" />
                </div>
              </div>
            ))}
          </div>
        )}
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
      className={`flex flex-col rounded-[var(--radius-card)] ${color} p-4 shadow-sm transition-all duration-150 active:scale-95`}
    >
      <p className={`text-2xl font-bold ${textColor} tabular-nums`}>{value}</p>
      <p className="mt-1 text-xs text-muted">{label}</p>
    </Link>
  )
}
