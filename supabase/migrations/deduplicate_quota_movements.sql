-- ============================================================================
-- Migração: Deduplicação e Limpeza de Movimentos de Quotas na Tesouraria
-- Data: 2026-09-19
-- Descrição: 
--   1. Assegura que a tabela quotas tem as colunas 'account' e 'movement_id'.
--   2. Executa soft-delete de movimentos duplicados de quotas em financial_movements,
--      preservando apenas o registo mais recente para cada associado e ano letivo.
-- ============================================================================

-- 1. Assegurar colunas na tabela quotas
ALTER TABLE quotas
ADD COLUMN IF NOT EXISTS account TEXT DEFAULT 'banco'
CHECK (account IN ('banco', 'caixa'));

ALTER TABLE quotas
ADD COLUMN IF NOT EXISTS movement_id UUID REFERENCES financial_movements(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_quotas_movement_id ON quotas(movement_id);

-- 2. Soft-delete de movimentos duplicados de 'Quotas de Sócios' em financial_movements
-- Identifica movimentos com a mesma descrição normalizada e mantém apenas o mais recente
WITH ranked_quota_movements AS (
  SELECT 
    id,
    ROW_NUMBER() OVER (
      PARTITION BY category, LOWER(REGEXP_REPLACE(TRIM(description), '\s+', ' ', 'g'))
      ORDER BY updated_at DESC NULLS LAST, created_at DESC NULLS LAST, id DESC
    ) AS rank_num
  FROM financial_movements
  WHERE category = 'Quotas de Sócios'
    AND deleted_at IS NULL
)
UPDATE financial_movements
SET deleted_at = now()
WHERE id IN (
  SELECT id FROM ranked_quota_movements WHERE rank_num > 1
);
