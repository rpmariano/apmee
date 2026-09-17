import { useState, useEffect } from 'react'
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

interface MobileCalendarProps {
  onEditEvent?: (event: Event) => void
  selectedDate?: Date
  onSelectDate?: (date: Date) => void
}

export function MobileCalendar({
  onEditEvent,
  selectedDate: externalSelectedDate,
  onSelectDate: externalOnSelectDate,
}: MobileCalendarProps) {
  const [internalSelectedDate, setInternalSelectedDate] = useState(new Date())
  const selectedDate = externalSelectedDate ?? internalSelectedDate
  const setSelectedDate = (d: Date) => {
    setInternalSelectedDate(d)
    externalOnSelectDate?.(d)
  }

  const [currentMonth, setCurrentMonth] = useState(selectedDate)

  // Keep month view synchronized when selectedDate is changed externally
  useEffect(() => {
    if (!isSameMonth(currentMonth, selectedDate)) {
      setCurrentMonth(startOfMonth(selectedDate))
    }
  }, [selectedDate])

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

        {/* Weekday headers */}
        <div className="mb-2 grid grid-cols-7 text-center">
          {['S', 'T', 'Q', 'Q', 'S', 'S', 'D'].map((dayName, index) => (
            <div key={index} className="text-xs font-semibold text-secondary-500">
              {dayName}
            </div>
          ))}
        </div>

        {/* Days grid */}
        <div className="grid grid-cols-7 gap-y-2">
          {days.map((dayItem, index) => {
            const isSelected = isSameDay(dayItem, selectedDate)
            const isCurrentMonth = isSameMonth(dayItem, currentMonth)
            const isCurrentDay = isToday(dayItem)
            const dateKey = format(dayItem, 'yyyy-MM-dd')
            const dayEvents = eventsByDay[dateKey] || []

            return (
              <div
                key={index}
                onClick={() => onDateClick(dayItem)}
                className={cn(
                  'flex flex-col items-center justify-center p-2 rounded-full cursor-pointer transition-all aspect-square relative',
                  isSelected && 'bg-primary-400 text-white font-bold',
                  !isSelected && isCurrentDay && 'border border-primary-400 font-semibold',
                  !isSelected && !isCurrentMonth && 'text-muted opacity-40',
                  !isSelected && isCurrentMonth && 'hover:bg-warm-50 text-foreground'
                )}
              >
                <span className="text-sm">{format(dayItem, 'd')}</span>

                {/* Event indicator dots */}
                {dayEvents.length > 0 && (
                  <div className="flex gap-0.5 mt-1 absolute bottom-1.5">
                    {dayEvents.slice(0, 3).map((event, dotIndex) => (
                      <span
                        key={dotIndex}
                        className={cn(
                          'h-1.5 w-1.5 rounded-full',
                          isSelected ? 'bg-white' : dotColors[event.status as EventStatus] || 'bg-secondary-400'
                        )}
                      />
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Events List for Selected Day */}
      <div className="flex flex-col gap-3">
        <h3 className="text-sm font-bold uppercase tracking-wider text-secondary-600">
          Eventos de {format(selectedDate, "d 'de' MMMM", { locale: pt })}
        </h3>

        {isLoading ? (
          <div className="flex flex-col gap-2">
            {[1, 2].map((n) => (
              <div key={n} className="h-24 w-full animate-pulse rounded-[var(--radius-card)] bg-warm-100" />
            ))}
          </div>
        ) : selectedEvents.length === 0 ? (
          <div className="rounded-[var(--radius-card)] border border-dashed border-warm-200 bg-surface/50 p-6 text-center">
            <p className="text-sm text-muted">Sem eventos marcados para este dia.</p>
          </div>
        ) : (
          selectedEvents.map((event) => (
            <EventCard key={event.id} event={event} onEdit={onEditEvent} />
          ))
        )}
      </div>
    </div>
  )
}
