**Language:** English | [Português](docs/pt-BR/ROADMAP.md)

# MAMAND Roadmap

> Independent open-source prototype prepared for the UNICEF FemTech Ventures 2026 application. Status as of November 2026.

## Current Status

| Milestone | Status |
|---|---|
| Local-first web app (PWA, no login, English and Portuguese) | **Implemented and tested internally** |
| Today, Care, Journey, Support Network, Maternity Bag, Birth Record, Credits | **Implemented and tested internally** |
| Health Checks & Screenings: family-entered logging, no national schedules | **Implemented and tested internally** |
| JSON backup/restore (`schemaVersion 1.1`); readable text summary | **Implemented and tested internally** |
| Offline operation | **Implemented and tested internally** |
| International architecture (ISO country codes, no country-specific logic) | **Implemented** (structure); national schedules empty |
| Educational Q&A assistant (Ask tab) | **Excluded from this distribution**, in private development until clinical and regulatory reviews; tab displays pause notice and emergency contacts only |
| "Warning Signs" panel | **Excluded from this distribution** until professional review of criteria; emergency contacts remain visible |
| Care full texts and practical actions | **Excluded from this distribution** until professional review; library displays topics and sources only |
| Professional review of health content | **Pending**: no content has a recorded clinical review |
| Legal review of sources (J4), privacy, and regulatory classification | **Pending** |

## Next Steps

1. **Professional review** of educational content, warning-sign criteria, and national health check schedules (Brazil and Norway) by qualified healthcare professionals in each system.
2. **Legal and regulatory assessment:** source reuse rights (J4), original text licensing (J3/T1), privacy compliance (LGPD and GDPR), and regulatory classification.
3. **Regression testing** of approved clinical decisions.
4. **Public demonstration** of the static frontend with no connected AI server.
5. **Usability testing** with families and health professionals; accessibility audit (WCAG 2.1 AA).
6. **Primary healthcare pilot**, after required reviews.

## Planned (No Target Date)

- Country-specific educational health check schedules, only after recorded professional review and confirmed source reuse rights.
- Expansion to additional countries with local health system professionals.
- Public AI educational assistant, only after clinical and regulatory reviews and model provider terms review; when released, to be published as open source.
- Medication and lactation reference lookup: under study, no active feature.

## Out of Scope

- Diagnosis, prescribing, test result interpretation, or clinical triage.
- Cloud synchronization and user accounts (local-first by design).
- Electronic health record (EHR) integration.
