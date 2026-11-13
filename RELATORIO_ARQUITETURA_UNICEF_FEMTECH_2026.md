# Relatório de Análise de Arquitetura Técnica
## Companheiro Digital dos Primeiros 1.000 Dias (FemTech)
**Candidatura:** UNICEF Venture Fund FemTech 2026  
**Natureza do Projeto:** Open Source / Digital Public Good (DPG)  
**Status do Documento:** Análise Técnica para Decisão de Arquitetura  
**Data:** Outubro de 2026  

---

## Sumário Executivo

Este documento apresenta a análise técnica de arquitetura para o desenvolvimento de um aplicativo independente, seguro e de código aberto voltado ao cuidado integral durante os **primeiros 1.000 dias de vida** (da gestação aos 24 meses da criança). O produto se estrutura em três pilares fundamentais: **Orientar**, **Cuidar** e **Acompanhar**.

A solução é desenhada sobre o paradigma **Local-First**, assegurando máxima privacidade, custo de infraestrutura próximo a zero para a operação básica, alta resiliência offline para regiões com conectividade limitada e conformidade com os critérios de **Bens Públicos Digitais (Digital Public Goods - DPG)** da UNICEF. 

O projeto mantém **isolamento técnico, jurídico e de dados absoluto** em relação ao produto comercial *Baby Kangoo*.

---

## 1. Arquitetura

### 1.1 Recomendação de Arquitetura: Local-First Core com Edge Gateway Desacoplado
Recomenda-se uma arquitetura estruturada em duas camadas estritamente separadas:

1. **Cliente Local-First Soberano (Device Core):**
   - O aplicativo mantém todos os registros clínicos (saúde, sintomas, alimentação, marcos de desenvolvimento e memórias) armazenados prioritariamente no próprio aparelho da usuária em banco local criptografado.
   - O motor de proatividade inicial opera de forma autônoma e determinística no cliente, consumindo tabelas e regras clínicas embutidas.
   - A dependência de rede é restrita a operações que exigem capacidade computacional externa (consultas ao assistente de IA).

2. **Edge Gateway / Backend de Extensão (Stateless Proxy & RAG):**
   - Um backend leve de borda (*Edge Functions*) sem persistência de dados pessoais (*zero-PII retention*).
   - Atua exclusivamente como intermediário seguro (*reverse proxy*) para o pipeline de RAG (Retrieval-Augmented Generation), controlando *rate limiting*, protegendo chaves de API e sanitizando os prompts antes do encaminhamento aos modelos de linguagem (LLM).

```
┌────────────────────────────────────────────────────────────────────────┐
│                        DISPOSITIVO DA USUÁRIA                          │
│                                                                        │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                     Interface (React / PWA)                      │  │
│  └──────────┬─────────────────────────────┬─────────────────────────┘  │
│             │                             │                            │
│             ▼                             ▼                            │
│  ┌───────────────────────┐   ┌──────────────────────────────────────┐  │
│  │ Motor de Regras Local │   │     Armazenamento Criptografado      │  │
│  │ (Proatividade Offline)│   │  (OPFS / SQLite / IndexedDB AES-GCM) │  │
│  └───────────────────────┘   └──────────────────────────────────────┘  │
└───────────────────────────┬────────────────────────────────────────────┘
                            │ Requisições de IA
                            │ (Apenas texto anonimizado + faixa etária)
                            ▼
┌────────────────────────────────────────────────────────────────────────┐
│                     INFRAESTRUTURA DE SERVIÇOS                         │
│                                                                        │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │        Edge API Gateway (Cloudflare Worker / Vercel Edge)        │  │
│  │        - Sanitização de PII / Rate Limit / Auth                  │  │
│  └──────────────┬───────────────────────────────────┬───────────────┘  │
│                 │                                   │                  │
│                 ▼                                   ▼                  │
│  ┌──────────────────────────────┐     ┌─────────────────────────────┐  │
│  │    Base Vetorial RAG         │     │    Provedor LLM Neutro      │  │
│  │    (pgvector / Pinecone /    │     │    (OpenAI / Anthropic /    │  │
│  │     Qdrant / Cloudflare Vet) │     │     Open-Source via Edge)   │  │
│  └──────────────────────────────┘     └─────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────┘
```

