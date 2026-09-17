# APMEE EB Cobre — Plataforma de Gestão

Plataforma de gestão integrada (PWA - Progressive Web App) desenvolvida para a **Associação de Pais e Encarregados de Educação da Escola Básica do Cobre (APMEE EB Cobre)**.

A aplicação foi concebida com arquitetura mobile-first para proporcionar uma utilização fluida e acessível tanto no telemóvel dos encarregados de educação e órgãos sociais como no computador.

---

## 🚀 Tecnologias

- **Frontend:** [React 19](https://react.dev/), [TypeScript](https://www.typescriptlang.org/), [Vite](https://vitejs.dev/)
- **Estilos & UI:** [Tailwind CSS v4](https://tailwindcss.com/), [Lucide React](https://lucide.dev/) (ícones)
- **Estado do Servidor & Cache:** [TanStack Query v5](https://tanstack.com/query)
- **Roteamento:** [React Router v7](https://reactrouter.com/)
- **Manipulação de Datas:** [Date-fns v4](https://date-fns.org/) (localização pt-PT)
- **Backend & Autenticação:** [Supabase](https://supabase.com/) (PostgreSQL, Auth com Google OAuth/Magic Link, RLS, Storage)
- **PWA & Offline:** `vite-plugin-pwa`, service worker configurado e manifesto web
- **Hospedagem & CI/CD:** [GitHub Pages](https://pages.github.com/) com deploy automático via GitHub Actions

---

## 📱 Princípios de Design & UX

- **Contentor Centrado Mobile-First:** No desktop, a aplicação apresenta uma moldura limpa centrada com largura máxima de 430px (dimensão de ecrã móvel moderno).
- **Paleta Pastel Suave:** Tons quentes e acolhedores alinhados com o ambiente escolar e infantil (`warm-50` a `warm-400`, `primary-400`, detalhes verde bosque `#2E7D32`).
- **Navegação Direta sem Menus Escondidos:** Todos os cartões (contactos, tarefas, eventos, movimentos, quotas) abrem diretamente com um toque/clique (sem menus de 3 pontos).
- **Zero Popups Nativos:** A aplicação não utiliza `alert()` nem `confirm()` do navegador. Todas as confirmações, erros e avisos são apresentados através de componentes modais dedicados (`CustomDialog`).
- **Suporte ao Botão Físico de Retroceder:** Em dispositivos móveis Android/PWA, o gesto ou botão de retroceder fecha modais abertos e previne perda acidental de dados com diálogo de confirmação (`UnsavedDialog`).

---

## 📦 Módulos Funcionais

### 1. Agenda & Eventos (Ecrã Unificado)
- **Calendário Interativo:** Grelha mensal com navegação, atalho "Hoje", destaque do dia selecionado e pontos coloridos por estado.
- **Filtros Dinâmicos:** Pílulas com contadores em tempo real para `Dia Selecionado`, `Próximos`, `Terminados` e `Todos`.
- **Filtro Rápido de Tipos:** Alternância imediata entre `Todos`, `🎉 Festas` e `📋 Reuniões`.
- **Dois Tipos de Eventos:**
  - **Festas & Celebrações:** Título, localização, descrição, datas, estado e gestor de materiais/inventário (`EventInventoryManager`) com controlo de provisões e avisos de rotura.
  - **Reuniões:** Subtipo (Assembleia Geral, Direção, Reunião com Pais / EE, Outra), **Objetivos / Ordem de Trabalhos**, **Ata da Reunião** e **Gestor de Documentos/Anexos** (`EventDocumentsManager`) para upload de ficheiros e inclusão de links na cloud (ex: Google Drive).

### 2. Contactos
- Diretório completo de Encarregados de Educação, Professores, Parceiros, Fornecedores e Associados.
- Metadados dinâmicos (Nome do educando, turma, ano letivo, disciplina lecionada).
- Botões de ação rápida direta: Telefonar, WhatsApp e Email.

### 3. Tarefas
- Registo de tarefas com prioridades (Baixa, Média, Alta, Urgente), datas limite e responsável atribuído.
- Filtros por estado (*Por Fazer*, *Em Curso*, *Concluídas*) e cartões com abertura rápida.

### 4. Inventário
- Controlo de património escolar dividido em consumíveis, alimentos e bens mobilizados.
- Registo de localização física, stock mínimo e botões de ajuste rápido (+ / -).
- Histórico de entradas e saídas de stock.
- Alertas automáticos no cabeçalho sobre artigos com stock baixo.

### 5. Tesouraria & Saldo
- Registo de entradas (receitas) e saídas (despesas) com categorização e upload de faturas/comprovativos.
- Cálculo e visualização imediata do saldo total em caixa.
- Permissões restritas (somente utilizadores autorizados podem criar ou editar movimentos).

### 6. Quotas de Associados
- Gestão anual do pagamento de quotas dos membros da associação.
- Estado de pagamento (*Pago* / *Pendente*), data de pagamento, método e upload de recibo.

### 7. Direção & Gestão de Acessos (Superadmin)
- Configuração dos utilizadores autorizados a aceder à plataforma via Google OAuth.
- Atribuição de papéis (Presidente, Tesoureiro, Gestor Social, Vogal) e níveis de permissão (*Superadmin*, *Nível 1*, *Nível 2*).

---

## 🛠️ Guia de Configuração do Supabase

### 1. Criar Projeto no Supabase
1. Crie um projeto em [supabase.com](https://supabase.com/).
2. Obtenha o **Project URL** e a chave **anon key** em *Settings > API*.

### 2. Configurar Variáveis de Ambiente
Crie um ficheiro `.env` na raiz do projeto (baseado em `.env.example`):
```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-anon-key-aqui
```

### 3. Executar os Scripts SQL (SQL Editor do Supabase)
Execute os scripts pela seguinte ordem:

1. **Schema Principal:**  
   Execute o conteúdo do ficheiro [`supabase/schema.sql`](supabase/schema.sql).  
   *Cria todas as tabelas (`allowed_users`, `contacts`, `events`, `event_volunteers`, `tasks`, `inventory_items`, `financial_movements`, `quotas`), índices, triggers e seed inicial do superadmin.*

2. **Segurança & Políticas RLS:**  
   Execute o conteúdo do ficheiro [`supabase/rls_policies.sql`](supabase/rls_policies.sql).  
   *Cria a função `get_user_permission_level()` e ativa Row Level Security com regras de RBAC em todas as tabelas.*

3. **Migração de Tipos de Evento:**  
   Execute o conteúdo de [`supabase/migrations/add_event_types_and_meeting_fields.sql`](supabase/migrations/add_event_types_and_meeting_fields.sql).  
   *Adiciona suporte aos tipos Festas e Reuniões, objetivos, atas e documentos anexos.*

### 4. Configurar o Storage Bucket
1. No painel do Supabase, aceda a **Storage**.
2. Crie um bucket público chamado `receipts`.
3. Defina as políticas do bucket para permitir upload e visualização aos utilizadores autenticados.

### 5. Configurar o Google OAuth
1. Em **Authentication > Providers**, ative o **Google**.
2. Configure o Client ID e Client Secret da consola Google Cloud.
3. Certifique-se de que o URL de callback do Supabase está adicionado nas URIs de redirecionamento autorizadas da Google.

---

## 💻 Instalação & Execução Local

```bash
# 1. Instalar dependências
npm install

# 2. Iniciar servidor de desenvolvimento
npm run dev

# 3. Compilar para produção
npm run build

# 4. Executar linter
npm run lint

# 5. Pré-visualizar build local
npm run preview
```

---

## 🚢 Deploy Automático

O projeto está configurado para deploy contínuo no **GitHub Pages** via GitHub Actions ([`.github/workflows/deploy.yml`](.github/workflows/deploy.yml)):
- Sempre que é feito um `git push` para a branch `main`, o workflow executa os testes de compilação e publica a aplicação estática automaticamente.
