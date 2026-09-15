import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Contact, ContactCategory } from '@/types/database'

const CONTACTS_QUERY_KEY = 'contacts'

export function useContacts(category?: ContactCategory | 'all') {
  return useQuery({
    queryKey: [CONTACTS_QUERY_KEY, category],
    queryFn: async () => {
      let query = (supabase as any).from('contacts')
        .select('*')
        .is('deleted_at', null)
        .order('name', { ascending: true })

      if (category && category !== 'all') {
        query = query.eq('category', category)
      }

      const { data, error } = await query

      if (error) throw error
      return data as Contact[]
    },
  })
}

export function useCreateContact() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (newContact: any) => {
      const { data, error } = await (supabase as any).from('contacts')
        .insert(newContact)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [CONTACTS_QUERY_KEY] })
    },
  })
}

export function useUpdateContact() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...updates }: any) => {
      const { data, error } = await (supabase as any).from('contacts')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [CONTACTS_QUERY_KEY] })
    },
  })
}

export function useDeleteContact() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const updates: any = { deleted_at: new Date().toISOString() }
      const { error } = await (supabase as any).from('contacts')
        .update(updates)
        .eq('id', id)

      if (error) throw error
      return id
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [CONTACTS_QUERY_KEY] })
    },
  })
}
