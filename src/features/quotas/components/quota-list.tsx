import { Users, CheckCircle2, Search, SlidersHorizontal, RotateCcw } from 'lucide-react'
import { QuotaCard, type QuotaWithContact } from './quota-card'
import { formatSchoolYear } from '@/lib/school-year'
import { matchesQuotaFilters, type QuotaFilterCriteria } from './quota-filters'

type FilterValue = 'all' | 'paid' | 'unpaid'

interface QuotaListProps {
  quotas?: QuotaWithContact[]
  filter: FilterValue
  searchQuery?: string
  selectedYear?: number
  filters?: QuotaFilterCriteria
  onClearFilters?: () => void
  isLoading: boolean
  onEdit?: (quota: QuotaWithContact) => void
}

export function QuotaList({
  quotas,
  filter,
  searchQuery = '',
  selectedYear,
  filters,
  onClearFilters,
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
  const hasActiveCustomFilters = filters && Object.values(filters).some((v) => v !== 'all')

  const filteredQuotas = (quotas || []).filter((q) => {
    if (filters) {
      return matchesQuotaFilters(q, filters, searchQuery, filter, selectedYear)
    }

    // Fallback if filters not passed
    if (selectedYear !== undefined && q.year !== selectedYear) return false
    if (filter === 'paid' && !q.paid) return false
    if (filter === 'unpaid' && q.paid) return false
    if (query) {
      const contactName = (q.contact?.name || '').toLowerCase()
      const metadata = q.contact?.metadata || {}
      const educando = String(metadata.educando || '').toLowerCase()
      const turma = String(metadata.turma || (Array.isArray(metadata.turmas) ? metadata.turmas.join(' ') : '')).toLowerCase()
      return (
        contactName.includes(query) ||
        educando.includes(query) ||
        turma.includes(query)
      )
    }
    return true
  })

  if (filteredQuotas.length === 0) {
    const isSearching = !!query
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center px-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-warm-100 text-secondary-400 mb-3">
          {hasActiveCustomFilters ? (
            <SlidersHorizontal className="h-8 w-8 text-primary-500" />
          ) : isSearching ? (
            <Search className="h-8 w-8 text-secondary-400" />
          ) : filter === 'unpaid' ? (
            <CheckCircle2 className="h-8 w-8 text-green-600" />
          ) : (
            <Users className="h-8 w-8 text-secondary-400" />
          )}
        </div>

        <p className="text-base font-bold text-foreground">
          {hasActiveCustomFilters
            ? 'Nenhuma quota encontrada'
            : isSearching
            ? 'Nenhum resultado encontrado'
            : filter === 'unpaid'
            ? 'Quotas em dia!'
            : filter === 'paid'
            ? 'Sem pagamentos registados'
            : 'Sem quotas registadas'}
        </p>

        <p className="mt-1 text-xs text-secondary-600 max-w-xs leading-relaxed">
          {hasActiveCustomFilters
            ? 'Não existem quotas registadas que correspondam aos filtros selecionados. Tente ajustar ou limpar os filtros.'
            : isSearching
            ? `Não encontrámos quotas que correspondam a "${searchQuery}". Tente outro termo.`
            : filter === 'unpaid'
            ? `Todas as quotas registadas no ano letivo ${selectedYear ? formatSchoolYear(selectedYear) : ''} já se encontram regularizadas.`
            : filter === 'paid'
            ? `Ainda não existem quotas liquidadas no ano letivo ${selectedYear ? formatSchoolYear(selectedYear) : ''}.`
            : `Ainda não foram registadas quotas para o ano letivo ${selectedYear ? formatSchoolYear(selectedYear) : ''}. Toque em "+" para registar.`}
        </p>

        {hasActiveCustomFilters && onClearFilters && (
          <button
            type="button"
            onClick={onClearFilters}
            className="mt-4 flex items-center gap-1.5 rounded-full bg-primary-50 px-4 py-2 text-xs font-bold text-primary-700 border border-primary-200 hover:bg-primary-100 active:scale-95 transition-all"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Limpar Filtros</span>
          </button>
        )}
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
