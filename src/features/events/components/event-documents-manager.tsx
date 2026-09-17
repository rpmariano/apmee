import { useState, useRef } from 'react'
import { FileText, Upload, Trash2, ExternalLink, Plus, Loader2 } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { pt } from 'date-fns/locale'
import { supabase } from '@/lib/supabase'
import type { EventDocument } from '@/types/database'
import { CustomDialog } from '@/components/ui/custom-dialog'

interface EventDocumentsManagerProps {
  documents: EventDocument[]
  onChange: (documents: EventDocument[]) => void
  disabled?: boolean
}

export function EventDocumentsManager({
  documents = [],
  onChange,
  disabled = false,
}: EventDocumentsManagerProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [showAddLink, setShowAddLink] = useState(false)
  const [linkTitle, setLinkTitle] = useState('')
  const [linkUrl, setLinkUrl] = useState('')
  const [dialogError, setDialogError] = useState<string | null>(null)
  const [docToDelete, setDocToDelete] = useState<EventDocument | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      setIsUploading(true)
      const cleanFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
      const storagePath = `meetings/${Date.now()}-${cleanFileName}`

      const { error: uploadError } = await (supabase as any).storage
        .from('receipts')
        .upload(storagePath, file)

      if (uploadError) throw uploadError

      const { data } = (supabase as any).storage
        .from('receipts')
        .getPublicUrl(storagePath)

      const newDoc: EventDocument = {
        id: crypto.randomUUID(),
        name: file.name,
        url: data.publicUrl,
        size: file.size,
        type: file.type,
        uploaded_at: new Date().toISOString(),
      }

      onChange([...documents, newDoc])
    } catch (err: any) {
      console.error('Error uploading document:', err)
      setDialogError(
        err?.message ||
          'Erro ao carregar o documento. Verifique a sua ligação ou permissões do Supabase.'
      )
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleAddLink = () => {
    if (!linkUrl.trim()) return

    let formattedUrl = linkUrl.trim()
    if (!/^https?:\/\//i.test(formattedUrl)) {
      formattedUrl = `https://${formattedUrl}`
    }

    const newDoc: EventDocument = {
      id: crypto.randomUUID(),
      name: linkTitle.trim() || 'Documento Partilhado',
      url: formattedUrl,
      type: 'link',
      uploaded_at: new Date().toISOString(),
    }

    onChange([...documents, newDoc])
    setLinkTitle('')
    setLinkUrl('')
    setShowAddLink(false)
  }

  const confirmDelete = () => {
    if (!docToDelete) return
    onChange(documents.filter((d) => d.id !== docToDelete.id))
    setDocToDelete(null)
  }

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return ''
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <div className="flex flex-col gap-3 rounded-[var(--radius-card)] border border-warm-200 bg-surface p-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-bold text-foreground">Documentos & Anexos</h4>
          <p className="text-xs text-muted">
            Anexe ficheiros (PDF, DOC, imagens) ou adicione links para o Google Drive / OneDrive.
          </p>
        </div>
        <span className="rounded-full bg-warm-100 px-2 py-0.5 text-xs font-bold text-secondary-700">
          {documents.length}
        </span>
      </div>

      {/* Upload and Link Actions */}
      {!disabled && (
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <input
            type="file"
            ref={fileInputRef}
            aria-label="Anexar ficheiro"
            onChange={handleFileUpload}
            disabled={isUploading}
            className="hidden"
            accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.png,.jpg,.jpeg,.zip"
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="flex items-center gap-1.5 rounded-[var(--radius-button)] bg-primary-50 px-3 py-1.5 text-xs font-semibold text-primary-700 hover:bg-primary-100 active:scale-95 transition-all disabled:opacity-50"
          >
            {isUploading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Upload className="h-3.5 w-3.5" />
            )}
            <span>{isUploading ? 'A carregar...' : 'Anexar Ficheiro'}</span>
          </button>

          <button
            type="button"
            onClick={() => setShowAddLink(!showAddLink)}
            className="flex items-center gap-1.5 rounded-[var(--radius-button)] bg-warm-100 px-3 py-1.5 text-xs font-semibold text-secondary-700 hover:bg-warm-200 active:scale-95 transition-all"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Adicionar Link</span>
          </button>
        </div>
      )}

      {/* Add External Link Drawer */}
      {showAddLink && !disabled && (
        <div className="flex flex-col gap-2 rounded-[var(--radius-card)] border border-primary-200 bg-primary-50/50 p-3 mt-1">
          <p className="text-xs font-semibold text-primary-900">Adicionar Link para Documento Externo</p>
          <input
            type="text"
            aria-label="Nome do documento"
            placeholder="Nome do documento (ex: Ata Assinada no Google Drive)"
            value={linkTitle}
            onChange={(e) => setLinkTitle(e.target.value)}
            className="rounded-[var(--radius-button)] border border-warm-200 bg-surface px-3 py-1.5 text-xs focus:border-primary-400 focus:outline-none"
          />
          <input
            type="url"
            aria-label="URL do documento"
            placeholder="URL (ex: https://docs.google.com/...)"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            className="rounded-[var(--radius-button)] border border-warm-200 bg-surface px-3 py-1.5 text-xs focus:border-primary-400 focus:outline-none"
          />
          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => {
                setShowAddLink(false)
                setLinkTitle('')
                setLinkUrl('')
              }}
              className="rounded-[var(--radius-button)] px-2.5 py-1 text-xs text-secondary-600 hover:bg-warm-200"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleAddLink}
              disabled={!linkUrl.trim()}
              className="rounded-[var(--radius-button)] bg-primary-500 px-3 py-1 text-xs font-semibold text-white hover:bg-primary-600 disabled:opacity-50"
            >
              Adicionar
            </button>
          </div>
        </div>
      )}

      {/* Documents List */}
      {documents.length === 0 ? (
        <div className="rounded-[var(--radius-card)] border border-dashed border-warm-200 py-6 text-center">
          <FileText className="mx-auto h-6 w-6 text-secondary-300" />
          <p className="mt-1.5 text-xs text-muted">Nenhum documento ou ata associada.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2 pt-1">
          {documents.map((doc) => {
            const formattedDate = doc.uploaded_at
              ? format(parseISO(doc.uploaded_at), "d 'de' MMM, HH:mm", { locale: pt })
              : null

            return (
              <div
                key={doc.id}
                className="flex items-center justify-between rounded-[var(--radius-button)] border border-warm-200 bg-surface p-2.5 transition-colors hover:bg-warm-50"
              >
                <a
                  href={doc.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2.5 min-w-0 flex-1 hover:underline text-foreground"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-100 text-primary-700">
                    {doc.type === 'link' ? (
                      <ExternalLink className="h-4 w-4" />
                    ) : (
                      <FileText className="h-4 w-4" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-semibold text-foreground">
                      {doc.name}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-muted">
                      {doc.size ? <span>{formatFileSize(doc.size)}</span> : null}
                      {formattedDate ? <span>{formattedDate}</span> : null}
                      {doc.type === 'link' ? <span>(Link externo)</span> : null}
                    </div>
                  </div>
                </a>

                {!disabled && (
                  <button
                    type="button"
                    onClick={() => setDocToDelete(doc)}
                    className="ml-2 rounded-full p-1.5 text-secondary-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                    title="Remover documento"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Confirmation Dialog for Delete */}
      <CustomDialog
        isOpen={!!docToDelete}
        title="Remover Documento"
        description={`Tem a certeza que deseja remover o documento "${docToDelete?.name}"?`}
        variant="danger"
        confirmLabel="Remover"
        cancelLabel="Cancelar"
        onConfirm={confirmDelete}
        onCancel={() => setDocToDelete(null)}
      />

      {/* Error Dialog */}
      <CustomDialog
        isOpen={!!dialogError}
        title="Erro no Anexo"
        description={dialogError || ''}
        variant="danger"
        confirmLabel="OK"
        onConfirm={() => setDialogError(null)}
      />
    </div>
  )
}
