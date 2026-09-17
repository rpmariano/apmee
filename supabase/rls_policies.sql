-- ============================================================================
-- PLATAFORMA APMEE EB COBRE - POLÍTICAS DE ROW LEVEL SECURITY (RLS)
-- ============================================================================
-- Descrição: Configuração de segurança ao nível de linha (RLS) para o Supabase/PostgreSQL.
--            Define o controlo de acessos baseado em perfis (RBAC):
--            - superadmin: Acesso global irrestrito, gestão de utilizadores e hard delete.
--            - nivel_1: Leitura e escrita completa (incluindo módulos financeiros).
--            - nivel_2: Leitura e escrita geral, leitura estrita (read-only) em finanças.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. FUNÇÃO AUXILIAR: get_user_permission_level()
-- ----------------------------------------------------------------------------
-- Obtém o nível de permissão do utilizador autenticado a partir do email contido
-- no token JWT da sessão ativa (auth.jwt() ->> 'email') comparado com allowed_users.
-- Executada como SECURITY DEFINER para garantir acesso à tabela allowed_users
-- sem dependências circulares de RLS.

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
    WHERE email = (auth.jwt() ->> 'email')
      AND is_active = true
    LIMIT 1;

    RETURN v_permission_level;
END;
$$;

COMMENT ON FUNCTION get_user_permission_level() IS 'Devolve o nível de permissão (superadmin, nivel_1, nivel_2) do utilizador autenticado e ativo correspondente ao email do JWT.';

-- Conceder permissão de execução a utilizadores autenticados e anónimos
GRANT EXECUTE ON FUNCTION get_user_permission_level() TO authenticated, anon;

-- ----------------------------------------------------------------------------
-- 2. ATIVAÇÃO DE RLS EM TODAS AS TABELAS
-- ----------------------------------------------------------------------------
ALTER TABLE allowed_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_volunteers ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotas ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------------------
-- 3. POLÍTICAS: allowed_users
-- ----------------------------------------------------------------------------
-- Requisito: Apenas superadmin pode executar TODAS as operações.
--            Todos os utilizadores autenticados podem consultar (SELECT) a sua própria linha.

DROP POLICY IF EXISTS "Superadmin full access on allowed_users" ON allowed_users;
CREATE POLICY "Superadmin full access on allowed_users"
    ON allowed_users
    FOR ALL
    TO authenticated
    USING (get_user_permission_level() = 'superadmin')
    WITH CHECK (get_user_permission_level() = 'superadmin');

DROP POLICY IF EXISTS "Authenticated users can select own record in allowed_users" ON allowed_users;
CREATE POLICY "Authenticated users can select own record in allowed_users"
    ON allowed_users
    FOR SELECT
    TO authenticated
    USING (email = (auth.jwt() ->> 'email'));

-- ----------------------------------------------------------------------------
-- 4. POLÍTICAS: contacts
-- ----------------------------------------------------------------------------
-- Requisito: Todos os utilizadores autenticados podem consultar registos ativos (deleted_at IS NULL).
--            Todos os utilizadores autenticados podem criar (INSERT) e atualizar (UPDATE).
--            Apenas superadmin pode eliminar definitivamente (hard DELETE).

DROP POLICY IF EXISTS "Authenticated users can select active contacts" ON contacts;
CREATE POLICY "Authenticated users can select active contacts"
    ON contacts
    FOR SELECT
    TO authenticated
    USING (deleted_at IS NULL OR get_user_permission_level() = 'superadmin');

DROP POLICY IF EXISTS "Authenticated users can insert contacts" ON contacts;
CREATE POLICY "Authenticated users can insert contacts"
    ON contacts
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can update contacts" ON contacts;
CREATE POLICY "Authenticated users can update contacts"
    ON contacts
    FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

DROP POLICY IF EXISTS "Only superadmin can hard delete contacts" ON contacts;
CREATE POLICY "Only superadmin can hard delete contacts"
    ON contacts
    FOR DELETE
    TO authenticated
    USING (get_user_permission_level() = 'superadmin');

-- ----------------------------------------------------------------------------
-- 5. POLÍTICAS: events
-- ----------------------------------------------------------------------------
-- Requisito: Igual a contacts.

DROP POLICY IF EXISTS "Authenticated users can select active events" ON events;
CREATE POLICY "Authenticated users can select active events"
    ON events
    FOR SELECT
    TO authenticated
    USING (deleted_at IS NULL OR get_user_permission_level() = 'superadmin');

