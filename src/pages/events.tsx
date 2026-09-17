import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { EventList } from '@/features/events/components/event-list'
import { EventForm } from '@/features/events/components/event-form'
import { useEvents, useCreateEvent, useUpdateEvent } from '@/features/events/api/use-events'
import type { Event } from '@/types/database'
import { CustomDialog } from '@/components/ui/custom-dialog'
import { cn } from '@/lib/utils'

type FilterValue = 'upcoming' | 'past' | 'all'

const tabs: { value: FilterValue; label: string }[] = [
  { value: 'upcoming', label: 'Próximos' },
  { value: 'past', label: 'Terminados' },
  { value: 'all', label: 'Todos' },
]

export default function EventsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const editId = searchParams.get('edit')
  const isNew = searchParams.get('new') === 'true'
  const { data: events } = useEvents()

  const [activeTab, setActiveTab] = useState<FilterValue>('upcoming')
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingEvent, setEditingEvent] = useState<Event | undefined>()
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const createMutation = useCreateEvent()
  const updateMutation = useUpdateEvent()

  // Sync with searchParams
  useEffect(() => {
    if (editId && events) {
      const found = events.find((e) => e.id === editId)
      if (found) {
        setEditingEvent(found)
        setIsFormOpen(true)
      }
    } else if (isNew) {
      setEditingEvent(undefined)
      setIsFormOpen(true)
    } else if (!editId && !isNew && isFormOpen) {
      setIsFormOpen(false)
      setEditingEvent(undefined)
    }
  }, [editId, isNew, events])

  const handleEditEvent = (event: Event) => {
    setEditingEvent(event)
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

  const handleSubmitForm = async (data: Partial<Event>) => {
    try {
      const current = editingEvent || (editId && events ? events.find(e => e.id === editId) : undefined)
      if (current) {
        await updateMutation.mutateAsync({ id: current.id, ...data })
      } else {
        await createMutation.mutateAsync(data as any)
      }
      handleCloseForm()
    } catch (error: any) {
      console.error('Failed to save event:', error)
      setErrorMessage(error?.message || 'Erro ao guardar o evento. Tente novamente.')
    }
  }

  return (
    <div className="relative min-h-[calc(100vh-4rem)] bg-background">
      {/* Header & Tabs - Sticky */}
      <div className="sticky top-0 z-10 bg-background/95 pb-2 pt-6 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="px-4">
          <h1 className="text-xl font-bold text-foreground">Eventos</h1>
        </div>

        {/* Tabs - Horizontal Scroll */}
        <div className="mt-4 flex gap-2 overflow-x-auto px-4 pb-2 scrollbar-hide">
          {tabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={cn(
                'whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium transition-colors',
                activeTab === tab.value
                  ? 'bg-secondary-900 text-white shadow-sm'
                  : 'bg-warm-100 text-secondary-600 hover:bg-warm-200'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="px-4">
        <EventList filter={activeTab} onEditEvent={handleEditEvent} />
      </div>

      {/* Floating Action Button */}
      <button
        className="fixed bottom-24 right-6 flex h-14 w-14 items-center justify-center rounded-full bg-primary-400 text-white shadow-lg transition-transform hover:scale-105 hover:bg-primary-500 active:scale-95"
        onClick={handleCreateEvent}
      >
        <Plus className="h-6 w-6" />
      </button>

      {/* Form Modal/Slide-over */}
      {isFormOpen && (
        <EventForm
          event={editingEvent}
          onClose={handleCloseForm}
          onSubmit={handleSubmitForm}
          isLoading={createMutation.isPending || updateMutation.isPending}
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
