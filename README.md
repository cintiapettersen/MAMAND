# MAMAND

**Aplicativo educativo e de registros para gestantes e famílias, da gestação aos dois anos da criança.**
*An educational and record-keeping app for pregnant people and families, from pregnancy to the child's second birthday.*

[![License](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](LICENSE)
[![Status](https://img.shields.io/badge/Status-protótipo_em_revisão-lightgrey.svg)](ROADMAP.md)
[![Language](https://img.shields.io/badge/Language-pt--BR%20%7C%20en-orange.svg)](LOCALIZATION.md)

> **Transparência.** Projeto independente de código aberto, em fase de protótipo, preparado para a candidatura ao **UNICEF FemTech Ventures 2026**. Não há parceria formal, financiamento nem aprovação de nenhuma instituição. **Nenhum conteúdo de saúde tem revisão profissional registrada**, e o aplicativo não foi validado clinicamente. Ele não faz diagnóstico, não indica exames, não interpreta resultados e não substitui a equipe de saúde.
>
> *Independent open-source prototype prepared for the UNICEF FemTech Ventures 2026 application. No formal partnership, funding or institutional approval. **No health content has a recorded professional review**, and the app has not been clinically validated. It does not diagnose, recommend tests, interpret results or replace the care team.*

---

## 1. O que o MAMAND faz hoje

| Situação | O que inclui |
|---|---|
| **Implementado** | Aplicativo web instalável (PWA) em português e inglês, sem login, cadastro ou anúncios. Telas Hoje (cartas acolhedoras, check-in e faixa de emergência oficial por país), Cuidados (catálogo de temas de saúde apenas com título, categoria, tema, fonte e situação da revisão — sem `educationalText` ou `practicalAction` no bundle público), Jornada (diário de rotina, sono, alimentação, marcos de desenvolvimento e registro/edição de consultas de saúde), Exames e triagens (rastreamento familiar por país sem interpretação de resultados), Pergunte (aviso de pausa para revisão profissional e contatos oficiais de emergência por país, sem formulário de respostas clínicas no bundle público), Ficha de nascimento, Rede de apoio, Lista da maternidade e Política de Privacidade integrada com exclusão irreversível de dados em 1 clique. Backup e restauração em JSON (schemaVersion 1.1) e resumo textual legível para consultas. Funciona 100% offline. |
| **Testado internamente** | Suíte de testes automatizados (`npm test`) cobrindo migração de banco local (v1 → v2) e rollback, armazenamento local, backup e restauração (1.0 e 1.1), modo offline/PWA, salvaguardas de RAG, segurança clínica, governança de fontes, paridade de Política de Privacidade e ausência de rastreadores. Testes não são validação clínica. |
| **Pendente de validação** | Revisão profissional formal de todos os conteúdos de saúde por equipe médica e multiprofissional habilitada; avaliação jurídica externa contínua de privacidade; classificação regulatória formal perante autoridades sanitárias. |
| **Planejado** | Piloto com serviços de atenção primária à saúde; ativação de gateway de IA em nuvem após conclusão e aprovação das revisões regulatórias e clínicas. |

### Salvaguardas Clínicas e de Distribuição Pública

Para resguardar as famílias e manter conformidade com padrões de saúde pública e Digital Public Goods (DPG):

- **Ausência de validação clínica formal:** O MAMAND é um protótipo educativo e de registro pessoal. **Nenhum conteúdo possui validação médica, reconhecimento da OMS ou aprovação da DPGA.** A indicação de fonte bibliográfica verificada (`sourceVerified` / `source_based` / legado `verified`) atesta apenas a conformidade documental com publicações oficiais identificáveis (Ministério da Saúde, OMS, UNICEF, AAP), **não equivale a revisão clínica** e **não autoriza publicação automática**.
- **Orientações práticas de Cuidados removidas do bundle público:** Os campos `educationalText` e `practicalAction` dos conteúdos sem revisão clínica foram removidos do bundle de produção e preservados em `research/clinical-knowledge/care_contents_unreviewed_v0_1.json`. Na interface pública (`canShowCareInstructions`), apenas conteúdos com `validationStatus: 'clinically_reviewed'`, registro `clinicalReview`, `publicationAllowed: true` e ausência de `suspendedReason` podem ser exibidos.
- **Aba Pergunte em contenção pública:** A aba Pergunte permanece na navegação exibindo aviso acolhedor de que o recurso aguarda revisão profissional e disponibilizando os contatos oficiais de emergência por país (`EmergencyStrip`), sem respostas clínicas automáticas nem importação de `evidenceCatalog` ou IA externa no frontend público.

---

## 2. Privacidade e soberania dos dados

- **Sem conta, sem login e sem servidores centrais:** O aplicativo não requer cadastro, e-mail, senha ou autenticação externa.
- **Dados gravados exclusivamente no aparelho:** Registros da Jornada, consultas, exames e triagens são gravados no IndexedDB do navegador; perfil, ficha de nascimento e configurações residem no `localStorage`.
- **Exclusão total e irreversível:** Função dedicada no perfil ("Apagar todos os meus dados deste aparelho") que limpa integralmente o IndexedDB e o localStorage com confirmação explícita.
- **Política de Privacidade transparente:** Disponível in-app (`/privacy`) e em página HTML estática pré-compilada (`/privacy.html`), identificando Cintia Pettersen (Noruega) como operadora e controladora atual, os canais de atendimento operacionais e a ausência de rastreadores comerciais (zero Google Analytics, Facebook Pixel ou cookies publicitários).
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

Documentos: [ARCHITECTURE.md](ARCHITECTURE.md), [LOCALIZATION.md](LOCALIZATION.md), [CONTENT.md](CONTENT.md), [ROADMAP.md](ROADMAP.md), [CONTRIBUTING.md](CONTRIBUTING.md).

---

## 5. Licenciamento

| Material | Licença | Detalhes |
|---|---|---|
| Código-fonte | [Apache License 2.0](LICENSE) | [NOTICE](NOTICE) |
| Textos originais listados em [CONTENT.md](CONTENT.md) | CC BY 4.0, ainda pendente de confirmação da titular | [CONTENT.md](CONTENT.md) |
| Publicações de saúde citadas | Termos de cada instituição | [CONTENT.md](CONTENT.md) |
| Dependências e fontes tipográficas | Licenças próprias (MIT, ISC, OFL 1.1) | [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) |
| Nome e identidade MAMAND | Não licenciados pelas licenças acima | [TRADEMARKS.md](TRADEMARKS.md) |

- **Autoria e titularidade patrimonial:** Copyright 2026 **Cintia Pettersen** (pessoa física). O MAMAND foi concebido e desenvolvido por iniciativa pessoal da fundadora, que custeou pessoalmente o desenvolvimento, o domínio e a infraestrutura. Não houve cessão de direitos patrimoniais à pessoa jurídica.
- **Vínculo institucional:** a empresa brasileira **CREATIVE DESIGN PETTERSEN LTDA** (CNPJ 24.325.181/0001-94) mantém vínculo institucional com o projeto e figura como entidade proponente da candidatura ao **UNICEF FemTech Ventures 2026**, sem transferência de direitos patrimoniais do software e sem atuar como controladora de dados da operação pública atual. Eventual operação de projetos futuros pela empresa dependerá de formalização própria.
- **Marca:** o nome **MAMAND** ainda não possui registro formal de marca e não há declaração de exclusividade jurídica sobre marca registrada; veja [TRADEMARKS.md](TRADEMARKS.md).
- **Atribuição histórica:** os primeiros arquivos de documentação (commit `dac145c`, outubro de 2026) foram publicados sob a licença MIT; veja [NOTICE](NOTICE).
- **Nome anterior:** o projeto se chamava "Primeiros 1.000 Dias" (*First 1,000 Days*); alguns identificadores internos ainda usam esse nome.
