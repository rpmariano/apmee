-- ============================================================================
-- Migração: Integração de Quotas com Tesouraria (Conta e Ligação a Movimento)
-- Data: 2026-09-18
-- Descrição: Adiciona colunas 'account' ('banco' ou 'caixa') e 'movement_id'
--            à tabela quotas para refletir quotas pagas na contabilidade da associação.
-- ============================================================================

-- 1. Adicionar coluna account com restrição de valores (banco ou caixa)
ALTER TABLE quotas
ADD COLUMN IF NOT EXISTS account TEXT DEFAULT 'banco'
CHECK (account IN ('banco', 'caixa'));

-- 2. Adicionar coluna movement_id referenciando financial_movements
ALTER TABLE quotas
ADD COLUMN IF NOT EXISTS movement_id UUID REFERENCES financial_movements(id) ON DELETE SET NULL;

-- 3. Comentários para documentação de schema
COMMENT ON COLUMN quotas.account IS 'Conta financeira onde foi recebido o valor da quota: banco ou caixa.';
COMMENT ON COLUMN quotas.movement_id IS 'Identificador do movimento de tesouraria (receita) gerado automaticamente ao liquidar a quota.';

-- 4. Índice para pesquisas rápidas por movimento associado
CREATE INDEX IF NOT EXISTS idx_quotas_movement_id ON quotas(movement_id);
