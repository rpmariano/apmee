import { useState, useEffect, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Plus, SlidersHorizontal, X, RotateCcw } from 'lucide-react'
import { format, isToday, isSameDay, parseISO } from 'date-fns'
import { pt } from 'date-fns/locale'
import { MobileCalendar } from '@/features/calendar/components/mobile-calendar'
import { EventList, type EventFilterType } from '@/features/events/components/event-list'
import { EventForm } from '@/features/events/components/event-form'
import { useEvents, useCreateEvent, useUpdateEvent, useDeleteEvent } from '@/features/events/api/use-events'
import { useMovements } from '@/features/treasury/api/use-treasury'
import type { EventFinanceSummary } from '@/features/events/components/event-card'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useBoardMembers } from '@/features/board/api/use-board'
import { useAuth } from '@/providers/auth-provider'
import { usePermissions } from '@/hooks/use-permissions'
import type { Event } from '@/types/database'
import { CustomDialog } from '@/components/ui/custom-dialog'
import { useToast } from '@/components/ui/toast'
import { getFriendlyErrorMessage } from '@/lib/error-utils'
import { MenuAlerts } from '@/components/ui/menu-alerts'
import { cn, getInitials } from '@/lib/utils'

export default function EventsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const editId = searchParams.get('edit')
  const isNew = searchParams.get('new') === 'true'
  const { data: events = [], isLoading } = useEvents()
  const { data: boardMembers = [] } = useBoardMembers()
  const { user } = useAuth()
  const queryClient = useQueryClient()

  const [selectedDate, setSelectedDate] = useState(new Date())
  const [activeTab, setActiveTab] = useState<EventFilterType>('day')
  const [typeFilter, setTypeFilter] = useState<'all' | 'festa' | 'reuniao'>('all')
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingEvent, setEditingEvent] = useState<Event | undefined>()
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const { data: movements = [] } = useMovements()
  const createMutation = useCreateEvent()
  const updateMutation = useUpdateEvent()
  const deleteMutation = useDeleteEvent()
  const { toast } = useToast()
  const { canWrite } = usePermissions()
  const canWriteEvents = canWrite('events')

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

  // Map finances by event_id for instantaneous badges
  const eventFinancesMap = useMemo(() => {
    const map: Record<string, EventFinanceSummary> = {}
    movements.forEach((m) => {
      if (m.event_id) {
        if (!map[m.event_id]) {
          map[m.event_id] = { income: 0, expense: 0, balance: 0, count: 0 }
        }
        map[m.event_id].count++
        const val = Number(m.amount) || 0
        if (m.type === 'income') {
          map[m.event_id].income += val
          map[m.event_id].balance += val
        } else {
          map[m.event_id].expense += val
          map[m.event_id].balance -= val
        }
      }
    })
    return map
  }, [movements])

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

      // New columns that might not exist yet if remote database migrations haven't run
      const newColumns = [
        'documents',
        'minutes',
        'objectives',
        'meeting_type',
        'event_type',
        'created_by_name',
      ]

      let attemptPayload = { ...payload }
      let saved = false
      let lastErr: any = null

      for (let attempt = 0; attempt <= newColumns.length; attempt++) {
        try {
          if (current) {
            await updateMutation.mutateAsync({ id: current.id, ...attemptPayload })
          } else {
            await createMutation.mutateAsync(attemptPayload as any)
          }
          saved = true
          break
        } catch (err: any) {
          lastErr = err
          const errMsg = err?.message || ''

          // Check if error is about missing column in schema cache or relation
          // Examples:
          // "Could not find the 'documents' column of 'events' in the schema cache"
          // "column "documents" of relation "events" does not exist"
          const match =
            errMsg.match(/Could not find the '([^']+)' column/) ||
            errMsg.match(/column "([^"]+)" of relation "events" does not exist/)

          if (match && match[1] && match[1] in attemptPayload) {
            delete (attemptPayload as any)[match[1]]
            continue
          }

          // Fallback: check if any of the new columns is mentioned in errMsg
          const foundCol = newColumns.find(
            (col) => errMsg.includes(col) && col in attemptPayload
          )
          if (foundCol) {
            delete (attemptPayload as any)[foundCol]
            continue
          }

          // If code 42703 (undefined_column) or PGRST204 without column match
          if ((err?.code === '42703' || err?.code === 'PGRST204') && attempt === 0) {
            newColumns.forEach((col) => delete (attemptPayload as any)[col])
            continue
          }

          throw err
        }
      }

      if (!saved && lastErr) {
        throw lastErr
      }

      // If event marked as completed, deduct consumables and food stock (Equipamento stays in inventory without deduction)
      if (data.status === 'completed' && current && current.status !== 'completed') {
        try {
          const { data: reqs } = await (supabase as any)
            .from('event_inventory')
            .select('*, item:inventory_items(*)')
            .eq('event_id', current.id)

          if (reqs && reqs.length > 0) {
            for (const req of reqs) {
              const item = req.item
              if (!item) continue
              const cat = item.category
              // Regra de negócio: Equipamento NÃO tem baixa, apenas consumíveis e alimentos
              if (cat === 'consumivel' || cat === 'alimento') {
                const usedQty = Number(req.quantity) || 0
                const currentQty = Number(item.quantity) || 0
                const newQty = Math.max(0, currentQty - usedQty)

                await (supabase as any)
                  .from('inventory_items')
                  .update({ quantity: newQty })
                  .eq('id', item.id)

                await (supabase as any)
                  .from('inventory_transactions')
                  .insert({
                    item_id: item.id,
                    type: 'out',
                    quantity: usedQty,
                    event_id: current.id,
                    notes: `Baixa por conclusão do evento: ${current.title}`,
                  })
              }
            }
            queryClient.invalidateQueries({ queryKey: ['inventory'] })
            queryClient.invalidateQueries({ queryKey: ['inventory-transactions'] })
            queryClient.invalidateQueries({ queryKey: ['captive-stock'] })
          }
        } catch (invErr) {
          console.warn('Erro ao processar baixa de stock do evento:', invErr)
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
      toast.success(current ? 'Evento atualizado com sucesso!' : 'Evento criado com sucesso!')
      handleCloseForm()
    } catch (error: any) {
      console.error('Failed to save event:', error)
      setErrorMessage(getFriendlyErrorMessage(error, 'Erro ao guardar o evento. Tente novamente.'))
    }
  }

  const handleDeleteEvent = async (id: string) => {
    try {
      await deleteMutation.mutateAsync(id)
      toast.success('Evento eliminado com sucesso!')
      handleCloseForm()
    } catch (error: any) {
      console.error('Failed to delete event:', error)
      setErrorMessage(getFriendlyErrorMessage(error, 'Erro ao eliminar o evento. Tente novamente.'))
    }
  }

  // Calculate dynamic counts for filter tabs & types
  const { dayCount, upcomingCount, pastCount, allCount, festaCount, reuniaoCount, filteredTotal } = useMemo(() => {
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
      filteredTotal,
    }
  }, [events, selectedDate, typeFilter])

  const activeTabCount =
    activeTab === 'day'
      ? dayCount
      : activeTab === 'upcoming'
      ? upcomingCount
      : activeTab === 'past'
      ? pastCount
      : allCount

  const isFilterActive = activeTab !== 'day' || typeFilter !== 'all'

  const handleResetFilter = () => {
    setActiveTab('day')
    setTypeFilter('all')
    setSelectedDate(new Date())
  }

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
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-medium text-secondary-500 capitalize">
              {format(selectedDate, "EEEE, d 'de' MMMM", { locale: pt })}
            </span>
            <MenuAlerts />
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4 px-4 pt-2">
        {/* Interactive Calendar Card */}
        <MobileCalendar
          selectedDate={selectedDate}
          onSelectDate={handleSelectDate}
          events={events}
        />

        {/* Clean Section Header & Filter Trigger */}
        <div className="flex items-center justify-between pt-1">
          <div>
            <h2 className="text-sm font-bold text-foreground">
              {activeTab === 'day'
                ? isToday(selectedDate)
                  ? 'Hoje'
                  : format(selectedDate, "d 'de' MMMM", { locale: pt })
                : activeTab === 'upcoming'
                ? 'Próximos Eventos'
                : activeTab === 'past'
                ? 'Eventos Terminados'
                : 'Todos os Eventos'}
            </h2>
            <p className="text-xs text-muted">
              {typeFilter === 'all'
                ? `${activeTabCount} evento(s)`
                : typeFilter === 'festa'
                ? `${activeTabCount} festa(s)`
                : `${activeTabCount} reunião(ões)`}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {!isToday(selectedDate) && activeTab === 'day' && (
              <button
                type="button"
                onClick={() => {
                  setSelectedDate(new Date())
                  setActiveTab('day')
                }}
                className="rounded-full bg-warm-100 px-2.5 py-1 text-xs font-semibold text-secondary-700 hover:bg-warm-200 transition-colors active:scale-95"
              >
                Voltar a Hoje
              </button>
            )}

            {/* Filter Menu Trigger */}
            <button
              type="button"
              onClick={() => setIsFilterOpen(true)}
              aria-label="Abrir filtros da agenda"
              className={cn(
                "relative flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-all active:scale-95",
                isFilterActive
                  ? "border-primary-500 bg-primary-50 text-primary-700 shadow-xs"
                  : "border-warm-200 bg-surface text-secondary-600 hover:bg-warm-50 shadow-xs"
              )}
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              <span>Filtros</span>
              {isFilterActive && (
                <span className="flex h-2 w-2 rounded-full bg-primary-500 ring-2 ring-white" />
              )}
            </button>
          </div>
        </div>

        {/* Active Filter Chips (if non-standard view) */}
        {isFilterActive && (
          <div className="flex flex-wrap items-center gap-1.5">
            {activeTab !== 'day' && (
              <span className="inline-flex items-center gap-1 rounded-full bg-secondary-100 px-2.5 py-0.5 text-xs font-semibold text-secondary-800">
                <span>
                  {activeTab === 'upcoming'
                    ? 'Próximos'
                    : activeTab === 'past'
                    ? 'Terminados'
                    : 'Todos os Dias'}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('day')
                    setSelectedDate(new Date())
                  }}
                  aria-label="Remover filtro de data"
                  className="rounded-full p-0.5 hover:bg-secondary-200"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}

            {typeFilter !== 'all' && (
              <span className="inline-flex items-center gap-1 rounded-full bg-secondary-100 px-2.5 py-0.5 text-xs font-semibold text-secondary-800">
                <span>{typeFilter === 'festa' ? 'Festas 🎉' : 'Reuniões 📋'}</span>
                <button
                  type="button"
                  onClick={() => setTypeFilter('all')}
                  aria-label="Remover filtro de tipo"
                  className="rounded-full p-0.5 hover:bg-secondary-200"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}

            <button
              type="button"
              onClick={handleResetFilter}
              className="text-xs text-primary-600 font-semibold hover:underline px-1"
            >
              Limpar tudo
            </button>
          </div>
        )}

        {/* Detail Cards */}
        <EventList
          filter={activeTab}
          typeFilter={typeFilter}
          selectedDate={selectedDate}
          events={events}
          isLoading={isLoading}
          creatorMap={creatorMap}
          financesMap={eventFinancesMap}
          onEditEvent={handleEditEvent}
          onCreateEvent={handleCreateEvent}
        />
      </div>

      {/* Floating Action Button (+) */}
      <button
        type="button"
        aria-label="Criar novo evento ou reunião"
        className="fixed bottom-24 right-6 min-[430px]:right-[calc(50%-215px+1.5rem)] z-20 flex h-14 w-14 items-center justify-center rounded-full bg-primary-400 text-white shadow-lg transition-transform hover:scale-105 hover:bg-primary-500 active:scale-95"
        onClick={handleCreateEvent}
      >
        <Plus className="h-6 w-6" />
      </button>

      {/* Dedicated Filter Menu Sheet */}
      {isFilterOpen && (
        <div className="fixed inset-0 z-[100] flex justify-center bg-black/40 backdrop-blur-xs transition-opacity animate-in fade-in duration-200">
          <div className="flex w-full max-w-[430px] flex-col justify-end">
            <div className="flex max-h-[85vh] flex-col rounded-t-3xl bg-surface shadow-2xl animate-in slide-in-from-bottom-6 duration-200 ease-out border-t border-warm-200">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-warm-200 px-5 py-4">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="h-5 w-5 text-primary-500" />
                  <h3 className="text-base font-bold text-foreground">Filtros da Agenda</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsFilterOpen(false)}
                  aria-label="Fechar menu de filtros"
                  className="rounded-full p-1.5 text-muted hover:bg-warm-100 active:scale-95 transition-all"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Body */}
              <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-5">
                {/* Section: Período */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-secondary-500 mb-2.5">
                    Período / Data
                  </h4>
                  <div className="grid grid-cols-1 gap-2">
                    {[
                      {
                        value: 'day',
                        label: isToday(selectedDate) ? 'Hoje' : `Dia Selecionado (${format(selectedDate, "d 'de' MMM", { locale: pt })})`,
                        desc: isToday(selectedDate) ? 'Apresenta a agenda do dia de hoje (predefinição)' : `Apresenta os eventos de ${format(selectedDate, "d 'de' MMMM", { locale: pt })}`,
                        count: dayCount,
                      },
                      {
                        value: 'upcoming',
                        label: 'Próximos Eventos',
                        desc: 'Eventos futuros a partir de hoje',
                        count: upcomingCount,
                      },
                      {
                        value: 'past',
                        label: 'Eventos Terminados',
                        desc: 'Histórico de celebrações e reuniões já realizadas',
                        count: pastCount,
                      },
                      {
                        value: 'all',
                        label: 'Todos os Eventos',
                        desc: 'Visão integral de todo o ano letivo',
                        count: allCount,
                      },
                    ].map((opt) => {
                      const isSelected = activeTab === opt.value
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => {
                            setActiveTab(opt.value as EventFilterType)
                            if (opt.value === 'day' && !isToday(selectedDate)) {
                              setSelectedDate(new Date())
                            }
                          }}
                          className={cn(
                            "flex items-center justify-between rounded-xl border p-3 text-left transition-all active:scale-[0.99]",
                            isSelected
                              ? "border-primary-500 bg-primary-50/50 shadow-xs"
                              : "border-warm-200 bg-surface hover:bg-warm-50"
                          )}
                        >
                          <div>
                            <p className={cn("text-sm font-semibold", isSelected ? "text-primary-800" : "text-foreground")}>
                              {opt.label}
                            </p>
                            <p className="text-xs text-muted">{opt.desc}</p>
                          </div>
                          <span className={cn(
                            "rounded-full px-2 py-0.5 text-xs font-bold shrink-0",
                            isSelected ? "bg-primary-500 text-white" : "bg-warm-100 text-secondary-600"
                          )}>
                            {opt.count}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Section: Tipo de Evento */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-secondary-500 mb-2.5">
                    Tipo de Evento
                  </h4>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { value: 'all', label: 'Todos', count: events.length },
                      { value: 'festa', label: '🎉 Festas', count: festaCount },
                      { value: 'reuniao', label: '📋 Reuniões', count: reuniaoCount },
                    ].map((t) => {
                      const isSelected = typeFilter === t.value
                      return (
                        <button
                          key={t.value}
                          type="button"
                          onClick={() => setTypeFilter(t.value as any)}
                          className={cn(
                            "flex flex-col items-center justify-center gap-1 rounded-xl border p-2.5 text-center transition-all active:scale-95",
                            isSelected
                              ? "border-secondary-900 bg-secondary-900 text-white shadow-xs"
                              : "border-warm-200 bg-surface text-secondary-700 hover:bg-warm-50"
                          )}
                        >
                          <span className="text-xs font-semibold">{t.label}</span>
                          <span className={cn(
                            "rounded-full px-1.5 py-0.2 text-xs font-bold",
                            isSelected ? "bg-white/20 text-white" : "bg-warm-100 text-secondary-600"
                          )}>
                            {t.count}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="border-t border-warm-200 bg-surface p-4 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={handleResetFilter}
                  className="flex items-center gap-1.5 rounded-[var(--radius-button)] px-3.5 py-2.5 text-xs font-semibold text-secondary-600 hover:bg-warm-100 transition-colors active:scale-95"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span>Repor (Hoje)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsFilterOpen(false)}
                  className="flex-1 rounded-[var(--radius-button)] bg-primary-500 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-primary-600 transition-all active:scale-95 text-center"
                >
                  Ver Resultados ({filteredTotal})
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Form Modal */}
      {isFormOpen && (
        <EventForm
          event={activeEvent}
          initialDate={selectedDate}
          onClose={handleCloseForm}
          onSubmit={handleSubmitForm}
          onDelete={canWriteEvents ? handleDeleteEvent : undefined}
          isLoading={createMutation.isPending || updateMutation.isPending || deleteMutation.isPending}
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
