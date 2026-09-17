import { useState, useRef } from 'react'
import { X, MapPin, Target, FileText } from 'lucide-react'
import type { Event, EventStatus, EventType, MeetingType, EventDocument } from '@/types/database'
import {
  EVENT_STATUSES,
  EVENT_TYPES,
  MEETING_TYPES,
  MEETING_TYPE_LABELS,
} from '@/lib/constants'

import { useHardwareBack } from '@/hooks/use-hardware-back'
import { UnsavedDialog } from '@/components/ui/unsaved-dialog'
import { CustomDialog } from '@/components/ui/custom-dialog'
import { CustomSelect } from '@/components/ui/custom-select'
import { EventInventoryManager } from './event-inventory-manager'
import { EventDocumentsManager } from './event-documents-manager'
import { useEventInventoryStatus } from '../api/use-event-inventory-status'
import { cn } from '@/lib/utils'

interface EventFormProps {
  event?: Event
  initialDate?: Date
  onClose: () => void
  onSubmit: (data: Partial<Event>) => void
  isLoading?: boolean
}

// Map constants to labels for the select input
const STATUS_LABELS: Record<string, string> = {
  [EVENT_STATUSES.PLANNED]: 'Planeado',
  [EVENT_STATUSES.ACTIVE]: 'Ativo / Em Curso',
  [EVENT_STATUSES.COMPLETED]: 'Concluído',
  [EVENT_STATUSES.CANCELLED]: 'Cancelado',
}

// Utility to convert ISO string to datetime-local format (YYYY-MM-DDThh:mm)
function toDateTimeLocal(isoString?: string | null) {
  if (!isoString) return ''
  const date = new Date(isoString)
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16)
}

function getDefaultDates(initialDate?: Date) {
  if (!initialDate) return { start: '', end: '' }
  const start = new Date(initialDate)
  start.setHours(9, 0, 0, 0)
  const end = new Date(initialDate)
  end.setHours(10, 0, 0, 0)
  return {
    start: toDateTimeLocal(start.toISOString()),
    end: toDateTimeLocal(end.toISOString()),
  }
}

