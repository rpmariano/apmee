interface UnsavedDialogProps {
  isOpen: boolean
  onCancel: () => void
  onDiscard: () => void
  onSave: () => void
}

export function UnsavedDialog({ isOpen, onCancel, onDiscard, onSave }: UnsavedDialogProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm transition-all">
      <div className="w-full max-w-sm rounded-[var(--radius-card)] bg-surface p-6 shadow-xl animate-in zoom-in-95">
        <h3 className="text-lg font-bold text-foreground">Alterações não guardadas</h3>
        <p className="mt-2 text-sm text-secondary-600">
          Fez alterações a este registo que ainda não foram gravadas. O que pretende fazer?
        </p>
        
        <div className="mt-6 flex flex-col gap-2">
          <button
            onClick={onSave}
            className="flex w-full items-center justify-center rounded-[var(--radius-button)] bg-primary-400 py-3 text-sm font-bold text-white shadow-sm transition-all hover:bg-primary-500 active:scale-95"
          >
            Gravar e Sair
          </button>
          
          <button
            onClick={onDiscard}
            className="flex w-full items-center justify-center rounded-[var(--radius-button)] bg-red-50 py-3 text-sm font-bold text-red-600 transition-all hover:bg-red-100 active:scale-95"
          >
            Sair sem Gravar
          </button>
          
          <button
            onClick={onCancel}
            className="flex w-full items-center justify-center rounded-[var(--radius-button)] bg-warm-100 py-3 text-sm font-bold text-secondary-700 transition-all hover:bg-warm-200 active:scale-95"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  )
}
