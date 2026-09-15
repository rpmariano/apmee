import { usePermissions } from '@/hooks/use-permissions'

/**
 * Tesouraria — placeholder page
 * TODO: Financial movements dashboard with cashflow analytics
 */
export default function TreasuryPage() {
  const { isFinancialReadOnly } = usePermissions()

  return (
    <div className="px-4 pt-6">
      <div className="flex items-center gap-2">
        <h1 className="text-xl font-bold text-foreground">Tesouraria</h1>
        {isFinancialReadOnly() && (
          <span className="rounded-full bg-warm-200 px-2 py-0.5 text-xs font-medium text-secondary-600">
            Apenas leitura
          </span>
        )}
      </div>
      <p className="mt-2 text-sm text-muted">Em breve — controlo financeiro e analítica.</p>
    </div>
  )
}
