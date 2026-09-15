/** App-wide constants */

export const APP_NAME = 'APMEE EB Cobre'
export const APP_DESCRIPTION =
  'Plataforma de Gestão — Associação de Pais/Mães e Encarregados/as de Educação da EB Cobre'

/** Permission levels */
export const PERMISSION_LEVELS = {
  SUPERADMIN: 'superadmin',
  NIVEL_1: 'nivel_1',
  NIVEL_2: 'nivel_2',
} as const

/** User roles in the association */
export const ROLES = {
  PRESIDENTE: 'presidente',
  TESOUREIRO: 'tesoureiro',
  GESTOR_SOCIAL: 'gestor_social',
  VOGAL: 'vogal',
} as const

/** Contact categories */
export const CONTACT_CATEGORIES = {
  PAI: 'pai',
  PROFESSOR: 'professor',
  PARCEIRO: 'parceiro',
  FORNECEDOR: 'fornecedor',
  ASSOCIADO: 'associado',
} as const

/** Contact category labels (pt-PT) */
export const CONTACT_CATEGORY_LABELS: Record<string, string> = {
  pai: 'Pais',
  professor: 'Professores',
  parceiro: 'Parceiros',
  fornecedor: 'Fornecedores',
  associado: 'Associados',
}

/** Event statuses */
export const EVENT_STATUSES = {
  PLANNED: 'planned',
  ACTIVE: 'active',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
} as const

/** Task priorities */
export const TASK_PRIORITIES = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  URGENT: 'urgent',
} as const

/** Task statuses */
export const TASK_STATUSES = {
  TODO: 'todo',
  IN_PROGRESS: 'in_progress',
  DONE: 'done',
} as const

/** Inventory categories */
export const INVENTORY_CATEGORIES = {
  DURAVEL: 'duravel',
  CONSUMIVEL: 'consumivel',
} as const

/** Financial movement types */
export const FINANCIAL_TYPES = {
  INCOME: 'income',
  EXPENSE: 'expense',
} as const

/** Modules that are restricted for nivel_2 users (read-only) */
export const FINANCIAL_MODULES = ['treasury', 'quotas'] as const
