import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Event } from '@/types/database'

const EVENTS_QUERY_KEY = 'events'

export function useEvents() {
  return useQuery({
    queryKey: [EVENTS_QUERY_KEY],
    queryFn: async () => {
      const { data, error } = await (supabase as any).from('events')
        .select('*')
        .is('deleted_at', null)
        .order('start_date', { ascending: true })

      if (error) throw error
      return data as Event[]
    },
  })
}

export function useCreateEvent() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (newEvent: any) => {
      const { data, error } = await (supabase as any).from('events')
        .insert(newEvent)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [EVENTS_QUERY_KEY] })
    },
  })
}

export function useUpdateEvent() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...updates }: any) => {
      const { data, error } = await (supabase as any).from('events')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [EVENTS_QUERY_KEY] })
    },
  })
}

export function useDeleteEvent() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const updates: any = { deleted_at: new Date().toISOString() }
      const { error } = await (supabase as any).from('events')
        .update(updates)
        .eq('id', id)

      if (error) throw error
      return id
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [EVENTS_QUERY_KEY] })
    },
  })
}
