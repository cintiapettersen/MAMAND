**Language:** English | [Português](docs/pt-BR/ARCHITECTURE.md)

# MAMAND Architecture

> **Status (November 2026).** This public distribution contains only the local-first application. The **Ask** tab displays only the professional review pause notice and official emergency contacts by country (`EmergencyStrip`), with no question form and no clinical catalogs, `ragService`, `mockEngine`, or `askService` imported into the public bundle. Experimental clinical drafts (full Care texts and unreviewed evidence catalogs) were transferred to the private research repository (`cintiapettersen/mamand-clinical-research`), leaving only synthetic fixtures in the public codebase for technical RAG testing. No health content has a recorded professional review. Local data resides solely on the device, **without application-level encryption at rest**.

## 1. Overview

**MAMAND** (formerly "Primeiros 1.000 Dias" / Open Child Health Booklet) is a static Progressive Web App (PWA) built with **React 18**, **TypeScript**, and **Vite**. All logic and user records remain on the device; the app has no central backend server and makes no network requests beyond loading its own static assets (unless optional production analytics is explicitly accepted).

```
┌──────────────────────────────────────────────────────────────┐
│                       USER'S DEVICE                          │
│                                                              │
│  Interface (React / PWA, en and pt-BR)                       │
│  - Today: check-in, daily cards, emergency contacts          │
│  - Ask: suspension notice and official emergency contacts    │
│  - Journey: diary, Health Checks & Screenings, backup/export │
│  - Care: topic catalog (title, theme, source, review status) │
│  - Service Worker for offline operation                      │
│                                                              │
│  Local Storage                                               │
│  - IndexedDB: Journey records and Health Checks/Screenings   │
│  - localStorage: profile, checklists, and preferences        │
│  - Export and import in JSON; readable summary in TXT        │
└──────────────────────────────────────────────────────────────┘
```

## 2. Local Data Model (IndexedDB)

Records are stored in the `first_1000_days_db` database (ObjectStore `journey_records`):

```typescript
export interface JourneyRecord {
  id: string;                         // Unique record identifier (e.g., "rec-1730000000")
  subject: 'baby' | 'mom' | 'memory'; // Care subject classification
  tags: string[];                     // Selected context tags
  note?: string;                      // Contextualized text note
  sourceActivityTitle?: string;       // Linked practical guidance title
  contentId?: string;                 // Activity ID (daily duplicate prevention)
  timestamp: string;                  // Recording timestamp (ISO 8601)
  eventDate: string;                  // Effective event date (YYYY-MM-DD, supports backdating)
  dateLabel: string;                  // Friendly label shown in timeline
}
```

---

## 3. PWA Architecture and Offline Resilience

The application implements modern PWA standards to support autonomous operation in low-connectivity or rural areas:

1. **PWA Manifest (`public/manifest.webmanifest`):**
   - `display: "standalone"` for home-screen installation on Android and iOS devices.
   - Theme colors (`#FAF7F2`) consistent with the project's visual identity.
   - Vector SVG and PNG icons in 192x192 and 512x512 resolutions.
2. **Service Worker (`public/sw.js`):**
   - **Static Assets:** *Cache-First* / *Stale-While-Revalidate* strategy for JS/CSS bundles and images.
   - **SPA Navigation:** *Network-First* strategy with fallback to cached `index.html`, enabling page reloads and deep navigation offline.
   - **Strict Privacy Isolation:** Intercepts `/api/*` and local Edge Gateway (port 8787) calls so they are **never stored in CacheStorage**. On network failure, returns a synthetic HTTP 503 response without persisting queries or medical answers.
3. **100% Local Offline Fonts (Zero Google Fonts):**
   - All typefaces (`Fraunces`, `Nunito`, `Plus Jakarta Sans`) are self-hosted in WOFF2 (`@fontsource` and `public/fonts/`) with zero external font requests.
   - CSS defines native fallbacks (`system-ui, -apple-system, sans-serif` and `Georgia, serif`) for immediate rendering offline.

---

## 4. Atomic Restore and Data Sovereignty

To ensure full data sovereignty without cloud dependency, the app implements structured backup import with native IndexedDB atomic transactions:

1. **Schema Validator (`validateBackupJson`):**
   - Verifies JSON integrity, schema version (`1.0` / `1.1`), required fields (`id`, `subject`, `eventDate`), and date syntax.
   - Deduplicates repeated IDs within the file, preserving the first occurrence.
   - Generates a detailed preview with subject counts and date range before writing.
2. **Merge Mode (`restoreBackupMerge`):**
   - Queries existing keys via `store.getAllKeys()`.
   - Adds only records whose IDs do not exist locally, preserving prior notes and avoiding duplicates.
3. **Full Replace Mode (`restoreBackupReplace`):**
   - Runs `store.clear()` and re-inserts all records inside a single `readwrite` transaction.
   - If any exception occurs during insertion, triggers `tx.abort()`, rolling back all changes via IndexedDB's native transaction guarantee.
   - Requires explicit checkbox confirmation before enabling the action button.

---

## 5. Experimental Assistant (Excluded from This Distribution)

The project maintains an experimental free-text Q&A assistant (evidence retrieval, simulated answers, and optional AI integration) in private development. It was removed from this public distribution because internal testing observed overly reassuring answers to concerning inputs, and neither the clinical content nor the warning-sign criteria have professional review.

- **Separation is temporary:** AI modules may be reopened only after clinical and regulatory reviews, particularly if part of a funded open-source solution.
- **Earlier repository versions** (up to commit `7d43d3f`, October 2026) include an older version of the assistant and gateway with the tab active. They remain in Git history under Apache 2.0 and **must not be used** to advise pregnant people or families.

## 6. Deployment by Other Organizations

- `npm run build` generates `dist/`, which can be served on any static host over HTTPS (required for Service Workers).
- The app requires no environment variables and no backend server.
- Anyone distributing a modified version is responsible for its health content and for the safeguards they keep or remove (see [CONTENT.md](CONTENT.md) and [TRADEMARKS.md](TRADEMARKS.md)).
