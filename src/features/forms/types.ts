export type FormStatus = 'em_uso' | 'arquivado'

export interface AppForm {
  id: string
  title: string
  url: string
  description?: string | null
  category: string
  status: FormStatus
  created_by?: string | null
  created_by_name?: string | null
  created_at: string
  updated_at: string
  deleted_at?: string | null
}

export const FORM_STATUS_LABELS: Record<FormStatus, string> = {
  em_uso: 'Em Uso',
  arquivado: 'Arquivado',
}

export const DEFAULT_FORM_CATEGORIES = [
  'Inquéritos & Auscultação',
  'Inscrições em Atividades',
  'Avaliação de Eventos',
  'Voluntariado & Apoio',
  'Sugestões & Melhorias',
  'Geral',
]
