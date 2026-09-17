import { useState, useEffect, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { format, isToday, isSameDay, parseISO } from 'date-fns'
import { pt } from 'date-fns/locale'
import { MobileCalendar } from '@/features/calendar/components/mobile-calendar'
import { EventList, type EventFilterType } from '@/features/events/components/event-list'
import { EventForm } from '@/features/events/components/event-form'
import { useEvents, useCreateEvent, useUpdateEvent } from '@/features/events/api/use-events'
import { useBoardMembers } from '@/features/board/api/use-board'
import { useAuth } from '@/providers/auth-provider'
import type { Event } from '@/types/database'
import { CustomDialog } from '@/components/ui/custom-dialog'
import { cn, getInitials } from '@/lib/utils'

export default function EventsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const editId = searchParams.get('edit')
  const isNew = searchParams.get('new') === 'true'
  const { data: events = [], isLoading } = useEvents()
  const { data: boardMembers = [] } = useBoardMembers()
  const { user } = useAuth()

  const [selectedDate, setSelectedDate] = useState(new Date())
  const [activeTab, setActiveTab] = useState<EventFilterType>('day')
  const [typeFilter, setTypeFilter] = useState<'all' | 'festa' | 'reuniao'>('all')
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingEvent, setEditingEvent] = useState<Event | undefined>()
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const createMutation = useCreateEvent()
  const updateMutation = useUpdateEvent()

  // Map user IDs to display names or emails
  const creatorMap = useMemo(() => {
    const map: Record<string, string> = {}
    boardMembers.forEach((member) => {
      if (member.id) {
        map[member.id] = member.display_name || member.email
      }
    })
    if (user?.id) {
      map[user.id] = user.displayName || user.email
    }
    return map
  }, [boardMembers, user])

  const userInitials = getInitials(user?.displayName || user?.email)

  // Sync with searchParams
  useEffect(() => {
    if (editId && events.length > 0) {
      const found = events.find((e) => e.id === editId)
      if (found) {
        setEditingEvent(found)
        if (found.start_date) {
          try {
            setSelectedDate(parseISO(found.start_date))
          } catch {
            // ignore parse error
          }
        }
        setIsFormOpen(true)
      }
    } else if (isNew) {
      setEditingEvent(undefined)
      setIsFormOpen(true)
    } else if (!editId && !isNew && isFormOpen) {
      setIsFormOpen(false)
      setEditingEvent(undefined)
    }
  }, [editId, isNew, events, isFormOpen])

  const handleEditEvent = (event: Event) => {
    setEditingEvent(event)
    if (event.start_date) {
      try {
        setSelectedDate(parseISO(event.start_date))
      } catch {
        // ignore parse error
      }
    }
    setIsFormOpen(true)
    setSearchParams({ edit: event.id })
  }

  const handleCreateEvent = () => {
    setEditingEvent(undefined)
    setIsFormOpen(true)
    setSearchParams({ new: 'true' })
  }

  const handleCloseForm = () => {
    setIsFormOpen(false)
    setEditingEvent(undefined)
    setSearchParams({})
  }

  const handleSelectDate = (date: Date) => {
    setSelectedDate(date)
    setActiveTab('day')
  }

  const handleSubmitForm = async (data: Partial<Event>) => {
    try {
      const current = editingEvent || (editId && events ? events.find((e) => e.id === editId) : undefined)
      const payload: Partial<Event> = {
        ...data,
        ...(!current
          ? {
              created_by: user?.id,
              created_by_name: user?.displayName || user?.email?.split('@')[0] || 'APMEE',
            }
          : {}),
      }

      try {
        if (current) {
          await updateMutation.mutateAsync({ id: current.id, ...payload })
        } else {
          await createMutation.mutateAsync(payload as any)
        }
      } catch (err: any) {
        // Defensive: if created_by_name column does not exist on remote table (code 42703)
        if (err?.message?.includes('created_by_name') || err?.code === '42703') {
          delete payload.created_by_name
          if (current) {
            await updateMutation.mutateAsync({ id: current.id, ...payload })
          } else {
            await createMutation.mutateAsync(payload as any)
          }
        } else {
          throw err
        }
      }

      if (data.start_date) {
        try {
          setSelectedDate(parseISO(data.start_date))
          setActiveTab('day')
        } catch {
          // ignore
        }
      }
      handleCloseForm()
    } catch (error: any) {
      console.error('Failed to save event:', error)
      setErrorMessage(error?.message || 'Erro ao guardar o evento. Tente novamente.')
    }
  }

  // Calculate dynamic counts for filter tabs & types
  const { dayCount, upcomingCount, pastCount, allCount, festaCount, reuniaoCount } = useMemo(() => {
    let dayC = 0
    let upC = 0
    let pastC = 0
    let fCount = 0
    let rCount = 0

    events.forEach((event) => {
      const eType = event.event_type || 'festa'
      if (eType === 'reuniao') {
        rCount++
      } else {
        fCount++
      }

      if (typeFilter === 'all' || eType === typeFilter) {
        try {
          if (isSameDay(parseISO(event.start_date), selectedDate)) {
            dayC++
          }
        } catch {
          // ignore
        }

        if (event.status === 'planned' || event.status === 'active') {
          upC++
        } else if (event.status === 'completed' || event.status === 'cancelled') {
          pastC++
        }
      }
    })

    const filteredTotal = typeFilter === 'all' ? events.length : typeFilter === 'reuniao' ? rCount : fCount

    return {
      dayCount: dayC,
      upcomingCount: upC,
      pastCount: pastC,
      allCount: filteredTotal,
      festaCount: fCount,
      reuniaoCount: rCount,
    }
  }, [events, selectedDate, typeFilter])

  const tabs: { value: EventFilterType; label: string; count: number }[] = [
    {
      value: 'day',
      label: isToday(selectedDate) ? 'Hoje' : format(selectedDate, "d 'de' MMM", { locale: pt }),
      count: dayCount,
    },
    { value: 'upcoming', label: 'Próximos', count: upcomingCount },
    { value: 'past', label: 'Terminados', count: pastCount },
    { value: 'all', label: 'Todos', count: allCount },
  ]

  const activeEvent = editingEvent || (editId && events ? events.find((e) => e.id === editId) : undefined)

  return (
    <div className="relative min-h-[calc(100vh-4rem)] bg-background pb-24">
      {/* Header - Sticky */}
      <div className="sticky top-0 z-10 bg-background/95 pb-2 pt-6 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="flex items-center justify-between px-4">
          <div className="flex items-center gap-2.5">
            <div
              className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-primary-500 bg-transparent text-primary-600 font-bold text-xs select-none"
              title={user?.displayName || user?.email || 'Agenda APMEE'}
            >
              {userInitials}
            </div>
            <h1 className="text-xl font-bold text-foreground">Agenda</h1>
          </div>
          <span className="text-xs font-medium text-secondary-500 capitalize">
            {format(selectedDate, "EEEE, d 'de' MMMM", { locale: pt })}
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-4 px-4 pt-2">
        {/* Interactive Calendar Card */}
        <MobileCalendar
          selectedDate={selectedDate}
          onSelectDate={handleSelectDate}
          events={events}
        />

        {/* Type Filter Selector (Todos / Festas / Reuniões) */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-hide">
          <button
            type="button"
            onClick={() => setTypeFilter('all')}
            className={cn(
              'rounded-full px-3 py-1 text-xs font-semibold transition-all active:scale-95',
              typeFilter === 'all'
                ? 'bg-secondary-800 text-white shadow-sm'
                : 'bg-warm-100 text-secondary-600 hover:bg-warm-200'
            )}
          >
            Todos ({events.length})
          </button>
          <button
            type="button"
            onClick={() => setTypeFilter('festa')}
            className={cn(
              'flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition-all active:scale-95',
              typeFilter === 'festa'
                ? 'bg-amber-700 text-white shadow-sm'
                : 'bg-amber-50 text-amber-900 border border-amber-200 hover:bg-amber-100'
            )}
          >
            <span>🎉</span>
            <span>Festas ({festaCount})</span>
          </button>
          <button
            type="button"
            onClick={() => setTypeFilter('reuniao')}
            className={cn(
              'flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition-all active:scale-95',
              typeFilter === 'reuniao'
                ? 'bg-blue-700 text-white shadow-sm'
                : 'bg-blue-50 text-blue-900 border border-blue-200 hover:bg-blue-100'
            )}
          >
            <span>📋</span>
            <span>Reuniões ({reuniaoCount})</span>
          </button>
        </div>

        {/* Filter Pills with Counters */}
        <div className="flex gap-2 overflow-x-auto pb-1 pt-0.5 scrollbar-hide">
          {tabs.map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => setActiveTab(tab.value)}
              className={cn(
                'flex items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all active:scale-95',
                activeTab === tab.value
                  ? 'bg-secondary-900 text-white shadow-sm'
                  : 'bg-warm-100 text-secondary-600 hover:bg-warm-200'
              )}
            >
              <span>{tab.label}</span>
              <span
                className={cn(
                  'rounded-full px-1.5 py-0.2 text-[10px] font-bold',
                  activeTab === tab.value
                    ? 'bg-white/20 text-white'
                    : 'bg-warm-200 text-secondary-700'
                )}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Section Heading */}
        <div className="flex items-center justify-between pt-1">
          <h2 className="text-xs font-bold uppercase tracking-wider text-secondary-600">
            {activeTab === 'day'
              ? isToday(selectedDate)
                ? typeFilter === 'reuniao'
                  ? 'Reuniões de Hoje'
                  : typeFilter === 'festa'
                  ? 'Festas de Hoje'
                  : 'Eventos de Hoje'
                : `${typeFilter === 'reuniao' ? 'Reuniões' : typeFilter === 'festa' ? 'Festas' : 'Eventos'} de ${format(selectedDate, "d 'de' MMMM", { locale: pt })}`
              : activeTab === 'upcoming'
              ? typeFilter === 'reuniao'
                ? 'Próximas Reuniões'
                : typeFilter === 'festa'
                ? 'Próximas Festas'
                : 'Próximos Eventos'
              : activeTab === 'past'
              ? typeFilter === 'reuniao'
                ? 'Reuniões Terminadas'
                : typeFilter === 'festa'
                ? 'Festas Terminadas'
                : 'Eventos Terminados'
              : typeFilter === 'reuniao'
              ? 'Todas as Reuniões'
              : typeFilter === 'festa'
              ? 'Todas as Festas'
              : 'Todos os Eventos'}
          </h2>
        </div>

        {/* Detail Cards */}
        <EventList
          filter={activeTab}
          typeFilter={typeFilter}
          selectedDate={selectedDate}
          events={events}
          isLoading={isLoading}
          creatorMap={creatorMap}
          onEditEvent={handleEditEvent}
          onCreateEvent={handleCreateEvent}
        />
      </div>

      {/* Floating Action Button (+) */}
      <button
        type="button"
        className="fixed bottom-24 right-6 flex h-14 w-14 items-center justify-center rounded-full bg-primary-400 text-white shadow-lg transition-transform hover:scale-105 hover:bg-primary-500 active:scale-95 z-20"
        onClick={handleCreateEvent}
        aria-label="Criar Evento"
      >
        <Plus className="h-6 w-6" />
      </button>

      {/* Form Modal */}
      {isFormOpen && (
        <EventForm
          event={activeEvent}
          initialDate={selectedDate}
          onClose={handleCloseForm}
          onSubmit={handleSubmitForm}
          isLoading={createMutation.isPending || updateMutation.isPending}
        />
      )}

      {/* Custom Error Dialog */}
      <CustomDialog
        isOpen={!!errorMessage}
        title="Erro ao guardar evento"
        description={errorMessage || ''}
        variant="danger"
        confirmLabel="OK"
        onConfirm={() => setErrorMessage(null)}
      />
    </div>
  )
}
