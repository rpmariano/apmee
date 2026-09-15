import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { AllowedUser } from '@/types/database'

const BOARD_QUERY_KEY = 'board'

export function useBoardMembers() {
  return useQuery({
    queryKey: [BOARD_QUERY_KEY],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('allowed_users')
        .select('*')
        .order('role', { ascending: true })

      if (error) throw error
      return data as AllowedUser[]
    },
  })
}

export function useCreateMember() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (newMember: any) => {
      const { data, error } = await (supabase as any)
        .from('allowed_users')
        .insert(newMember)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [BOARD_QUERY_KEY] })
    },
  })
}

export function useUpdateMember() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...updates }: any) => {
      const { data, error } = await (supabase as any)
        .from('allowed_users')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [BOARD_QUERY_KEY] })
    },
  })
}
