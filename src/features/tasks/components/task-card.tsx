import { Calendar, Circle, CheckCircle2, Clock, User } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { pt } from 'date-fns/locale'
import type { Task, TaskPriority, TaskStatus } from '@/types/database'
import { cn } from '@/lib/utils'
import { TASK_STATUSES, TASK_PRIORITIES } from '@/lib/constants'

interface TaskCardProps {
  task: Task
  assigneeName?: string
  onEdit?: (task: Task) => void
  onToggleStatus?: (task: Task) => void
}

const priorityConfig: Record<TaskPriority, { label: string; color: string }> = {
  [TASK_PRIORITIES.LOW]: { label: 'Baixa', color: 'text-secondary-500' },
  [TASK_PRIORITIES.MEDIUM]: { label: 'Média', color: 'text-primary-500' },
  [TASK_PRIORITIES.HIGH]: { label: 'Alta', color: 'text-orange-500' },
  [TASK_PRIORITIES.URGENT]: { label: 'Urgente', color: 'text-red-600 font-bold' },
}

const statusConfig: Record<TaskStatus, { label: string; icon: any; badgeColor: string }> = {
  [TASK_STATUSES.TODO]: { 
    label: 'A Fazer', 
    icon: Circle, 
    badgeColor: 'bg-warm-100 text-secondary-600 border-warm-200'
  },
  [TASK_STATUSES.IN_PROGRESS]: { 
    label: 'Em Curso', 
    icon: Clock, 
    badgeColor: 'bg-amber-50 text-amber-700 border-amber-200'
  },
  [TASK_STATUSES.DONE]: { 
    label: 'Concluída', 
    icon: CheckCircle2, 
    badgeColor: 'bg-green-50 text-green-700 border-green-200'
  },
}

export function TaskCard({ task, assigneeName, onEdit, onToggleStatus }: TaskCardProps) {
  const priority = priorityConfig[task.priority]
  const status = statusConfig[task.status]
  const StatusIcon = status.icon

  const isDone = task.status === TASK_STATUSES.DONE

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (onToggleStatus) {
      onToggleStatus(task)
    }
  }

  return (
    <div 
      className={cn(
        "flex items-start gap-3 rounded-[var(--radius-card)] border border-warm-200 bg-surface p-4 shadow-sm transition-all hover:shadow-md",
        isDone && "opacity-75 bg-warm-50/70",
        onEdit && "cursor-pointer active:scale-[0.99]"
      )}
      onClick={() => onEdit && onEdit(task)}
    >
      {/* 1-Tap Completion Checkbox (44x44px Accessible Touch Target) */}
      <button
        type="button"
        role="checkbox"
        aria-checked={isDone}
        aria-label={isDone ? "Marcar tarefa como a fazer" : "Marcar tarefa como concluída"}
        onClick={handleToggle}
        className="flex min-h-[44px] min-w-[44px] items-center justify-center -ml-2.5 -mt-2.5 rounded-full focus:outline-none shrink-0"
      >
        <span
          className={cn(
            "flex h-6 w-6 items-center justify-center rounded-full border transition-all active:scale-90",
            isDone
              ? "border-green-600 bg-green-500 text-white shadow-sm"
              : "border-secondary-300 bg-white hover:border-green-500 hover:text-green-500 text-transparent"
          )}
        >
          <CheckCircle2 className={cn("h-4 w-4 transition-all", isDone ? "scale-100 animate-[pop_300ms_ease-out]" : "scale-75")} />
        </span>
      </button>

      {/* Main Content */}
      <div className="flex-1 min-w-0">
        <h3 className={cn("font-bold text-foreground leading-tight text-sm", isDone && "line-through text-muted")}>
          {task.title}
        </h3>
        
        {task.description && (
          <p className="mt-1 line-clamp-2 text-xs text-muted">{task.description}</p>
        )}

        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
          {/* Priority Badge */}
          <span className={cn("rounded-md px-1.5 py-0.5 font-medium bg-warm-100", priority.color)}>
            {priority.label}
          </span>

          {/* Status Badge */}
          <span className={cn("inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 font-medium border", status.badgeColor)}>
            <StatusIcon className="h-3 w-3" />
            {status.label}
          </span>

          {/* Assignee Badge */}
          {assigneeName && assigneeName !== 'Sem atribuição' && (
            <span className="inline-flex items-center gap-1 rounded-md bg-warm-100 px-1.5 py-0.5 font-medium text-secondary-700">
              <User className="h-3 w-3 text-secondary-500" />
              <span className="truncate max-w-[120px]">{assigneeName}</span>
            </span>
          )}

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
  )
}
