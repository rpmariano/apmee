-- ============================================================================
-- PLATAFORMA APMEE EB COBRE - GESTÃO DOCUMENTAL
-- ============================================================================
-- Tabela para gestão e arquivo de documentos oficiais da APMEE.

CREATE TABLE IF NOT EXISTS public.documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_url TEXT NOT NULL,
    file_size BIGINT,
    file_type TEXT,
    category TEXT NOT NULL DEFAULT 'Geral',
    status TEXT NOT NULL DEFAULT 'em_uso' CHECK (status IN ('em_uso', 'arquivado', 'rascunho')),
    notes TEXT,
    uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    uploaded_by_name TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ
);

-- Índices de consulta rápida
CREATE INDEX IF NOT EXISTS idx_documents_category ON public.documents(category);
CREATE INDEX IF NOT EXISTS idx_documents_status ON public.documents(status);
CREATE INDEX IF NOT EXISTS idx_documents_deleted_at ON public.documents(deleted_at);
CREATE INDEX IF NOT EXISTS idx_documents_created_at ON public.documents(created_at DESC);

-- Ativar RLS
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- Conceder permissões à role authenticated
GRANT ALL ON TABLE public.documents TO authenticated;
GRANT ALL ON TABLE public.documents TO service_role;

-- Políticas de RLS
DROP POLICY IF EXISTS "Authenticated users can select active documents" ON public.documents;
CREATE POLICY "Authenticated users can select active documents"
    ON public.documents
    FOR SELECT
    TO authenticated
    USING (deleted_at IS NULL OR get_user_permission_level() = 'superadmin');

DROP POLICY IF EXISTS "Authenticated users can insert documents" ON public.documents;
CREATE POLICY "Authenticated users can insert documents"
    ON public.documents
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can update documents" ON public.documents;
CREATE POLICY "Authenticated users can update documents"
    ON public.documents
    FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can delete documents" ON public.documents;
CREATE POLICY "Authenticated users can delete documents"
    ON public.documents
    FOR DELETE
    TO authenticated
    USING (true);

-- Criar bucket 'documents' no storage se não existir
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Políticas para storage.objects no bucket 'documents'
DROP POLICY IF EXISTS "Authenticated users can view documents bucket" ON storage.objects;
CREATE POLICY "Authenticated users can view documents bucket"
    ON storage.objects FOR SELECT
    TO authenticated, anon
    USING (bucket_id = 'documents');

DROP POLICY IF EXISTS "Authenticated users can upload to documents bucket" ON storage.objects;
CREATE POLICY "Authenticated users can upload to documents bucket"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = 'documents');

DROP POLICY IF EXISTS "Authenticated users can update documents bucket" ON storage.objects;
CREATE POLICY "Authenticated users can update documents bucket"
    ON storage.objects FOR UPDATE
    TO authenticated
    USING (bucket_id = 'documents');
