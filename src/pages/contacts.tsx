import { useState } from 'react'
import { Plus, Search } from 'lucide-react'
import { CONTACT_CATEGORIES, CONTACT_CATEGORY_LABELS } from '@/lib/constants'
import { ContactList } from '@/features/contacts/components/contact-list'
import { ContactForm } from '@/features/contacts/components/contact-form'
import { useCreateContact, useUpdateContact, useDeleteContact } from '@/features/contacts/api/use-contacts'
import { usePermissions } from '@/hooks/use-permissions'
import type { Contact, ContactCategory } from '@/types/database'
import { CustomDialog } from '@/components/ui/custom-dialog'
import { useToast } from '@/components/ui/toast'
import { getFriendlyErrorMessage } from '@/lib/error-utils'
import { MenuAlerts } from '@/components/ui/menu-alerts'
import { cn } from '@/lib/utils'

type FilterValue = ContactCategory | 'all'

const tabs: { value: FilterValue; label: string }[] = [
  { value: 'all', label: 'Todos' },
  ...Object.values(CONTACT_CATEGORIES).map((cat) => ({
    value: cat as ContactCategory,
    label: CONTACT_CATEGORY_LABELS[cat] || (cat.charAt(0).toUpperCase() + cat.slice(1) + 's'),
  })),
]

export default function ContactsPage() {
  const [activeTab, setActiveTab] = useState<FilterValue>('all')
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingContact, setEditingContact] = useState<Contact | undefined>()
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const createMutation = useCreateContact()
  const updateMutation = useUpdateContact()
  const deleteMutation = useDeleteContact()
  const { toast } = useToast()
  const { canWrite } = usePermissions()
  const canWriteContacts = canWrite('contacts')

  const handleEditContact = (contact: Contact) => {
    setEditingContact(contact)
    setIsFormOpen(true)
  }

  const handleCloseForm = () => {
    setIsFormOpen(false)
    setEditingContact(undefined)
  }

  const handleSubmitForm = async (data: Partial<Contact>) => {
    try {
      if (editingContact) {
        await updateMutation.mutateAsync({ id: editingContact.id, ...data })
        toast.success('Contacto atualizado com sucesso!')
      } else {
        await createMutation.mutateAsync(data as any)
        toast.success('Contacto criado com sucesso!')
      }
      handleCloseForm()
    } catch (error: any) {
      console.error('Failed to save contact:', error)
      setErrorMessage(getFriendlyErrorMessage(error, 'Erro ao guardar o contacto. Tente novamente.'))
    }
  }

  const handleDeleteContact = async (id: string) => {
    try {
      await deleteMutation.mutateAsync(id)
      toast.success('Contacto eliminado com sucesso!')
      handleCloseForm()
    } catch (error: any) {
      console.error('Failed to delete contact:', error)
      setErrorMessage(getFriendlyErrorMessage(error, 'Erro ao eliminar o contacto. Tente novamente.'))
    }
  }

  return (
    <div className="relative min-h-[calc(100vh-4rem)] bg-background">
      {/* Header & Tabs - Sticky */}
      <div className="sticky top-0 z-10 bg-background/95 pb-2 pt-6 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="px-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-foreground">Contactos</h1>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => {
                  const next = !isSearchOpen
                  setIsSearchOpen(next)
                  if (!next) setSearchQuery('')
                }}
                aria-label={isSearchOpen ? "Fechar pesquisa" : "Abrir pesquisa"}
                className={cn(
                  "rounded-full p-2 transition-colors hover:bg-warm-100",
                  isSearchOpen ? "bg-warm-200 text-primary-600" : "text-muted hover:text-foreground"
                )}
              >
                <Search className="h-5 w-5" />
              </button>
              <MenuAlerts />
            </div>
          </div>

          {/* Search Bar (Expandable) */}
          {isSearchOpen && (
            <div className="mt-3 animate-in fade-in slide-in-from-top-2">
              <input
                type="search"
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                aria-label="Pesquisar contactos"
                placeholder="Pesquisar por nome, turma, educando ou email..."
                className="w-full rounded-[var(--radius-button)] border border-warm-200 bg-surface px-4 py-2 text-sm text-foreground placeholder:text-muted focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-200"
              />
            </div>
          )}
        </div>

        {/* Tabs - Horizontal Scroll */}
        <div className="mt-4 flex gap-2 overflow-x-auto px-4 pb-2 scrollbar-hide">
          {tabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={cn(
                'whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium transition-colors',
                activeTab === tab.value
                  ? 'bg-secondary-900 text-white shadow-sm'
                  : 'bg-warm-100 text-secondary-600 hover:bg-warm-200'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* List Content */}
      <div className="px-4">
        <ContactList category={activeTab} onEditContact={handleEditContact} searchQuery={searchQuery} />
      </div>

      {/* Floating Action Button (FAB) */}
      <button
        type="button"
        aria-label="Criar novo contacto"
        className="fixed bottom-24 right-6 min-[430px]:right-[calc(50%-215px+1.5rem)] z-20 flex h-14 w-14 items-center justify-center rounded-full bg-primary-400 text-white shadow-lg transition-transform hover:scale-105 hover:bg-primary-500 active:scale-95"
        onClick={() => setIsFormOpen(true)}
      >
        <Plus className="h-6 w-6" />
      </button>

      {/* Form Modal/Slide-over */}
      {isFormOpen && (
        <ContactForm
          contact={editingContact}
          initialCategory={activeTab !== 'all' ? activeTab : 'pai'}
          onClose={handleCloseForm}
          onSubmit={handleSubmitForm}
          onDelete={canWriteContacts ? handleDeleteContact : undefined}
          isLoading={createMutation.isPending || updateMutation.isPending || deleteMutation.isPending}
        />
      )}

      <CustomDialog
        isOpen={!!errorMessage}
        title="Erro ao guardar contacto"
        description={errorMessage || ''}
        variant="danger"
        confirmLabel="OK"
        onConfirm={() => setErrorMessage(null)}
      />
    </div>
  )
}

