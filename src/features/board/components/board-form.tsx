import { useState } from 'react'
import { X } from 'lucide-react'
import type { AllowedUser } from '@/types/database'

interface BoardFormProps {
  member?: AllowedUser
  onClose: () => void
  onSubmit: (data: Partial<AllowedUser>) => void
  isLoading?: boolean
}

export function BoardForm({ member, onClose, onSubmit, isLoading }: BoardFormProps) {
  const [email, setEmail] = useState(member?.email ?? '')
  const [displayName, setDisplayName] = useState(member?.display_name ?? '')
  const [role, setRole] = useState(member?.role ?? 'vogal')
  const [permissionLevel, setPermissionLevel] = useState(member?.permission_level ?? 'nivel_2')
  const [isActive, setIsActive] = useState(member?.is_active ?? true)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({
      email,
      display_name: displayName || null,
      role: role as any,
      permission_level: permissionLevel as any,
      is_active: isActive,
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background">
      <div className="flex items-center justify-between border-b border-warm-200 bg-surface px-4 py-4">
        <h2 className="text-lg font-bold text-foreground">
          {member ? 'Editar Membro' : 'Novo Membro da Direção'}
        </h2>
        <button onClick={onClose} className="rounded-full p-2 text-muted hover:bg-warm-100">
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <form id="board-form" onSubmit={handleSubmit} className="flex flex-col gap-4">
          
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-secondary-700">Email (Google) <span className="text-primary-500">*</span></label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={!!member} // Cannot change email after creation
              className="rounded-[var(--radius-button)] border border-warm-200 bg-surface px-3 py-2 text-sm focus:border-primary-400 focus:outline-none focus:ring-1 focus:ring-primary-400 disabled:opacity-50"
              placeholder="email@gmail.com"
            />
            <p className="text-xs text-muted">Este é o email que será usado para fazer login na app.</p>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-secondary-700">Nome <span className="text-primary-500">*</span></label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
              className="rounded-[var(--radius-button)] border border-warm-200 bg-surface px-3 py-2 text-sm focus:border-primary-400 focus:outline-none focus:ring-1 focus:ring-primary-400"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-secondary-700">Cargo</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as any)}
              className="rounded-[var(--radius-button)] border border-warm-200 bg-surface px-3 py-2 text-sm focus:border-primary-400 focus:outline-none focus:ring-1 focus:ring-primary-400"
            >
              <option value="presidente">Presidente</option>
              <option value="tesoureiro">Tesoureiro</option>
              <option value="gestor_social">Gestor Social</option>
              <option value="vogal">Vogal</option>
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-secondary-700">Nível de Acesso (Permissões)</label>
            <select
              value={permissionLevel}
              onChange={(e) => setPermissionLevel(e.target.value as any)}
              className="rounded-[var(--radius-button)] border border-warm-200 bg-surface px-3 py-2 text-sm focus:border-primary-400 focus:outline-none focus:ring-1 focus:ring-primary-400"
            >
              <option value="superadmin">Super Admin (Acesso Total + Gestão de Utilizadores)</option>
              <option value="nivel_1">Nível 1 (Leitura/Escrita Total incluindo Tesouraria)</option>
              <option value="nivel_2">Nível 2 (Apenas leitura na Tesouraria e Quotas)</option>
            </select>
          </div>

          <div className="my-2 border-t border-warm-200" />

          <label className="flex items-center gap-3 rounded-[var(--radius-card)] border border-warm-200 bg-surface p-4">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="h-5 w-5 rounded border-warm-300 text-primary-500 focus:ring-primary-400"
            />
            <div className="flex flex-col">
              <span className="font-bold text-foreground">Acesso Ativo</span>
              <span className="text-xs text-muted">Se desmarcar, este membro perde o acesso à app.</span>
            </div>
          </label>

          {/* Moved Submit Button INSIDE the form to prevent silent HTML5 validation failures on mobile */}
          <div className="mt-4 pt-4 border-t border-warm-200">
            <button
              type="submit"
              disabled={isLoading}
              className="flex w-full items-center justify-center rounded-[var(--radius-button)] bg-primary-400 py-3 text-sm font-medium text-white shadow-sm transition-all hover:bg-primary-500 active:scale-95 disabled:opacity-50"
            >
              {isLoading ? 'A Guardar...' : 'Guardar Membro'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
