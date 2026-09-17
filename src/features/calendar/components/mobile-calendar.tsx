import { useState, useEffect, useRef, useMemo } from 'react'
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  parseISO,
  isToday,
} from 'date-fns'
import { pt } from 'date-fns/locale'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useEvents } from '@/features/events/api/use-events'
import { cn } from '@/lib/utils'
import type { Event, EventType } from '@/types/database'
import { EVENT_TYPES } from '@/lib/constants'

// Color map for event dots by event type
const eventTypeDotColors: Record<EventType, string> = {
  [EVENT_TYPES.FESTA]: 'bg-amber-500',
  [EVENT_TYPES.REUNIAO]: 'bg-blue-600',
}

interface MobileCalendarProps {
  selectedDate: Date
  onSelectDate: (date: Date) => void
  events?: Event[]
  className?: string
}

export function MobileCalendar({
  selectedDate,
  onSelectDate,
  events: propEvents,
  className,
}: MobileCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState<Date>(() => startOfMonth(selectedDate))
  const lastSelectedDateRef = useRef<Date>(selectedDate)

  // Keep month view synchronized ONLY when selectedDate actually changes externally
  useEffect(() => {
    if (!isSameDay(lastSelectedDateRef.current, selectedDate)) {
      lastSelectedDateRef.current = selectedDate
      if (!isSameMonth(currentMonth, selectedDate)) {
        setCurrentMonth(startOfMonth(selectedDate))
      }
    }
  }, [selectedDate, currentMonth])

  const { data: queryEvents } = useEvents()
  const events = propEvents ?? queryEvents ?? []

  const nextMonth = () => setCurrentMonth((prev) => addMonths(prev, 1))
  const prevMonth = () => setCurrentMonth((prev) => subMonths(prev, 1))
  const goToToday = () => {
    const today = new Date()
    setCurrentMonth(startOfMonth(today))
    onSelectDate(today)
  }

  // Generate days for the grid safely
  const days = useMemo(() => {
    const monthStart = startOfMonth(currentMonth)
    const monthEnd = endOfMonth(monthStart)
    const startDate = startOfWeek(monthStart, { weekStartsOn: 1 }) // Start on Monday
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 })
    return eachDayOfInterval({ start: startDate, end: endDate })
  }, [currentMonth])

  // Group events by day to render dots efficiently
  const eventsByDay = events.reduce((acc, event) => {
    try {
      const dateStr = format(parseISO(event.start_date), 'yyyy-MM-dd')
      if (!acc[dateStr]) acc[dateStr] = []
      acc[dateStr].push(event)
    } catch {
      // ignore invalid dates
    }
    return acc
  }, {} as Record<string, Event[]>)

  return (
    <div className={cn("rounded-[var(--radius-card)] border border-warm-200 bg-surface p-4 shadow-sm", className)}>
      {/* Month navigation header */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-bold capitalize text-foreground">
          {format(currentMonth, 'MMMM yyyy', { locale: pt })}
        </h2>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={goToToday}
            className="rounded-full px-2.5 py-1 text-xs font-semibold text-primary-600 transition-colors hover:bg-primary-50 active:scale-95"
          >
            Hoje
          </button>
          <button
            type="button"
            onClick={prevMonth}
            className="rounded-full p-2 text-secondary-600 transition-colors hover:bg-warm-100 active:scale-95"
            aria-label="Mês anterior"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={nextMonth}
            className="rounded-full p-2 text-secondary-600 transition-colors hover:bg-warm-100 active:scale-95"
            aria-label="Próximo mês"
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
              onClick={() => onSelectDate(dayItem)}
              className={cn(
                'flex flex-col items-center justify-center p-2 rounded-full cursor-pointer transition-all aspect-square relative',
                isSelected && 'bg-primary-400 text-white font-bold shadow-sm',
                !isSelected && isCurrentDay && 'border border-primary-400 font-semibold text-primary-600',
                !isSelected && !isCurrentMonth && 'text-muted opacity-40',
                !isSelected && isCurrentMonth && !isCurrentDay && 'hover:bg-warm-50 text-foreground'
              )}
            >
              <span className="text-sm leading-none">{format(dayItem, 'd')}</span>

              {/* Event indicator dots */}
              {dayEvents.length > 0 && (
                <div className="flex gap-0.5 mt-1 absolute bottom-1.5">
                  {dayEvents.slice(0, 3).map((event, dotIndex) => {
                    const eType = event.event_type || EVENT_TYPES.FESTA
                    const dotClass = eventTypeDotColors[eType] || 'bg-amber-500'
                    return (
                      <span
                        key={dotIndex}
                        className={cn(
                          'h-1.5 w-1.5 rounded-full',
                          isSelected ? 'bg-white' : dotClass
                        )}
                      />
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Mini Legend for Event Types */}
      <div className="mt-3 flex items-center justify-center gap-5 border-t border-warm-100 pt-2.5 text-[11px] font-medium text-secondary-600">
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-amber-500" />
          <span>Festas</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-blue-600" />
          <span>Reuniões</span>
        </div>
      </div>
    </div>
  )
}
