import React from 'react';
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
        left: 'max(10px, env(safe-area-inset-left))',
        right: 'max(10px, env(safe-area-inset-right))',
        bottom: 'max(8px, env(safe-area-inset-bottom))',
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
          maxWidth: '440px',
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border-light)',
          borderRadius: 'var(--radius-md)',
          boxShadow: '0 6px 20px rgba(44, 30, 24, 0.12)',
          padding: '10px 12px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px'
        }}
      >
        <p
          style={{
            margin: 0,
            fontSize: '0.76rem',
            lineHeight: 1.38,
            color: 'var(--text-main)'
          }}
        >
          {isPt
            ? 'Podemos contar visitas ao MAMAND, sem cookies e sem acessar seus registros? '
            : 'May we count visits to MAMAND, without cookies or accessing your records? '}
          <button
            type="button"
            onClick={onOpenPrivacy}
            style={{
              background: 'none',
              border: 'none',
              padding: 0,
              color: 'var(--primary)',
              textDecoration: 'underline',
              fontSize: '0.74rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            {isPt ? 'Saiba mais' : 'Learn more'}
          </button>
        </p>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            type="button"
            onClick={onDecline}
            data-testid="analytics-consent-decline"
            style={{
              flex: 1,
              minHeight: '34px',
              padding: '6px 10px',
              borderRadius: 'var(--radius-sm)',
              border: '1.5px solid var(--border-medium, #D5C8BE)',
              backgroundColor: 'var(--bg-main)',
              color: 'var(--text-main)',
              fontSize: '0.78rem',
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
              minHeight: '34px',
              padding: '6px 10px',
              borderRadius: 'var(--radius-sm)',
              border: '1.5px solid var(--primary)',
              backgroundColor: 'var(--primary)',
              color: '#FFFFFF',
              fontSize: '0.78rem',
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
