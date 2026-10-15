-- ============================================================================
-- PLATAFORMA APMEE EB COBRE - PERMISSÃO DE LEITURA DOS MEMBROS DA DIREÇÃO
-- ============================================================================
-- Permite que todos os utilizadores autenticados possam consultar os membros
-- ativos da Direção (allowed_users) para permitir a atribuição de tarefas e
-- correta exibição dos nomes nos grupos e cartões de tarefas.

DROP POLICY IF EXISTS "Authenticated users can select own record in allowed_users" ON public.allowed_users;
DROP POLICY IF EXISTS "Authenticated users can select active members in allowed_users" ON public.allowed_users;

CREATE POLICY "Authenticated users can select active members in allowed_users"
    ON public.allowed_users
    FOR SELECT
    TO authenticated
    USING (is_active = true OR get_user_permission_level() = 'superadmin');
