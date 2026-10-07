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

interface QuotaFiltersProps {
  quotas: QuotaWithContact[]
  filters: QuotaFilterCriteria
  onFilterChange: (next: QuotaFilterCriteria) => void
  filteredCount: number
}

export function QuotaFilters({
  quotas,
  filters,
  onFilterChange,
  filteredCount,
}: QuotaFiltersProps) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)

  // 1. Extrair todas as turmas dinâmicas existentes
  const availableTurmas = useMemo(() => {
    const set = new Set<string>(TURMA_OPTIONS.map((o) => o.value))
    quotas.forEach((q) => {
      const meta = q.contact?.metadata || {}
      const raw = meta.turmas ?? meta.turma
      if (Array.isArray(raw)) {
        raw.forEach((t) => t && set.add(String(t).trim()))
      } else if (typeof raw === 'string' && raw.trim()) {
        raw.split(',').forEach((t) => t && set.add(t.trim()))
      }
    })
    return Array.from(set).sort()
  }, [quotas])

  // 2. Extrair todos os educandos existentes
  const availableEducandos = useMemo(() => {
    const set = new Set<string>()
    quotas.forEach((q) => {
      const meta = q.contact?.metadata || {}
      const edu = meta.educando
      if (typeof edu === 'string' && edu.trim()) {
        set.add(edu.trim())
      }
    })
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'pt'))
  }, [quotas])

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

  const handleUpdate = <K extends keyof QuotaFilterCriteria>(key: K, value: QuotaFilterCriteria[K]) => {
    onFilterChange({
      ...filters,
      [key]: value,
    })
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
              {availableTurmas.map((t) => (
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
              {MONTH_OPTIONS.map((m) => (
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
                <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-secondary-700">
                  <GraduationCap className="h-4 w-4 text-primary-600" />
                  <span>Turma do Educando</span>
                </label>
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
                    Todas
                  </button>
                  {availableTurmas.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => handleUpdate('turma', t)}
                      className={cn(
                        'rounded-full px-3 py-1.5 text-xs font-semibold transition-all active:scale-95 border',
                        filters.turma === t
                          ? 'border-primary-500 bg-primary-500 text-white font-bold shadow-xs'
                          : 'border-warm-200 bg-warm-50 text-secondary-700 hover:bg-warm-100'
                      )}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* 2. Secção: Educando */}
              <div className="flex flex-col gap-2">
                <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-secondary-700">
                  <User className="h-4 w-4 text-primary-600" />
                  <span>Nome do Educando (Aluno)</span>
                </label>
                <CustomSelect
                  searchable
                  value={filters.educando}
                  onChange={(val) => handleUpdate('educando', val)}
                  options={[
                    { label: 'Todos os Educandos', value: 'all' },
                    ...availableEducandos.map((edu) => ({ label: edu, value: edu })),
                  ]}
                  placeholder="Pesquisar por aluno..."
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
                    Todas
                  </button>
                  <button
                    type="button"
                    onClick={() => handleUpdate('account', 'banco')}
                    className={cn(
                      'rounded-xl border py-2.5 px-2 flex items-center justify-center gap-1.5 text-xs font-bold transition-all',
                      filters.account === 'banco'
                        ? 'border-sky-500 bg-sky-50 text-sky-800 shadow-xs'
                        : 'border-warm-200 bg-surface text-secondary-600 hover:bg-warm-50'
                    )}
                  >
                    <Landmark className="h-3.5 w-3.5 text-sky-600" />
                    <span>Banco</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleUpdate('account', 'caixa')}
                    className={cn(
                      'rounded-xl border py-2.5 px-2 flex items-center justify-center gap-1.5 text-xs font-bold transition-all',
                      filters.account === 'caixa'
                        ? 'border-amber-500 bg-amber-50 text-amber-800 shadow-xs'
                        : 'border-warm-200 bg-surface text-secondary-600 hover:bg-warm-50'
                    )}
                  >
                    <Coins className="h-3.5 w-3.5 text-amber-600" />
                    <span>Caixa</span>
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
                    { value: 'all', label: 'Todos' },
                    { value: 'mbway', label: 'MB Way' },
                    { value: 'transferencia', label: 'Transferência' },
                    { value: 'numerario', label: 'Numerário' },
                  ].map((m) => (
                    <button
                      key={m.value}
                      type="button"
                      onClick={() => handleUpdate('paymentMethod', m.value)}
                      className={cn(
                        'rounded-xl border py-2 px-2 text-center text-xs font-bold transition-all',
                        filters.paymentMethod === m.value
                          ? 'border-primary-500 bg-primary-50 text-primary-800 shadow-xs'
                          : 'border-warm-200 bg-surface text-secondary-600 hover:bg-warm-50'
                      )}
                    >
                      {m.label}
                    </button>
                  ))}
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
                    { value: 'all', label: 'Todos' },
                    { value: 'with_receipt', label: 'Com Recibo' },
                    { value: 'without_receipt', label: 'Sem Recibo' },
                  ].map((r) => (
                    <button
                      key={r.value}
                      type="button"
                      onClick={() => handleUpdate('receipt', r.value as any)}
                      className={cn(
                        'rounded-xl border py-2 px-2 text-center text-xs font-bold transition-all',
                        filters.receipt === r.value
                          ? 'border-primary-500 bg-primary-50 text-primary-800 shadow-xs'
                          : 'border-warm-200 bg-surface text-secondary-600 hover:bg-warm-50'
                      )}
                    >
                      {r.label}
                    </button>
                  ))}
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
                  options={MONTH_OPTIONS}
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
