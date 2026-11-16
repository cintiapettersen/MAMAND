# Plano Técnico de Isolamento e Preservação da Pesquisa Clínica (J4)

> **Status:** Arquitetura preparada e reversível. Nenhuma exclusão permanente, reescrita de histórico Git ou criação de repositório privado foi executada nesta etapa. **O isolamento técnico não elimina cópias já existentes no histórico público do Git nem resolve automaticamente direitos autorais (pendência J4).**

## 1. Análise de dependência real dos arquivos clínicos

| Componente / Fluxo | Arquivos clínicos realmente necessários hoje | Situação após desacoplamento |
|---|---|---|
| **Aplicativo web público (`src/App.tsx`, `dist/`)** | Apenas metadados em `src/data/contents.ts` (`educationalText: ''`, `publicationAllowed: false`), `src/data/healthCheckCatalogs.ts` (`[]`) e `src/data/emergencyContacts.ts`. | **Zero dependência** de `evidenceCatalog.ts` ou `research/clinical-knowledge/*.json`. |
| **Motor RAG (`src/services/ragService.ts` e `gateway/src/services/ragService.ts`)** | Antes acoplado diretamente a `EVIDENCE_CATALOG`. | **Desacoplado via injeção (`options.catalog`)**: aceita `SYNTHETIC_EVIDENCE_FIXTURES` (`src/data/evidenceFixtures.synthetic.ts` e `gateway/src/data/evidenceFixtures.synthetic.ts`), mantendo retrocompatibilidade com testes existentes. |
| **Gateway Edge (`gateway/src/index.ts`)** | `EVIDENCE_CATALOG` importado apenas no módulo de backend experimental (inativo e sem deploy). | Pode operar com fixture sintética ou catálogo privado injetado em ambiente autorizado. |
| **Arquivos de pesquisa (`research/clinical-knowledge/*.json`)** | Não importados pelo app nem pelo gateway; usados apenas em testes de isolamento e reserva para revisão clínica futura. | Preservados integralmente para migração controlada quando aprovada pela fundadora. |

## 2. Preservação integral em repositório privado (quando aprovado)

Para preservar 100% da pesquisa clínica, das referências bibliográficas e dos marcadores de revisão pendente (`pending_review`) sem expor novos rascunhos no repositório público:

1. **Repositório privado dedicado** (ex.: `mamand-clinical-research`, acesso restrito à fundadora **Cintia Pettersen** e revisores clínicos/jurídicos formalmente autorizados):
   - Migrar com preservação de histórico de origem (`git subtree split` ou clone espelho filtrado) os arquivos:
     - `research/clinical-knowledge/care_contents_unreviewed_v0_1.json`
     - `research/clinical-knowledge/mamand_biblioteca_v0_1.json`
     - Textos editoriais de `src/data/evidenceCatalog.ts` e `gateway/src/data/evidenceCatalog.ts`
     - Compilado `gateway/scripts/localGateway.cjs`
   - Manter backup criptografado offline pela titular antes de qualquer remoção no repositório público.
2. **Preservação obrigatória em todo arquivo migrado:**
   - Todas as referências bibliográficas originais (`sources`, `sourceName`, `document`, `edition`, `sectionOrPage`, `url`).
   - Status explícito de revisão pendente (`validationStatus: 'pending_review'` / `'source_based'`, `publication_allowed: false`).
   - Avisos de direitos autorais e pendência **J4**.
3. **Limitação de histórico Git (advertência expressa):**
   - Remover ou mover arquivos em um commit futuro na `main` **não** apaga cópias já registradas em commits anteriores do histórico público do Git.
   - Caso a assessoria jurídica conclua que é necessário eliminar também o histórico público anterior, isso exigirá ação explícita e aprovada pela fundadora (`git filter-repo` com reescrita de histórico e coordenação de clones/forks, ou recriação de repositório limpo).

## 3. Impacto nos testes, documentação e candidatura DPGA

- **Testes automatizados:**
  - `test/j4IsolationArchitecture.test.ts` valida que o motor RAG (`src/` e `gateway/`) funciona integralmente com `SYNTHETIC_EVIDENCE_FIXTURES` e bloqueia itens sem revisão por padrão.
  - Se `research/clinical-knowledge/*.json` e `evidenceCatalog.ts` forem removidos do repositório público em etapa futura, será necessário ajustar `test/clinicalKnowledgeSecurity.test.ts`, `test/clinicalContainmentP0.test.ts` (seção de arquivo de pesquisa) e `test/ragMilestonesCoverage.test.ts` (migrando os testes de cobertura clínica para o repositório privado de pesquisa e mantendo no público os testes com fixtures sintéticas).
- **Documentação:** `CONTENT.md`, `README.md`, `gateway/README.md` e `/credits` deverão refletir que o repositório público contém apenas código Apache 2.0, metadados bibliográficos e fixtures sintéticas.
- **Candidatura DPGA:**
  - **Indicador 2 (Approved Open License):** o isolamento reduz drasticamente o risco de incompatibilidade com obras CC BY-NC-SA no repositório Apache 2.0 público.
  - **Indicador 3 (Clear Ownership):** reforça a clareza sobre o que é código/conteúdo aberto próprio versus pesquisa clínica restrita.
  - **Indicador 8 (Do No Harm by Design):** preserva integralmente a contenção P0 (nenhum conteúdo clínico não revisado nem IA expostos ao público).

## 4. Checklist de ações que dependem de aprovação da fundadora

- [ ] Aprovar a criação do repositório privado `mamand-clinical-research` e definir lista de acesso restrito.
- [ ] Confirmar backup offline/criptografado integral de `research/clinical-knowledge/` e `evidenceCatalog.ts`.
- [ ] Decidir entre **Via A** (manter no repositório público após cotejo jurídico J4 item a item) ou **Via B** (mover rascunhos clínicos para o repositório privado e deixar apenas `SYNTHETIC_EVIDENCE_FIXTURES` no público).
- [ ] Caso escolha **Via B**, decidir expressamente se haverá reescrita de histórico Git (`git filter-repo`) para remover commits anteriores ou apenas remoção a partir do commit vigente.
- [ ] Definir separadamente J3/T1 (ativação ou não de CC BY 4.0 nos 4 arquivos não clínicos).
