import { useState, useMemo } from 'react'
import {
  Plus,
  Search,
  ClipboardList,
  CheckCircle2,
  Archive,
} from 'lucide-react'
import {
  useForms,
  useCreateForm,
  useUpdateForm,
  useDeleteForm,
} from '@/features/forms/api/use-forms'
import { FormCard } from '@/features/forms/components/form-card'
import { FormModal } from '@/features/forms/components/form-modal'
import type { AppForm, FormStatus } from '@/features/forms/types'
import { useToast } from '@/components/ui/toast'
import { usePermissions } from '@/hooks/use-permissions'
import { cn } from '@/lib/utils'

export default function FormsPage() {
  const { data: forms = [], isLoading } = useForms()
  const createMutation = useCreateForm()
  const updateMutation = useUpdateForm()
  const deleteMutation = useDeleteForm()
  const { toast } = useToast()
  const { canWrite } = usePermissions()
  const canEditForms = canWrite('contacts') // general write access

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingForm, setEditingForm] = useState<AppForm | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | FormStatus>('all')

  // Extract all unique categories present in existing forms
  const existingCategories = useMemo(() => {
    const set = new Set<string>()
    forms.forEach((f) => {
      if (f.category) set.add(f.category)
    })
    return Array.from(set)
  }, [forms])

  // Filtered forms
  const filteredForms = useMemo(() => {
    return forms.filter((form) => {
      // Category filter
      if (selectedCategory !== 'all' && form.category !== selectedCategory) {
        return false
      }

      // Status filter
      if (statusFilter !== 'all' && form.status !== statusFilter) {
        return false
      }

      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim()
        const matchesTitle = form.title.toLowerCase().includes(q)
        const matchesDesc = form.description?.toLowerCase().includes(q) || false
        const matchesCat = form.category.toLowerCase().includes(q)
        const matchesUrl = form.url.toLowerCase().includes(q)
        return matchesTitle || matchesDesc || matchesCat || matchesUrl
      }

      return true
    })
  }, [forms, selectedCategory, statusFilter, searchQuery])

  // Count forms in use vs archived
  const inUseCount = useMemo(
    () => forms.filter((f) => f.status === 'em_uso').length,
    [forms]
  )
  const archivedCount = useMemo(
    () => forms.filter((f) => f.status === 'arquivado').length,
    [forms]
  )

  const handleModalSubmit = async (data: {
    title: string
    url: string
    description?: string
    category: string
    status: FormStatus
  }) => {
    try {
      if (editingForm) {
        await updateMutation.mutateAsync({
          id: editingForm.id,
          ...data,
        })
        toast.success('Formulário atualizado com sucesso!')
      } else {
        await createMutation.mutateAsync(data)
        toast.success('Formulário guardado com sucesso!')
      }
      setIsModalOpen(false)
      setEditingForm(null)
    } catch (err: any) {
      console.error('Falha ao gravar formulário:', err)
      toast.error('Erro ao guardar o formulário.')
    }
  }

  const handleStatusChange = async (id: string, newStatus: FormStatus) => {
    try {
      await updateMutation.mutateAsync({ id, status: newStatus })
      toast.success(
        newStatus === 'em_uso'
          ? 'Formulário marcado como Em Uso!'
          : 'Formulário arquivado com sucesso!'
      )
    } catch (err: any) {
      console.error('Falha ao atualizar estado:', err)
      toast.error('Erro ao atualizar estado do formulário.')
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteMutation.mutateAsync(id)
      toast.success('Formulário eliminado com sucesso!')
    } catch (err: any) {
      console.error('Falha ao eliminar formulário:', err)
      toast.error('Erro ao eliminar formulário.')
    }
  }

  const handleOpenEdit = (form: AppForm) => {
    setEditingForm(form)
    setIsModalOpen(true)
  }

  const handleOpenNew = () => {
    setEditingForm(null)
    setIsModalOpen(true)
  }

  return (
    <div className="relative min-h-[calc(100vh-4rem)] bg-background pb-16">
      {/* Sticky Header */}
      <div className="sticky top-0 z-20 bg-background/95 pb-2.5 pt-3.5 backdrop-blur supports-[backdrop-filter]:bg-background/80 border-b border-warm-200/60">
        <div className="px-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-black text-foreground">Forms</h1>
            <p className="text-xs text-muted">Questionários e inquéritos da APMEE</p>
          </div>

          <button
            type="button"
            onClick={handleOpenNew}
            className="flex items-center gap-1.5 rounded-full bg-primary-500 px-3.5 py-2 text-xs font-bold text-white shadow-sm hover:bg-primary-600 active:scale-95 transition-all"
          >
            <Plus className="h-4 w-4" />
            <span>Novo</span>
          </button>
        </div>

        {/* Search Bar */}
        <div className="px-4 mt-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Pesquisar por nome, link, descrição ou categoria..."
              className="w-full rounded-[var(--radius-button)] border border-warm-200 bg-surface pl-9 pr-4 py-2 text-xs text-foreground placeholder:text-muted focus:border-primary-400 focus:outline-none focus:ring-1 focus:ring-primary-400"
            />
          </div>
        </div>

        {/* Status Filter Tabs */}
        <div className="px-4 mt-2.5 flex items-center gap-2">
          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className={cn(
              'rounded-full px-3 py-1 text-xs font-semibold transition-all',
              statusFilter === 'all'
                ? 'bg-secondary-900 text-white shadow-xs'
                : 'bg-warm-100 text-secondary-600 hover:bg-warm-200'
            )}
          >
            Todos ({forms.length})
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('em_uso')}
            className={cn(
              'flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold transition-all',
              statusFilter === 'em_uso'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-warm-100 text-emerald-800 hover:bg-warm-200'
            )}
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>Em Uso ({inUseCount})</span>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('arquivado')}
            className={cn(
              'flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold transition-all',
              statusFilter === 'arquivado'
                ? 'bg-warm-600 text-white shadow-xs'
                : 'bg-warm-100 text-secondary-600 hover:bg-warm-200'
            )}
          >
            <Archive className="h-3.5 w-3.5" />
            <span>Arquivados ({archivedCount})</span>
          </button>
        </div>

        {/* Horizontal Category Chips */}
        {existingCategories.length > 0 && (
          <div className="px-4 mt-2.5 flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
            <button
              type="button"
              onClick={() => setSelectedCategory('all')}
              className={cn(
                'shrink-0 rounded-md px-2.5 py-1 text-[11px] font-semibold transition-colors',
                selectedCategory === 'all'
                  ? 'bg-primary-100 text-primary-800 font-bold border border-primary-300'
                  : 'bg-surface text-secondary-600 border border-warm-200 hover:bg-warm-50'
              )}
            >
              Todas as Categorias
            </button>
            {existingCategories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={cn(
                  'shrink-0 rounded-md px-2.5 py-1 text-[11px] font-semibold transition-colors',
                  selectedCategory === cat
                    ? 'bg-primary-100 text-primary-800 font-bold border border-primary-300'
                    : 'bg-surface text-secondary-600 border border-warm-200 hover:bg-warm-50'
                )}
              >
                {cat}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Content Area */}
      <div className="px-4 mt-4">
        {isLoading ? (
          <div className="flex flex-col gap-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 w-full animate-pulse rounded-2xl bg-warm-100" />
            ))}
          </div>
        ) : filteredForms.length === 0 ? (
          <div className="mt-12 flex flex-col items-center justify-center text-center p-6 rounded-2xl border border-dashed border-warm-300 bg-surface">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-teal-50 text-teal-700 mb-3 border border-teal-200/60">
              <ClipboardList className="h-6 w-6" />
            </div>
            <h3 className="text-sm font-bold text-foreground">Nenhum formulário encontrado</h3>
            <p className="mt-1 text-xs text-muted max-w-xs">
              {searchQuery || selectedCategory !== 'all' || statusFilter !== 'all'
                ? 'Nenhum formulário corresponde aos filtros selecionados.'
                : 'Guarde links para formulários Microsoft Forms, questionários e inquéritos da associação.'}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {filteredForms.map((form) => (
              <FormCard
                key={form.id}
                form={form}
                onStatusChange={handleStatusChange}
                onEdit={handleOpenEdit}
                onDelete={handleDelete}
                canEdit={canEditForms}
              />
            ))}
          </div>
        )}
      </div>

      {/* Form Modal (Create / Edit) */}
      {isModalOpen && (
        <FormModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false)
            setEditingForm(null)
          }}
          onSubmit={handleModalSubmit}
          initialData={editingForm}
          existingCategories={existingCategories}
        />
      )}
    </div>
  )
}
