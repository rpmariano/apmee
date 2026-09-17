-- ============================================================================
-- Migração: Adicionar coluna created_by_name à tabela events
-- ============================================================================

ALTER TABLE events 
ADD COLUMN IF NOT EXISTS created_by_name TEXT;

COMMENT ON COLUMN events.created_by_name IS 'Nome de exibição do utilizador que criou o evento para efeitos de identificação/selo.';
