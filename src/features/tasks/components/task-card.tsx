import { Calendar, MoreVertical, AlertCircle, CheckCircle2, Clock } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { ptPT } from 'date-fns/locale'
import type { Task, TaskPriority, TaskStatus } from '@/types/database'
import { cn } from '@/lib/utils'
import { TASK_STATUSES, TASK_PRIORITIES } from '@/lib/constants'

interface TaskCardProps {
  task: Task
  onEdit?: (task: Task) => void
  onToggleStatus?: (task: Task) => void
}

const priorityConfig: Record<TaskPriority, { label: string; color: string }> = {
  [TASK_PRIORITIES.LOW]: { label: 'Baixa', color: 'text-secondary-500' },
  [TASK_PRIORITIES.MEDIUM]: { label: 'Média', color: 'text-primary-500' },
  [TASK_PRIORITIES.HIGH]: { label: 'Alta', color: 'text-orange-500' },
  [TASK_PRIORITIES.URGENT]: { label: 'Urgente', color: 'text-red-600 font-bold' },
}

const statusConfig: Record<TaskStatus, { label: string; icon: any; color: string }> = {
  [TASK_STATUSES.TODO]: { label: 'A Fazer', icon: AlertCircle, color: 'text-secondary-400' },
  [TASK_STATUSES.IN_PROGRESS]: { label: 'Em Curso', icon: Clock, color: 'text-primary-500' },
  [TASK_STATUSES.DONE]: { label: 'Concluída', icon: CheckCircle2, color: 'text-[#2E7D32]' },
}

export function TaskCard({ task, onEdit, onToggleStatus }: TaskCardProps) {
  const priority = priorityConfig[task.priority]
  const status = statusConfig[task.status]
  const StatusIcon = status.icon

  const isDone = task.status === TASK_STATUSES.DONE

  return (
    <div className={cn(
      "flex flex-col gap-2 rounded-[var(--radius-card)] border border-warm-200 bg-surface p-4 shadow-sm transition-all hover:shadow-md",
      isDone && "opacity-75 bg-warm-50"
    )}>
      <div className="flex items-start justify-between gap-3">
        
        {/* Toggle Status Button */}
        {onToggleStatus && (
          <button 
            onClick={() => onToggleStatus(task)}
            className={cn("mt-1 shrink-0 rounded-full transition-transform active:scale-90", status.color)}
          >
            <StatusIcon className="h-6 w-6" />
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

          <div className="mt-3 flex flex-wrap items-center gap-3 text-xs">
            {/* Priority Badge */}
            <span className={cn("rounded-md px-1.5 py-0.5 font-medium bg-warm-100", priority.color)}>
              {priority.label}
            </span>

            {/* Due Date */}
            {task.due_date && (
              <div className={cn(
                "flex items-center gap-1", 
                (new Date(task.due_date) < new Date() && !isDone) ? "text-red-500 font-medium" : "text-secondary-600"
              )}>
                <Calendar className="h-3.5 w-3.5" />
                <span>{format(parseISO(task.due_date), "d 'de' MMM", { locale: ptPT })}</span>
              </div>
            )}
          </div>
        </div>

        {/* Options */}
        {onEdit && (
          <button
            onClick={() => onEdit(task)}
            className="shrink-0 rounded-full p-2 text-muted transition-colors hover:bg-warm-100 hover:text-foreground"
          >
            <MoreVertical className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  )
}
