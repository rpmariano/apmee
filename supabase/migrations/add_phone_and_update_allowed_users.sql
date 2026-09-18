-- ============================================================================
-- MIGRAÇÃO: Correções e Melhorias na tabela allowed_users (Direção)
-- ============================================================================
-- 1. Adicionar coluna 'phone' para suporte a número de telemóvel dos membros
ALTER TABLE allowed_users ADD COLUMN IF NOT EXISTS phone TEXT;

-- 2. Atualizar a restrição de 'role' para permitir 'admin', 'presidente', 'tesoureiro', 'gestor_social', 'vogal'
ALTER TABLE allowed_users DROP CONSTRAINT IF EXISTS allowed_users_role_check;
ALTER TABLE allowed_users ADD CONSTRAINT allowed_users_role_check 
    CHECK (role IN ('admin', 'presidente', 'tesoureiro', 'gestor_social', 'vogal'));

-- 3. Atualizar função get_user_permission_level para comparação case-insensitive
CREATE OR REPLACE FUNCTION get_user_permission_level()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
DECLARE
    v_permission_level TEXT;
BEGIN
    SELECT permission_level INTO v_permission_level
    FROM allowed_users
    WHERE LOWER(email) = LOWER(auth.jwt() ->> 'email')
      AND is_active = true
    LIMIT 1;

    RETURN v_permission_level;
END;
$$;

-- 4. Atualizar políticas RLS de allowed_users:
-- Permite que superadmin gira tudo E que cada utilizador autenticado possa atualizar e ver o seu próprio perfil
DROP POLICY IF EXISTS "Superadmin full access on allowed_users" ON allowed_users;
CREATE POLICY "Superadmin full access on allowed_users"
    ON allowed_users
    FOR ALL
    TO authenticated
    USING (get_user_permission_level() = 'superadmin' OR LOWER(email) = LOWER(auth.jwt() ->> 'email'))
    WITH CHECK (get_user_permission_level() = 'superadmin' OR LOWER(email) = LOWER(auth.jwt() ->> 'email'));

DROP POLICY IF EXISTS "Authenticated users can select own record in allowed_users" ON allowed_users;
CREATE POLICY "Authenticated users can select own record in allowed_users"
    ON allowed_users
    FOR SELECT
    TO authenticated
    USING (LOWER(email) = LOWER(auth.jwt() ->> 'email') OR get_user_permission_level() = 'superadmin');
