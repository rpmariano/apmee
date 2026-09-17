import { useState, useRef } from 'react'
import { X } from 'lucide-react'
import type { Event, EventStatus } from '@/types/database'
import { EVENT_STATUSES } from '@/lib/constants'

import { useHardwareBack } from '@/hooks/use-hardware-back'
import { UnsavedDialog } from '@/components/ui/unsaved-dialog'
import { CustomDialog } from '@/components/ui/custom-dialog'
import { CustomSelect } from '@/components/ui/custom-select'
import { EventInventoryManager } from './event-inventory-manager'
import { useEventInventoryStatus } from '../api/use-event-inventory-status'

interface EventFormProps {
  event?: Event
  initialDate?: Date
  onClose: () => void
  onSubmit: (data: Partial<Event>) => void
  isLoading?: boolean
}

// Map constants to labels for the select input
const STATUS_LABELS: Record<string, string> = {
  [EVENT_STATUSES.PLANNED]: 'Planeado',
  [EVENT_STATUSES.ACTIVE]: 'Ativo / Em Curso',
  [EVENT_STATUSES.COMPLETED]: 'Concluído',
  [EVENT_STATUSES.CANCELLED]: 'Cancelado',
}

// Utility to convert ISO string to datetime-local format (YYYY-MM-DDThh:mm)
function toDateTimeLocal(isoString?: string | null) {
  if (!isoString) return ''
  const date = new Date(isoString)
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16)
}

function getDefaultDates(initialDate?: Date) {
  if (!initialDate) return { start: '', end: '' }
  const start = new Date(initialDate)
  start.setHours(9, 0, 0, 0)
  const end = new Date(initialDate)
  end.setHours(10, 0, 0, 0)
  return {
    start: toDateTimeLocal(start.toISOString()),
    end: toDateTimeLocal(end.toISOString()),
  }
}

