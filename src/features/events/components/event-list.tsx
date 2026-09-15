import { useEvents } from '../api/use-events'
import { EventCard } from './event-card'
import type { Event } from '@/types/database'

interface EventListProps {
  filter: 'upcoming' | 'past' | 'all'
  onEditEvent?: (event: Event) => void
}

export function EventList({ filter, onEditEvent }: EventListProps) {
  const { data: events, isLoading, error } = useEvents()

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4 py-8">
        {[1, 2].map((i) => (
          <div key={i} className="h-40 w-full animate-pulse rounded-[var(--radius-card)] bg-warm-100" />
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
    if (filter === 'all') return true
    
    // Consider events upcoming if they are planned, active, or their end date is in the future
    const isPastStatus = event.status === 'completed' || event.status === 'cancelled'
    const isUpcomingStatus = event.status === 'planned' || event.status === 'active'

    if (filter === 'upcoming') return isUpcomingStatus
    if (filter === 'past') return isPastStatus
    return true
  })

  if (filteredEvents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-warm-100">
          <svg className="h-8 w-8 text-secondary-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <p className="mt-4 text-sm font-medium text-foreground">Sem eventos</p>
        <p className="mt-1 text-xs text-muted">Não foram encontrados eventos para este filtro.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 py-4">
      {filteredEvents.map((event) => (
        <EventCard key={event.id} event={event} onEdit={onEditEvent} />
      ))}
    </div>
  )
}
