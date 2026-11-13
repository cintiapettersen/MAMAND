import React, { useState, useEffect } from 'react';
import {
  Shield,
  ArrowLeft,
  Smartphone,
  UserX,
  Sparkles,
  Sliders,
  EyeOff,
  AlertTriangle,
  Building,
  Globe,
  Printer,
  ChevronDown,
  CheckCircle2
} from 'lucide-react';
import {
  PRIVACY_POLICY_PT,
  PRIVACY_POLICY_EN,
  PrivacyPolicyDocument,
  SimplePrivacyPillar
} from '../data/privacyPolicyData';
import type { SupportedLang } from '../serverTypes.ts';
import { AnalyticsPreferenceControl } from '../components/AnalyticsPreferenceControl';
import type { AnalyticsConsentState } from '../services/analyticsConsent';

interface PrivacyPolicyViewProps {
  onBack: () => void;
  initialLang?: SupportedLang;
  analyticsConsent?: AnalyticsConsentState;
  onChangeAnalyticsConsent?: (decision: 'granted' | 'denied') => void;
}

export const PrivacyPolicyView: React.FC<PrivacyPolicyViewProps> = ({
  onBack,
  initialLang = 'pt-BR',
  analyticsConsent,
  onChangeAnalyticsConsent
}) => {
  const [lang, setLang] = useState<SupportedLang>(initialLang);
  const doc: PrivacyPolicyDocument = lang === 'pt-BR' ? PRIVACY_POLICY_PT : PRIVACY_POLICY_EN;

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [lang]);

  const renderTextWithMailto = (text: string) => {
    const emailRegex = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g;
    const parts = text.split(emailRegex);
    return parts.map((part, i) => {
      if (emailRegex.test(part)) {
        return (
          <a
            key={i}
            href={`mailto:${part}`}
            style={{ color: 'var(--primary)', textDecoration: 'underline', fontWeight: 600 }}
          >
            {part}
          </a>
        );
      }
      return part;
    });
  };

  const renderPillarIcon = (icon: SimplePrivacyPillar['icon']) => {
    switch (icon) {
      case 'device':
        return <Smartphone size={22} color="var(--primary)" />;
      case 'no-account':
        return <UserX size={22} color="var(--primary)" />;
      case 'assistant':
        return <Sparkles size={22} color="var(--primary)" />;
      case 'control':
        return <Sliders size={22} color="var(--primary)" />;
      case 'no-ads':
        return <EyeOff size={22} color="var(--primary)" />;
    }
  };

  return (
    <div
      className="content-area"
      style={{
        paddingTop: '16px',
        paddingBottom: '60px',
        maxWidth: '780px',
        margin: '0 auto'
      }}
    >
      {/* Barra Superior de Ações */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
          paddingBottom: '12px',
          borderBottom: '1px solid var(--border-light)'
        }}
      >
        <button
          type="button"
          onClick={onBack}
          className="btn btn-secondary"
          style={{
            fontSize: '0.84rem',
            padding: '8px 14px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <ArrowLeft size={16} />
          <span>{lang === 'pt-BR' ? 'Voltar ao aplicativo' : 'Back to app'}</span>
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Seletor de Idioma da Política */}
          <div
            style={{
              display: 'inline-flex',
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-light)',
              borderRadius: 'var(--radius-full)',
              padding: '2px'
            }}
          >
            <button
              type="button"
              onClick={() => setLang('pt-BR')}
              style={{
                border: 'none',
                background: lang === 'pt-BR' ? 'var(--primary)' : 'transparent',
                color: lang === 'pt-BR' ? '#FFFFFF' : 'var(--text-muted)',
                fontWeight: lang === 'pt-BR' ? 700 : 500,
                fontSize: '0.78rem',
                padding: '4px 10px',
                borderRadius: 'var(--radius-full)',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              PT-BR
            </button>
            <button
              type="button"
              onClick={() => setLang('en')}
              style={{
                border: 'none',
                background: lang === 'en' ? 'var(--primary)' : 'transparent',
                color: lang === 'en' ? '#FFFFFF' : 'var(--text-muted)',
                fontWeight: lang === 'en' ? 700 : 500,
                fontSize: '0.78rem',
                padding: '4px 10px',
                borderRadius: 'var(--radius-full)',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              EN
            </button>
          </div>

          <button
            type="button"
            onClick={() => window.print()}
            title={lang === 'pt-BR' ? 'Imprimir política' : 'Print policy'}
            style={{
              border: '1px solid var(--border-light)',
              background: 'var(--bg-card)',
              color: 'var(--text-muted)',
              borderRadius: 'var(--radius-full)',
              padding: '7px 10px',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '0.78rem'
            }}
          >
            <Printer size={15} />
            <span className="hide-on-mobile">{lang === 'pt-BR' ? 'Imprimir' : 'Print'}</span>
          </button>
        </div>
      </div>

      {/* Cabeçalho Oficial */}
      <div style={{ textAlign: 'center', marginBottom: '28px' }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: 'var(--primary-light)',
            color: 'var(--primary)',
            padding: '6px 14px',
            borderRadius: 'var(--radius-full)',
            fontSize: '0.82rem',
            fontWeight: 700,
            marginBottom: '12px'
          }}
        >
          <Shield size={16} />
          <span>MAMAND • {lang === 'pt-BR' ? 'Transparência e Privacidade' : 'Transparency & Privacy'}</span>
        </div>

        <h1
          style={{
            fontFamily: 'var(--font-title)',
            fontSize: '1.9rem',
            color: 'var(--text-main)',
            lineHeight: 1.25,
            marginBottom: '8px'
          }}
        >
          {lang === 'pt-BR' ? 'Política de Privacidade' : 'Privacy Policy'}
        </h1>

        <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
          {lang === 'pt-BR' ? 'Versão' : 'Version'} {doc.version} • {lang === 'pt-BR' ? 'Última atualização:' : 'Last updated:'}{' '}
          {doc.lastUpdated}
        </p>
      </div>

      {/* Caixa de Aviso de Responsabilidade Institucional */}
      <div
        className="card"
        style={{
          borderLeft: '4px solid var(--primary)',
          backgroundColor: '#FFFFFF',
          marginBottom: '24px',
          padding: '16px 20px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <Building size={18} color="var(--primary)" />
          <h2 style={{ fontSize: '0.98rem', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>
            {lang === 'pt-BR' ? 'Identificação do Controlador' : 'Data Controller Identification'}
          </h2>
        </div>
        <p style={{ fontSize: '0.86rem', color: 'var(--text-main)', margin: '0 0 6px 0', lineHeight: 1.5 }}>
          <strong>{lang === 'pt-BR' ? 'Razão Social:' : 'Legal Corporate Name:'}</strong>{' '}
          {doc.controller.corporateName}
        </p>
        <p style={{ fontSize: '0.86rem', color: 'var(--text-main)', margin: '0 0 6px 0', lineHeight: 1.5 }}>
          <strong>CNPJ:</strong> {doc.controller.cnpj} • <strong>{lang === 'pt-BR' ? 'País:' : 'Country:'}</strong>{' '}
          {doc.controller.country}
        </p>
        <p style={{ fontSize: '0.86rem', color: 'var(--text-main)', margin: '0 0 6px 0', lineHeight: 1.5 }}>
          <strong>{lang === 'pt-BR' ? 'Canal de Privacidade (Titulares e Proteção de Dados):' : 'Privacy Channel (Data Protection & Rights):'}</strong>{' '}
          <a
            href={`mailto:${doc.controller.privacyEmail}`}
            style={{ color: 'var(--primary)', textDecoration: 'underline', fontWeight: 600 }}
          >
            {doc.controller.privacyEmail}
          </a>
        </p>
        <p style={{ fontSize: '0.86rem', color: 'var(--text-main)', margin: '0 0 6px 0', lineHeight: 1.5 }}>
          <strong>{lang === 'pt-BR' ? 'Contato Geral e Parcerias:' : 'General & Institutional Inquiries:'}</strong>{' '}
          <a
            href={`mailto:${doc.controller.generalEmail}`}
            style={{ color: 'var(--primary)', textDecoration: 'underline', fontWeight: 600 }}
          >
            {doc.controller.generalEmail}
          </a>
        </p>
        <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: '8px 0 4px 0', lineHeight: 1.45 }}>
          {renderTextWithMailto(doc.controller.governanceNotice)}
        </p>
        <p
          style={{
            fontSize: '0.8rem',
            color: 'var(--text-muted)',
            margin: '8px 0 0 0',
            lineHeight: 1.4,
            borderTop: '1px dashed var(--border-light)',
            paddingTop: '8px'
          }}
        >
          {doc.controller.initiativeContextNotice}
        </p>
      </div>

      {/* Resumo de Privacidade em Linguagem Simples */}
      <div
        className="card"
        style={{
          backgroundColor: 'var(--bg-card-muted)',
          border: '1px solid var(--border-light)',
          marginBottom: '32px',
          padding: '22px'
        }}
      >
        <div style={{ marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <CheckCircle2 size={20} color="var(--sage)" />
            <h2
              style={{
                fontSize: '1.2rem',
                fontFamily: 'var(--font-title)',
                margin: 0,
                color: 'var(--text-main)'
              }}
            >
              {doc.summary.title}
            </h2>
          </div>
          <p style={{ fontSize: '0.86rem', color: 'var(--text-muted)', margin: 0 }}>
            {doc.summary.subtitle}
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {doc.summary.pillars.map((pillar, idx) => (
            <div
              key={idx}
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: 'var(--radius-md)',
                padding: '14px 16px',
                border: '1px solid var(--border-light)',
                display: 'flex',
                gap: '14px',
                alignItems: 'flex-start'
              }}
            >
              <div
                style={{
                  padding: '8px',
                  backgroundColor: 'var(--primary-light)',
                  borderRadius: 'var(--radius-sm)',
                  flexShrink: 0
                }}
              >
                {renderPillarIcon(pillar.icon)}
              </div>
              <div>
                <h3 style={{ fontSize: '0.92rem', fontWeight: 700, margin: '0 0 4px 0', color: 'var(--text-main)' }}>
                  {pillar.title}
                </h3>
                <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.45 }}>
                  {pillar.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Disclaimer de Isenção de Certeza Jurídica Definitiva */}
      <div
        style={{
          backgroundColor: '#FAF5EF',
          border: '1px solid #E4D7C5',
          borderRadius: 'var(--radius-md)',
          padding: '14px 18px',
          marginBottom: '28px',
          fontSize: '0.82rem',
          lineHeight: 1.5,
          color: '#5C4A3A'
        }}
      >
        <strong>{lang === 'pt-BR' ? 'Aviso importante:' : 'Important notice:'}</strong> {doc.disclaimerNotice}
      </div>

      {/* Índice de Seções (Table of Contents) */}
      <div
        className="card"
        style={{
          marginBottom: '28px',
          padding: '18px 22px',
          backgroundColor: '#FFFFFF'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
          <ChevronDown size={18} color="var(--primary)" />
          <h2 style={{ fontSize: '0.96rem', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>
            {lang === 'pt-BR' ? 'Índice da Política' : 'Table of Contents'}
          </h2>
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '8px'
          }}
        >
          {doc.sections.map((sec) => (
            <a
              key={sec.id}
              href={`#${sec.id}`}
              style={{
                fontSize: '0.82rem',
                color: 'var(--primary)',
                textDecoration: 'none',
                padding: '4px 6px',
                borderRadius: 'var(--radius-sm)',
                lineHeight: 1.35
              }}
            >
              {sec.title}
            </a>
          ))}
        </div>
      </div>

      {/* Conteúdo Completo das Seções */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
        {doc.sections.map((sec) => (
          <section
            key={sec.id}
            id={sec.id}
            className="card"
            style={{
              padding: '22px',
              backgroundColor: '#FFFFFF',
              border: '1px solid var(--border-light)'
            }}
          >
            <h2
              style={{
                fontFamily: 'var(--font-title)',
                fontSize: '1.18rem',
                color: 'var(--text-main)',
                marginBottom: '14px',
                paddingBottom: '8px',
                borderBottom: '1px solid var(--border-light)'
              }}
            >
              {sec.title}
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {sec.content.map((p, pIdx) => (
                <p
                  key={pIdx}
                  style={{
                    fontSize: '0.87rem',
                    color: 'var(--text-main)',
                    lineHeight: 1.6,
                    margin: 0
                  }}
                >
                  {renderTextWithMailto(p)}
                </p>
              ))}

              {sec.warningBox && (
                <div
                  style={{
                    marginTop: '8px',
                    backgroundColor: '#FEF3C7',
                    borderLeft: '4px solid #D97706',
                    padding: '12px 16px',
                    borderRadius: 'var(--radius-sm)',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '10px',
                    fontSize: '0.83rem',
                    color: '#92400E',
                    lineHeight: 1.45
                  }}
                >
                  <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div>{sec.warningBox}</div>
                </div>
              )}
            </div>
          </section>
        ))}
      </div>

      {/* Preferência de estatísticas de alcance (quando disponível no app) */}
      {analyticsConsent && onChangeAnalyticsConsent && (
        <div style={{ marginTop: '24px' }}>
          <AnalyticsPreferenceControl
            language={lang}
            consent={analyticsConsent}
            onChange={onChangeAnalyticsConsent}
          />
        </div>
      )}

      {/* Rodapé da Política */}
      <div
        style={{
          marginTop: '36px',
          paddingTop: '20px',
          borderTop: '1px solid var(--border-light)',
          textAlign: 'center',
          color: 'var(--text-muted)',
          fontSize: '0.82rem'
        }}
      >
        <p style={{ marginBottom: '14px' }}>
          © 2026 {doc.controller.corporateName}. CNPJ {doc.controller.cnpj}.{' '}
          {lang === 'pt-BR' ? 'Todos os direitos reservados.' : 'All rights reserved.'}
        </p>

        <button
          type="button"
          onClick={onBack}
          className="btn btn-primary"
          style={{
            margin: '0 auto',
            fontSize: '0.88rem',
            padding: '10px 22px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <ArrowLeft size={16} />
          <span>{lang === 'pt-BR' ? 'Voltar ao aplicativo' : 'Back to app'}</span>
        </button>
      </div>
    </div>
  );
};
