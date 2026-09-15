import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Task } from '@/types/database'

const TASKS_QUERY_KEY = 'tasks'

export function useTasks() {
  return useQuery({
    queryKey: [TASKS_QUERY_KEY],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .is('deleted_at', null)
        .order('created_at', { ascending: false }) // Or we could order by due_date or status

      if (error) throw error
      return data as Task[]
    },
  })
}

export function useCreateTask() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (newTask: Omit<Task, 'id' | 'created_at' | 'updated_at' | 'deleted_at'>) => {
      const { data, error } = await supabase
        .from('tasks')
        .insert(newTask)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [TASKS_QUERY_KEY] })
    },
  })
}

export function useUpdateTask() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Omit<Task, 'created_at' | 'updated_at' | 'deleted_at'>> & { id: string }) => {
      const { data, error } = await supabase
        .from('tasks')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [TASKS_QUERY_KEY] })
    },
  })
}

export function useDeleteTask() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      // Soft delete
      const { error } = await supabase
        .from('tasks')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id)

      if (error) throw error
      return id
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [TASKS_QUERY_KEY] })
    },
  })
}
