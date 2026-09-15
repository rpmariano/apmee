import { BoardCard } from './board-card'
import type { AllowedUser } from '@/types/database'

interface BoardListProps {
  members?: AllowedUser[]
  isLoading: boolean
  onEdit?: (member: AllowedUser) => void
}

export function BoardList({ members, isLoading, onEdit }: BoardListProps) {
  if (isLoading) {
    return (
      <div className="flex flex-col gap-3 py-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 w-full animate-pulse rounded-[var(--radius-card)] bg-warm-100" />
        ))}
      </div>
    )
  }

  if (!members || members.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="mt-4 text-sm font-medium text-foreground">Sem Membros</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3 py-4">
      {members.map((member) => (
        <BoardCard key={member.id} member={member} onEdit={onEdit} />
      ))}
    </div>
  )
}