---

### 1.2 PWA Local-First vs. Aplicativo Nativo/Híbrido

| Critério | PWA Avançado (Vite + React + Workbox) | Híbrido (React Native / Expo) | Nativo Puro (Swift / Kotlin) |
| :--- | :--- | :--- | :--- |
| **Acesso e Distribuição** | **Imediato via Web**: Sem dependência de lojas de aplicativos; ideal para públicos vulneráveis com aparelhos de pouco espaço. | Requer download em lojas oficiais (30–80 MB); barreira de entrada moderada. | Download pesado em lojas; barreira considerável para conexões instáveis. |
| **Funcionamento Offline** | **Excelente**: Service Workers e Cache Storage armazenam todo o código e assets. | **Excelente**: Execução local direta em sandbox nativa. | **Excelente**: Execução nativa no dispositivo. |
| **Notificações Locais Offline** | **Limitado no iOS**: Requer instalação na tela inicial (iOS 16.4+) e suporte a Web Push. | **Excelente**: Suporte completo a notificações locais agendadas no SO sem conexão. | **Excelente**: Suporte total e nativo. |
| **Reprodutibilidade Open Source** | **Máxima**: Qualquer organização implanta um fork em minutos em provedores estáticos gratuitos. | Moderada: Requer setup de ambiente de compilação mobile e contas de desenvolvedor. | Baixa: Exige manutenção de duas bases de código separadas. |
| **Custos de Manutenção** | **Mínimo**: Base única em HTML/JS/CSS com ciclo de entrega contínuo. | Médio: Uma base React, com atualizações periódicas de dependências nativas. | Alto: Equipes duplicadas para iOS e Android. |

**Recomendação Estratégica:**
- **Fase 1 (MVP para UNICEF): PWA Local-First.** Apresenta a menor barreira de adoção, implementação ágil e distribuição pública instantânea.
- **Fase 2 (Escala):** Envelopar a aplicação via **Capacitor** ou migrar a camada visual para **Expo / React Native**, mantendo 100% da lógica de dados e regras clínicas desenvolvida.

---

### 1.3 Armazenamento Local para Dados Sensíveis de Saúde
- **Solução Técnica:** Utilização de **IndexedDB** combinado com **Web Crypto API (AES-256-GCM)** ou **SQLite compilado em WebAssembly sobre OPFS (Origin Private File System)**.
- **Isolamento de Chaves:** A chave de decriptografia é gerada a partir de uma frase-passe/PIN definida pela usuária (via PBKDF2 com salt aleatório) ou mantida em memória volátil de sessão. Nenhum dado de saúde é gravado em texto puro (*plain text*).

---

### 1.4 Backup Seguro e Sincronização Opcional
- **Exportação Manual Segura (Etapa 1):** Geração de arquivo de exportação comprimido e criptografado (`.enc.json`) com senha informada pela própria usuária. O arquivo pode ser salvo localmente, enviado por e-mail ou armazenado em nuvem pessoal (Google Drive, iCloud).
- **Sincronização Opcional com Conhecimento Zero (Etapa 2):** Se ativada no futuro, adota-se o modelo *Zero-Knowledge*. Os dados são encriptados na ponta antes do tráfego; o servidor recebe apenas registros cifrados opacos, impossibilitando leitura por terceiros ou operadores do sistema.

---

### 1.5 O projeto precisa de Supabase no início?
**Não.** O projeto deve iniciar sem banco de dados relacional na nuvem para os usuários finais.
- **Vantagens de Iniciar sem Banco Central:**
  1. *Zero-Data Retention:* Elimina riscos de vazamento centralizado de dados sensíveis de menores e gestantes.
  2. *Custo Operacional Nulo:* Sem gastos com instâncias gerenciadas, pool de conexões ou transferência de dados.
  3. *Aderência ao Edital:* Alinha-se diretamente aos princípios de soberania e privacidade da UNICEF.
