import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { FinancialAccount } from '@/types/database'

const TREASURY_QUERY_KEY = 'treasury'

export interface TransferPayload {
  fromAccount: FinancialAccount
  toAccount: FinancialAccount
  amount: number
  date: string
  notes?: string
}

/**
 * Creates a pair of mirrored movements for an inter-account transfer.
 * - Expense on the source account (fromAccount)
 * - Income on the destination account (toAccount)
 * Both movements share the same transfer_id UUID for traceability.
 * The consolidated balance is unaffected; each account balance updates correctly.
 */
export function useCreateTransfer() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ fromAccount, toAccount, amount, date, notes }: TransferPayload) => {
      // Generate a shared transfer_id to link the two movements
      const transferId = crypto.randomUUID()

      const toLabel = toAccount === 'banco' ? 'Banco' : 'Caixa'
      const fromLabel = fromAccount === 'banco' ? 'Banco' : 'Caixa'
      const notesSuffix = notes ? ` — ${notes}` : ''

      const outgoing = {
        type: 'expense',
        account: fromAccount,
        amount,
        date,
        category: 'transferencia',
        transfer_id: transferId,
        description: `Transferência para ${toLabel}${notesSuffix}`,
        event_id: null,
        receipt_url: null,
      }

      const incoming = {
        type: 'income',
        account: toAccount,
        amount,
        date,
        category: 'transferencia',
        transfer_id: transferId,
        description: `Transferência de ${fromLabel}${notesSuffix}`,
        event_id: null,
        receipt_url: null,
      }

      // Insert both movements — if either fails, the other is orphaned (acceptable without DB transactions in client SDK)
      const { data: out, error: outErr } = await (supabase as any)
        .from('financial_movements')
        .insert(outgoing)
        .select()
        .single()

      if (outErr) throw outErr

      const { data: inc, error: incErr } = await (supabase as any)
        .from('financial_movements')
        .insert(incoming)
        .select()
        .single()

      if (incErr) {
        // Attempt to roll back the outgoing movement
        await (supabase as any)
          .from('financial_movements')
          .update({ deleted_at: new Date().toISOString() })
          .eq('id', out.id)
        throw incErr
      }

      return { outgoing: out, incoming: inc, transferId }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [TREASURY_QUERY_KEY] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
    },
  })
}

/**
 * Soft-deletes both movements of a transfer by their shared transfer_id.
 */
export function useDeleteTransfer() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (transferId: string) => {
      const { error } = await (supabase as any)
        .from('financial_movements')
        .update({ deleted_at: new Date().toISOString() })
        .eq('transfer_id', transferId)
        .is('deleted_at', null)

      if (error) throw error
      return transferId
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [TREASURY_QUERY_KEY] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
    },
  })
}
