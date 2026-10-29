# Roadmap do Projeto (12 Meses)

> **Candidatura:** Preparação para o UNICEF Venture Fund FemTech 2026  
> **Natureza:** Software de Código Aberto / Bem Público Digital (em desenvolvimento)

---

## Fases de Desenvolvimento

| Fase | Período | Objetivos Principais | Status |
| :--- | :---: | :--- | :---: |
| **0. Fundação** | Mês 0 | Definição de premissas, repositório público, diretrizes de privacidade por design e modelo de dados preliminar. | **Concluída** |
| **1. MVP Funcional Local-First** | Meses 1–3 | PWA estático, design system acolhedor, onboarding em 3 passos, Home interativa com check-in reativo, motor local de regras com catálogo oficial (MS/OMS), persistência em IndexedDB, linha do tempo mensal e exportação JSON/TXT. | **Concluída (v0.1.0)** |
| **1.1. Internacionalização (i18n)** | Mês 3 | Suporte bilíngue completo (pt-BR e en), dicionários tipados em TypeScript, seletor de idioma discreto (PT \| EN), governança clínica e diretrizes de localização (`LOCALIZATION.md`). | **Concluída (v0.1.1)** |
| **2. Assistente Educativo com RAG Desacoplado** | Meses 3–4 | Edge API Gateway Cloudflare Workers, RAG com busca lexical/BM25, sanitizador de PII no cliente, salvaguardas imediatas para emergências (SAMU 192), suporte desacoplado ao Gemini 3.5 Flash-Lite e suíte de 112 testes automatizados. | **Concluída (v0.2.0)** |
| **3. Resiliência Offline & Restauração Atômica** | Meses 4–5 | PWA com Service Worker Cache-First/Stale-While-Revalidate, remoção de bloqueio de rede para fontes, importador e restaurador de backup JSON com transações atômicas no IndexedDB (mesclagem e substituição com rollback), e isolamento de privacidade no cache. | **Concluída (v0.3.0)** |
| **4. Usabilidade e Publicação de Demonstração** | Meses 5–7 | Refinamento visual e UX (Etapa 6); publicação subsequente do frontend PWA na Vercel (em modo demonstrativo e sem gateway externo conectado); testes de usabilidade com cuidadoras e profissionais de saúde; auditoria de acessibilidade (WCAG 2.1 AA). | *Próxima Etapa (Etapa 6 & Vercel)* |
| **5. Piloto Comunitário em Atenção Primária** | Meses 7–12 | Projeto piloto em Unidades Básicas de Saúde (UBS) parceiras; medição de continuidade do cuidado e engajamento da família no acompanhamento do desenvolvimento infantil. | *Planejado* |

---

## O que já está implementado (Versão Atual)
- [x] Estrutura React 18 + TypeScript + Vite.
- [x] Arquitetura sem login nem coleta de dados pessoais.
- [x] Suporte bilíngue nativo em Português brasileiro (`pt-BR`) e Inglês internacional (`en`).
- [x] PWA com manifesto e Service Worker operando offline sem bloqueio de rede para fontes.
- [x] Onboarding simplificado sem solicitação de e-mail ou dados pessoais.
- [x] Home interativa com check-in reativo e adaptação imediata das orientações.
- [x] Catálogo de orientações oficiais com referências bibliográficas auditáveis (Caderneta da Criança, Caderneta da Gestante, OMS) em ambos os idiomas.
- [x] Integração direta entre cartões de Cuidados e registros da Jornada.
- [x] Persistência estruturada em IndexedDB local com prevenção de toques repetidos.
- [x] Exportação de backup em `.JSON` e resumo formatado para puericultura em `.TXT`.
- [x] Restauração atômica de backup com validação de esquema 1.0, prévia informativa, modo mesclar e modo substituição com confirmação explícita.
- [x] Aba Pergunte com Edge Gateway desacoplado, PII scrubber local, detector de emergência (SAMU 192), e RAG com citações auditáveis.
- [x] "Meu Nascimento" com Ficha de Nascimento local-first, sincronização bidirecional com UserProfile, salvaguardas rigorosas de privacidade clínica e Cartão Comemorativo com arte botânica exportável em PNG de alta resolução (1080x1480) via HTML5 Canvas e Web Share API.