- O Supabase ou banco equivalente é reservado exclusivamente para uma fase futura, caso surjam funcionalidades institucionais (como prontuário compartilhado com UBS ou suporte à teleconsulta).

---

## 2. Inteligência Artificial e RAG

### 2.1 Arquitetura RAG Reativa e Proativa
1. **Curadoria e Indexação:**
   - Corpus inicial baseado em documentos públicos e auditados: *Caderneta da Gestante*, *Caderneta da Criança (Ministério da Saúde do Brasil)* e diretrizes neonatais da *OMS/UNICEF*.
   - Segmentação dos documentos em trechos (*chunks*) semânticos de 300–500 tokens, enriquecidos com metadados estruturados (faixa etária da criança, semana gestacional, tema clínico, fonte bibliográfica).
2. **Fluxo de Inferência RAG:**
   - A pergunta da usuária é enviada ao Edge Gateway com apenas dois parâmetros: o texto da dúvida e a fase/idade (ex: "semana 32" ou "3º mês").
   - O Edge Gateway executa busca semântica na base vetorial filtrada pela faixa etária relevante.
   - O prompt é montado de forma restrita (*grounded prompting*): instrui o modelo a responder **unicamente** com base no contexto injetado, citando nominalmente a fonte e recusando extrapolações clínicas.

---

### 2.2 Provedor Agnóstico de IA
- Implementação de camada de abstração no Edge Gateway baseada no padrão de API compatível com OpenAI.
- Suporte imediato a provedores líderes (OpenAI, Anthropic Claude, Google Gemini, Groq) ou modelos abertos autohospedados (Llama 3 / Mistral via Ollama/vLLM) apenas alternando variáveis de ambiente (`AI_PROVIDER`, `AI_MODEL`, `AI_API_KEY`).

---

### 2.3 Proteção de Credenciais e Controle Financeiro
1. **Blindagem de Chaves:** Credenciais de API residem exclusivamente em variáveis de ambiente seguras no Edge Gateway; o cliente web jamais tem acesso a tokens de IA.
2. **Rate Limiting Restrito:** Limite diário por dispositivo/sessão (ex: 10 consultas diárias por usuária) controlado no Edge via cabeçalho assinado ou fingerprint efêmero.
3. **Cache Semântico:** Dúvidas comuns ("como limpar o umbigo do bebê?", "quando começam as vacinas?") são cacheadas na borda (ex: Cloudflare KV), retornando respostas instantâneas com custo zero de LLM.

---

### 2.4 Separação entre Regras Determinísticas e IA Generativa

| Funcionalidade | Abordagem Técnica | Local de Execução | Conexão Requerida |
| :--- | :--- | :--- | :--- |
| Cálculo de idade gestacional / idade do bebê | Algoritmo determinístico | Dispositivo (Cliente) | Offline |
| Calendário oficial de vacinas (PNI) | Tabela estruturada de regras | Dispositivo (Cliente) | Offline |
| Identificação de sinais de emergência | Dicionário de termos críticos | Dispositivo (Cliente) | Offline |
| Sugestões e estímulos cotidianos | Seleção de cartões por tags de fase | Dispositivo (Cliente) | Offline |
| Resposta a dúvidas abertas em linguagem natural | RAG com IA Generativa | Edge Gateway + LLM | Online |

---

### 2.5 Recursos com Funcionamento 100% Offline
- Navegação completa por todas as telas do aplicativo.
- Registro de mamadas, sono, fraldas, crescimento e sintomas.
- Visualização de gráficos de evolução e histórico cronológico.
- Lembretes agendados e dicas cotidianas do catálogo estático.
- Guia preventivo de primeiros cuidados e sinais de alerta da OMS.

