---
name: APMEE EB Cobre
description: Sistema de design móvel e comunitário da Associação de Pais e Mães da Escola Básica do Cobre
colors:
  primary: "#e06b4d"
  primary-light: "#f89a80"
  primary-dark: "#ab3d28"
  primary-subtle: "#fef2ee"
  secondary: "#424d59"
  secondary-dark: "#2d3748"
  warm-bg: "#faf7f0"
  warm-card: "#f3ede0"
  background: "#fafaf8"
  surface: "#ffffff"
  surface-muted: "#f5f5f3"
  foreground: "#1a1a1a"
  muted: "#6b7280"
  accent-meeting: "#2563eb"
  accent-party: "#f59e0b"
  accent-bell: "#d946ef"
  success: "#16a34a"
  danger: "#dc2626"
typography:
  display:
    fontFamily: "'Inter', system-ui, -apple-system, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 700
    lineHeight: 1.2
  headline:
    fontFamily: "'Inter', system-ui, -apple-system, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 700
    lineHeight: 1.3
  title:
    fontFamily: "'Inter', system-ui, -apple-system, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 600
    lineHeight: 1.4
  body:
    fontFamily: "'Inter', system-ui, -apple-system, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "'Inter', system-ui, -apple-system, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 500
    letterSpacing: "0.025em"
rounded:
  card: "16px"
  button: "12px"
  input: "12px"
  pill: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.surface}"
    rounded: "{rounded.button}"
    padding: "12px 16px"
  button-primary-hover:
    backgroundColor: "{colors.primary-dark}"
  card-surface:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.card}"
    padding: "16px"
  input-field:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.input}"
    padding: "8px 12px"
---

# Design System: APMEE EB Cobre

## Overview

**Creative North Star: "A Aldeia Escolar Acolhedora"**

O sistema de design da APMEE inspira-se no calor, proximidade e vitalidade de uma comunidade escolar onde todos se conhecem e colaboram. Afasta-se da frieza corporativa e do SaaS genérico azul/cinza em favor de uma estética térrea, calorosa e tátil, enraizada na identidade visual da Escola Básica do Cobre em Cascais.

A interface opera em modo estritamente móvel e tátil, desenhada para ser manuseada com agilidade por encarregados de educação entre aulas, reuniões e eventos no pátio. Toda a experiência transmite confiança institucional sem perder a doçura e a informalidade acolhedora de uma comunidade de pais e educadores.

**Key Characteristics:**
- **Calor Terroso e Acolhedor:** Tons de terracota/coral e areia quente que abraçam o utilizador.
- **Tátil e Confiante:** Cantos suaves e generosos (16px em cartões, 12px em botões), áreas de toque confortáveis e feedback tátil/visual imediato.
- **Cores Semânticas Funcionais:** Azul real para Reuniões, âmbar para Festas escolares e fúcsia pulsante para alertas de notificação.
- **Fricção Mínima:** Todos os ecrãs e cartões entram diretamente em modo de edição e evitam diálogos e etapas desnecessárias.

## Colors

A paleta combina tons de terracota/coral e areia quente da escola com cores semânticas vibrantes para diferenciação funcional instantânea.

