**Language:** English | [Português](docs/pt-BR/README.md)

# MAMAND

**An educational and personal record-keeping web app for pregnant people and families, from pregnancy to the child's second birthday.**

[![License](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](LICENSE)
[![Status](https://img.shields.io/badge/Status-prototype_under_review-lightgrey.svg)](ROADMAP.md)
[![Language](https://img.shields.io/badge/Language-en%20%7C%20pt--BR-orange.svg)](LOCALIZATION.md)

> **Transparency.** Independent open-source prototype prepared for the **UNICEF FemTech Ventures 2026** application. There is no formal partnership, funding, or institutional approval. **No health content has a recorded professional review**, and the application has not been clinically validated. It does not diagnose, recommend tests, interpret results, or replace the healthcare team.

---

## 1. What MAMAND does today

| Status | What is included |
|---|---|
| **Implemented** | Installable web app (PWA) in English and Portuguese, with no login, registration, or ads. Views: **Today** (supportive daily cards, check-in, and official emergency strip by country), **Care** (health topic catalog displaying only title, category, theme, source, and review status — no `educationalText` or `practicalAction` in the public bundle), **Journey** (routine, sleep, feeding, developmental milestones, and health appointment logging/editing), **Health Checks & Screenings** (family tracking by country without result interpretation), **Ask** (professional review pause notice and official emergency contacts by country, with no clinical Q&A form in the public bundle), **Birth Record**, **Support Network**, **Maternity Bag Checklist**, **Credits & Licensing** (`/credits`), and an integrated **Privacy Policy** (`/privacy`) with 1-click irreversible local data erasure. JSON backup and restore (`schemaVersion 1.1`) and readable TXT summary for appointments. Works 100% offline. |
| **Tested internally** | Automated test suite (`npm test`) covering local database migration (v1 → v2) and rollback, local storage, backup and restore (`1.0` and `1.1`), offline/PWA mode, RAG safeguards, clinical safety, source governance, Privacy Policy parity, credits/licensing page, and absence of trackers. Automated tests are not clinical validation. |
| **Pending validation** | Formal professional review of all health content by qualified medical and multidisciplinary teams; ongoing external legal privacy review; formal regulatory classification with health authorities. |
| **Planned** | Pilot with primary healthcare services; cloud AI gateway activation only after regulatory and clinical reviews are completed and approved. |

### Clinical & Public Distribution Safeguards

To protect families and align with public health and Digital Public Goods (DPG) safety practices:

- **No formal clinical validation:** MAMAND is an educational and personal record-keeping prototype. **No content has medical validation, WHO recognition, or DPGA approval.** A verified bibliographic source indicator (`sourceVerified` / `source_based` / legacy `verified`) only attests documentary alignment with identifiable official publications (Brazilian Ministry of Health, WHO, UNICEF, AAP); it **does not equal clinical review** and **does not authorize publication**.
- **Unreviewed Care practical guidance removed from the public bundle:** The `educationalText` and `practicalAction` fields of unreviewed content were removed from the production bundle and migrated to the private research repository (`cintiapettersen/mamand-clinical-research`), leaving only basic topic metadata in the public catalog. In the public UI (`canShowCareInstructions`), only items with `validationStatus: 'clinically_reviewed'`, a `clinicalReview` record, `publicationAllowed: true`, and no `suspendedReason` can be displayed.
- **Ask tab under public containment:** The Ask tab remains in navigation displaying a supportive notice that the feature awaits professional review and providing official emergency contacts by country (`EmergencyStrip`), with no automated clinical answers and no `evidenceCatalog` or external AI imported in the public frontend.

---

## 2. Privacy and data sovereignty

- **No account, no login, no central servers:** The app requires no registration, email, password, or external authentication.
- **Data stored exclusively on the device:** Journey records, appointments, and health checks are stored in browser IndexedDB; profile, birth record, and preferences reside in `localStorage`.
- **Total irreversible erasure:** Dedicated profile action (*"Erase all my data from this device"*) that completely clears IndexedDB and `localStorage` after explicit confirmation.
- **Transparent Privacy Policy:** Available in-app (`/privacy`) and as pre-built static HTML (`/privacy.html`), identifying Cintia Pettersen (Norway) as current operator and data controller, operational support channels (`privacidade@mamand.app`, `hello@mamand.app`), and the absence of commercial trackers (zero Google Analytics, Facebook Pixel, or advertising cookies).
- **100% local offline fonts:** All typefaces (Fraunces, Nunito, Plus Jakarta Sans) are self-hosted in WOFF2 and cached by the Service Worker with zero external font requests (no Google Fonts).
- **Structured backups (`schemaVersion 1.1`):** Open JSON export containing Journey records, Birth Record, and Health Checks/Screenings, backward-compatible with legacy `1.0` backups.

---

## 3. Running locally

Requirements: Node.js 20 or higher and npm.

```bash
git clone https://github.com/cintiapettersen/MAMAND.git
cd MAMAND
npm install
npm run dev        # development server at http://localhost:3000
npm run typecheck  # TypeScript check
npm test           # local automated test suite (no network required)
npm run build      # builds static privacy.html and production bundle in dist/
npm run preview    # serves production build locally
```

The app runs autonomously and requires no external API keys for local execution.

---

## 4. Repository structure

```
├── src/          # React + TypeScript application
│   ├── config/   # Content availability rules and clinical parameters
│   ├── data/     # Topic metadata, synthetic fixtures, emergency contacts, privacy & credits
│   ├── domain/   # Health checks, appointments, countries, and summary rules
│   ├── services/ # IndexedDB v2, RAG engine with synthetic fixtures, local wipe, storage
│   ├── styles/   # Local stylesheets (no external fonts)
│   └── views/    # Today, Ask, Journey, Care, Health Checks, Credits, and Privacy Policy
├── public/       # Local WOFF2 fonts, privacy.html, Service Worker, PWA manifest, licenses
├── gateway/      # Decoupled RAG gateway module (synthetic fixtures; inactive)
├── scripts/      # Static privacy.html generator and validation helpers
├── test/         # Automated app and safeguard test suite
└── docs/         # Governance, architecture, and localized documentation (docs/pt-BR/)
```

Documentation: [ARCHITECTURE.md](ARCHITECTURE.md), [LOCALIZATION.md](LOCALIZATION.md), [CONTENT.md](CONTENT.md), [ROADMAP.md](ROADMAP.md), [CONTRIBUTING.md](CONTRIBUTING.md), [SECURITY.md](SECURITY.md), [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md).

---

## Alignment with the UN Sustainable Development Goals (SDGs)

As an open-source tool focused on maternal and early childhood support, MAMAND's **intended contribution** aligns with the following UN SDGs:

- **SDG 3 — Good Health and Well-Being** *(particularly targets 3.1 and 3.2)*: supporting pregnant people and families in logging routine care, appointments, and screenings to prepare for in-person healthcare visits and access official emergency numbers by country.
- **SDG 5 — Gender Equality**: providing practical tools for care-network coordination, informational autonomy, and reducing invisible postpartum overload without requiring an account or exposing personal data.

> **Important distinction:** The alignment above describes the **intended educational and record-keeping purpose** of the open-source software. MAMAND is still in prototype stage and **has no proven clinical impact study, formal medical validation, or official endorsement from DPGA or WHO**.

---

## 5. Licensing

| Material | License | Details |
|---|---|---|
| Source code | [Apache License 2.0](LICENSE) | [NOTICE](NOTICE) |
| Original texts listed in [CONTENT.md](CONTENT.md) | Apache License 2.0 in repository; eventual CC BY 4.0 adoption awaits rights-holder confirmation | [CONTENT.md](CONTENT.md) |
| Cited health publications | Each institution's own terms | [CONTENT.md](CONTENT.md) |
| Third-party dependencies & typefaces | Their own licenses (MIT, ISC, OFL 1.1) | [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) |
| MAMAND name and brand identity | Not licensed by the licenses above | [TRADEMARKS.md](TRADEMARKS.md) |

- **Authorship and copyright ownership:** Copyright 2026 **Cintia Pettersen** (natural person). MAMAND was conceived, developed, and funded as a personal initiative by the founder, who personally paid for development, domain, and infrastructure. There has been no formal assignment of IP rights to a legal entity.
- **Institutional affiliation:** the Brazilian company **CREATIVE DESIGN PETTERSEN LTDA** (CNPJ 24.325.181/0001-94) maintains an institutional affiliation with the project and serves as the applicant entity for the **UNICEF FemTech Ventures 2026** application, without holding copyright ownership of the software or acting as data controller of the current public app. Any future operation of projects by the company will require separate formalization.
- **Trademark:** the **MAMAND** name does not yet hold a formal trademark registration and no claim of registered-trademark exclusivity is made; see [TRADEMARKS.md](TRADEMARKS.md).
- **Historical attribution:** initial documentation files (`commit dac145c`, October 2026) were published under the MIT License; see [NOTICE](NOTICE).
- **Former name:** the project was formerly called "Primeiros 1.000 Dias" (*First 1,000 Days*); some internal identifiers still use that name.
