import { useState, useMemo, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Plus, Search, ChevronDown, Star, RotateCcw, ArrowLeft } from 'lucide-react'
import { ContactList } from '@/features/contacts/components/contact-list'
import { ContactForm } from '@/features/contacts/components/contact-form'
import { useContacts, useCreateContact, useUpdateContact, useDeleteContact } from '@/features/contacts/api/use-contacts'
import { usePermissions } from '@/hooks/use-permissions'
import type { Contact, ContactCategory } from '@/types/database'
import { TURMA_OPTIONS } from '@/lib/constants'
import { CustomDialog } from '@/components/ui/custom-dialog'
import { useToast } from '@/components/ui/toast'
import { getFriendlyErrorMessage } from '@/lib/error-utils'
import { MenuAlerts } from '@/components/ui/menu-alerts'
import { cn } from '@/lib/utils'

type FilterValue = ContactCategory | 'all'

const tabs: { value: FilterValue; label: string }[] = [
  { value: 'all', label: 'Todos' },
  { value: 'pai', label: 'EE' },
  { value: 'professor', label: 'Professores' },
  { value: 'parceiro', label: 'Parceiros' },
  { value: 'fornecedor', label: 'Fornecedores' },
]

export default function ContactsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const isNew = searchParams.get('new') === '1' || searchParams.get('new') === 'true'
  const [activeTab, setActiveTab] = useState<FilterValue>('all')
  const [statusFilter, setStatusFilter] = useState<'active' | 'inactive' | 'all'>('active')
  const [turmaFilter, setTurmaFilter] = useState<string>('all')
  const [onlyMembers, setOnlyMembers] = useState<boolean>(false)

  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingContact, setEditingContact] = useState<Contact | undefined>()
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const { data: allContacts } = useContacts('all')
  const createMutation = useCreateContact()
  const updateMutation = useUpdateContact()
  const deleteMutation = useDeleteContact()
  const { toast } = useToast()
  const { canWrite } = usePermissions()
  const canWriteContacts = canWrite('contacts')

  const availableTurmas = useMemo(() => {
    const set = new Set(TURMA_OPTIONS.map((o) => o.value))
    if (allContacts) {
      allContacts.forEach((c) => {
        const meta = (c.metadata as Record<string, any>) || {}
        const raw = meta.turmas ?? meta.turma
        if (Array.isArray(raw)) {
          raw.forEach((t) => t && set.add(String(t).trim()))
        } else if (typeof raw === 'string') {
          raw.split(',').forEach((t) => t && set.add(t.trim()))
        }
      })
    }
    return Array.from(set)
  }, [allContacts])

  useEffect(() => {
    if (isNew && !isFormOpen && !editingContact) {
      setIsFormOpen(true)
    }
  }, [isNew, isFormOpen, editingContact])

  const handleEditContact = (contact: Contact) => {
    setEditingContact(contact)
    setIsFormOpen(true)
  }

  const handleCloseForm = () => {
    setIsFormOpen(false)
    setEditingContact(undefined)
    if (searchParams.get('new')) {
      const nextParams = new URLSearchParams(searchParams)
      nextParams.delete('new')
      setSearchParams(nextParams, { replace: true })
    }
  }

  const handleSubmitForm = async (data: Partial<Contact>) => {
    try {
      if (editingContact) {
        try {
          await updateMutation.mutateAsync({ id: editingContact.id, ...data })
        } catch (err: any) {
          if (err?.code === '42703' || err?.message?.includes('column') || err?.message?.includes('is_active')) {
            const { is_active, ...fallbackData } = data
            await updateMutation.mutateAsync({ id: editingContact.id, ...fallbackData })
          } else {
            throw err
          }
        }
        toast.success('Contacto atualizado com sucesso!')
      } else {
        try {
          await createMutation.mutateAsync(data as any)
        } catch (err: any) {
          if (err?.code === '42703' || err?.message?.includes('column') || err?.message?.includes('is_active')) {
            const { is_active, ...fallbackData } = data
            await createMutation.mutateAsync(fallbackData as any)
          } else {
            throw err
          }
        }
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
      <div className="sticky top-0 z-10 bg-background/95 pb-1 pt-4 backdrop-blur supports-[backdrop-filter]:bg-background/80 border-b border-warm-100">
        <div className="px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Link
                to="/menu"
                aria-label="Voltar ao Menu"
                className="flex h-9 w-9 items-center justify-center rounded-full text-secondary-600 hover:bg-warm-100 hover:text-foreground active:scale-95 transition-all -ml-1"
              >
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <h1 className="text-xl font-bold text-foreground">Contactos</h1>
            </div>
            <div className="flex items-center gap-1.5">
              {canWriteContacts && (
                <button
                  type="button"
                  onClick={() => setIsFormOpen(true)}
                  aria-label="+ Criar novo contacto"
                  className="flex items-center gap-1 rounded-full bg-primary-500 px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-primary-600 transition-all active:scale-95 shrink-0"
                >
                  <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
                  <span>Criar</span>
                </button>
              )}
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
            <div className="mt-2.5 animate-in fade-in slide-in-from-top-2">
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
        <div className="mt-2.5 flex gap-1.5 overflow-x-auto px-4 pb-2.5 scrollbar-hide">
          {tabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={cn(
                'whitespace-nowrap rounded-full px-3.5 py-1 text-xs sm:text-sm font-medium transition-colors',
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

      {/* Secondary Filters Bar (Scrolls naturally with content) */}
      <div className="flex flex-wrap items-center gap-2 px-4 pt-3 pb-2 text-xs">
        {/* Status Filter (Ativos por defeito) */}
        <div className="relative inline-flex items-center">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            aria-label="Filtrar por estado"
            className={cn(
              'appearance-none rounded-full border px-3 py-1.5 pr-7 text-xs font-semibold focus:outline-none focus:ring-1 transition-all cursor-pointer',
              statusFilter === 'active'
                ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                : statusFilter === 'inactive'
                ? 'border-red-300 bg-red-50 text-red-800'
                : 'border-warm-200 bg-surface text-secondary-700'
            )}
          >
            <option value="active">Estado: Ativos</option>
            <option value="inactive">Estado: Inativos</option>
            <option value="all">Estado: Todos</option>
          </select>
          <ChevronDown className="pointer-events-none absolute right-2 h-3.5 w-3.5 opacity-60" />
        </div>

        {/* Turma Filter */}
        <div className="relative inline-flex items-center">
          <select
            value={turmaFilter}
            onChange={(e) => setTurmaFilter(e.target.value)}
            aria-label="Filtrar por turma"
            className={cn(
              'appearance-none rounded-full border px-3 py-1.5 pr-7 text-xs font-semibold focus:outline-none focus:ring-1 transition-all cursor-pointer',
              turmaFilter !== 'all'
                ? 'border-primary-400 bg-primary-50 text-primary-800'
                : 'border-warm-200 bg-surface text-secondary-700'
            )}
          >
            <option value="all">Turma: Todas</option>
            {availableTurmas.map((t) => (
              <option key={t} value={t}>
                Turma: {t}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2 h-3.5 w-3.5 opacity-60" />
        </div>

        {/* Associados Filter Toggle */}
        <button
          type="button"
          onClick={() => setOnlyMembers((prev) => !prev)}
          className={cn(
            'flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer',
            onlyMembers
              ? 'border-amber-400 bg-amber-50 text-amber-900 shadow-xs ring-1 ring-amber-300'
              : 'border-warm-200 bg-surface text-secondary-700 hover:bg-warm-100'
          )}
        >
          <Star className={cn('h-3.5 w-3.5', onlyMembers ? 'fill-amber-500 text-amber-500' : 'text-secondary-400')} />
          <span>Só Associados</span>
        </button>

        {/* Clear Filters (if modified from default) */}
        {(statusFilter !== 'active' || turmaFilter !== 'all' || onlyMembers) && (
          <button
            type="button"
            onClick={() => {
              setStatusFilter('active')
              setTurmaFilter('all')
              setOnlyMembers(false)
            }}
            className="flex items-center gap-1 rounded-full px-2 py-1 text-xs text-muted hover:text-foreground transition-colors cursor-pointer"
            title="Repor filtros por defeito"
          >
            <RotateCcw className="h-3 w-3" />
            <span>Limpar</span>
          </button>
        )}
      </div>

      {/* List Content */}
      <div className="px-4">
        <ContactList 
          category={activeTab} 
          onEditContact={handleEditContact} 
          searchQuery={searchQuery}
          statusFilter={statusFilter}
          turmaFilter={turmaFilter}
          onlyMembers={onlyMembers}
        />
      </div>

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

