# Conteúdo do MAMAND: licenças e fontes

Este repositório reúne três tipos de material, cada um com regras próprias.

| Tipo | Licença | Onde está |
|---|---|---|
| Código-fonte | Apache License 2.0 (`LICENSE`) | `src/`, `test/`, `public/` |
| Textos originais do MAMAND | Apache License 2.0 no repositório (eventual CC BY 4.0 pendente de confirmação na seção 1) | ver seção 1 |
| Publicações e referências de terceiros | termos de cada instituição | ver seção 2 |

O nome MAMAND e o logotipo não são licenciados por nenhuma dessas licenças.
Veja `TRADEMARKS.md`.

## 1. Textos originais (CC BY 4.0)

Os textos originais do MAMAND cuja titularidade estiver confirmada nesta
seção são licenciados sob a
[Creative Commons Atribuição 4.0 Internacional](https://creativecommons.org/licenses/by/4.0/deed.pt-br).

> **⚠️ Pendente: confirmação da titular.** Os direitos patrimoniais sobre
> os textos originais abaixo pertencem pessoalmente à autora **Cintia
> Pettersen** (pessoa física), sem cessão à CREATIVE DESIGN PETTERSEN LTDA.
> Nenhum item abaixo está licenciado sob CC BY 4.0 nesta etapa até que a
> titular confirme formalmente a ativação e a possibilidade de licenciamento
> (pendências internas J3 e T1). Enquanto isso, valem os termos gerais do
> repositório (Apache License 2.0 para os arquivos do repositório).

| Texto | Arquivo | Situação |
|---|---|---|
| Cartas do dia | `src/data/dailyCards.ts` | proposta CC BY 4.0 — aguardando confirmação |
| Check-ins diários | `src/data/checkins.ts` | proposta CC BY 4.0 — aguardando confirmação |
| Rede de apoio, pedidos e cartinha | `src/data/supportCatalog.ts` | proposta CC BY 4.0 — aguardando confirmação |
| Mala da maternidade | `src/data/maternityChecklist.ts` | proposta CC BY 4.0 — aguardando confirmação |

Os textos gerais de interface (`src/locales/pt-BR.ts`, `src/locales/en.ts`) permanecem sob a **Apache License 2.0** nesta etapa.

Atribuição sugerida, somente após eventual confirmação formal em https://mamand.app/credits:

> "Conteúdo original de MAMAND, por Cintia Pettersen (https://mamand.app/credits).
> Licença proposta: CC BY 4.0 (https://creativecommons.org/licenses/by/4.0/).
> Alterações: [descrever modificações, se houver]."

A CC BY 4.0 não concede direitos sobre marcas (seção 2(b)(2) da licença) e
não permite sugerir que a autora endossa uma adaptação.

## 2. Conteúdo de saúde e fontes de terceiros

### 2.1 Natureza do conteúdo de saúde

Nesta distribuição, a biblioteca de Cuidados (`src/data/contents.ts`) traz só as informações básicas de cada tema: título, categoria, fase, tema, fonte e situação da revisão. Os textos completos (`educationalText`) e as ideias práticas (`practicalAction`) sem autorização de publicação foram removidos do bundle público e preservados integralmente em `research/clinical-knowledge/care_contents_unreviewed_v0_1.json` para futura revisão profissional. O catálogo de evidências do assistente experimental também não é importado pelo frontend público.

Versões anteriores deste repositório (até o commit `7d43d3f`) incluem os textos completos e o catálogo de evidências. Eles são resumos escritos para o MAMAND que citam as publicações de referência, sem revisão profissional.

- **Sem revisão clínica profissional documentada.** Nenhum conteúdo de saúde deste repositório passou, até agora, por revisão clínica profissional documentada. Os estados de validação são separados em cinco dimensões independentes:
  - **Fonte bibliográfica verificada** (`sourceVerified` / `hasVerifiableSource` / legado `verified`): confirma apenas que a referência citada existe; **não equivale a revisão clínica** e **não autoriza publicação**.
  - **Conteúdo baseado em fonte** (`validationStatus: 'source_based'`): resumo de publicação identificável; revisão clínica pendente.
  - **Aguardando revisão clínica** (`validationStatus: 'pending_review'`): sem fonte confirmada ou com ressalva; revisão pendente.
  - **Clinicamente revisado** (`validationStatus: 'clinically_reviewed'` + `clinicalReview` obrigatório): revisão formal por profissional de saúde habilitado (quem revisou, credencial, data e referência). Hoje nenhum.
  - **Autorizado para publicação** (`publicationAllowed: true`): liberação explícita exigida junto com `clinically_reviewed` e `clinicalReview`.
  - **Texto demonstrativo** (`validationStatus: 'demonstrative'`): texto de exemplo, sem valor de orientação.

  Um item com `suspendedReason` fica obrigatoriamente fora da interface e de qualquer caminho de publicação até a revisão profissional, qualquer que seja o status.

  Citar uma instituição não é revisão clínica. Nenhum conteúdo tem, hoje,
  revisão profissional registrada.
- **Licença ainda em análise.** Esses resumos não estão licenciados sob
  CC BY 4.0. Na falta de outra indicação, os arquivos deste repositório,
  inclusive os de `src/`, são distribuídos sob a Apache 2.0. Se os resumos de
  saúde podem ser licenciados assim, considerando os termos das fontes
  (algumas em CC BY-NC-SA), está em análise jurídica (pendência interna J4).
- **As publicações originais não são relicenciadas.** As licenças do MAMAND
  não se aplicam a elas, que continuam sob os direitos e termos das
  instituições autoras.
- **Inventário e contenção J4:** o mapeamento detalhado de
  `src/data/evidenceCatalog.ts`, `gateway/src/data/evidenceCatalog.ts`,
  `gateway/scripts/localGateway.cjs` e `research/clinical-knowledge/*.json`
  consta em [docs/governanca/j4-inventario-conteudos-clinicos.md](docs/governanca/j4-inventario-conteudos-clinicos.md).
  A pendência J4 permanece aberta até revisão jurídica específica.

### 2.2 Instituições citadas

> **⚠️ Pendente: revisão jurídica** das condições de uso de cada fonte
> (pendência interna J4).

| Instituição | Uso no MAMAND | Observação |
|---|---|---|
| Ministério da Saúde do Brasil (Caderneta da Criança, Caderneta da Gestante, Guia Alimentar) | citação e resumo | Publicações do governo não são automaticamente de domínio público; termos a confirmar. |
| Organização Mundial da Saúde (OMS/WHO) | citação e resumo | Muitas publicações usam CC BY-NC-SA 3.0 IGO; não reproduzir trechos literais em contexto comercial. |
| Organização Pan-Americana da Saúde (OPAS/PAHO) | citação | Referenciada em conjunto com o Ministério da Saúde no Guia Alimentar para Crianças Brasileiras Menores de 2 Anos. |
| UNICEF | citação | — |
| Sociedade Brasileira de Pediatria (SBP), FEBRASGO | citação | — |
| American Academy of Pediatrics (AAP), ACOG, AASM, CDC | citação | — |
| NHS (Reino Unido) | citação | — |
| Cruz Vermelha e Conselho Europeu de Ressuscitação (ERC) | citação | Referenciados em temas de primeiros socorros/engasgo. |
| Cartão de Cor das Fezes (Infant Stool Colour Card) | citação | Referenciado em tema de triagem de atresia biliar. |
| Contran (Brasil) | citação de norma | — |
| LactMed® (National Library of Medicine / NIH) | planejado, ainda não integrado | Exige a citação "LactMed database, National Library of Medicine". A NLM não endossa produtos nem revisa traduções. |

### 2.3 Nomes de instituições

Os nomes das instituições aparecem apenas para identificar a origem das
informações. Isso não indica parceria, aprovação nem endosso.

## 3. Aviso importante

O MAMAND é uma ferramenta educativa e de registro. Ele não oferece
diagnóstico, prescrição nem triagem clínica e não substitui o atendimento por
profissional de saúde. Em caso de urgência, procure o serviço de emergência
do seu país.

## 4. Versões modificadas e uso clínico

Estes esclarecimentos não restringem os direitos da Apache 2.0 nem da
CC BY 4.0 e não substituem as seções 7 e 8 da Apache 2.0 (ausência de
garantia e limitação de responsabilidade):

- Nenhum conteúdo de saúde deste repositório, em nenhuma versão, tem revisão
  profissional registrada.
- Quem distribuir uma versão modificada responde pelo conteúdo de saúde dessa
  versão e pelas proteções que mantiver, alterar ou retirar.
- Uma versão modificada não deve se apresentar como MAMAND nem sugerir revisão
  ou endosso da titular (veja `TRADEMARKS.md`).

## 5. Para quem adaptar ou fizer fork

1. Siga as diretrizes de saúde do seu país ou região.
2. Mantenha as referências de cada texto clínico ao adicionar ou alterar conteúdo.
3. Não marque conteúdo como `clinically_reviewed` sem revisão profissional documentada.
4. Remova o nome e o logotipo MAMAND da sua versão (veja `TRADEMARKS.md`).
