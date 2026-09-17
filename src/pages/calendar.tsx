import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { MobileCalendar } from '@/features/calendar/components/mobile-calendar'
import { EventForm } from '@/features/events/components/event-form'
import { useEvents, useUpdateEvent } from '@/features/events/api/use-events'
import type { Event } from '@/types/database'
import { CustomDialog } from '@/components/ui/custom-dialog'

export default function CalendarPage() {
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [editingEvent, setEditingEvent] = useState<Event | undefined>()
  const [searchParams, setSearchParams] = useSearchParams()
  const editId = searchParams.get('edit')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const { data: events } = useEvents()
  const updateMutation = useUpdateEvent()

  // Sync with searchParams
  useEffect(() => {
    if (editId && events) {
      const found = events.find((e) => e.id === editId)
      if (found) {
        setEditingEvent(found)
        setSelectedDate(new Date(found.start_date))
      }
    }
  }, [editId, events])

  const handleEditEvent = (event: Event) => {
    setEditingEvent(event)
    setSelectedDate(new Date(event.start_date))
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
      if (data.start_date) {
        setSelectedDate(new Date(data.start_date))
      }
      await updateMutation.mutateAsync({ id: current.id, ...data })
      handleCloseForm()
    } catch (error: any) {
      console.error('Failed to save event:', error)
      setErrorMessage(error?.message || 'Erro ao guardar o evento. Tente novamente.')
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
        <MobileCalendar
          onEditEvent={handleEditEvent}
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
        />
      </div>

      {activeEvent && (
        <EventForm
          event={activeEvent}
          onClose={handleCloseForm}
          onSubmit={handleSubmitForm}
        />
      )}

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
