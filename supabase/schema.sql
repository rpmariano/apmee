-- ============================================================================
-- PLATAFORMA APMEE EB COBRE - ESQUEMA DA BASE DE DADOS (SUPABASE / POSTGRESQL)
-- ============================================================================
-- Descrição: Esquema principal da base de dados para a plataforma de gestão
--            da Associação de Pais/Mães e Encarregados de Educação da EB do Cobre.
-- Tabelas: allowed_users, contacts, events, event_volunteers, event_tasks,
--          tasks, inventory_items, financial_movements, quotas.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 0. EXTENSÕES & FUNÇÕES UTILITÁRIAS
-- ----------------------------------------------------------------------------

-- Garantir extensão para funções criptográficas / UUIDs (caso necessário)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Função genérica para atualização automática da coluna updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION update_updated_at_column() IS 'Função de trigger para atualizar automaticamente a coluna updated_at com a data/hora atual em operações de UPDATE.';

-- ----------------------------------------------------------------------------
-- 1. TABELA: allowed_users (Utilizadores Autorizados / RBAC)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS allowed_users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('presidente', 'tesoureiro', 'gestor_social', 'vogal')),
    permission_level TEXT NOT NULL CHECK (permission_level IN ('superadmin', 'nivel_1', 'nivel_2')),
    display_name TEXT,
    avatar_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE allowed_users IS 'Utilizadores autorizados a aceder à plataforma via Google OAuth e respetivos níveis de permissão (RBAC).';
COMMENT ON COLUMN allowed_users.email IS 'Email da conta Google autorizada a efetuar login.';
COMMENT ON COLUMN allowed_users.role IS 'Função associativa na direção (presidente, tesoureiro, gestor_social, vogal).';
COMMENT ON COLUMN allowed_users.permission_level IS 'Nível de privilégios de acesso: superadmin, nivel_1 (total) ou nivel_2 (restrito a leitura nos módulos financeiros).';
COMMENT ON COLUMN allowed_users.is_active IS 'Indica se a conta está ativa e com autorização de acesso.';

DROP TRIGGER IF EXISTS trg_allowed_users_updated_at ON allowed_users;
CREATE TRIGGER trg_allowed_users_updated_at
    BEFORE UPDATE ON allowed_users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ----------------------------------------------------------------------------
-- 2. TABELA: contacts (Contactos Externos & Associados)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS contacts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    category TEXT NOT NULL CHECK (category IN ('pai', 'professor', 'parceiro', 'fornecedor', 'associado')),
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    whatsapp TEXT,
    avatar_url TEXT,
    metadata JSONB DEFAULT '{}'::jsonb, -- Campos dinâmicos: educando, turma, disciplina, etc.
    notes TEXT,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    deleted_at TIMESTAMPTZ
);

COMMENT ON TABLE contacts IS 'Directório de contactos externos da associação (pais, professores, parceiros, fornecedores e associados).';
COMMENT ON COLUMN contacts.category IS 'Categoria do contacto (pai, professor, parceiro, fornecedor, associado).';
COMMENT ON COLUMN contacts.metadata IS 'Dados flexíveis em formato JSONB (ex: nome do educando, turma, ano letivo, disciplina).';
COMMENT ON COLUMN contacts.deleted_at IS 'Data/hora de eliminação lógica (soft delete). Nulo se o registo estiver ativo.';

DROP TRIGGER IF EXISTS trg_contacts_updated_at ON contacts;
CREATE TRIGGER trg_contacts_updated_at
    BEFORE UPDATE ON contacts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ----------------------------------------------------------------------------
-- 3. TABELA: events (Eventos da Associação)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    location TEXT,
    start_date TIMESTAMPTZ NOT NULL,
    end_date TIMESTAMPTZ,
    is_all_day BOOLEAN DEFAULT false,
    status TEXT DEFAULT 'planned' CHECK (status IN ('planned', 'active', 'completed', 'cancelled')),
    event_type TEXT DEFAULT 'festa' CHECK (event_type IN ('festa', 'reuniao')),
    meeting_type TEXT,
    objectives TEXT,
    minutes TEXT,
    documents JSONB DEFAULT '[]'::jsonb,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_by_name TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    deleted_at TIMESTAMPTZ
);

COMMENT ON TABLE events IS 'Eventos, celebrações e iniciativas organizadas ou apoiadas pela associação escolar.';
COMMENT ON COLUMN events.status IS 'Estado atual do evento: planned (planeado), active (em curso), completed (concluído), cancelled (cancelado).';
COMMENT ON COLUMN events.event_type IS 'Tipo do evento: festa (celebrações/festas com materiais) ou reuniao (reuniões com ata e documentos).';
COMMENT ON COLUMN events.meeting_type IS 'Subtipo de reunião: assembleia, direcao, pais, outra.';
COMMENT ON COLUMN events.objectives IS 'Descrição dos objetivos ou ordem de trabalhos da reunião.';
COMMENT ON COLUMN events.minutes IS 'Ata da reunião, resumo das discussões e deliberações.';
COMMENT ON COLUMN events.documents IS 'Lista de documentos em JSONB: [{id, name, url, size, type, uploaded_at}].';
COMMENT ON COLUMN events.created_by_name IS 'Nome de exibição do utilizador que criou o evento.';
COMMENT ON COLUMN events.deleted_at IS 'Data/hora de eliminação lógica (soft delete).';

