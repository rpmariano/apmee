import { 
  X, 
  Calendar, 
  Clock, 
  MapPin, 
  FileText, 
  Paperclip, 
  ExternalLink, 
  Edit3
} from 'lucide-react'
import { format, parseISO, isSameDay } from 'date-fns'
import { pt } from 'date-fns/locale'
import type { Event, EventStatus } from '@/types/database'
import { EVENT_TYPES, MEETING_TYPE_LABELS } from '@/lib/constants'
import { cn, getInitials } from '@/lib/utils'
import { useHardwareBack } from '@/hooks/use-hardware-back'
import type { EventFinanceSummary } from './event-card'

interface EventDetailsModalProps {
  event: Event | null
  isOpen: boolean
  onClose: () => void
  onEdit?: () => void
  canEdit?: boolean
  creatorName?: string | null
  financeSummary?: EventFinanceSummary
}

const statusConfig: Record<EventStatus, { label: string; className: string }> = {
  planned: { label: 'Planeado', className: 'bg-warm-100 text-secondary-700 border-warm-200' },
  active: { label: 'Em Curso', className: 'bg-primary-50 text-primary-700 border-primary-200' },
  completed: { label: 'Concluído', className: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
  cancelled: { label: 'Cancelado', className: 'bg-red-50 text-red-700 border-red-200' },
}

export function EventDetailsModal({
  event,
  isOpen,
  onClose,
  onEdit,
  canEdit = true,
  creatorName,
  financeSummary,
}: EventDetailsModalProps) {
  useHardwareBack(isOpen, onClose)

  if (!isOpen || !event) return null

  const isReuniao = event.event_type === EVENT_TYPES.REUNIAO
  const startDate = parseISO(event.start_date)
  const endDate = event.end_date ? parseISO(event.end_date) : null
  const isSameDayEnd = endDate ? isSameDay(startDate, endDate) : true

  const formattedDate = format(startDate, "EEEE, d 'de' MMMM 'de' yyyy", { locale: pt })
  const formattedTime = event.is_all_day ? 'Dia Inteiro' : format(startDate, 'HH:mm')
  const endTime = endDate && !event.is_all_day ? format(endDate, 'HH:mm') : null

  const status = statusConfig[event.status] || statusConfig.planned
  const meetingTypeLabel = event.meeting_type
    ? MEETING_TYPE_LABELS[event.meeting_type] || event.meeting_type
    : null

  const effectiveCreatorName = creatorName || event.created_by_name || null
  const creatorInitials = getInitials(effectiveCreatorName)

  return (
    <div className="fixed inset-0 z-[90] flex justify-center bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="flex w-full max-w-[430px] flex-col bg-background shadow-2xl animate-in slide-in-from-bottom-6 duration-200 ease-out overflow-hidden">
        
        {/* Header Banner with Event Sovereignty Colors */}
        <div className={cn(
          "relative flex items-center justify-between px-5 py-4 border-b",
          isReuniao 
            ? "bg-blue-600 text-white border-blue-700" 
            : "bg-amber-500 text-white border-amber-600"
        )}>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider backdrop-blur-xs">
              {isReuniao ? 'Reunião 📋' : 'Festa 🎉'}
            </span>
            {meetingTypeLabel && (
              <span className="rounded-full bg-white/15 px-2 py-0.5 text-xs font-medium backdrop-blur-xs">
                {meetingTypeLabel}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            {canEdit && onEdit && (
              <button
                type="button"
                onClick={onEdit}
                aria-label="Editar evento"
                className="flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1.5 text-xs font-bold text-white transition-all hover:bg-white/30 active:scale-95 min-h-[36px]"
              >
                <Edit3 className="h-3.5 w-3.5" />
                <span>Editar</span>
              </button>
            )}
            
            <button
              type="button"
              onClick={onClose}
              aria-label="Fechar consulta"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30 active:scale-95 transition-all"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">
          
          {/* Title and Status */}
          <div>
            <div className="flex items-start justify-between gap-3">
              <h2 className="text-xl font-bold text-foreground leading-snug">
                {event.title}
              </h2>
              <span className={cn(
                "shrink-0 rounded-full px-2.5 py-1 text-xs font-bold border",
                status.className
              )}>
                {status.label}
              </span>
            </div>

            {effectiveCreatorName && (
              <div className="mt-2 flex items-center gap-2 text-xs text-muted">
                <div className="flex h-6 w-6 items-center justify-center rounded-full border border-warm-300 bg-warm-100 text-xs font-bold text-secondary-700">
                  {creatorInitials}
                </div>
                <span>Criado por {effectiveCreatorName}</span>
              </div>
            )}
          </div>

          {/* Logistics Box (Date, Time, Location) */}
          <div className="rounded-[var(--radius-card)] border border-warm-200 bg-surface p-4 space-y-2.5 shadow-xs">
            <div className="flex items-start gap-2.5 text-xs text-secondary-700">
              <Calendar className="h-4 w-4 text-primary-500 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold capitalize block text-foreground text-sm">
                  {formattedDate}
                </span>
                {endDate && !isSameDayEnd && (
                  <span className="text-xs text-muted">
                    Até {format(endDate, "EEEE, d 'de' MMMM", { locale: pt })}
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2.5 text-xs text-secondary-700">
              <Clock className="h-4 w-4 text-primary-500 shrink-0" />
              <span>
                {formattedTime}
                {endTime && ` às ${endTime}`}
              </span>
            </div>

            {event.location && (
              <div className="flex items-center gap-2.5 text-xs text-secondary-700">
                <MapPin className="h-4 w-4 text-primary-500 shrink-0" />
                <span className="font-medium text-foreground">{event.location}</span>
              </div>
            )}
          </div>

          {/* Description / Objectives */}
          {event.description && (
            <div className="space-y-1.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-secondary-600">
                {isReuniao ? 'Ordem de Trabalhos / Objetivos' : 'Descrição do Evento'}
              </h3>
              <div className="rounded-[var(--radius-card)] border border-warm-200 bg-surface p-4 text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                {event.description}
              </div>
            </div>
          )}

          {/* Meeting Minutes (Ata) */}
          {isReuniao && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-blue-700 flex items-center gap-1.5">
                  <FileText className="h-3.5 w-3.5" />
                  <span>Ata da Reunião / Deliberações</span>
                </h3>
              </div>

              {event.minutes && event.minutes.trim() ? (
                <div className="rounded-[var(--radius-card)] border border-blue-200 bg-blue-50/40 p-4 text-sm text-secondary-800 whitespace-pre-wrap leading-relaxed font-normal">
                  {event.minutes}
                </div>
              ) : (
                <div className="rounded-[var(--radius-card)] border border-dashed border-warm-300 bg-warm-50/50 p-4 text-center text-xs text-muted">
                  Ainda não foi registada ata para esta reunião.
                </div>
              )}
            </div>
          )}

          {/* Attached Documents */}
          {event.documents && event.documents.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-secondary-600 flex items-center gap-1.5">
                <Paperclip className="h-3.5 w-3.5" />
                <span>Documentos & Anexos ({event.documents.length})</span>
              </h3>

              <div className="space-y-2">
                {event.documents.map((doc) => (
                  <a
                    key={doc.id}
                    href={doc.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between rounded-xl border border-warm-200 bg-surface p-3 transition-all hover:bg-warm-50 hover:border-primary-300 active:scale-[0.99]"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
                        <FileText className="h-4 w-4" />
                      </div>
                      <div className="truncate">
                        <p className="truncate text-xs font-semibold text-foreground">
                          {doc.name}
                        </p>
                        <p className="text-xs text-muted">
                          {doc.provider === 'google_drive' ? 'Google Drive' : 'Ficheiro / Link'}
                        </p>
                      </div>
                    </div>

                    <ExternalLink className="h-4 w-4 shrink-0 text-muted ml-2" />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Financial Summary */}
          {financeSummary && financeSummary.count > 0 && (
            <div className="rounded-[var(--radius-card)] border border-warm-200 bg-surface p-4 shadow-xs">
              <h3 className="text-xs font-bold uppercase tracking-wider text-secondary-600 mb-2">
                Resumo Financeiro
              </h3>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="rounded-lg bg-green-50 p-2">
                  <span className="block text-xs font-medium text-green-700">Receitas</span>
                  <span className="text-sm font-bold text-green-800">
                    +{financeSummary.income.toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' })}
                  </span>
                </div>
                <div className="rounded-lg bg-red-50 p-2">
                  <span className="block text-xs font-medium text-red-700">Despesas</span>
                  <span className="text-sm font-bold text-red-800">
                    -{financeSummary.expense.toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' })}
                  </span>
                </div>
                <div className="rounded-lg bg-warm-100 p-2">
                  <span className="block text-xs font-medium text-secondary-700">Saldo</span>
                  <span className={cn(
                    "text-sm font-bold",
                    financeSummary.balance >= 0 ? "text-emerald-700" : "text-red-700"
                  )}>
                    {financeSummary.balance.toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' })}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="border-t border-warm-200 bg-surface p-4 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 min-h-[44px] items-center justify-center rounded-[var(--radius-button)] border border-warm-200 bg-warm-50 font-semibold text-secondary-700 hover:bg-warm-100 active:scale-95 transition-all text-sm"
          >
            Fechar
          </button>
          {canEdit && onEdit && (
            <button
              type="button"
              onClick={onEdit}
              className="flex-1 min-h-[44px] flex items-center justify-center gap-2 rounded-[var(--radius-button)] bg-primary-500 font-bold text-white hover:bg-primary-600 active:scale-95 transition-all text-sm shadow-sm"
            >
              <Edit3 className="h-4 w-4" />
              <span>Editar Evento</span>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
