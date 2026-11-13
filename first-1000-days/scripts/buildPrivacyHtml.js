import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PRIVACY_POLICY_PT, PRIVACY_POLICY_EN } from '../src/data/privacyPolicyData.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const targetPath = path.resolve(__dirname, '../public/privacy.html');

function renderDocument(doc, lang) {
  const isPt = lang === 'pt-BR';
  const tocItems = doc.sections.map((s, idx) => `
          <a href="#${lang}-${idx + 1}">${s.title}</a>`).join('');

  const pillarsHtml = doc.summary.pillars.map((p, idx) => `
          <div class="pillar-item">
            <div class="pillar-title">${idx + 1}. ${escapeHtml(p.title)}</div>
            <div class="pillar-desc">${escapeHtml(p.description)}</div>
          </div>`).join('');

  const sectionsHtml = doc.sections.map((s, idx) => {
    const paragraphsHtml = s.content.map(p => `        <p>${formatParagraph(p)}</p>`).join('\n');
    const warningHtml = s.warningBox ? `
        <div class="warning-box">
          <strong>${isPt ? 'Aviso importante:' : 'Important notice:'}</strong> ${escapeHtml(s.warningBox)}
        </div>` : '';

    return `      <section class="card" id="${lang}-${idx + 1}">
        <h2>${escapeHtml(s.title)}</h2>
${paragraphsHtml}${warningHtml}
      </section>`;
  }).join('\n\n');

  return `    <!-- VERSÃO ${lang.toUpperCase()} -->
    <div data-lang="${lang}">
      <div class="header-box">
        <span class="badge">MAMAND • ${isPt ? 'Transparência e Privacidade' : 'Transparency & Privacy'}</span>
        <h1>${isPt ? 'Política de Privacidade' : 'Privacy Policy'}</h1>
        <p class="meta">${isPt ? 'Versão' : 'Version'} ${doc.version} • ${isPt ? 'Última atualização:' : 'Last updated:'} ${doc.lastUpdated}</p>
      </div>

      <!-- Identificação Institucional -->
      <div class="card card-controller">
        <h2 style="font-size: 1.05rem; margin-bottom: 8px;">${isPt ? 'Identificação do Controlador' : 'Data Controller Identification'}</h2>
        <p><strong>${isPt ? 'Razão Social Responsável:' : 'Legal Corporate Name:'}</strong> ${escapeHtml(doc.controller.corporateName)}</p>
        <p><strong>CNPJ:</strong> ${escapeHtml(doc.controller.cnpj)} • <strong>${isPt ? 'País:' : 'Country:'}</strong> ${escapeHtml(doc.controller.country)}</p>
        <p><strong>${isPt ? 'Canal de Privacidade (Titulares e Proteção de Dados):' : 'Privacy Channel (Data Protection & Rights):'}</strong> <a href="mailto:${escapeHtml(doc.controller.privacyEmail)}" style="color: var(--primary); text-decoration: underline; font-weight: 600;">${escapeHtml(doc.controller.privacyEmail)}</a></p>
        <p><strong>${isPt ? 'Contato Geral e Parcerias:' : 'General & Institutional Inquiries:'}</strong> <a href="mailto:${escapeHtml(doc.controller.generalEmail)}" style="color: var(--primary); text-decoration: underline; font-weight: 600;">${escapeHtml(doc.controller.generalEmail)}</a></p>
        <p style="font-size: 0.84rem; color: var(--text-muted); margin-top: 8px; line-height: 1.45;">
          ${escapeHtml(doc.controller.governanceNotice).replace(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g, '<a href="mailto:$1" style="color: var(--primary); text-decoration: underline; font-weight: 600;">$1</a>')}
        </p>
        <p style="font-size: 0.8rem; color: var(--text-muted); margin-top: 8px; border-top: 1px dashed var(--border-light); padding-top: 8px;">
          ${escapeHtml(doc.controller.initiativeContextNotice)}
        </p>
      </div>

      <!-- Resumo em Linguagem Simples -->
      <div class="card" style="background: var(--bg-card-muted);">
        <h2 style="border: none; margin-bottom: 2px;">${escapeHtml(doc.summary.title)}</h2>
        <p style="color: var(--text-muted); font-size: 0.86rem;">${escapeHtml(doc.summary.subtitle)}</p>
        <div class="pillar-grid">${pillarsHtml}
        </div>
      </div>

      <!-- Disclaimer de Certeza Jurídica -->
      <div class="disclaimer-card">
        <strong>${isPt ? 'Aviso importante:' : 'Important notice:'}</strong> ${escapeHtml(doc.disclaimerNotice)}
      </div>

      <!-- Índice da Política -->
      <div class="card toc-card">
        <h2 style="font-size: 1rem; border: none; margin-bottom: 6px;">${isPt ? 'Índice da Política' : 'Table of Contents'}</h2>
        <div class="toc">${tocItems}
        </div>
      </div>

      <!-- Seções Completas -->
${sectionsHtml}
    </div>`;
}

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function formatParagraph(p) {
  // Converte marcadores em negrito comuns
  let out = escapeHtml(p);
  // Torna e-mails clicáveis via mailto:
  out = out.replace(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g, '<a href="mailto:$1" style="color: var(--primary); text-decoration: underline; font-weight: 600;">$1</a>');
  // Negrito para letras de alíneas ou prefixos conhecidos
  out = out.replace(/^(•\s*[^:]+:)/, '<strong>$1</strong>');
  out = out.replace(/^([a-z]\)\s*[^:]+:)/, '<strong>$1</strong>');
  out = out.replace(/^(IMPORTANTE\s*—[^:]+:)/, '<strong>$1</strong>');
  out = out.replace(/^(Ao confirmar a exclusão:)/, '<strong>$1</strong>');
  out = out.replace(/^(Preservação de arquivos[^:]+:)/, '<strong>$1</strong>');
  out = out.replace(/^(Limitações perante fornecedores[^:]+:)/, '<strong>$1</strong>');
  out = out.replace(/^(Preservação do shell offline:)/, '<strong>$1</strong>');
  out = out.replace(/^(Upon confirming erasure:)/, '<strong>$1</strong>');
  out = out.replace(/^(Limitations regarding infrastructure providers:)/, '<strong>$1</strong>');
  out = out.replace(/^(Preservation of offline app shell:)/, '<strong>$1</strong>');
  out = out.replace(/^(Preservation of downloaded files:)/, '<strong>$1</strong>');
  out = out.replace(/^(Governança e canais oficiais de comunicação:)/, '<strong>$1</strong>');
  out = out.replace(/^(Governance and official communication channels:)/, '<strong>$1</strong>');
  out = out.replace(/^(Governança e canal direto de privacidade:)/, '<strong>$1</strong>');
  out = out.replace(/^(Governance and direct privacy channel:)/, '<strong>$1</strong>');
  out = out.replace(/^(Nota de contexto e governança:)/, '<strong>$1</strong>');
  out = out.replace(/^(Governance and lineage context:)/, '<strong>$1</strong>');
  out = out.replace(/^(Canal direto e funcional de privacidade:)/, '<strong>$1</strong>');
  out = out.replace(/^(Direct and functional privacy channel:)/, '<strong>$1</strong>');
  out = out.replace(/^(Minimização estrita dos quatro campos transmitidos ao Gateway:)/, '<strong>$1</strong>');
  out = out.replace(/^(Strict data minimization across the four fields transmitted to the Gateway:)/, '<strong>$1</strong>');
  out = out.replace(/^(Filtros automáticos de privacidade \(PII Scrubber\) e limitações inerentes:)/, '<strong>$1</strong>');
  out = out.replace(/^(Automated privacy filter \(PII Scrubber\) and inherent limitations:)/, '<strong>$1</strong>');
  out = out.replace(/^(Processamento pelo Google Gemini quando ativado:)/, '<strong>$1</strong>');
  out = out.replace(/^(Google Gemini processing when active:)/, '<strong>$1</strong>');
  out = out.replace(/^(Exercício direto e autônomo de direitos:)/, '<strong>$1</strong>');
  out = out.replace(/^(Direct and autonomous exercise of rights:)/, '<strong>$1</strong>');
  out = out.replace(/^(Recomendações de segurança:)/, '<strong>$1</strong>');
  out = out.replace(/^(Security recommendations:)/, '<strong>$1</strong>');
  return out;
}

