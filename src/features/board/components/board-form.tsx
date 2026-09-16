import { useState, useRef } from 'react'
import { X } from 'lucide-react'
import type { AllowedUser } from '@/types/database'

import { useHardwareBack } from '@/hooks/use-hardware-back'
import { UnsavedDialog } from '@/components/ui/unsaved-dialog'
import { CustomSelect } from '@/components/ui/custom-select'

interface BoardFormProps {
  member?: AllowedUser
  onClose: () => void
  onSubmit: (data: Partial<AllowedUser>) => void
  isLoading?: boolean
}

export function BoardForm({ member, onClose, onSubmit, isLoading }: BoardFormProps) {

  const [isDirty, setIsDirty] = useState(false)
  const [showUnsaved, setShowUnsaved] = useState(false)
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

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-background">
      <div className="flex items-center justify-between border-b border-warm-200 bg-surface px-4 py-4">
        <h2 className="text-lg font-bold text-foreground">
          {member ? 'Editar Membro' : 'Novo Membro da Direção'}
        </h2>
        <button onClick={handleCloseClick} className="rounded-full p-2 text-muted hover:bg-warm-100">
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <form ref={formRef} onChange={() => setIsDirty(true)}  id="board-form"  onSubmit={handleSubmit} className="flex flex-col gap-4">
          
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
            <label className="text-sm font-medium text-secondary-700">Telemóvel</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="rounded-[var(--radius-button)] border border-warm-200 bg-surface px-3 py-2 text-sm focus:border-primary-400 focus:outline-none focus:ring-1 focus:ring-primary-400"
              placeholder="912345678"
            />
          </div>

          <div className="flex flex-col gap-1.5 z-[60]">
            <label className="text-sm font-medium text-secondary-700">Cargo</label>
            <CustomSelect
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
            <CustomSelect
              value={permissionLevel}
              onChange={(val) => setPermissionLevel(val as any)}
              options={[
                { label: 'Admin', value: 'superadmin' },
                { label: 'Nível 1', value: 'nivel_1' },
                { label: 'Nível 2', value: 'nivel_2' },
              ]}
            />
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
    
      <UnsavedDialog
        isOpen={showUnsaved}
        onCancel={() => setShowUnsaved(false)}
        onDiscard={() => {
          setShowUnsaved(false)
          onClose()
        }}
        onSave={handleSaveAndClose}
      />
</div>
  )
}
