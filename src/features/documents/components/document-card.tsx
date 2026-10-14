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
} from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { pt } from 'date-fns/locale'
import { CustomDialog } from '@/components/ui/custom-dialog'
import type { AppDocument, DocumentStatus } from '../types'
import { cn } from '@/lib/utils'

interface DocumentCardProps {
  document: AppDocument
  onStatusChange: (id: string, newStatus: DocumentStatus) => void
  onDelete: (id: string) => void
  canDelete?: boolean
}

function getFileIcon(type?: string | null, name?: string) {
  const ext = (name || '').split('.').pop()?.toLowerCase() || ''
  const mime = (type || '').toLowerCase()

  if (mime.includes('pdf') || ext === 'pdf') {
    return <FileText className="h-6 w-6 text-red-500" />
  }
  if (mime.includes('image') || ['png', 'jpg', 'jpeg', 'webp', 'svg'].includes(ext)) {
    return <FileImage className="h-6 w-6 text-blue-500" />
  }
  if (
    mime.includes('sheet') ||
    mime.includes('excel') ||
    mime.includes('csv') ||
    ['xlsx', 'xls', 'csv'].includes(ext)
  ) {
    return <FileSpreadsheet className="h-6 w-6 text-emerald-600" />
  }
  if (
    mime.includes('word') ||
    mime.includes('document') ||
    ['docx', 'doc', 'odt', 'rtf'].includes(ext)
  ) {
    return <FileText className="h-6 w-6 text-indigo-600" />
  }
  return <File className="h-6 w-6 text-secondary-500" />
}

function formatSize(bytes?: number | null) {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function DocumentCard({
  document,
  onStatusChange,
  onDelete,
  canDelete = true,
}: DocumentCardProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const isEmUso = document.status === 'em_uso'
  const isArquivado = document.status === 'arquivado'

  const formattedDate = (() => {
    try {
      return format(parseISO(document.created_at), "d 'de' MMMM, yyyy", { locale: pt })
    } catch {
      return ''
    }
  })()

  return (
    <div className="flex flex-col gap-3 rounded-[var(--radius-card)] border border-warm-200 bg-surface p-4 shadow-xs hover:shadow-md transition-all">
      {/* Top row: Icon, title, status */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-warm-100">
            {getFileIcon(document.file_type, document.file_name)}
          </div>
          <div className="min-w-0">
            <h4 className="text-sm font-bold text-foreground leading-snug line-clamp-2">
              {document.title}
            </h4>
            <p className="text-xs text-muted truncate mt-0.5" title={document.file_name}>
              {document.file_name}
            </p>
          </div>
        </div>

        {/* Status Badge */}
        <span
          className={cn(
            'shrink-0 flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold',
            isEmUso
              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
              : isArquivado
              ? 'bg-warm-200 text-secondary-700 border border-warm-300'
              : 'bg-amber-100 text-amber-800 border border-amber-200'
          )}
        >
          {isEmUso ? (
            <CheckCircle2 className="h-3 w-3" />
          ) : (
            <Archive className="h-3 w-3" />
          )}
          <span>{isEmUso ? 'Em Uso' : isArquivado ? 'Arquivado' : 'Rascunho'}</span>
        </span>
      </div>

      {/* Meta tags: Category, Size, Date */}
      <div className="flex flex-wrap items-center gap-2 pt-1">
        <span className="rounded-md bg-primary-50 border border-primary-200/60 px-2 py-0.5 text-xs font-semibold text-primary-800">
          📁 {document.category}
        </span>

        {document.file_size ? (
          <span className="text-[11px] text-secondary-500">
            {formatSize(document.file_size)}
          </span>
        ) : null}

        {formattedDate && (
          <span className="flex items-center gap-1 text-[11px] text-secondary-500">
            <span>·</span>
            <span>{formattedDate}</span>
          </span>
        )}
      </div>

      {/* Optional notes */}
      {document.notes && (
        <p className="rounded-md bg-warm-50 p-2 text-xs text-secondary-600 italic border border-warm-100">
          "{document.notes}"
        </p>
      )}

      {/* Action Buttons */}
      <div className="flex items-center justify-between border-t border-warm-100 pt-3 mt-1">
        {/* Toggle Status */}
        <button
          type="button"
          onClick={() => onStatusChange(document.id, isEmUso ? 'arquivado' : 'em_uso')}
          className="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold text-secondary-700 hover:bg-warm-100 transition-colors"
          title={isEmUso ? 'Mudar para Arquivado' : 'Mudar para Em Uso'}
        >
          {isEmUso ? (
            <>
              <Archive className="h-3.5 w-3.5 text-secondary-500" />
              <span>Arquivar</span>
            </>
          ) : (
            <>
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
              <span>Marcar Em Uso</span>
            </>
          )}
        </button>

        {/* View / Download and Delete */}
        <div className="flex items-center gap-1.5">
          <a
            href={document.file_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 rounded-full bg-primary-50 border border-primary-200 px-3 py-1 text-xs font-bold text-primary-700 hover:bg-primary-100 active:scale-95 transition-all shadow-2xs"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Abrir / Descarregar</span>
          </a>

          {canDelete && (
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              className="rounded-full p-1.5 text-muted hover:bg-red-50 hover:text-red-600 transition-colors"
              title="Eliminar documento"
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
