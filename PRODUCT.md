# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users
Membros da Direção da APMEE (Associação de Pais e Mães da Escola Básica do Cobre, Cascais, Portugal): Presidente, Tesoureiro, Gestor Social, Vogais e Administradores. Utilização primária em contexto diário e em reuniões escolares através de telemóveis pessoais.

## Product Purpose
Plataforma centralizada de gestão operacional da associação de pais. O seu propósito é substituir registos dispersos (folhas de cálculo, papel, grupos de mensagens) por um sistema único, simples e fiável para gestão de eventos/reuniões (com atas e anexos), tesouraria com comprovativos, quotas com recibos, inventário com alertas de rotura e contactos escolares organizados por turma e disciplina.

## Positioning
App de gestão comunitária desenhada à medida da realidade de uma Associação de Pais do 1.º ciclo e pré-escolar em Portugal. Otimizada para operação rápida com uma mão em mobilidade, com autenticação restrita à direção e auditoria transparente de contas e quotas.

## Operating Context
Operação em mobilidade durante reuniões de direção na escola, feiras e festas escolares (magusto, arraiais, natal), compras de materiais em fornecedores e acompanhamento doméstico. Ambiente primário é o navegador móvel ou PWA instalada no smartphone.

## Capabilities and Constraints
- **Capacidades principais:**
  - Agenda e calendário unificado com Festas e Reuniões (com ata, objetivos e documentos anexos).
  - Gestão de tarefas operacionais da direção.
  - Tesouraria (movimentos de receita e despesa com anexo de faturas).
  - Quotas anuais dos associados (controlo de pagamento e anexo de recibos).
  - Inventário e stock escolar com alerta de stock mínimo.
  - Lista de contactos organizada por categoria, educando, turma e disciplina.
  - Controlo de acessos da direção (Google OAuth com RLS Supabase).
- **Restrições de UX e Arquitetura:**
  - Layout PWA centrado com largura máxima de 430px no desktop (formato smartphone).
  - Entrada imediata em modo de edição em todos os formulários (sem ecrã intermédio de leitura).
  - Bloqueio de alteração do tipo de evento na edição de eventos existentes.
  - Proibição de diálogos nativos do browser (alert/confirm) — uso de CustomDialog e UnsavedDialog.
  - Gestão do botão de retrocesso físico/virtual em Android (useHardwareBack).
  - Stack técnica: React 19, TypeScript, Tailwind CSS, Vite, Supabase (PostgreSQL + RLS + Storage), GitHub Pages.
  - Idioma exclusivo: Português de Portugal (pt-PT).

## Brand Commitments
- Tom acolhedor, transparente, colaborativo e institucional.
- Paleta visual acolhedora com tons quentes (warm/coral primário), azul para reuniões, âmbar para festas e fúcsia para alertas no sino de notificações.
- Tipografia limpa e de alta legibilidade em ecrãs móveis sob luz ambiente.

## Evidence on Hand
- Base de dados e RLS configurados em supabase/schema.sql e supabase/rls_policies.sql.
- Código de produção completo em src/.
- Ícones e assets em public/icons/.
- Documentação de arquitetura existente em SDD.md.

## Product Principles
1. **Fricção zero em mobilidade:** Todo o registo ou consulta deve ser rápido, com poucos toques e sem passos redundantes.
2. **Rigor e rastreabilidade:** Movimentos financeiros e quotas com suporte a comprovativos digitais.
3. **Robustez PWA:** Fluidez no arranque e em redes móveis instáveis.
4. **Prevenção de erros:** Validação inline, alerta de alterações por guardar e confirmações visuais customizadas.

## Accessibility & Inclusion
- Botões e zonas de toque dimensionados para uso táctil móvel (mínimo de 44x44px).
- Alto contraste de texto em conformidade com WCAG AA.
