import { Landmark, Coins, CheckCircle2, Clock } from 'lucide-react'
import type { QuotaWithContact } from './quota-card'
import { formatSchoolYear } from '@/lib/school-year'

interface QuotaSummaryProps {
  quotas: QuotaWithContact[]
  selectedYear: number
  isLoading?: boolean
}

export function QuotaSummary({ quotas, selectedYear, isLoading }: QuotaSummaryProps) {
  if (isLoading) {
    return <div className="h-40 w-full animate-pulse rounded-[var(--radius-card)] bg-warm-100" />
  }

  // Filter quotas strictly for the selected school year
  const yearQuotas = quotas.filter((q) => q.year === selectedYear)
  const paidQuotas = yearQuotas.filter((q) => q.paid)
  const unpaidQuotas = yearQuotas.filter((q) => !q.paid)

  // Financial totals
  const totalRaised = paidQuotas.reduce((acc, q) => acc + Number(q.amount || 0), 0)
  const bankRaised = paidQuotas
    .filter((q) => (q.account || 'banco') === 'banco')
    .reduce((acc, q) => acc + Number(q.amount || 0), 0)
  const cashRaised = paidQuotas
    .filter((q) => q.account === 'caixa')
    .reduce((acc, q) => acc + Number(q.amount || 0), 0)

  // Counts & Rate
  const totalCount = yearQuotas.length
  const paidCount = paidQuotas.length
  const unpaidCount = unpaidQuotas.length
  const regularizedPct = totalCount > 0 ? Math.round((paidCount / totalCount) * 100) : 0

  return (
    <div className="rounded-[var(--radius-card)] bg-surface border border-warm-200 p-4 shadow-sm transition-all">
      {/* Header with year tag and regularized progress */}
      <div className="flex items-center justify-between gap-2 border-b border-warm-100 pb-3">
        <div className="flex items-center gap-2">
          <span className="rounded-md bg-secondary-100 px-2 py-0.5 text-xs font-bold uppercase tracking-wider text-secondary-800">
            Ano Letivo {formatSchoolYear(selectedYear)}
          </span>
          <span className="text-xs text-secondary-500 font-medium">
            {totalCount} {totalCount === 1 ? 'registo' : 'registos'}
          </span>
        </div>

        {totalCount > 0 && (
          <div className="flex items-center gap-1.5 text-xs font-bold text-primary-600">
            <span>{regularizedPct}% regularizado</span>
          </div>
        )}
      </div>

      {/* Main Metric: Total Raised */}
      <div className="mt-3 flex items-baseline justify-between">
        <div>
          <span className="text-xs font-medium text-secondary-500">Total Angariado em Quotas</span>
          <div className="text-2xl font-black tracking-tight text-foreground">
            {totalRaised.toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' })}
          </div>
        </div>

        {/* Quick status pills */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-700">
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>{paidCount} Pagas</span>
          </div>
          {unpaidCount > 0 && (
            <div className="flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
              <Clock className="h-3.5 w-3.5" />
              <span>{unpaidCount} Pend.</span>
            </div>
          )}
        </div>
      </div>

      {/* Distribution: Banco vs Caixa */}
      {paidCount > 0 && (
        <div className="mt-3 grid grid-cols-2 gap-2 rounded-lg bg-warm-50 p-2 text-xs border border-warm-100">
          <div className="flex items-center justify-between pr-2">
            <span className="flex items-center gap-1 font-semibold text-sky-700">
              <Landmark className="h-3.5 w-3.5 text-sky-600" />
              <span>Banco</span>
            </span>
            <span className="font-bold text-foreground">
              {bankRaised.toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' })}
            </span>
          </div>

          <div className="flex items-center justify-between pl-2 border-l border-warm-200">
            <span className="flex items-center gap-1 font-semibold text-amber-700">
              <Coins className="h-3.5 w-3.5 text-amber-600" />
              <span>Caixa</span>
            </span>
            <span className="font-bold text-foreground">
              {cashRaised.toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' })}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