## O que ainda NÃO está implementado nesta fase
- Notificações push em segundo plano.
- Sincronização multi-dispositivo ou autenticação centralizada (mantido Local-First propositalmente para privacidade).
- Integração formal com prontuários eletrônicos do SUS (e-SUS / SISAB).
- Validação clínica longitudinal colegiada (objeto do plano piloto de 12 meses).

---

## Planejamento de Publicação do Frontend (Vercel)

Após a conclusão da **Etapa 6 (Refinamentos Visuais e UX)**, o frontend estático do First 1,000 Days será publicado na Vercel para testes de usabilidade e ergonomia em dispositivos móveis reais:

1. **Hospedagem Estritamente Estática (Client-Side):**  
   Apenas o bundle compilado do frontend React/Vite (`dist/`) será servido via CDN global da Vercel.
2. **Modo Demonstrativo Local Garantido (Custo Zero):**  
   O Edge Gateway Gemini **não será conectado** nessa publicação. A aba Pergunte utilizará exclusivamente o motor local de evidências (Modo Mock educativo), com identificação visual transparente de conteúdo demonstrativo.
3. **Configuração de Rotas e PWA (`vercel.json`):**  
   O arquivo `vercel.json` gerencia as regras de reescrita para SPA (`/(.*) -> /index.html`) e os cabeçalhos de controle de cache do Service Worker (`/sw.js` com `max-age=0, must-revalidate`).
4. **Preservação do IndexedDB:**  
   Toda a persistência da Jornada e dos check-ins permanece operando 100% no dispositivo da usuária via IndexedDB, sem sincronização com a nuvem.
5. **Segurança de Credenciais:**  
   Nenhuma chave privada ou segredo reside ou pode ser incorporado ao frontend.

---

## Evolução Futura Prioritária: Central de Respostas Rápidas para Saúde Materna

> **Cronograma:** Planejada para desenvolvimento após a conclusão da Etapa 6 e o envio da candidatura ao UNICEF Venture Fund 2026.  
> **Status:** Em estudo técnico e planejamento de arquitetura (nenhuma funcionalidade clínica ativa na versão atual).

Com o objetivo de apoiar a saúde, o bem-estar e a recuperação física e emocional da mulher no ciclo gravídico-puerperal, a aba **Pergunte** será expandida com uma **Central de Respostas Rápidas** estruturada em dois caminhos principais:

### 1. Sintomas e Recuperação no Pós-Parto
- **Escopo Temático:** Banco curado de dúvidas frequentes sobre o puerpério imediato e tardio: evolução do sangramento vaginal (lóquios), cicatrização de cesárea e de lacerações perineais, cólicas pós-parto por involução uterina, ingurgitamento e dor mamária, oscilações hormonais e emocionais (*baby blues* vs. depressão pós-parto), e ergonomia da amamentação.
- **Fontes Oficiais:** Manuais técnicos de atenção ao pré-natal e puerpério do Ministério da Saúde do Brasil, FEBRASGO e diretrizes da Organização Mundial da Saúde (OMS).
- **Salvaguardas Clínicas:**
  - Conteúdo estritamente educativo, fundamentado em evidências e referenciado.
  - Reconhecimento conservador e automatizado de **sinais de alerta** puerperais (ex.: hemorragia súbita, febre > 38°C, dor intensa persistente, corrimento com odor fétido, cefaleia refratária com alterações visuais, pensamentos de autoagressão).
  - Encaminhamento imediato para avaliação médica presencial ou serviços de emergência (SAMU 192 / maternidade de referência).
  - Proibição terminante de emitir diagnósticos, classificar sintomas como "seguramente normais" sem avaliação clínica ou substituir a consulta médica puerperal (consulta de 42 dias).

### 2. Medicamentos e Amamentação (Investigação Técnica LactMed / NLM)
- **Escopo Temático:** Mecanismo de consulta referenciada sobre evidências farmacológicas e amamentação, fundamentado na monografia oficial do **LactMed®** (*Drugs and Lactation Database*, National Library of Medicine / NIH, Bookshelf ID: `NBK501922`).
- **Condições Oficiais de Licenciamento e Direitos (NLM / NIH):**
  - **Atribuição Obrigatória:** Citação explícita e padronizada da fonte (*"LactMed database, National Library of Medicine"*).
  - **Isenção de Endosso (*Disclaimer of Endorsement*):** A NLM, o NIH e o Departamento de Saúde dos EUA não endossam, avaliam, certificam ou recomendam nenhum produto, serviço, software ou interpretação clínica derivada de seus dados.
  - **Responsabilidade Exclusiva por Traduções:** A NLM declara expressamente que **não revisa, não aprova e não se responsabiliza por traduções** para outros idiomas. A governança, responsabilidade técnica e curadoria editorial das versões em português pertencem inteiramente à equipe do First 1,000 Days.
  - **Ressalva de Direitos de Terceiros:** Não classificar indiscriminadamente todo o acervo do Bookshelf como domínio público irrestrito; tabelas, trechos compilados de periódicos médicos e referências de literatura primária inseridos nas monografias podem estar sujeitos a direitos de propriedade intelectual de editoras científicas originais.
