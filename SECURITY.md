**Language:** English | [Português](docs/pt-BR/SECURITY.md)

# Security Policy & Responsible Vulnerability Disclosure

## Scope and Architecture

**MAMAND** is a static, *local-first* Progressive Web App (PWA):

- User-entered data remains exclusively on the user's device (`IndexedDB` and `localStorage`), with no user accounts or central application database.
- The `gateway/` module is decoupled and **inactive with no active deployment** in the current public operation.
- Unreviewed clinical content and the AI assistant remain disabled in the public app.

## Reporting a Vulnerability

If you discover a security vulnerability, unintended data exposure, or clinical/technical containment regression in MAMAND's public codebase:

1. **Do not** open a public GitHub issue with exploitable details.
2. Report it privately through either channel below:
   - **GitHub Private Vulnerability Reporting** (*Security → Advisories* tab on the repository), when enabled; or
   - **Email:** `hello@mamand.app` (suggested subject: `[SECURITY] Brief description`).
3. Whenever possible, include:
   - Steps to reproduce or affected file/line;
   - Potential impact (e.g., XSS, Service Worker cache leak, local data exposure, or P0 clinical containment regression);
   - Version or commit analyzed.

## Response Commitment

- We will acknowledge receipt within **5 business days**.
- We will assess severity and work on a fix prior to coordinated public disclosure.
- This channel is strictly for technical security and data protection — it does **not** provide medical advice or clinical support.
