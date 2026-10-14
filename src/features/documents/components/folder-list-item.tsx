import { Folder, ChevronRight, Pencil, Trash2 } from 'lucide-react'

interface FolderListItemProps {
  name: string
  totalCount: number
  inUseCount: number
  onClick: () => void
  onEdit?: (name: string) => void
  onDelete?: (name: string) => void
}

export function FolderListItem({
  name,
  totalCount,
  inUseCount,
  onClick,
  onEdit,
  onDelete,
}: FolderListItemProps) {
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
      className="group flex items-center justify-between gap-3 rounded-xl border border-warm-200 bg-surface px-3.5 py-3 shadow-2xs hover:border-amber-400 hover:shadow-xs transition-all cursor-pointer"
    >
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-600 border border-amber-200/60 group-hover:bg-amber-100 group-hover:text-amber-700 transition-colors">
          <Folder className="h-5 w-5 fill-amber-500/20" />
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-bold text-foreground truncate group-hover:text-amber-900 transition-colors">
            {name}
          </h3>
          <p className="text-[11px] text-muted truncate mt-0.5">
            {totalCount} {totalCount === 1 ? 'ficheiro' : 'ficheiros'}
            {totalCount > 0 ? ` · ${inUseCount} em uso` : ' · Vazia'}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
        {onEdit && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onEdit(name)
            }}
            className="rounded-lg p-1.5 text-muted hover:bg-warm-100 hover:text-foreground transition-colors"
            title="Editar nome da pasta"
            aria-label="Editar nome da pasta"
          >
            <Pencil className="h-4 w-4" />
          </button>
        )}

        {onDelete && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onDelete(name)
            }}
            className="rounded-lg p-1.5 text-muted hover:bg-red-50 hover:text-red-600 transition-colors"
            title="Eliminar pasta"
            aria-label="Eliminar pasta"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}

        <div className="pl-1 text-muted group-hover:text-foreground group-hover:translate-x-0.5 transition-all">
          <ChevronRight className="h-4 w-4" />
        </div>
      </div>
    </div>
  )
}