export function EventForm({ event, initialDate, onClose, onSubmit, isLoading }: EventFormProps) {
  const [showUnsaved, setShowUnsaved] = useState(false)
  const [showShortageWarning, setShowShortageWarning] = useState(false)
  const [showCompletionBlocked, setShowCompletionBlocked] = useState(false)
  const [isEditing, setIsEditing] = useState(!event)
  const formRef = useRef<HTMLFormElement>(null)

  // Event Type
  const [eventType, setEventType] = useState<EventType>(event?.event_type ?? EVENT_TYPES.FESTA)

  // Inventory shortage status (only relevant for Festas)
  const { hasShortages, shortages } = useEventInventoryStatus(
    eventType === EVENT_TYPES.FESTA ? event?.id : undefined
  )

  const handleCloseClick = () => {
    if (isDirty) setShowUnsaved(true)
    else onClose()
  }

  useHardwareBack(true, handleCloseClick)

  const handleSaveAndClose = () => {
    setShowUnsaved(false)
    formRef.current?.requestSubmit()
  }

  const defaultDates = getDefaultDates(initialDate)
  const initialStartDate = toDateTimeLocal(event?.start_date) || defaultDates.start
  const initialEndDate = toDateTimeLocal(event?.end_date) || defaultDates.end

  // Shared fields
  const [title, setTitle] = useState(event?.title ?? '')
  const [description, setDescription] = useState(event?.description ?? '')
  const [location, setLocation] = useState(event?.location ?? '')
  const [startDate, setStartDate] = useState(initialStartDate)
  const [endDate, setEndDate] = useState(initialEndDate)
  const [isAllDay, setIsAllDay] = useState(event?.is_all_day ?? false)
  const [status, setStatus] = useState<EventStatus>(event?.status ?? EVENT_STATUSES.PLANNED)

  // Meeting-specific fields
  const [meetingType, setMeetingType] = useState<MeetingType | string>(
    event?.meeting_type ?? MEETING_TYPES.DIRECAO
  )
  const [objectives, setObjectives] = useState(event?.objectives ?? '')
  const [minutes, setMinutes] = useState(event?.minutes ?? '')
  const [documents, setDocuments] = useState<EventDocument[]>(event?.documents ?? [])

  const isDirty =
    eventType !== (event?.event_type ?? EVENT_TYPES.FESTA) ||
    title !== (event?.title ?? '') ||
    description !== (event?.description ?? '') ||
    location !== (event?.location ?? '') ||
    startDate !== initialStartDate ||
    endDate !== initialEndDate ||
    isAllDay !== (event?.is_all_day ?? false) ||
    status !== (event?.status ?? EVENT_STATUSES.PLANNED) ||
    meetingType !== (event?.meeting_type ?? MEETING_TYPES.DIRECAO) ||
    objectives !== (event?.objectives ?? '') ||
    minutes !== (event?.minutes ?? '') ||
    JSON.stringify(documents) !== JSON.stringify(event?.documents ?? [])

  const pendingInventoryHandlerRef = useRef<(() => Promise<void>) | null>(null)

  const doSubmit = () => {
    const startIso = new Date(startDate).toISOString()
    const endIso = endDate ? new Date(endDate).toISOString() : null

    onSubmit({
      title,
      description: eventType === EVENT_TYPES.FESTA ? description || null : null,
      location: location || null,
      start_date: startIso,
      end_date: endIso,
      is_all_day: isAllDay,
      status,
      event_type: eventType,
      meeting_type: eventType === EVENT_TYPES.REUNIAO ? meetingType : null,
      objectives: eventType === EVENT_TYPES.REUNIAO ? objectives || null : null,
      minutes: eventType === EVENT_TYPES.REUNIAO ? minutes || null : null,
      documents: eventType === EVENT_TYPES.REUNIAO ? documents : [],
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // If Festa, handle pending inventory
    if (eventType === EVENT_TYPES.FESTA) {
      if (pendingInventoryHandlerRef.current) {
        try {
          await pendingInventoryHandlerRef.current()
        } catch (err) {
          console.error('Failed to save pending inventory:', err)
        }
      }

      // Block completion if shortages exist
      if (status === EVENT_STATUSES.COMPLETED && hasShortages) {
        setShowCompletionBlocked(true)
        return
      }

      // Warn about shortages on save
      if (hasShortages && (status === EVENT_STATUSES.PLANNED || status === EVENT_STATUSES.ACTIVE)) {
        setShowShortageWarning(true)
        return
      }
    }

    doSubmit()
  }

  // Handle status change
  const handleStatusChange = (val: string) => {
    if (eventType === EVENT_TYPES.FESTA && val === EVENT_STATUSES.COMPLETED && hasShortages) {
      setShowCompletionBlocked(true)
      return
    }
    setStatus(val as EventStatus)
  }

  return (
    <div className="fixed inset-0 z-[100] flex justify-center bg-warm-100">
      <div className="flex w-full max-w-[430px] flex-col bg-background shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-warm-200 bg-surface px-4 py-4">
          <div>
            <h2 className="text-lg font-bold text-foreground">
              {!isEditing
                ? event?.event_type === EVENT_TYPES.REUNIAO
                  ? 'Detalhes da Reunião'
                  : 'Detalhes da Festa'
                : event
                ? event.event_type === EVENT_TYPES.REUNIAO
                  ? 'Editar Reunião'
                  : 'Editar Festa'
                : eventType === EVENT_TYPES.REUNIAO
                ? 'Nova Reunião'
                : 'Nova Festa'}
            </h2>
            <p className="text-xs text-muted">
              {eventType === EVENT_TYPES.REUNIAO ? 'Reunião & Atas' : 'Celebração & Materiais'}
            </p>
          </div>
          <button
            type="button"
            onClick={handleCloseClick}
            className="rounded-full p-2 text-muted hover:bg-warm-100 active:scale-95 transition-all"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-5">
          <form ref={formRef} id="event-form" onSubmit={handleSubmit} className="flex flex-col gap-4">
            
            {/* Event Type Segmented Toggle */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-secondary-600">
                Tipo de Evento
              </label>
              <div className="grid grid-cols-2 gap-1.5 rounded-[var(--radius-button)] bg-warm-100 p-1">
                <button
                  type="button"
                  disabled={!isEditing}
                  onClick={() => setEventType(EVENT_TYPES.FESTA)}
                  className={cn(
                    'flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-[calc(var(--radius-button)-4px)] transition-all',
                    eventType === EVENT_TYPES.FESTA
                      ? 'bg-surface text-primary-700 shadow-sm'
                      : 'text-secondary-600 hover:text-foreground opacity-75'
                  )}
                >
                  <span>🎉</span>
                  <span>Festa / Evento</span>
                </button>
                <button
                  type="button"
                  disabled={!isEditing}
                  onClick={() => setEventType(EVENT_TYPES.REUNIAO)}
                  className={cn(
                    'flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-[calc(var(--radius-button)-4px)] transition-all',
                    eventType === EVENT_TYPES.REUNIAO
                      ? 'bg-surface text-primary-700 shadow-sm'
                      : 'text-secondary-600 hover:text-foreground opacity-75'
                  )}
                >
                  <span>📋</span>
                  <span>Reunião</span>
                </button>
              </div>
            </div>

            {/* Meeting Subtype (only if Reunião) */}
            {eventType === EVENT_TYPES.REUNIAO && (
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-secondary-700">Tipo de Reunião</label>
                <CustomSelect
                  disabled={!isEditing}
                  value={meetingType}
                  onChange={(val) => setMeetingType(val)}
                  options={Object.entries(MEETING_TYPES).map(([, value]) => ({
                    label: MEETING_TYPE_LABELS[value],
                    value,
                  }))}
                />
              </div>
            )}

            {/* Title */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-secondary-700">
                Título <span className="text-primary-500">*</span>
              </label>
              <input
                disabled={!isEditing}
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="rounded-[var(--radius-button)] border border-warm-200 bg-surface px-3 py-2 text-sm focus:border-primary-400 focus:outline-none focus:ring-1 focus:ring-primary-400"
                placeholder={
                  eventType === EVENT_TYPES.REUNIAO
                    ? 'Ex: Reunião de Direção - Setembro'
                    : 'Ex: Festa de Fim de Ano'
                }
              />
            </div>

            {/* Location */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-secondary-700">Localização</label>
              <div className="relative flex items-center">
                <MapPin className="absolute left-3 h-4 w-4 text-secondary-400" />
                <input
                  disabled={!isEditing}
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full rounded-[var(--radius-button)] border border-warm-200 bg-surface pl-9 pr-3 py-2 text-sm focus:border-primary-400 focus:outline-none focus:ring-1 focus:ring-primary-400"
                  placeholder={
                    eventType === EVENT_TYPES.REUNIAO
                      ? 'Ex: Sala dos Professores ou Link Google Meet'
                      : 'Ex: Escola EB Cobre - Recreio'
                  }
                />
              </div>
            </div>

            {/* Dates & Times */}
            <div className="rounded-[var(--radius-card)] border border-warm-200 bg-surface p-3.5 flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <input
                  disabled={!isEditing}
                  type="checkbox"
                  id="all-day"
                  checked={isAllDay}
                  onChange={(e) => setIsAllDay(e.target.checked)}
                  className="h-4 w-4 rounded border-warm-300 text-primary-500 focus:ring-primary-400"
                />
                <label htmlFor="all-day" className="text-xs font-semibold text-foreground cursor-pointer">
                  Evento de dia inteiro
                </label>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-secondary-700">
                    Início <span className="text-primary-500">*</span>
                  </label>
                  <input
                    disabled={!isEditing}
                    type={isAllDay ? 'date' : 'datetime-local'}
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    required
                    className="rounded-[var(--radius-button)] border border-warm-200 bg-background px-2.5 py-1.5 text-xs focus:border-primary-400 focus:outline-none"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-secondary-700">Fim</label>
                  <input
                    disabled={!isEditing}
                    type={isAllDay ? 'date' : 'datetime-local'}
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="rounded-[var(--radius-button)] border border-warm-200 bg-background px-2.5 py-1.5 text-xs focus:border-primary-400 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Status */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-secondary-700">Estado</label>
              <CustomSelect
                disabled={!isEditing}
                value={status}
                onChange={handleStatusChange}
                options={Object.values(EVENT_STATUSES).map((s) => ({
                  label: STATUS_LABELS[s],
                  value: s,
                }))}
              />
            </div>

            {/* Festa Specific: Description */}
            {eventType === EVENT_TYPES.FESTA && (
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-secondary-700">Descrição</label>
                <textarea
                  disabled={!isEditing}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="resize-none rounded-[var(--radius-card)] border border-warm-200 bg-surface px-3 py-2 text-sm focus:border-primary-400 focus:outline-none focus:ring-1 focus:ring-primary-400"
                  placeholder="Detalhes e planeamento da festa..."
                />
              </div>
            )}

            {/* Reunião Specific: Objectives & Minutes */}
            {eventType === EVENT_TYPES.REUNIAO && (
              <>
                {/* Objectives */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center gap-1.5">
                    <Target className="h-4 w-4 text-primary-500" />
                    <label className="text-sm font-medium text-secondary-700">
                      Objetivos & Ordem de Trabalhos
                    </label>
                  </div>
                  <textarea
                    disabled={!isEditing}
                    value={objectives}
                    onChange={(e) => setObjectives(e.target.value)}
                    rows={3}
                    className="resize-none rounded-[var(--radius-card)] border border-warm-200 bg-surface px-3 py-2 text-sm focus:border-primary-400 focus:outline-none focus:ring-1 focus:ring-primary-400"
                    placeholder="Registe os objetivos a atingir e a ordem de trabalhos da reunião..."
                  />
                </div>

                {/* Minutes / Ata */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center gap-1.5">
                    <FileText className="h-4 w-4 text-primary-500" />
                    <label className="text-sm font-medium text-secondary-700">
                      Ata da Reunião
                    </label>
                  </div>
                  <textarea
                    disabled={!isEditing}
                    value={minutes}
                    onChange={(e) => setMinutes(e.target.value)}
                    rows={4}
                    className="resize-none rounded-[var(--radius-card)] border border-warm-200 bg-surface px-3 py-2 text-sm focus:border-primary-400 focus:outline-none focus:ring-1 focus:ring-primary-400"
                    placeholder="Registe a ata, resumo das discussões e principais deliberações tomadas..."
                  />
                </div>
              </>
            )}
          </form>

          {/* Conditional Sub-managers: Documents for Reuniões vs Inventory for Festas */}
          {eventType === EVENT_TYPES.REUNIAO ? (
            <EventDocumentsManager
              documents={documents}
              onChange={setDocuments}
              disabled={!isEditing}
            />
          ) : (
            <>
              {event?.id ? (
                <EventInventoryManager
                  eventId={event.id}
                  eventStatus={status}
                  isEditing={isEditing}
                  onRegisterPendingHandler={(handler) => {
                    pendingInventoryHandlerRef.current = handler
                  }}
                />
              ) : (
                <div className="rounded-[var(--radius-card)] bg-warm-50 p-4 border border-warm-100 text-center">
                  <p className="text-sm text-secondary-600">
                    Guarde o evento primeiro para poder associar material do inventário.
                  </p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer Action Button */}
        <div className="border-t border-warm-200 bg-surface p-4">
          {isEditing ? (
            <button
              type="submit"
              form="event-form"
              disabled={isLoading}
              className="flex w-full items-center justify-center rounded-[var(--radius-button)] bg-primary-400 py-3 text-sm font-medium text-white shadow-sm transition-all hover:bg-primary-500 active:scale-95 disabled:opacity-50"
            >
              {isLoading
                ? 'A Guardar...'
                : eventType === EVENT_TYPES.REUNIAO
                ? 'Guardar Reunião'
                : 'Guardar Festa'}
            </button>
          ) : (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault()
                setIsEditing(true)
              }}
              className="flex w-full items-center justify-center rounded-[var(--radius-button)] bg-primary-400 py-3 text-sm font-medium text-white shadow-sm transition-all hover:bg-primary-500 active:scale-95"
            >
              {eventType === EVENT_TYPES.REUNIAO ? 'Editar Reunião' : 'Editar Festa'}
            </button>
          )}
        </div>

        {/* Unsaved Changes Confirmation */}
        <UnsavedDialog
          isOpen={showUnsaved}
          onCancel={() => setShowUnsaved(false)}
          onDiscard={() => {
            setShowUnsaved(false)
            onClose()
          }}
          onSave={handleSaveAndClose}
        />

        {/* Custom Dialog for shortage warning on save */}
        <CustomDialog
          isOpen={showShortageWarning}
          title="Provisão Insuficiente"
          description={`Atenção: Este evento tem ${shortages.length} item(ns) sem a provisão necessária no inventário.\n\nDeseja guardar na mesma?`}
          variant="warning"
          confirmLabel="Guardar na Mesma"
          cancelLabel="Voltar ao Evento"
          onConfirm={() => {
            setShowShortageWarning(false)
            doSubmit()
          }}
          onCancel={() => setShowShortageWarning(false)}
        />

        {/* Custom Dialog for completion blocked */}
        <CustomDialog
          isOpen={showCompletionBlocked}
          title="Não é Possível Concluir"
          description={`Existem ${shortages.length} item(ns) sem provisão suficiente no inventário.\n\nAdquira o material em falta antes de alterar o estado para "Concluído".`}
          variant="danger"
          confirmLabel="Entendido"
          onConfirm={() => setShowCompletionBlocked(false)}
        />
      </div>
    </div>
  )
}
