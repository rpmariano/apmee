-- ============================================================================
-- Migração: Adicionar campo is_active à tabela contacts
-- Data: 2026-09-18
-- Descrição: Adiciona coluna 'is_active' (BOOLEAN DEFAULT true) à tabela contacts
--            para permitir filtrar e gerir contactos ativos e inativos.
-- ============================================================================

-- 1. Adicionar coluna is_active se não existir
ALTER TABLE contacts
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- 2. Atualizar registos existentes sem valor para true
UPDATE contacts
SET is_active = true
WHERE is_active IS NULL;

-- 3. Comentário de schema
COMMENT ON COLUMN contacts.is_active IS 'Indica se o contacto está ativo no sistema (true por defeito) ou arquivado/inativo (false).';

-- 4. Índice para filtragem rápida por estado
CREATE INDEX IF NOT EXISTS idx_contacts_is_active ON contacts(is_active);