---

## 3. Segurança, Privacidade e Ética Médica

### 3.1 Principais Riscos Envolvidos
1. **Exposição de Dados de Crianças e Gestantes:** Infrações à LGPD (Art. 14) e legislações internacionais de proteção à infância.
2. **Vazamento de Informações Estigmatizantes:** Condições como depressão pós-parto, perda gestacional ou intercorrências neonatais.
3. **Respostas Inseguras ou Alucinações de IA:** Risco de atraso na busca por socorro emergencial ou automedicação inadequada.

---

### 3.2 Proteção do Armazenamento Local
- Criptografia em repouso com algoritmo padrão AES-256-GCM.
- Bloqueio por PIN/biometria local opcional para evitar que terceiros com acesso físico ao aparelho visualizem anotações íntimas.
- Sanitização de cache e histórico local acionável em um clique ("Limpar dados do dispositivo").

---

### 3.3 Minimização de Dados em Chamadas Externas
- Nomes, datas exatas de nascimento, fotografias e identificadores de rede são **estritamente bloqueados** do payload enviado ao gateway de IA.
- É encaminhado unicamente o texto da pergunta associado à idade relativa da criança (ex: `{"age_months": 2, "query": "..."}`).

---

### 3.4 Controles de Consentimento e Direitos da Titular
- **Consentimento Desacoplado:** A usuária pode utilizar 100% das ferramentas de registro e acompanhamento sem conceder autorização para uso do módulo de IA.
- **Portabilidade:** Exportação estruturada dos dados em JSON legível ou resumo clínico em PDF.
- **Exclusão Imediata:** A exclusão dos dados no dispositivo remove instantaneamente todo o conteúdo do armazenamento local.

---

### 3.5 Mecanismos de Salvaguarda Clínica
1. **Triagem Sintomática de Emergência (Filtro Local):** Termos críticos (ex: *"febre alta em recém-nascido"*, *"convulsão"*, *"sangramento intenso"*, *"dificuldade para respirar"*) ativam imediatamente um aviso em tela com orientação para busca de atendimento de urgência, sem aguardar resposta da IA.
2. **Bloqueio de Diagnósticos:** O prompt do sistema veda explicitamente a interpretação diagnóstica, prescrição de medicamentos ou cálculo de dosagens.
3. **Citação Obrigatória:** O modelo só responde se houver respaldo factual direto no contexto injetado, informando o documento oficial de origem.

---

## 4. Estratégia de Código Aberto e Governança

### 4.1 Componentes de Código Público
- **Repositório do Frontend / App Core:** Telas, formulários, rotinas de criptografia local e catálogo de regras determinísticas.
- **Repositório do Edge Gateway / RAG:** Pipeline de vetorização, sanitização de requisições e conectores de LLM.
- **Corpus de Conhecimento Estruturado:** Textos e tabelas de saúde pública indexados em formato aberto (Markdown/JSON).

---

### 4.2 Licenciamento Recomendado
- **Recomendação: Licença Apache 2.0.**
  - Padrão amplamente aceito por agências da ONU e pela *Digital Public Goods Alliance (DPGA)*.
  - Permite ampla adoção governamental e comunitária.
  - Oferece proteção jurídica explícita referente à concessão de patentes, superior à licença MIT tradicional.

---

### 4.3 Estrutura do Repositório para Reprodutibilidade
- Repositório com suporte a execução imediata em modo *Mock* (sem necessidade de chaves de API pagas para testar o código).
- Documentação clara de instalação em conformidade com o checklist de Bens Públicos Digitais da UNICEF (README técnico, Guia de Contribuição, Código de Conduta e Guia de Implantação Institucional).

---

### 4.4 Isolamento Absoluto do Baby Kangoo Comercial
- O novo projeto não compartilha repositório, banco de dados, chaves de autenticação, nem domínios com o *Baby Kangoo*.
- Reutiliza-se a **experiência e aprendizado da equipe**, mas o código é desenvolvido de maneira limpa, agnóstica e autônoma, assegurando a independência do produto comercial e a integridade do bem público digital.

