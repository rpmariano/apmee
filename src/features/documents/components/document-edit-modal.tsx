import { useState, useRef, useMemo } from 'react'
import { X, CheckCircle2, Archive, FileText, Download, Trash2 } from 'lucide-react'
import { CustomSelect } from '@/components/ui/custom-select'
import { UnsavedDialog } from '@/components/ui/unsaved-dialog'
import { CustomDialog } from '@/components/ui/custom-dialog'
import { useHardwareBack } from '@/hooks/use-hardware-back'
import {
  type AppDocument,
  type DocumentStatus,
  ROOT_CATEGORY,
  isRootFolder,
} from '../types'
import { cn } from '@/lib/utils'

interface DocumentEditModalProps {
  isOpen: boolean
  document: AppDocument | null
  onClose: () => void
  onSubmit: (data: {
    id: string
    title: string
    category: string
    status: DocumentStatus
    notes?: string | null
  }) => Promise<void>
  onDelete?: (id: string) => void
  canDelete?: boolean
  folders: string[]
}

export function DocumentEditModal({
  isOpen,
  document,
  onClose,
  onSubmit,
  onDelete,
  canDelete = true,
  folders,
}: DocumentEditModalProps) {
  if (!isOpen || !document) return null

  const [title, setTitle] = useState(document.title)
  const [category, setCategory] = useState(
    isRootFolder(document.category) ? ROOT_CATEGORY : document.category
  )
  const [status, setStatus] = useState<DocumentStatus>(document.status)
  const [notes, setNotes] = useState(document.notes || '')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showUnsaved, setShowUnsaved] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)

  const isDirty =
    title !== document.title ||
    category !== (isRootFolder(document.category) ? ROOT_CATEGORY : document.category) ||
    status !== document.status ||
    notes !== (document.notes || '')

  const handleClose = () => {
    if (isDirty && !isSubmitting) {
      setShowUnsaved(true)
    } else {
      onClose()
    }
  }

  useHardwareBack(isOpen, handleClose)

  const categoryOptions = useMemo(() => {
    const set = new Set(folders.filter((c) => !isRootFolder(c)))
    return [
      { label: '📁 Sem Pasta (Fica na Raiz)', value: ROOT_CATEGORY },
      ...Array.from(set).map((cat) => ({
        label: `📁 ${cat}`,
        value: cat,
      })),
    ]
  }, [folders])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return

    setIsSubmitting(true)
    try {
      await onSubmit({
        id: document.id,
        title: title.trim(),
        category: category.trim(),
        status,
        notes: notes.trim() || null,
      })
      onClose()
    } catch (err) {
      console.error('Falha ao atualizar documento:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[120] flex justify-center bg-black/40 backdrop-blur-xs transition-opacity animate-in fade-in duration-200">
      <div className="flex w-full max-w-[430px] flex-col bg-background shadow-2xl animate-in slide-in-from-bottom-6 duration-200 ease-out">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-warm-200 bg-surface px-4 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-50 text-primary-600 border border-primary-200">
              <FileText className="h-4 w-4" />
            </div>
            <h2 className="text-base font-bold text-foreground">Editar Ficheiro</h2>
          </div>
          <button
            type="button"
            onClick={handleClose}
            aria-label="Fechar"
            className="rounded-full p-2 text-muted hover:bg-warm-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          <form ref={formRef} onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Readonly file info */}
            <div className="flex items-center justify-between rounded-xl border border-warm-200 bg-warm-50/70 p-3">
              <div className="min-w-0 flex-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted block">
                  Ficheiro Anexo
                </span>
                <p className="text-xs font-semibold text-secondary-800 truncate mt-0.5" title={document.file_name}>
                  {document.file_name}
                </p>
              </div>
              <a
                href={document.file_url}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 flex items-center gap-1 rounded-lg bg-surface border border-warm-200 px-2.5 py-1 text-xs font-bold text-primary-700 hover:bg-warm-100 transition-colors shadow-2xs"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Ver</span>
              </a>
            </div>

            {/* Title / Name */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="edit-doc-title" className="text-xs font-bold text-secondary-700">
                Nome / Título do Ficheiro <span className="text-primary-500">*</span>
              </label>
              <input
                id="edit-doc-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="rounded-[var(--radius-button)] border border-warm-200 bg-surface px-3 py-2 text-sm text-foreground focus:border-primary-400 focus:outline-none focus:ring-1 focus:ring-primary-400"
                placeholder="Ex: Regulamento Interno 2026..."
              />
            </div>

            {/* Folder / Category */}
            <div className="flex flex-col gap-1.5 z-20">
              <label className="text-xs font-bold text-secondary-700">
                Pasta de Destino
              </label>
              <CustomSelect
                value={category}
                onChange={setCategory}
                options={categoryOptions}
              />
              <span className="text-[11px] text-muted">
                Pode mover este ficheiro para outra pasta ou deixá-lo na Raiz.
              </span>
            </div>

            {/* Status */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-secondary-700">
                Estado do Documento
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setStatus('em_uso')}
                  className={cn(
                    'flex items-center justify-center gap-1.5 rounded-[var(--radius-button)] border p-2.5 text-xs font-bold transition-all',
                    status === 'em_uso'
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-800 ring-1 ring-emerald-500'
                      : 'border-warm-200 bg-surface text-secondary-600 hover:bg-warm-50'
                  )}
                >
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <span>Em Uso (Ativo)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setStatus('arquivado')}
                  className={cn(
                    'flex items-center justify-center gap-1.5 rounded-[var(--radius-button)] border p-2.5 text-xs font-bold transition-all',
                    status === 'arquivado'
                      ? 'border-warm-500 bg-warm-200 text-secondary-800 ring-1 ring-warm-500'
                      : 'border-warm-200 bg-surface text-secondary-600 hover:bg-warm-50'
                  )}
                >
                  <Archive className="h-4 w-4 text-secondary-500" />
                  <span>Arquivado</span>
                </button>
              </div>
            </div>

            {/* Notes */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="edit-doc-notes" className="text-xs font-bold text-secondary-700">
                Notas / Observações <span className="text-muted font-normal">(opcional)</span>
              </label>
              <textarea
                id="edit-doc-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="Ex: Aprovado na assembleia de 12 de outubro..."
                className="resize-none rounded-[var(--radius-button)] border border-warm-200 bg-surface px-3 py-2 text-xs text-foreground focus:border-primary-400 focus:outline-none focus:ring-1 focus:ring-primary-400"
              />
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-2 border-t border-warm-200 bg-surface px-4 py-3">
          <div>
            {canDelete && onDelete && (
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="flex items-center gap-1.5 rounded-[var(--radius-button)] px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors"
              >
                <Trash2 className="h-4 w-4" />
                <span>Eliminar Ficheiro</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleClose}
              className="rounded-[var(--radius-button)] border border-warm-200 px-4 py-2 text-xs font-semibold text-secondary-700 hover:bg-warm-100 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => formRef.current?.requestSubmit()}
              disabled={!title.trim() || isSubmitting}
              className="rounded-[var(--radius-button)] bg-primary-500 px-4 py-2 text-xs font-bold text-white hover:bg-primary-600 active:scale-95 disabled:opacity-50 transition-all"
            >
              {isSubmitting ? 'A guardar...' : 'Guardar Alterações'}
            </button>
          </div>
        </div>
      </div>

      <UnsavedDialog
        isOpen={showUnsaved}
        onDiscard={() => {
          setShowUnsaved(false)
          onClose()
        }}
        onSave={() => {
          setShowUnsaved(false)
          formRef.current?.requestSubmit()
        }}
        onCancel={() => setShowUnsaved(false)}
      />

      <CustomDialog
        isOpen={showDeleteConfirm}
        title="Eliminar Documento?"
        description={`Tem a certeza de que pretende eliminar o documento "${document.title}"? Esta ação removerá o registo da lista.`}
        variant="danger"
        confirmLabel="Sim, Eliminar"
        cancelLabel="Cancelar"
        onConfirm={() => {
          setShowDeleteConfirm(false)
          onDelete?.(document.id)
          onClose()
        }}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </div>
  )
}
