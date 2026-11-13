import React from 'react';
import { BarChart3 } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface AnalyticsConsentBannerProps {
  onAccept: () => void;
  onDecline: () => void;
  onOpenPrivacy: () => void;
}

export const AnalyticsConsentBanner: React.FC<AnalyticsConsentBannerProps> = ({
  onAccept,
  onDecline,
  onOpenPrivacy
}) => {
  const { language } = useLanguage();
  const isPt = language === 'pt-BR';

  return (
    <aside
      role="region"
      aria-label={isPt ? 'Preferência de estatísticas de alcance' : 'Reach statistics preference'}
      data-testid="analytics-consent-banner"
      style={{
        position: 'fixed',
        left: '12px',
        right: '12px',
        bottom: '12px',
        zIndex: 850,
        display: 'flex',
        justifyContent: 'center',
        pointerEvents: 'none'
      }}
    >
      <div
        className="card"
        style={{
          pointerEvents: 'auto',
          width: '100%',
          maxWidth: '480px',
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border-light)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: '0 8px 28px rgba(44, 30, 24, 0.14)',
          padding: '14px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
          <BarChart3 size={18} color="var(--primary)" style={{ flexShrink: 0, marginTop: '2px' }} />
          <div style={{ fontSize: '0.8rem', lineHeight: 1.45, color: 'var(--text-main)' }}>
            <strong style={{ display: 'block', marginBottom: '2px', fontSize: '0.84rem' }}>
              {isPt ? 'Estatísticas agregadas de alcance' : 'Aggregate reach statistics'}
            </strong>
            <span>
              {isPt
                ? 'Podemos contar visualizações agregadas de páginas (sem cookies e sem acessar seus registros familiares) para entender o alcance do MAMAND? '
                : 'May we count aggregate page views (without cookies and without accessing your family records) to understand MAMAND’s reach? '}
            </span>
            <button
              type="button"
              onClick={onOpenPrivacy}
              style={{
                background: 'none',
                border: 'none',
                padding: 0,
                color: 'var(--primary)',
                textDecoration: 'underline',
                fontSize: '0.78rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              {isPt ? 'Política de Privacidade' : 'Privacy Policy'}
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            type="button"
            onClick={onDecline}
            data-testid="analytics-consent-decline"
            style={{
              flex: 1,
              minHeight: '40px',
              padding: '8px 12px',
              borderRadius: 'var(--radius-md)',
              border: '1.5px solid var(--border-medium, #D5C8BE)',
              backgroundColor: 'var(--bg-main)',
              color: 'var(--text-main)',
              fontSize: '0.84rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            {isPt ? 'Recusar' : 'Decline'}
          </button>
          <button
            type="button"
            onClick={onAccept}
            data-testid="analytics-consent-accept"
            style={{
              flex: 1,
              minHeight: '40px',
              padding: '8px 12px',
              borderRadius: 'var(--radius-md)',
              border: '1.5px solid var(--primary)',
              backgroundColor: 'var(--primary)',
              color: '#FFFFFF',
              fontSize: '0.84rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            {isPt ? 'Aceitar' : 'Accept'}
          </button>
        </div>
      </div>
    </aside>
  );
};
