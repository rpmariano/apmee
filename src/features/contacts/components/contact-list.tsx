import { useContacts } from '../api/use-contacts'
import { ContactCard } from './contact-card'
import type { ContactCategory, Contact } from '@/types/database'

export interface ContactListProps {
  category: ContactCategory | 'all'
  onEditContact?: (contact: Contact) => void
  searchQuery?: string
  statusFilter?: 'active' | 'inactive' | 'all'
  turmaFilter?: string
  onlyMembers?: boolean
}

export function ContactList({
  category,
  onEditContact,
  searchQuery,
  statusFilter = 'active',
  turmaFilter = 'all',
  onlyMembers = false,
}: ContactListProps) {
  const { data: contacts, isLoading, error } = useContacts(category)

  const filteredContacts = (contacts || []).filter((contact) => {
    // 1. Status Filter (active / inactive / all) - default active
    const isActive = contact.is_active !== undefined
      ? contact.is_active
      : (contact.metadata as any)?.is_active !== undefined
      ? (contact.metadata as any)?.is_active
      : true

    if (statusFilter === 'active' && !isActive) return false
    if (statusFilter === 'inactive' && isActive) return false

    // 2. Associados Filter (only members)
    const isMember = contact.is_member || contact.category === 'associado'
    if (onlyMembers && !isMember) return false

    // 3. Turma Filter
    if (turmaFilter && turmaFilter !== 'all') {
      const metadata = (contact.metadata as Record<string, any>) || {}
      const rawTurmas = metadata.turmas ?? metadata.turma
      let contactTurmas: string[] = []
      if (Array.isArray(rawTurmas)) {
        contactTurmas = rawTurmas.map(String)
      } else if (typeof rawTurmas === 'string') {
        contactTurmas = rawTurmas.split(',').map((s: string) => s.trim())
      }
      const matchesTurma = contactTurmas.some(
        (t) => t.toLowerCase() === turmaFilter.toLowerCase()
      )
      if (!matchesTurma) return false
    }

    // 4. Search query
    if (!searchQuery?.trim()) return true
    const q = searchQuery.toLowerCase().trim()
    const nameMatch = contact.name?.toLowerCase().includes(q)
    const emailMatch = contact.email?.toLowerCase().includes(q)
    const phoneMatch = contact.phone?.includes(q) || contact.whatsapp?.includes(q)
    const metadata = (contact.metadata as Record<string, any>) || {}
    const educandoMatch = metadata.educando?.toLowerCase().includes(q)
    const turmaStr = typeof metadata.turma === 'string'
      ? metadata.turma
      : Array.isArray(metadata.turmas)
      ? metadata.turmas.join(' ')
      : Array.isArray(metadata.turma)
      ? metadata.turma.join(' ')
      : ''
    const turmaMatch = turmaStr.toLowerCase().includes(q)
    const disciplinaMatch = metadata.disciplina?.toLowerCase().includes(q)
    const categoryMatch = q === 'ee' && contact.category === 'pai'
    return nameMatch || emailMatch || phoneMatch || educandoMatch || turmaMatch || disciplinaMatch || categoryMatch
  })

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

  if (filteredContacts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-warm-100">
          <svg className="h-8 w-8 text-secondary-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
        </div>
        <p className="mt-4 text-sm font-medium text-foreground">
          {searchQuery ? 'Nenhum contacto encontrado' : 'Sem contactos'}
        </p>
        <p className="mt-1 text-xs text-muted">
          {searchQuery
            ? `Não foram encontrados contactos correspondentes a "${searchQuery}".`
            : statusFilter !== 'all' || turmaFilter !== 'all' || onlyMembers
            ? 'Não foram encontrados contactos correspondentes aos filtros selecionados.'
            : 'Ainda não existem contactos nesta categoria.'}
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 py-4">
      {filteredContacts.map((contact) => (
        <ContactCard key={contact.id} contact={contact} onEdit={onEditContact} />
      ))}
    </div>
  )
}
