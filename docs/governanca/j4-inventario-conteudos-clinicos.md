# Inventário e Contenção J4 — Conteúdos Clínicos Experimentais

> **Status:** Pendência jurídica **J4 aberta**. Este documento registra o inventário factual, a separação técnica entre camadas e as alternativas para decisão da fundadora. **Nenhuma análise jurídica foi concluída aqui.**

## 1. Separação de camadas no repositório

| Camada | Arquivos principais | Licença / Regime atual | Exposto no bundle público (`dist/`)? |
|---|---|---|---|
| **Código-fonte aberto** | `src/` (lógica, UI, serviços), `gateway/src/` (lógica de roteamento/segurança), `scripts/`, `test/` | **Apache License 2.0** (`LICENSE`) | Sim (apenas código da UI pública; `gateway/` não é empacotado). |
| **Metadados bibliográficos públicos** | `src/data/contents.ts` (60 entradas: 30 PT + 30 EN com `title`, `category`, `theme`, `tagLabel`, `source`, `validationStatus`; `educationalText: ''`, `publicationAllowed: false`) | Apache 2.0 para estrutura; referências factuais a instituições externas | Sim (apenas metadados; zero instruções clínicas). |
| **Conteúdo clínico experimental não liberado** | `src/data/evidenceCatalog.ts`, `gateway/src/data/evidenceCatalog.ts`, `gateway/scripts/localGateway.cjs`, `research/clinical-knowledge/care_contents_unreviewed_v0_1.json`, `research/clinical-knowledge/mamand_biblioteca_v0_1.json` | **Sem revisão clínica e sem liberação jurídica J4** (excluído da proposta CC BY 4.0) | **Não** (`dist/` não importa `evidenceCatalog.ts` nem `research/`). |

## 2. Inventário detalhado dos textos clínicos experimentais

1. **`src/data/evidenceCatalog.ts` e `gateway/src/data/evidenceCatalog.ts`** (espelhos idênticos, 25 entradas PT/EN):
   - 16 entradas com marcador legado `validationStatus: 'verified'` (apenas referência bibliográfica, **não** revisão clínica) e 9 com `'pending_review'`.
   - Contêm `summary_pt`, `summary_en`, `conversationalAnswer_pt` e `conversationalAnswer_en` parafraseando diretrizes com citações específicas de documentos, edições e páginas (ex.: OMS 2019 pp. 16–21; *Nurturing Care Framework* OMS/UNICEF; *Caderneta da Criança* MS p. 43; *Caderneta da Gestante*; *Guia Alimentar para Crianças Brasileiras Menores de 2 Anos*; AAP; CDC; SBP; AASM; ACOG; FEBRASGO; Contran).
   - **Nota técnica:** `gateway/scripts/localGateway.cjs` contém uma compilação local que embute `gateway/src/data/evidenceCatalog.ts` no repositório Git.
2. **`research/clinical-knowledge/care_contents_unreviewed_v0_1.json`** (30 itens PT + 30 itens EN):
   - Preserva os campos `educationalText` e `practicalAction` removidos de `src/data/contents.ts`.
   - `release_status: "draft_not_for_production"`. Cita MS, OMS, OPAS/PAHO, UNICEF, SBP, FEBRASGO, AAP, ACOG, NHS, Cruz Vermelha, ERC e Cartão de Cor das Fezes.
3. **`research/clinical-knowledge/mamand_biblioteca_v0_1.json`** (3 entradas PT-BR de rascunho):
   - `release_status: "draft_not_for_production"`, `publication_allowed: false`.
   - Cita OMS (2022, *WHO recommendations on maternal and newborn care for a positive postnatal experience*) e Ministério da Saúde / HU Brasil (*Linhas de Cuidado*, *Caderneta Transgesta* 2024).

## 3. Riscos identificados nas fontes externas (J4)

- **Ausência de cópia literal não garante independência autoral:** embora os textos estejam redigidos em registro próprio/conversacional, traduções próximas ou adaptações que sigam estrutura/seleção de publicações protegidas exigem cotejo jurídico-editorial.
- **OMS / WHO (`CC BY-NC-SA 3.0 IGO`):** diversas publicações citadas usam licença com cláusula **Não Comercial (NC)** e **CompartilhaIgual (SA)**, incompatíveis com Apache 2.0, CC BY 4.0 e com o DPG Standard caso algum trecho configure obra derivada.
- **Ministério da Saúde do Brasil e sociedades médicas (SBP, FEBRASGO, AAP, ACOG, AASM, NHS, ERC, Cruz Vermelha):** cartilhas técnicas e manuais não são automaticamente domínio público no Brasil (Lei nº 9.610/1998, art. 8º, IV abrange atos normativos) e exigem confirmação dos termos de cada publicação antes de reutilização ou adaptação.

## 4. Alternativas para preservar a pesquisa sem divulgar conteúdo incerto

Como **remover um arquivo na branch atual não apaga cópias já presentes no histórico público do Git**, existem apenas duas vias estruturais após eventual decisão jurídica da fundadora:

- **Alternativa A (Manter no repositório público apenas após cotejo J4):** revisar item a item frente às fontes originais para confirmar redação autoral independente (fatos/recomendações gerais + citação bibliográfica, sem reprodução/adaptação protegida), encerrando J4 documentalmente.
- **Alternativa B (Isolamento em repositório privado de pesquisa):** mover `research/clinical-knowledge/` e os textos clínicos de `evidenceCatalog.ts` (mantendo apenas o código do motor RAG com catálogo vazio/fixture sintética no repositório público) para repositório privado da titular, preservando a pesquisa intacta; se houver necessidade de eliminar o histórico público anterior ao isolamento, isso exigirá ação explícita e aprovada sobre o histórico do Git (`git filter-repo` / reescrita ou recriação de repositório).

## 5. Impacto no DPG Standard (Indicadores 2, 3 e 8)

- **Indicador 2 (Approved Open License):** o software público (`src/` sem `evidenceCatalog.ts`) está sob Apache 2.0, porém a presença de `evidenceCatalog.ts`, `localGateway.cjs` e `research/clinical-knowledge/*.json` no mesmo repositório Apache 2.0 com pendência J4 em aberto cria risco de questionamento sobre compatibilidade de licenças (especialmente por causa de referências a obras CC BY-NC-SA da OMS).
- **Indicador 3 (Clear Ownership):** a titularidade do código e dos textos autorais originais está claramente atribuída a **Cintia Pettersen** (`NOTICE`, `README.md`, `/credits`), mas `CONTENT.md` ainda mantém J3/T1 (CC BY 4.0 proposta) e J4 pendentes.
- **Indicador 8 (Do No Harm by Design):** a contenção clínica P0 está íntegra — nenhum texto clínico não revisado nem `evidenceCatalog.ts` chega ao bundle público (`dist/`), a aba `Pergunte` exibe apenas aviso de revisão e contatos oficiais de emergência, e `CareView` exibe somente metadados sem instruções práticas.