DROP TRIGGER IF EXISTS trg_events_updated_at ON events;
CREATE TRIGGER trg_events_updated_at
    BEFORE UPDATE ON events
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ----------------------------------------------------------------------------
-- 4. TABELA: event_volunteers (Voluntários de Eventos)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS event_volunteers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
    role TEXT,
    confirmed BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT uq_event_volunteers_event_contact UNIQUE (event_id, contact_id)
);

COMMENT ON TABLE event_volunteers IS 'Registo e alocação de voluntários a eventos específicos da associação.';
COMMENT ON COLUMN event_volunteers.role IS 'Função atribuída ao voluntário no evento (ex: apoio ao bar, receção, montagem).';
COMMENT ON COLUMN event_volunteers.confirmed IS 'Indica se a disponibilidade e presença do voluntário foi confirmada.';

DROP TRIGGER IF EXISTS trg_event_volunteers_updated_at ON event_volunteers;
CREATE TRIGGER trg_event_volunteers_updated_at
    BEFORE UPDATE ON event_volunteers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ----------------------------------------------------------------------------
-- 5. TABELA: event_tasks (Tarefas Operacionais de Eventos)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS event_tasks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    assigned_to UUID REFERENCES contacts(id) ON DELETE SET NULL,
    is_done BOOLEAN DEFAULT false,
    due_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE event_tasks IS 'Tarefas e afazeres operacionais circunscritos à preparação e execução de um evento.';
COMMENT ON COLUMN event_tasks.assigned_to IS 'Contacto (voluntário ou encarregado de educação) responsável pela execução da tarefa.';
COMMENT ON COLUMN event_tasks.is_done IS 'Estado de conclusão da tarefa do evento.';

DROP TRIGGER IF EXISTS trg_event_tasks_updated_at ON event_tasks;
CREATE TRIGGER trg_event_tasks_updated_at
    BEFORE UPDATE ON event_tasks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ----------------------------------------------------------------------------
-- 6. TABELA: tasks (Quadro Global de Tarefas da Direção)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tasks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    assigned_to UUID REFERENCES allowed_users(id) ON DELETE SET NULL,
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    status TEXT DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'done')),
    due_date TIMESTAMPTZ,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    deleted_at TIMESTAMPTZ
);

COMMENT ON TABLE tasks IS 'Gestão global de tarefas internas (to-do list) para membros da direção da associação.';
COMMENT ON COLUMN tasks.assigned_to IS 'Membro da direção responsável pela tarefa (referência a allowed_users).';
COMMENT ON COLUMN tasks.priority IS 'Prioridade da tarefa: low, medium, high ou urgent.';
COMMENT ON COLUMN tasks.status IS 'Estado da tarefa: todo (a fazer), in_progress (em curso) ou done (concluída).';
COMMENT ON COLUMN tasks.deleted_at IS 'Data/hora de eliminação lógica (soft delete).';

DROP TRIGGER IF EXISTS trg_tasks_updated_at ON tasks;
CREATE TRIGGER trg_tasks_updated_at
    BEFORE UPDATE ON tasks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ----------------------------------------------------------------------------
-- 7. TABELA: inventory_items (Gestão de Inventário e Stocks)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS inventory_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('consumivel', 'alimento', 'mobilizado', 'duravel')),
    quantity INTEGER DEFAULT 0,
    unit TEXT DEFAULT 'un',
    location TEXT,
    min_stock INTEGER DEFAULT 0,
    notes TEXT,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    deleted_at TIMESTAMPTZ
);

COMMENT ON TABLE inventory_items IS 'Inventário de materiais e património da associação (bens duráveis e consumíveis).';
COMMENT ON COLUMN inventory_items.category IS 'Classificação do bem: duravel (ex: equipamentos, louças) ou consumivel (ex: guardanapos, copos).';
COMMENT ON COLUMN inventory_items.min_stock IS 'Stock mínimo de segurança para despoletar alertas de reposição.';
COMMENT ON COLUMN inventory_items.deleted_at IS 'Data/hora de eliminação lógica (soft delete).';

DROP TRIGGER IF EXISTS trg_inventory_items_updated_at ON inventory_items;
CREATE TRIGGER trg_inventory_items_updated_at
    BEFORE UPDATE ON inventory_items
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ----------------------------------------------------------------------------
-- 8. TABELA: financial_movements (Movimentos de Tesouraria)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS financial_movements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
    amount NUMERIC(10,2) NOT NULL,
    description TEXT NOT NULL,
    category TEXT,
    event_id UUID REFERENCES events(id) ON DELETE SET NULL,
    receipt_url TEXT,
    date TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    deleted_at TIMESTAMPTZ
);