---

## 5. Infraestrutura e Custos

### 5.1 Aproveitamento de Contas Existentes
- É viável utilizar contas corporativas existentes (Vercel, Cloudflare) criando **equipes e projetos totalmente dissociados**, com tokens de acesso independentes e faturamento segmentado.

### 5.2 Novos Serviços Necessários
- Provedor de hospedagem estática e Edge Functions (Cloudflare Pages/Workers ou Vercel).
- Serviço de banco vetorial leve para o RAG (Cloudflare Vectorize, Pinecone Starter ou Supabase pgvector gratuito).

---

### 5.3 Estimativa de Custos Preliminares

#### Cenário A: MVP e Apresentação para UNICEF
- Hospedagem e Edge Gateway: **US$ 0,00** (coberto por planos gratuitos).
- Base Vetorial: **US$ 0,00** (coberto por planos gratuitos).
- Consumo de IA para homologação (~2.000 chamadas): **US$ 1,50 a US$ 3,00**.
- **Custo Mensal Total no MVP:** **< US$ 5,00 / mês**.

#### Cenário B: Piloto Operacional com 1.000 Usuárias Ativas / Mês
- 1.000 usuárias ativas; média de 10 perguntas de IA/mês = 10.000 consultas.
- Com cache semântico de 35%, restam 6.500 chamadas a modelos eficientes (Gemini Flash / GPT-4o-mini).
- Custo de IA estimado: **~US$ 1,50 a US$ 2,50 / mês**.
- Custos de infraestrutura de borda: **US$ 0,00 a US$ 20,00 / mês**.
- **Custo Mensal Total do Piloto:** **US$ 1,50 a US$ 22,50 / mês**.

---

## 6. Escopo do Primeiro Protótipo Funcional (MVP)

### 6.1 Funcionalidades Comprováveis no MVP
1. **Perfil Simulado:** Configuração local de fase (gestante ou puérpera com idade do bebê em semanas).
2. **Feed Contextual por Regras:** Exibição de orientações oficiais específicas para a fase selecionada (100% offline).
3. **Sugestão Proativa:** Card de cuidado diário relevante gerado por algoritmo determinístico local.
4. **Registro de Acontecimento Offline:** Cadastro funcional de mamada, marco ou nota de saúde com persistência no armazenamento do dispositivo.
5. **Linha do Tempo de Histórico:** Consulta posterior e visualização dos dados cadastrados após fechar e reabrir o app.
6. **Assistente de IA com RAG Real:** Campo de pergunta com resposta fundamentada em trecho real da *Caderneta da Criança* e citação explícita da fonte.
7. **Modo Offline Real:** Demonstração transparente de navegação completa e novos registros sem conexão à internet ativa.

### 6.2 Funcionalidades Reservadas para a Fase 2
- Sincronização em nuvem entre múltiplos cuidadores.
- Armazenamento em nuvem de fotos de memórias.
- Notificações push via servidor remoto.
- Localização e internacionalização para múltiplos idiomas.

---

## 7. Decisões Técnicas Submetidas para Aprovação

Antes do início de qualquer implementação ou criação de repositório, submetem-se os seguintes pontos para validação:

1. **Adoção do Formato PWA Local-First:** Confirmação do desenvolvimento inicial como aplicação web progressiva com foco em independência de lojas.
2. **Licenciamento Apache 2.0:** Confirmação da escolha da licença pública recomendada.
3. **Nome do Projeto de Código Aberto:** Definição da identidade neutra do projeto independente.
4. **Infraestrutura de Edge:** Confirmação da plataforma de preferência (Vercel Edge ou Cloudflare Workers/Pages).
5. **Corpus Inicial:** Homologação da *Caderneta da Gestante* e *Caderneta da Criança* do Ministério da Saúde como material base para a base vetorial do MVP.