DROP POLICY IF EXISTS "Authenticated users can insert events" ON events;
CREATE POLICY "Authenticated users can insert events"
    ON events
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can update events" ON events;
CREATE POLICY "Authenticated users can update events"
    ON events
    FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

DROP POLICY IF EXISTS "Only superadmin can hard delete events" ON events;
CREATE POLICY "Only superadmin can hard delete events"
    ON events
    FOR DELETE
    TO authenticated
    USING (get_user_permission_level() = 'superadmin');

-- ----------------------------------------------------------------------------
-- 6. POLÍTICAS: event_volunteers
-- ----------------------------------------------------------------------------
-- Requisito: Todos os utilizadores autenticados podem SELECT, INSERT, UPDATE e DELETE.

DROP POLICY IF EXISTS "Authenticated users can select event volunteers" ON event_volunteers;
CREATE POLICY "Authenticated users can select event volunteers"
    ON event_volunteers
    FOR SELECT
    TO authenticated
    USING (true);

DROP POLICY IF EXISTS "Authenticated users can insert event volunteers" ON event_volunteers;
CREATE POLICY "Authenticated users can insert event volunteers"
    ON event_volunteers
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can update event volunteers" ON event_volunteers;
CREATE POLICY "Authenticated users can update event volunteers"
    ON event_volunteers
    FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can delete event volunteers" ON event_volunteers;
CREATE POLICY "Authenticated users can delete event volunteers"
    ON event_volunteers
    FOR DELETE
    TO authenticated
    USING (true);

-- ----------------------------------------------------------------------------
-- 7. POLÍTICAS: event_tasks
-- ----------------------------------------------------------------------------
-- Requisito: Todos os utilizadores autenticados podem SELECT, INSERT, UPDATE e DELETE.

DROP POLICY IF EXISTS "Authenticated users can select event tasks" ON event_tasks;
CREATE POLICY "Authenticated users can select event tasks"
    ON event_tasks
    FOR SELECT
    TO authenticated
    USING (true);

DROP POLICY IF EXISTS "Authenticated users can insert event tasks" ON event_tasks;
CREATE POLICY "Authenticated users can insert event tasks"
    ON event_tasks
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can update event tasks" ON event_tasks;
CREATE POLICY "Authenticated users can update event tasks"
    ON event_tasks
    FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can delete event tasks" ON event_tasks;
CREATE POLICY "Authenticated users can delete event tasks"
    ON event_tasks
    FOR DELETE
    TO authenticated
    USING (true);

-- ----------------------------------------------------------------------------
-- 7b. POLÍTICAS: event_inventory
-- ----------------------------------------------------------------------------
-- Requisito: Todos os utilizadores autenticados podem SELECT, INSERT, UPDATE e DELETE.

ALTER TABLE IF EXISTS event_inventory ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can select event inventory" ON event_inventory;
CREATE POLICY "Authenticated users can select event inventory"
    ON event_inventory
    FOR SELECT
    TO authenticated
    USING (true);

DROP POLICY IF EXISTS "Authenticated users can insert event inventory" ON event_inventory;
CREATE POLICY "Authenticated users can insert event inventory"
    ON event_inventory
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can update event inventory" ON event_inventory;
CREATE POLICY "Authenticated users can update event inventory"
    ON event_inventory
    FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can delete event inventory" ON event_inventory;
CREATE POLICY "Authenticated users can delete event inventory"
    ON event_inventory
    FOR DELETE
    TO authenticated
    USING (true);

-- ----------------------------------------------------------------------------
-- 8. POLÍTICAS: tasks
-- ----------------------------------------------------------------------------
-- Requisito: Todos os utilizadores autenticados podem SELECT, INSERT e UPDATE.
--            Eliminação física proibida (soft delete realizado através de UPDATE na coluna deleted_at).

DROP POLICY IF EXISTS "Authenticated users can select active tasks" ON tasks;
CREATE POLICY "Authenticated users can select active tasks"
    ON tasks
    FOR SELECT
    TO authenticated
    USING (deleted_at IS NULL OR get_user_permission_level() = 'superadmin');

