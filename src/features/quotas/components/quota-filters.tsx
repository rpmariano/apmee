import { useState, useMemo } from 'react'
import {
  SlidersHorizontal,
  X,
  GraduationCap,
  User,
  Landmark,
  Coins,
  CreditCard,
  FileText,
  Calendar,
  RotateCcw,
  ChevronDown,
} from 'lucide-react'
import type { QuotaWithContact } from './quota-card'
import { cn } from '@/lib/utils'
import { TURMA_OPTIONS } from '@/lib/constants'
import { CustomSelect } from '@/components/ui/custom-select'

export interface QuotaFilterCriteria {
  turma: string // 'all' or specific class
  educando: string // 'all' or specific student name
  account: 'all' | 'banco' | 'caixa'
  paymentMethod: string // 'all' | 'mbway' | 'transferencia' | 'numerario'
  receipt: 'all' | 'with_receipt' | 'without_receipt'
  month: string // 'all' or '1'..'12'
}

export const DEFAULT_QUOTA_FILTERS: QuotaFilterCriteria = {
  turma: 'all',
  educando: 'all',
  account: 'all',
  paymentMethod: 'all',
  receipt: 'all',
  month: 'all',
}

const MONTH_OPTIONS = [
  { value: 'all', label: 'Todos os Meses' },
  { value: '9', label: 'Setembro' },
  { value: '10', label: 'Outubro' },
  { value: '11', label: 'Novembro' },
  { value: '12', label: 'Dezembro' },
  { value: '1', label: 'Janeiro' },
  { value: '2', label: 'Fevereiro' },
  { value: '3', label: 'Março' },
  { value: '4', label: 'Abril' },
  { value: '5', label: 'Maio' },
  { value: '6', label: 'Junho' },
  { value: '7', label: 'Julho' },
]

export function matchesQuotaFilters(
  q: QuotaWithContact,
  filters: QuotaFilterCriteria,
  searchQuery?: string,
  statusFilter?: 'all' | 'paid' | 'unpaid',
  yearFilter?: number
): boolean {
  // 1. Year filter
  if (yearFilter !== undefined && q.year !== yearFilter) return false

  // 2. Status filter ('all' | 'paid' | 'unpaid')
  if (statusFilter === 'paid' && !q.paid) return false
  if (statusFilter === 'unpaid' && q.paid) return false

  // 3. Search query
  if (searchQuery && searchQuery.trim()) {
    const query = searchQuery.trim().toLowerCase()
    const contactName = (q.contact?.name || '').toLowerCase()
    const meta = q.contact?.metadata || {}
    const educando = String(meta.educando || '').toLowerCase()
    const turma = String(meta.turma || (Array.isArray(meta.turmas) ? meta.turmas.join(' ') : '')).toLowerCase()
    const matches =
      contactName.includes(query) ||
      educando.includes(query) ||
      turma.includes(query)
    if (!matches) return false
  }

  // 4. Turma filter
  if (filters.turma && filters.turma !== 'all') {
    const meta = q.contact?.metadata || {}
    const rawTurma = meta.turmas ?? meta.turma
    const targetTurma = filters.turma.toLowerCase()
    let matchesTurma = false
    if (Array.isArray(rawTurma)) {
      matchesTurma = rawTurma.some((t) => String(t).trim().toLowerCase() === targetTurma)
    } else if (typeof rawTurma === 'string') {
      matchesTurma = rawTurma.split(',').some((t) => t.trim().toLowerCase() === targetTurma)
    }
    if (!matchesTurma) return false
  }

  // 5. Educando filter
  if (filters.educando && filters.educando !== 'all') {
    const meta = q.contact?.metadata || {}
    const educando = String(meta.educando || '').trim().toLowerCase()
    const targetEducando = filters.educando.trim().toLowerCase()
    if (!educando.includes(targetEducando)) return false
  }

  // 6. Account filter
  if (filters.account && filters.account !== 'all') {
    const acc = q.account || 'banco'
    if (acc !== filters.account) return false
  }

  // 7. Payment method filter
  if (filters.paymentMethod && filters.paymentMethod !== 'all') {
    const pm = (q.payment_method || '').toLowerCase()
    if (pm !== filters.paymentMethod.toLowerCase()) return false
  }

  // 8. Receipt filter
  if (filters.receipt && filters.receipt !== 'all') {
    const hasReceipt = Boolean(q.receipt_url)
    if (filters.receipt === 'with_receipt' && !hasReceipt) return false
    if (filters.receipt === 'without_receipt' && hasReceipt) return false
  }

  // 9. Month filter
  if (filters.month && filters.month !== 'all') {
    if (!q.paid_date) return false
    const month = new Date(q.paid_date).getMonth() + 1
    if (month !== Number(filters.month)) return false
  }

  return true
}