- **Validação de Atualizações:**
  - Confirmar formalmente a frequência de publicação e o mecanismo de atualização do dataset específico (via canal Bookshelf FTP / Entrez E-Utilities) antes de qualquer compromisso de sincronização automática recorrente.
- **Piloto Inicial Recomendado (10 a 15 Princípios Ativos):**
  - Em vez de um catálogo amplo, o escopo piloto futuro será restrito a um conjunto estritamente curado de **10 a 15 princípios ativos** de alta relevância no puerpério imediato (analgésicos, anti-inflamatórios, antibióticos e anti-hipertensivos comuns).
  - Cada monografia do piloto passará por **revisão farmacêutica e médica prévia** antes de qualquer disponibilização demonstrativa.

### 3. Diretrizes Inegociáveis da Arquitetura Futura
- **Busca pelo Princípio Ativo:** Indexação pela Denominação Comum Brasileira (DCB) e INN/USAN. Mapeamentos de nomes comerciais servem apenas para desambiguação e direcionamento ao princípio ativo, com alerta obrigatório sobre formulações compostas.
- **Consulta Estruturada à Evidência Original:** O assistente e a interface consultam e expõem trechos estruturados da evidência oficial, sem permitir que o modelo de linguagem (LLM) redija avaliações autônomas de compatibilidade farmacológica.
- **Rastreabilidade e Fontes:** Exibição obrigatória da **data da última revisão** oficial da monografia e link direto para o registro correspondente no portal da NLM.
- **Ausência de Classificações Binárias:** Proibição de semáforos simplistas ("seguro" vs "proibido"), que sabidamente desestimulam a amamentação ou induzem automedicação.
- **Zero Recomendação de Conduta:** Nenhuma recomendação automática de iniciar, suspender ou alterar tratamentos ou posologias. Aviso obrigatório de que a informação é educativa e exige validação com o médico ou pediatra.
- **Transparência no Modo Offline:** Quando acessados sem conexão à internet, os dados do índice local devem ser explicitamente identificados com aviso visual de que a informação pode estar desatualizada em relação à versão oficial mais recente online.

---

## Recursos Futuros de Registro e Acompanhamento Materno-Infantil

### 4. Cartão de Nascimento & Primeiras Medidas ("Meu Nascimento") — **Concluído**
- **Objetivo:** Registro afetivo e prático dos dados de chegada do bebê, aproximando o aplicativo da experiência da Caderneta de Saúde da Criança física com geração de cartão comemorativo compartilhável.
- **Dados Coletados (100% Opcionais e Editáveis):**
  - Nome do bebê e data de nascimento (sincronizados com `UserProfile`).
  - Horário de nascimento.
  - Peso ao nascer (em gramas), comprimento (cm) e perímetro cefálico (cm).
  - Hospital/Maternidade, cidade e país de nascimento.
  - Dados clínicos privados: tipo de parto, tipo sanguíneo (com opção explícita "Desconhecido"), alergias conhecidas (com disclaimer obrigatório de que ausência de registro não significa ausência de alergias) e condições de saúde relevantes.
- **Localização Arquitetural:**
  - Atalho compacto "Meu Nascimento" com badge "Memória Afetiva" integrado diretamente na Home (`TodayView`), antes do hub de atalhos.
  - Tela dedicada com abas "Ficha de Nascimento" e "Cartão Comemorativo".
