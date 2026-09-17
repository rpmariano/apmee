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
      // Strip fields not in the allowed_users schema (e.g. phone)
      const { phone: _phone, ...payload } = newMember
      const { data, error } = await (supabase as any)
        .from('allowed_users')
        .insert(payload)
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
      // Strip fields not in the allowed_users schema (e.g. phone)
      const { phone: _phone, ...payload } = updates
      const { data, error } = await (supabase as any)
        .from('allowed_users')
        .update(payload)
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

export function useDeleteMember() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      // Soft-delete by deactivating — allowed_users has no deleted_at column
      const { error } = await (supabase as any)
        .from('allowed_users')
        .update({ is_active: false })
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [BOARD_QUERY_KEY] })
    },
  })
}
