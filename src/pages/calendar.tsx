import { useState } from 'react'
import { MobileCalendar } from '@/features/calendar/components/mobile-calendar'
import { EventForm } from '@/features/events/components/event-form'
import { useUpdateEvent } from '@/features/events/api/use-events'
import type { Event } from '@/types/database'

export default function CalendarPage() {
  const [editingEvent, setEditingEvent] = useState<Event | undefined>()
  const updateMutation = useUpdateEvent()

  const handleEditEvent = (event: Event) => {
    setEditingEvent(event)
  }

  const handleCloseForm = () => {
    setEditingEvent(undefined)
  }

  const handleSubmitForm = async (data: Partial<Event>) => {
    if (!editingEvent) return
    try {
      await updateMutation.mutateAsync({ id: editingEvent.id, ...data })
      handleCloseForm()
    } catch (error) {
      console.error('Failed to save event:', error)
      alert('Erro ao guardar o evento. Tente novamente.')
    }
  }

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

      {editingEvent && (
        <EventForm
          event={editingEvent}
          onClose={handleCloseForm}
          onSubmit={handleSubmitForm}
        />
      )}
    </div>
  )
}
