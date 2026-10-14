import { useState, useEffect } from 'react'
import { FolderEdit, X } from 'lucide-react'

interface FolderEditModalProps {
  isOpen: boolean
  currentName: string
  onClose: () => void
  onSave: (oldName: string, newName: string) => void
  existingFolders: string[]
}

export function FolderEditModal({
  isOpen,
  currentName,
  onClose,
  onSave,
  existingFolders,
}: FolderEditModalProps) {
  const [name, setName] = useState(currentName)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setName(currentName)
    setError(null)
  }, [currentName, isOpen])

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) {
      setError('O nome da pasta não pode estar vazio.')
      return
    }

    if (
      trimmed.toLowerCase() !== currentName.toLowerCase() &&
      existingFolders.some((f) => f.toLowerCase() === trimmed.toLowerCase())
    ) {
      setError('Já existe uma pasta com esse nome.')
      return
    }

    onSave(currentName, trimmed)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-[130] flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-sm rounded-2xl border border-warm-200 bg-surface p-5 shadow-2xl animate-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-3 border-b border-warm-100">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600 border border-amber-200">
              <FolderEdit className="h-4 w-4" />
            </div>
            <h3 className="text-sm font-bold text-foreground">Editar Nome da Pasta</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1 text-muted hover:bg-warm-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="edit-folder-name-input" className="text-xs font-bold text-secondary-600">
              Nome da Pasta <span className="text-primary-500">*</span>
            </label>
            <input
              id="edit-folder-name-input"
              type="text"
              autoFocus
              required
              value={name}
              onChange={(e) => {
                setName(e.target.value)
                setError(null)
              }}
              className="rounded-[var(--radius-button)] border border-warm-200 bg-surface px-3 py-2 text-sm text-foreground focus:border-primary-400 focus:outline-none focus:ring-1 focus:ring-primary-400"
            />
            {error && <span className="text-xs text-red-500 font-medium">{error}</span>}
          </div>

          <div className="mt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-[var(--radius-button)] border border-warm-200 px-3.5 py-2 text-xs font-semibold text-secondary-700 hover:bg-warm-100 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!name.trim()}
              className="rounded-[var(--radius-button)] bg-primary-500 px-4 py-2 text-xs font-bold text-white hover:bg-primary-600 active:scale-95 disabled:opacity-50 transition-all"
            >
              Guardar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
