import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  X,
  Calendar,
  Wallet,
  ListTodo,
  Receipt,
  Users,
  Package,
} from 'lucide-react'
import { usePermissions } from '@/hooks/use-permissions'
import { useHardwareBack } from '@/hooks/use-hardware-back'
import { cn } from '@/lib/utils'

interface QuickActionsSheetProps {
  isOpen: boolean
  onClose: () => void
}

interface QuickActionItem {
  to: string
  label: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  iconBg: string
  iconColor: string
  permission: string
}

export function QuickActionsSheet({ isOpen, onClose }: QuickActionsSheetProps) {
  const navigate = useNavigate()
  const { canWrite } = usePermissions()

  useHardwareBack(isOpen, onClose)

  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const actions: QuickActionItem[] = [
    {
      to: '/tesouraria?new=1',
      label: 'Movimento Financeiro',
      description: 'Receita ou despesa',
      icon: Wallet,
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-700',
      permission: 'treasury',
    },
    {
      to: '/agenda?new=1',
      label: 'Evento ou Reunião',
      description: 'Festa, assembleia, direção',
      icon: Calendar,
      iconBg: 'bg-primary-100',
      iconColor: 'text-primary-600',
      permission: 'events',
    },
    {
      to: '/tarefas?new=1',
      label: 'Nova Tarefa',
      description: 'Atribuir afazer à equipa',
      icon: ListTodo,
      iconBg: 'bg-emerald-100',
      iconColor: 'text-emerald-700',
      permission: 'tasks',
    },
    {
      to: '/quotas?new=1',
      label: 'Registar Quota',
      description: 'Pagamento de quota anual',
      icon: Receipt,
      iconBg: 'bg-amber-100',
      iconColor: 'text-amber-700',
      permission: 'quotas',
    },
    {
      to: '/contactos?new=1',
      label: 'Novo Contacto',
      description: 'Encarregado, parceiro ou sócio',
      icon: Users,
      iconBg: 'bg-indigo-100',
      iconColor: 'text-indigo-700',
      permission: 'contacts',
    },
    {
      to: '/inventario?new=1',
      label: 'Artigo de Inventário',
      description: 'Material escolar ou stock',
      icon: Package,
      iconBg: 'bg-warm-200',
      iconColor: 'text-secondary-800',
      permission: 'inventory',
    },
  ]

  const allowedActions = actions.filter((a) => canWrite(a.permission))

  const handleActionClick = (to: string) => {
    onClose()
    navigate(to)
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Ações Rápidas de Criação"
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[430px] rounded-t-[var(--radius-card)] bg-surface border-t border-warm-200 p-5 shadow-2xl animate-in slide-in-from-bottom-5 duration-200 pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle / Drag bar */}
        <div className="mx-auto -mt-2 mb-3 h-1 w-10 rounded-full bg-warm-300" />

        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-warm-200/70">
          <div className="flex flex-col">
            <h3 className="text-base font-bold text-foreground">Criar Novo</h3>
            <p className="text-xs text-secondary-500">Selecione o que deseja registar</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar ações rápidas"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-warm-100 text-secondary-600 hover:bg-warm-200 active:scale-95 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Action Grid */}
        <div className="mt-3.5 grid grid-cols-2 gap-2.5">
          {allowedActions.map((action) => (
            <button
              key={action.to}
              type="button"
              onClick={() => handleActionClick(action.to)}
              className={cn(
                'flex flex-col items-start gap-2 rounded-[var(--radius-card)] border border-warm-200 bg-surface p-3 text-left shadow-xs transition-all',
                'hover:border-primary-300 hover:bg-warm-50/80 active:scale-[0.98]'
              )}
            >
              <div className={cn('flex h-9 w-9 items-center justify-center rounded-full', action.iconBg, action.iconColor)}>
                <action.icon className="h-4.5 w-4.5" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-bold text-foreground leading-tight">
                  {action.label}
                </span>
                <span className="mt-0.5 text-xs text-secondary-500 leading-snug line-clamp-1">
                  {action.description}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
