import { useState, useRef, useMemo } from 'react'
import { X, Upload, CheckCircle2, Archive, Loader2 } from 'lucide-react'
import { CustomSelect } from '@/components/ui/custom-select'
import { UnsavedDialog } from '@/components/ui/unsaved-dialog'
import { useHardwareBack } from '@/hooks/use-hardware-back'
import {
  type DocumentStatus,
  DEFAULT_DOCUMENT_CATEGORIES,
} from '../types'
import { uploadDocumentFile } from '../api/use-documents'
import { cn } from '@/lib/utils'

interface DocumentUploadModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: {
    title: string
    file_name: string
    file_url: string
    file_size?: number
    file_type?: string
    category: string
    status: DocumentStatus
    notes?: string
  }) => Promise<void>
  existingCategories: string[]
}

export function DocumentUploadModal({
  isOpen,
  onClose,
  onSubmit,
  existingCategories,
}: DocumentUploadModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('Geral')
  const [status, setStatus] = useState<DocumentStatus>('em_uso')
  const [notes, setNotes] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [showUnsaved, setShowUnsaved] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const formRef = useRef<HTMLFormElement>(null)

  const isDirty = Boolean(selectedFile || title || notes || category !== 'Geral')

  const handleClose = () => {
    if (isDirty && !isUploading) {
      setShowUnsaved(true)
    } else {
      onClose()
    }
  }

  useHardwareBack(isOpen, handleClose)

  // Merge default categories with any custom ones already in use
  const categoryOptions = useMemo(() => {
    const set = new Set([...DEFAULT_DOCUMENT_CATEGORIES, ...existingCategories])
    return Array.from(set).map((cat) => ({
      label: cat,
      value: cat,
    }))
  }, [existingCategories])

  const handleFileChange = (file: File | null) => {
    if (!file) return
    setSelectedFile(file)
    setErrorMsg(null)
    // If title is empty, prefill with clean file name (without extension)
    if (!title.trim()) {
      const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ')
      setTitle(cleanName.charAt(0).toUpperCase() + cleanName.slice(1))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedFile) {
      setErrorMsg('Por favor selecione um ficheiro para carregar.')
      return
    }
    if (!title.trim()) {
      setErrorMsg('Por favor defina um título para o documento.')
      return
    }
    if (!category.trim()) {
      setErrorMsg('Por favor escolha ou crie uma categoria.')
      return
    }

    try {
      setIsUploading(true)
      setErrorMsg(null)

      // Upload file to storage
      const uploaded = await uploadDocumentFile(selectedFile)

      await onSubmit({
        title: title.trim(),
        file_name: uploaded.fileName,
        file_url: uploaded.fileUrl,
        file_size: uploaded.fileSize,
        file_type: uploaded.fileType,
        category: category.trim(),
        status,
        notes: notes.trim() || undefined,
      })

      onClose()
    } catch (err: any) {
      console.error('Erro ao submeter documento:', err)
      setErrorMsg(err?.message || 'Erro ao carregar o documento. Tente novamente.')
    } finally {
      setIsUploading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[120] flex justify-center bg-black/40 backdrop-blur-xs transition-opacity animate-in fade-in duration-200">
      <div className="flex w-full max-w-[440px] flex-col bg-background shadow-2xl animate-in slide-in-from-bottom-6 duration-200 ease-out">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-warm-200 bg-surface px-4 py-4">
          <div>
            <h2 className="text-lg font-bold text-foreground leading-tight">Novo Documento</h2>
            <p className="text-xs text-secondary-500">Gestão e arquivo documental</p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            disabled={isUploading}
            aria-label="Fechar"
            className="rounded-full p-2 text-muted hover:bg-warm-100 disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="flex-1 overflow-y-auto p-4">
          <form ref={formRef} id="upload-doc-form" onSubmit={handleSubmit} className="flex flex-col gap-4">
            {errorMsg && (
              <div className="rounded-lg bg-red-50 p-3 text-xs text-red-700 border border-red-200">
                {errorMsg}
              </div>
            )}

            {/* File Drop / Select Area */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-secondary-600">
                Ficheiro <span className="text-primary-500">*</span>
              </label>

              <div
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                  'flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-5 text-center cursor-pointer transition-all',
                  selectedFile
                    ? 'border-emerald-400 bg-emerald-50/40 text-emerald-900'
                    : 'border-warm-300 bg-surface hover:border-primary-400 hover:bg-warm-50 text-secondary-600'
                )}
              >
                {selectedFile ? (
                  <>
                    <CheckCircle2 className="h-8 w-8 text-emerald-600" />
                    <div className="max-w-[280px] truncate">
                      <p className="text-sm font-bold truncate">{selectedFile.name}</p>
                      <p className="text-xs text-emerald-700">
                        {(selectedFile.size / 1024).toFixed(1)} KB · Clique para alterar
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100 text-primary-600">
                      <Upload className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-foreground">Escolher Ficheiro</p>
                      <p className="text-xs text-secondary-500">PDF, Word, Excel, Imagens ou Texto</p>
                    </div>
                  </>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
                  className="hidden"
                />
              </div>
            </div>

            {/* Document Title */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="doc-title" className="text-xs font-bold uppercase tracking-wider text-secondary-600">
                Título do Documento <span className="text-primary-500">*</span>
              </label>
              <input
                id="doc-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                placeholder="Ex: Estatutos da Associação 2026"
                className="rounded-[var(--radius-button)] border border-warm-200 bg-surface px-3 py-2 text-sm focus:border-primary-400 focus:outline-none focus:ring-1 focus:ring-primary-400"
              />
            </div>

            {/* Category Select with creatable option */}
            <div className="flex flex-col gap-1.5 z-[55]">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-secondary-600">
                  Categoria <span className="text-primary-500">*</span>
                </label>
                <span className="text-[11px] text-muted font-normal">
                  Pode escrever uma nova
                </span>
              </div>
              <CustomSelect
                value={category}
                onChange={(val) => setCategory(val)}
                options={categoryOptions}
                placeholder="Selecione ou digite uma nova categoria..."
                creatable
              />
            </div>

            {/* Document Status */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-secondary-600">
                Estado do Documento
              </label>
              <div className="grid grid-cols-2 gap-2 rounded-xl bg-warm-100 p-1">
                <button
                  type="button"
                  onClick={() => setStatus('em_uso')}
                  className={cn(
                    'flex items-center justify-center gap-2 rounded-lg py-2.5 text-xs font-bold transition-all',
                    status === 'em_uso'
                      ? 'bg-white text-emerald-700 shadow-sm'
                      : 'text-secondary-600 hover:text-foreground'
                  )}
                >
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <span>Em Uso (Vigente)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setStatus('arquivado')}
                  className={cn(
                    'flex items-center justify-center gap-2 rounded-lg py-2.5 text-xs font-bold transition-all',
                    status === 'arquivado'
                      ? 'bg-white text-secondary-900 shadow-sm'
                      : 'text-secondary-600 hover:text-foreground'
                  )}
                >
                  <Archive className="h-4 w-4 text-secondary-500" />
                  <span>Arquivado</span>
                </button>
              </div>
            </div>

            {/* Notes / Description */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="doc-notes" className="text-xs font-bold uppercase tracking-wider text-secondary-600">
                Observações (Opcional)
              </label>
              <textarea
                id="doc-notes"
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Notas de contexto, versão ou data de aprovação..."
                className="resize-none rounded-[var(--radius-button)] border border-warm-200 bg-surface px-3 py-2 text-sm focus:border-primary-400 focus:outline-none focus:ring-1 focus:ring-primary-400"
              />
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="border-t border-warm-200 bg-surface p-4">
          <button
            type="submit"
            form="upload-doc-form"
            disabled={isUploading || !selectedFile}
            className="flex w-full items-center justify-center gap-2 rounded-[var(--radius-button)] bg-primary-500 py-3 text-sm font-bold text-white shadow-sm transition-all hover:bg-primary-600 active:scale-95 disabled:opacity-50"
          >
            {isUploading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>A carregar documento...</span>
              </>
            ) : (
              <>
                <Upload className="h-4 w-4" />
                <span>Carregar Documento</span>
              </>
            )}
          </button>
        </div>
      </div>

      <UnsavedDialog
        isOpen={showUnsaved}
        onCancel={() => setShowUnsaved(false)}
        onDiscard={() => {
          setShowUnsaved(false)
          onClose()
        }}
        onSave={() => {
          setShowUnsaved(false)
          formRef.current?.requestSubmit()
        }}
      />
    </div>
  )
}
