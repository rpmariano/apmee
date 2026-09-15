import { useContacts } from '../api/use-contacts'
import { ContactCard } from './contact-card'
import type { ContactCategory, Contact } from '@/types/database'

interface ContactListProps {
  category: ContactCategory | 'all'
  onEditContact?: (contact: Contact) => void
}

export function ContactList({ category, onEditContact }: ContactListProps) {
  const { data: contacts, isLoading, error } = useContacts(category)

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4 py-8">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-32 w-full animate-pulse rounded-[var(--radius-card)] bg-warm-100" />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="py-8 text-center text-sm text-red-500">
        Ocorreu um erro ao carregar os contactos.
      </div>
    )
  }

  if (!contacts || contacts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-warm-100">
          <svg className="h-8 w-8 text-secondary-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
        </div>
        <p className="mt-4 text-sm font-medium text-foreground">Sem contactos</p>
        <p className="mt-1 text-xs text-muted">Ainda não existem contactos nesta categoria.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 py-4">
      {contacts.map((contact) => (
        <ContactCard key={contact.id} contact={contact} onEdit={onEditContact} />
      ))}
    </div>
  )
}
