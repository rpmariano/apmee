-- ============================================================================
-- SCRIPT DE LIMPEZA DE DADOS DE TESTE - PLATAFORMA APMEE EB COBRE
-- ============================================================================
-- Instruções:
-- 1. Abra o Supabase Dashboard (https://supabase.com/dashboard)
-- 2. Selecione o seu projeto APMEE
-- 3. Aceda ao "SQL Editor" no menu lateral
-- 4. Cole o conteúdo deste script e clique em "Run"
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. LIMPAR DADOS OPERACIONAIS E TRANSACIONAIS DE TESTE
-- ----------------------------------------------------------------------------
-- TRUNCATE com CASCADE esvazia as tabelas e remove automaticamente quaisquer
-- registos filhos/dependentes por chaves estrangeiras.

TRUNCATE TABLE 
    financial_movements,
    quotas,
    event_volunteers,
    event_tasks,
    tasks,
    events,
    inventory_items,
    contacts
CASCADE;

-- Limpar tabelas auxiliares de inventário se existirem no projeto
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'event_inventory') THEN
        EXECUTE 'TRUNCATE TABLE event_inventory CASCADE';
    END IF;
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'inventory_transactions') THEN
        EXECUTE 'TRUNCATE TABLE inventory_transactions CASCADE';
    END IF;
END $$;

-- ----------------------------------------------------------------------------
-- 2. LIMPAR UTILIZADORES DE TESTE (Mantendo apenas os 2 da Direção)
-- ----------------------------------------------------------------------------
-- Por defeito, mantém os 2 primeiros utilizadores registados na tabela.
-- Caso prefira filtrar explicitamente por email, descomente e adapte a linha abaixo:
-- DELETE FROM allowed_users WHERE email NOT IN ('rpmariano@gmail.com', 'segundo_email@gmail.com');

DELETE FROM allowed_users
WHERE id NOT IN (
    SELECT id 
    FROM allowed_users 
    ORDER BY created_at ASC 
    LIMIT 2
);

-- Assegurar que os 2 utilizadores mantidos estão ativos
UPDATE allowed_users
SET is_active = true;

-- (Opcional) Se tiver carregado faturas/recibos de teste no Storage do Supabase:
-- DELETE FROM storage.objects WHERE bucket_id = 'receipts';

-- ----------------------------------------------------------------------------
-- 3. CONSULTA DE CONFIRMAÇÃO (Verificar os utilizadores que permaneceram)
-- ----------------------------------------------------------------------------
SELECT id, email, display_name, role, permission_level, is_active, created_at
FROM allowed_users;
