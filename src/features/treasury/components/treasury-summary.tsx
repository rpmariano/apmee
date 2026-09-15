import { ArrowDownRight, ArrowUpRight, Wallet } from 'lucide-react'
import type { FinancialMovement } from '@/types/database'

interface TreasurySummaryProps {
  movements?: FinancialMovement[]
  isLoading: boolean
}

export function TreasurySummary({ movements, isLoading }: TreasurySummaryProps) {
  if (isLoading) {
    return <div className="h-28 w-full animate-pulse rounded-[var(--radius-card)] bg-warm-100" />
  }

  const income = (movements || [])
    .filter((m) => m.type === 'income')
    .reduce((sum, m) => sum + Number(m.amount), 0)

  const expense = (movements || [])
    .filter((m) => m.type === 'expense')
    .reduce((sum, m) => sum + Number(m.amount), 0)

  const balance = income - expense

  return (
    <div className="rounded-[var(--radius-card)] bg-secondary-900 p-5 text-white shadow-lg">
      <div className="flex items-center gap-2 text-secondary-100">
        <Wallet className="h-5 w-5" />
        <h2 className="font-medium">Saldo Atual</h2>
      </div>
      
      <div className="mt-2 text-3xl font-black tracking-tight">
        {balance.toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' })}
      </div>

      <div className="mt-4 grid grid-cols-2 divide-x divide-secondary-700/50 border-t border-secondary-700/50 pt-4">
        <div className="flex flex-col pr-4">
          <div className="flex items-center gap-1 text-xs font-medium text-secondary-300">
            <ArrowUpRight className="h-3.5 w-3.5 text-green-400" />
            Receitas
          </div>
          <span className="mt-1 font-semibold text-green-400">
            {income.toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' })}
          </span>
        </div>
        
        <div className="flex flex-col pl-4">
          <div className="flex items-center gap-1 text-xs font-medium text-secondary-300">
            <ArrowDownRight className="h-3.5 w-3.5 text-red-400" />
            Despesas
          </div>
          <span className="mt-1 font-semibold text-red-400">
            {expense.toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' })}
          </span>
        </div>
      </div>
    </div>
  )
}