COMMENT ON TABLE financial_movements IS 'Fluxos de caixa e registos de tesouraria (receitas e despesas da associação).';
COMMENT ON COLUMN financial_movements.type IS 'Tipo de fluxo: income (receita) ou expense (despesa).';
COMMENT ON COLUMN financial_movements.amount IS 'Valor monetário do movimento com duas casas decimais.';
COMMENT ON COLUMN financial_movements.event_id IS 'Associação opcional a um evento específico gerador da receita/despesa.';
COMMENT ON COLUMN financial_movements.receipt_url IS 'Ligação ou caminho para comprovativo digital/recibo.';
COMMENT ON COLUMN financial_movements.deleted_at IS 'Data/hora de eliminação lógica (soft delete).';

DROP TRIGGER IF EXISTS trg_financial_movements_updated_at ON financial_movements;
CREATE TRIGGER trg_financial_movements_updated_at
    BEFORE UPDATE ON financial_movements
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ----------------------------------------------------------------------------
-- 9. TABELA: quotas (Controlo de Quotas de Associados)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS quotas (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
    year INTEGER NOT NULL,
    amount NUMERIC(10,2) NOT NULL,
    paid BOOLEAN DEFAULT false,
    paid_date TIMESTAMPTZ,
    payment_method TEXT,
    receipt_url TEXT,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    deleted_at TIMESTAMPTZ
);

COMMENT ON TABLE quotas IS 'Registo e controlo de quotas anuais dos membros associados da APMEE.';
COMMENT ON COLUMN quotas.contact_id IS 'Contacto associado ao qual se refere a quota anual.';
COMMENT ON COLUMN quotas.year IS 'Ano letivo/civil a que respeita a quota.';
COMMENT ON COLUMN quotas.paid IS 'Indica se a quota já se encontra liquidada.';
COMMENT ON COLUMN quotas.deleted_at IS 'Data/hora de eliminação lógica (soft delete).';

DROP TRIGGER IF EXISTS trg_quotas_updated_at ON quotas;
CREATE TRIGGER trg_quotas_updated_at
    BEFORE UPDATE ON quotas
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ----------------------------------------------------------------------------
-- 10. ÍNDICES DE PERFORMANCE (COLUNAS FREQUENTEMENTE CONSULTADAS)
-- ----------------------------------------------------------------------------

-- Índices por categoria
CREATE INDEX IF NOT EXISTS idx_contacts_category ON contacts(category);
CREATE INDEX IF NOT EXISTS idx_inventory_items_category ON inventory_items(category);
CREATE INDEX IF NOT EXISTS idx_financial_movements_category ON financial_movements(category);

-- Índices por estado / prioridade
CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority);

-- Índices por email
CREATE INDEX IF NOT EXISTS idx_allowed_users_email ON allowed_users(email);
CREATE INDEX IF NOT EXISTS idx_contacts_email ON contacts(email);

-- Índices por chaves estrangeiras de eventos
CREATE INDEX IF NOT EXISTS idx_event_volunteers_event_id ON event_volunteers(event_id);
CREATE INDEX IF NOT EXISTS idx_event_tasks_event_id ON event_tasks(event_id);
CREATE INDEX IF NOT EXISTS idx_financial_movements_event_id ON financial_movements(event_id);

-- Índices por chaves estrangeiras de contactos
CREATE INDEX IF NOT EXISTS idx_event_volunteers_contact_id ON event_volunteers(contact_id);
CREATE INDEX IF NOT EXISTS idx_event_tasks_assigned_to ON event_tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_quotas_contact_id ON quotas(contact_id);

-- Índices por utilizador atribuído / criador
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_created_by ON tasks(created_by);
CREATE INDEX IF NOT EXISTS idx_contacts_created_by ON contacts(created_by);
CREATE INDEX IF NOT EXISTS idx_financial_movements_created_by ON financial_movements(created_by);

-- Índices temporais e de quotas
CREATE INDEX IF NOT EXISTS idx_events_start_date ON events(start_date);
CREATE INDEX IF NOT EXISTS idx_financial_movements_date ON financial_movements(date);
CREATE INDEX IF NOT EXISTS idx_quotas_year ON quotas(year);
CREATE INDEX IF NOT EXISTS idx_quotas_paid ON quotas(paid);

-- Índices parciais para otimização de soft delete (registos ativos)
CREATE INDEX IF NOT EXISTS idx_contacts_active ON contacts(id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_events_active ON events(id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_tasks_active ON tasks(id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_inventory_items_active ON inventory_items(id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_financial_movements_active ON financial_movements(id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_quotas_active ON quotas(id) WHERE deleted_at IS NULL;

-- ----------------------------------------------------------------------------
-- 11. SEED DATA (SUPERADMIN INICIAL)
-- ----------------------------------------------------------------------------
INSERT INTO allowed_users (email, role, permission_level, display_name, is_active)
VALUES (
    'rpmariano@gmail.com',
    'presidente',
    'superadmin',
    'Rui Mariano',
    true
)
ON CONFLICT (email) DO UPDATE
SET role = EXCLUDED.role,
    permission_level = EXCLUDED.permission_level,
    display_name = COALESCE(allowed_users.display_name, EXCLUDED.display_name),
    is_active = true,
    updated_at = now();
