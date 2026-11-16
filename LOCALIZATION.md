**Language:** English | [Português](docs/pt-BR/LOCALIZATION.md)

# Internationalization and Localization Guidelines (i18n)

> **Context:** This document defines the bilingual architecture (`en` and `pt-BR`) of **MAMAND** (formerly "Primeiros 1.000 Dias" / *First 1,000 Days*), designed as an open-source digital public good supporting pregnant people, mothers, and caregivers during the child's first 1,000 days.

---

## 1. Localization Principles and Clinical Governance

Translating and localizing a maternal and child health app differs fundamentally from translating conventional utility software:

1. **Separation of Code and Language:**  
   No UI string or care label is hardcoded in rendering logic. All interface copy comes from strongly typed TypeScript dictionaries (`src/locales/`).

2. **Prohibition of Runtime AI Translation:**  
   We do not use generative AI APIs in the background to translate health texts in real time. All health-related translations must be static, deterministic, auditable, and pre-reviewed to prevent terminological hallucinations or unsafe clinical guidance.

3. **Integrity of Official Sources:**  
   Translating content into English **never replaces** its original official source with an arbitrary foreign institution. Original references (such as the Brazilian Ministry of Health and the Brazilian Society of Pediatrics) are preserved and accurately described in English alongside correlated WHO guidelines where applicable.

4. **Transparent Identification of Demonstrative & Unreviewed Content:**  
   Guidance without formal clinical review remains explicitly categorized as `validationStatus: 'demonstrative'` or `'pending_review'` in all languages.

5. **Strict Parity Across Forms and Modals:**  
   All validation messages, privacy notices, irreversible-action confirmations, and backup/restore flows maintain 100% parity between Portuguese and English.

---

## 2. File Structure

```
src/
├── locales/
│   ├── types.ts              # TypeScript type contract (TranslationDictionary)
│   ├── pt-BR.ts              # Brazilian Portuguese dictionary
│   ├── en.ts                 # International English dictionary
│   └── index.ts              # Dictionary provider and formatting helpers
├── context/
│   └── LanguageContext.tsx   # Reactive context with local persistence
├── components/
│   └── LanguageSelector.tsx  # Discreet text selector (PT | EN) without national flags
└── data/
    ├── contents.ts           # Bilingual topic metadata with invariant semantic IDs
    └── checkins.ts           # Bilingual daily check-in questions
```

---

## 3. How to Contribute a New Language

To add a new language (e.g., Spanish `es`, French `fr`, or Indigenous languages):

### Step 1: Create the Dictionary File
Create `src/locales/[code].ts` implementing `TranslationDictionary` from `src/locales/types.ts`. The TypeScript compiler (`tsc`) will verify at build time that every key is present.

### Step 2: Translate Non-Clinical Data Catalogs
In `src/data/contents.ts` and `src/data/checkins.ts`, add the corresponding localized entries preserving the **exact canonical IDs** (`id: 'mom-rest-fragmented'`, etc.).

### Step 3: Health Professional Review
Any health guidance addition must undergo review by a qualified maternal-child health professional or directly cite an official Ministry of Health or multilateral organization guideline.

---

## 4. Alignment with the Digital Public Goods Standard

- **Indicator 5 (Documentation):** Internationalization architecture, data models, and contribution workflows are public and auditable.
- **Indicator 6 (Mechanism for Extracting Data):** Full export in open JSON format and readable TXT summary in the user's active language.
- **Indicator 7 (Privacy & Applicable Laws):** Language preference is stored strictly on the user's device (`localStorage`), without tracking cookies or external server transmission.
- **Indicators 8 & 9 (Standards & Do No Harm):** All content displays explicit disclaimers that the app is educational and does not replace in-person healthcare.