DROP POLICY IF EXISTS "Authenticated users can insert tasks" ON tasks;
CREATE POLICY "Authenticated users can insert tasks"
    ON tasks
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can update tasks" ON tasks;
CREATE POLICY "Authenticated users can update tasks"
    ON tasks
    FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Não existe política de DELETE: nenhum utilizador pode apagar fisicamente registos de tarefas.

-- ----------------------------------------------------------------------------
-- 9. POLÍTICAS: inventory_items
-- ----------------------------------------------------------------------------
-- Requisito: Igual a contacts (SELECT registos ativos, INSERT/UPDATE para todos autenticados, hard DELETE apenas superadmin).

DROP POLICY IF EXISTS "Authenticated users can select active inventory items" ON inventory_items;
CREATE POLICY "Authenticated users can select active inventory items"
    ON inventory_items
    FOR SELECT
    TO authenticated
    USING (deleted_at IS NULL OR get_user_permission_level() = 'superadmin');

DROP POLICY IF EXISTS "Authenticated users can insert inventory items" ON inventory_items;
CREATE POLICY "Authenticated users can insert inventory items"
    ON inventory_items
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can update inventory items" ON inventory_items;
CREATE POLICY "Authenticated users can update inventory items"
    ON inventory_items
    FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

DROP POLICY IF EXISTS "Only superadmin can hard delete inventory items" ON inventory_items;
CREATE POLICY "Only superadmin can hard delete inventory items"
    ON inventory_items
    FOR DELETE
    TO authenticated
    USING (get_user_permission_level() = 'superadmin');

-- ----------------------------------------------------------------------------
-- 10. POLÍTICAS: financial_movements
-- ----------------------------------------------------------------------------
-- Requisito: Todos os utilizadores autenticados podem consultar registos ativos (deleted_at IS NULL).
--            Apenas superadmin e nivel_1 podem criar (INSERT) e atualizar (UPDATE).
--            Nenhum utilizador pode fazer hard DELETE (soft delete através de UPDATE na coluna deleted_at).

DROP POLICY IF EXISTS "Authenticated users can select active financial movements" ON financial_movements;
CREATE POLICY "Authenticated users can select active financial movements"
    ON financial_movements
    FOR SELECT
    TO authenticated
    USING (deleted_at IS NULL OR get_user_permission_level() = 'superadmin');

DROP POLICY IF EXISTS "Superadmin and nivel_1 can insert financial movements" ON financial_movements;
CREATE POLICY "Superadmin and nivel_1 can insert financial movements"
    ON financial_movements
    FOR INSERT
    TO authenticated
    WITH CHECK (get_user_permission_level() IN ('superadmin', 'nivel_1'));

DROP POLICY IF EXISTS "Superadmin and nivel_1 can update financial movements" ON financial_movements;
CREATE POLICY "Superadmin and nivel_1 can update financial movements"
    ON financial_movements
    FOR UPDATE
    TO authenticated
    USING (get_user_permission_level() IN ('superadmin', 'nivel_1'))
    WITH CHECK (get_user_permission_level() IN ('superadmin', 'nivel_1'));

-- Não existe política de DELETE: nenhum utilizador pode apagar fisicamente movimentos financeiros.

-- ----------------------------------------------------------------------------
-- 11. POLÍTICAS: quotas
-- ----------------------------------------------------------------------------
-- Requisito: Igual a financial_movements.

DROP POLICY IF EXISTS "Authenticated users can select active quotas" ON quotas;
CREATE POLICY "Authenticated users can select active quotas"
    ON quotas
    FOR SELECT
    TO authenticated
    USING (deleted_at IS NULL OR get_user_permission_level() = 'superadmin');

DROP POLICY IF EXISTS "Superadmin and nivel_1 can insert quotas" ON quotas;
CREATE POLICY "Superadmin and nivel_1 can insert quotas"
    ON quotas
    FOR INSERT
    TO authenticated
    WITH CHECK (get_user_permission_level() IN ('superadmin', 'nivel_1'));

DROP POLICY IF EXISTS "Superadmin and nivel_1 can update quotas" ON quotas;
CREATE POLICY "Superadmin and nivel_1 can update quotas"
    ON quotas
    FOR UPDATE
    TO authenticated
    USING (get_user_permission_level() IN ('superadmin', 'nivel_1'))
    WITH CHECK (get_user_permission_level() IN ('superadmin', 'nivel_1'));

-- Não existe política de DELETE: nenhum utilizador pode apagar fisicamente quotas de associados.
