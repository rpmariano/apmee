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
  LayoutGrid,
  List,
  Pencil,
  Trash2,
} from 'lucide-react'
import {
  useDocuments,
  useCreateDocument,
  useUpdateDocument,
  useDeleteDocument,
} from '@/features/documents/api/use-documents'
import { DocumentCard } from '@/features/documents/components/document-card'
import { DocumentListItem } from '@/features/documents/components/document-list-item'
import { FolderCard } from '@/features/documents/components/folder-card'
import { FolderListItem } from '@/features/documents/components/folder-list-item'
import { DocumentUploadModal } from '@/features/documents/components/document-upload-modal'
import { DocumentEditModal } from '@/features/documents/components/document-edit-modal'
import { FolderEditModal } from '@/features/documents/components/folder-edit-modal'
import {
  type DocumentStatus,
  type AppDocument,
  isRootFolder,
  ROOT_CATEGORY,
} from '@/features/documents/types'
import { useToast } from '@/components/ui/toast'
import { CustomDialog } from '@/components/ui/custom-dialog'
import { cn } from '@/lib/utils'

const CUSTOM_FOLDERS_STORAGE_KEY = 'apmee_document_custom_folders'
const VIEW_MODE_STORAGE_KEY = 'apmee_documents_view_mode'

// Old default categories that should be removed if present in local storage
const OLD_DEFAULT_CATEGORIES = [
  'Estatutos & Regulamentos',
  'Atas de Assembleia / Direção',
  'Relatórios & Contas',
  'Modelos & Minutas',
  'Contratos & Parcerias',
  'Seguros & Licenças',
  'Comunicação & Circulares',
]

