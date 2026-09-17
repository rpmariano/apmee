import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { MobileCalendar } from '@/features/calendar/components/mobile-calendar'
import { EventForm } from '@/features/events/components/event-form'
import { useEvents, useUpdateEvent } from '@/features/events/api/use-events'
import type { Event } from '@/types/database'

export default function CalendarPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const editId = searchParams.get('edit')
  const { data: events } = useEvents()

  const [editingEvent, setEditingEvent] = useState<Event | undefined>()
  const updateMutation = useUpdateEvent()

  // Sync with searchParams so if the browser is reloaded or tab is restored,
  // the editing event remains open!
  useEffect(() => {
    if (editId && events) {
      const found = events.find((e) => e.id === editId)
      if (found) {
        setEditingEvent(found)
      }
    } else if (!editId && editingEvent) {
      setEditingEvent(undefined)
    }
  }, [editId, events])

  const handleEditEvent = (event: Event) => {
    setEditingEvent(event)
    setSearchParams({ edit: event.id })
  }

  const handleCloseForm = () => {
    setEditingEvent(undefined)
    setSearchParams({})
  }

  const handleSubmitForm = async (data: Partial<Event>) => {
    const current = editingEvent || (editId && events ? events.find((e) => e.id === editId) : undefined)
    if (!current) return
    try {
      await updateMutation.mutateAsync({ id: current.id, ...data })
      handleCloseForm()
    } catch (error) {
      console.error('Failed to save event:', error)
      alert('Erro ao guardar o evento. Tente novamente.')
    }
  }

  const activeEvent = editingEvent || (editId && events ? events.find((e) => e.id === editId) : undefined)

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-background">
      <div className="sticky top-0 z-10 bg-background/95 pb-2 pt-6 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="px-4">
          <h1 className="text-xl font-bold text-foreground">Calendário</h1>
        </div>
      </div>

      <div className="px-4 pb-8 pt-4">
        <MobileCalendar onEditEvent={handleEditEvent} />
      </div>

      {activeEvent && (
        <EventForm
          event={activeEvent}
          onClose={handleCloseForm}
          onSubmit={handleSubmitForm}
        />
      )}
    </div>
  )
}
