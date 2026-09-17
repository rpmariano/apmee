import { MapPin, Calendar, Clock, AlertTriangle, FileText, Paperclip } from 'lucide-react'
import { format, parseISO, isSameDay } from 'date-fns'
import { pt } from 'date-fns/locale'
import type { Event, EventStatus } from '@/types/database'
import { EVENT_TYPES, MEETING_TYPE_LABELS } from '@/lib/constants'
import { cn, getInitials } from '@/lib/utils'
import { useEventInventoryStatus } from '../api/use-event-inventory-status'

interface EventCardProps {
  event: Event
  creatorName?: string
  onEdit?: (event: Event) => void
}

const statusConfig: Record<EventStatus, { label: string; className: string }> = {
  planned: { label: 'Planeado', className: 'bg-warm-200 text-secondary-700' },
  active: { label: 'Em Curso', className: 'bg-primary-100 text-primary-700' },
  completed: { label: 'Concluído', className: 'bg-[#E8F5E9] text-[#2E7D32]' },
  cancelled: { label: 'Cancelado', className: 'bg-red-100 text-red-700' },
}

export function EventCard({ event, creatorName, onEdit }: EventCardProps) {
  const isReuniao = event.event_type === EVENT_TYPES.REUNIAO
  const effectiveCreatorName = creatorName || event.created_by_name || null
  const creatorInitials = getInitials(effectiveCreatorName)
  const startDate = parseISO(event.start_date)
  const endDate = event.end_date ? parseISO(event.end_date) : null
  const isSameDayEnd = endDate ? isSameDay(startDate, endDate) : true

  const formattedDate = format(startDate, "d 'de' MMMM", { locale: pt })
  const formattedTime = event.is_all_day ? 'Dia Inteiro' : format(startDate, 'HH:mm')
  const status = statusConfig[event.status]

  // Only check shortages for planned/active Festa events
  const shouldCheckShortages = !isReuniao && (event.status === 'planned' || event.status === 'active')
  const { hasShortages, shortages } = useEventInventoryStatus(
    shouldCheckShortages ? event.id : undefined
  )

  const meetingTypeLabel = event.meeting_type
    ? MEETING_TYPE_LABELS[event.meeting_type] || event.meeting_type
    : null

  const hasMinutes = Boolean(event.minutes?.trim())
  const documentCount = event.documents?.length || 0

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onEdit && onEdit(event)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onEdit && onEdit(event)
        }
      }}
      className={cn(
        'group relative w-full text-left select-none touch-manipulation flex flex-col gap-3 rounded-[var(--radius-card)] border border-warm-200 bg-surface p-4 shadow-sm transition-all',
        onEdit && 'cursor-pointer active:scale-[0.98] hover:shadow-md hover:border-warm-300'
      )}
    >
      <div className="pointer-events-none flex flex-col gap-3 w-full">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-1.5">
            {/* Event Type Badge */}
            <span
              className={cn(
                'rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider',
                isReuniao
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-amber-100 text-amber-800'
              )}
            >
              {isReuniao ? '📋 Reunião' : '🎉 Festa'}
            </span>

            {/* Meeting subtype badge if available */}
            {isReuniao && meetingTypeLabel && (
              <span className="rounded-full bg-warm-100 px-2 py-0.5 text-[10px] font-medium text-secondary-700">
                {meetingTypeLabel}
              </span>
            )}

            {/* Status Badge */}
            <span
              className={cn(
                'rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider',
                status.className
              )}
            >
              {status.label}
            </span>

            {/* Shortage pill (only for Festas) */}
            {hasShortages && (
              <span className="flex items-center gap-1 rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-bold text-orange-700">
                <AlertTriangle className="h-3 w-3" />
                {shortages.length} item(ns) em falta
              </span>
            )}

            {/* Minutes indicator pill (for Reuniões) */}
            {isReuniao && hasMinutes && (
              <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                <FileText className="h-3 w-3" />
                Ata
              </span>
            )}

            {/* Documents count pill (for Reuniões) */}
            {isReuniao && documentCount > 0 && (
              <span className="flex items-center gap-1 rounded-full bg-purple-50 px-2 py-0.5 text-[10px] font-bold text-purple-700 border border-purple-200">
                <Paperclip className="h-3 w-3" />
                {documentCount} doc{documentCount > 1 ? 's' : ''}
              </span>
            )}
          </div>

          <h3 className="mt-2 text-lg font-bold text-foreground leading-tight">{event.title}</h3>

          {/* Description or Objectives Snippet */}
          {isReuniao ? (
            event.objectives ? (
              <p className="mt-1 line-clamp-2 text-xs text-secondary-600">
                <span className="font-semibold text-secondary-700">Objetivos: </span>
                {event.objectives}
              </p>
            ) : null
          ) : (
            event.description ? (
              <p className="mt-1 line-clamp-2 text-sm text-muted">{event.description}</p>
            ) : null
          )}
        </div>

        {/* Creator Circle Symbol (circulo vazio com as iniciais) */}
        <div
          className={cn(
            'shrink-0 flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs font-bold select-none bg-transparent',
            isReuniao
              ? 'border-blue-600 text-blue-600'
              : 'border-amber-500 text-amber-600'
          )}
          title={effectiveCreatorName ? `Criado por: ${effectiveCreatorName}` : 'Criado por: APMEE'}
        >
          {creatorInitials}
        </div>
      </div>

      <div className="mt-1 flex flex-col gap-1.5 border-t border-warm-100 pt-3">
        <div className="flex items-center gap-2 text-sm text-secondary-600">
          <Calendar className="h-4 w-4 shrink-0 opacity-70" />
          <span>
            {formattedDate}
            {endDate && !isSameDayEnd ? ` - ${format(endDate, "d 'de' MMMM", { locale: pt })}` : ''}
          </span>
        </div>

        {!event.is_all_day && (
          <div className="flex items-center gap-2 text-sm text-secondary-600">
            <Clock className="h-4 w-4 shrink-0 opacity-70" />
            <span>
              {formattedTime} {endDate && `às ${format(endDate, 'HH:mm')}`}
            </span>
          </div>
        )}

        {event.location && (
          <div className="flex items-center gap-2 text-sm text-secondary-600">
            <MapPin className="h-4 w-4 shrink-0 opacity-70" />
            <span className="line-clamp-1">{event.location}</span>
          </div>
        )}

        {effectiveCreatorName && (
          <div className="flex items-center gap-1 text-[11px] text-muted pt-0.5">
            <span>Criado por:</span>
            <span className="font-semibold text-secondary-700">{effectiveCreatorName}</span>
          </div>
        )}
      </div>
      </div>
    </div>
  )
}
