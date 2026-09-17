import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Task } from '@/types/database'

const TASKS_QUERY_KEY = 'tasks'

export function useTasks() {
  return useQuery({
    queryKey: [TASKS_QUERY_KEY],
    queryFn: async () => {
      const { data, error } = await (supabase as any).from('tasks')
        .select('*')
        .is('deleted_at', null)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data as Task[]
    },
  })
}

export function useCreateTask() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (newTask: any) => {
      const payload = {
        ...newTask,
        assigned_to: newTask.assigned_to ? newTask.assigned_to : null,
        due_date: newTask.due_date ? newTask.due_date : null,
        description: newTask.description ? newTask.description : null,
      }

      const { data, error } = await (supabase as any).from('tasks')
        .insert(payload)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [TASKS_QUERY_KEY] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
    },
  })
}

export function useUpdateTask() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...updates }: any) => {
      const payload: any = { ...updates }
      if ('assigned_to' in updates) {
        payload.assigned_to = updates.assigned_to ? updates.assigned_to : null
      }
      if ('due_date' in updates) {
        payload.due_date = updates.due_date ? updates.due_date : null
      }
      if ('description' in updates) {
        payload.description = updates.description ? updates.description : null
      }

      const { data, error } = await (supabase as any).from('tasks')
        .update(payload)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [TASKS_QUERY_KEY] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
    },
  })
}

export function useDeleteTask() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const updates: any = { deleted_at: new Date().toISOString() }
      const { error } = await (supabase as any).from('tasks')
        .update(updates)
        .eq('id', id)

      if (error) throw error
      return id
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [TASKS_QUERY_KEY] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
    },
  })
}

