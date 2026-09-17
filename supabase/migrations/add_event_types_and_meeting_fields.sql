-- ============================================================================
-- Migração: Adicionar suporte para tipos de eventos (Festas e Reuniões)
-- e campos específicos de reuniões (tipo de reunião, objetivos, ata, documentos)
-- ============================================================================

-- 1. Adicionar coluna event_type com valor por omissão 'festa'
ALTER TABLE events 
ADD COLUMN IF NOT EXISTS event_type TEXT DEFAULT 'festa' CHECK (event_type IN ('festa', 'reuniao'));

-- 2. Adicionar campos específicos para Reuniões
ALTER TABLE events 
ADD COLUMN IF NOT EXISTS meeting_type TEXT;

ALTER TABLE events 
ADD COLUMN IF NOT EXISTS objectives TEXT;

ALTER TABLE events 
ADD COLUMN IF NOT EXISTS minutes TEXT;

ALTER TABLE events 
ADD COLUMN IF NOT EXISTS documents JSONB DEFAULT '[]'::jsonb;

-- 3. Comentários das colunas
COMMENT ON COLUMN events.event_type IS 'Tipo do evento: festa (celebrações/festas com materiais) ou reuniao (reuniões com ata e documentos).';
COMMENT ON COLUMN events.meeting_type IS 'Subtipo de reunião: assembleia, direcao, pais, outra.';
COMMENT ON COLUMN events.objectives IS 'Descrição dos objetivos ou ordem de trabalhos da reunião.';
COMMENT ON COLUMN events.minutes IS 'Ata da reunião, resumo das discussões e deliberações.';
COMMENT ON COLUMN events.documents IS 'Lista de documentos em JSONB: [{id, name, url, size, type, uploaded_at}].';
