import { MapPin, Calendar, Clock, AlertTriangle, FileText, Paperclip } from 'lucide-react'
import { format, parseISO, isSameDay } from 'date-fns'
import { pt } from 'date-fns/locale'
import type { Event, EventStatus } from '@/types/database'
import { EVENT_TYPES, MEETING_TYPE_LABELS } from '@/lib/constants'
import { cn, getInitials } from '@/lib/utils'
import { useEventInventoryStatus } from '../api/use-event-inventory-status'

export interface EventFinanceSummary {
  income: number
  expense: number
  balance: number
  count: number
}

export interface EventCardProps {
  event: Event
  creatorName?: string
  onEdit?: (event: Event) => void
  financeSummary?: EventFinanceSummary
}

const statusConfig: Record<EventStatus, { label: string; className: string }> = {
  planned: { label: 'Planeado', className: 'bg-warm-200 text-secondary-700' },
  active: { label: 'Em Curso', className: 'bg-primary-100 text-primary-700' },
  completed: { label: 'Concluído', className: 'bg-emerald-100 text-emerald-800' },
  cancelled: { label: 'Cancelado', className: 'bg-red-100 text-red-700' },
}

export function EventCard({ event, creatorName, onEdit, financeSummary }: EventCardProps) {
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

  const hasContextPills =
    hasShortages ||
    (isReuniao && (hasMinutes || documentCount > 0)) ||
    Boolean(financeSummary && financeSummary.count > 0)

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
      <div className="pointer-events-none flex flex-col gap-2.5 w-full">
        {/* Top Strip: Classification Badges (Left) & Creator Initial Seal (Right) */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            {/* Event Type Badge */}
            <span
              className={cn(
                'rounded-full px-2 py-0.5 text-xs font-bold uppercase tracking-wider',
                isReuniao
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-amber-100 text-amber-800'
              )}
            >
              {isReuniao ? '📋 Reunião' : '🎉 Festa'}
            </span>

            {/* Meeting subtype badge if available */}
            {isReuniao && meetingTypeLabel && (
              <span className="rounded-full bg-warm-100 px-2 py-0.5 text-xs font-medium text-secondary-700">
                {meetingTypeLabel}
              </span>
            )}

            {/* Status Badge */}
            <span
              className={cn(
                'rounded-full px-2 py-0.5 text-xs font-bold uppercase tracking-wider',
                status.className
              )}
            >
              {status.label}
            </span>
          </div>

          {/* Creator Circle Seal */}
          <div
            className={cn(
              'shrink-0 flex h-7 w-7 items-center justify-center rounded-full border text-xs font-bold select-none bg-warm-50/80',
              isReuniao
                ? 'border-blue-400 text-blue-700'
                : 'border-amber-400 text-amber-700'
            )}
            title={effectiveCreatorName ? `Criado por: ${effectiveCreatorName}` : 'Criado por: APMEE'}
          >
            {creatorInitials}
          </div>
        </div>

        {/* Title & Description */}
        <div className="flex flex-col gap-1">
          <h3 className="text-base sm:text-lg font-bold text-foreground leading-snug">{event.title}</h3>

          {/* Description or Objectives Snippet */}
          {isReuniao ? (
            event.objectives ? (
              <p className="line-clamp-2 text-xs text-secondary-600">
                <span className="font-semibold text-secondary-700">Objetivos: </span>
                {event.objectives}
              </p>
            ) : null
          ) : (
            event.description ? (
              <p className="line-clamp-2 text-xs sm:text-sm text-muted">{event.description}</p>
            ) : null
          )}
        </div>

        {/* Contextual Pills Row (Shortages, Minutes, Documents, Financial Balance) */}
        {hasContextPills && (
          <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
            {/* Shortage pill (only for Festas) */}
            {hasShortages && (
              <span className="flex items-center gap-1 rounded-full bg-orange-100 px-2 py-0.5 text-xs font-bold text-orange-700">
                <AlertTriangle className="h-3 w-3" />
                {shortages.length} item(ns) em falta
              </span>
            )}

            {/* Minutes indicator pill (for Reuniões) */}
            {isReuniao && hasMinutes && (
              <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-bold text-emerald-700 border border-emerald-200">
                <FileText className="h-3 w-3" />
                Ata
              </span>
            )}

            {/* Documents count pill (for Reuniões) */}
            {isReuniao && documentCount > 0 && (
              <span className="flex items-center gap-1 rounded-full bg-purple-50 px-2 py-0.5 text-xs font-bold text-purple-700 border border-purple-200">
                <Paperclip className="h-3 w-3" />
                {documentCount} doc{documentCount > 1 ? 's' : ''}
              </span>
            )}

            {/* Financial balance pill */}
            {financeSummary && financeSummary.count > 0 && (
              <span
                className={cn(
                  'flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold border',
                  financeSummary.balance >= 0
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : 'bg-rose-50 text-rose-800 border-rose-200'
                )}
              >
                <span>
                  Saldo: {financeSummary.balance >= 0 ? '+' : ''}
                  {financeSummary.balance.toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' })}
                </span>
              </span>
            )}
          </div>
        )}

        {/* Date, Time & Location Footer */}
        <div className="mt-0.5 flex flex-col gap-1.5 border-t border-warm-100 pt-2.5">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs sm:text-sm text-secondary-600">
            <div className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4 shrink-0 opacity-70" />
              <span>
                {formattedDate}
                {endDate && !isSameDayEnd ? ` - ${format(endDate, "d 'de' MMMM", { locale: pt })}` : ''}
              </span>
            </div>

            {!event.is_all_day && (
              <div className="flex items-center gap-1.5">
                <Clock className="h-4 w-4 shrink-0 opacity-70" />
                <span>
                  {formattedTime} {endDate && `às ${format(endDate, 'HH:mm')}`}
                </span>
              </div>
            )}
          </div>

          {event.location && (
            <div className="flex items-center gap-1.5 text-xs sm:text-sm text-secondary-600">
              <MapPin className="h-4 w-4 shrink-0 opacity-70" />
              <span className="line-clamp-1">{event.location}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
