# Documento de Desenho de Sistema (SDD)
## Plataforma de Gestão - APMEE EB Cobre

### 1. Visão Geral e Âmbito
A aplicação servirá como hub central de informação e gestão (mini-ERP) para a Associação de Pais/Mães e Encarregados/as de Educação da Escola Básica do Cobre (APMEE EB Cobre). O público-alvo são os membros da direção (Presidente, Tesoureira, Gestão de Redes Sociais, Vogais). O objetivo é centralizar a comunicação, o controlo financeiro, o planeamento de eventos e a gestão de inventário numa única plataforma mobile-first.

### 2. Arquitetura e Stack Tecnológica
A arquitetura segue um modelo *Serverless* e *Single Page Application* (SPA), otimizada para deployment estático e alta disponibilidade.

*   **Acelerador de Desenvolvimento:** Antigravity
*   **Frontend:** React.js, estruturado como uma *Progressive Web App* (PWA) para permitir instalação nativa no ecrã principal dos smartphones e cache de recursos (suporte offline parcial).
*   **Backend & Base de Dados:** Supabase (PostgreSQL).
*   **Computação Serverless:** Supabase Edge Functions para orquestração de APIs de terceiros.
*   **Alojamento:** GitHub Pages.

### 3. Modelo de Autenticação e Autorização (RBAC)
*   **Autenticação:** Supabase Auth com provedor Google (Google OAuth).
*   **Controlo de Acessos (RBAC):**
    *   **Nível 1 (Acesso Total):** Permissões globais de leitura e escrita.
    *   **Nível 2 (Acesso Restrito):** Permissões globais de leitura/escrita, com exceção de módulos financeiros (Tesouraria, Quotas, Movimentos Financeiros de Eventos) que operam em modo estrito *Read-Only*.
*   **Segurança de Dados:** O isolamento financeiro será garantido na camada da base de dados através de *Row Level Security* (RLS) no PostgreSQL do Supabase, impedindo operações `INSERT`, `UPDATE` ou `DELETE` em tabelas financeiras por utilizadores de Nível 2.

### 4. User Interface (UI) e User Experience (UX)
A interface adotará um design limpo, assente num esquema de cores pastel (coral/salmão e azul-marinho/acinzentado) extraídas do logótipo da associação, com fundos off-white e elementos estruturais em preto. A navegação será baseada em cartões (cards) curvos.

*   **Navegação Principal (Bottom Navigation Bar):** Home, Calendário/Agenda, Email, Menu Hambúrguer.
*   **Ações Globais:** *Floating Action Button* (FAB) para "Adicionar Evento", posicionado de forma flutuante sobre a Home e Calendário.
*   **Dashboard (Home):**
    *   Sino de notificações no canto superior direito (contador de emails por ler).
    *   *Hero Section*: Evento mais próximo em destaque (Data e Hora).
    *   *Carrossel Horizontal*: Eventos futuros ordenados cronologicamente.
*   **Menu Hambúrguer (Ecrã Completo):**
    *   Barra de pesquisa/filtro rápido no topo.
    *   Grelha de 2 colunas com cartões pastel ilustrados para acesso aos módulos.
    *   Indicadores visuais (ex: ícone de olho) nos módulos financeiros para utilizadores com perfil Nível 2 (Read-Only).

### 5. Módulos Funcionais Core
*   **Gestão de Contactos:**
    *   Categorização via separadores (Tabs): Pais, Professores, Parceiros, Associados.
    *   Metadados dinâmicos (Pais: Nome do educando, Turma; Professores: Disciplina, Tipologia, Turma).
    *   Layout em lista com avatar. Ações rápidas alinhadas à direita (ícones para chamadas via *deep link* `tel:` e mensagens via `wa.me/`). Ação de Email acessível via gesto de *swipe* na linha do contacto.
*   **Tesouraria e Quotas:**
    *   Gestão de fluxo de caixa (*cashflow*), previsão financeira (*forecasts*) e analítica descritiva.
    *   Controlo de pagamento de quotas dos associados.
*   **Gestão de Eventos:**
    *   Ciclo de vida completo do evento: gestão de voluntários, distribuição de tarefas, compras/vendas associadas, controlo de verbas angariadas.
    *   Integração com calendário e disparo de alertas/alarmes de proximidade.
*   **Inventário:**
    *   Registo e controlo de ativos duráveis (máquinas, louças) e bens consumíveis (bens alimentares, descartáveis).
*   **Tarefas (To-Do):**
    *   Gestão global de tarefas da direção.

### 6. Integração Gmail API e Notificações
O consumo da caixa de correio partilhada exigirá um padrão de integração isolado para proteger limites de taxa e segredos de API.

*   **Arquitetura de Leitura:** O frontend React não fará *polling* direto à API da Google.
*   **Sincronização Assíncrona:** Uma Edge Function no Supabase verificará a *inbox* da conta Gmail partilhada a intervalos regulares (cron job). Processará as *threads* por ler ou que aguardam resposta da associação e atualizará um contador e uma tabela de cache no PostgreSQL.
*   **Consumo no Frontend:** O sino de notificações e o módulo de Email na app lerão os dados diretamente do PostgreSQL, garantindo carregamentos instantâneos e eliminando o risco de quota excedida na API do Gmail. O envio/resposta de emails será feito mediante chamadas diretas às Edge Functions a partir do frontend.

### 7. Estratégia de Deployment
*   O build do React será alojado no GitHub Pages.
*   **Routing SPA:** Para mitigar as limitações do GitHub Pages no manuseamento de rotas dinâmicas do *React Router* (e evitar erros 404 em *refreshes* ou *deep links*), será implementado um ficheiro `404.html` customizado na raiz do repositório. Este script intercetará o pedido e reencaminhará o path original de volta para o `index.html` para processamento do estado da rota do lado do cliente.
