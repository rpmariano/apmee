import { useTasks } from '../api/use-tasks'
import { TaskCard } from './task-card'
import type { Task, TaskStatus } from '@/types/database'
import { TASK_STATUSES } from '@/lib/constants'
import { useBoardMembers } from '@/features/board/api/use-board'

interface TaskListProps {
  filter: TaskStatus | 'all'
  assigneeFilter?: string | 'all'
  onEditTask?: (task: Task) => void
  onToggleStatus?: (task: Task) => void
}

export function TaskList({ filter, assigneeFilter = 'all', onEditTask, onToggleStatus }: TaskListProps) {
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
    if (filter !== 'all' && task.status !== filter) return false
    if (assigneeFilter && assigneeFilter !== 'all' && task.assigned_to !== assigneeFilter) return false
    return true
  })

  if (filteredTasks.length === 0) {
    const isMyTasksEmpty = assigneeFilter && assigneeFilter !== 'all'
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-warm-100">
          <svg className="h-8 w-8 text-secondary-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
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
    urgente: 0,
    alta: 1,
    media: 2,
    baixa: 3,
  }

  const sortTasks = (a: Task, b: Task) => {
    // 1. Tarefas não concluídas primeiro
    const aDone = a.status === TASK_STATUSES.DONE ? 1 : 0
    const bDone = b.status === TASK_STATUSES.DONE ? 1 : 0
    if (aDone !== bDone) return aDone - bDone

    // 2. Data limite mais próxima primeiro
    if (a.due_date && b.due_date) {
      const dateDiff = new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
      if (dateDiff !== 0) return dateDiff
    } else if (a.due_date && !b.due_date) {
      return -1
    } else if (!a.due_date && b.due_date) {
      return 1
    }

    // 3. Prioridade (urgente > alta > media > baixa)
    const aPrio = priorityOrder[a.priority] ?? 2
    const bPrio = priorityOrder[b.priority] ?? 2
    if (aPrio !== bPrio) return aPrio - bPrio

    // 4. Data de criação decrescente
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  }

  // Group tasks by assignee
  const groupedTasks = filteredTasks.reduce((acc, task) => {
    const assigneeId = task.assigned_to || 'unassigned'
    if (!acc[assigneeId]) acc[assigneeId] = []
    acc[assigneeId].push(task)
    return acc
  }, {} as Record<string, Task[]>)

  // Sort tasks within each group
  Object.values(groupedTasks).forEach(list => list.sort(sortTasks))

  // Helper to get assignee name
  const getAssigneeName = (id: string) => {
    if (id === 'unassigned') return 'Sem atribuição'
    const member = boardMembers?.find(m => m.id === id)
    return member ? (member.display_name || member.email) : 'Desconhecido'
  }

  // Sort groups: Unassigned first, then alphabetically
  const groupKeys = Object.keys(groupedTasks).sort((a, b) => {
    if (a === 'unassigned') return -1
    if (b === 'unassigned') return 1
    return getAssigneeName(a).localeCompare(getAssigneeName(b))
  })

  return (
    <div className="flex flex-col gap-6 py-4">
      {groupKeys.map((assigneeId) => (
        <div key={assigneeId} className="flex flex-col gap-3">
          <h3 className="text-sm font-bold uppercase tracking-wider text-secondary-600">
            {getAssigneeName(assigneeId)}
          </h3>
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