### Primary
- **Terracota Coral Primário** (#e06b4d): Usado no logótipo, cabeçalhos de destaque, botões principais de ação e estados ativos de navegação.
- **Coral Intenso Hover** (#ab3d28): Estados de pressão e foco do botão primário.
- **Coral Névoa** (#fef2ee): Fundos subtis de destaque, badges e seleções primárias ativas.

### Secondary
- **Ardósia Escura** (#424d59): Cor de contraste secundário para textos auxiliares de alta hierarquia e elementos estruturais.
- **Antracite Profundo** (#2d3748): Títulos principais e elementos que exigem peso formal.

### Neutral
- **Fundo Tela PWA** (#fafaf8): Fundo neutro limpo para a área de trabalho da aplicação.
- **Superfície Branca** (#ffffff): Fundo dos cartões de dados, campos de formulário e gavetas modais.
- **Bege Quente Moldura** (#faf7f0): Fundo envolvente do ecrã de desktop e barras de controlo secundárias.
- **Bege Borda Suave** (#f3ede0): Divisórias, bordas de cartões e inputs inativos.
- **Texto Principal** (#1a1a1a): Leitura de alto contraste para corpos de texto e títulos.
- **Texto Silenciado** (#6b7280): Rótulos, datas, metadados e legendas secundárias.

### Semantic Accents
- **Azul Reunião** (#2563eb): Reservado exclusivamente para eventos do tipo Reunião, suas atas e badges na agenda.
- **Âmbar Festa** (#f59e0b): Reservado exclusivamente para celebrações, festas escolares e convívios comunitários.
- **Fúcsia Notificação** (#d946ef): Reservado exclusivamente para o sino de notificações dinâmico e ondas de atenção.
- **Verde Quota / Receita** (#16a34a): Confirmação de quotas pagas e movimentos de tesouraria positivos.
- **Vermelho Despesa / Alerta** (#dc2626): Movimentos de débito, faltas de stock e ações destrutivas.

### Named Rules
**The Event Color Sovereignty Rule.** Reuniões são sempre azuis (#2563eb) e Festas são sempre âmbar (#f59e0b). Nenhuma outra entidade na aplicação pode adotar estas duas cores como destaque primário de cartão.
**The Warm Base Rule.** O fundo da aplicação e das superfícies secundárias nunca usa cinzento frio ou azulado; utiliza sempre a gama bege acolhedora (#fafaf8 / #faf7f0).

## Typography

**Display Font:** 'Inter', system-ui, -apple-system, sans-serif
**Body Font:** 'Inter', system-ui, -apple-system, sans-serif

**Character:** Tipografia de clareza humanista e geométrica equilibrada, otimizada para ecrãs OLED móveis e leitura rápida sob sol no pátio escolar.

### Hierarchy
- **Display** (Bold 700, 1.25rem / 20px, line-height 1.2): Títulos de cabeçalho global e resumos principais de ecrã.
- **Headline** (Bold 700, 1.125rem / 18px, line-height 1.3): Títulos de cartões de eventos, nomes de associados e modais.
- **Title** (Semibold 600, 0.875rem / 14px, line-height 1.4): Rótulos de formulário, nomes de campos e subtítulos de secções.
- **Body** (Regular 400, 0.875rem / 14px, line-height 1.5): Textos descritivos, descrições de tarefas e notas.
- **Label** (Medium 500, 0.75rem / 12px, tracking 0.025em): Metadados, datas, contadores de itens e badges de estado.

### Named Rules
**The Immediate Legibility Rule.** Nenhum texto com papel informativo ou interativo pode descer abaixo dos 12px. Toda a legenda auxiliar tem contraste mínimo de 4.5:1 sobre a sua superfície.

## Layout

A aplicação adota um modelo estritamente centrado no utilizador móvel:
- **Casca de Telemóvel (Mobile Shell):** No desktop, a aplicação é apresentada dentro de uma coluna centrada de largura máxima fixa a 430px (dimensão de referência para smartphones modernos), envolvida por um fundo acolhedor (#faf7f0). Em dispositivos móveis reais, ocupa 100% da largura do viewport.
- **Barra de Navegação Inferior (Bottom Navigation):** Fixada na base com 64px de altura (h-16), com 5 ícones tácteis principais (Painel, Agenda, Tarefas, Tesouraria, Mais).
- **Cabeçalho Fixo Superior (Top App Bar):** Logótipo da associação à esquerda, título contextual ao centro e sino de notificações com badge/onda à direita.
- **Ritmo Espacial:** Escala de espaçamentos baseada em múltiplos de 4px e 8px (padding padrão de cartões: 16px; espaçamento entre elementos de formulário: 16px; gap entre linhas: 6px a 8px).

## Elevation & Depth

O sistema utiliza um modelo híbrido de **camadas tonais com relevo de papel iluminado**:
- Superfícies em repouso possuem bordas subtis (#f3ede0) e sombras difusas suaves.
- Um brilho interno quase imperceptível (`inset 0 1px 0 0 rgba(255, 255, 255, 0.9)`) confere aos cartões a sensação de papel texturado e ligeiramente elevado.

### Shadow Vocabulary
- **Nível 1 (Cartões em repouso):** `0 4px 15px -2px rgba(66, 77, 89, 0.08), 0 1px 3px -1px rgba(66, 77, 89, 0.04), inset 0 1px 0 0 rgba(255, 255, 255, 0.9)`
- **Nível 2 (Elementos elevados e modais):** `0 10px 25px -4px rgba(66, 77, 89, 0.12), 0 4px 10px -2px rgba(66, 77, 89, 0.08), inset 0 1px 0 0 rgba(255, 255, 255, 0.9)`
- **Nível 3 (Gavetas de formulário / Drawer):** `0 20px 40px -5px rgba(66, 77, 89, 0.18), 0 8px 15px -3px rgba(66, 77, 89, 0.12)`

### Named Rules
**The Tonal Depth Rule.** A hierarquia entre camadas é resolvida primeiro pela cor da superfície (warm-100 para o fundo, surface #ffffff para o cartão) e apenas complementada por sombras difusas de tom ardósia, nunca preto puro.

## Shapes

- **Cartões Principais:** Raio de 16px (`--radius-card: 1rem`), criando uma silhueta amigável e táctil.
- **Botões e Controlos:** Raio de 12px (`--radius-button: 0.75rem`), transmitindo estabilidade e clique firme.
- **Pills e Selos:** Raio total de 9999px (badges circulares ou ovais para contadores, tipos de evento e filtros).
- **Círculo das Iniciais (Selo da Agenda):** Um círculo com contorno de 2px e fundo transparente (`bg-transparent`), exibindo as iniciais do utilizador criador sem preenchimento interior nem palavra explicativa.

## Components

### Buttons
- **Botão Primário de Ação:** Fundo terracota coral (#e06b4d), texto branco semibold, raio de 12px, padding vertical de 12px. Efeito de toque com `active:scale-95` e transição rápida.
- **Botão Secundário / Descartar:** Fundo bege claro (#faf7f0), texto ardósia (#424d59), borda subtil (#f3ede0).

### Cards
- **Cartão de Evento / Tarefa:** Superfície branca com borda suave de 1px (#f3ede0), raio de 16px e padding de 16px. Ao toque, abre imediatamente a edição completa do registo.
- **Cartão de Resumo Financeiro:** Gradiente suave ou tonalidade quente acolhedora com tipografia numérica em grande destaque.

### Inputs e Formulários
- **Campos de Texto e Dropdowns:** Superfície branca (#ffffff), borda suave (#f3ede0), raio de 12px, padding de 8px 12px. Foco com anel subtil na cor primária (#e06b4d).
- **Modo de Edição Imediato:** Todos os formulários abrem diretamente em modo editável com o botão de guardar no rodapé, sem exigir toque preliminar no botão de editar.

### Notification Bell
- Ícone de sino animado no cabeçalho global. Quando existem notificações, o sino e badge adotam a cor Fúcsia vibrante (#d946ef) e emitem uma onda concêntrica expansiva com transição de escala e opacidade.

## Do's and Don'ts

### Do:
- **Do** abrir qualquer registo e formulário diretamente em modo de edição imediata.
- **Do** usar azul (#2563eb) para Reuniões e âmbar (#f59e0b) para Festas de forma consistente em calendários, cartões e filtros.
- **Do** desenhar todas as telas a pensar no formato de 430px de largura e com áreas de toque de pelo menos 44px de altura.
- **Do** usar os componentes de diálogo customizados (`CustomDialog` e `UnsavedDialog`) para quaisquer alertas ou confirmações.
- **Do** manter o selo de agenda/cartão como um círculo transparente apenas com contorno e iniciais do criador.

### Don't:
- **Don't** invocar `window.alert()` ou `window.confirm()` nativos do navegador em circunstância alguma.
- **Don't** aninhar cartões dentro de cartões gerando caixas dentro de caixas cinzentas.
- **Don't** usar cinzentos frios azulados para fundos; manter sempre a paleta bege quente (#fafaf8 / #faf7f0).
- **Don't** permitir que um utilizador altere o tipo de evento (Festa vs. Reunião) durante a edição de um evento já criado.
- **Don't** colocar menus de três pontos escondidos em cartões quando um toque direto no cartão abre a edição completa.