const htmlContent = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover" />
  <meta name="theme-color" content="#FAF7F2" />
  <meta name="description" content="Política de Privacidade e Proteção de Dados do MAMAND — Princípio Local-First e Minimização Estrita." />
  <title>Política de Privacidade — MAMAND</title>
  <link rel="icon" type="image/svg+xml" href="/icon-192.svg" />
  <link rel="apple-touch-icon" href="/icon-192.svg" />
  <style>
    @font-face {
      font-family: 'Fraunces';
      font-style: normal;
      font-weight: 500 700;
      font-display: swap;
      src: url('/fonts/fraunces-latin.woff2') format('woff2');
      unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD;
    }
    @font-face {
      font-family: 'Plus Jakarta Sans';
      font-style: normal;
      font-weight: 400 800;
      font-display: swap;
      src: url('/fonts/plus-jakarta-sans-latin.woff2') format('woff2');
      unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD;
    }

    :root {
      --font-body: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif;
      --font-title: 'Fraunces', Georgia, serif;
      --bg-app: #FAF7F2;
      --bg-card: #FFFFFF;
      --bg-card-muted: #F3EEE7;
      --primary: #C76B50;
      --primary-light: #FBF0EB;
      --primary-hover: #B55B40;
      --sage: #6B8E7C;
      --sage-light: #EEF4F0;
      --text-main: #2C2825;
      --text-muted: #736C65;
      --border-light: #EBE4DA;
      --radius-sm: 8px;
      --radius-md: 14px;
      --radius-lg: 20px;
      --radius-full: 9999px;
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      background-color: var(--bg-app);
      font-family: var(--font-body);
      color: var(--text-main);
      line-height: 1.6;
      padding: 20px 16px 60px;
    }

    .container {
      max-width: 800px;
      margin: 0 auto;
    }

    .nav-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
      padding-bottom: 12px;
      border-bottom: 1px solid var(--border-light);
    }

    .btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 8px 16px;
      border-radius: var(--radius-md);
      font-size: 0.86rem;
      font-weight: 600;
      text-decoration: none;
      cursor: pointer;
      transition: background-color 0.15s ease;
    }

    .btn-secondary {
      background-color: var(--bg-card);
      color: var(--text-main);
      border: 1px solid var(--border-light);
    }

    .btn-secondary:hover {
      background-color: var(--bg-card-muted);
    }

    .btn-primary {
      background-color: var(--primary);
      color: #FFFFFF;
      border: none;
    }

    .btn-primary:hover {
      background-color: var(--primary-hover);
    }

    .lang-switcher {
      display: inline-flex;
      background: var(--bg-card);
      border: 1px solid var(--border-light);
      border-radius: var(--radius-full);
      padding: 2px;
    }

    .lang-btn {
      border: none;
      background: transparent;
      padding: 4px 10px;
      font-size: 0.78rem;
      border-radius: var(--radius-full);
      cursor: pointer;
      color: var(--text-muted);
      font-weight: 600;
    }

    .lang-btn.active {
      background: var(--primary);
      color: #FFFFFF;
    }

    .header-box {
      text-align: center;
      margin-bottom: 28px;
    }

    .badge {
      display: inline-block;
      background: var(--primary-light);
      color: var(--primary);
      font-size: 0.8rem;
      font-weight: 700;
      padding: 4px 12px;
      border-radius: var(--radius-full);
      margin-bottom: 10px;
    }

    h1 {
      font-family: var(--font-title);
      font-size: 2rem;
      margin-bottom: 6px;
      color: var(--text-main);
    }

    .meta {
      color: var(--text-muted);
      font-size: 0.88rem;
    }

    .card {
      background: var(--bg-card);
      border-radius: var(--radius-lg);
      border: 1px solid var(--border-light);
      padding: 22px;
      margin-bottom: 20px;
    }

    .card-controller {
      border-left: 4px solid var(--primary);
    }

    .pillar-grid {
      display: flex;
      flex-direction: column;
      gap: 12px;
      margin-top: 14px;
    }

    .pillar-item {
      background: #FFFFFF;
      border: 1px solid var(--border-light);
      border-radius: var(--radius-md);
      padding: 14px 16px;
    }

    .pillar-title {
      font-size: 0.94rem;
      font-weight: 700;
      margin-bottom: 4px;
      color: var(--text-main);
    }

    .pillar-desc {
      font-size: 0.85rem;
      color: var(--text-muted);
      line-height: 1.45;
    }

    .warning-box {
      background-color: #FEF3C7;
      border-left: 4px solid #D97706;
      padding: 12px 16px;
      border-radius: var(--radius-sm);
      font-size: 0.83rem;
      color: #92400E;
      line-height: 1.45;
      margin-top: 12px;
    }

    .disclaimer-card {
      background-color: #FAF5EF;
      border: 1px solid #E4D7C5;
      border-radius: var(--radius-md);
      padding: 14px 18px;
      font-size: 0.82rem;
      line-height: 1.5;
      color: #5C4A3A;
      margin-bottom: 24px;
    }

    .toc {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
      gap: 8px;
      margin-top: 10px;
    }

    .toc a {
      color: var(--primary);
      text-decoration: none;
      font-size: 0.83rem;
      padding: 3px 0;
    }

    .toc a:hover {
      text-decoration: underline;
    }

    section h2 {
      font-family: var(--font-title);
      font-size: 1.22rem;
      margin-bottom: 12px;
      padding-bottom: 8px;
      border-bottom: 1px solid var(--border-light);
    }

    section p {
      font-size: 0.88rem;
      margin-bottom: 10px;
      line-height: 1.6;
    }

    footer {
      text-align: center;
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid var(--border-light);
      color: var(--text-muted);
      font-size: 0.82rem;
    }

    [data-lang="en"] {
      display: none;
    }

    @media print {
      .nav-bar, .lang-switcher, .toc-card, footer .btn {
        display: none !important;
      }
      body {
        background: #FFFFFF !important;
        color: #000000 !important;
        padding: 0;
      }
      .card {
        border: none !important;
        padding: 10px 0 !important;
        page-break-inside: avoid;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="nav-bar">
      <a href="/" class="btn btn-secondary">
        ← <span data-lang="pt-BR">Voltar ao MAMAND</span><span data-lang="en">Back to MAMAND</span>
      </a>

      <div style="display: flex; gap: 8px; align-items: center;">
        <div class="lang-switcher">
          <button type="button" class="lang-btn active" id="btn-pt" onclick="setLanguage('pt-BR')">PT-BR</button>
          <button type="button" class="lang-btn" id="btn-en" onclick="setLanguage('en')">EN</button>
        </div>
        <button type="button" class="btn btn-secondary" onclick="window.print()" style="padding: 6px 12px; font-size: 0.78rem;">
          <span data-lang="pt-BR">Imprimir</span><span data-lang="en">Print</span>
        </button>
      </div>
    </div>

${renderDocument(PRIVACY_POLICY_PT, 'pt-BR')}

${renderDocument(PRIVACY_POLICY_EN, 'en')}

    <!-- RODAPÉ -->
    <footer>
      <p>© 2026 ${escapeHtml(PRIVACY_POLICY_PT.controller.corporateName)}. CNPJ ${escapeHtml(PRIVACY_POLICY_PT.controller.cnpj)}. <span data-lang="pt-BR">Todos os direitos reservados.</span><span data-lang="en">All rights reserved.</span></p>
      <div style="margin-top: 14px;">
        <a href="/" class="btn btn-primary">
          ← <span data-lang="pt-BR">Voltar ao MAMAND</span><span data-lang="en">Back to MAMAND</span>
        </a>
      </div>
    </footer>
  </div>

  <script>
    function setLanguage(lang) {
      document.querySelectorAll('[data-lang]').forEach(function(el) {
        if (el.getAttribute('data-lang') === lang) {
          el.style.display = el.tagName === 'SPAN' ? 'inline' : 'block';
        } else {
          el.style.display = 'none';
        }
      });

      document.getElementById('btn-pt').classList.toggle('active', lang === 'pt-BR');
      document.getElementById('btn-en').classList.toggle('active', lang === 'en');
      document.documentElement.lang = lang;
    }

    (function init() {
      var urlParams = new URLSearchParams(window.location.search);
      var langParam = urlParams.get('lang');
      var savedLang = null;
      try {
        savedLang = localStorage.getItem('first_1000_days_lang');
      } catch (e) {}

      var defaultLang = (langParam === 'en' || (!langParam && (savedLang === 'en' || (!savedLang && navigator.language && navigator.language.startsWith('en'))))) ? 'en' : 'pt-BR';
      setLanguage(defaultLang);
    })();
  </script>
</body>
</html>
`;

fs.writeFileSync(targetPath, htmlContent, 'utf-8');
console.log(`[buildPrivacyHtml] Generated ${targetPath} successfully.`);
