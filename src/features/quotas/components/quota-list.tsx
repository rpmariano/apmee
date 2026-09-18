import { Users, CheckCircle2, Search } from 'lucide-react'
import { QuotaCard, type QuotaWithContact } from './quota-card'
import { formatSchoolYear } from '@/lib/school-year'

type FilterValue = 'all' | 'paid' | 'unpaid'

interface QuotaListProps {
  quotas?: QuotaWithContact[]
  filter: FilterValue
  searchQuery?: string
  selectedYear?: number
  isLoading: boolean
  onEdit?: (quota: QuotaWithContact) => void
}

export function QuotaList({
  quotas,
  filter,
  searchQuery = '',
  selectedYear,
  isLoading,
  onEdit,
}: QuotaListProps) {
  if (isLoading) {
    return (
      <div className="flex flex-col gap-3 py-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 w-full animate-pulse rounded-[var(--radius-card)] bg-warm-100" />
        ))}
      </div>
    )
  }

  const query = searchQuery.trim().toLowerCase()

  const filteredQuotas = (quotas || []).filter((q) => {
    // 1. Year filter
    if (selectedYear !== undefined && q.year !== selectedYear) return false

    // 2. Tab status filter
    if (filter === 'paid' && !q.paid) return false
    if (filter === 'unpaid' && q.paid) return false

    // 3. Search query filter
    if (query) {
      const contactName = (q.contact?.name || '').toLowerCase()
      const metadata = q.contact?.metadata || {}
      const educando = String(metadata.educando || '').toLowerCase()
      const turma = String(metadata.turma || (Array.isArray(metadata.turmas) ? metadata.turmas.join(' ') : '')).toLowerCase()

      const matches =
        contactName.includes(query) ||
        educando.includes(query) ||
        turma.includes(query)

      if (!matches) return false
    }

    return true
  })

  if (filteredQuotas.length === 0) {
    const isSearching = !!query
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center px-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-warm-100 text-secondary-400 mb-3">
          {isSearching ? (
            <Search className="h-8 w-8 text-secondary-400" />
          ) : filter === 'unpaid' ? (
            <CheckCircle2 className="h-8 w-8 text-green-600" />
          ) : (
            <Users className="h-8 w-8 text-secondary-400" />
          )}
        </div>

        <p className="text-base font-bold text-foreground">
          {isSearching
            ? 'Nenhum resultado encontrado'
            : filter === 'unpaid'
            ? 'Quotas em dia!'
            : filter === 'paid'
            ? 'Sem pagamentos registados'
            : 'Sem quotas registadas'}
        </p>

        <p className="mt-1 text-xs text-secondary-600 max-w-xs leading-relaxed">
          {isSearching
            ? `Não encontrámos quotas que correspondam a "${searchQuery}". Tente outro termo.`
            : filter === 'unpaid'
            ? `Todas as quotas registadas no ano letivo ${selectedYear ? formatSchoolYear(selectedYear) : ''} já se encontram regularizadas.`
            : filter === 'paid'
            ? `Ainda não existem quotas liquidadas no ano letivo ${selectedYear ? formatSchoolYear(selectedYear) : ''}.`
            : `Ainda não foram registadas quotas para o ano letivo ${selectedYear ? formatSchoolYear(selectedYear) : ''}. Toque em "+" para registar.`}
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3 py-3">
      {filteredQuotas.map((quota) => (
        <QuotaCard key={quota.id} quota={quota} onEdit={onEdit} />
      ))}
    </div>
  )
}
