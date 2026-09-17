import { Calendar, Circle, CheckCircle2, Clock, Loader2 } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { pt } from 'date-fns/locale'
import type { Task, TaskPriority, TaskStatus } from '@/types/database'
import { cn } from '@/lib/utils'
import { TASK_STATUSES, TASK_PRIORITIES } from '@/lib/constants'

interface TaskCardProps {
  task: Task
  onEdit?: (task: Task) => void
  onToggleStatus?: (task: Task) => void
  isToggling?: boolean
}

const priorityConfig: Record<TaskPriority, { label: string; color: string }> = {
  [TASK_PRIORITIES.LOW]: { label: 'Baixa', color: 'text-secondary-500' },
  [TASK_PRIORITIES.MEDIUM]: { label: 'Média', color: 'text-primary-500' },
  [TASK_PRIORITIES.HIGH]: { label: 'Alta', color: 'text-orange-500' },
  [TASK_PRIORITIES.URGENT]: { label: 'Urgente', color: 'text-red-600 font-bold' },
}

const statusConfig: Record<TaskStatus, { label: string; icon: any; color: string; badgeColor: string }> = {
  [TASK_STATUSES.TODO]: { 
    label: 'A Fazer', 
    icon: Circle, 
    color: 'text-secondary-400 hover:text-green-600',
    badgeColor: 'bg-warm-100 text-secondary-600 border-warm-200'
  },
  [TASK_STATUSES.IN_PROGRESS]: { 
    label: 'Em Curso', 
    icon: Clock, 
    color: 'text-amber-500 hover:text-green-600',
    badgeColor: 'bg-amber-50 text-amber-700 border-amber-200'
  },
  [TASK_STATUSES.DONE]: { 
    label: 'Concluída', 
    icon: CheckCircle2, 
    color: 'text-green-600 hover:text-secondary-400',
    badgeColor: 'bg-green-50 text-green-700 border-green-200'
  },
}

export function TaskCard({ task, onEdit, onToggleStatus, isToggling }: TaskCardProps) {
  const priority = priorityConfig[task.priority]
  const status = statusConfig[task.status]
  const StatusIcon = status.icon

  const isDone = task.status === TASK_STATUSES.DONE

  return (
    <div 
      className={cn(
        "flex flex-col gap-2 rounded-[var(--radius-card)] border border-warm-200 bg-surface p-4 shadow-sm transition-all hover:shadow-md",
        isDone && "opacity-75 bg-warm-50/70",
        onEdit && "cursor-pointer active:scale-[0.98]"
      )}
      onClick={() => onEdit && onEdit(task)}
    >
      <div className="flex items-start justify-between gap-3">
        {/* Toggle Status Button */}
        {onToggleStatus && (
          <button 
            type="button"
            disabled={isToggling}
            onClick={(e) => { 
              e.stopPropagation()
              onToggleStatus(task)
            }}
            title={isDone ? 'Reabrir tarefa' : 'Marcar como concluída'}
            className={cn(
              "mt-0.5 shrink-0 rounded-full p-0.5 transition-transform active:scale-90 disabled:opacity-50",
              status.color
            )}
          >
            {isToggling ? (
              <Loader2 className="h-6 w-6 animate-spin text-primary-400" />
            ) : (
              <StatusIcon className={cn("h-6 w-6", isDone && "fill-green-100 text-green-600")} />
            )}
          </button>
        )}

        {/* Content */}
        <div className="flex-1">
          <h3 className={cn("font-bold text-foreground leading-tight", isDone && "line-through text-muted")}>
            {task.title}
          </h3>
          
          {task.description && (
            <p className="mt-1 line-clamp-2 text-sm text-muted">{task.description}</p>
          )}

          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
            {/* Priority Badge */}
            <span className={cn("rounded-md px-1.5 py-0.5 font-medium bg-warm-100", priority.color)}>
              {priority.label}
            </span>

            {/* Status Badge */}
            <span className={cn("rounded-md px-1.5 py-0.5 font-medium border", status.badgeColor)}>
              {status.label}
            </span>

            {/* Due Date */}
            {task.due_date && (
              <div className={cn(
                "flex items-center gap-1 ml-auto", 
                (new Date(task.due_date) < new Date() && !isDone) ? "text-red-500 font-medium" : "text-secondary-600"
              )}>
                <Calendar className="h-3.5 w-3.5" />
                <span>{format(parseISO(task.due_date), "d 'de' MMM", { locale: pt })}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
