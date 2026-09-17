import { MapPin, Calendar, Clock } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { pt } from 'date-fns/locale'
import type { Event, EventStatus } from '@/types/database'
import { cn } from '@/lib/utils'

interface EventCardProps {
  event: Event
  onEdit?: (event: Event) => void
}

const statusConfig: Record<EventStatus, { label: string; className: string }> = {
  planned: { label: 'Planeado', className: 'bg-warm-200 text-secondary-700' },
  active: { label: 'Em Curso', className: 'bg-primary-100 text-primary-700' },
  completed: { label: 'Concluído', className: 'bg-[#E8F5E9] text-[#2E7D32]' },
  cancelled: { label: 'Cancelado', className: 'bg-red-100 text-red-700' },
}

export function EventCard({ event, onEdit }: EventCardProps) {
  const startDate = parseISO(event.start_date)
  const endDate = event.end_date ? parseISO(event.end_date) : null
  
  const formattedDate = format(startDate, "d 'de' MMMM", { locale: pt })
  const formattedTime = event.is_all_day ? 'Dia Inteiro' : format(startDate, 'HH:mm')
  const status = statusConfig[event.status]

  return (
    <div 
      className={cn(
        "flex flex-col gap-3 rounded-[var(--radius-card)] border border-warm-200 bg-surface p-4 shadow-sm transition-all hover:shadow-md",
        onEdit && "cursor-pointer active:scale-[0.98]"
      )}
      onClick={() => onEdit && onEdit(event)}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider', status.className)}>
              {status.label}
            </span>
          </div>
          <h3 className="mt-2 text-lg font-bold text-foreground leading-tight">{event.title}</h3>
          
          {event.description && (
            <p className="mt-1 line-clamp-2 text-sm text-muted">{event.description}</p>
          )}
        </div>

        
      </div>

      <div className="mt-1 flex flex-col gap-1.5 border-t border-warm-100 pt-3">
        <div className="flex items-center gap-2 text-sm text-secondary-600">
          <Calendar className="h-4 w-4 shrink-0 opacity-70" />
          <span>{formattedDate} {endDate && `- ${format(endDate, "d 'de' MMMM", { locale: pt })}`}</span>
        </div>
        
        {!event.is_all_day && (
          <div className="flex items-center gap-2 text-sm text-secondary-600">
            <Clock className="h-4 w-4 shrink-0 opacity-70" />
            <span>{formattedTime} {endDate && `às ${format(endDate, 'HH:mm')}`}</span>
          </div>
        )}

        {event.location && (
          <div className="flex items-center gap-2 text-sm text-secondary-600">
            <MapPin className="h-4 w-4 shrink-0 opacity-70" />
            <span className="line-clamp-1">{event.location}</span>
          </div>
        )}
      </div>
    </div>
  )
}
