import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

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

      // Fetch treasury balance (Incomes - Expenses)
      const { data: movements } = await (supabase as any)
        .from('financial_movements')
        .select('type, amount')
        .is('deleted_at', null)
      
      let balance = 0
      if (movements) {
        balance = movements.reduce((acc: number, mov: any) => {
          return mov.type === 'income' ? acc + Number(mov.amount) : acc - Number(mov.amount)
        }, 0)
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
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}
