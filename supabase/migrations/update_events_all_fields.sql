-- ============================================================================
-- APMEE EB Cobre: Atualizacao da tabela events
-- Executar este script no Supabase SQL Editor (Dashboard > SQL Editor > New query)
-- ============================================================================

-- 1. Adicionar coluna de tipo de evento (festa ou reuniao)
ALTER TABLE events 
ADD COLUMN IF NOT EXISTS event_type TEXT DEFAULT 'festa' CHECK (event_type IN ('festa', 'reuniao'));

-- 2. Adicionar campos especificos para Reunioes (tipo, objetivos, ata, documentos)
ALTER TABLE events 
ADD COLUMN IF NOT EXISTS meeting_type TEXT;

ALTER TABLE events 
ADD COLUMN IF NOT EXISTS objectives TEXT;

ALTER TABLE events 
ADD COLUMN IF NOT EXISTS minutes TEXT;

ALTER TABLE events 
ADD COLUMN IF NOT EXISTS documents JSONB DEFAULT '[]'::jsonb;

-- 3. Adicionar coluna com o nome do utilizador criador (para identificacao/selo)
ALTER TABLE events 
ADD COLUMN IF NOT EXISTS created_by_name TEXT;

-- 4. Adicionar comentarios descritivos
COMMENT ON COLUMN events.event_type IS 'Tipo do evento: festa ou reuniao.';
COMMENT ON COLUMN events.meeting_type IS 'Subtipo de reuniao: assembleia, direcao, pais, outra.';
COMMENT ON COLUMN events.objectives IS 'Descricao dos objetivos ou ordem de trabalhos da reuniao.';
COMMENT ON COLUMN events.minutes IS 'Ata da reuniao, resumo das discussoes e deliberacoes.';
COMMENT ON COLUMN events.documents IS 'Lista de documentos em JSONB: [{id, name, url, size, type, uploaded_at}].';
COMMENT ON COLUMN events.created_by_name IS 'Nome de exibicao do utilizador que criou o evento.';

-- 5. Forcar a atualizacao da cache de schema do PostgREST no Supabase
NOTIFY pgrst, 'reload schema';
