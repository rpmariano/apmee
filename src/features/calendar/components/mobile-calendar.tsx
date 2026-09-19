import { useState, useEffect, useRef, useMemo } from 'react'
import {
  format,
  addMonths,
  subMonths,
  addWeeks,
  subWeeks,
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
import { ChevronLeft, ChevronRight, ChevronDown, ChevronUp } from 'lucide-react'
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
  defaultExpanded?: boolean
  isExpanded?: boolean
  onToggleExpand?: (expanded: boolean) => void
}

export function MobileCalendar({
  selectedDate,
  onSelectDate,
  events: propEvents,
  className,
  defaultExpanded = false,
  isExpanded: controlledExpanded,
  onToggleExpand,
}: MobileCalendarProps) {
  // Collapsed in current week by default (user request)
  const [internalExpanded, setInternalExpanded] = useState(defaultExpanded)
  const isExpanded = controlledExpanded ?? internalExpanded

  const [currentDate, setCurrentDate] = useState<Date>(() => selectedDate || new Date())
  const [slideDirection, setSlideDirection] = useState<'left' | 'right' | null>(null)
  const lastSelectedDateRef = useRef<Date>(selectedDate)

  // Touch coordinates for swipe gestures
  const touchStartX = useRef<number | null>(null)
  const touchStartY = useRef<number | null>(null)

  // Sync currentDate when selectedDate changes externally
  useEffect(() => {
    if (!isSameDay(lastSelectedDateRef.current, selectedDate)) {
      lastSelectedDateRef.current = selectedDate
      setCurrentDate(selectedDate)
    }
  }, [selectedDate])

  const { data: queryEvents } = useEvents()
  const events = propEvents ?? queryEvents ?? []

  const handleNext = () => {
    setSlideDirection('right')
    if (isExpanded) {
      setCurrentDate((prev) => addMonths(prev, 1))
    } else {
      setCurrentDate((prev) => addWeeks(prev, 1))
    }
  }

  const handlePrev = () => {
    setSlideDirection('left')
    if (isExpanded) {
      setCurrentDate((prev) => subMonths(prev, 1))
    } else {
      setCurrentDate((prev) => subWeeks(prev, 1))
    }
  }

  const handleGoToToday = () => {
    const today = new Date()
    setCurrentDate(today)
    onSelectDate(today)
  }

  const handleToggleExpand = () => {
    const nextState = !isExpanded
    if (onToggleExpand) {
      onToggleExpand(nextState)
    } else {
      setInternalExpanded(nextState)
    }
  }

  // Swipe navigation handling
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      touchStartX.current = e.touches[0].clientX
      touchStartY.current = e.touches[0].clientY
    }
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return
    const touchEndX = e.changedTouches[0].clientX
    const touchEndY = e.changedTouches[0].clientY

    const deltaX = touchEndX - touchStartX.current
    const deltaY = touchEndY - touchStartY.current

    touchStartX.current = null
    touchStartY.current = null

    // Minimum distance threshold and horizontal axis dominance check
    const MIN_SWIPE_DISTANCE = 40
    if (Math.abs(deltaX) > MIN_SWIPE_DISTANCE && Math.abs(deltaX) > Math.abs(deltaY) * 1.25) {
      if (deltaX < 0) {
        // Swiped left -> navigate forward
        handleNext()
      } else {
        // Swiped right -> navigate backward
        handlePrev()
      }
    }
  }

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowRight') {
      e.preventDefault()
      handleNext()
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault()
      handlePrev()
    }
  }

  // Generate days based on mode: 7 days for week view, full grid for month view
  const days = useMemo(() => {
    if (isExpanded) {
      const monthStart = startOfMonth(currentDate)
      const monthEnd = endOfMonth(monthStart)
      const startDate = startOfWeek(monthStart, { weekStartsOn: 1 }) // Monday start
      const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 })
      return eachDayOfInterval({ start: startDate, end: endDate })
    }

    // Week view: 7 days of the active week containing currentDate
    const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 })
    const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 })
    return eachDayOfInterval({ start: weekStart, end: weekEnd })
  }, [currentDate, isExpanded])

  // Group events by day to render dots efficiently
  const eventsByDay = useMemo(() => {
    return events.reduce((acc, event) => {
      try {
        const dateStr = format(parseISO(event.start_date), 'yyyy-MM-dd')
        if (!acc[dateStr]) acc[dateStr] = []
        acc[dateStr].push(event)
      } catch {
        // ignore invalid dates
      }
      return acc
    }, {} as Record<string, Event[]>)
  }, [events])

  // Header Title
  const headerTitle = useMemo(() => {
    if (isExpanded) {
      return format(currentDate, 'MMMM yyyy', { locale: pt })
    }
    const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 })
    const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 })
    if (isSameMonth(weekStart, weekEnd)) {
      return format(weekStart, 'MMMM yyyy', { locale: pt })
    }
    // Week spans across two months (e.g. Set. / Out. 2026)
    return `${format(weekStart, 'MMM', { locale: pt })} / ${format(weekEnd, 'MMMM yyyy', { locale: pt })}`
  }, [currentDate, isExpanded])

  const formattedHeaderTitle =
    headerTitle.charAt(0).toUpperCase() + headerTitle.slice(1)

  // Transition key for animated slide
  const gridAnimationKey = isExpanded
    ? format(currentDate, 'yyyy-MM')
    : format(startOfWeek(currentDate, { weekStartsOn: 1 }), 'yyyy-MM-dd')

  return (
    <div
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className={cn(
        'select-none touch-pan-y rounded-[var(--radius-card)] border border-warm-200 bg-surface p-4 shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-primary-400 transition-all',
        className
      )}
    >
      {/* Month/Week navigation header */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2 min-w-0">
          <h2 className="text-base font-bold text-foreground truncate">
            {formattedHeaderTitle}
          </h2>
          <span className="rounded-md bg-warm-100 px-1.5 py-0.5 text-xs font-semibold text-secondary-600 shrink-0">
            {isExpanded ? 'Mês' : 'Semana'}
          </span>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={handleGoToToday}
            className="rounded-full px-2.5 py-1 text-xs font-semibold text-primary-600 transition-colors hover:bg-primary-50 active:scale-95"
          >
            Hoje
          </button>
          <button
            type="button"
            onClick={handlePrev}
            className="rounded-full p-2 text-secondary-600 transition-colors hover:bg-warm-100 active:scale-95"
            aria-label={isExpanded ? 'Mês anterior' : 'Semana anterior'}
            title={isExpanded ? 'Mês anterior' : 'Semana anterior'}
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={handleNext}
            className="rounded-full p-2 text-secondary-600 transition-colors hover:bg-warm-100 active:scale-95"
            aria-label={isExpanded ? 'Próximo mês' : 'Próxima semana'}
            title={isExpanded ? 'Próximo mês' : 'Próxima semana'}
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

      {/* Days grid with swipe animation */}
      <div
        key={gridAnimationKey}
        className={cn(
          'grid grid-cols-7 gap-y-2 animate-in fade-in duration-150 ease-out',
          slideDirection === 'right' && 'slide-in-from-right-3',
          slideDirection === 'left' && 'slide-in-from-left-3'
        )}
      >
        {days.map((dayItem, index) => {
          const isSelected = isSameDay(dayItem, selectedDate)
          const isCurrentMonth = isSameMonth(dayItem, currentDate)
          const isCurrentDay = isToday(dayItem)
          const dateKey = format(dayItem, 'yyyy-MM-dd')
          const dayEvents = eventsByDay[dateKey] || []

          return (
            <div
              key={index}
              role="button"
              tabIndex={0}
              aria-label={`${format(dayItem, "EEEE, d 'de' MMMM", { locale: pt })}${dayEvents.length > 0 ? `, ${dayEvents.length} evento(s)` : ''}`}
              onClick={() => {
                onSelectDate(dayItem)
                setCurrentDate(dayItem)
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  onSelectDate(dayItem)
                  setCurrentDate(dayItem)
                }
              }}
              className={cn(
                'relative flex flex-col items-center justify-center p-2 rounded-full cursor-pointer transition-all aspect-square outline-none focus-visible:ring-2 focus-visible:ring-primary-400',
                isSelected && 'bg-primary-500 text-white font-bold shadow-xs',
                !isSelected && isCurrentDay && 'border border-primary-500 font-semibold text-primary-600',
                !isSelected && !isCurrentMonth && isExpanded && 'text-muted opacity-40',
                !isSelected && (isCurrentMonth || !isExpanded) && !isCurrentDay && 'hover:bg-warm-50 text-foreground'
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

      {/* Expand / Collapse Toggle Control */}
      <button
        type="button"
        onClick={handleToggleExpand}
        aria-label={isExpanded ? 'Recolher para semana atual' : 'Expandir para ver o mês todo'}
        className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg py-1 text-xs font-semibold text-secondary-600 hover:text-foreground hover:bg-warm-50 transition-colors active:scale-95"
      >
        <span>{isExpanded ? 'Recolher para semana' : 'Expandir mês completo'}</span>
        {isExpanded ? (
          <ChevronUp className="h-3.5 w-3.5 text-secondary-500" />
        ) : (
          <ChevronDown className="h-3.5 w-3.5 text-secondary-500" />
        )}
      </button>

      {/* Mini Legend for Event Types */}
      <div className="mt-2 flex items-center justify-center gap-5 border-t border-warm-100 pt-2 text-xs font-medium text-secondary-600">
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
