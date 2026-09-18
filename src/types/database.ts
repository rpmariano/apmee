/**
 * Supabase Database Types
 * 
 * These types represent the database schema for the APMEE platform.
 * In production, generate these automatically with:
 *   npx supabase gen types typescript --project-id <ref> > src/types/database.ts
 */

export type PermissionLevel = 'superadmin' | 'nivel_1' | 'nivel_2'
export type UserRole = 'admin' | 'presidente' | 'tesoureiro' | 'gestor_social' | 'vogal'
export type ContactCategory = 'pai' | 'professor' | 'parceiro' | 'fornecedor' | 'associado'
export type EventStatus = 'planned' | 'active' | 'completed' | 'cancelled'
export type EventType = 'festa' | 'reuniao'
export type MeetingType = 'assembleia' | 'direcao' | 'pais' | 'outra'

export interface EventDocument {
  id: string
  name: string
  url: string
  size?: number
  type?: string
  uploaded_at: string
  drive_file_id?: string
  provider?: 'google_drive' | 'supabase' | 'link'
}

export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent'
export type TaskStatus = 'todo' | 'in_progress' | 'done'
export type InventoryCategory = 'consumivel' | 'alimento' | 'mobilizado' | 'equipamento'
export type InventoryTransactionType = 'in' | 'out'
export type FinancialType = 'income' | 'expense'
export type FinancialAccount = 'banco' | 'caixa'
export type FinancialCategory = 'transferencia' | string | null

export interface AllowedUser {
  id: string
  email: string
  role: UserRole
  permission_level: PermissionLevel
  display_name: string | null
  phone: string | null
  avatar_url: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Contact {
  id: string
  category: ContactCategory
  name: string
  email: string | null
  phone: string | null
  whatsapp: string | null
  avatar_url: string | null
  metadata: Record<string, unknown>
  notes: string | null
  is_member: boolean
  is_active?: boolean
  created_by: string | null
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export interface Event {
  id: string
  title: string
  description: string | null
  location: string | null
  start_date: string
  end_date: string | null
  is_all_day: boolean
  status: EventStatus
  event_type: EventType
  meeting_type?: MeetingType | string | null
  objectives?: string | null
  minutes?: string | null
  documents?: EventDocument[] | null
  created_by: string | null
  created_by_name?: string | null
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export interface EventVolunteer {
  id: string
  event_id: string
  contact_id: string
  role: string | null
  confirmed: boolean
  created_at: string
  updated_at: string
}

export interface EventTask {
  id: string
  event_id: string
  title: string
  assigned_to: string | null
  is_done: boolean
  due_date: string | null
  created_at: string
  updated_at: string
}

export interface Task {
  id: string
  title: string
  description: string | null
  assigned_to: string | null
  priority: TaskPriority
  status: TaskStatus
  due_date: string | null
  created_by: string | null
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export interface InventoryItem {
  id: string
  name: string
  category: InventoryCategory
  quantity: number
  unit: string
  location: string | null
  min_stock: number
  notes: string | null
  created_by: string | null
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export interface FinancialMovement {
  id: string
  type: FinancialType
  account: FinancialAccount
  amount: number
  description: string
  category: string | null
  transfer_id: string | null
  event_id: string | null
  receipt_url: string | null
  date: string
  created_by: string | null
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export interface Quota {
  id: string
  contact_id: string
  year: number
  amount: number
  paid: boolean
  paid_date: string | null
  payment_method: string | null
  account?: FinancialAccount | null
  movement_id?: string | null
  receipt_url: string | null
  created_by: string | null
  created_at: string
  updated_at: string
  deleted_at: string | null
}

/**
 * Supabase Database type definition.
 * Used as generic parameter for createClient<Database>()
 */
export interface Database {
  public: {
    Tables: {
      allowed_users: {
        Row: AllowedUser
        Insert: Omit<AllowedUser, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<AllowedUser, 'id' | 'created_at'>>
      }
      contacts: {
        Row: Contact
        Insert: Omit<Contact, 'id' | 'created_at' | 'updated_at' | 'deleted_at'>
        Update: Partial<Omit<Contact, 'id' | 'created_at'>>
      }
      events: {
        Row: Event
        Insert: Omit<Event, 'id' | 'created_at' | 'updated_at' | 'deleted_at'>
        Update: Partial<Omit<Event, 'id' | 'created_at'>>
      }
      event_volunteers: {
        Row: EventVolunteer
        Insert: Omit<EventVolunteer, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<EventVolunteer, 'id' | 'created_at'>>
      }
      event_tasks: {
        Row: EventTask
        Insert: Omit<EventTask, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<EventTask, 'id' | 'created_at'>>
      }
      tasks: {
        Row: Task
        Insert: Omit<Task, 'id' | 'created_at' | 'updated_at' | 'deleted_at'>
        Update: Partial<Omit<Task, 'id' | 'created_at'>>
      }
      inventory_items: {
        Row: InventoryItem
        Insert: Omit<InventoryItem, 'id' | 'created_at' | 'updated_at' | 'deleted_at'>
        Update: Partial<Omit<InventoryItem, 'id' | 'created_at'>>
      }
      financial_movements: {
        Row: FinancialMovement
        Insert: Omit<FinancialMovement, 'id' | 'created_at' | 'updated_at' | 'deleted_at'>
        Update: Partial<Omit<FinancialMovement, 'id' | 'created_at'>>
      }
      quotas: {
        Row: Quota
        Insert: Omit<Quota, 'id' | 'created_at' | 'updated_at' | 'deleted_at'>
        Update: Partial<Omit<Quota, 'id' | 'created_at'>>
      }
    }
  }
}

export interface InventoryTransaction {
  id: string
  item_id: string
  type: InventoryTransactionType
  quantity: number
  event_id: string | null
  notes: string | null
  created_by: string | null
  created_at: string
}
