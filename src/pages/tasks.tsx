import { useState, useEffect } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { TaskList } from '@/features/tasks/components/task-list'
import { TaskForm } from '@/features/tasks/components/task-form'
import { useCreateTask, useUpdateTask, useDeleteTask, useTasks } from '@/features/tasks/api/use-tasks'
import { useAuth } from '@/providers/auth-provider'
import { useBoardMembers } from '@/features/board/api/use-board'
import { usePermissions } from '@/hooks/use-permissions'
import type { Task, TaskStatus } from '@/types/database'
import { CustomDialog } from '@/components/ui/custom-dialog'
import { useToast } from '@/components/ui/toast'
import { getFriendlyErrorMessage } from '@/lib/error-utils'
import { MenuAlerts } from '@/components/ui/menu-alerts'
import { cn } from '@/lib/utils'

type FilterValue = TaskStatus | 'all'

const tabs: { value: FilterValue; label: string }[] = [
  { value: 'todo', label: 'A Fazer' },
  { value: 'in_progress', label: 'Em Curso' },
  { value: 'done', label: 'Concluídas' },
  { value: 'all', label: 'Todas' },
]

export default function TasksPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const editTaskId = searchParams.get('edit')
  const isNew = searchParams.get('new') === 'true' || searchParams.get('new') === '1'
  const [activeTab, setActiveTab] = useState<FilterValue>('todo')
  const [scopeFilter, setScopeFilter] = useState<'all' | 'my'>('all')
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | undefined>()
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const { data: allTasks } = useTasks()
  const { user } = useAuth()
  const { data: boardMembers } = useBoardMembers()
  const currentMember = boardMembers?.find(m => m.email === user?.email)
  const currentMemberId = currentMember?.id

  useEffect(() => {
    if (editTaskId && allTasks && !isFormOpen) {
      const target = allTasks.find((t) => t.id === editTaskId)
      if (target) {
        setEditingTask(target)
        setIsFormOpen(true)
      }
    } else if (isNew && !isFormOpen) {
      setEditingTask(undefined)
      setIsFormOpen(true)
    }
  }, [editTaskId, isNew, allTasks, isFormOpen])

  const createMutation = useCreateTask()
  const updateMutation = useUpdateTask()
  const deleteMutation = useDeleteTask()
  const { toast } = useToast()
  const { canWrite } = usePermissions()
  const canWriteTasks = canWrite('tasks')

  const handleToggleStatus = async (task: Task) => {
    const nextStatus: TaskStatus = task.status === 'done' ? 'todo' : 'done'
    try {
      await updateMutation.mutateAsync({ id: task.id, status: nextStatus })
      toast.success(nextStatus === 'done' ? 'Tarefa concluída!' : 'Tarefa marcada como a fazer.')
    } catch (error: any) {
      console.error('Failed to toggle task status:', error)
      toast.error(getFriendlyErrorMessage(error, 'Erro ao atualizar estado da tarefa.'))
    }
  }

  const handleEditTask = (task: Task) => {
    setEditingTask(task)
    setIsFormOpen(true)
  }

  const handleCloseForm = () => {
    setIsFormOpen(false)
    setEditingTask(undefined)
    if (searchParams.get('edit') || searchParams.get('new')) {
      const nextParams = new URLSearchParams(searchParams)
      nextParams.delete('edit')
      nextParams.delete('new')
      setSearchParams(nextParams, { replace: true })
    }
  }

  const handleSubmitForm = async (data: Partial<Task>) => {
    try {
      if (editingTask) {
        await updateMutation.mutateAsync({ id: editingTask.id, ...data })
        toast.success('Tarefa atualizada com sucesso!')
      } else {
        await createMutation.mutateAsync(data as any)
        toast.success('Tarefa criada com sucesso!')
      }
      handleCloseForm()
    } catch (error: any) {
      console.error('Failed to save task:', error)
      setErrorMessage(getFriendlyErrorMessage(error, 'Erro ao guardar a tarefa. Tente novamente.'))
    }
  }

  const handleDeleteTask = async (id: string) => {
    try {
      await deleteMutation.mutateAsync(id)
      toast.success('Tarefa eliminada com sucesso!')
      handleCloseForm()
    } catch (error: any) {
      console.error('Failed to delete task:', error)
      setErrorMessage(getFriendlyErrorMessage(error, 'Erro ao eliminar a tarefa. Tente novamente.'))
    }
  }

  return (
    <div className="relative min-h-[calc(100vh-4rem)] bg-background">
      <div className="sticky top-0 z-10 bg-background/95 pb-2 pt-6 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="px-4 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Link
              to="/menu"
              aria-label="Voltar ao Menu"
              className="flex h-9 w-9 items-center justify-center rounded-full text-secondary-600 hover:bg-warm-100 hover:text-foreground active:scale-95 transition-all -ml-1"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <h1 className="text-xl font-bold text-foreground">Tarefas</h1>
          </div>
          <MenuAlerts />
        </div>

        <div className="mt-4 flex gap-2 overflow-x-auto px-4 pb-2 scrollbar-hide">
          {tabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={cn(
                'whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium transition-colors',
                activeTab === tab.value
                  ? 'bg-secondary-900 text-white shadow-sm'
                  : 'bg-warm-100 text-secondary-600 hover:bg-warm-200'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Assignee Scope Filter (Todas vs As Minhas) */}
        {currentMemberId && (
          <div className="mt-1 flex items-center gap-1.5 px-4 pb-2">
            <button
              type="button"
              onClick={() => setScopeFilter('all')}
              className={cn(
                'rounded-lg px-2.5 py-1 text-xs font-semibold transition-all active:scale-95',
                scopeFilter === 'all'
                  ? 'bg-secondary-800 text-white shadow-xs'
                  : 'bg-warm-100 text-secondary-600 hover:bg-warm-200'
              )}
            >
              Todas
            </button>
            <button
              type="button"
              onClick={() => setScopeFilter('my')}
              className={cn(
                'rounded-lg px-2.5 py-1 text-xs font-semibold transition-all active:scale-95',
                scopeFilter === 'my'
                  ? 'bg-primary-500 text-white shadow-xs'
                  : 'bg-warm-100 text-secondary-600 hover:bg-warm-200'
              )}
            >
              As Minhas
            </button>
          </div>
        )}
      </div>

      <div className="px-4">
        <TaskList filter={activeTab} assigneeFilter={scopeFilter === 'my' && currentMemberId ? currentMemberId : 'all'} onEditTask={handleEditTask} onToggleStatus={handleToggleStatus} />
      </div>

      {isFormOpen && (
        <TaskForm
          task={editingTask}
          onClose={handleCloseForm}
          onSubmit={handleSubmitForm}
          onDelete={canWriteTasks ? handleDeleteTask : undefined}
          isLoading={createMutation.isPending || updateMutation.isPending || deleteMutation.isPending}
        />
      )}

      <CustomDialog
        isOpen={!!errorMessage}
        title="Erro ao guardar tarefa"
        description={errorMessage || ''}
        variant="danger"
        confirmLabel="OK"
        onConfirm={() => setErrorMessage(null)}
      />
    </div>
  )
}
