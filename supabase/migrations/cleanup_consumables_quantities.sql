-- ============================================================================
-- PLATAFORMA APMEE EB COBRE - CORREÇÃO DE STOCKS E LOGS DE CONSUMÍVEIS
-- ============================================================================
-- 1. Identificar os 3 artigos e desativar duplicados (se existirem)
-- 2. Ajustar quantidades em inventory_items:
--    - Copos 250 cc: 150
--    - Paus espetadas: 200
--    - Pratos 22 cm: 100
-- 3. Limpar logs a mais em inventory_transactions, mantendo apenas 1 entrada
--    com a quantidade correta para cada artigo.
-- 4. Atualizar alocação ao evento em event_inventory para 150, 200 e 100 respetivamente,
--    ficando o material atribuído/cativo para o evento.
-- ============================================================================

DO $$
DECLARE
    v_copos_id UUID;
    v_espetadas_id UUID;
    v_pratos_id UUID;
BEGIN
    -- 1. Localizar o ID principal de cada artigo (o mais recente ativo)
    SELECT id INTO v_copos_id 
    FROM public.inventory_items 
    WHERE name ILIKE '%copo%250%' AND deleted_at IS NULL
    ORDER BY created_at DESC LIMIT 1;

    SELECT id INTO v_espetadas_id 
    FROM public.inventory_items 
    WHERE (name ILIKE '%espetada%' OR name ILIKE '%potada%') AND deleted_at IS NULL
    ORDER BY created_at DESC LIMIT 1;

    SELECT id INTO v_pratos_id 
    FROM public.inventory_items 
    WHERE name ILIKE '%prato%22%' AND deleted_at IS NULL
    ORDER BY created_at DESC LIMIT 1;

    -- ========================================================================
    -- ITEM 1: COPOS 250 CC -> 150
    -- ========================================================================
    IF v_copos_id IS NOT NULL THEN
        -- Marcar eventuais itens duplicados no catálogo como eliminados
        UPDATE public.inventory_items 
        SET deleted_at = now() 
        WHERE name ILIKE '%copo%250%' AND id <> v_copos_id AND deleted_at IS NULL;

        -- Definir stock total correto
        UPDATE public.inventory_items 
        SET quantity = 150, updated_at = now() 
        WHERE id = v_copos_id;

        -- Limpar logs de entrada a mais (manter apenas 1 log de entrada)
        DELETE FROM public.inventory_transactions 
        WHERE item_id = v_copos_id 
          AND type = 'in' 
          AND id NOT IN (
              SELECT id FROM public.inventory_transactions 
              WHERE item_id = v_copos_id AND type = 'in' 
              ORDER BY created_at DESC LIMIT 1
          );

        -- Ajustar o log restante para exatamente 150
        UPDATE public.inventory_transactions 
        SET quantity = 150 
        WHERE item_id = v_copos_id AND type = 'in';

        -- Atualizar alocação ao evento para 150 (ficando cativo)
        UPDATE public.event_inventory 
        SET quantity = 150 
        WHERE item_id = v_copos_id;

        RAISE NOTICE 'Copos 250 cc atualizado para 150 (stock e cativo).';
    ELSE
        RAISE NOTICE 'Aviso: Artigo Copos 250 cc não encontrado.';
    END IF;

    -- ========================================================================
    -- ITEM 2: PAUS ESPETADAS -> 200
    -- ========================================================================
    IF v_espetadas_id IS NOT NULL THEN
        -- Marcar eventuais itens duplicados no catálogo como eliminados
        UPDATE public.inventory_items 
        SET deleted_at = now() 
        WHERE (name ILIKE '%espetada%' OR name ILIKE '%potada%') AND id <> v_espetadas_id AND deleted_at IS NULL;

        -- Definir stock total correto
        UPDATE public.inventory_items 
        SET quantity = 200, updated_at = now() 
        WHERE id = v_espetadas_id;

        -- Limpar logs de entrada a mais
        DELETE FROM public.inventory_transactions 
        WHERE item_id = v_espetadas_id 
          AND type = 'in' 
          AND id NOT IN (
              SELECT id FROM public.inventory_transactions 
              WHERE item_id = v_espetadas_id AND type = 'in' 
              ORDER BY created_at DESC LIMIT 1
          );

        -- Ajustar o log restante para exatamente 200
        UPDATE public.inventory_transactions 
        SET quantity = 200 
        WHERE item_id = v_espetadas_id AND type = 'in';

        -- Atualizar alocação ao evento para 200 (ficando cativo)
        UPDATE public.event_inventory 
        SET quantity = 200 
        WHERE item_id = v_espetadas_id;

        RAISE NOTICE 'Paus espetadas atualizado para 200 (stock e cativo).';
    ELSE
        RAISE NOTICE 'Aviso: Artigo Paus espetadas não encontrado.';
    END IF;

    -- ========================================================================
    -- ITEM 3: PRATOS 22 CM -> 100
    -- ========================================================================
    IF v_pratos_id IS NOT NULL THEN
        -- Marcar eventuais itens duplicados no catálogo como eliminados
        UPDATE public.inventory_items 
        SET deleted_at = now() 
        WHERE name ILIKE '%prato%22%' AND id <> v_pratos_id AND deleted_at IS NULL;

        -- Definir stock total correto
        UPDATE public.inventory_items 
        SET quantity = 100, updated_at = now() 
        WHERE id = v_pratos_id;

        -- Limpar logs de entrada a mais
        DELETE FROM public.inventory_transactions 
        WHERE item_id = v_pratos_id 
          AND type = 'in' 
          AND id NOT IN (
              SELECT id FROM public.inventory_transactions 
              WHERE item_id = v_pratos_id AND type = 'in' 
              ORDER BY created_at DESC LIMIT 1
          );

        -- Ajustar o log restante para exatamente 100
        UPDATE public.inventory_transactions 
        SET quantity = 100 
        WHERE item_id = v_pratos_id AND type = 'in';

        -- Atualizar alocação ao evento para 100 (ficando cativo)
        UPDATE public.event_inventory 
        SET quantity = 100 
        WHERE item_id = v_pratos_id;

        RAISE NOTICE 'Pratos 22 cm atualizado para 100 (stock e cativo).';
    ELSE
        RAISE NOTICE 'Aviso: Artigo Pratos 22 cm não encontrado.';
    END IF;

END $$;

-- Verificação final dos dados atualizados
SELECT 
    i.id,
    i.name AS artigo,
    i.quantity AS stock_total,
    COALESCE(ei.quantity, 0) AS cativo_evento,
    (i.quantity - COALESCE(ei.quantity, 0)) AS disponivel,
    t.quantity AS log_transacao_entrada,
    t.notes AS notas_log,
    t.created_at AS data_log
FROM public.inventory_items i
LEFT JOIN public.event_inventory ei ON ei.item_id = i.id
LEFT JOIN public.inventory_transactions t ON t.item_id = i.id AND t.type = 'in'
WHERE (i.name ILIKE '%copo%250%' 
   OR i.name ILIKE '%espetada%' 
   OR i.name ILIKE '%potada%' 
   OR i.name ILIKE '%prato%22%')
  AND i.deleted_at IS NULL
ORDER BY i.name;