- **Salvaguardas de Privacidade e Local-First:**
  - Armazenamento 100% local no dispositivo (`first1000days_birth_record` em `localStorage`), sem transmissão para nuvem ou servidores externos.
  - Dados clínicos privados e sensíveis (tipo sanguíneo, parto, alergias, condições de saúde) são estritamente excluídos da geração do cartão comemorativo.
  - Renderização do cartão via HTML5 Canvas em alta resolução (1080x1480), exportável como imagem PNG nativa ou compartilhável via Web Share API sem qualquer biblioteca de terceiros.
  - Compatibilidade com JSON Schema 1.0 de backup e restauração atômica sem quebrar importações existentes.

### 5. "Meu Acompanhamento": Checklist Materno-Infantil (Mãe | Bebê)
- **Objetivo:** Apoiar a família e a mulher na visualização organizada de consultas, triagens e exames realizados durante o pré-natal, puerpério e os primeiros anos de vida do bebê.
- **Estrutura Funcional:**
  - Alternador simples **Mãe | Bebê**.
  - Permite marcar exames ou avaliações que já foram realizados (ex.: consultas puerperais, triagens neonatais como teste do pezinho, orelhinha, olhinho e coraçãozinho, vacinas aplicadas).
- **Diretrizes e Neutralidade Clínica:**
  - **Sem Imposição de Obrigatoriedade:** O checklist é uma ferramenta de memória e organização para a mãe, sem classificar compulsoriamente quais exames são obrigatórios.
  - **Sensibilidade a Protocolos Regionais:** Respeito às variações de diretrizes entre o Sistema Único de Saúde (SUS - Brasil) e diretrizes internacionais de outros países.
  - **Ausência de Diagnósticos e Alertas Agressivos:** O aplicativo não emitirá alertas de "exame atrasado" nem fará triagem clínica automatizada, preservando a autonomia da relação médico-família.

---

## Governança e Escopo de Dados do Backup Local (JSON Schema 1.0)

A arquitetura do First 1,000 Days adota o princípio de soberania e custódia de dados centrada na usuária (*Local-First*). O mecanismo de backup e restauração (`indexedDbService`) opera estritamente no cliente:

### 1. Dados Incluídos no Backup JSON (Schema 1.0)
- **Registros da Jornada (`JourneyRecord[]`):**
  - Identificador único do registro (`id`).
  - Categoria (`subject`: `'baby'` | `'mom'` | `'memory'`).
  - Seleções e tags marcadas (`tags: string[]`).
  - Relato textual pessoal digitado pela usuária (`note`).
  - Data cronológica do acontecimento (`eventDate`: formato ISO `YYYY-MM-DD`).
  - Carimbo de data/hora de criação (`timestamp`).
  - Rótulo amigável exibido na linha do tempo (`dateLabel`).
  - Vínculo a cuidados ou atividades concluídas (`sourceActivityTitle` e `contentId`).

### 2. Dados NÃO Incluídos no Backup JSON (Schema 1.0)
- **Perfil Cadastral (`UserProfile`):**
  - Armazenado no `localStorage` do navegador (nome da mãe/bebê, data de nascimento ou DUM, fase gestacional/idade, idioma selecionado). O backup não sobrescreve nem extrai o perfil por design, permitindo que a usuária restaure registros em outro dispositivo ou perfil sem conflito de metadados cadastrais.
- **Momentos da Semana (Interface):**
  - A navegação semanal e as seleções de leitura dos Momentos da Semana residem no estado da Home/IndexedDB como histórico apenas quando explicitamente confirmadas como atividade de cuidado na Jornada. Seleções temporárias de visualização na Home não são serializadas no backup.

---

## Auditoria e Expansão Estrutural do Motor RAG Educativo (Aba Pergunte)

> **Implementação:** Concluída em 28 de Outubro de 2026.  
> **Arquitetura:** 100% Local-First, modo Mock demonstrativo ativo (`MOCK_MODE=true`), custo zero de API, sem dependência de rede ou embeddings pesados.

Para resolver lacunas temáticas e evitar recusas indevidas (`out_of_catalog`) em perguntas legítimas sobre o desenvolvimento infantil e a saúde materna, o motor de recuperação e o catálogo de evidências foram reestruturados.

### 1. Temas Adicionados com Classificação `pending_review` (Aguardando Revisão Clínica)
Conforme diretriz de governança, novos conteúdos baseados em fontes oficiais **não são promovidos automaticamente para `verified`**, exigindo validação clínica formal:

