export type DocumentStatus = 'em_uso' | 'arquivado' | 'rascunho'

export interface AppDocument {
  id: string
  title: string
  file_name: string
  file_url: string
  file_size?: number | null
  file_type?: string | null
  category: string
  status: DocumentStatus
  notes?: string | null
  uploaded_by?: string | null
  uploaded_by_name?: string | null
  created_at: string
  updated_at: string
  deleted_at?: string | null
}

export const DOCUMENT_STATUS_LABELS: Record<DocumentStatus, string> = {
  em_uso: 'Em Uso',
  arquivado: 'Arquivado',
  rascunho: 'Rascunho',
}

export const ROOT_CATEGORY = 'Sem Pasta'

export function isRootFolder(category?: string | null): boolean {
  if (!category) return true
  const trimmed = category.trim().toLowerCase()
  return trimmed === '' || trimmed === 'sem pasta' || trimmed === 'raiz'
}

export const DEFAULT_DOCUMENT_CATEGORIES = [
  'Estatutos & Regulamentos',
  'Atas de Assembleia / Direção',
  'Relatórios & Contas',
  'Modelos & Minutas',
  'Contratos & Parcerias',
  'Seguros & Licenças',
  'Comunicação & Circulares',
]

