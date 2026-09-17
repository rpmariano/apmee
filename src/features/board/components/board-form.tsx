import { useState, useRef } from 'react'
import { X, Trash2 } from 'lucide-react'
import type { AllowedUser } from '@/types/database'

import { useHardwareBack } from '@/hooks/use-hardware-back'
import { UnsavedDialog } from '@/components/ui/unsaved-dialog'
import { CustomSelect } from '@/components/ui/custom-select'
import { CustomDialog } from '@/components/ui/custom-dialog'

interface BoardFormProps {
  member?: AllowedUser
  onClose: () => void
  onSubmit: (data: Partial<AllowedUser>) => void
  isLoading?: boolean
  onDelete?: (id: string) => Promise<void>
}

export function BoardForm({ member, onClose, onSubmit, isLoading, onDelete }: BoardFormProps) {

  const isExistingMember = !!member
  const [isDirty, setIsDirty] = useState(false)
  const [showUnsaved, setShowUnsaved] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const isEditing = true
  const formRef = useRef<HTMLFormElement>(null)

  const handleCloseClick = () => {
    if (isDirty) setShowUnsaved(true)
    else onClose()
  }

  useHardwareBack(true, handleCloseClick)


  const handleSaveAndClose = () => {
    setShowUnsaved(false)
    formRef.current?.requestSubmit()
  }

  const [email, setEmail] = useState(member?.email ?? '')
  const [displayName, setDisplayName] = useState(member?.display_name ?? '')
  const [phone, setPhone] = useState(member?.phone ?? '')
  const [role, setRole] = useState(member?.role ?? 'admin')
  const [permissionLevel, setPermissionLevel] = useState(member?.permission_level ?? 'nivel_2')
  const [isActive, setIsActive] = useState(member?.is_active ?? true)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({
      email,
      display_name: displayName || null,
      phone: phone || null,
      role: role as any,
      permission_level: permissionLevel as any,
      is_active: isActive,
    })
  }

  const handleConfirmDelete = async () => {
    if (!member || !onDelete) return
    setIsDeleting(true)
    try {
      await onDelete(member.id)
      onClose()
    } finally {
      setIsDeleting(false)
      setShowDeleteConfirm(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex justify-center bg-black/40 backdrop-blur-xs transition-opacity animate-in fade-in duration-200">{/* Phone container */}<div className="flex w-full max-w-[430px] flex-col bg-background shadow-2xl animate-in slide-in-from-bottom-6 duration-200 ease-out">
      <div className="flex items-center justify-between border-b border-warm-200 bg-surface px-4 py-4">
        <h2 className="text-lg font-bold text-foreground">
          {member ? 'Editar Membro' : 'Novo Membro da Direção'}
        </h2>
        <div className="flex items-center gap-1">
          {isExistingMember && onDelete && (
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              aria-label="Desativar membro"
              className="rounded-full p-2 text-red-400 hover:bg-red-50"
            >
              <Trash2 className="h-5 w-5" />
            </button>
          )}
          <button onClick={handleCloseClick} aria-label="Fechar formulário" className="rounded-full p-2 text-muted hover:bg-warm-100">
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <form ref={formRef} onChange={() => setIsDirty(true)}  id="board-form"  onSubmit={handleSubmit} className="flex flex-col gap-4">
          
          <div className="flex flex-col gap-1.5">
            <label htmlFor="board-email" className="text-sm font-medium text-secondary-700">Email (Google) <span className="text-primary-500">*</span></label>
            <input id="board-email" disabled={!isEditing || !!member} 
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required // Cannot change email after creation
              className="rounded-[var(--radius-button)] border border-warm-200 bg-surface px-3 py-2 text-sm focus:border-primary-400 focus:outline-none focus:ring-1 focus:ring-primary-400 disabled:opacity-50"
              placeholder="email@gmail.com"
            />
            <p className="text-xs text-muted">Este é o email que será usado para fazer login na app.</p>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="board-name" className="text-sm font-medium text-secondary-700">Nome <span className="text-primary-500">*</span></label>
            <input id="board-name" disabled={!isEditing} 
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
              className="rounded-[var(--radius-button)] border border-warm-200 bg-surface px-3 py-2 text-sm focus:border-primary-400 focus:outline-none focus:ring-1 focus:ring-primary-400"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="board-phone" className="text-sm font-medium text-secondary-700">Telemóvel</label>
            <input id="board-phone" disabled={!isEditing} 
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="rounded-[var(--radius-button)] border border-warm-200 bg-surface px-3 py-2 text-sm focus:border-primary-400 focus:outline-none focus:ring-1 focus:ring-primary-400"
              placeholder="912345678"
            />
          </div>

          <div className="flex flex-col gap-1.5 z-[60]">
            <label className="text-sm font-medium text-secondary-700">Cargo</label>
            <CustomSelect disabled={!isEditing} 
              value={role}
              onChange={(val) => setRole(val as any)}
              options={[
                { label: 'Admin', value: 'admin' },
                { label: 'Presidente', value: 'presidente' },
                { label: 'Tesoureiro', value: 'tesoureiro' },
                { label: 'Gestor Social', value: 'gestor_social' },
              ]}
            />
          </div>

          <div className="flex flex-col gap-1.5 z-[50]">
            <label className="text-sm font-medium text-secondary-700">Nível de Acesso (Permissões)</label>
            <CustomSelect disabled={!isEditing} 
              value={permissionLevel}
              onChange={(val) => setPermissionLevel(val as any)}
              options={[
                { label: 'Admin (Acesso Total)', value: 'superadmin' },
                { label: 'Nível 1 (Gestão e Finanças)', value: 'nivel_1' },
                { label: 'Nível 2 (Operacional / Geral)', value: 'nivel_2' },
              ]}
            />
            <div className="mt-1 rounded-lg bg-warm-50 p-2.5 text-xs text-secondary-600 border border-warm-200 space-y-1">
              {permissionLevel === 'superadmin' && (
                <p><strong>Admin:</strong> Acesso total à plataforma, incluindo gestão de utilizadores e configurações.</p>
              )}
              {permissionLevel === 'nivel_1' && (
                <p><strong>Nível 1:</strong> Acesso de gestão a Tesouraria, Quotas, Eventos, Inventário e Tarefas.</p>
              )}
              {permissionLevel === 'nivel_2' && (
                <p><strong>Nível 2:</strong> Gestão de Tarefas, Contactos e Eventos (leitura financeira apenas).</p>
              )}
            </div>
          </div>

          <div className="my-2 border-t border-warm-200" />

          <label htmlFor="board-active" className="flex items-center gap-3 rounded-[var(--radius-card)] border border-warm-200 bg-surface p-4">
            <input id="board-active" disabled={!isEditing} 
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
          <div className="mt-4 pt-4 border-t border-warm-200 flex flex-col gap-2">
            {isExistingMember && onDelete && (
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                disabled={isDeleting}
                className="flex w-full items-center justify-center rounded-[var(--radius-button)] border border-red-200 bg-red-50/70 py-2.5 text-sm font-medium text-red-600 transition-all hover:bg-red-100 active:scale-95 disabled:opacity-50"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Desativar Membro
              </button>
            )}
            <button
              type="submit"
              disabled={isLoading}
              className="flex w-full items-center justify-center rounded-[var(--radius-button)] bg-primary-400 py-3 text-sm font-medium text-white shadow-sm transition-all hover:bg-primary-500 active:scale-95 disabled:opacity-50"
            >
              {isLoading ? 'A Guardar...' : (member ? 'Guardar Membro' : 'Adicionar Membro')}
            </button>
          </div>
        </form>
      </div>
    
      <UnsavedDialog
        isOpen={showUnsaved}
        onCancel={() => setShowUnsaved(false)}
        onDiscard={() => {
          setShowUnsaved(false)
          onClose()
        }}
        onSave={handleSaveAndClose}
      />

      <CustomDialog
        isOpen={showDeleteConfirm}
        title="Desativar Membro?"
        description={`Tem a certeza que pretende desativar "${member?.display_name || member?.email}"? O acesso à app será revogado imediatamente.`}
        variant="danger"
        confirmLabel="Sim, Desativar"
        cancelLabel="Cancelar"
        isLoading={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />
</div>
</div>
  )
}
