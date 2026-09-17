import { useState } from 'react'
import { Landmark, Coins, Layers, ArrowDownRight, ArrowUpRight } from 'lucide-react'
import type { FinancialMovement } from '@/types/database'
import { cn } from '@/lib/utils'

export type TreasuryViewMode = 'consolidado' | 'banco' | 'caixa'

interface TreasurySummaryProps {
  movements?: FinancialMovement[]
  isLoading: boolean
  viewMode?: TreasuryViewMode
  onViewModeChange?: (mode: TreasuryViewMode) => void
  periodLabel?: string
}

export function TreasurySummary({
  movements = [],
  isLoading,
  viewMode: controlledMode,
  onViewModeChange,
  periodLabel,
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

  // Calculate Banco metrics
  const bancoMovements = movements.filter((m) => (m.account || 'banco') === 'banco')
  const bancoIncome = bancoMovements
    .filter((m) => m.type === 'income')
    .reduce((sum, m) => sum + Number(m.amount), 0)
  const bancoExpense = bancoMovements
    .filter((m) => m.type === 'expense')
    .reduce((sum, m) => sum + Number(m.amount), 0)
  const bancoBalance = bancoIncome - bancoExpense

  // Calculate Caixa metrics
  const caixaMovements = movements.filter((m) => m.account === 'caixa')
  const caixaIncome = caixaMovements
    .filter((m) => m.type === 'income')
    .reduce((sum, m) => sum + Number(m.amount), 0)
  const caixaExpense = caixaMovements
    .filter((m) => m.type === 'expense')
    .reduce((sum, m) => sum + Number(m.amount), 0)
  const caixaBalance = caixaIncome - caixaExpense

  // Calculate Consolidated metrics
  const totalIncome = bancoIncome + caixaIncome
  const totalExpense = bancoExpense + caixaExpense
  const totalBalance = totalIncome - totalExpense

  // Percentages of positive liquidity
  const positiveLiquidity = Math.max(0, bancoBalance) + Math.max(0, caixaBalance)
  const bancoPct =
    positiveLiquidity > 0 ? Math.round((Math.max(0, bancoBalance) / positiveLiquidity) * 100) : 50
  const caixaPct = 100 - bancoPct

  // Values based on selected mode
  const currentBalance =
    mode === 'consolidado' ? totalBalance : mode === 'banco' ? bancoBalance : caixaBalance
  const currentIncome =
    mode === 'consolidado' ? totalIncome : mode === 'banco' ? bancoIncome : caixaIncome
  const currentExpense =
    mode === 'consolidado' ? totalExpense : mode === 'banco' ? bancoExpense : caixaExpense

  return (
    <div className="rounded-[var(--radius-card)] bg-secondary-900 p-5 text-white shadow-lg transition-all">
      {/* Top Segmented Controls: Consolidado | Banco | Caixa */}
      <div className="flex items-center justify-between gap-2 border-b border-secondary-800 pb-3">
        <div className="flex rounded-lg bg-secondary-800/80 p-1 text-xs">
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

        <div className="mt-1 text-3xl font-black tracking-tight text-white">
          {currentBalance.toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' })}
        </div>
      </div>

      {/* No modo Consolidado: Distribuição entre Banco e Caixa */}
      {mode === 'consolidado' && (
        <div className="mt-4 grid grid-cols-2 gap-2 rounded-lg bg-secondary-800/50 p-2.5">
          <button
            type="button"
            onClick={() => setMode('banco')}
            className="flex flex-col rounded-md bg-secondary-800/80 p-2 text-left transition-colors hover:bg-secondary-800"
          >
            <div className="flex items-center justify-between text-xs text-secondary-300">
              <span className="flex items-center gap-1 font-semibold text-blue-300">
                <Landmark className="h-3 w-3" />
                Banco
              </span>
              <span className="text-secondary-400 font-mono text-xs">{bancoPct}%</span>
            </div>
            <span className="mt-1 text-sm font-bold text-white">
              {bancoBalance.toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' })}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setMode('caixa')}
            className="flex flex-col rounded-md bg-secondary-800/80 p-2 text-left transition-colors hover:bg-secondary-800"
          >
            <div className="flex items-center justify-between text-xs text-secondary-300">
              <span className="flex items-center gap-1 font-semibold text-amber-300">
                <Coins className="h-3 w-3" />
                Caixa
              </span>
              <span className="text-secondary-400 font-mono text-xs">{caixaPct}%</span>
            </div>
            <span className="mt-1 text-sm font-bold text-white">
              {caixaBalance.toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' })}
            </span>
          </button>
        </div>
      )}

      {/* Demonstração de Resultados: Receitas e Despesas */}
      <div className="mt-4 grid grid-cols-2 divide-x divide-secondary-700/50 border-t border-secondary-700/50 pt-3">
        <div className="flex flex-col pr-3">
          <div className="flex items-center gap-1 text-xs font-medium text-secondary-300">
            <ArrowUpRight className="h-3.5 w-3.5 text-green-400" />
            <span>Receitas {mode !== 'consolidado' ? `(${mode})` : ''}</span>
          </div>
          <span className="mt-1 text-sm font-bold text-green-400">
            +{currentIncome.toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' })}
          </span>
        </div>

        <div className="flex flex-col pl-3">
          <div className="flex items-center gap-1 text-xs font-medium text-secondary-300">
            <ArrowDownRight className="h-3.5 w-3.5 text-red-400" />
            <span>Despesas {mode !== 'consolidado' ? `(${mode})` : ''}</span>
          </div>
          <span className="mt-1 text-sm font-bold text-red-400">
            -{currentExpense.toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' })}
          </span>
        </div>
      </div>
    </div>
  )
}
