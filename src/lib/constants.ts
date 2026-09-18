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
  pai: 'EE',
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

/** Event types */
export const EVENT_TYPES = {
  FESTA: 'festa',
  REUNIAO: 'reuniao',
} as const

/** Event type labels (pt-PT) */
export const EVENT_TYPE_LABELS: Record<string, string> = {
  festa: 'Festa',
  reuniao: 'Reunião',
}

/** Meeting types */
export const MEETING_TYPES = {
  ASSEMBLEIA: 'assembleia',
  DIRECAO: 'direcao',
  PAIS: 'pais',
  OUTRA: 'outra',
} as const

/** Meeting type labels (pt-PT) */
export const MEETING_TYPE_LABELS: Record<string, string> = {
  assembleia: 'Assembleia Geral',
  direcao: 'Reunião de Direção',
  pais: 'Reunião com Pais / EE',
  outra: 'Outra Reunião',
}

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
