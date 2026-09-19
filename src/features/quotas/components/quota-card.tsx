import { CheckCircle2, Clock, FileText, Landmark, Coins } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { pt } from 'date-fns/locale'
import type { Quota } from '@/types/database'
import { cn } from '@/lib/utils'
import { formatSchoolYear } from '@/lib/school-year'

function getInitials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0].toUpperCase())
    .join('')
}

export type QuotaWithContact = Quota & {
  contact: {
    name: string
    email: string | null
    metadata?: Record<string, any>
  }
}

interface QuotaCardProps {
  quota: QuotaWithContact
  onEdit?: (quota: QuotaWithContact) => void
}

export function QuotaCard({ quota, onEdit }: QuotaCardProps) {
  const isPaid = quota.paid
  const contactName = quota.contact?.name || 'Contacto Removido'
  const initials = getInitials(contactName)
  const metadata = quota.contact?.metadata || {}
  const educando = metadata.educando as string | undefined
  const turma = (metadata.turma as string | undefined) || (Array.isArray(metadata.turmas) ? metadata.turmas.join(', ') : '')
  const schoolDetails = [educando ? `Educando: ${educando}` : '', turma ? `Turma: ${turma}` : '']
    .filter(Boolean)
    .join(' · ')
  
  return (
    <div 
      role="button"
      tabIndex={0}
      aria-label={`Editar quota de ${contactName}, ano ${formatSchoolYear(quota.year)}`}
      className={cn(
        "flex flex-col gap-2 rounded-[var(--radius-card)] border border-warm-200 bg-surface p-4 shadow-sm transition-all hover:border-warm-300 outline-none focus-visible:ring-2 focus-visible:ring-primary-400",
        onEdit && "cursor-pointer active:scale-[0.98] hover:shadow-md"
      )}
      onClick={() => onEdit && onEdit(quota)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onEdit && onEdit(quota)
        }
      }}
    >
      <div className="flex items-start justify-between gap-4">
        
        {/* Contact Info & Year */}
        <div className="flex flex-1 items-start gap-3">
          {/* Círculo das Iniciais (Selo do Sistema de Design) */}
          <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-primary-500/80 bg-transparent text-xs font-black tracking-tight text-primary-700">
            {initials || 'AP'}
          </div>
          
          <div className="flex flex-col overflow-hidden">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="truncate font-bold text-foreground leading-tight">
                {contactName}
              </span>
            </div>

            {schoolDetails && (
              <span className="mt-0.5 text-xs text-secondary-600 font-medium truncate">
                {schoolDetails}
              </span>
            )}
            
            <div className="mt-1.5 flex items-center gap-2 flex-wrap">
              <span className="rounded-md bg-secondary-100 px-1.5 py-0.5 text-xs font-bold uppercase tracking-wider text-secondary-700">
                Quota {formatSchoolYear(quota.year)}
              </span>
              <span className="text-sm font-black text-foreground tabular-nums">
                {Number(quota.amount).toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' })}
              </span>
            </div>
          </div>
        </div>

        {/* Status Badge */}
        <div className="flex shrink-0 flex-col items-end">
          {isPaid ? (
            <div className="flex items-center gap-1 rounded-full bg-green-100/90 px-2.5 py-1 text-xs font-bold text-green-800">
              <CheckCircle2 className="h-3.5 w-3.5 text-green-700" />
              Pago
            </div>
          ) : (
            <div className="flex items-center gap-1 rounded-full bg-amber-100/90 px-2.5 py-1 text-xs font-bold text-amber-800">
              <Clock className="h-3.5 w-3.5 text-amber-700" />
              Pendente
            </div>
          )}
        </div>
      </div>

      {/* Details Row (Payment Method / Date / Account) */}
      {(isPaid && (quota.paid_date || quota.payment_method || quota.account)) && (
        <div className="mt-2 flex flex-col gap-1 border-t border-warm-100 pt-3 text-xs text-secondary-600">
          <div className="flex justify-between items-center flex-wrap gap-1">
            {quota.paid_date && (
              <span>Pago a: {format(parseISO(quota.paid_date), "d 'de' MMMM yyyy", { locale: pt })}</span>
            )}
            <div className="flex items-center gap-2">
              {quota.account && (
                <span className="inline-flex items-center gap-1 font-medium text-secondary-700 rounded bg-warm-100 px-1.5 py-0.5">
                  {quota.account === 'caixa' ? (
                    <>
                      <Coins className="h-3 w-3 text-amber-600" />
                      Caixa
                    </>
                  ) : (
                    <>
                      <Landmark className="h-3 w-3 text-blue-600" />
                      Banco
                    </>
                  )}
                </span>
              )}
              {quota.payment_method && (
                <span className="capitalize">{quota.payment_method}</span>
              )}
            </div>
          </div>
        </div>
      )}
      
      {quota.receipt_url && (
        <div className="mt-1 flex">
          <a
            href={quota.receipt_url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-1 text-xs font-medium text-primary-600 hover:text-primary-700"
          >
            <FileText className="h-3.5 w-3.5" />
            Ver Recibo
          </a>
        </div>
      )}
    </div>
  )
}