export function getQuotaTurmas(q: QuotaWithContact): string[] {
  const meta = q.contact?.metadata || {}
  const raw = meta.turmas ?? meta.turma
  if (Array.isArray(raw)) {
    return raw.map((t) => String(t).trim()).filter(Boolean)
  }
  if (typeof raw === 'string' && raw.trim()) {
    return raw.split(',').map((t) => t.trim()).filter(Boolean)
  }
  return []
}

export function getQuotaEducando(q: QuotaWithContact): string | null {
  const meta = q.contact?.metadata || {}
  const edu = meta.educando
  if (typeof edu === 'string' && edu.trim()) {
    return edu.trim()
  }
  return null
}

export function getQuotaEducandos(q: QuotaWithContact): string[] {
  const meta = q.contact?.metadata || {}
  const edu = meta.educando
  if (typeof edu === 'string' && edu.trim()) {
    if (edu.includes(',')) {
      return edu.split(',').map((s) => s.trim()).filter(Boolean)
    }
    return [edu.trim()]
  }
  return []
}

interface QuotaFiltersProps {
  quotas: QuotaWithContact[]
  filters: QuotaFilterCriteria
  onFilterChange: (next: QuotaFilterCriteria) => void
  filteredCount: number
  selectedYear?: number
}

export function QuotaFilters({
  quotas,
  filters,
  onFilterChange,
  filteredCount,
  selectedYear,
}: QuotaFiltersProps) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)

  // Todas as turmas da escola (base + quotas) para permitir trocar livremente no atalho
  const allSchoolTurmas = useMemo(() => {
    const set = new Set<string>()
    TURMA_OPTIONS.forEach((o) => set.add(o.value))
    quotas.forEach((q) => {
      getQuotaTurmas(q).forEach((t) => set.add(t))
    })
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'pt'))
  }, [quotas])

  // 1. Quotas candidatas e turmas disponíveis (dependentes dos restantes filtros)
  const candidateQuotasForTurma = useMemo(() => {
    return quotas.filter((q) =>
      matchesQuotaFilters(q, { ...filters, turma: 'all' }, undefined, undefined, selectedYear)
    )
  }, [quotas, filters, selectedYear])

  const availableTurmas = useMemo(() => {
    const set = new Set<string>()
    const hasOtherFilters =
      filters.educando !== 'all' ||
      filters.account !== 'all' ||
      filters.paymentMethod !== 'all' ||
      filters.receipt !== 'all' ||
      filters.month !== 'all'

    // Se não há outros filtros ativos, incluir as turmas base de TURMA_OPTIONS
    if (!hasOtherFilters) {
      TURMA_OPTIONS.forEach((o) => set.add(o.value))
    }

    // Adicionar turmas das quotas candidatas
    candidateQuotasForTurma.forEach((q) => {
      getQuotaTurmas(q).forEach((t) => set.add(t))
    })

    return Array.from(set).sort((a, b) => a.localeCompare(b, 'pt'))
  }, [candidateQuotasForTurma, filters])

  const turmaCounts = useMemo(() => {
    const counts = new Map<string, number>()
    candidateQuotasForTurma.forEach((q) => {
      getQuotaTurmas(q).forEach((t) => {
        counts.set(t, (counts.get(t) || 0) + 1)
      })
    })
    return counts
  }, [candidateQuotasForTurma])

  // 2. Quotas candidatas e educandos disponíveis (dependentes da turma e restantes filtros)
  const candidateQuotasForEducando = useMemo(() => {
    return quotas.filter((q) =>
      matchesQuotaFilters(q, { ...filters, educando: 'all' }, undefined, undefined, selectedYear)
    )
  }, [quotas, filters, selectedYear])

  const availableEducandos = useMemo(() => {
    const set = new Set<string>()
    candidateQuotasForEducando.forEach((q) => {
      getQuotaEducandos(q).forEach((edu) => {
        if (edu) set.add(edu)
      })
    })
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'pt'))
  }, [candidateQuotasForEducando])

  // 3. Quotas candidatas e contagens para Conta (Banco vs Caixa)
  const candidateQuotasForAccount = useMemo(() => {
    return quotas.filter((q) =>
      matchesQuotaFilters(q, { ...filters, account: 'all' }, undefined, undefined, selectedYear)
    )
  }, [quotas, filters, selectedYear])

  const { bankCount, cashCount } = useMemo(() => {
    let bank = 0
    let cash = 0
    candidateQuotasForAccount.forEach((q) => {
      const acc = q.account || 'banco'
      if (acc === 'banco') bank++
      if (acc === 'caixa') cash++
    })
    return { bankCount: bank, cashCount: cash }
  }, [candidateQuotasForAccount])

  // 4. Quotas candidatas e contagens para Método de Pagamento
  const candidateQuotasForMethod = useMemo(() => {
    return quotas.filter((q) =>
      matchesQuotaFilters(q, { ...filters, paymentMethod: 'all' }, undefined, undefined, selectedYear)
    )
  }, [quotas, filters, selectedYear])

  const { mbwayCount, transferenciaCount, numerarioCount } = useMemo(() => {
    let mbway = 0
    let transferencia = 0
    let numerario = 0
    candidateQuotasForMethod.forEach((q) => {
      const pm = (q.payment_method || '').toLowerCase()
      if (pm === 'mbway') mbway++
      if (pm === 'transferencia') transferencia++
      if (pm === 'numerario') numerario++
    })
    return { mbwayCount: mbway, transferenciaCount: transferencia, numerarioCount: numerario }
  }, [candidateQuotasForMethod])

  // 5. Quotas candidatas e contagens para Recibo
  const candidateQuotasForReceipt = useMemo(() => {
    return quotas.filter((q) =>
      matchesQuotaFilters(q, { ...filters, receipt: 'all' }, undefined, undefined, selectedYear)
    )
  }, [quotas, filters, selectedYear])

  const { withReceiptCount, withoutReceiptCount } = useMemo(() => {
    let withR = 0
    let withoutR = 0
    candidateQuotasForReceipt.forEach((q) => {
      if (q.receipt_url) withR++
      else withoutR++
    })
    return { withReceiptCount: withR, withoutReceiptCount: withoutR }
  }, [candidateQuotasForReceipt])

  // 6. Quotas candidatas e contagens para Mês
  const candidateQuotasForMonth = useMemo(() => {
    return quotas.filter((q) =>
      matchesQuotaFilters(q, { ...filters, month: 'all' }, undefined, undefined, selectedYear)
    )
  }, [quotas, filters, selectedYear])

  const monthCounts = useMemo(() => {
    const counts = new Map<string, number>()
    candidateQuotasForMonth.forEach((q) => {
      if (q.paid_date) {
        const m = String(new Date(q.paid_date).getMonth() + 1)
        counts.set(m, (counts.get(m) || 0) + 1)
      }
    })
    return counts
  }, [candidateQuotasForMonth])

  const dynamicMonthOptions = useMemo(() => {
    const result: { label: string; value: string }[] = [
      {
        label: `Todos os Meses (${candidateQuotasForMonth.length})`,
        value: 'all',
      },
    ]

    MONTH_OPTIONS.filter((m) => m.value !== 'all').forEach((m) => {
      const count = monthCounts.get(m.value) || 0
      result.push({
        label: `${m.label} (${count})`,
        value: m.value,
      })
    })

    return result
  }, [candidateQuotasForMonth.length, monthCounts])

  // Contagem de filtros ativos
  const activeCount = useMemo(() => {
    let count = 0
    if (filters.turma !== 'all') count++
    if (filters.educando !== 'all') count++
    if (filters.account !== 'all') count++
    if (filters.paymentMethod !== 'all') count++
    if (filters.receipt !== 'all') count++
    if (filters.month !== 'all') count++
    return count
  }, [filters])

  const handleClearAll = () => {
    onFilterChange(DEFAULT_QUOTA_FILTERS)
  }

  // Atualização em cascata: quando um filtro muda, reavalia os restantes filtros ativos.
  // Se algum filtro ativo deixar de ter quotas compatíveis, é automaticamente reposto para 'all'.
  const handleUpdate = <K extends keyof QuotaFilterCriteria>(key: K, value: QuotaFilterCriteria[K]) => {
    const nextFilters: QuotaFilterCriteria = {
      ...filters,
      [key]: value,
    }

    const hasMatches = (test: QuotaFilterCriteria) => {
      return quotas.some((q) =>
        matchesQuotaFilters(q, test, undefined, undefined, selectedYear)
      )
    }

    // 1. Incompatibilidade de educando ao mudar turma
    if (key === 'turma' && nextFilters.educando !== 'all') {
      if (!hasMatches({ ...nextFilters })) {
        nextFilters.educando = 'all'
      }
    }

    // 2. Incompatibilidade de turma ao mudar educando
    if (key === 'educando' && nextFilters.turma !== 'all') {
      if (!hasMatches({ ...nextFilters })) {
        nextFilters.turma = 'all'
      }
    }

    // 3. Incompatibilidade de conta
    if (nextFilters.account !== 'all' && !hasMatches({ ...nextFilters })) {
      nextFilters.account = 'all'
    }

    // 4. Incompatibilidade de método de pagamento
    if (nextFilters.paymentMethod !== 'all' && !hasMatches({ ...nextFilters })) {
      nextFilters.paymentMethod = 'all'
    }

    // 5. Incompatibilidade de recibo
    if (nextFilters.receipt !== 'all' && !hasMatches({ ...nextFilters })) {
      nextFilters.receipt = 'all'
    }

    // 6. Incompatibilidade de mês
    if (nextFilters.month !== 'all' && !hasMatches({ ...nextFilters })) {
      nextFilters.month = 'all'
    }

    onFilterChange(nextFilters)
  }

  const openDrawer = () => {
    setIsDrawerOpen(true)
  }

  return (
    <div className="flex flex-col gap-2">
      {/* Barra Horizontal de Chips Rápidos com Scroll */}
      <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide py-1">
        {/* Botão de Todos os Filtros (Gaveta) */}
        <button
          type="button"
          onClick={openDrawer}
          aria-label="Abrir filtros avançados"
          className={cn(
            'flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition-all active:scale-95 shrink-0 border shadow-2xs',
            activeCount > 0
              ? 'border-primary-500 bg-primary-50 text-primary-800'
              : 'border-warm-200 bg-surface text-secondary-700 hover:bg-warm-100'
          )}
        >
          <SlidersHorizontal className="h-3.5 w-3.5" />
          <span>Filtros</span>
          {activeCount > 0 && (
            <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-primary-500 px-1 text-[10px] font-bold text-white leading-none">
              {activeCount}
            </span>
          )}
        </button>

        {/* 1. Atalho Dinâmico: Turma */}
        {filters.turma !== 'all' && (
          <div className="relative inline-flex items-center rounded-full border border-primary-400 bg-primary-50 pl-2.5 pr-1 py-1 text-xs font-bold text-primary-900 shadow-2xs shrink-0 animate-in fade-in duration-150">
            <GraduationCap className="h-3.5 w-3.5 text-primary-600 shrink-0 mr-1" />
            <span className="truncate max-w-[130px]">Turma: {filters.turma}</span>
            <ChevronDown className="h-3 w-3 text-primary-600 ml-0.5 opacity-70 shrink-0 pointer-events-none" />

            <select
              value={filters.turma}
              onChange={(e) => handleUpdate('turma', e.target.value)}
              aria-label="Alterar turma"
              className="absolute inset-0 w-[calc(100%-24px)] h-full opacity-0 cursor-pointer"
            >
              <option value="all">Todas as Turmas</option>
              {allSchoolTurmas.map((t) => (
                <option key={t} value={t}>
                  Turma: {t}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                handleUpdate('turma', 'all')
              }}
              aria-label="Remover filtro de turma"
              className="relative z-10 ml-1 rounded-full p-0.5 text-primary-700 hover:bg-primary-200 hover:text-primary-950 transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {/* 2. Atalho Dinâmico: Educando */}
        {filters.educando !== 'all' && (
          <div className="relative inline-flex items-center rounded-full border border-primary-400 bg-primary-50 pl-2.5 pr-1 py-1 text-xs font-bold text-primary-900 shadow-2xs shrink-0 animate-in fade-in duration-150">
            <User className="h-3.5 w-3.5 text-primary-600 shrink-0 mr-1" />
            <span className="truncate max-w-[140px]">{filters.educando}</span>
            <ChevronDown className="h-3 w-3 text-primary-600 ml-0.5 opacity-70 shrink-0 pointer-events-none" />

            <select
              value={filters.educando}
              onChange={(e) => handleUpdate('educando', e.target.value)}
              aria-label="Alterar educando"
              className="absolute inset-0 w-[calc(100%-24px)] h-full opacity-0 cursor-pointer"
            >
              <option value="all">Todos os Educandos</option>
              {availableEducandos.map((edu) => (
                <option key={edu} value={edu}>
                  {edu}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                handleUpdate('educando', 'all')
              }}
              aria-label="Remover filtro de educando"
              className="relative z-10 ml-1 rounded-full p-0.5 text-primary-700 hover:bg-primary-200 hover:text-primary-950 transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {/* 3. Atalho Dinâmico: Conta (Banco / Caixa) */}
        {filters.account !== 'all' && (
          <div className="relative inline-flex items-center rounded-full border border-primary-400 bg-primary-50 pl-2.5 pr-1 py-1 text-xs font-bold text-primary-900 shadow-2xs shrink-0 animate-in fade-in duration-150">
            {filters.account === 'caixa' ? (
              <Coins className="h-3.5 w-3.5 text-amber-600 shrink-0 mr-1" />
            ) : (
              <Landmark className="h-3.5 w-3.5 text-sky-600 shrink-0 mr-1" />
            )}
            <span>{filters.account === 'banco' ? 'Conta: Banco' : 'Conta: Caixa'}</span>
            <ChevronDown className="h-3 w-3 text-primary-600 ml-0.5 opacity-70 shrink-0 pointer-events-none" />

            <select
              value={filters.account}
              onChange={(e) => handleUpdate('account', e.target.value as any)}
              aria-label="Alterar conta financeira"
              className="absolute inset-0 w-[calc(100%-24px)] h-full opacity-0 cursor-pointer"
            >
              <option value="all">Todas as Contas</option>
              <option value="banco">Banco</option>
              <option value="caixa">Caixa</option>
            </select>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                handleUpdate('account', 'all')
              }}
              aria-label="Remover filtro de conta"
              className="relative z-10 ml-1 rounded-full p-0.5 text-primary-700 hover:bg-primary-200 hover:text-primary-950 transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {/* 4. Atalho Dinâmico: Método de Pagamento */}
        {filters.paymentMethod !== 'all' && (
          <div className="relative inline-flex items-center rounded-full border border-primary-400 bg-primary-50 pl-2.5 pr-1 py-1 text-xs font-bold text-primary-900 shadow-2xs shrink-0 animate-in fade-in duration-150">
            <CreditCard className="h-3.5 w-3.5 text-primary-600 shrink-0 mr-1" />
            <span className="capitalize">
              {filters.paymentMethod === 'mbway'
                ? 'MB Way'
                : filters.paymentMethod === 'transferencia'
                ? 'Transf. Bancária'
                : filters.paymentMethod === 'numerario'
                ? 'Numerário'
                : `Método: ${filters.paymentMethod}`}
            </span>
            <ChevronDown className="h-3 w-3 text-primary-600 ml-0.5 opacity-70 shrink-0 pointer-events-none" />

            <select
              value={filters.paymentMethod}
              onChange={(e) => handleUpdate('paymentMethod', e.target.value)}
              aria-label="Alterar método de pagamento"
              className="absolute inset-0 w-[calc(100%-24px)] h-full opacity-0 cursor-pointer"
            >
              <option value="all">Todos os Métodos</option>
              <option value="mbway">MB Way</option>
              <option value="transferencia">Transferência Bancária</option>
              <option value="numerario">Numerário</option>
            </select>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                handleUpdate('paymentMethod', 'all')
              }}
              aria-label="Remover filtro de método"
              className="relative z-10 ml-1 rounded-full p-0.5 text-primary-700 hover:bg-primary-200 hover:text-primary-950 transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {/* 5. Atalho Dinâmico: Recibo */}
        {filters.receipt !== 'all' && (
          <div className="relative inline-flex items-center rounded-full border border-primary-400 bg-primary-50 pl-2.5 pr-1 py-1 text-xs font-bold text-primary-900 shadow-2xs shrink-0 animate-in fade-in duration-150">
            <FileText className="h-3.5 w-3.5 text-primary-600 shrink-0 mr-1" />
            <span>{filters.receipt === 'with_receipt' ? 'Com Recibo' : 'Sem Recibo'}</span>
            <ChevronDown className="h-3 w-3 text-primary-600 ml-0.5 opacity-70 shrink-0 pointer-events-none" />

            <select
              value={filters.receipt}
              onChange={(e) => handleUpdate('receipt', e.target.value as any)}
              aria-label="Alterar filtro de recibo"
              className="absolute inset-0 w-[calc(100%-24px)] h-full opacity-0 cursor-pointer"
            >
              <option value="all">Todos os Recibos</option>
              <option value="with_receipt">Com Recibo</option>
              <option value="without_receipt">Sem Recibo</option>
            </select>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                handleUpdate('receipt', 'all')
              }}
              aria-label="Remover filtro de recibo"
              className="relative z-10 ml-1 rounded-full p-0.5 text-primary-700 hover:bg-primary-200 hover:text-primary-950 transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {/* 6. Atalho Dinâmico: Mês */}
        {filters.month !== 'all' && (
          <div className="relative inline-flex items-center rounded-full border border-primary-400 bg-primary-50 pl-2.5 pr-1 py-1 text-xs font-bold text-primary-900 shadow-2xs shrink-0 animate-in fade-in duration-150">
            <Calendar className="h-3.5 w-3.5 text-primary-600 shrink-0 mr-1" />
            <span>Mês: {MONTH_OPTIONS.find((m) => m.value === filters.month)?.label || filters.month}</span>
            <ChevronDown className="h-3 w-3 text-primary-600 ml-0.5 opacity-70 shrink-0 pointer-events-none" />

            <select
              value={filters.month}
              onChange={(e) => handleUpdate('month', e.target.value)}
              aria-label="Alterar mês"
              className="absolute inset-0 w-[calc(100%-24px)] h-full opacity-0 cursor-pointer"
            >
              {dynamicMonthOptions.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                handleUpdate('month', 'all')
              }}
              aria-label="Remover filtro de mês"
              className="relative z-10 ml-1 rounded-full p-0.5 text-primary-700 hover:bg-primary-200 hover:text-primary-950 transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {/* Botão de Limpeza Rápida (quando há filtros ativos) */}
        {activeCount > 0 && (
          <button
            type="button"
            onClick={handleClearAll}
            className="flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold text-primary-700 hover:bg-primary-100 hover:text-primary-900 transition-colors shrink-0 cursor-pointer ml-0.5"
            aria-label="Limpar todos os filtros"
          >
            <RotateCcw className="h-3 w-3" />
            <span>Limpar</span>
          </button>
        )}
      </div>

      {/* Drawer / Bottom Sheet de Filtros Completos */}
      {isDrawerOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => setIsDrawerOpen(false)}
        >
          <div
            className="w-full max-w-[430px] max-h-[85vh] rounded-t-3xl sm:rounded-2xl bg-surface border-t sm:border border-warm-200 shadow-2xl animate-in slide-in-from-bottom-6 duration-200 flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top Drag Indicator */}
            <div className="pt-2 pb-1 flex justify-center sm:hidden">
              <div className="h-1.5 w-12 rounded-full bg-warm-300" />
            </div>

            {/* Drawer Header */}
            <div className="flex items-center justify-between border-b border-warm-200 px-5 py-3.5 bg-surface">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="h-5 w-5 text-primary-600" />
                <h3 className="text-base font-bold text-foreground">Filtros de Quotas</h3>
                {activeCount > 0 && (
                  <span className="rounded-full bg-primary-100 px-2 py-0.5 text-xs font-bold text-primary-800 border border-primary-200">
                    {activeCount} ativo{activeCount > 1 ? 's' : ''}
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => setIsDrawerOpen(false)}
                className="rounded-full p-2 text-muted hover:bg-warm-100 transition-colors"
                aria-label="Fechar filtros"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Drawer Body (Scrollable) */}
            <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-5">
              
              {/* 1. Secção: Turma */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-secondary-700">
                    <GraduationCap className="h-4 w-4 text-primary-600" />
                    <span>Turma do Educando</span>
                  </label>
                  {filters.educando !== 'all' && (
                    <span className="text-[11px] font-semibold text-primary-700">
                      Turma de {filters.educando}
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleUpdate('turma', 'all')}
                    className={cn(
                      'rounded-full px-3 py-1.5 text-xs font-semibold transition-all active:scale-95 border',
                      filters.turma === 'all'
                        ? 'border-primary-500 bg-primary-500 text-white font-bold shadow-xs'
                        : 'border-warm-200 bg-warm-50 text-secondary-700 hover:bg-warm-100'
                    )}
                  >
                    Todas ({candidateQuotasForTurma.length})
                  </button>
                  {availableTurmas.map((t) => {
                    const count = turmaCounts.get(t) || 0
                    const isDisabled = count === 0
                    return (
                      <button
                        key={t}
                        type="button"
                        disabled={isDisabled}
                        onClick={() => handleUpdate('turma', t)}
                        className={cn(
                          'rounded-full px-3 py-1.5 text-xs font-semibold transition-all active:scale-95 border',
                          filters.turma === t
                            ? 'border-primary-500 bg-primary-500 text-white font-bold shadow-xs'
                            : isDisabled
                            ? 'border-warm-200 bg-warm-50/50 text-secondary-400 opacity-40 cursor-not-allowed'
                            : 'border-warm-200 bg-warm-50 text-secondary-700 hover:bg-warm-100'
                        )}
                      >
                        {t} ({count})
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* 2. Secção: Educando */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-secondary-700">
                    <User className="h-4 w-4 text-primary-600" />
                    <span>Nome do Educando (Aluno)</span>
                  </label>
                  <span className="text-[11px] text-muted">
                    {filters.turma !== 'all'
                      ? `Alunos de ${filters.turma} (${availableEducandos.length})`
                      : `${availableEducandos.length} alunos com quotas`}
                  </span>
                </div>
                <CustomSelect
                  searchable
                  value={filters.educando}
                  onChange={(val) => handleUpdate('educando', val)}
                  options={[
                    {
                      label: `Todos os Educandos (${candidateQuotasForEducando.length})`,
                      value: 'all',
                    },
                    ...availableEducandos.map((edu) => ({ label: edu, value: edu })),
                  ]}
                  placeholder={
                    filters.turma !== 'all'
                      ? `Pesquisar alunos de ${filters.turma}...`
                      : 'Pesquisar por aluno...'
                  }
                />
              </div>

              {/* 3. Secção: Conta Financeira (Banco vs Caixa) */}
              <div className="flex flex-col gap-2">
                <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-secondary-700">
                  <Landmark className="h-4 w-4 text-primary-600" />
                  <span>Conta de Recebimento (Tesouraria)</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => handleUpdate('account', 'all')}
                    className={cn(
                      'rounded-xl border py-2.5 px-2 text-center text-xs font-bold transition-all',
                      filters.account === 'all'
                        ? 'border-primary-500 bg-primary-50 text-primary-800 shadow-xs'
                        : 'border-warm-200 bg-surface text-secondary-600 hover:bg-warm-50'
                    )}
                  >
                    Todas ({candidateQuotasForAccount.length})
                  </button>
                  <button
                    type="button"
                    disabled={bankCount === 0}
                    onClick={() => handleUpdate('account', 'banco')}
                    className={cn(
                      'rounded-xl border py-2.5 px-2 flex items-center justify-center gap-1.5 text-xs font-bold transition-all',
                      filters.account === 'banco'
                        ? 'border-sky-500 bg-sky-50 text-sky-800 shadow-xs'
                        : bankCount === 0
                        ? 'border-warm-200 bg-surface text-secondary-400 opacity-40 cursor-not-allowed'
                        : 'border-warm-200 bg-surface text-secondary-600 hover:bg-warm-50'
                    )}
                  >
                    <Landmark className="h-3.5 w-3.5 text-sky-600" />
                    <span>Banco ({bankCount})</span>
                  </button>
                  <button
                    type="button"
                    disabled={cashCount === 0}
                    onClick={() => handleUpdate('account', 'caixa')}
                    className={cn(
                      'rounded-xl border py-2.5 px-2 flex items-center justify-center gap-1.5 text-xs font-bold transition-all',
                      filters.account === 'caixa'
                        ? 'border-amber-500 bg-amber-50 text-amber-800 shadow-xs'
                        : cashCount === 0
                        ? 'border-warm-200 bg-surface text-secondary-400 opacity-40 cursor-not-allowed'
                        : 'border-warm-200 bg-surface text-secondary-600 hover:bg-warm-50'
                    )}
                  >
                    <Coins className="h-3.5 w-3.5 text-amber-600" />
                    <span>Caixa ({cashCount})</span>
                  </button>
                </div>
              </div>

              {/* 4. Secção: Método de Pagamento */}
              <div className="flex flex-col gap-2">
                <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-secondary-700">
                  <CreditCard className="h-4 w-4 text-primary-600" />
                  <span>Método de Pagamento</span>
                </label>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {[
                    { value: 'all', label: 'Todos', count: candidateQuotasForMethod.length },
                    { value: 'mbway', label: 'MB Way', count: mbwayCount },
                    { value: 'transferencia', label: 'Transf.', count: transferenciaCount },
                    { value: 'numerario', label: 'Numerário', count: numerarioCount },
                  ].map((m) => {
                    const isDisabled = m.value !== 'all' && m.count === 0
                    return (
                      <button
                        key={m.value}
                        type="button"
                        disabled={isDisabled}
                        onClick={() => handleUpdate('paymentMethod', m.value)}
                        className={cn(
                          'rounded-xl border py-2 px-2 text-center text-xs font-bold transition-all',
                          filters.paymentMethod === m.value
                            ? 'border-primary-500 bg-primary-50 text-primary-800 shadow-xs'
                            : isDisabled
                            ? 'border-warm-200 bg-surface text-secondary-400 opacity-40 cursor-not-allowed'
                            : 'border-warm-200 bg-surface text-secondary-600 hover:bg-warm-50'
                        )}
                      >
                        {m.label} ({m.count})
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* 5. Secção: Recibo / Comprovativo */}
              <div className="flex flex-col gap-2">
                <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-secondary-700">
                  <FileText className="h-4 w-4 text-primary-600" />
                  <span>Estado do Recibo</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: 'all', label: 'Todos', count: candidateQuotasForReceipt.length },
                    { value: 'with_receipt', label: 'Com Recibo', count: withReceiptCount },
                    { value: 'without_receipt', label: 'Sem Recibo', count: withoutReceiptCount },
                  ].map((r) => {
                    const isDisabled = r.value !== 'all' && r.count === 0
                    return (
                      <button
                        key={r.value}
                        type="button"
                        disabled={isDisabled}
                        onClick={() => handleUpdate('receipt', r.value as any)}
                        className={cn(
                          'rounded-xl border py-2 px-2 text-center text-xs font-bold transition-all',
                          filters.receipt === r.value
                            ? 'border-primary-500 bg-primary-50 text-primary-800 shadow-xs'
                            : isDisabled
                            ? 'border-warm-200 bg-surface text-secondary-400 opacity-40 cursor-not-allowed'
                            : 'border-warm-200 bg-surface text-secondary-600 hover:bg-warm-50'
                        )}
                      >
                        {r.label} ({r.count})
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* 6. Secção: Mês de Pagamento */}
              <div className="flex flex-col gap-2">
                <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-secondary-700">
                  <Calendar className="h-4 w-4 text-primary-600" />
                  <span>Mês de Liquidação</span>
                </label>
                <CustomSelect
                  value={filters.month}
                  onChange={(val) => handleUpdate('month', val)}
                  options={dynamicMonthOptions}
                  placeholder="Selecione o mês..."
                />
              </div>

            </div>

            {/* Drawer Footer Actions */}
            <div className="border-t border-warm-200 bg-surface p-4 flex items-center gap-3">
              {activeCount > 0 && (
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="flex-1 rounded-[var(--radius-button)] border border-warm-200 py-2.5 text-xs font-bold text-secondary-700 hover:bg-warm-50 transition-colors"
                >
                  Limpar Filtros
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsDrawerOpen(false)}
                className="flex-2 rounded-[var(--radius-button)] bg-primary-500 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-primary-600 transition-colors"
              >
                Ver {filteredCount} {filteredCount === 1 ? 'Quota' : 'Quotas'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
