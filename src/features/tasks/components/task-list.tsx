import { ListTodo } from 'lucide-react'
import { useTasks } from '../api/use-tasks'
import { TaskCard } from './task-card'
import type { Task, TaskStatus } from '@/types/database'
import { TASK_STATUSES } from '@/lib/constants'
import { useBoardMembers } from '@/features/board/api/use-board'

export type TaskSortCriteria = 'priority' | 'due_date' | 'newest' | 'title'

interface TaskListProps {
  filter: TaskStatus | 'all'
  assigneeFilter?: string | 'all'
  sortBy?: TaskSortCriteria
  onEditTask?: (task: Task) => void
  onToggleStatus?: (task: Task) => void
}

export function TaskList({ 
  filter, 
  assigneeFilter = 'all', 
  sortBy = 'priority', 
  onEditTask, 
  onToggleStatus 
}: TaskListProps) {
  const { data: tasks, isLoading, error } = useTasks()

  const { data: boardMembers, isLoading: isLoadingBoard } = useBoardMembers()

  if (isLoading || isLoadingBoard) {
    return (
      <div className="flex flex-col gap-3 py-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-28 w-full animate-pulse rounded-[var(--radius-card)] bg-warm-100" />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="py-8 text-center text-sm text-red-500">
        Ocorreu um erro ao carregar as tarefas.
      </div>
    )
  }

  // Filter tasks
  const filteredTasks = (tasks || []).filter((task) => {
    const effectiveStatus = task.status === 'todo' ? 'in_progress' : task.status
    if (filter !== 'all' && effectiveStatus !== filter) return false
    if (assigneeFilter && assigneeFilter !== 'all' && task.assigned_to !== assigneeFilter) return false
    return true
  })

  if (filteredTasks.length === 0) {
    const isMyTasksEmpty = assigneeFilter && assigneeFilter !== 'all'
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-warm-100">
          <ListTodo className="h-8 w-8 text-secondary-400" />
        </div>
        <p className="mt-4 text-sm font-medium text-foreground">
          {isMyTasksEmpty ? 'Sem tarefas atribuídas' : 'Sem tarefas'}
        </p>
        <p className="mt-1 text-xs text-muted">
          {isMyTasksEmpty ? 'Não tem tarefas pendentes atribuídas a si neste filtro.' : 'A caixa de tarefas está vazia.'}
        </p>
      </div>
    )
  }

  const priorityOrder: Record<string, number> = {
    urgent: 0,
    urgente: 0,
    high: 1,
    alta: 1,
    medium: 2,
    media: 2,
    média: 2,
    low: 3,
    baixa: 3,
  }

  const getPriorityWeight = (p?: string | null): number => {
    const key = (p || '').toLowerCase().trim()
    return priorityOrder[key] ?? 2
  }

  const sortTasks = (a: Task, b: Task) => {
    // 1. Tarefas não concluídas sempre primeiro
    const aDone = a.status === TASK_STATUSES.DONE ? 1 : 0
    const bDone = b.status === TASK_STATUSES.DONE ? 1 : 0
    if (aDone !== bDone) return aDone - bDone

    if (sortBy === 'due_date') {
      // Data limite mais próxima primeiro
      if (a.due_date && b.due_date) {
        const dateDiff = new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
        if (dateDiff !== 0) return dateDiff
      } else if (a.due_date && !b.due_date) {
        return -1
      } else if (!a.due_date && b.due_date) {
        return 1
      }
      // Desempate por criticidade
      const aPrio = getPriorityWeight(a.priority)
      const bPrio = getPriorityWeight(b.priority)
      if (aPrio !== bPrio) return aPrio - bPrio

      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    }

    if (sortBy === 'newest') {
      // Mais recentes primeiro
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    }

    if (sortBy === 'title') {
      // Ordem alfabética pelo título
      return a.title.localeCompare(b.title, 'pt')
    }

    // Default: 'priority' (Criticidade: Urgente > Alta > Média > Baixa)
    const aPrio = getPriorityWeight(a.priority)
    const bPrio = getPriorityWeight(b.priority)
    if (aPrio !== bPrio) return aPrio - bPrio

    // Desempate por data limite mais próxima
    if (a.due_date && b.due_date) {
      const dateDiff = new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
      if (dateDiff !== 0) return dateDiff
    } else if (a.due_date && !b.due_date) {
      return -1
    } else if (!a.due_date && b.due_date) {
      return 1
    }

    // Desempate por data de criação mais recente
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  }

  // Group tasks by assignee (Mantém rigorosamente o agrupamento por utilizador)
  const groupedTasks = filteredTasks.reduce((acc, task) => {
    const assigneeId = task.assigned_to || 'unassigned'
    if (!acc[assigneeId]) acc[assigneeId] = []
    acc[assigneeId].push(task)
    return acc
  }, {} as Record<string, Task[]>)

  // Sort tasks within each user group according to sortBy
  Object.values(groupedTasks).forEach(list => list.sort(sortTasks))

  // Helper to get assignee name
  const getAssigneeName = (id: string) => {
    if (id === 'unassigned') return 'Sem atribuição'
    const member = boardMembers?.find(m => m.id === id)
    return member ? (member.display_name || member.email) : 'Desconhecido'
  }

  // Sort groups: Utilizadores por ordem alfabética, 'Sem atribuição' no fim
  const groupKeys = Object.keys(groupedTasks).sort((a, b) => {
    if (a === 'unassigned') return 1
    if (b === 'unassigned') return -1
    return getAssigneeName(a).localeCompare(getAssigneeName(b), 'pt')
  })

  return (
    <div className="flex flex-col gap-6 py-4">
      {groupKeys.map((assigneeId) => (
        <div key={assigneeId} className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-secondary-600">
              {getAssigneeName(assigneeId)}
            </h3>
            <span className="rounded-full bg-warm-200/70 px-2 py-0.5 text-[10px] font-bold text-secondary-700">
              {groupedTasks[assigneeId].length}
            </span>
          </div>
          <div className="flex flex-col gap-3">
            {groupedTasks[assigneeId].map((task) => (
              <TaskCard 
                key={task.id} 
                task={task} 
                assigneeName={getAssigneeName(assigneeId)}
                onEdit={onEditTask}
                onToggleStatus={onToggleStatus} 
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
