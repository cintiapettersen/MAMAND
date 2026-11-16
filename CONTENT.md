**Language:** English | [Português](docs/pt-BR/CONTENT.md)

# MAMAND Content: Licenses and Sources

This repository brings together three types of material, each governed by its own rules.

| Type | License | Location |
|---|---|---|
| Source code | Apache License 2.0 ([LICENSE](LICENSE)) | `src/`, `test/`, `public/` |
| Original MAMAND texts | Apache License 2.0 in repository (eventual CC BY 4.0 pending confirmation in Section 1) | see Section 1 |
| Third-party publications & references | each institution's own terms | see Section 2 |

The MAMAND name and logo are not licensed under any of these licenses. See [TRADEMARKS.md](TRADEMARKS.md).

## 1. Original Texts (Proposed CC BY 4.0)

Original MAMAND texts whose ownership and licensing activation are confirmed in this section would be licensed under [Creative Commons Attribution 4.0 International](https://creativecommons.org/licenses/by/4.0/).

> **⚠️ Pending: rights-holder confirmation.** Economic and intellectual property rights over the original texts below belong personally to the author **Cintia Pettersen** (natural person), with no assignment to CREATIVE DESIGN PETTERSEN LTDA. None of the items below are licensed under CC BY 4.0 at this stage until the rights holder formally confirms activation (internal pending items J3 and T1). Meanwhile, the general repository terms apply (Apache License 2.0).

| Text | File | Status |
|---|---|---|
| Daily supportive cards | `src/data/dailyCards.ts` | proposed CC BY 4.0 — awaiting confirmation |
| Daily check-ins | `src/data/checkins.ts` | proposed CC BY 4.0 — awaiting confirmation |
| Support network, requests & letter | `src/data/supportCatalog.ts` | proposed CC BY 4.0 — awaiting confirmation |
| Maternity bag checklist | `src/data/maternityChecklist.ts` | proposed CC BY 4.0 — awaiting confirmation |

General user interface strings (`src/locales/pt-BR.ts`, `src/locales/en.ts`) remain under the **Apache License 2.0** at this stage.

Suggested attribution, only after eventual formal confirmation at https://mamand.app/credits:

> "Original content from MAMAND, by Cintia Pettersen (https://mamand.app/credits). Proposed license: CC BY 4.0 (https://creativecommons.org/licenses/by/4.0/). Changes: [describe modifications, if any]."

CC BY 4.0 grants no trademark rights (License Section 2(b)(2)) and does not permit implying author endorsement of an adaptation.

## 2. Health Content and Third-Party Sources

### 2.1 Nature of Health Content

In this distribution, the Care library (`src/data/contents.ts`) provides only basic topic metadata: title, category, phase, theme, source, and review status. Full texts (`educationalText`), practical ideas (`practicalAction`), the experimental evidence catalog (`evidenceCatalog.ts`), and research drafts (`research/clinical-knowledge/*.json`) were migrated to the private repository `cintiapettersen/mamand-clinical-research` for future professional review and legal assessment (pending item J4), leaving only synthetic fixtures (`evidenceFixtures.synthetic.ts`) in the public repository.

This migration does not alter prior public Git history and does not automatically resolve legal review J4 regarding external sources. Earlier repository versions (up to commit `7d43d3f` and pre-migration history) still contain those files in Git history. They are summaries written for MAMAND citing reference publications, without professional clinical review.

- **No documented professional clinical review.** No health content in this repository has passed documented professional clinical review. Validation states are separated into independent dimensions:
  - **Verified bibliographic source** (`sourceVerified` / `hasVerifiableSource` / legacy `verified`): confirms only that the cited reference exists; **does not equal clinical review** and **does not authorize publication**.
  - **Source-based content** (`validationStatus: 'source_based'`): summary of an identifiable publication; clinical review pending.
  - **Pending clinical review** (`validationStatus: 'pending_review'`): unconfirmed source or caveat; review pending.
  - **Clinically reviewed** (`validationStatus: 'clinically_reviewed'` + mandatory `clinicalReview`): formal review by a licensed health professional (reviewer, credential, date, reference). None today.
  - **Publication allowed** (`publicationAllowed: true`): explicit release required alongside `clinically_reviewed` and `clinicalReview`.
  - **Demonstrative text** (`validationStatus: 'demonstrative'`): sample placeholder with no guidance value.

  Any item with `suspendedReason` is strictly excluded from the UI and any publication path until professional review, regardless of status.

  Citing an institution is not clinical review. No content currently has a recorded professional review.
- **License still under legal review.** Health summaries are not licensed under CC BY 4.0. Whether health summaries may be redistributed under open terms considering source terms (some under CC BY-NC-SA) remains under legal review (internal pending item J4).
- **Original publications are not relicensed.** MAMAND's licenses do not apply to third-party publications, which remain under their authoring institutions' terms.
- **J4 Inventory & Containment:** Detailed mapping of migrated drafts is recorded in [docs/governanca/j4-inventario-conteudos-clinicos.md](docs/governanca/j4-inventario-conteudos-clinicos.md). Pending item J4 remains open until specific legal review.

### 2.2 Cited Institutions

> **⚠️ Pending: legal review** of terms of use for each source (internal pending item J4).

| Institution | Use in MAMAND | Note |
|---|---|---|
| Brazilian Ministry of Health (Child Health Handbook, Pregnant Woman's Handbook, Dietary Guidelines) | citation and summary | Government publications are not automatically public domain; terms to be confirmed. |
| World Health Organization (WHO/OMS) | citation and summary | Many publications use CC BY-NC-SA 3.0 IGO; do not reproduce verbatim passages in commercial contexts. |
| Pan American Health Organization (PAHO/OPAS) | citation | Referenced jointly with the Brazilian Ministry of Health in Dietary Guidelines for Children Under 2. |
| UNICEF | citation | — |
| Brazilian Society of Pediatrics (SBP), FEBRASGO | citation | — |
| American Academy of Pediatrics (AAP), ACOG, AASM, CDC | citation | — |
| NHS (United Kingdom) | citation | — |
| Red Cross and European Resuscitation Council (ERC) | citation | Referenced in first-aid/choking topics. |
| Infant Stool Colour Card | citation | Referenced in biliary atresia screening topic. |
| Contran (Brazil) | regulatory citation | — |
| LactMed® (National Library of Medicine / NIH) | planned, not yet integrated | Requires citation "LactMed database, National Library of Medicine". NLM does not endorse products or review translations. |

### 2.3 Institution Names

Institution names appear solely to identify informational origins and do not indicate partnership, approval, or endorsement.

## 3. Important Notice

MAMAND is an educational and record-keeping tool. It does not provide diagnosis, prescriptions, or clinical triage and does not replace care by a qualified health professional. In an emergency, contact your country's emergency service.

## 4. Modified Versions and Clinical Use

These clarifications do not restrict rights under Apache 2.0 or CC BY 4.0 and do not replace Sections 7 and 8 of Apache 2.0 (disclaimer of warranty and limitation of liability):

- No health content in this repository, in any version, has a recorded professional review.
- Anyone distributing a modified version is responsible for its health content and the safeguards they keep, modify, or remove.
- A modified version must not present itself as MAMAND or imply review or endorsement by the rights holder (see [TRADEMARKS.md](TRADEMARKS.md)).

## 5. For Those Adapting or Forking

1. Follow your country or region's health guidelines.
2. Preserve references for each clinical item when adding or modifying content.
3. Never mark content as `clinically_reviewed` without documented professional review.
4. Remove the MAMAND name and logo from your modified version (see [TRADEMARKS.md](TRADEMARKS.md)).
