import { Phone, Mail, MessageCircle, MoreVertical } from 'lucide-react'
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
  const metadata = contact.metadata as Record<string, string>
  const tags = []
  if (contact.category === 'pai' && metadata.educando) {
    tags.push(`Educando: ${metadata.educando}`)
  }
  if (metadata.turma) {
    tags.push(`Turma: ${metadata.turma}`)
  }
  if (contact.category === 'professor' && metadata.disciplina) {
    tags.push(metadata.disciplina)
  }

  return (
    <div className="flex flex-col gap-3 rounded-[var(--radius-card)] border border-warm-200 bg-surface p-4 shadow-sm transition-all hover:shadow-md">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          {/* Avatar / Initials */}
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary-100 font-semibold text-primary-700">
            {contact.avatar_url ? (
              <img src={contact.avatar_url} alt={contact.name} className="h-full w-full rounded-full object-cover" />
            ) : (
              getInitials(contact.name)
            )}
          </div>

          {/* Info */}
          <div>
            <h3 className="font-semibold text-foreground">{contact.name}</h3>
            {tags.length > 0 && (
              <div className="mt-1 flex flex-wrap gap-1">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-warm-100 px-2 py-0.5 text-[10px] font-medium text-secondary-600"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Options Button */}
        {onEdit && (
          <button
            onClick={() => onEdit(contact)}
            className="rounded-full p-2 text-muted transition-colors hover:bg-warm-50 hover:text-foreground"
          >
            <MoreVertical className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Action Buttons */}
      <div className="mt-2 flex items-center gap-2 border-t border-warm-100 pt-3">
        <a
          href={hasPhone ? `tel:${contact.phone}` : undefined}
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
          className={cn(
            'flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-xs font-medium transition-colors',
            hasWhatsapp
              ? 'bg-[#E8F5E9] text-[#2E7D32] hover:bg-[#C8E6C9]'
              : 'pointer-events-none text-muted opacity-50'
          )}
        >
          <MessageCircle className="h-3.5 w-3.5" />
          WhatsApp
        </a>

        <a
          href={hasEmail ? `mailto:${contact.email}` : undefined}
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
