import { useState } from 'react'
import { Plus } from 'lucide-react'
import { TaskList } from '@/features/tasks/components/task-list'
import { TaskForm } from '@/features/tasks/components/task-form'
import { useCreateTask, useUpdateTask } from '@/features/tasks/api/use-tasks'
import type { Task, TaskStatus } from '@/types/database'
import { CustomDialog } from '@/components/ui/custom-dialog'
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
  const [activeTab, setActiveTab] = useState<FilterValue>('todo')
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | undefined>()
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const createMutation = useCreateTask()
  const updateMutation = useUpdateTask()

  const handleToggleStatus = async (task: Task) => {
    const nextStatus: TaskStatus = task.status === 'done' ? 'todo' : 'done'
    try {
      await updateMutation.mutateAsync({ id: task.id, status: nextStatus })
    } catch (error: any) {
      console.error('Failed to toggle task status:', error)
      setErrorMessage('Erro ao atualizar estado da tarefa.')
    }
  }

  const handleEditTask = (task: Task) => {
    setEditingTask(task)
    setIsFormOpen(true)
  }

  const handleCloseForm = () => {
    setIsFormOpen(false)
    setEditingTask(undefined)
  }

  const handleSubmitForm = async (data: Partial<Task>) => {
    try {
      if (editingTask) {
        await updateMutation.mutateAsync({ id: editingTask.id, ...data })
      } else {
        await createMutation.mutateAsync(data as any)
      }
      handleCloseForm()
    } catch (error: any) {
      console.error('Failed to save task:', error)
      setErrorMessage(error?.message || 'Erro ao guardar a tarefa. Tente novamente.')
    }
  }

  return (
    <div className="relative min-h-[calc(100vh-4rem)] bg-background">
      <div className="sticky top-0 z-10 bg-background/95 pb-2 pt-6 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="px-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-foreground">Tarefas</h1>
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
      </div>

      <div className="px-4">
        <TaskList filter={activeTab} onEditTask={handleEditTask} onToggleStatus={handleToggleStatus} />
      </div>

      <button
        type="button"
        aria-label="Criar nova tarefa"
        className="fixed bottom-24 right-6 min-[430px]:right-[calc(50%-215px+1.5rem)] z-20 flex h-14 w-14 items-center justify-center rounded-full bg-primary-400 text-white shadow-lg transition-transform hover:scale-105 hover:bg-primary-500 active:scale-95"
        onClick={() => setIsFormOpen(true)}
      >
        <Plus className="h-6 w-6" />
      </button>

      {isFormOpen && (
        <TaskForm
          task={editingTask}
          onClose={handleCloseForm}
          onSubmit={handleSubmitForm}
          isLoading={createMutation.isPending || updateMutation.isPending}
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
