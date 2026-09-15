import { useState } from 'react'
import { X } from 'lucide-react'
import type { Event, EventStatus } from '@/types/database'
import { EVENT_STATUSES } from '@/lib/constants'

interface EventFormProps {
  event?: Event
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

export function EventForm({ event, onClose, onSubmit, isLoading }: EventFormProps) {
  const [title, setTitle] = useState(event?.title ?? '')
  const [description, setDescription] = useState(event?.description ?? '')
  const [location, setLocation] = useState(event?.location ?? '')
  
  const [startDate, setStartDate] = useState(toDateTimeLocal(event?.start_date))
  const [endDate, setEndDate] = useState(toDateTimeLocal(event?.end_date))
  const [isAllDay, setIsAllDay] = useState(event?.is_all_day ?? false)
  const [status, setStatus] = useState<EventStatus>(event?.status ?? EVENT_STATUSES.PLANNED)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Convert local datetime back to UTC ISO for the database
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

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-warm-200 bg-surface px-4 py-4">
        <h2 className="text-lg font-bold text-foreground">
          {event ? 'Editar Evento' : 'Novo Evento'}
        </h2>
        <button onClick={onClose} className="rounded-full p-2 text-muted hover:bg-warm-100">
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Form */}
      <div className="flex-1 overflow-y-auto p-4">
        <form id="event-form" onSubmit={handleSubmit} className="flex flex-col gap-4">
          
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-secondary-700">Título <span className="text-primary-500">*</span></label>
            <input
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
              <label className="text-sm font-medium text-secondary-700">Início <span className="text-primary-500">*</span></label>
              <input
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
                type={isAllDay ? 'date' : 'datetime-local'}
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="rounded-[var(--radius-button)] border border-warm-200 bg-surface px-3 py-2 text-sm focus:border-primary-400 focus:outline-none focus:ring-1 focus:ring-primary-400"
              />
            </div>
          </div>

          <div className="my-2 border-t border-warm-200" />

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-secondary-700">Estado</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as EventStatus)}
              className="rounded-[var(--radius-button)] border border-warm-200 bg-surface px-3 py-2 text-sm focus:border-primary-400 focus:outline-none focus:ring-1 focus:ring-primary-400"
            >
              {Object.values(EVENT_STATUSES).map((s) => (
                <option key={s} value={s}>{STATUS_LABELS[s]}</option>
              ))}
            </select>
          </div>

        </form>
      </div>

      {/* Footer / Submit Button */}
      <div className="border-t border-warm-200 bg-surface p-4">
        <button
          type="submit"
          form="event-form"
          disabled={isLoading}
          className="flex w-full items-center justify-center rounded-[var(--radius-button)] bg-primary-400 py-3 text-sm font-medium text-white shadow-sm transition-all hover:bg-primary-500 active:scale-95 disabled:opacity-50"
        >
          {isLoading ? 'A Guardar...' : 'Guardar Evento'}
        </button>
      </div>
    </div>
  )
}