export function EventForm({ event, initialDate, onClose, onSubmit, isLoading }: EventFormProps) {
  const [showUnsaved, setShowUnsaved] = useState(false)
  const [showShortageWarning, setShowShortageWarning] = useState(false)
  const [showCompletionBlocked, setShowCompletionBlocked] = useState(false)
  const [isEditing, setIsEditing] = useState(!event)
  const formRef = useRef<HTMLFormElement>(null)

  // Inventory shortage status
  const { hasShortages, shortages } = useEventInventoryStatus(event?.id)

  const handleCloseClick = () => {
    if (isDirty) setShowUnsaved(true)
    else onClose()
  }

  useHardwareBack(true, handleCloseClick)

  const handleSaveAndClose = () => {
    setShowUnsaved(false)
    formRef.current?.requestSubmit()
  }

  const defaultDates = getDefaultDates(initialDate)
  const initialStartDate = toDateTimeLocal(event?.start_date) || defaultDates.start
  const initialEndDate = toDateTimeLocal(event?.end_date) || defaultDates.end

  const [title, setTitle] = useState(event?.title ?? '')
  const [description, setDescription] = useState(event?.description ?? '')
  const [location, setLocation] = useState(event?.location ?? '')
  const [startDate, setStartDate] = useState(initialStartDate)
  const [endDate, setEndDate] = useState(initialEndDate)
  const [isAllDay, setIsAllDay] = useState(event?.is_all_day ?? false)
  const [status, setStatus] = useState<EventStatus>(event?.status ?? EVENT_STATUSES.PLANNED)

  const isDirty =
    title !== (event?.title ?? '') ||
    description !== (event?.description ?? '') ||
    location !== (event?.location ?? '') ||
    startDate !== initialStartDate ||
    endDate !== initialEndDate ||
    isAllDay !== (event?.is_all_day ?? false) ||
    status !== (event?.status ?? EVENT_STATUSES.PLANNED)

  const pendingInventoryHandlerRef = useRef<(() => Promise<void>) | null>(null)

  const doSubmit = () => {
    const startIso = new Date(startDate).toISOString()
    const endIso = endDate ? new Date(endDate).toISOString() : null

    onSubmit({
      title,
      description: description || null,
      location: location || null,
      start_date: startIso,
      end_date: endIso,
      is_all_day: isAllDay,
      status,
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // If there is any pending material chosen in the inventory inputs, save it!
    if (pendingInventoryHandlerRef.current) {
      try {
        await pendingInventoryHandlerRef.current()
      } catch (err) {
        console.error('Failed to save pending inventory:', err)
      }
    }

    // Block completion if there are shortages
    if (status === EVENT_STATUSES.COMPLETED && hasShortages) {
      setShowCompletionBlocked(true)
      return
    }

    // Warn about shortages on save (even if not completing)
    if (hasShortages && (status === EVENT_STATUSES.PLANNED || status === EVENT_STATUSES.ACTIVE)) {
      setShowShortageWarning(true)
      return
    }

    doSubmit()
  }

  // Handle status change — block completing if shortages exist
  const handleStatusChange = (val: string) => {
    if (val === EVENT_STATUSES.COMPLETED && hasShortages) {
      setShowCompletionBlocked(true)
      return
    }
    setStatus(val as EventStatus)
  }

  return (
    <div className="fixed inset-0 z-[100] flex justify-center bg-warm-100">{/* Phone container */}<div className="flex w-full max-w-[430px] flex-col bg-background shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-warm-200 bg-surface px-4 py-4">
        <h2 className="text-lg font-bold text-foreground">
          {!isEditing ? 'Detalhes' : event ? 'Editar Evento' : 'Novo Evento'}
        </h2>
        <button onClick={handleCloseClick} className="rounded-full p-2 text-muted hover:bg-warm-100">
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Form */}
      <div className="flex-1 overflow-y-auto p-4">
        <form ref={formRef} id="event-form" onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-secondary-700">
              Título <span className="text-primary-500">*</span>
            </label>
            <input
              disabled={!isEditing}
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="rounded-[var(--radius-button)] border border-warm-200 bg-surface px-3 py-2 text-sm focus:border-primary-400 focus:outline-none focus:ring-1 focus:ring-primary-400"
              placeholder="Ex: Festa de Fim de Ano"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-secondary-700">Localização</label>
            <input
              disabled={!isEditing}
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="rounded-[var(--radius-button)] border border-warm-200 bg-surface px-3 py-2 text-sm focus:border-primary-400 focus:outline-none focus:ring-1 focus:ring-primary-400"
              placeholder="Ex: Escola EB Cobre"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-secondary-700">Descrição</label>
            <textarea
              disabled={!isEditing}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="resize-none rounded-[var(--radius-card)] border border-warm-200 bg-surface px-3 py-2 text-sm focus:border-primary-400 focus:outline-none focus:ring-1 focus:ring-primary-400"
              placeholder="Detalhes sobre o evento..."
            />
          </div>

          <div className="my-2 border-t border-warm-200" />

          <div className="flex items-center gap-2">
            <input
              disabled={!isEditing}
              type="checkbox"
              id="all-day"
              checked={isAllDay}
              onChange={(e) => setIsAllDay(e.target.checked)}
              className="h-4 w-4 rounded border-warm-300 text-primary-500 focus:ring-primary-400"
            />
            <label htmlFor="all-day" className="text-sm font-medium text-foreground">
              Evento de dia inteiro
            </label>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-secondary-700">
                Início <span className="text-primary-500">*</span>
              </label>
              <input
                disabled={!isEditing}
                type={isAllDay ? 'date' : 'datetime-local'}
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
                className="rounded-[var(--radius-button)] border border-warm-200 bg-surface px-3 py-2 text-sm focus:border-primary-400 focus:outline-none focus:ring-1 focus:ring-primary-400"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-secondary-700">Fim</label>
              <input
                disabled={!isEditing}
                type={isAllDay ? 'date' : 'datetime-local'}
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="rounded-[var(--radius-button)] border border-warm-200 bg-surface px-3 py-2 text-sm focus:border-primary-400 focus:outline-none focus:ring-1 focus:ring-primary-400"
              />
            </div>
          </div>

          <div className="my-2 border-t border-warm-200" />

          <div className="flex flex-col gap-1.5 z-[60]">
            <label className="text-sm font-medium text-secondary-700">Estado</label>
            <CustomSelect
              disabled={!isEditing}
              value={status}
              onChange={handleStatusChange}
              options={Object.values(EVENT_STATUSES).map((s) => ({
                label: STATUS_LABELS[s],
                value: s,
              }))}
            />
          </div>
        </form>

        {/* Event Inventory Manager */}
        {event?.id ? (
          <EventInventoryManager
            eventId={event.id}
            eventStatus={status}
            isEditing={isEditing}
            onRegisterPendingHandler={(handler) => {
              pendingInventoryHandlerRef.current = handler
            }}
          />
        ) : (
          <div className="rounded-[var(--radius-card)] bg-warm-50 p-4 border border-warm-100 text-center mt-2">
            <p className="text-sm text-secondary-600">
              Guarde o evento primeiro para poder associar material do inventário.
            </p>
          </div>
        )}
      </div>

      <div className="border-t border-warm-200 bg-surface p-4">
        {isEditing ? (
          <button
            type="submit"
            form="event-form"
            disabled={isLoading}
            className="flex w-full items-center justify-center rounded-[var(--radius-button)] bg-primary-400 py-3 text-sm font-medium text-white shadow-sm transition-all hover:bg-primary-500 active:scale-95 disabled:opacity-50"
          >
            {isLoading ? 'A Guardar...' : 'Guardar Evento'}
          </button>
        ) : (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault()
              setIsEditing(true)
            }}
            className="flex w-full items-center justify-center rounded-[var(--radius-button)] bg-primary-400 py-3 text-sm font-medium text-white shadow-sm transition-all hover:bg-primary-500 active:scale-95"
          >
            Editar Evento
          </button>
        )}
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

      {/* Custom Dialog for shortage warning on save */}
      <CustomDialog
        isOpen={showShortageWarning}
        title="Provisão Insuficiente"
        description={`Atenção: Este evento tem ${shortages.length} item(ns) sem a provisão necessária no inventário.\n\nDeseja guardar na mesma?`}
        variant="warning"
        confirmLabel="Guardar na Mesma"
        cancelLabel="Voltar ao Evento"
        onConfirm={() => {
          setShowShortageWarning(false)
          doSubmit()
        }}
        onCancel={() => setShowShortageWarning(false)}
      />

      {/* Custom Dialog for completion blocked */}
      <CustomDialog
        isOpen={showCompletionBlocked}
        title="Não é Possível Concluir"
        description={`Existem ${shortages.length} item(ns) sem provisão suficiente no inventário.\n\nAdquira o material em falta antes de alterar o estado para "Concluído".`}
        variant="danger"
        confirmLabel="Entendido"
        onConfirm={() => setShowCompletionBlocked(false)}
      />
    </div>
</div>
  )
}
