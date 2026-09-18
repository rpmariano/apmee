import { Phone, Mail, MessageCircle } from 'lucide-react'
import type { Contact } from '@/types/database'
import { cn } from '@/lib/utils'

interface ContactCardProps {
  contact: Contact
  onEdit?: (contact: Contact) => void
}

/**
 * Gets the initials of a name (up to 2 characters)
 */
function getInitials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0].toUpperCase())
    .join('')
}

export function ContactCard({ contact, onEdit }: ContactCardProps) {
  const hasPhone = !!contact.phone
  const hasWhatsapp = !!contact.whatsapp
  const hasEmail = !!contact.email

  // Extract dynamic metadata based on category
  const metadata = (contact.metadata as Record<string, any>) || {}
  const tags = []
  if (contact.category === 'pai' && metadata.educando) {
    const isMultipleEducandos = metadata.educando.includes(',') || metadata.educando.includes(' e ')
    tags.push(`${isMultipleEducandos ? 'Educandos' : 'Educando'}: ${metadata.educando}`)
  }
  const turmaVal = metadata.turma || (Array.isArray(metadata.turmas) ? metadata.turmas.join(', ') : '')
  if (turmaVal) {
    const isMultipleTurmas = turmaVal.includes(',') || (Array.isArray(metadata.turmas) && metadata.turmas.length > 1)
    tags.push(`${isMultipleTurmas ? 'Turmas' : 'Turma'}: ${turmaVal}`)
  }
  if (contact.category === 'professor' && metadata.disciplina) {
    tags.push(metadata.disciplina)
  }

  const isActive = contact.is_active !== undefined
    ? contact.is_active
    : (contact.metadata as any)?.is_active !== undefined
    ? (contact.metadata as any)?.is_active
    : true
  const isMember = contact.is_member || contact.category === 'associado'

  return (
    <div 
      className={cn(
        "flex flex-col gap-3 rounded-[var(--radius-card)] border border-warm-200 bg-surface p-4 shadow-sm transition-all hover:shadow-md",
        !isActive && "opacity-80 bg-warm-50/60 border-dashed",
        onEdit && "cursor-pointer active:scale-[0.98]"
      )}
      onClick={() => onEdit && onEdit(contact)}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {/* Avatar / Initials */}
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary-100 font-semibold text-primary-700">
            {contact.avatar_url ? (
              <img src={contact.avatar_url} alt={contact.name} className="h-full w-full rounded-full object-cover" />
            ) : (
              getInitials(contact.name)
            )}
          </div>

          {/* Info */}
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-foreground truncate">{contact.name}</h3>
            {tags.length > 0 && (
              <div className="mt-1 flex flex-wrap gap-1">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-warm-100 px-2 py-0.5 text-xs font-medium text-secondary-600"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Status / Membership Badges */}
        <div className="flex flex-col items-end gap-1 shrink-0">
          {!isActive && (
            <span className="rounded-full bg-red-50 border border-red-200 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-red-700">
              Inativo
            </span>
          )}
          {isMember && (
            <span className="rounded-full bg-amber-50 border border-amber-200 px-2 py-0.5 text-[10px] font-bold text-amber-800">
              Associado
            </span>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-2 flex items-center gap-2 border-t border-warm-100 pt-3">
        <a
          href={hasPhone ? `tel:${contact.phone}` : undefined}
          onClick={(e) => e.stopPropagation()}
          className={cn(
            'flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-xs font-medium transition-colors',
            hasPhone
              ? 'bg-secondary-50 text-secondary-700 hover:bg-secondary-100'
              : 'pointer-events-none text-muted opacity-50'
          )}
        >
          <Phone className="h-3.5 w-3.5" />
          Ligar
        </a>
        
        <a
          href={hasWhatsapp ? `https://wa.me/${contact.whatsapp?.replace(/\D/g, '')}` : undefined}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className={cn(
            'flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-xs font-medium transition-colors',
            hasWhatsapp
              ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
              : 'pointer-events-none text-muted opacity-50'
          )}
        >
          <MessageCircle className="h-3.5 w-3.5" />
          WhatsApp
        </a>

        <a
          href={hasEmail ? `mailto:${contact.email}` : undefined}
          onClick={(e) => e.stopPropagation()}
          className={cn(
            'flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-xs font-medium transition-colors',
            hasEmail
              ? 'bg-primary-50 text-primary-700 hover:bg-primary-100'
              : 'pointer-events-none text-muted opacity-50'
          )}
        >
          <Mail className="h-3.5 w-3.5" />
          Email
        </a>
      </div>
    </div>
  )
}
