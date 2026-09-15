import { QuotaCard, type QuotaWithContact } from './quota-card'

type FilterValue = 'all' | 'paid' | 'unpaid'

interface QuotaListProps {
  quotas?: QuotaWithContact[]
  filter: FilterValue
  isLoading: boolean
  onEdit?: (quota: QuotaWithContact) => void
}

export function QuotaList({ quotas, filter, isLoading, onEdit }: QuotaListProps) {
  if (isLoading) {
    return (
      <div className="flex flex-col gap-3 py-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 w-full animate-pulse rounded-[var(--radius-card)] bg-warm-100" />
        ))}
      </div>
    )
  }

  const filteredQuotas = (quotas || []).filter((q) => {
    if (filter === 'all') return true
    if (filter === 'paid') return q.paid === true
    if (filter === 'unpaid') return q.paid === false
    return true
  })

  if (filteredQuotas.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-warm-100">
          <svg className="h-8 w-8 text-secondary-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2z" />
          </svg>
        </div>
        <p className="mt-4 text-sm font-medium text-foreground">Sem Quotas</p>
        <p className="mt-1 text-xs text-muted">Não existem quotas com este estado.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3 py-4">
      {filteredQuotas.map((quota) => (
        <QuotaCard key={quota.id} quota={quota} onEdit={onEdit} />
      ))}
    </div>
  )
}
