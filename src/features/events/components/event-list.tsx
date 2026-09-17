import { isSameDay, parseISO, compareAsc, compareDesc } from 'date-fns'
import { Plus } from 'lucide-react'
import { useEvents } from '../api/use-events'
import { EventCard } from './event-card'
import type { Event } from '@/types/database'

export type EventFilterType = 'day' | 'upcoming' | 'past' | 'all'

interface EventListProps {
  filter: EventFilterType
  typeFilter?: 'all' | 'festa' | 'reuniao'
  selectedDate?: Date
  events?: Event[]
  isLoading?: boolean
  error?: unknown
  creatorMap?: Record<string, string>
  onEditEvent?: (event: Event) => void
  onCreateEvent?: () => void
}

export function EventList({
  filter,
  typeFilter = 'all',
  selectedDate = new Date(),
  events: propEvents,
  isLoading: propIsLoading,
  error: propError,
  creatorMap,
  onEditEvent,
  onCreateEvent,
}: EventListProps) {
  const { data: queryEvents, isLoading: queryLoading, error: queryError } = useEvents()

  const events = propEvents ?? queryEvents
  const isLoading = propIsLoading ?? queryLoading
  const error = propError ?? queryError

  if (isLoading) {
    return (
      <div className="flex flex-col gap-3 py-4">
        {[1, 2].map((i) => (
          <div key={i} className="h-32 w-full animate-pulse rounded-[var(--radius-card)] bg-warm-100" />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="py-8 text-center text-sm text-red-500">
        Ocorreu um erro ao carregar os eventos.
      </div>
    )
  }

  // Filter logic
  const filteredEvents = (events || []).filter((event) => {
    // Type filter
    if (typeFilter && typeFilter !== 'all') {
      const eType = event.event_type || 'festa'
      if (eType !== typeFilter) return false
    }

    if (filter === 'all') return true

    if (filter === 'day') {
      try {
        return isSameDay(parseISO(event.start_date), selectedDate)
      } catch {
        return false
      }
    }

    const isPastStatus = event.status === 'completed' || event.status === 'cancelled'
    const isUpcomingStatus = event.status === 'planned' || event.status === 'active'

    if (filter === 'upcoming') return isUpcomingStatus
    if (filter === 'past') return isPastStatus
    return true
  })

  // Sort events
  filteredEvents.sort((a, b) => {
    try {
      const dateA = parseISO(a.start_date)
      const dateB = parseISO(b.start_date)
      if (filter === 'past' || filter === 'all') {
        return compareDesc(dateA, dateB)
      }
      return compareAsc(dateA, dateB)
    } catch {
      return 0
    }
  })

  if (filteredEvents.length === 0) {
    const typeLabel = typeFilter === 'reuniao' ? 'reuniões' : typeFilter === 'festa' ? 'festas' : 'eventos'

    return (
      <div className="flex flex-col items-center justify-center rounded-[var(--radius-card)] border border-dashed border-warm-200 bg-surface/50 py-10 px-4 text-center my-2">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-warm-100">
          <svg className="h-6 w-6 text-secondary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <p className="mt-3 text-sm font-medium text-foreground">
          {filter === 'day'
            ? `Sem ${typeLabel} para este dia`
            : filter === 'upcoming'
            ? `Sem ${typeLabel} futuras`
            : filter === 'past'
            ? `Sem ${typeLabel} terminadas`
            : `Nenhum registo de ${typeLabel} encontrado`}
        </p>
        <p className="mt-1 text-xs text-muted">
          {filter === 'day'
            ? 'Pode agendar um novo evento ou reunião diretamente para esta data.'
            : 'Não existem itens registados nesta categoria.'}
        </p>
        {onCreateEvent && (
          <button
            type="button"
            onClick={onCreateEvent}
            className="mt-4 flex items-center gap-1.5 rounded-full bg-primary-50 px-4 py-2 text-xs font-semibold text-primary-700 hover:bg-primary-100 active:scale-95 transition-all"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>{typeFilter === 'reuniao' ? 'Agendar Reunião' : 'Agendar Evento'}</span>
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3 py-2">
      {filteredEvents.map((event) => {
        const creator =
          event.created_by_name ||
          (event.created_by ? creatorMap?.[event.created_by] : undefined)
        return (
          <EventCard
            key={event.id}
            event={event}
            creatorName={creator}
            onEdit={onEditEvent}
          />
        )
      })}
    </div>
  )
}
