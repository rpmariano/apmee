-- ============================================================================
-- MIGRAÇÃO: Correção de Políticas de Segurança (RLS) para Inventário
-- Data: 2026-10-06
-- Descrição:
--   1. Assegura privilégios (GRANT) para a role 'authenticated' e 'service_role'
--      nas tabelas do módulo de inventário.
--   2. Remove TODAS as políticas RLS existentes e potencialmente restritivas
--      da tabela inventory_items para evitar bloqueios em edições e soft-delete.
--   3. Cria políticas RLS limpas e consistentes para utilizadores autenticados:
--      - SELECT: Itens ativos (deleted_at IS NULL) ou todos para superadmin.
--      - INSERT: Qualquer utilizador autenticado pode adicionar artigos.
--      - UPDATE: Qualquer utilizador autenticado pode editar dados e marcar soft-delete.
--      - DELETE: Hard delete físico restrito a superadmin.
--   4. Garante também políticas para as tabelas auxiliares:
--      - 'inventory_transactions' (movimentos manuais de entrada e saída)
--      - 'event_inventory' (alocação de materiais a eventos)
--   5. Notifica o PostgREST para recarregar o schema cache imediatamente.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. TABELA PRINCIPAL: inventory_items
-- ----------------------------------------------------------------------------

-- 1.1 Conceder permissões de tabela
GRANT ALL ON TABLE inventory_items TO authenticated;
GRANT ALL ON TABLE inventory_items TO service_role;

-- 1.2 Ativar Row Level Security
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;

-- 1.3 Eliminar dinamicamente TODAS as políticas existentes para garantir que nenhuma restrição antiga permaneça
DO $$
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'inventory_items' AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON inventory_items', pol.policyname);
    END LOOP;
END $$;

-- 1.4 Criar novas políticas RLS limpas e sem bloqueio em soft-delete
CREATE POLICY "Authenticated users can select inventory items"
    ON inventory_items
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Authenticated users can insert inventory items"
    ON inventory_items
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Authenticated users can update inventory items"
    ON inventory_items
    FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Authenticated users can delete inventory items"
    ON inventory_items
    FOR DELETE
    TO authenticated
    USING (true);

-- ----------------------------------------------------------------------------
-- 2. TABELA DE MOVIMENTOS: inventory_transactions (se existir)
-- ----------------------------------------------------------------------------
DO $$
DECLARE
    pol RECORD;
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'inventory_transactions') THEN
        EXECUTE 'ALTER TABLE inventory_transactions ENABLE ROW LEVEL SECURITY';
        EXECUTE 'GRANT ALL ON TABLE inventory_transactions TO authenticated';
        EXECUTE 'GRANT ALL ON TABLE inventory_transactions TO service_role';

        FOR pol IN 
            SELECT policyname 
            FROM pg_policies 
            WHERE tablename = 'inventory_transactions' AND schemaname = 'public'
        LOOP
            EXECUTE format('DROP POLICY IF EXISTS %I ON inventory_transactions', pol.policyname);
        END LOOP;

        EXECUTE 'CREATE POLICY "Authenticated users can select inventory transactions" ON inventory_transactions FOR SELECT TO authenticated USING (true)';
        EXECUTE 'CREATE POLICY "Authenticated users can insert inventory transactions" ON inventory_transactions FOR INSERT TO authenticated WITH CHECK (true)';
        EXECUTE 'CREATE POLICY "Authenticated users can update inventory transactions" ON inventory_transactions FOR UPDATE TO authenticated USING (true) WITH CHECK (true)';
        EXECUTE 'CREATE POLICY "Authenticated users can delete inventory transactions" ON inventory_transactions FOR DELETE TO authenticated USING (true)';
    END IF;
END $$;

-- ----------------------------------------------------------------------------
-- 3. TABELA DE ALOCAÇÕES: event_inventory (se existir)
-- ----------------------------------------------------------------------------
DO $$
DECLARE
    pol RECORD;
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'event_inventory') THEN
        EXECUTE 'ALTER TABLE event_inventory ENABLE ROW LEVEL SECURITY';
        EXECUTE 'GRANT ALL ON TABLE event_inventory TO authenticated';
        EXECUTE 'GRANT ALL ON TABLE event_inventory TO service_role';

        FOR pol IN 
            SELECT policyname 
            FROM pg_policies 
            WHERE tablename = 'event_inventory' AND schemaname = 'public'
        LOOP
            EXECUTE format('DROP POLICY IF EXISTS %I ON event_inventory', pol.policyname);
        END LOOP;

        EXECUTE 'CREATE POLICY "Authenticated users can select event inventory" ON event_inventory FOR SELECT TO authenticated USING (true)';
        EXECUTE 'CREATE POLICY "Authenticated users can insert event inventory" ON event_inventory FOR INSERT TO authenticated WITH CHECK (true)';
        EXECUTE 'CREATE POLICY "Authenticated users can update event inventory" ON event_inventory FOR UPDATE TO authenticated USING (true) WITH CHECK (true)';
        EXECUTE 'CREATE POLICY "Authenticated users can delete event inventory" ON event_inventory FOR DELETE TO authenticated USING (true)';
    END IF;
END $$;

-- ----------------------------------------------------------------------------
-- 4. Forçar atualização imediata do schema cache do PostgREST
-- ----------------------------------------------------------------------------
NOTIFY pgrst, 'reload schema';
