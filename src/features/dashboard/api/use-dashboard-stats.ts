import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { getQuotaDeduplicationKey } from '@/lib/quota-utils'

export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      // Fetch contacts count
      const { count: contactsCount } = await (supabase as any)
        .from('contacts')
        .select('*', { count: 'exact', head: true })
        .is('deleted_at', null)

      // Fetch active/planned events count
      const { count: eventsCount } = await (supabase as any)
        .from('events')
        .select('*', { count: 'exact', head: true })
        .in('status', ['planned', 'active'])
        .is('deleted_at', null)

      // Fetch pending tasks count
      const { count: tasksCount } = await (supabase as any)
        .from('tasks')
        .select('*', { count: 'exact', head: true })
        .neq('status', 'done')
        .is('deleted_at', null)

      // Fetch treasury balance (Incomes - Expenses, deduplicating any duplicate quotas identically to Treasury)
      const { data: movements } = await (supabase as any)
        .from('financial_movements')
        .select('id, type, amount, category, description')
        .is('deleted_at', null)
      
      let balance = 0
      if (movements) {
        const seenQuotas = new Set<string>()
        balance = movements.reduce((acc: number, mov: any) => {
          if (mov.category === 'Quotas de Sócios' && mov.description) {
            const key = getQuotaDeduplicationKey(mov.description)
            if (key) {
              if (seenQuotas.has(key)) return acc
              seenQuotas.add(key)
            }
          }
          const val = Number(mov.amount) || 0
          return mov.type === 'income' ? acc + val : acc - val
        }, 0)
        const rounded = Math.round((balance + Number.EPSILON) * 100) / 100
        balance = Object.is(rounded, -0) ? 0 : rounded
      }

      // Fetch next event
      const { data: nextEvent } = await (supabase as any)
        .from('events')
        .select('id, title, start_date')
        .in('status', ['planned', 'active'])
        .is('deleted_at', null)
        .gte('start_date', new Date().toISOString())
        .order('start_date', { ascending: true })
        .limit(1)
        .maybeSingle()

      return {
        contacts: contactsCount || 0,
        events: eventsCount || 0,
        tasks: tasksCount || 0,
        balance,
        nextEvent: nextEvent as { id: string, title: string, start_date: string } | null
      }
    },
    staleTime: 1000 * 60 * 1, // 1 minute
  })
}
