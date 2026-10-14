import { useState } from 'react'
import {
  FileText,
  FileSpreadsheet,
  FileImage,
  File,
  Trash2,
  CheckCircle2,
  Archive,
  Download,
  Pencil,
} from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { pt } from 'date-fns/locale'
import { CustomDialog } from '@/components/ui/custom-dialog'
import { type AppDocument, type DocumentStatus, isRootFolder } from '../types'
import { cn } from '@/lib/utils'

interface DocumentListItemProps {
  document: AppDocument
  onStatusChange: (id: string, newStatus: DocumentStatus) => void
  onDelete: (id: string) => void
  onEdit?: (document: AppDocument) => void
  canDelete?: boolean
  showCategoryBadge?: boolean
}

function getFileIcon(type?: string | null, name?: string) {
  const ext = (name || '').split('.').pop()?.toLowerCase() || ''
  const mime = (type || '').toLowerCase()

  if (mime.includes('pdf') || ext === 'pdf') {
    return <FileText className="h-5 w-5 text-red-500" />
  }
  if (mime.includes('image') || ['png', 'jpg', 'jpeg', 'webp', 'svg'].includes(ext)) {
    return <FileImage className="h-5 w-5 text-blue-500" />
  }
  if (
    mime.includes('sheet') ||
    mime.includes('excel') ||
    mime.includes('csv') ||
    ['xlsx', 'xls', 'csv'].includes(ext)
  ) {
    return <FileSpreadsheet className="h-5 w-5 text-emerald-600" />
  }
  if (
    mime.includes('word') ||
    mime.includes('document') ||
    ['docx', 'doc', 'odt', 'rtf'].includes(ext)
  ) {
    return <FileText className="h-5 w-5 text-indigo-600" />
  }
  return <File className="h-5 w-5 text-secondary-500" />
}

function formatSize(bytes?: number | null) {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function DocumentListItem({
  document,
  onStatusChange,
  onDelete,
  onEdit,
  canDelete = true,
  showCategoryBadge = false,
}: DocumentListItemProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const isEmUso = document.status === 'em_uso'
  const isArquivado = document.status === 'arquivado'

  const formattedDate = (() => {
    try {
      return format(parseISO(document.created_at), "dd/MM/yyyy", { locale: pt })
    } catch {
      return ''
    }
  })()

  return (
    <div className="group flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-warm-200 bg-surface p-3 shadow-2xs hover:border-primary-300 hover:shadow-xs transition-all">
      {/* File Info */}
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-warm-100 group-hover:bg-warm-200/80 transition-colors">
          {getFileIcon(document.file_type, document.file_name)}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="text-sm font-bold text-foreground truncate max-w-full">
              {document.title}
            </h4>
            {showCategoryBadge && (
              <span
                className={cn(
                  'rounded px-1.5 py-0.2 text-[10px] font-semibold shrink-0',
                  isRootFolder(document.category)
                    ? 'bg-warm-100 text-secondary-600 border border-warm-200'
                    : 'bg-amber-50 border border-amber-200 text-amber-800'
                )}
              >
                {isRootFolder(document.category) ? 'Raiz' : document.category}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 text-[11px] text-muted flex-wrap mt-0.5">
            <span className="truncate max-w-[180px] xs:max-w-[240px]" title={document.file_name}>
              {document.file_name}
            </span>
            {document.file_size ? (
              <>
                <span>·</span>
                <span>{formatSize(document.file_size)}</span>
              </>
            ) : null}
            {formattedDate && (
              <>
                <span>·</span>
                <span>{formattedDate}</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Badges & Actions */}
      <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0 border-t sm:border-t-0 border-warm-100 pt-2 sm:pt-0">
        {/* Status Toggle Badge */}
        <button
          type="button"
          onClick={() => onStatusChange(document.id, isEmUso ? 'arquivado' : 'em_uso')}
          className={cn(
            'flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold transition-all',
            isEmUso
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
              : isArquivado
              ? 'bg-warm-100 text-secondary-700 border border-warm-200 hover:bg-warm-200'
              : 'bg-amber-50 text-amber-800 border border-amber-200'
          )}
          title={isEmUso ? 'Clique para Arquivar' : 'Clique para Marcar Em Uso'}
        >
          {isEmUso ? (
            <CheckCircle2 className="h-3 w-3 text-emerald-600" />
          ) : (
            <Archive className="h-3 w-3 text-secondary-500" />
          )}
          <span>{isEmUso ? 'Em Uso' : isArquivado ? 'Arquivado' : 'Rascunho'}</span>
        </button>

        {/* Action icons */}
        <div className="flex items-center gap-1">
          <a
            href={document.file_url}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg p-1.5 text-primary-700 hover:bg-primary-50 transition-colors"
            title="Abrir / Descarregar"
            aria-label="Abrir / Descarregar"
          >
            <Download className="h-4 w-4" />
          </a>

          {onEdit && (
            <button
              type="button"
              onClick={() => onEdit(document)}
              className="rounded-lg p-1.5 text-muted hover:bg-warm-100 hover:text-foreground transition-colors"
              title="Editar documento"
              aria-label="Editar documento"
            >
              <Pencil className="h-4 w-4" />
            </button>
          )}

          {canDelete && (
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              className="rounded-lg p-1.5 text-muted hover:bg-red-50 hover:text-red-600 transition-colors"
              title="Eliminar documento"
              aria-label="Eliminar documento"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <CustomDialog
        isOpen={showDeleteConfirm}
        title="Eliminar Documento?"
        description={`Tem a certeza de que pretende eliminar o documento "${document.title}"? Esta ação removerá o registo da lista.`}
        variant="danger"
        confirmLabel="Sim, Eliminar"
        cancelLabel="Cancelar"
        onConfirm={() => {
          onDelete(document.id)
          setShowDeleteConfirm(false)
        }}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </div>
  )
}
