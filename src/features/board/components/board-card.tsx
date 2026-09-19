import { Shield, ShieldAlert, UserCog, Phone } from 'lucide-react'
import type { AllowedUser } from '@/types/database'
import { cn } from '@/lib/utils'

interface BoardCardProps {
  member: AllowedUser
  onEdit?: (member: AllowedUser) => void
}

const ROLE_LABELS: Record<string, string> = {
  admin: 'Admin',
  presidente: 'Presidente',
  tesoureiro: 'Tesoureiro',
  gestor_social: 'Gestor Social',
  vogal: 'Vogal',
}

const PERMISSION_LABELS: Record<string, string> = {
  superadmin: 'Administração',
  nivel_1: 'Executivo & Finanças',
  nivel_2: 'Operacional',
}

export function BoardCard({ member, onEdit }: BoardCardProps) {
  const isActive = member.is_active

  return (
    <div 
      className={cn(
        "flex flex-col gap-2 rounded-[var(--radius-card)] border border-warm-200 bg-surface p-4 shadow-sm transition-all",
        !isActive && "opacity-60",
        onEdit && "cursor-pointer active:scale-[0.98] hover:shadow-md"
      )}
      onClick={() => onEdit && onEdit(member)}
    >
      <div className="flex items-start justify-between gap-4">
        
        <div className="flex flex-1 items-start gap-3">
          <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-100 text-primary-700">
            {member.avatar_url ? (
              <img src={member.avatar_url} alt="Avatar" className="h-full w-full rounded-full object-cover" />
            ) : (
              <UserCog className="h-5 w-5" />
            )}
          </div>
          
          <div className="flex flex-col overflow-hidden">
            <span className="truncate font-bold text-foreground leading-tight">
              {member.display_name || 'Sem Nome'}
            </span>
            <span className="text-xs text-secondary-500 truncate">{member.email}</span>
            
            {member.phone && (
              <div className="mt-1 flex items-center gap-1 text-xs font-medium text-secondary-600">
                <Phone className="h-3 w-3" />
                {member.phone}
              </div>
            )}
            
            <div className="mt-2 flex items-center gap-2">
              <span className="rounded-md bg-warm-100 px-1.5 py-0.5 text-xs font-bold uppercase tracking-wider text-secondary-700">
                {ROLE_LABELS[member.role] || member.role}
              </span>
            </div>
          </div>
        </div>

        {/* Status / Permission */}
        <div className="flex shrink-0 flex-col items-end gap-1">
          {isActive ? (
            <div className="flex items-center gap-1 rounded-full bg-green-50 px-2 py-1 text-xs font-semibold text-green-700">
              <Shield className="h-3.5 w-3.5" />
              Ativo
            </div>
          ) : (
            <div className="flex items-center gap-1 rounded-full bg-red-50 px-2 py-1 text-xs font-semibold text-red-700">
              <ShieldAlert className="h-3.5 w-3.5" />
              Inativo
            </div>
          )}
          <span className="text-xs font-bold text-primary-600">{PERMISSION_LABELS[member.permission_level]}</span>
        </div>
      </div>
    </div>
  )
}
