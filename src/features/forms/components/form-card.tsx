import { useState } from 'react'
import {
  ExternalLink,
  Copy,
  Check,
  CheckCircle2,
  Archive,
  MoreVertical,
  Pencil,
  Trash2,
  ClipboardList,
} from 'lucide-react'
import type { AppForm, FormStatus } from '../types'
import { CustomDialog } from '@/components/ui/custom-dialog'
import { useToast } from '@/components/ui/toast'
import { cn } from '@/lib/utils'

interface FormCardProps {
  form: AppForm
  onStatusChange: (id: string, newStatus: FormStatus) => void
  onEdit: (form: AppForm) => void
  onDelete: (id: string) => void
  canEdit?: boolean
}

export function FormCard({
  form,
  onStatusChange,
  onEdit,
  onDelete,
  canEdit = true,
}: FormCardProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const [hasCopied, setHasCopied] = useState(false)
  const { toast } = useToast()

  const isInUse = form.status === 'em_uso'

  const handleOpenUrl = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!form.url) return
    window.open(form.url, '_blank', 'noopener,noreferrer')
  }

  const handleCopyLink = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!form.url) return
    try {
      await navigator.clipboard.writeText(form.url)
      setHasCopied(true)
      toast.success('Link copiado para a área de transferência!')
      setTimeout(() => setHasCopied(false), 2000)
    } catch {
      toast.error('Não foi possível copiar o link.')
    }
  }

  const handleToggleStatus = (e: React.MouseEvent) => {
    e.stopPropagation()
    const nextStatus: FormStatus = isInUse ? 'arquivado' : 'em_uso'
    onStatusChange(form.id, nextStatus)
  }

  return (
    <>
      <div
        className={cn(
          'group relative flex flex-col justify-between rounded-2xl border bg-surface p-4 transition-all hover:shadow-md',
          isInUse
            ? 'border-warm-200/90 shadow-xs'
            : 'border-warm-200/60 bg-warm-50/50 opacity-80'
        )}
      >
        <div>
          {/* Top Row: Category + Status Badge + Menu button */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="inline-flex items-center rounded-md bg-warm-100 px-2 py-0.5 text-[11px] font-semibold text-secondary-700">
                {form.category}
              </span>

              {isInUse ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700 border border-emerald-200/60">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Em Uso
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full bg-warm-100 px-2 py-0.5 text-[11px] font-medium text-muted">
                  <Archive className="h-3 w-3" />
                  Arquivado
                </span>
              )}
            </div>

            {canEdit && (
              <div className="relative">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    setShowMenu(!showMenu)
                  }}
                  aria-label="Opções do formulário"
                  className="rounded-full p-1.5 text-muted hover:bg-warm-100 hover:text-foreground"
                >
                  <MoreVertical className="h-4 w-4" />
                </button>

                {showMenu && (
                  <>
                    <div
                      className="fixed inset-0 z-30"
                      onClick={(e) => {
                        e.stopPropagation()
                        setShowMenu(false)
                      }}
                    />
                    <div className="absolute right-0 top-7 z-40 w-44 rounded-xl border border-warm-200 bg-surface p-1 shadow-lg animate-in fade-in zoom-in-95 duration-100">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          setShowMenu(false)
                          onEdit(form)
                        }}
                        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-foreground hover:bg-warm-100"
                      >
                        <Pencil className="h-3.5 w-3.5 text-secondary-500" />
                        <span>Editar</span>
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          setShowMenu(false)
                          handleToggleStatus(e)
                        }}
                        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-foreground hover:bg-warm-100"
                      >
                        {isInUse ? (
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

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          setShowMenu(false)
                          setShowDeleteDialog(true)
                        }}
                        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span>Eliminar</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Form Title & Icon */}
          <div className="mt-2.5 flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-700 border border-teal-200/60 shadow-xs">
              <ClipboardList className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-bold text-foreground leading-snug line-clamp-2">
                {form.title}
              </h3>
              {form.description && (
                <p className="mt-1 text-xs text-secondary-600 line-clamp-2 leading-relaxed">
                  {form.description}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="mt-4 pt-3 border-t border-warm-100 flex items-center justify-between gap-2">
          {/* Main Action: Open Form Link */}
          <button
            type="button"
            onClick={handleOpenUrl}
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-[var(--radius-button)] bg-primary-500 px-3.5 py-2 text-xs font-bold text-white shadow-xs transition-all hover:bg-primary-600 active:scale-95"
          >
            <span>Abrir Formulário</span>
            <ExternalLink className="h-3.5 w-3.5" />
          </button>

          {/* Copy link button */}
          <button
            type="button"
            onClick={handleCopyLink}
            title="Copiar link"
            className="inline-flex items-center justify-center rounded-[var(--radius-button)] border border-warm-200 bg-surface p-2 text-secondary-600 transition-colors hover:bg-warm-100 hover:text-foreground"
          >
            {hasCopied ? (
              <Check className="h-4 w-4 text-emerald-600" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </button>

          {/* Quick toggle status icon button */}
          <button
            type="button"
            onClick={handleToggleStatus}
            title={isInUse ? 'Arquivar formulário' : 'Reativar (Em Uso)'}
            className={cn(
              'inline-flex items-center justify-center rounded-[var(--radius-button)] border p-2 transition-colors',
              isInUse
                ? 'border-warm-200 bg-surface text-secondary-500 hover:bg-warm-100 hover:text-foreground'
                : 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
            )}
          >
            {isInUse ? (
              <Archive className="h-4 w-4" />
            ) : (
              <CheckCircle2 className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <CustomDialog
        isOpen={showDeleteDialog}
        title="Eliminar Formulário"
        description={`Tem a certeza de que pretende eliminar "${form.title}"? Esta ação removerá o formulário da lista.`}
        confirmLabel="Sim, Eliminar"
        cancelLabel="Cancelar"
        variant="danger"
        onConfirm={() => {
          setShowDeleteDialog(false)
          onDelete(form.id)
        }}
        onCancel={() => setShowDeleteDialog(false)}
      />
    </>
  )
}
