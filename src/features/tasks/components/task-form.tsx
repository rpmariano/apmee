import { useState, useRef } from 'react'
import { X } from 'lucide-react'
import type { Task, TaskPriority, TaskStatus } from '@/types/database'
import { TASK_PRIORITIES, TASK_STATUSES } from '@/lib/constants'

import { useHardwareBack } from '@/hooks/use-hardware-back'
import { UnsavedDialog } from '@/components/ui/unsaved-dialog'
import { CustomSelect } from '@/components/ui/custom-select'

interface TaskFormProps {
  task?: Task
  onClose: () => void
  onSubmit: (data: Partial<Task>) => void
  isLoading?: boolean
}

const PRIORITY_LABELS = {
  [TASK_PRIORITIES.LOW]: 'Baixa',
  [TASK_PRIORITIES.MEDIUM]: 'Média',
  [TASK_PRIORITIES.HIGH]: 'Alta',
  [TASK_PRIORITIES.URGENT]: 'Urgente',
}

const STATUS_LABELS = {
  [TASK_STATUSES.TODO]: 'A Fazer',
  [TASK_STATUSES.IN_PROGRESS]: 'Em Curso',
  [TASK_STATUSES.DONE]: 'Concluída',
}

// Convert ISO to YYYY-MM-DD for date input
function toDateString(isoString?: string | null) {
  if (!isoString) return ''
  return isoString.split('T')[0]
}

import { useBoardMembers } from '@/features/board/api/use-board'

export function TaskForm({ task, onClose, onSubmit, isLoading }: TaskFormProps) {

  
  const [showUnsaved, setShowUnsaved] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)

  const handleCloseClick = () => {
    if (isDirty) setShowUnsaved(true)
    else onClose()
  }

  useHardwareBack(true, handleCloseClick)


  const handleSaveAndClose = () => {
    setShowUnsaved(false)
    formRef.current?.requestSubmit()
  }

  const [title, setTitle] = useState(task?.title ?? '')
  const [description, setDescription] = useState(task?.description ?? '')
  const [priority, setPriority] = useState<TaskPriority>(task?.priority ?? TASK_PRIORITIES.MEDIUM)
  const [status, setStatus] = useState<TaskStatus>(task?.status ?? TASK_STATUSES.TODO)
  const [dueDate, setDueDate] = useState(toDateString(task?.due_date))
  const [assignedTo, setAssignedTo] = useState(task?.assigned_to ?? '')

  const isDirty = (
    title !== (task?.title ?? '') ||
    description !== (task?.description ?? '') ||
    priority !== (task?.priority ?? TASK_PRIORITIES.MEDIUM) ||
    status !== (task?.status ?? TASK_STATUSES.TODO) ||
    dueDate !== toDateString(task?.due_date) ||
    assignedTo !== (task?.assigned_to ?? '')
  )


  const { data: boardMembers } = useBoardMembers()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Add time part to make it a valid TIMESTAMPTZ for Supabase if date is provided
    const dueIso = dueDate ? new Date(`${dueDate}T23:59:59Z`).toISOString() : null

    onSubmit({
      title,
      description: description || null,
      priority,
      status,
      due_date: dueIso,
      assigned_to: assignedTo || null,
    })
  }

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-background">
      <div className="flex items-center justify-between border-b border-warm-200 bg-surface px-4 py-4">
        <h2 className="text-lg font-bold text-foreground">
          {task ? 'Editar Tarefa' : 'Nova Tarefa'}
        </h2>
        <button onClick={handleCloseClick} className="rounded-full p-2 text-muted hover:bg-warm-100">
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <form ref={formRef}   id="task-form"  onSubmit={handleSubmit} className="flex flex-col gap-4">
          
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-secondary-700">Título <span className="text-primary-500">*</span></label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="rounded-[var(--radius-button)] border border-warm-200 bg-surface px-3 py-2 text-sm focus:border-primary-400 focus:outline-none focus:ring-1 focus:ring-primary-400"
              placeholder="O que precisa de ser feito?"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-secondary-700">Descrição</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="resize-none rounded-[var(--radius-card)] border border-warm-200 bg-surface px-3 py-2 text-sm focus:border-primary-400 focus:outline-none focus:ring-1 focus:ring-primary-400"
              placeholder="Detalhes adicionais..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5 z-[60]">
              <label className="text-sm font-medium text-secondary-700">Prioridade</label>
              <CustomSelect
                value={priority}
                onChange={(val) => setPriority(val as TaskPriority)}
                options={Object.values(TASK_PRIORITIES).map((p) => ({
                  label: PRIORITY_LABELS[p],
                  value: p,
                }))}
              />
            </div>
            
            <div className="flex flex-col gap-1.5 z-[60]">
              <label className="text-sm font-medium text-secondary-700">Estado</label>
              <CustomSelect
                value={status}
                onChange={(val) => setStatus(val as TaskStatus)}
                options={Object.values(TASK_STATUSES).map((s) => ({
                  label: STATUS_LABELS[s],
                  value: s,
                }))}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5 z-[50]">
              <label className="text-sm font-medium text-secondary-700">Data Limite</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="rounded-[var(--radius-button)] border border-warm-200 bg-surface px-3 py-2 text-sm focus:border-primary-400 focus:outline-none focus:ring-1 focus:ring-primary-400"
              />
            </div>
            
            <div className="flex flex-col gap-1.5 z-[50]">
              <label className="text-sm font-medium text-secondary-700">Responsável</label>
              <CustomSelect
                value={assignedTo}
                onChange={(val) => setAssignedTo(val)}
                options={[
                  { label: '(Sem atribuição)', value: '' },
                  ...(boardMembers || []).map(m => ({ 
                    label: m.display_name || m.email, 
                    value: m.id 
                  }))
                ]}
                placeholder="Atribuir a..."
              />
            </div>
          </div>

        
<div className="border-t border-warm-200 bg-surface p-4">
        <button
          type="submit"
          form="task-form"
          disabled={isLoading}
          className="flex w-full items-center justify-center rounded-[var(--radius-button)] bg-primary-400 py-3 text-sm font-medium text-white shadow-sm transition-all hover:bg-primary-500 active:scale-95 disabled:opacity-50"
        >
          {isLoading ? 'A Guardar...' : 'Guardar Tarefa'}
        </button>
      </div>
</form>
      </div>

      
    
      <UnsavedDialog
        isOpen={showUnsaved}
        onCancel={() => setShowUnsaved(false)}
        onDiscard={() => {
          setShowUnsaved(false)
          onClose()
        }}
        onSave={handleSaveAndClose}
      />
</div>
  )
}
