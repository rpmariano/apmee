import { useState } from 'react'
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  isSameMonth,
  isSameDay,
  addDays,
  parseISO,
  isToday,
} from 'date-fns'
import { pt } from 'date-fns/locale'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useEvents } from '@/features/events/api/use-events'
import { EventCard } from '@/features/events/components/event-card'
import { cn } from '@/lib/utils'
import type { EventStatus, Event } from '@/types/database'
import { EVENT_STATUSES } from '@/lib/constants'

// Color map for event dots
const dotColors: Record<EventStatus, string> = {
  [EVENT_STATUSES.PLANNED]: 'bg-warm-400',
  [EVENT_STATUSES.ACTIVE]: 'bg-primary-500',
  [EVENT_STATUSES.COMPLETED]: 'bg-[#2E7D32]',
  [EVENT_STATUSES.CANCELLED]: 'bg-red-500',
}

export function MobileCalendar() {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(new Date())
  const { data: events, isLoading } = useEvents()

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1))
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1))
  const onDateClick = (day: Date) => setSelectedDate(day)

  // Generate days for the grid
  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(monthStart)
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 }) // Start on Monday
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 })

  const days = []
  let day = startDate
  while (day <= endDate) {
    days.push(day)
    day = addDays(day, 1)
  }

  // Filter events for the selected day
  const selectedEvents = (events || []).filter((event) => {
    const eventDate = parseISO(event.start_date)
    return isSameDay(eventDate, selectedDate)
  })

  // Group events by day to render dots efficiently
  const eventsByDay = (events || []).reduce((acc, event) => {
    const dateStr = format(parseISO(event.start_date), 'yyyy-MM-dd')
    if (!acc[dateStr]) acc[dateStr] = []
    acc[dateStr].push(event)
    return acc
  }, {} as Record<string, Event[]>)

  return (
    <div className="flex flex-col gap-6">
      {/* Calendar Card */}
      <div className="rounded-[var(--radius-card)] border border-warm-200 bg-surface p-4 shadow-sm">
        
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold capitalize text-foreground">
            {format(currentMonth, 'MMMM yyyy', { locale: pt })}
          </h2>
          <div className="flex gap-2">
            <button
              onClick={prevMonth}
              className="rounded-full p-2 text-secondary-600 transition-colors hover:bg-warm-100 active:scale-95"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={nextMonth}
              className="rounded-full p-2 text-secondary-600 transition-colors hover:bg-warm-100 active:scale-95"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Days of week */}
        <div className="grid grid-cols-7 gap-1 text-center mb-2">
          {['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'].map((d) => (
            <div key={d} className="text-[10px] font-bold uppercase tracking-wider text-muted">
              {d}
            </div>
          ))}
        </div>

        {/* Days Grid */}
        <div className="grid grid-cols-7 gap-1">
          {days.map((dayItem, i) => {
            const dateStr = format(dayItem, 'yyyy-MM-dd')
            const dayEvents = eventsByDay[dateStr] || []
            const isSelected = isSameDay(dayItem, selectedDate)
            const isCurrentMonth = isSameMonth(dayItem, currentMonth)
            const isTodayDate = isToday(dayItem)

            return (
              <button
                key={i}
                onClick={() => onDateClick(dayItem)}
                className={cn(
                  'relative flex h-10 w-full flex-col items-center justify-center rounded-lg text-sm transition-all active:scale-90',
                  !isCurrentMonth && 'text-muted opacity-40',
                  isSelected && 'bg-primary-500 font-bold text-white shadow-sm',
                  !isSelected && isTodayDate && 'bg-warm-100 font-bold text-primary-700',
                  !isSelected && !isTodayDate && 'hover:bg-warm-50 text-foreground'
                )}
              >
                <span>{format(dayItem, 'd')}</span>
                
                {/* Event dots container */}
                {dayEvents.length > 0 && (
                  <div className="absolute bottom-1 flex gap-0.5">
                    {dayEvents.slice(0, 3).map((e, idx) => (
                      <span
                        key={idx}
                        className={cn(
                          'h-1 w-1 rounded-full',
                          isSelected ? 'bg-white' : dotColors[e.status]
                        )}
                      />
                    ))}
                  </div>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Selected Day Events List */}
      <div>
        <h3 className="mb-3 text-sm font-semibold text-secondary-700">
          Eventos de {format(selectedDate, "d 'de' MMMM", { locale: pt })}
        </h3>
        
        {isLoading ? (
          <div className="h-32 w-full animate-pulse rounded-[var(--radius-card)] bg-warm-100" />
        ) : selectedEvents.length > 0 ? (
          <div className="flex flex-col gap-3">
            {selectedEvents.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        ) : (
          <div className="rounded-[var(--radius-card)] border border-dashed border-warm-200 p-6 text-center text-sm text-muted">
            Sem eventos marcados para este dia.
          </div>
        )}
      </div>
    </div>
  )
}
