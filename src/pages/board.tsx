import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, ArrowLeft } from 'lucide-react'
import { BoardList } from '@/features/board/components/board-list'
import { BoardForm } from '@/features/board/components/board-form'
import { useBoardMembers, useCreateMember, useUpdateMember, useDeleteMember } from '@/features/board/api/use-board'
import { usePermissions } from '@/hooks/use-permissions'
import type { AllowedUser } from '@/types/database'
import { CustomDialog } from '@/components/ui/custom-dialog'
import { useToast } from '@/components/ui/toast'
import { getFriendlyErrorMessage } from '@/lib/error-utils'
import { MenuAlerts } from '@/components/ui/menu-alerts'

export default function BoardPage() {
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingMember, setEditingMember] = useState<AllowedUser | undefined>()
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const { data: members, isLoading } = useBoardMembers()
  const createMutation = useCreateMember()
  const updateMutation = useUpdateMember()
  const deleteMutation = useDeleteMember()
  const { toast } = useToast()
  
  const { isSuperAdmin } = usePermissions()
  

  const handleEditMember = (member: AllowedUser) => {
    if (!isSuperAdmin) return
    setEditingMember(member)
    setIsFormOpen(true)
  }

  const handleCloseForm = () => {
    setIsFormOpen(false)
    setEditingMember(undefined)
  }

  const handleSubmitForm = async (data: Partial<AllowedUser>) => {
    try {
      if (editingMember) {
        await updateMutation.mutateAsync({ id: editingMember.id, ...data } as any)
        toast.success('Membro da direção atualizado!')
      } else {
        await createMutation.mutateAsync(data as any)
        toast.success('Membro adicionado à direção!')
      }
      handleCloseForm()
    } catch (error: any) {
      console.error('Failed to save member:', error)
      const friendlyMsg = getFriendlyErrorMessage(error, '')
      setErrorMessage(friendlyMsg || error?.message || error?.details || 'Erro ao guardar membro. Tente novamente.')
    }
  }

  const handleDeleteMember = async (id: string) => {
    await deleteMutation.mutateAsync(id)
    toast.success('Membro desativado com sucesso!')
  }

  return (
    <div className="relative min-h-[calc(100vh-4rem)] bg-background pb-4">
      <div className="sticky top-0 z-10 bg-background/95 pb-2 pt-6 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="px-4 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Link
              to="/menu"
              aria-label="Voltar ao Menu"
              className="flex h-9 w-9 items-center justify-center rounded-full text-secondary-600 hover:bg-warm-100 hover:text-foreground active:scale-95 transition-all -ml-1"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <h1 className="text-xl font-bold text-foreground">Direção</h1>
            {!isSuperAdmin && (
              <span className="rounded-full bg-warm-200 px-2 py-0.5 text-xs font-medium text-secondary-600">
                Apenas leitura
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {isSuperAdmin && (
              <button
                type="button"
                onClick={() => {
                  setEditingMember(undefined)
                  setIsFormOpen(true)
                }}
                aria-label="+ Criar membro da direção"
                className="flex items-center gap-1 rounded-full bg-primary-500 px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-primary-600 transition-all active:scale-95 shrink-0"
              >
                <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
                <span>Criar</span>
              </button>
            )}
            <MenuAlerts />
          </div>
        </div>
        <p className="px-4 mt-2 text-sm text-muted">Gestão de acessos à plataforma.</p>
      </div>

      <div className="px-4 mt-2">
        <BoardList 
          members={members} 
          isLoading={isLoading} 
          onEdit={isSuperAdmin ? handleEditMember : undefined} 
        />
      </div>

      {isFormOpen && (
        <BoardForm
          member={editingMember}
          onClose={handleCloseForm}
          onSubmit={handleSubmitForm}
          isLoading={createMutation.isPending || updateMutation.isPending || deleteMutation.isPending}
          onDelete={isSuperAdmin ? handleDeleteMember : undefined}
        />
      )}

      <CustomDialog
        isOpen={!!errorMessage}
        title="Erro ao guardar membro"
        description={errorMessage || ''}
        variant="danger"
        confirmLabel="OK"
        onConfirm={() => setErrorMessage(null)}
      />
    </div>
  )
}
