import { useState, useMemo, useEffect } from 'react'
import {
  Plus,
  Search,
  FolderOpen,
  FolderPlus,
  ArrowLeft,
  CheckCircle2,
  Archive,
  FileText,
  Folder as FolderIcon,
  X,
} from 'lucide-react'
import {
  useDocuments,
  useCreateDocument,
  useUpdateDocument,
  useDeleteDocument,
} from '@/features/documents/api/use-documents'
import { DocumentCard } from '@/features/documents/components/document-card'
import { FolderCard } from '@/features/documents/components/folder-card'
import { DocumentUploadModal } from '@/features/documents/components/document-upload-modal'
import {
  type DocumentStatus,
  DEFAULT_DOCUMENT_CATEGORIES,
  isRootFolder,
  ROOT_CATEGORY,
} from '@/features/documents/types'
import { useToast } from '@/components/ui/toast'
import { usePermissions } from '@/hooks/use-permissions'
import { cn } from '@/lib/utils'

const CUSTOM_FOLDERS_STORAGE_KEY = 'apmee_document_custom_folders'

function getStoredCustomFolders(): string[] {
  try {
    const raw = localStorage.getItem(CUSTOM_FOLDERS_STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveStoredCustomFolders(folders: string[]) {
  try {
    localStorage.setItem(CUSTOM_FOLDERS_STORAGE_KEY, JSON.stringify(folders))
  } catch {
    // ignore
  }
}

export default function DocumentsPage() {
  const { data: documents = [], isLoading } = useDocuments()
  const createMutation = useCreateDocument()
  const updateMutation = useUpdateDocument()
  const deleteMutation = useDeleteDocument()
  const { toast } = useToast()
  const { canWrite } = usePermissions()
  const canEditDocuments = canWrite('contacts') // or general nivel_1 / superadmin

  const [currentFolder, setCurrentFolder] = useState<string | null>(null)
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)
  const [isNewFolderModalOpen, setIsNewFolderModalOpen] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | DocumentStatus>('all')
  const [customFolders, setCustomFolders] = useState<string[]>(getStoredCustomFolders)

  useEffect(() => {
    saveStoredCustomFolders(customFolders)
  }, [customFolders])

  // All unique folder names: default suggestions + custom created + any existing in documents
  const allFolders = useMemo(() => {
    const set = new Set<string>([...DEFAULT_DOCUMENT_CATEGORIES, ...customFolders])
    documents.forEach((d) => {
      if (!isRootFolder(d.category)) {
        set.add(d.category.trim())
      }
    })
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'pt'))
  }, [documents, customFolders])

  // Filter documents by status
  const statusFilteredDocuments = useMemo(() => {
    return documents.filter((doc) => {
      if (statusFilter !== 'all' && doc.status !== statusFilter) {
        return false
      }
      return true
    })
  }, [documents, statusFilter])

  // Count documents in use vs archived globally
  const totalInUseCount = useMemo(
    () => documents.filter((d) => d.status === 'em_uso').length,
    [documents]
  )
  const totalArchivedCount = useMemo(
    () => documents.filter((d) => d.status === 'arquivado').length,
    [documents]
  )

  // Root documents (those without a folder)
  const rootDocuments = useMemo(() => {
    return statusFilteredDocuments.filter((doc) => isRootFolder(doc.category))
  }, [statusFilteredDocuments])

  // Documents inside the currently opened folder
  const currentFolderDocuments = useMemo(() => {
    if (!currentFolder) return []
    return statusFilteredDocuments.filter(
      (doc) => doc.category.toLowerCase().trim() === currentFolder.toLowerCase().trim()
    )
  }, [statusFilteredDocuments, currentFolder])

  // Search filtered results (when typing in search bar)
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return null
    const q = searchQuery.toLowerCase().trim()

    const matchingDocs = statusFilteredDocuments.filter((doc) => {
      const matchTitle = doc.title.toLowerCase().includes(q)
      const matchFile = doc.file_name.toLowerCase().includes(q)
      const matchCat = doc.category.toLowerCase().includes(q)
      const matchNotes = doc.notes?.toLowerCase().includes(q) || false
      return matchTitle || matchFile || matchCat || matchNotes
    })

    const matchingFolders = allFolders.filter((f) => f.toLowerCase().includes(q))

    return {
      documents: matchingDocs,
      folders: matchingFolders,
    }
  }, [searchQuery, statusFilteredDocuments, allFolders])

  // Handlers
  const handleUploadSubmit = async (data: any) => {
    try {
      // If category is ROOT_CATEGORY or empty, store as ROOT_CATEGORY
      const finalCategory = !data.category || isRootFolder(data.category)
        ? ROOT_CATEGORY
        : data.category.trim()

      await createMutation.mutateAsync({
        ...data,
        category: finalCategory,
      })
      toast.success('Documento carregado com sucesso!')
      setIsUploadModalOpen(false)
    } catch (err: any) {
      console.error('Falha ao guardar documento:', err)
      toast.error('Erro ao guardar o documento.')
    }
  }

  const handleCreateFolder = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = newFolderName.trim()
    if (!trimmed) return

    if (isRootFolder(trimmed)) {
      toast.error('Por favor escolha outro nome para a pasta.')
      return
    }

    if (allFolders.some((f) => f.toLowerCase() === trimmed.toLowerCase())) {
      toast.error('Já existe uma pasta com esse nome.')
      return
    }

    const next = [...customFolders, trimmed]
    setCustomFolders(next)
    saveStoredCustomFolders(next)
    setNewFolderName('')
    setIsNewFolderModalOpen(false)
    toast.success(`Pasta "${trimmed}" criada!`)
    setCurrentFolder(trimmed)
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
          <div className="min-w-0">
            {currentFolder ? (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCurrentFolder(null)}
                  className="rounded-full p-1 text-secondary-600 hover:bg-warm-100 hover:text-foreground transition-colors"
                  title="Voltar às pastas"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
                <div className="truncate">
                  <h1 className="text-lg font-black text-foreground truncate flex items-center gap-1.5">
                    <FolderIcon className="h-5 w-5 text-amber-500 shrink-0 fill-amber-500/20" />
                    <span>{currentFolder}</span>
                  </h1>
                  <p className="text-xs text-muted truncate">
                    {currentFolderDocuments.length} {currentFolderDocuments.length === 1 ? 'documento' : 'documentos'}
                  </p>
                </div>
              </div>
            ) : (
              <div>
                <h1 className="text-xl font-black text-foreground">Gestão Documental</h1>
                <p className="text-xs text-muted">Pastas e documentos oficiais da APMEE</p>
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            {!currentFolder && (
              <button
                type="button"
                onClick={() => setIsNewFolderModalOpen(true)}
                className="flex items-center gap-1.5 rounded-full border border-warm-300 bg-surface px-3 py-2 text-xs font-bold text-secondary-700 shadow-2xs hover:bg-warm-50 active:scale-95 transition-all"
                title="Criar nova pasta"
              >
                <FolderPlus className="h-4 w-4 text-amber-600" />
                <span className="hidden sm:inline">Nova Pasta</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setIsUploadModalOpen(true)}
              className="flex items-center gap-1.5 rounded-full bg-primary-500 px-3.5 py-2 text-xs font-bold text-white shadow-sm hover:bg-primary-600 active:scale-95 transition-all"
            >
              <Plus className="h-4 w-4" />
              <span>Novo</span>
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="px-4 mt-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                currentFolder
                  ? `Pesquisar em "${currentFolder}"...`
                  : 'Pesquisar pastas, documentos ou anexos...'
              }
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
            <span>Em Uso ({totalInUseCount})</span>
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
            <span>Arquivados ({totalArchivedCount})</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="px-4 mt-4">
        {isLoading ? (
          <div className="flex flex-col gap-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 w-full animate-pulse rounded-2xl bg-warm-100" />
            ))}
          </div>
        ) : searchResults ? (
          /* ================= SEARCH RESULTS VIEW ================= */
          <div className="flex flex-col gap-5">
            <div className="flex items-center justify-between text-xs text-muted">
              <span>Resultados para "{searchQuery}":</span>
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="text-primary-600 font-bold hover:underline"
              >
                Limpar pesquisa
              </button>
            </div>

            {/* Matching Folders */}
            {searchResults.folders.length > 0 && (
              <div>
                <h2 className="text-xs font-bold uppercase tracking-wider text-secondary-600 mb-2.5 flex items-center gap-1.5">
                  <FolderIcon className="h-3.5 w-3.5 text-amber-500" />
                  <span>Pastas Encontradas ({searchResults.folders.length})</span>
                </h2>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {searchResults.folders.map((folderName) => {
                    const folderDocs = statusFilteredDocuments.filter(
                      (d) => d.category.toLowerCase().trim() === folderName.toLowerCase().trim()
                    )
                    const inUseCount = folderDocs.filter((d) => d.status === 'em_uso').length
                    return (
                      <FolderCard
                        key={folderName}
                        name={folderName}
                        totalCount={folderDocs.length}
                        inUseCount={inUseCount}
                        onClick={() => {
                          setCurrentFolder(folderName)
                          setSearchQuery('')
                        }}
                      />
                    )
                  })}
                </div>
              </div>
            )}

            {/* Matching Documents */}
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-secondary-600 mb-2.5 flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5 text-primary-500" />
                <span>Documentos Encontrados ({searchResults.documents.length})</span>
              </h2>

              {searchResults.documents.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-warm-300 bg-surface p-6 text-center">
                  <p className="text-xs text-muted">Nenhum documento corresponde à pesquisa.</p>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {searchResults.documents.map((doc) => (
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
          </div>
        ) : currentFolder ? (
          /* ================= INSIDE FOLDER VIEW ================= */
          <div className="flex flex-col gap-3">
            {currentFolderDocuments.length === 0 ? (
              <div className="mt-8 flex flex-col items-center justify-center text-center p-8 rounded-2xl border border-dashed border-warm-300 bg-surface">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-50 text-amber-600 mb-3 border border-amber-200">
                  <FolderOpen className="h-6 w-6" />
                </div>
                <h3 className="text-sm font-bold text-foreground">Pasta vazia</h3>
                <p className="mt-1 text-xs text-muted max-w-xs">
                  {statusFilter !== 'all'
                    ? 'Nenhum documento nesta pasta corresponde ao filtro selecionado.'
                    : `Ainda não existem documentos guardados na pasta "${currentFolder}".`}
                </p>
                <button
                  type="button"
                  onClick={() => setIsUploadModalOpen(true)}
                  className="mt-4 flex items-center gap-1.5 rounded-full bg-primary-500 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-primary-600 active:scale-95 transition-all"
                >
                  <Plus className="h-4 w-4" />
                  <span>Adicionar Ficheiro a esta Pasta</span>
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {currentFolderDocuments.map((doc) => (
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
        ) : (
          /* ================= ROOT EXPLORER VIEW (PASTAS + RAIZ) ================= */
          <div className="flex flex-col gap-6">
            {/* 1. Secção de Pastas */}
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <h2 className="text-xs font-bold uppercase tracking-wider text-secondary-600 flex items-center gap-1.5">
                  <FolderIcon className="h-3.5 w-3.5 text-amber-500 fill-amber-500/20" />
                  <span>Pastas ({allFolders.length})</span>
                </h2>
                <button
                  type="button"
                  onClick={() => setIsNewFolderModalOpen(true)}
                  className="text-xs font-semibold text-primary-600 hover:text-primary-700 hover:underline flex items-center gap-1"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Nova Pasta</span>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {allFolders.map((folderName) => {
                  const folderDocs = statusFilteredDocuments.filter(
                    (d) => d.category.toLowerCase().trim() === folderName.toLowerCase().trim()
                  )
                  const inUseCount = folderDocs.filter((d) => d.status === 'em_uso').length
                  return (
                    <FolderCard
                      key={folderName}
                      name={folderName}
                      totalCount={folderDocs.length}
                      inUseCount={inUseCount}
                      onClick={() => setCurrentFolder(folderName)}
                    />
                  )
                })}
              </div>
            </div>

            {/* 2. Secção de Ficheiros na Raiz */}
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <div className="flex items-center gap-1.5">
                  <FileText className="h-3.5 w-3.5 text-primary-500" />
                  <h2 className="text-xs font-bold uppercase tracking-wider text-secondary-600">
                    Ficheiros na Raiz ({rootDocuments.length})
                  </h2>
                </div>
                <span className="text-[11px] text-muted">
                  Documentos sem pasta atribuída
                </span>
              </div>

              {rootDocuments.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-warm-300 bg-surface/60 p-6 text-center">
                  <p className="text-xs text-secondary-500">
                    Nenhum documento solto na raiz.
                  </p>
                  <p className="mt-0.5 text-[11px] text-muted">
                    Ao carregar documentos pode guardá-los diretamente numa pasta ou deixá-los aqui na raiz.
                  </p>
                  <button
                    type="button"
                    onClick={() => setIsUploadModalOpen(true)}
                    className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-primary-600 hover:underline"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Carregar documento para a raiz</span>
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {rootDocuments.map((doc) => (
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
          </div>
        )}
      </div>

      {/* Upload Modal */}
      {isUploadModalOpen && (
        <DocumentUploadModal
          isOpen={isUploadModalOpen}
          onClose={() => setIsUploadModalOpen(false)}
          onSubmit={handleUploadSubmit}
          existingCategories={allFolders}
          initialFolder={currentFolder}
        />
      )}

      {/* Create New Folder Modal */}
      {isNewFolderModalOpen && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-sm rounded-2xl border border-warm-200 bg-surface p-5 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-warm-100">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600 border border-amber-200">
                  <FolderPlus className="h-4 w-4" />
                </div>
                <h3 className="text-sm font-bold text-foreground">Nova Pasta</h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsNewFolderModalOpen(false)
                  setNewFolderName('')
                }}
                className="rounded-full p-1 text-muted hover:bg-warm-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateFolder} className="mt-4 flex flex-col gap-3">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="folder-name-input" className="text-xs font-bold text-secondary-600">
                  Nome da Pasta <span className="text-primary-500">*</span>
                </label>
                <input
                  id="folder-name-input"
                  type="text"
                  autoFocus
                  required
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  placeholder="Ex: Contratos & Protocolos 2026"
                  className="rounded-[var(--radius-button)] border border-warm-200 bg-surface px-3 py-2 text-sm text-foreground focus:border-primary-400 focus:outline-none focus:ring-1 focus:ring-primary-400"
                />
              </div>

              <div className="mt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsNewFolderModalOpen(false)
                    setNewFolderName('')
                  }}
                  className="rounded-[var(--radius-button)] border border-warm-200 px-3.5 py-2 text-xs font-semibold text-secondary-700 hover:bg-warm-100 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!newFolderName.trim()}
                  className="rounded-[var(--radius-button)] bg-primary-500 px-4 py-2 text-xs font-bold text-white hover:bg-primary-600 active:scale-95 disabled:opacity-50 transition-all"
                >
                  Criar Pasta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
