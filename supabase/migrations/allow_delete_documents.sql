-- ============================================================================
-- PLATAFORMA APMEE EB COBRE - AUTORIZAÇÃO TOTAL DE ELIMINAÇÃO DE DOCUMENTOS
-- ============================================================================
-- Concede permissão a QUALQUER utilizador (public: authenticated + anon)
-- para eliminar registos da tabela 'documents' e ficheiros do storage.

-- 1. Tabela documents: permitir DELETE a qualquer utilizador
DROP POLICY IF EXISTS "Authenticated users can delete documents" ON public.documents;
DROP POLICY IF EXISTS "Allow delete documents for all users" ON public.documents;

CREATE POLICY "Allow delete documents for all users"
    ON public.documents
    FOR DELETE
    TO public
    USING (true);

-- 2. Tabela documents: permitir UPDATE a qualquer utilizador (para soft-delete)
DROP POLICY IF EXISTS "Authenticated users can update documents" ON public.documents;
DROP POLICY IF EXISTS "Allow update documents for all users" ON public.documents;

CREATE POLICY "Allow update documents for all users"
    ON public.documents
    FOR UPDATE
    TO public
    USING (true)
    WITH CHECK (true);

-- 3. Storage: permitir DELETE de ficheiros a qualquer utilizador
DROP POLICY IF EXISTS "Authenticated users can delete documents bucket" ON storage.objects;
DROP POLICY IF EXISTS "Allow delete storage documents for all users" ON storage.objects;

CREATE POLICY "Allow delete storage documents for all users"
    ON storage.objects
    FOR DELETE
    TO public
    USING (bucket_id = 'documents' OR bucket_id = 'receipts');

-- 4. Conceder privilégios GRANT na tabela
GRANT ALL ON TABLE public.documents TO anon, authenticated, service_role;
