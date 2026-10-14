import { useState, useRef, useMemo, useEffect } from 'react'
import { X, CheckCircle2, Archive, Loader2, Link as LinkIcon, ClipboardList } from 'lucide-react'
import { CustomSelect } from '@/components/ui/custom-select'
import { UnsavedDialog } from '@/components/ui/unsaved-dialog'
import { useHardwareBack } from '@/hooks/use-hardware-back'
import {
  type FormStatus,
  type AppForm,
  DEFAULT_FORM_CATEGORIES,
} from '../types'
import { cn } from '@/lib/utils'

interface FormModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: {
    title: string
    url: string
    description?: string
    category: string
    status: FormStatus
  }) => Promise<void>
  initialData?: AppForm | null
  existingCategories: string[]
}

export function FormModal({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  existingCategories,
}: FormModalProps) {
  const isEditing = Boolean(initialData)

  const [title, setTitle] = useState(initialData?.title || '')
  const [url, setUrl] = useState(initialData?.url || '')
  const [category, setCategory] = useState(initialData?.category || 'Geral')
  const [status, setStatus] = useState<FormStatus>(initialData?.status || 'em_uso')
  const [description, setDescription] = useState(initialData?.description || '')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [showUnsaved, setShowUnsaved] = useState(false)

  const formRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title)
      setUrl(initialData.url)
      setCategory(initialData.category)
      setStatus(initialData.status)
      setDescription(initialData.description || '')
    } else {
      setTitle('')
      setUrl('')
      setCategory('Geral')
      setStatus('em_uso')
      setDescription('')
    }
    setErrorMsg(null)
  }, [initialData, isOpen])

  const isDirty = isEditing
    ? title !== (initialData?.title || '') ||
      url !== (initialData?.url || '') ||
      category !== (initialData?.category || '') ||
      status !== (initialData?.status || 'em_uso') ||
      description !== (initialData?.description || '')
    : Boolean(title || url || description || category !== 'Geral' || status !== 'em_uso')

  const handleClose = () => {
    if (isDirty && !isSubmitting) {
      setShowUnsaved(true)
    } else {
      onClose()
    }
  }

  useHardwareBack(isOpen, handleClose)

  // Merge default categories with any custom ones already in use
  const categoryOptions = useMemo(() => {
    const set = new Set([...DEFAULT_FORM_CATEGORIES, ...existingCategories])
    return Array.from(set).map((cat) => ({
      label: cat,
      value: cat,
    }))
  }, [existingCategories])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!title.trim()) {
      setErrorMsg('Por favor defina o nome do formulário.')
      return
    }

    let cleanUrl = url.trim()
    if (!cleanUrl) {
      setErrorMsg('Por favor insira o link do formulário.')
      return
    }

    // Auto-prepend https:// if protocol is omitted
    if (!/^https?:\/\//i.test(cleanUrl)) {
      cleanUrl = `https://${cleanUrl}`
    }

    try {
      new URL(cleanUrl)
    } catch {
      setErrorMsg('O endereço fornecido não parece ser um link válido.')
      return
    }

    if (!category.trim()) {
      setErrorMsg('Por favor escolha ou crie uma categoria.')
      return
    }

    try {
      setIsSubmitting(true)
      setErrorMsg(null)

      await onSubmit({
        title: title.trim(),
        url: cleanUrl,
        description: description.trim() || undefined,
        category: category.trim(),
        status,
      })

      onClose()
    } catch (err: any) {
      console.error('Erro ao guardar formulário:', err)
      setErrorMsg(err?.message || 'Erro ao guardar o formulário. Tente novamente.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[120] flex justify-center bg-black/40 backdrop-blur-xs transition-opacity animate-in fade-in duration-200">
      <div className="flex w-full max-w-[440px] flex-col bg-background shadow-2xl animate-in slide-in-from-bottom-6 duration-200 ease-out">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-warm-200 bg-surface px-4 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-50 text-teal-700 border border-teal-200/60">
              <ClipboardList className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground leading-tight">
                {isEditing ? 'Editar Formulário' : 'Novo Formulário'}
              </h2>
              <p className="text-xs text-secondary-500">Links para Microsoft Forms ou Inquéritos</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            disabled={isSubmitting}
            aria-label="Fechar"
            className="rounded-full p-2 text-muted hover:bg-warm-100 disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="flex-1 overflow-y-auto p-4">
          <form ref={formRef} id="form-item-form" onSubmit={handleSubmit} className="flex flex-col gap-4">
            {errorMsg && (
              <div className="rounded-lg bg-red-50 p-3 text-xs text-red-700 border border-red-200">
                {errorMsg}
              </div>
            )}

            {/* Form Title / Name */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="form-title" className="text-xs font-bold uppercase tracking-wider text-secondary-600">
                Nome do Formulário <span className="text-primary-500">*</span>
              </label>
              <input
                id="form-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                placeholder="Ex: Inscrição Magusto 2026 / Inquérito aos Pais"
                className="rounded-[var(--radius-button)] border border-warm-200 bg-surface px-3 py-2 text-sm text-foreground focus:border-primary-400 focus:outline-none focus:ring-1 focus:ring-primary-400"
              />
            </div>

            {/* Form URL / Link */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="form-url" className="text-xs font-bold uppercase tracking-wider text-secondary-600">
                Link do Formulário <span className="text-primary-500">*</span>
              </label>
              <div className="relative">
                <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
                <input
                  id="form-url"
                  type="text"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  required
                  placeholder="https://forms.office.com/r/... ou link"
                  className="w-full rounded-[var(--radius-button)] border border-warm-200 bg-surface pl-9 pr-3 py-2 text-sm text-foreground focus:border-primary-400 focus:outline-none focus:ring-1 focus:ring-primary-400"
                />
              </div>
              <p className="text-[11px] text-muted">
                Cole o link direto do Microsoft Forms, Google Forms ou similar.
              </p>
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
                placeholder="Selecione ou crie uma categoria..."
                creatable
              />
            </div>

            {/* Status (Em Uso vs Arquivado) */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-secondary-600">
                Estado do Formulário
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
                  <span>Em Uso (Ativo)</span>
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

            {/* Description / Notes */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="form-description" className="text-xs font-bold uppercase tracking-wider text-secondary-600">
                Descrição ou Notas (Opcional)
              </label>
              <textarea
                id="form-description"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Indique o objetivo do questionário, datas limite ou público-alvo..."
                className="resize-none rounded-[var(--radius-button)] border border-warm-200 bg-surface px-3 py-2 text-sm text-foreground focus:border-primary-400 focus:outline-none focus:ring-1 focus:ring-primary-400"
              />
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="border-t border-warm-200 bg-surface p-4">
          <button
            type="submit"
            form="form-item-form"
            disabled={isSubmitting || !title.trim() || !url.trim()}
            className="flex w-full items-center justify-center gap-2 rounded-[var(--radius-button)] bg-primary-500 py-3 text-sm font-bold text-white shadow-sm transition-all hover:bg-primary-600 active:scale-95 disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>A guardar...</span>
              </>
            ) : (
              <span>{isEditing ? 'Guardar Alterações' : 'Guardar Formulário'}</span>
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