function getStoredCustomFolders(): string[] {
  try {
    const raw = localStorage.getItem(CUSTOM_FOLDERS_STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    // Filter out old default folders
    return parsed.filter((f) => typeof f === 'string' && !OLD_DEFAULT_CATEGORIES.includes(f))
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

function getStoredViewMode(): 'gallery' | 'list' {
  try {
    const raw = localStorage.getItem(VIEW_MODE_STORAGE_KEY)
    return raw === 'list' ? 'list' : 'gallery'
  } catch {
    return 'gallery'
  }
}

export default function DocumentsPage() {
  const { data: documents = [], isLoading } = useDocuments()
  const createMutation = useCreateDocument()
  const updateMutation = useUpdateDocument()
  const deleteMutation = useDeleteDocument()
  const { toast } = useToast()
  // Qualquer utilizador tem autorização para gerir e eliminar documentos
  const canEditDocuments = true

  const [currentFolder, setCurrentFolder] = useState<string | null>(null)
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)
  const [isNewFolderModalOpen, setIsNewFolderModalOpen] = useState(false)
  const [isCreateMenuOpen, setIsCreateMenuOpen] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | DocumentStatus>('all')
  const [customFolders, setCustomFolders] = useState<string[]>(getStoredCustomFolders)
  const [viewMode, setViewMode] = useState<'gallery' | 'list'>(getStoredViewMode)

  // Editing modals state
  const [folderToEdit, setFolderToEdit] = useState<string | null>(null)
  const [folderToDelete, setFolderToDelete] = useState<string | null>(null)
  const [documentToEdit, setDocumentToEdit] = useState<AppDocument | null>(null)

  useEffect(() => {
    saveStoredCustomFolders(customFolders)
  }, [customFolders])

  const handleViewModeChange = (mode: 'gallery' | 'list') => {
    setViewMode(mode)
    try {
      localStorage.setItem(VIEW_MODE_STORAGE_KEY, mode)
    } catch {
      // ignore
    }
  }

  // All unique folder names: custom folders created by user + any existing in documents
  const allFolders = useMemo(() => {
    const set = new Set<string>(customFolders)
    documents.forEach((d) => {
      if (!isRootFolder(d.category) && !OLD_DEFAULT_CATEGORIES.includes(d.category.trim())) {
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
      const finalCategory = !data.category || isRootFolder(data.category)
        ? ROOT_CATEGORY
        : data.category.trim()

      await createMutation.mutateAsync({
        ...data,
        category: finalCategory,
      })

      // If user typed a new category, add to customFolders
      if (!isRootFolder(finalCategory) && !allFolders.includes(finalCategory)) {
        const next = [...customFolders, finalCategory]
        setCustomFolders(next)
      }

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
    setNewFolderName('')
    setIsNewFolderModalOpen(false)
    toast.success(`Pasta "${trimmed}" criada!`)
  }

  const handleRenameFolder = async (oldName: string, newName: string) => {
    if (!newName || oldName === newName) return

    // Update in customFolders
    const next = customFolders.map((f) => (f === oldName ? newName : f))
    if (!next.includes(newName)) next.push(newName)
    setCustomFolders(next)

    // Update category on any documents belonging to oldName
    const docsInFolder = documents.filter(
      (d) => d.category.toLowerCase().trim() === oldName.toLowerCase().trim()
    )
    for (const doc of docsInFolder) {
      try {
        await updateMutation.mutateAsync({ id: doc.id, category: newName })
      } catch (err) {
        console.error('Falha ao atualizar pasta do documento:', err)
      }
    }

    if (currentFolder === oldName) {
      setCurrentFolder(newName)
    }

    setFolderToEdit(null)
    toast.success(`Pasta renomeada para "${newName}"!`)
  }

  const handleConfirmDeleteFolder = async () => {
    if (!folderToDelete) return
    const target = folderToDelete

    // Remove from customFolders
    const next = customFolders.filter((f) => f !== target)
    setCustomFolders(next)

    // Move documents from this folder to ROOT_CATEGORY
    const docsInFolder = documents.filter(
      (d) => d.category.toLowerCase().trim() === target.toLowerCase().trim()
    )
    for (const doc of docsInFolder) {
      try {
        await updateMutation.mutateAsync({ id: doc.id, category: ROOT_CATEGORY })
      } catch (err) {
        console.error('Falha ao mover documento para a raiz:', err)
      }
    }

    if (currentFolder === target) {
      setCurrentFolder(null)
    }

    setFolderToDelete(null)
    toast.success(`Pasta "${target}" eliminada. Os ficheiros foram movidos para a raiz.`)
  }

  const handleEditDocumentSubmit = async (data: {
    id: string
    title: string
    category: string
    status: DocumentStatus
    notes?: string | null
  }) => {
    try {
      await updateMutation.mutateAsync(data)
      toast.success('Ficheiro atualizado com sucesso!')
      setDocumentToEdit(null)
    } catch (err: any) {
      console.error('Falha ao atualizar documento:', err)
      toast.error('Erro ao atualizar documento.')
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
      toast.error(err?.message || 'Erro ao eliminar documento.')
    }
  }

  return (
    <div className="relative min-h-[calc(100vh-4rem)] bg-background pb-16">
      {/* Sticky Header */}
      <div className="sticky top-0 z-20 bg-background/95 pb-3.5 pt-3.5 backdrop-blur supports-[backdrop-filter]:bg-background/80 border-b border-warm-200/60">
        <div className="px-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            {currentFolder ? (
              <>
                <button
                  type="button"
                  onClick={() => setCurrentFolder(null)}
                  className="shrink-0 rounded-full p-1.5 text-secondary-600 hover:bg-warm-100 hover:text-foreground transition-colors"
                  title="Voltar às pastas"
                  aria-label="Voltar às pastas"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <FolderIcon className="h-5 w-5 text-amber-500 shrink-0 fill-amber-500/20" />
                    <h1 className="text-base sm:text-lg font-black text-foreground truncate min-w-0">
                      {currentFolder}
                    </h1>
                  </div>
                  <p className="text-xs text-muted truncate">
                    {currentFolderDocuments.length} {currentFolderDocuments.length === 1 ? 'documento' : 'documentos'}
                  </p>
                </div>
              </>
            ) : (
              <div className="min-w-0 flex-1">
                <h1 className="text-lg sm:text-xl font-black text-foreground truncate">
                  Gestão Documental
                </h1>
                <p className="text-xs text-muted truncate">
                  Pastas e documentos oficiais da APMEE
                </p>
              </div>
            )}
          </div>

          {/* Top-Right: Only Create Button (+ Novo) with Dropdown */}
          <div className="shrink-0 relative">
            <button
              type="button"
              onClick={() => setIsCreateMenuOpen((prev) => !prev)}
              className="flex items-center gap-1.5 rounded-full bg-primary-500 px-3.5 py-2 text-xs font-bold text-white shadow-sm hover:bg-primary-600 active:scale-95 transition-all cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Novo</span>
            </button>

            {/* Dropdown Menu for Create */}
            {isCreateMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-30"
                  onClick={() => setIsCreateMenuOpen(false)}
                />
                <div className="absolute right-0 top-full mt-2 z-40 w-48 rounded-2xl border border-warm-200 bg-surface p-1.5 shadow-xl animate-in fade-in zoom-in-95 duration-150">
                  <button
                    type="button"
                    onClick={() => {
                      setIsCreateMenuOpen(false)
                      setIsNewFolderModalOpen(true)
                    }}
                    className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-bold text-secondary-800 hover:bg-amber-50 hover:text-amber-900 transition-colors cursor-pointer text-left"
                  >
                    <FolderPlus className="h-4 w-4 text-amber-600 shrink-0" />
                    <span>Criar Pasta</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsCreateMenuOpen(false)
                      setIsUploadModalOpen(true)
                    }}
                    className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-bold text-secondary-800 hover:bg-primary-50 hover:text-primary-800 transition-colors cursor-pointer text-left"
                  >
                    <FileText className="h-4 w-4 text-primary-600 shrink-0" />
                    <span>Criar Ficheiro</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Search Bar & View Mode Switcher Row */}
        <div className="px-4 mt-3 flex items-center gap-2.5">
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted pointer-events-none" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                currentFolder
                  ? `Pesquisar em "${currentFolder}"...`
                  : 'Pesquisar pastas, documentos ou anexos...'
              }
              className="w-full rounded-[var(--radius-button)] border border-warm-200 bg-surface pl-9 pr-8 py-2 text-xs text-foreground placeholder:text-muted focus:border-primary-400 focus:outline-none focus:ring-1 focus:ring-primary-400 transition-colors shadow-2xs"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-muted hover:text-foreground hover:bg-warm-100 transition-colors"
                title="Limpar pesquisa"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* View Mode Switcher: Galeria vs Lista com Detalhes */}
          <div className="flex items-center rounded-xl border border-warm-200 bg-warm-100/70 p-0.5 shrink-0 shadow-2xs">
            <button
              type="button"
              onClick={() => handleViewModeChange('gallery')}
              className={cn(
                'flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-all cursor-pointer',
                viewMode === 'gallery'
                  ? 'bg-surface text-foreground shadow-2xs font-bold'
                  : 'text-secondary-600 hover:text-foreground'
              )}
              title="Ver em Galeria"
              aria-label="Ver em Galeria"
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Galeria</span>
            </button>

            <button
              type="button"
              onClick={() => handleViewModeChange('list')}
              className={cn(
                'flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-all cursor-pointer',
                viewMode === 'list'
                  ? 'bg-surface text-foreground shadow-2xs font-bold'
                  : 'text-secondary-600 hover:text-foreground'
              )}
              title="Ver em Lista com Detalhes"
              aria-label="Ver em Lista com Detalhes"
            >
              <List className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Lista</span>
            </button>
          </div>
        </div>

        {/* Status Filter Tabs Row */}
        <div className="px-4 mt-3 flex items-center gap-2 overflow-x-auto no-scrollbar pb-0.5">
          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className={cn(
              'rounded-full px-3.5 py-1.5 text-xs font-semibold whitespace-nowrap transition-all active:scale-95 cursor-pointer',
              statusFilter === 'all'
                ? 'bg-secondary-900 text-white shadow-xs'
                : 'bg-warm-100/90 text-secondary-600 hover:bg-warm-200'
            )}
          >
            Todos ({documents.length})
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('em_uso')}
            className={cn(
              'flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold whitespace-nowrap transition-all active:scale-95 cursor-pointer',
              statusFilter === 'em_uso'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-warm-100/90 text-emerald-800 hover:bg-warm-200'
            )}
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>Em Uso ({totalInUseCount})</span>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('arquivado')}
            className={cn(
              'flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold whitespace-nowrap transition-all active:scale-95 cursor-pointer',
              statusFilter === 'arquivado'
                ? 'bg-warm-600 text-white shadow-xs'
                : 'bg-warm-100/90 text-secondary-600 hover:bg-warm-200'
            )}
          >
            <Archive className="h-3.5 w-3.5" />
            <span>Arquivados ({totalArchivedCount})</span>
          </button>
        </div>

        {/* Current Folder Action Bar (when inside a folder) */}
        {currentFolder && (
          <div className="px-4 mt-2 pt-2 border-t border-warm-100 flex items-center justify-between text-xs">
            <span className="text-muted text-[11px]">Ações da Pasta:</span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setFolderToEdit(currentFolder)}
                className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold text-secondary-700 hover:bg-warm-100 transition-colors"
                title="Editar nome desta pasta"
              >
                <Pencil className="h-3.5 w-3.5" />
                <span>Editar Nome</span>
              </button>

              <button
                type="button"
                onClick={() => setFolderToDelete(currentFolder)}
                className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors"
                title="Eliminar esta pasta"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Eliminar Pasta</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <div className="px-4 mt-5">
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

                {viewMode === 'gallery' ? (
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
                          onEdit={(name) => setFolderToEdit(name)}
                          onDelete={(name) => setFolderToDelete(name)}
                        />
                      )
                    })}
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    {searchResults.folders.map((folderName) => {
                      const folderDocs = statusFilteredDocuments.filter(
                        (d) => d.category.toLowerCase().trim() === folderName.toLowerCase().trim()
                      )
                      const inUseCount = folderDocs.filter((d) => d.status === 'em_uso').length
                      return (
                        <FolderListItem
                          key={folderName}
                          name={folderName}
                          totalCount={folderDocs.length}
                          inUseCount={inUseCount}
                          onClick={() => {
                            setCurrentFolder(folderName)
                            setSearchQuery('')
                          }}
                          onEdit={(name) => setFolderToEdit(name)}
                          onDelete={(name) => setFolderToDelete(name)}
                        />
                      )
                    })}
                  </div>
                )}
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
              ) : viewMode === 'gallery' ? (
                <div className="flex flex-col gap-3">
                  {searchResults.documents.map((doc) => (
                    <DocumentCard
                      key={doc.id}
                      document={doc}
                      onStatusChange={handleStatusChange}
                      onDelete={handleDelete}
                      onEdit={(d) => setDocumentToEdit(d)}
                      canDelete={canEditDocuments}
                    />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {searchResults.documents.map((doc) => (
                    <DocumentListItem
                      key={doc.id}
                      document={doc}
                      onStatusChange={handleStatusChange}
                      onDelete={handleDelete}
                      onEdit={(d) => setDocumentToEdit(d)}
                      canDelete={canEditDocuments}
                      showCategoryBadge
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
                <p className="mt-3 text-[11px] text-muted">
                  Utilize o botão <strong className="text-foreground">+ Novo</strong> no topo para adicionar ficheiros a esta pasta.
                </p>
              </div>
            ) : viewMode === 'gallery' ? (
              <div className="flex flex-col gap-3">
                {currentFolderDocuments.map((doc) => (
                  <DocumentCard
                    key={doc.id}
                    document={doc}
                    onStatusChange={handleStatusChange}
                    onDelete={handleDelete}
                    onEdit={(d) => setDocumentToEdit(d)}
                    canDelete={canEditDocuments}
                  />
                ))}
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {currentFolderDocuments.map((doc) => (
                  <DocumentListItem
                    key={doc.id}
                    document={doc}
                    onStatusChange={handleStatusChange}
                    onDelete={handleDelete}
                    onEdit={(d) => setDocumentToEdit(d)}
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
            {allFolders.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <h2 className="text-xs font-bold uppercase tracking-wider text-secondary-600 flex items-center gap-1.5">
                    <FolderIcon className="h-3.5 w-3.5 text-amber-500 fill-amber-500/20" />
                    <span>Pastas ({allFolders.length})</span>
                  </h2>
                </div>

                {viewMode === 'gallery' ? (
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
                          onEdit={(name) => setFolderToEdit(name)}
                          onDelete={(name) => setFolderToDelete(name)}
                        />
                      )
                    })}
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    {allFolders.map((folderName) => {
                      const folderDocs = statusFilteredDocuments.filter(
                        (d) => d.category.toLowerCase().trim() === folderName.toLowerCase().trim()
                      )
                      const inUseCount = folderDocs.filter((d) => d.status === 'em_uso').length
                      return (
                        <FolderListItem
                          key={folderName}
                          name={folderName}
                          totalCount={folderDocs.length}
                          inUseCount={inUseCount}
                          onClick={() => setCurrentFolder(folderName)}
                          onEdit={(name) => setFolderToEdit(name)}
                          onDelete={(name) => setFolderToDelete(name)}
                        />
                      )
                    })}
                  </div>
                )}
              </div>
            )}

            {/* 2. Secção de Ficheiros na Raiz */}
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <div className="flex items-center gap-1.5">
                  <FileText className="h-3.5 w-3.5 text-primary-500" />
                  <h2 className="text-xs font-bold uppercase tracking-wider text-secondary-600">
                    Ficheiros {allFolders.length > 0 ? 'na Raiz' : ''} ({rootDocuments.length})
                  </h2>
                </div>
                {allFolders.length > 0 && (
                  <span className="text-[11px] text-muted">
                    Documentos sem pasta atribuída
                  </span>
                )}
              </div>

              {rootDocuments.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-warm-300 bg-surface/60 p-6 text-center">
                  <p className="text-xs text-secondary-500">
                    {allFolders.length === 0
                      ? 'Ainda não existem pastas nem ficheiros guardados.'
                      : 'Nenhum documento solto na raiz.'}
                  </p>
                  <p className="mt-1 text-[11px] text-muted">
                    Utilize o botão <strong className="text-foreground">+ Novo</strong> no canto superior direito para criar uma pasta ou carregar um ficheiro.
                  </p>
                </div>
              ) : viewMode === 'gallery' ? (
                <div className="flex flex-col gap-3">
                  {rootDocuments.map((doc) => (
                    <DocumentCard
                      key={doc.id}
                      document={doc}
                      onStatusChange={handleStatusChange}
                      onDelete={handleDelete}
                      onEdit={(d) => setDocumentToEdit(d)}
                      canDelete={canEditDocuments}
                    />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {rootDocuments.map((doc) => (
                    <DocumentListItem
                      key={doc.id}
                      document={doc}
                      onStatusChange={handleStatusChange}
                      onDelete={handleDelete}
                      onEdit={(d) => setDocumentToEdit(d)}
                      canDelete={canEditDocuments}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Upload Modal (Criar Ficheiro) */}
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
                  placeholder="Ex: Regulamentos 2026..."
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

      {/* Edit Folder Name Modal */}
      {folderToEdit && (
        <FolderEditModal
          isOpen={!!folderToEdit}
          currentName={folderToEdit}
          onClose={() => setFolderToEdit(null)}
          onSave={handleRenameFolder}
          existingFolders={allFolders}
        />
      )}

      {/* Delete Folder Confirmation Dialog */}
      <CustomDialog
        isOpen={!!folderToDelete}
        title="Eliminar Pasta?"
        description={`Tem a certeza de que pretende eliminar a pasta "${folderToDelete}"? Todos os documentos nela contidos serão preservados e movidos para a Raiz (Sem Pasta).`}
        variant="danger"
        confirmLabel="Sim, Eliminar Pasta"
        cancelLabel="Cancelar"
        onConfirm={handleConfirmDeleteFolder}
        onCancel={() => setFolderToDelete(null)}
      />

      {/* Edit Document Modal */}
      {documentToEdit && (
        <DocumentEditModal
          isOpen={!!documentToEdit}
          document={documentToEdit}
          onClose={() => setDocumentToEdit(null)}
          onSubmit={handleEditDocumentSubmit}
          onDelete={handleDelete}
          canDelete={canEditDocuments}
          folders={allFolders}
        />
      )}
    </div>
  )
}
