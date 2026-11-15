# Partnerships & Impact Collaboration

> **Transparency Notice:** MAMAND is an independent, open-source prototype in active development, originally structured for the UNICEF FemTech Ventures 2026 application. **There are currently no formal partnerships, grants, funding, certifications, or institutional endorsements.** No health content has a recorded professional review yet, and the application has **not** been clinically validated. It does not diagnose, prescribe, recommend tests, interpret results, or replace qualified healthcare professionals.

---

## 1. Mission and Audience Served

**Mission:** To provide free, open-source, offline-first, and privacy-respecting educational and personal record-keeping support for pregnant people and families during the **first 1,000 days** — from pregnancy through the child's second birthday.

**Audience served:**
- Pregnant people, mothers, fathers, and primary caregivers navigating pregnancy, childbirth, postpartum recovery, and early childhood (0–24 months).
- Families living in low-connectivity, rural, or resource-constrained environments where reliable internet access or paid apps are barriers.
- Community health workers, NGOs, and public-interest programs looking for open, local-first digital tools that can be reviewed, localized, and adapted without vendor lock-in.

---

## 2. Social Problem We Seek to Address

During the first 1,000 days, families face critical informational and organizational challenges:
- **Fragmented and inaccessible guidance:** Trustworthy maternal and early-childhood information is often scattered across PDFs, pamphlets, or portals that require continuous internet access or high digital literacy.
- **Connectivity and device barriers:** Many families cannot rely on cloud-dependent mobile apps due to unstable connectivity, limited mobile data, or older devices.
- **Privacy and surveillance risks in commercial apps:** Commercial pregnancy and parenting apps frequently require accounts, collect sensitive reproductive and child health data on remote servers, and monetize user behavior through ad trackers or data brokers.
- **Lack of adaptable open infrastructure:** Public-interest organizations and researchers often lack an open-source, bilingual, offline-capable foundation they can audit, clinically validate, and adapt to local health systems.

MAMAND addresses these gaps by keeping all personal records strictly on the user's device, operating 100% offline after initial load, and publishing its codebase under an open-source license ([Apache License 2.0](LICENSE)).

---

## 3. Features Already Implemented

The following capabilities are implemented in the current prototype and covered by an automated local test suite (`npm test`), noting that **automated software tests are not clinical validation**:

- **Installable Offline-First PWA (`pt-BR` & `en`):** Bilingual web application with Service Worker caching and self-hosted WOFF2 fonts (zero external font requests), working 100% offline with no login, registration, or ads.
- **Local-First Storage & Data Sovereignty:**
  - Personal records stored exclusively on the user's device (IndexedDB v2 for journey/health logs; `localStorage` for profile, birth record, and preferences).
  - **One-click irreversible local wipe** ("Erase all my data from this device"), clearing IndexedDB, `localStorage`, and analytics consent preferences.
  - **JSON Backup & Restore** (`schemaVersion 1.1`, backward-compatible with `1.0`) and readable text summaries for sharing during healthcare visits.
- **Core Family Modules:**
  - **Today:** Supportive daily cards, check-in, and country-specific emergency contact banner.
  - **Care:** Health topic library referencing official public-health sources (e.g., Ministry of Health, WHO, UNICEF, AAP). Practical care instructions remain gated (`canShowCareInstructions`) until formal professional review (`clinically_reviewed`) is recorded.
  - **Journey:** Personal diary for routine, sleep, feeding, developmental milestones, and healthcare appointment logging/editing.
  - **Exams & Screenings:** Family-maintained tracking structured by country (ISO code architecture) without automated clinical interpretation.
  - **Ask (Local Educational Assistant):** Decoupled in-browser educational assistant (`ENABLE_EXTERNAL_AI = false`, zero external AI API calls), with client-side PII sanitization and immediate emergency number redirection.
  - **Birth Record, Support Network & Maternity Bag Checklist.**
- **Privacy & Consent Safeguards:**
  - Built-in Privacy Policy (`/privacy` and static `/privacy.html`) with controller details (CREATIVE DESIGN PETTERSEN LTDA) and zero commercial ad trackers (no Google Analytics, Facebook Pixel, or advertising cookies).
  - Optional **Vercel Web Analytics** is disabled by default (`pending`), activated only upon explicit affirmative user consent, restricted to the official production host when online, with URL sanitization (`beforeSend`) and one-click revocation.

---

## 4. Opportunities for Collaboration

We welcome conversations with NGOs, foundations, academic researchers, public health institutions, and impact funders across three main tracks:

### A. Impact Funding & Sponsorship
Funding can accelerate the transition from an independent prototype to a clinically reviewed, accessible open-source resource aligned with digital public good principles (without implying any existing certification or official recognition) — supporting dedicated multidisciplinary clinical review, WCAG 2.1 AA accessibility audits, multilingual localization, and sustainable open-source maintenance.
*(Note: No automated sponsorship or donation channel is enabled on GitHub yet while governance and receiving mechanisms are being structured. Organizations interested in grants or sponsorship are invited to contact us directly.)*

### B. Institutional Adaptation & Localization
Organizations serving specific regions or communities can collaborate to adapt country-specific modules — such as local emergency numbers, national screening/immunization reference schedules (once clinically and legally cleared), and culturally appropriate educational content — while preserving open-source transparency and local-first privacy.

### C. Research & Primary Care Pilots
We are open to partnering with universities, health researchers, and primary-care networks to design and run:
- Usability and comprehension studies with pregnant people, parents, and community health workers.
- Feasibility pilots in low-connectivity or underserved primary-care settings (subject to prior clinical review, ethics committee approval, and regulatory/legal assessment).

---

## 5. Current Needs

To responsibly move beyond the prototype stage, MAMAND currently needs support in four areas:

1. **Clinical Review:** Formal, documented review of all educational health topics, red-flag criteria, and country-specific exam/screening structures by licensed physicians, nurses, midwives, and maternal-child health specialists.
2. **Accessibility:** Formal WCAG 2.1 AA audit, assistive-technology/screen-reader testing, and UX refinements for users with varying literacy levels.
3. **Translation & Localization:** Expanding beyond Portuguese (`pt-BR`) and English (`en`) into additional languages, with careful clinical and cultural adaptation.
4. **Validation with Families:** Participatory field testing and structured feedback with pregnant people, mothers, fathers, and caregivers across diverse socioeconomic and connectivity contexts.

---

## 6. Contact

If you represent an NGO, foundation, research group, healthcare institution, or impact funder and would like to explore collaboration, clinical review, or support:

- **Email:** [hello@mamand.app](mailto:hello@mamand.app)
- **Repository:** [github.com/cintiapettersen/MAMAND](https://github.com/cintiapettersen/MAMAND)

Please also review our [Roadmap](ROADMAP.md), [Content Governance](CONTENT.md), [Contributing Guide](CONTRIBUTING.md), [License](LICENSE), and [Trademarks](TRADEMARKS.md).
