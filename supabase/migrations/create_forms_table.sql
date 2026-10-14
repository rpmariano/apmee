-- ============================================================================
-- PLATAFORMA APMEE EB COBRE - MÓDULO FORMS (QUESTIONÁRIOS & INQUÉRITOS)
-- ============================================================================
-- Tabela para gestão e catálogo de links de questionários (ex: Microsoft Forms).

CREATE TABLE IF NOT EXISTS public.forms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    url TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL DEFAULT 'Geral',
    status TEXT NOT NULL DEFAULT 'em_uso' CHECK (status IN ('em_uso', 'arquivado')),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_by_name TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ
);

-- Índices de consulta rápida
CREATE INDEX IF NOT EXISTS idx_forms_category ON public.forms(category);
CREATE INDEX IF NOT EXISTS idx_forms_status ON public.forms(status);
CREATE INDEX IF NOT EXISTS idx_forms_deleted_at ON public.forms(deleted_at);
CREATE INDEX IF NOT EXISTS idx_forms_created_at ON public.forms(created_at DESC);

-- Ativar Row Level Security (RLS)
ALTER TABLE public.forms ENABLE ROW LEVEL SECURITY;

-- Conceder permissões
GRANT ALL ON TABLE public.forms TO authenticated;
GRANT ALL ON TABLE public.forms TO service_role;

-- Políticas de RLS
DROP POLICY IF EXISTS "Authenticated users can select active forms" ON public.forms;
CREATE POLICY "Authenticated users can select active forms"
    ON public.forms
    FOR SELECT
    TO authenticated
    USING (deleted_at IS NULL OR get_user_permission_level() = 'superadmin');

DROP POLICY IF EXISTS "Authenticated users can insert forms" ON public.forms;
CREATE POLICY "Authenticated users can insert forms"
    ON public.forms
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can update forms" ON public.forms;
CREATE POLICY "Authenticated users can update forms"
    ON public.forms
    FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can delete forms" ON public.forms;
CREATE POLICY "Authenticated users can delete forms"
    ON public.forms
    FOR DELETE
    TO authenticated
    USING (get_user_permission_level() = 'superadmin');
