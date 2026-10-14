import { Folder, ChevronRight, Pencil, Trash2 } from 'lucide-react'

interface FolderCardProps {
  name: string
  totalCount: number
  inUseCount: number
  onClick: () => void
  onEdit?: (name: string) => void
  onDelete?: (name: string) => void
}

export function FolderCard({
  name,
  totalCount,
  inUseCount,
  onClick,
  onEdit,
  onDelete,
}: FolderCardProps) {
  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onClick()
        }
      }}
      className="group relative flex flex-col justify-between rounded-2xl border border-warm-200/90 bg-surface p-4 text-left shadow-xs transition-all hover:border-amber-400 hover:shadow-md cursor-pointer"
    >
      <div className="flex items-start justify-between gap-2 w-full">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-amber-600 border border-amber-200/60 group-hover:bg-amber-100 group-hover:text-amber-700 transition-colors shadow-2xs">
          <Folder className="h-6 w-6 fill-amber-500/20" />
        </div>

        <div className="flex items-center gap-1">
          <span className="rounded-full bg-warm-100 px-2 py-0.5 text-[11px] font-bold text-secondary-700">
            {totalCount}
          </span>
          {(onEdit || onDelete) && (
            <div
              className="flex items-center opacity-80 sm:opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={(e) => e.stopPropagation()}
            >
              {onEdit && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    onEdit(name)
                  }}
                  className="rounded-full p-1 text-muted hover:bg-warm-100 hover:text-foreground transition-colors"
                  title="Editar nome da pasta"
                  aria-label="Editar nome da pasta"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
              )}
              {onDelete && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    onDelete(name)
                  }}
                  className="rounded-full p-1 text-muted hover:bg-red-50 hover:text-red-600 transition-colors"
                  title="Eliminar pasta"
                  aria-label="Eliminar pasta"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="mt-3 w-full">
        <div className="flex items-center justify-between gap-1">
          <h3 className="text-sm font-bold text-foreground leading-snug line-clamp-2 group-hover:text-amber-900 transition-colors">
            {name}
          </h3>
          <ChevronRight className="h-4 w-4 shrink-0 text-muted group-hover:text-foreground group-hover:translate-x-0.5 transition-all" />
        </div>

        <p className="mt-1 text-[11px] text-muted">
          {totalCount === 0
            ? 'Pasta vazia'
            : `${inUseCount} em uso`}
        </p>
      </div>
    </div>
  )
}
