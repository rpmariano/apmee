import { useState } from 'react'
import { Plus } from 'lucide-react'
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
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-foreground">Direção</h1>
            {!isSuperAdmin && (
              <span className="rounded-full bg-warm-200 px-2 py-0.5 text-xs font-medium text-secondary-600">
                Apenas leitura
              </span>
            )}
          </div>
          <MenuAlerts />
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

      {isSuperAdmin && (
        <button
          type="button"
          aria-label="Adicionar membro da direção"
          className="fixed bottom-24 right-6 min-[430px]:right-[calc(50%-215px+1.5rem)] z-20 flex h-14 w-14 items-center justify-center rounded-full bg-primary-400 text-white shadow-lg transition-transform hover:scale-105 hover:bg-primary-500 active:scale-95"
          onClick={() => setIsFormOpen(true)}
        >
          <Plus className="h-6 w-6" />
        </button>
      )}

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
