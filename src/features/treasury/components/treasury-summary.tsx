import { useState } from 'react'
import { Landmark, Coins, Layers, ArrowDownRight, ArrowUpRight } from 'lucide-react'
import type { FinancialMovement } from '@/types/database'
import { cn } from '@/lib/utils'

export type TreasuryViewMode = 'consolidado' | 'banco' | 'caixa'

function roundCurrency(val: number): number {
  const rounded = Math.round((val + Number.EPSILON) * 100) / 100
  return Object.is(rounded, -0) ? 0 : rounded
}

interface TreasurySummaryProps {
  movements?: FinancialMovement[]
  allMovements?: FinancialMovement[]
  isLoading: boolean
  viewMode?: TreasuryViewMode
  onViewModeChange?: (mode: TreasuryViewMode) => void
  periodLabel?: string
  isFiltered?: boolean
}

export function TreasurySummary({
  movements = [],
  allMovements,
  isLoading,
  viewMode: controlledMode,
  onViewModeChange,
  periodLabel,
  isFiltered = false,
}: TreasurySummaryProps) {
  const [internalMode, setInternalMode] = useState<TreasuryViewMode>('consolidado')
  const mode = controlledMode ?? internalMode

  const setMode = (newMode: TreasuryViewMode) => {
    if (onViewModeChange) {
      onViewModeChange(newMode)
    } else {
      setInternalMode(newMode)
    }
  }

  if (isLoading) {
    return <div className="h-44 w-full animate-pulse rounded-[var(--radius-card)] bg-warm-100" />
  }

  // 1. Real account balances (computed from allMovements if provided, else fallback to movements)
  // Transfers count for individual account balances (+ in destination, - in source), and cancel out in consolidated balance
  const baseMovements = allMovements ?? movements
  const bancoAllUnfiltered = baseMovements.filter((m) => (m.account || 'banco') === 'banco')
  const caixaAllUnfiltered = baseMovements.filter((m) => m.account === 'caixa')

  const bancoRealBalance = roundCurrency(
    bancoAllUnfiltered.reduce(
      (sum, m) => sum + (m.type === 'income' ? Number(m.amount) : -Number(m.amount)),
      0
    )
  )
  const caixaRealBalance = roundCurrency(
    caixaAllUnfiltered.reduce(
      (sum, m) => sum + (m.type === 'income' ? Number(m.amount) : -Number(m.amount)),
      0
    )
  )
  const totalRealBalance = roundCurrency(bancoRealBalance + caixaRealBalance)

  // Percentages of positive liquidity (always based on true account holdings)
  const positiveLiquidity = Math.max(0, bancoRealBalance) + Math.max(0, caixaRealBalance)
  const bancoPct =
    positiveLiquidity > 0 ? Math.round((Math.max(0, bancoRealBalance) / positiveLiquidity) * 100) : 50
  const caixaPct = 100 - bancoPct

  // 2. Filtered Statement / Period Metrics (computed from movements, EXCLUDING internal transfers)
  // Internal transfers between association accounts are liquidity shifts, NOT operational revenues or expenses!
  const nonTransferMovements = movements.filter((m) => m.category !== 'transferencia')

  const bancoFilteredNonTransfer = nonTransferMovements.filter((m) => (m.account || 'banco') === 'banco')
  const caixaFilteredNonTransfer = nonTransferMovements.filter((m) => m.account === 'caixa')

  const bancoIncome = roundCurrency(
    bancoFilteredNonTransfer
      .filter((m) => m.type === 'income')
      .reduce((sum, m) => sum + Number(m.amount), 0)
  )
  const bancoExpense = roundCurrency(
    bancoFilteredNonTransfer
      .filter((m) => m.type === 'expense')
      .reduce((sum, m) => sum + Number(m.amount), 0)
  )

  const caixaIncome = roundCurrency(
    caixaFilteredNonTransfer
      .filter((m) => m.type === 'income')
      .reduce((sum, m) => sum + Number(m.amount), 0)
  )
  const caixaExpense = roundCurrency(
    caixaFilteredNonTransfer
      .filter((m) => m.type === 'expense')
      .reduce((sum, m) => sum + Number(m.amount), 0)
  )

  const totalIncome = roundCurrency(
    nonTransferMovements
      .filter((m) => m.type === 'income')
      .reduce((sum, m) => sum + Number(m.amount), 0)
  )
  const totalExpense = roundCurrency(
    nonTransferMovements
      .filter((m) => m.type === 'expense')
      .reduce((sum, m) => sum + Number(m.amount), 0)
  )

  // Current balance = true account balance
  const currentBalance =
    mode === 'consolidado' ? totalRealBalance : mode === 'banco' ? bancoRealBalance : caixaRealBalance

  // Operational revenues and expenses for the active scope/filter
  const currentIncome =
    mode === 'consolidado' ? totalIncome : mode === 'banco' ? bancoIncome : caixaIncome
  const currentExpense =
    mode === 'consolidado' ? totalExpense : mode === 'banco' ? bancoExpense : caixaExpense

  // Net result of the active selection (excluding transfers)
  const currentPeriodNet = roundCurrency(currentIncome - currentExpense)

  const modeLabel = mode === 'banco' ? 'Banco' : mode === 'caixa' ? 'Caixa' : ''
  const scopeLabel = [periodLabel, modeLabel].filter(Boolean).join(' • ')

  return (
    <div className="rounded-[var(--radius-card)] bg-gradient-to-br from-secondary-800 to-secondary-900 border border-secondary-700/70 p-5 text-white shadow-lg transition-all">
      {/* Top Segmented Controls: Consolidado | Banco | Caixa */}
      <div className="flex items-center justify-between gap-2 border-b border-secondary-700/60 pb-3">
        <div className="flex rounded-lg bg-secondary-900/60 p-1 text-xs border border-secondary-700/40">
          <button
            type="button"
            onClick={() => setMode('consolidado')}
            className={cn(
              'flex items-center gap-1.5 rounded-md px-2.5 py-1 font-semibold transition-all',
              mode === 'consolidado'
                ? 'bg-primary-500 text-white shadow-xs'
                : 'text-secondary-300 hover:text-white'
            )}
          >
            <Layers className="h-3.5 w-3.5" />
            <span>Consolidado</span>
          </button>
          <button
            type="button"
            onClick={() => setMode('banco')}
            className={cn(
              'flex items-center gap-1.5 rounded-md px-2.5 py-1 font-semibold transition-all',
              mode === 'banco'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-secondary-300 hover:text-white'
            )}
          >
            <Landmark className="h-3.5 w-3.5" />
            <span>Banco</span>
          </button>
          <button
            type="button"
            onClick={() => setMode('caixa')}
            className={cn(
              'flex items-center gap-1.5 rounded-md px-2.5 py-1 font-semibold transition-all',
              mode === 'caixa'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-secondary-300 hover:text-white'
            )}
          >
            <Coins className="h-3.5 w-3.5" />
            <span>Caixa</span>
          </button>
        </div>

        {periodLabel && (
          <span className="hidden min-[380px]:inline-block rounded-full bg-secondary-800 px-2 py-0.5 text-xs text-secondary-300">
            {periodLabel}
          </span>
        )}
      </div>

      {/* Saldo Principal */}
      <div className="mt-4">
        <div className="flex items-center justify-between text-secondary-300 text-xs font-medium">
          <span>
            {mode === 'consolidado'
              ? 'Saldo Total Disponível (Banco + Caixa)'
              : mode === 'banco'
              ? 'Saldo Disponível em Conta Bancária'
              : 'Saldo Físico em Caixa (Numerário)'}
          </span>
          {periodLabel && (
            <span className="min-[380px]:hidden text-xs text-secondary-400">{periodLabel}</span>
          )}
        </div>

        <div className="mt-1 flex items-baseline justify-between gap-2 flex-wrap">
          <div className="text-3xl font-black tracking-tight text-white tabular-nums">
            {currentBalance.toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' })}
          </div>

          {isFiltered && (
            <div className="flex items-center gap-1.5 rounded-full bg-secondary-900/80 border border-secondary-700/60 px-2.5 py-1 text-xs">
              <span className="text-secondary-400">
                {periodLabel ? `Resultado (${periodLabel}):` : 'Resultado seleção:'}
              </span>
              <span
                className={cn(
                  'font-bold tabular-nums',
                  currentPeriodNet >= 0 ? 'text-green-400' : 'text-red-400'
                )}
              >
                {currentPeriodNet >= 0 ? '+' : ''}
                {currentPeriodNet.toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' })}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* No modo Consolidado: Distribuição entre Banco e Caixa */}
      {mode === 'consolidado' && (
        <div className="mt-4 grid grid-cols-2 gap-2 rounded-lg bg-secondary-900/40 border border-secondary-700/50 p-2.5">
          <button
            type="button"
            onClick={() => setMode('banco')}
            className="flex flex-col rounded-md bg-secondary-800/90 border border-secondary-700/40 p-2 text-left transition-colors hover:bg-secondary-700/90"
          >
            <div className="flex items-center justify-between text-xs text-secondary-300">
              <span className="flex items-center gap-1 font-semibold text-blue-300">
                <Landmark className="h-3 w-3" />
                Banco
              </span>
              <span className="text-secondary-400 font-mono text-xs">{bancoPct}%</span>
            </div>
            <span className="mt-1 text-sm font-bold text-white tabular-nums">
              {bancoRealBalance.toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' })}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setMode('caixa')}
            className="flex flex-col rounded-md bg-secondary-800/90 border border-secondary-700/40 p-2 text-left transition-colors hover:bg-secondary-700/90"
          >
            <div className="flex items-center justify-between text-xs text-secondary-300">
              <span className="flex items-center gap-1 font-semibold text-amber-300">
                <Coins className="h-3 w-3" />
                Caixa
              </span>
              <span className="text-secondary-400 font-mono text-xs">{caixaPct}%</span>
            </div>
            <span className="mt-1 text-sm font-bold text-white tabular-nums">
              {caixaRealBalance.toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' })}
            </span>
          </button>
        </div>
      )}

      {/* Demonstração de Resultados: Receitas e Despesas */}
      <div className="mt-4 grid grid-cols-2 divide-x divide-secondary-700/50 border-t border-secondary-700/50 pt-3">
        <div className="flex flex-col pr-3">
          <div className="flex items-center gap-1 text-xs font-medium text-secondary-300">
            <ArrowUpRight className="h-3.5 w-3.5 text-green-400 shrink-0" />
            <span className="truncate">Receitas {scopeLabel ? `(${scopeLabel})` : ''}</span>
          </div>
          <span className="mt-1 text-sm font-bold text-green-400 tabular-nums">
            +{currentIncome.toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' })}
          </span>
        </div>

        <div className="flex flex-col pl-3">
          <div className="flex items-center gap-1 text-xs font-medium text-secondary-300">
            <ArrowDownRight className="h-3.5 w-3.5 text-red-400 shrink-0" />
            <span className="truncate">Despesas {scopeLabel ? `(${scopeLabel})` : ''}</span>
          </div>
          <span className="mt-1 text-sm font-bold text-red-400 tabular-nums">
            -{currentExpense.toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' })}
          </span>
        </div>
      </div>
    </div>
  )
}
