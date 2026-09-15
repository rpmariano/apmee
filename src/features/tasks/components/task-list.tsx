import { useTasks, useUpdateTask } from '../api/use-tasks'
import { TaskCard } from './task-card'
import type { Task, TaskStatus } from '@/types/database'
import { TASK_STATUSES } from '@/lib/constants'
import { useBoardMembers } from '@/features/board/api/use-board'

interface TaskListProps {
  filter: TaskStatus | 'all'
  onEditTask?: (task: Task) => void
}

export function TaskList({ filter, onEditTask }: TaskListProps) {
  const { data: tasks, isLoading, error } = useTasks()
  const updateMutation = useUpdateTask()

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
    if (filter === 'all') return true
    return task.status === filter
  })

  const handleToggleStatus = async (task: Task) => {
    // Simple cycle: TODO -> IN_PROGRESS -> DONE -> TODO
    let nextStatus: TaskStatus = TASK_STATUSES.IN_PROGRESS
    if (task.status === TASK_STATUSES.IN_PROGRESS) nextStatus = TASK_STATUSES.DONE
    if (task.status === TASK_STATUSES.DONE) nextStatus = TASK_STATUSES.TODO

    await updateMutation.mutateAsync({
      id: task.id,
      status: nextStatus
    })
  }

  if (filteredTasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-warm-100">
          <svg className="h-8 w-8 text-secondary-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
        </div>
        <p className="mt-4 text-sm font-medium text-foreground">Sem tarefas</p>
        <p className="mt-1 text-xs text-muted">A caixa de tarefas está vazia.</p>
      </div>
    )
  }

  // Group tasks by assignee
  const groupedTasks = filteredTasks.reduce((acc, task) => {
    const assigneeId = task.assigned_to || 'unassigned'
    if (!acc[assigneeId]) acc[assigneeId] = []
    acc[assigneeId].push(task)
    return acc
  }, {} as Record<string, Task[]>)

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
                onEdit={onEditTask} 
                onToggleStatus={handleToggleStatus} 
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
