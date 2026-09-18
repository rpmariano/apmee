---
target_identity: "file:C:\\Users\\rpmar\\APMEE\\src\\pages\\quotas.tsx"
target_fingerprint: "sha256:298e5b531ddbcb52cf84c07de4bd031aaa3142780f3b9a9525e33162e1b947a2"
target_path: "C:\\Users\\rpmar\\APMEE\\src\\pages\\quotas.tsx"
timestamp: 2026-09-18T23-54-00Z
slug: src-pages-quotas-tsx
---
# Relatório de Avaliação de Design: Quotas da APMEE
**Alvo:** `src/pages/quotas.tsx` e `src/features/quotas/` (`quota-form.tsx`, `quota-card.tsx`, `quota-list.tsx`)  
**Contexto:** APMEE — Associação de Pais e Mães da Escola Básica do Cobre (PWA mobile-first 430px)

---

### Design Health Score

| # | Heurística | Pontuação | Problema Principal Identificado |
|---|-----------|:---------:|---------------------------------|
| 1 | Visibilidade do Estado do Sistema | **2.5 / 4** | Falta um painel de resumo macro na listagem (total angariado, quotas pagas vs pendentes). |
| 2 | Correspondência com o Mundo Real | **2.5 / 4** | Cartão omite educandos e turma, desumanizando a relação comunitária escolar. |
| 3 | Controlo e Liberdade do Utilizador | **2.5 / 4** | O associado fica travado na edição da quota se houver engano de seleção inicial. |
| 4 | Consistência e Padrões | **2.0 / 4** | Abas em cinzento carvão (`secondary-900`) e FAB em `primary-400` desalinham do terracota (#e06b4d). |
| 5 | Prevenção de Erros | **3.5 / 4** | Excelente prevenção: guarda anti-duplo clique, dropdown filtrado e sincronização atómica com tesouraria. |
| 6 | Reconhecimento em Vez de Recordação | **2.0 / 4** | Sem pesquisa rápida por associado ou educando na listagem com dezenas de pais. |
| 7 | Flexibilidade e Eficiência de Uso | **2.0 / 4** | Falta filtro por ano letivo no ecrã principal e atalhos rápidos para comprovativos. |
| 8 | Estética e Design Minimalista | **3.0 / 4** | Cartões limpos com revelação progressiva dos campos de pagamento e comprovativo. |
| 9 | Reconhecimento e Recuperação de Erros | **3.0 / 4** | Feedback claro com `CustomDialog` e tratamento de erros do Supabase Storage. |
| 10 | Ajuda e Documentação | **2.5 / 4** | Boa microcópia explicativa sobre o destino dos fundos bancários/caixa. |
| **Total** | | **25.5 / 40** | **Aceitável (63.8%)** |

---

### Design Specificity Verdict

A interface situa-se num **estágio híbrido incompleto**:
- **O que é autoral:** A regra do ano letivo de setembro a julho (`26/27`), a anuidade de 15€, a separação contabilística imediata entre *Banco* e *Caixa/Numerário*, e o botão de criação rápida `+ Novo Associado` resolvem com rigor a realidade associativa.
- **Onde resvala para SaaS utilitário genérico:** O acabamento visual carece do calor da comunidade escolar:
  - O avatar nos cartões é um ícone vetorial cinzento genérico (`User`), em vez do padrão definido no `DESIGN.md` (*Círculo de iniciais com contorno de 2px e fundo transparente*).
  - O nome do educando e a turma (`c.metadata?.educando`) são descartados no cartão, embora estejam no banco de dados e sejam a forma como os pais se conhecem no pátio.
  - As abas ativas usam cinzento empresarial frio (`bg-secondary-900`) em vez da identidade terracota acolhedora (#e06b4d).
  - O estado vazio apresenta uma carteira minimalista com texto burocrático (*"Sem Quotas"*).

**Varredura Determinística (Detector AST):**
- Alvo (`src/pages/quotas.tsx` e `src/features/quotas/`): **0 violações detetadas**. Total conformidade com a *Immediate Legibility Rule* (mínimo de 12px) e tokens de raio (`--radius-card`, `--radius-button`).
- Base circundante (`src/`): 13 avisos de tamanho de fonte (`text-[10px]` e `text-[11px]`) em contactos, inventário e tesouraria.

**Sobreposições Visuais de Navegador:**
- Suprimidas por se tratar de ambiente CLI sem navegador gráfico/canvas acoplado.

---

### Impressão Geral

A base funcional, as salvaguardas de integridade financeira e os fluxos de hardware móvel estão sólidos. A grande oportunidade reside em transformar esta tela de uma tabela utilitária de cobrança num **painel de envolvimento comunitário da escola**, com métricas visuais claras e ligação afetiva aos educandos.

---

### O que Funciona Muito Bem

1. **Sincronização Contabilística Invisível e Atómica:** Mapeamento automático entre numerário/caixa e banco, com anulação automática e atómica de movimentos em caso de desmarcação ou eliminação.
2. **Criação Rápida de Associado no Modal (`+ Novo Associado`):** Permite registar um pai na hora da recolha sem quebrar o fluxo nem perder o formulário em curso.
3. **Salvaguardas Móveis Nativas:** Interceção do botão físico de voltar no Android (`useHardwareBack`) e diálogo de confirmação de alterações não guardadas (`UnsavedDialog`).

---

### Problemas Prioritários

#### [P1] Ausência de Barra de Pesquisa e Filtro de Ano Letivo na Listagem
- **Porquê:** Numa associação com centenas de encarregados de educação, procurar rolando manualmente é inviável no telemóvel. Além disso, quotas de anos diferentes misturam-se no mesmo feed.
- **Correção:** Adicionar logo abaixo das abas uma barra de pesquisa rápida (por nome de associado ou educando) e um seletor discreto de Ano Letivo (com predefinição para o ano atual).
- **Comando Impeccable Sugerido:** `$impeccable adapt`

#### [P1] Omissão do Resumo Executivo da Comunidade Escolar
- **Porquê:** O utilizador abre o ecrã e não tem qualquer visibilidade sobre o total angariado no ano letivo, o número de associados regularizados ou a taxa de adesão da escola.
- **Correção:** Introduzir no topo um cartão compacto de sumário com: *Total Angariado (€)*, *Sócios Ativos* e *Quotas Pendentes*.
- **Comando Impeccable Sugerido:** `$impeccable polish`

#### [P2] Desumanização dos Cartões (Ícone Genérico e Omissão do Educando)
- **Porquê:** O ícone genérico cinzento despersonaliza a relação, e a omissão do educando/turma impede distinguir pais com nomes comuns.
- **Correção:** Implementar o selo circular transparente com iniciais conforme o `DESIGN.md` e exibir badge do educando/turma (`Mãe do Martim — 3.º B`).
- **Comando Impeccable Sugerido:** `$impeccable distill`

#### [P2] Inconsistência de Tokens de Cor (Abas e Botão FAB)
- **Porquê:** O uso de `secondary-900` nas abas ativas e `primary-400` no FAB afasta-se da paleta quente terracota (#e06b4d) e empobrece a identidade visual.
- **Correção:** Harmonizar as abas com `bg-primary-500 text-white` e o FAB com terracota e elevação consistente.
- **Comando Impeccable Sugerido:** `$impeccable colorize`

#### [P3] Bloqueio Rígido do Associado na Edição
- **Porquê:** Se houver um engano de seleção inicial, o campo fica bloqueado, forçando o utilizador a apagar a quota para a poder corrigir.
- **Correção:** Permitir a reatribuição do associado durante a edição, validando se o novo associado já liquidou a quota no mesmo ano letivo.
- **Comando Impeccable Sugerido:** `$impeccable harden`

---

### Red Flags por Persona

- **👤 Alex (Tesoureiro / Power User):**
  - Não consegue filtrar quotas por método de pagamento (ex.: filtrar apenas MB Way para reconciliar com extrato bancário).
  - Sem indicação visual rápida no cartão de quanto dinheiro vivo está em Caixa para depositar.
- **👤 Jordan (Novo Membro da Mesa de Receção):**
  - O botão `+ Novo Associado` tem tamanho muito reduzido (`text-xs`), passando despercebido na correria da fila de pais.
  - Não existe botão rápido para enviar comprovativo digital por WhatsApp ao encarregado de educação no momento do pagamento.
- **👤 Casey (Encarregado de Educação no Telemóvel no Pátio):**
  - Encontrar o seu registo numa lista extensa sem campo de busca e sob luz solar direta é penoso.
  - Badges de estado com baixo contraste (`bg-green-50 text-green-700`) sob reflexo de luz natural.

---

### Observações Menores

1. **Ano de recurso hardcoded:** Em `quotas.tsx` (linha 68), o fallback utiliza `2026` em vez da função dinâmica `getCurrentSchoolYear()`.
2. **Duplicação da ação de eliminar:** O botão de eliminar quota surge no cabeçalho e no rodapé do mesmo formulário. Manter apenas no rodapé secundário evita cliques acidentais junto ao fechar (`X`).
3. **Simbolismo de moeda:** O campo de valor não possui o prefixo visual "€" dentro da caixa de texto.

---

### Perguntas para Reflexão

1. *Por que tratar as quotas como faturas avulsas em vez de um termómetro do envolvimento comunitário da escola?* (Ex.: mostrar % de pais associados por turma).
2. *Por que forçar a identificação dos pais por nomes fiscais isolados quando a comunidade escolar se reconhece pelas crianças?*
