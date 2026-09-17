-- ============================================================================
-- Migração: Adicionar campo de conta ('banco' ou 'caixa') em financial_movements
-- Data: 2026-09-18
-- Descrição: Permite segregar os fluxos e saldos entre a Conta Bancária e Dinheiro em Caixa
-- ============================================================================

-- 1. Adicionar coluna account com restrição de valores (banco ou caixa)
ALTER TABLE financial_movements
ADD COLUMN IF NOT EXISTS account TEXT NOT NULL DEFAULT 'banco'
CHECK (account IN ('banco', 'caixa'));

-- 2. Atualizar comentários
COMMENT ON COLUMN financial_movements.account IS 'Conta à qual pertence o movimento: banco (conta bancária institucional) ou caixa (dinheiro físico/numerário).';

-- 3. Criar índice para pesquisas rápidas por conta
CREATE INDEX IF NOT EXISTS idx_financial_movements_account ON financial_movements(account);