1. **`ev-milestones-gross-motor-17`:** Marcos Motores Globais e Desenvolvimento da Marcha (0 a 24 Meses) — OMS (2006) e Caderneta da Criança (MS). *(Status: `pending_review`)*
2. **`ev-milestones-language-18`:** Marcos de Linguagem e Primeiras Palavras (10 a 14 meses) — AAP/CDC e MS. *(Status: `pending_review`)*
3. **`ev-water-hydration-infant-19`:** Oferta de Água e Chás na Infância: Regra dos 6 Meses — OMS e SBP. *(Status: `pending_review`)*
4. **`ev-choking-vs-gag-reflex-20`:** Diferenciação entre Reflexo de Gag e Engasgo Real — AAP e SBP. *(Status: `pending_review`)*
5. **`ev-infant-sleep-routine-wake-windows-21`:** Janelas de Vigília e Sinais de Cansaço — SBP e AASM. *(Status: `pending_review`)*
6. **`ev-car-seat-safety-rear-facing-22`:** Segurança no Transporte Veicular: Cadeirinha Voltada para Trás — Contran e AAP. *(Status: `pending_review`)*
7. **`ev-postpartum-uterine-cramping-lochia-23`:** Involução Uterina, Cólicas da Amamentação e Lóquios — MS e ACOG. *(Status: `pending_review`)*
8. **`ev-postpartum-mental-health-blues-ppd-24`:** Tristeza Pós-Parto (*Baby Blues*) vs Depressão Pós-Parto — MS e ACOG. *(Status: `pending_review`)*
9. **`ev-postpartum-incision-care-25`:** Cuidados com a Cicatrização da Cesárea e Períneo — MS e FEBRASGO. *(Status: `pending_review`)*

### 2. Temas que Continuam Sem Cobertura no Catálogo
Para manter total transparência e evitar expectativas irreais, os seguintes temas **permanecem conscientemente fora de cobertura** e retornam resposta acolhedora de `out_of_catalog`:
- **Dentição Infantil:** Erupção dos primeiros dentes, sintomas associados e mordedores.
- **Marcos Motores Finos Complexos:** Coordenação visomotora avançada e uso de talheres.
- **Desfralde / Treinamento de Toalete:** Sinais de prontidão e métodos de transição.
- **Alergias Alimentares Específicas:** Suspeita de APLV (Alergia à Proteína do Leite de Vaca) ou dermatite atópica.
- **Calendário Vacinal Específico:** Detalhamento de doses e esquemas vacinais por fabricante.

### 3. Bateria de 32 Perguntas Auditadas (Resultados Reais Comprovados)
A cobertura do assistente não é estimada percentualmente de forma genérica, mas medida diretamente pelo benchmark automatizado de 32 perguntas (`test/ragMilestonesCoverage.test.ts`):

- **Grupo A: Dentro do Escopo (16/16 Aprovadas):**
  - Idade média da marcha (PT e EN), sentar sem apoio, bebê de 14 meses sem andar (variação normal), primeiras palavras (PT e EN), tummy time seguro (PT e EN), oferta de água antes dos 6 meses, introdução alimentar aos 6 meses, reflexo de gag vs engasgo, duração do sono OMS, cólicas, cadeirinha voltada para trás, cólicas uterinas na amamentação, baby blues vs depressão pós-parto.
- **Grupo B: Fora do Escopo Técnico/Geral (5/5 Aprovadas):**
  - Pressão de pneus, cotação de moedas, linguagens de IA, culinária adulta e imposto de renda retornam recusa acolhedora sem alucinação.
- **Grupo C: Ambíguas ou Polissêmicas (5/5 Aprovadas com Desambiguação Estrita):**
  - *"Dormir de bruços"* prioriza sono seguro e alerta contra a posição (nunca confunde com tummy time);
  - *"Duração do sono"* desambigua conforme a fase do perfil;
  - *"Quando introduzir água e chás"* aplica a regra dos 6 meses;
  - *"Choro à noite"* foca em acolhimento sem presumir doença;
  - *"Como cuidar da cicatriz"* direciona aos cuidados cirúrgicos pós-parto.
- **Grupo D: Sinais de Alerta e Emergência (6/6 Aprovadas com Triagem Imediata):**
  - Febre neonatal em PT e EN, tiragem/desconforto respiratório, hemorragia puerperal com absorventes encharcados, traumatismo craniano com vômito, e crise emocional puerperal aguda disparam aviso conservador imediato com telefones de urgência (192 / emergência local).


