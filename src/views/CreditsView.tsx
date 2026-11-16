import React, { useEffect, useState } from 'react';
import {
  ArrowLeft,
  BookOpen,
  Check,
  Copy,
  FileText,
  Globe,
  Info,
  Scale,
  Shield,
  ShieldAlert
} from 'lucide-react';
import { CREDITS_DOC_EN, CREDITS_DOC_PT, CreditsDocument } from '../data/creditsData';
import type { SupportedLang } from '../serverTypes.ts';

interface CreditsViewProps {
  onBack: () => void;
  initialLang?: SupportedLang;
  onOpenPrivacy?: () => void;
}

export const CreditsView: React.FC<CreditsViewProps> = ({
  onBack,
  initialLang = 'pt-BR',
  onOpenPrivacy
}) => {
  const [lang, setLang] = useState<SupportedLang>(initialLang);
  const [copiedKey, setCopiedKey] = useState<'pt' | 'en' | null>(null);
  const doc: CreditsDocument = lang === 'pt-BR' ? CREDITS_DOC_PT : CREDITS_DOC_EN;

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [lang]);

  const handleCopy = async (text: string, key: 'pt' | 'en') => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.setAttribute('readonly', '');
        ta.style.position = 'absolute';
        ta.style.left = '-9999px';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2200);
    } catch {
      // Fallback silencioso se clipboard estiver restrito
    }
  };

  return (
    <main
      className="content-area"
      aria-labelledby="creditsPageTitle"
      style={{
        paddingTop: '16px',
        paddingBottom: '60px',
        maxWidth: '780px',
        margin: '0 auto'
      }}
    >
      {/* Barra superior discreta */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '10px',
          flexWrap: 'wrap',
          marginBottom: '18px'
        }}
      >
        <button
          type="button"
          onClick={onBack}
          className="btn btn-secondary"
          style={{
            width: 'auto',
            minHeight: '38px',
            padding: '0 14px',
            fontSize: '0.84rem',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <ArrowLeft size={16} aria-hidden="true" />
          <span>{doc.backLabel}</span>
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {onOpenPrivacy && (
            <button
              type="button"
              onClick={onOpenPrivacy}
              className="btn btn-secondary"
              style={{
                width: 'auto',
                minHeight: '36px',
                padding: '0 12px',
                fontSize: '0.8rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <Shield size={14} aria-hidden="true" />
              <span>{doc.privacyLinkLabel}</span>
            </button>
          )}

          <div
            role="group"
            aria-label={lang === 'pt-BR' ? 'Idioma da página' : 'Page language'}
            style={{
              display: 'inline-flex',
              borderRadius: 'var(--radius-full)',
              border: '1px solid var(--border-light)',
              backgroundColor: 'var(--bg-card)',
              padding: '2px'
            }}
          >
            <button
              type="button"
              onClick={() => setLang('pt-BR')}
              aria-pressed={lang === 'pt-BR'}
              style={{
                border: 'none',
                borderRadius: 'var(--radius-full)',
                padding: '6px 12px',
                fontSize: '0.78rem',
                fontWeight: 700,
                cursor: 'pointer',
                backgroundColor: lang === 'pt-BR' ? 'var(--primary)' : 'transparent',
                color: lang === 'pt-BR' ? '#fff' : 'var(--text-muted)'
              }}
            >
              PT-BR
            </button>
            <button
              type="button"
              onClick={() => setLang('en')}
              aria-pressed={lang === 'en'}
              style={{
                border: 'none',
                borderRadius: 'var(--radius-full)',
                padding: '6px 12px',
                fontSize: '0.78rem',
                fontWeight: 700,
                cursor: 'pointer',
                backgroundColor: lang === 'en' ? 'var(--primary)' : 'transparent',
                color: lang === 'en' ? '#fff' : 'var(--text-muted)'
              }}
            >
              EN
            </button>
          </div>
        </div>
      </div>

      {/* Cabeçalho */}
      <header className="card" style={{ marginBottom: '16px' }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '0.76rem',
            fontWeight: 700,
            color: 'var(--primary)',
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
            marginBottom: '8px'
          }}
        >
          <Scale size={14} aria-hidden="true" />
          <span>{doc.badge}</span>
        </div>
        <h1
          id="creditsPageTitle"
          style={{
            margin: '0 0 8px',
            fontSize: '1.55rem',
            fontFamily: 'var(--font-serif)',
            color: 'var(--text-main)'
          }}
        >
          {doc.title}
        </h1>
        <p style={{ margin: 0, fontSize: '0.92rem', lineHeight: 1.55, color: 'var(--text-muted)' }}>
          {doc.subtitle}
        </p>
      </header>

      {/* 1. O projeto MAMAND */}
      <section className="card" style={{ marginBottom: '16px' }} aria-labelledby="credits-overview">
        <h2 id="credits-overview" style={{ margin: '0 0 10px', fontSize: '1.08rem', fontFamily: 'var(--font-serif)' }}>
          {doc.overviewTitle}
        </h2>
        {doc.overviewParagraphs.map((p, i) => (
          <p
            key={i}
            style={{
              margin: i === doc.overviewParagraphs.length - 1 ? 0 : '0 0 8px',
              fontSize: '0.9rem',
              lineHeight: 1.55,
              color: 'var(--text-main)'
            }}
          >
            {p}
          </p>
        ))}
      </section>

      {/* 2. Autoria, titularidade e vínculo institucional */}
      <section className="card" style={{ marginBottom: '16px' }} aria-labelledby="credits-governance">
        <h2 id="credits-governance" style={{ margin: '0 0 12px', fontSize: '1.08rem', fontFamily: 'var(--font-serif)' }}>
          {doc.governanceTitle}
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {doc.governanceItems.map((item) => (
            <div
              key={item.label}
              style={{
                padding: '10px 12px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'var(--bg-soft, #FAF7F2)',
                border: '1px solid var(--border-light)'
              }}
            >
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '4px' }}>
                {item.label}
              </div>
              <div style={{ fontSize: '0.88rem', lineHeight: 1.5, color: 'var(--text-main)' }}>{item.value}</div>
            </div>
          ))}
        </div>
      </section>

      {/* 3. Licença do código-fonte */}
      <section className="card" style={{ marginBottom: '16px' }} aria-labelledby="credits-software-license">
        <h2
          id="credits-software-license"
          style={{ margin: '0 0 10px', fontSize: '1.08rem', fontFamily: 'var(--font-serif)' }}
        >
          {doc.softwareLicenseTitle}
        </h2>
        {doc.softwareLicenseParagraphs.map((p, i) => (
          <p
            key={i}
            style={{
              margin: i === doc.softwareLicenseParagraphs.length - 1 ? 0 : '0 0 8px',
              fontSize: '0.9rem',
              lineHeight: 1.55,
              color: 'var(--text-main)'
            }}
          >
            {p}
          </p>
        ))}
      </section>

      {/* 4. Proposta de licenciamento CC BY 4.0 (não vigente) */}
      <section
        className="card"
        style={{ marginBottom: '16px', border: '1px solid rgba(199, 107, 80, 0.35)' }}
        aria-labelledby="credits-proposed-content"
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: '8px',
            flexWrap: 'wrap',
            marginBottom: '10px'
          }}
        >
          <h2
            id="credits-proposed-content"
            style={{ margin: 0, fontSize: '1.08rem', fontFamily: 'var(--font-serif)' }}
          >
            {doc.proposedContentTitle}
          </h2>
          <span
            style={{
              fontSize: '0.74rem',
              fontWeight: 700,
              color: '#8B4A16',
              backgroundColor: 'rgba(199, 107, 80, 0.14)',
              padding: '4px 10px',
              borderRadius: '999px'
            }}
          >
            {doc.proposedStatusBadge}
          </span>
        </div>

        <div
          role="note"
          style={{
            display: 'flex',
            gap: '10px',
            alignItems: 'flex-start',
            padding: '10px 12px',
            borderRadius: 'var(--radius-sm)',
            backgroundColor: 'rgba(199, 107, 80, 0.08)',
            marginBottom: '12px'
          }}
        >
          <Info size={18} color="#C76B50" style={{ flexShrink: 0, marginTop: '2px' }} aria-hidden="true" />
          <p style={{ margin: 0, fontSize: '0.86rem', lineHeight: 1.5, color: 'var(--text-main)' }}>
            {doc.proposedStatusNotice}
          </p>
        </div>

        <p style={{ margin: '0 0 10px', fontSize: '0.88rem', lineHeight: 1.5, color: 'var(--text-main)' }}>
          {doc.proposedScopeIntro}
        </p>

        <ul style={{ margin: '0 0 12px', paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {doc.proposedFiles.map((file) => (
            <li key={file.path} style={{ fontSize: '0.86rem', lineHeight: 1.45, color: 'var(--text-main)' }}>
              <code style={{ fontSize: '0.82rem', fontWeight: 700 }}>{file.path}</code> — {file.description}
            </li>
          ))}
        </ul>

        <p style={{ margin: '0 0 14px', fontSize: '0.83rem', lineHeight: 1.45, color: 'var(--text-muted)' }}>
          {doc.uiTextsNote}
        </p>

        {/* Declaração estruturada */}
        <div
          style={{
            padding: '12px',
            borderRadius: 'var(--radius-sm)',
            backgroundColor: 'var(--bg-soft, #FAF7F2)',
            border: '1px solid var(--border-light)',
            marginBottom: '12px'
          }}
        >
          <div style={{ fontSize: '0.86rem', fontWeight: 700, marginBottom: '8px', color: 'var(--text-main)' }}>
            {doc.declarationTitle}
          </div>
          <dl style={{ margin: 0, display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {doc.declarationFields.map((f) => (
              <div key={f.label} style={{ fontSize: '0.84rem', lineHeight: 1.45 }}>
                <dt style={{ display: 'inline', fontWeight: 700, color: 'var(--text-main)' }}>{f.label}: </dt>
                <dd style={{ display: 'inline', margin: 0, color: 'var(--text-muted)' }}>{f.value}</dd>
              </div>
            ))}
          </dl>
          <p style={{ margin: '10px 0 0', fontSize: '0.83rem', lineHeight: 1.45, color: 'var(--text-main)' }}>
            {doc.reuseClarification}
          </p>
        </div>

        {/* Exemplos de atribuição fáceis de copiar (PT e EN) */}
        <div style={{ fontSize: '0.84rem', fontWeight: 700, marginBottom: '8px', color: 'var(--text-main)' }}>
          {doc.attributionExampleLabel}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {[
            { key: 'pt' as const, label: 'PT-BR', text: doc.attributionExamplePt },
            { key: 'en' as const, label: 'EN', text: doc.attributionExampleEn }
          ].map((ex) => (
            <div
              key={ex.key}
              style={{
                padding: '10px 12px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-light)',
                backgroundColor: '#fff',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>{ex.label}</span>
                <button
                  type="button"
                  onClick={() => handleCopy(ex.text, ex.key)}
                  className="btn btn-secondary"
                  style={{
                    width: 'auto',
                    minHeight: '30px',
                    padding: '0 10px',
                    fontSize: '0.76rem',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px'
                  }}
                >
                  {copiedKey === ex.key ? (
                    <>
                      <Check size={13} aria-hidden="true" />
                      <span>{doc.copiedBtnLabel}</span>
                    </>
                  ) : (
                    <>
                      <Copy size={13} aria-hidden="true" />
                      <span>{doc.copyBtnLabel}</span>
                    </>
                  )}
                </button>
              </div>
              <code
                style={{
                  fontSize: '0.8rem',
                  lineHeight: 1.45,
                  color: 'var(--text-main)',
                  wordBreak: 'break-word'
                }}
              >
                {ex.text}
              </code>
            </div>
          ))}
          <span className="sr-only" aria-live="polite" style={{ position: 'absolute', left: '-9999px' }}>
            {copiedKey ? doc.copiedBtnLabel : ''}
          </span>
        </div>
      </section>

      {/* 5. Exclusões e proteção */}
      <section className="card" style={{ marginBottom: '16px' }} aria-labelledby="credits-exclusions">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <ShieldAlert size={18} color="#C76B50" aria-hidden="true" />
          <h2 id="credits-exclusions" style={{ margin: 0, fontSize: '1.08rem', fontFamily: 'var(--font-serif)' }}>
            {doc.exclusionsTitle}
          </h2>
        </div>
        <p style={{ margin: '0 0 10px', fontSize: '0.88rem', lineHeight: 1.5, color: 'var(--text-main)' }}>
          {doc.exclusionsIntro}
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {doc.exclusionsList.map((ex) => (
            <div
              key={ex.category}
              style={{
                padding: '10px 12px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'var(--bg-soft, #FAF7F2)',
                border: '1px solid var(--border-light)'
              }}
            >
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '3px' }}>
                {ex.category}
              </div>
              <div style={{ fontSize: '0.83rem', lineHeight: 1.45, color: 'var(--text-muted)' }}>{ex.detail}</div>
            </div>
          ))}
        </div>
      </section>

      {/* 6. Créditos e licenças de terceiros */}
      <section className="card" style={{ marginBottom: '16px' }} aria-labelledby="credits-third-party">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <FileText size={18} color="var(--primary)" aria-hidden="true" />
          <h2 id="credits-third-party" style={{ margin: 0, fontSize: '1.08rem', fontFamily: 'var(--font-serif)' }}>
            {doc.thirdPartyTitle}
          </h2>
        </div>
        <p style={{ margin: '0 0 12px', fontSize: '0.88rem', lineHeight: 1.5, color: 'var(--text-main)' }}>
          {doc.thirdPartyIntro}
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '14px' }}>
          {[...doc.thirdPartyLibraries, ...doc.thirdPartyFonts].map((lib) => (
            <div
              key={lib.name}
              style={{
                padding: '9px 12px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-light)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '10px',
                flexWrap: 'wrap'
              }}
            >
              <div style={{ fontSize: '0.84rem', lineHeight: 1.4 }}>
                <strong>{lib.name}</strong> {lib.version ? `(${lib.version})` : ''} — {lib.license} ·{' '}
                <span style={{ color: 'var(--text-muted)' }}>{lib.holder}</span>
              </div>
              <a
                href={lib.noticePath}
                target="_blank"
                rel="noopener noreferrer"
                style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--primary)', textDecoration: 'underline' }}
              >
                {lib.noticePath}
              </a>
            </div>
          ))}
        </div>

        <div
          style={{
            padding: '10px 12px',
            borderRadius: 'var(--radius-sm)',
            backgroundColor: 'var(--bg-soft, #FAF7F2)',
            border: '1px solid var(--border-light)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
            <BookOpen size={14} color="var(--primary)" aria-hidden="true" />
            <strong style={{ fontSize: '0.84rem', color: 'var(--text-main)' }}>{doc.sourcesNoteTitle}</strong>
          </div>
          <p style={{ margin: 0, fontSize: '0.82rem', lineHeight: 1.45, color: 'var(--text-muted)' }}>
            {doc.sourcesNoteText}
          </p>
        </div>
      </section>

      <footer
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '10px',
          flexWrap: 'wrap',
          paddingTop: '8px',
          fontSize: '0.78rem',
          color: 'var(--text-muted)'
        }}
      >
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
          <Globe size={13} aria-hidden="true" />
          <span>MAMAND · Copyright 2026 Cintia Pettersen</span>
        </span>
        <button
          type="button"
          onClick={onBack}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--primary)',
            fontSize: '0.78rem',
            fontWeight: 600,
            cursor: 'pointer',
            textDecoration: 'underline',
            padding: 0
          }}
        >
          {doc.backLabel}
        </button>
      </footer>
    </main>
  );
};

export default CreditsView;
