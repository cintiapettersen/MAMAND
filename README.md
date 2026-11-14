# MAMAND

**Apoio gratuito, de código aberto e offline para gestantes e famílias nos primeiros 1.000 dias — da gestação aos dois anos da criança.**
*Free, open-source, offline-first support for pregnant people and families during the first 1,000 days — from pregnancy through the child's second birthday.*

[![License](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](LICENSE)
[![Status](https://img.shields.io/badge/Status-protótipo_sem_validação_clínica-lightgrey.svg)](ROADMAP.md)
[![Language](https://img.shields.io/badge/Language-pt--BR%20%7C%20en-orange.svg)](LOCALIZATION.md)
[![Partnerships](https://img.shields.io/badge/Partnerships-welcome-teal.svg)](PARTNERSHIPS.md)

### Visão geral / Overview

- **Apoio gratuito nos primeiros 1.000 dias / Free support in the first 1,000 days:** Aplicativo web instalável (PWA) educativo e de registros pessoais para acompanhar gestação, pós-parto, rotina, consultas e marcos do desenvolvimento, sem login, cadastro ou anúncios.
- **Código aberto e funcionamento offline / Open source and offline-first:** Funciona 100% offline no dispositivo após o carregamento inicial, pensado para contextos com conectividade limitada.
- **Privacidade e armazenamento local / Privacy and local storage:** Dados de saúde e registros familiares ficam armazenados exclusivamente no aparelho do usuário (IndexedDB e `localStorage`), com exclusão local irreversível em 1 clique e estatísticas opcionais (Vercel Web Analytics) ativadas apenas mediante consentimento.
- **Parcerias institucionais e financiamento de impacto / Institutional partnerships & impact funding:** Buscamos colaboração com ONGs, fundações, pesquisadores, profissionais de saúde e organizações de impacto interessadas em revisão clínica, acessibilidade, tradução, pilotos de pesquisa ou patrocínio. Veja [PARTNERSHIPS.md](PARTNERSHIPS.md) ou escreva para [hello@mamand.app](mailto:hello@mamand.app).
- **Status de protótipo / Prototype status:** Protótipo independente em desenvolvimento ativo, **ainda sem validação clínica formal**.

> **Transparência / Transparency.** Projeto independente de código aberto, em fase de protótipo, originalmente estruturado para a candidatura ao **UNICEF FemTech Ventures 2026**. Não há parceria formal, financiamento, certificação nem aprovação de nenhuma instituição. **Nenhum conteúdo de saúde tem revisão profissional registrada**, e o aplicativo não foi validado clinicamente. Ele não faz diagnóstico, não indica exames, não interpreta resultados e não substitui a equipe de saúde.
>
> *Independent open-source prototype, originally structured for the UNICEF FemTech Ventures 2026 application. There is no formal partnership, funding, certification, or institutional approval. **No health content has a recorded professional review**, and the app has not been clinically validated. It does not diagnose, recommend tests, interpret results, or replace the care team.*

---

## 1. O que o MAMAND faz hoje

| Situação | O que inclui |
|---|---|
| **Implementado** | Aplicativo web instalável (PWA) em português e inglês, sem login, cadastro ou anúncios. Telas Hoje (cartas acolhedoras, check-in e faixa de emergência oficial por país), Cuidados (biblioteca de temas de saúde com fontes oficiais verificadas e orientações em revisão pré-clínica), Jornada (diário de rotina, sono, alimentação, marcos de desenvolvimento e registro/edição de consultas de saúde), Exames e triagens (rastreamento familiar por país sem interpretação de resultados), Pergunte (assistente local educativo com RAG in-app, sanitização de PII e emergência integrada), Ficha de nascimento, Rede de apoio, Lista da maternidade e Política de Privacidade integrada com exclusão irreversível de dados em 1 clique. Backup e restauração em JSON (schemaVersion 1.1) e resumo textual legível para consultas. Funciona 100% offline. |
| **Testado internamente** | Suíte de testes automatizados (`npm test`) cobrindo migração de banco local (v1 → v2) e rollback, armazenamento local, backup e restauração (1.0 e 1.1), modo offline/PWA, salvaguardas de RAG, segurança clínica, governança de fontes, paridade de Política de Privacidade e ausência de rastreadores. Testes não são validação clínica. |
| **Pendente de validação** | Revisão profissional formal de todos os conteúdos de saúde por equipe médica e multiprofissional habilitada; avaliação jurídica externa contínua de privacidade; classificação regulatória formal perante autoridades sanitárias. |
| **Planejado** | Piloto com serviços de atenção primária à saúde; ativação de gateway de IA em nuvem após conclusão e aprovação das revisões regulatórias e clínicas. |

### Salvaguardas Clínicas e de Distribuição Pública

Para resguardar as famílias e manter conformidade com padrões de saúde pública e Digital Public Goods (DPG):

- **Ausência de validação clínica formal:** O MAMAND é um protótipo educativo e de registro pessoal. **Nenhum conteúdo possui validação médica ou aprovação sanitária formal.** A indicação de fonte bibliográfica verificada (`verified` ou `source_based`) atesta apenas a conformidade documental com publicações oficiais identificáveis (Ministério da Saúde, OMS, UNICEF, AAP), **não substituindo a avaliação médica presencial**.
- **Orientações práticas de Cuidados bloqueadas em produção:** O texto completo e as ideias práticas dos temas de saúde permanecem sob aviso de revisão pendente (`canShowCareInstructions`). Eles só são liberados caso haja registro formal e documentado de revisão profissional por profissional de saúde (`clinically_reviewed`).
- **Assistente Local Educativo Desacoplado:** O módulo Pergunte opera 100% no navegador do dispositivo (`ENABLE_EXTERNAL_AI = false`), sem envio de perguntas ou dados pessoais a provedores externos de IA. Toda consulta passa por sanitização preventiva cliente de PII e detecção imediata de sinais de alerta com redirecionamento telefônico de emergência para os números oficiais locais (ex.: 192 SAMU no Brasil, 113 na Noruega, 15 na França, 999 no Reino Unido).

---

## 2. Privacidade e soberania dos dados

- **Sem conta, sem login e sem servidores centrais:** O aplicativo não requer cadastro, e-mail, senha ou autenticação externa.
- **Dados gravados exclusivamente no aparelho:** Registros da Jornada, consultas, exames e triagens são gravados no IndexedDB do navegador; perfil, ficha de nascimento e configurações residem no `localStorage`.
- **Exclusão total e irreversível:** Função dedicada no perfil ("Apagar todos os meus dados deste aparelho") que limpa integralmente o IndexedDB, o `localStorage` e a preferência de consentimento de estatísticas com confirmação explícita.
- **Estatísticas opcionais apenas com consentimento (Vercel Web Analytics):** O aplicativo não carrega rastreadores comerciais (zero Google Analytics, Facebook Pixel ou cookies publicitários). O **Vercel Web Analytics** permanece desativado por padrão (`pending`) e só é ativado mediante consentimento afirmativo explícito no banner inicial ou nas preferências do perfil, exclusivamente no host oficial de produção e quando o navegador estiver online, com sanitização de URLs (`beforeSend`). A pessoa usuária pode recusar ou revogar o consentimento a qualquer momento.
- **Política de Privacidade transparente:** Disponível in-app (`/privacy`) e em página HTML estática pré-compilada (`/privacy.html`), com dados da controladora responsável (CREATIVE DESIGN PETTERSEN LTDA) e canais de atendimento operacionais.
- **Fontes 100% locais e offline:** Todas as fontes tipográficas (Fraunces, Nunito, Plus Jakarta Sans) são auto-hospedadas em WOFF2 e cacheadas pelo Service Worker, sem conexões a servidores externos (zero Google Fonts).
- **Backups estruturados (schemaVersion 1.1):** Exportação aberta contendo registros da Jornada, Ficha de Nascimento e Exames/Triagens. Compatível com a restauração de backups legados 1.0.

---

## 3. Como executar localmente

Requisitos: Node.js 20 ou superior e npm.

```bash
git clone https://github.com/cintiapettersen/MAMAND.git
cd MAMAND
npm install
npm run dev        # desenvolvimento em http://localhost:3000
npm test           # testes automatizados locais (sem rede)
npm run build      # compila política estática e build de produção em dist/
npm run preview    # serve o build de produção localmente
```

O app opera de forma autônoma e não requer chaves de API externas para execução local.

---

## 4. Estrutura do repositório

```
├── src/          # Aplicativo React + TypeScript
│   ├── config/   # Regras de disponibilidade de conteúdo e parâmetros clínicos
│   ├── data/     # Catálogo de temas, evidências, contatos de emergência e privacidade
│   ├── domain/   # Regras de exames e triagens, consultas, países e resumos
│   ├── services/ # IndexedDB v2, assistente educativo, wipe local e armazenamento
│   ├── styles/   # Folhas de estilo locais (sem fontes externas)
│   └── views/    # Hoje, Pergunte, Jornada, Cuidados, Exames e Política de Privacidade
├── public/       # Fontes WOFF2 locais, privacy.html, Service Worker e manifesto PWA
├── research/     # Base clínica estruturada (mamand_biblioteca_v0_1.json)
├── gateway/      # Módulo desacoplado de gateway RAG e integração com IA privada
├── scripts/      # Script gerador de privacy.html e rotinas de validação
├── test/         # Suíte de testes automatizados do aplicativo e salvaguardas
└── docs/         # Documentação de governança, arquitetura e convenções
```

Documentos: [PARTNERSHIPS.md](PARTNERSHIPS.md), [ARCHITECTURE.md](ARCHITECTURE.md), [LOCALIZATION.md](LOCALIZATION.md), [CONTENT.md](CONTENT.md), [ROADMAP.md](ROADMAP.md), [CONTRIBUTING.md](CONTRIBUTING.md).

---

## 5. Licenciamento

| Material | Licença | Detalhes |
|---|---|---|
| Código-fonte | [Apache License 2.0](LICENSE) | [NOTICE](NOTICE) |
| Textos originais listados em [CONTENT.md](CONTENT.md) | CC BY 4.0, ainda pendente de confirmação da titular | [CONTENT.md](CONTENT.md) |
| Publicações de saúde citadas | Termos de cada instituição | [CONTENT.md](CONTENT.md) |
| Dependências e fontes tipográficas | Licenças próprias (MIT, ISC, OFL 1.1) | [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) |
| Nome e identidade MAMAND | Não licenciados pelas licenças acima | [TRADEMARKS.md](TRADEMARKS.md) |

- **Titularidade:** Copyright 2026 Cintia Pettersen.
- **Atribuição histórica:** os primeiros arquivos de documentação (commit `dac145c`, outubro de 2026) foram publicados sob a licença MIT; veja [NOTICE](NOTICE).
- **Nome anterior:** o projeto se chamava "Primeiros 1.000 Dias" (*First 1,000 Days*); alguns identificadores internos ainda usam esse nome.
