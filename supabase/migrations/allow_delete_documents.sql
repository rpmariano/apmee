-- ============================================================================
-- PLATAFORMA APMEE EB COBRE - PERMISSÃO DE ELIMINAÇÃO DE DOCUMENTOS
-- ============================================================================
-- Permite que todos os utilizadores autenticados possam eliminar documentos
-- da tabela 'documents' e remover os respetivos ficheiros dos buckets de storage.

DROP POLICY IF EXISTS "Authenticated users can delete documents" ON public.documents;
CREATE POLICY "Authenticated users can delete documents"
    ON public.documents
    FOR DELETE
    TO authenticated
    USING (true);

-- Permitir remoção de objetos nos buckets de storage
DROP POLICY IF EXISTS "Authenticated users can delete documents bucket" ON storage.objects;
CREATE POLICY "Authenticated users can delete documents bucket"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (bucket_id = 'documents' OR bucket_id = 'receipts');
