import { useState, useMemo } from 'react'
import {
  Plus,
  Search,
  FolderOpen,
  CheckCircle2,
  Archive,
} from 'lucide-react'
import {
  useDocuments,
  useCreateDocument,
  useUpdateDocument,
  useDeleteDocument,
} from '@/features/documents/api/use-documents'
import { DocumentCard } from '@/features/documents/components/document-card'
import { DocumentUploadModal } from '@/features/documents/components/document-upload-modal'
import type { DocumentStatus } from '@/features/documents/types'
import { useToast } from '@/components/ui/toast'
import { usePermissions } from '@/hooks/use-permissions'
import { cn } from '@/lib/utils'

export default function DocumentsPage() {
  const { data: documents = [], isLoading } = useDocuments()
  const createMutation = useCreateDocument()
  const updateMutation = useUpdateDocument()
  const deleteMutation = useDeleteDocument()
  const { toast } = useToast()
  const { canWrite } = usePermissions()
  const canEditDocuments = canWrite('contacts') // or general nivel_1 / superadmin

  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | DocumentStatus>('all')

  // Extract all unique categories present in existing documents
  const existingCategories = useMemo(() => {
    const set = new Set<string>()
    documents.forEach((d) => {
      if (d.category) set.add(d.category)
    })
    return Array.from(set)
  }, [documents])

  // Filtered documents
  const filteredDocuments = useMemo(() => {
    return documents.filter((doc) => {
      // Category filter
      if (selectedCategory !== 'all' && doc.category !== selectedCategory) {
        return false
      }

      // Status filter
      if (statusFilter !== 'all' && doc.status !== statusFilter) {
        return false
      }

      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim()
        const matchesTitle = doc.title.toLowerCase().includes(q)
        const matchesFile = doc.file_name.toLowerCase().includes(q)
        const matchesCat = doc.category.toLowerCase().includes(q)
        const matchesNotes = doc.notes?.toLowerCase().includes(q) || false
        return matchesTitle || matchesFile || matchesCat || matchesNotes
      }

      return true
    })
  }, [documents, selectedCategory, statusFilter, searchQuery])

  // Count documents in use vs archived
  const inUseCount = useMemo(
    () => documents.filter((d) => d.status === 'em_uso').length,
    [documents]
  )
  const archivedCount = useMemo(
    () => documents.filter((d) => d.status === 'arquivado').length,
    [documents]
  )

  const handleUploadSubmit = async (data: any) => {
    try {
      await createMutation.mutateAsync(data)
      toast.success('Documento carregado com sucesso!')
      setIsUploadModalOpen(false)
    } catch (err: any) {
      console.error('Falha ao guardar documento:', err)
      toast.error('Erro ao guardar o documento.')
    }
  }

  const handleStatusChange = async (id: string, newStatus: DocumentStatus) => {
    try {
      await updateMutation.mutateAsync({ id, status: newStatus })
      toast.success(
        newStatus === 'em_uso'
          ? 'Documento marcado como Em Uso!'
          : 'Documento arquivado com sucesso!'
      )
    } catch (err: any) {
      console.error('Falha ao atualizar estado:', err)
      toast.error('Erro ao atualizar estado do documento.')
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteMutation.mutateAsync(id)
      toast.success('Documento eliminado com sucesso!')
    } catch (err: any) {
      console.error('Falha ao eliminar documento:', err)
      toast.error('Erro ao eliminar documento.')
    }
  }

  return (
    <div className="relative min-h-[calc(100vh-4rem)] bg-background pb-16">
      {/* Sticky Header */}
      <div className="sticky top-0 z-20 bg-background/95 pb-2.5 pt-3.5 backdrop-blur supports-[backdrop-filter]:bg-background/80 border-b border-warm-200/60">
        <div className="px-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-black text-foreground">Gestão Documental</h1>
            <p className="text-xs text-muted">Arquivo e documentos oficiais da APMEE</p>
          </div>

          <button
            type="button"
            onClick={() => setIsUploadModalOpen(true)}
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
              placeholder="Pesquisar documento, categoria ou anexo..."
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
            Todos ({documents.length})
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
              <div key={i} className="h-28 w-full animate-pulse rounded-2xl bg-warm-100" />
            ))}
          </div>
        ) : filteredDocuments.length === 0 ? (
          <div className="mt-12 flex flex-col items-center justify-center text-center p-6 rounded-2xl border border-dashed border-warm-300 bg-surface">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-warm-100 text-secondary-500 mb-3">
              <FolderOpen className="h-6 w-6" />
            </div>
            <h3 className="text-sm font-bold text-foreground">Nenhum documento encontrado</h3>
            <p className="mt-1 text-xs text-muted max-w-xs">
              {searchQuery || selectedCategory !== 'all' || statusFilter !== 'all'
                ? 'Nenhum documento corresponde aos filtros selecionados.'
                : 'Ainda não foram carregados documentos para o arquivo da APMEE.'}
            </p>
            <button
              type="button"
              onClick={() => setIsUploadModalOpen(true)}
              className="mt-4 flex items-center gap-1.5 rounded-full bg-primary-500 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-primary-600 active:scale-95 transition-all"
            >
              <Plus className="h-4 w-4" />
              <span>Carregar Primeiro Documento</span>
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {filteredDocuments.map((doc) => (
              <DocumentCard
                key={doc.id}
                document={doc}
                onStatusChange={handleStatusChange}
                onDelete={handleDelete}
                canDelete={canEditDocuments}
              />
            ))}
          </div>
        )}
      </div>

      {/* Upload Modal */}
      {isUploadModalOpen && (
        <DocumentUploadModal
          isOpen={isUploadModalOpen}
          onClose={() => setIsUploadModalOpen(false)}
          onSubmit={handleUploadSubmit}
          existingCategories={existingCategories}
        />
      )}
    </div>
  )
}
