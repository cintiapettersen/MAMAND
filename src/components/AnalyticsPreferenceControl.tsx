import React from 'react';
import { BarChart3 } from 'lucide-react';
import type { AnalyticsConsentState } from '../services/analyticsConsent';
import type { SupportedLang } from '../serverTypes.ts';

interface AnalyticsPreferenceControlProps {
  language: SupportedLang;
  consent: AnalyticsConsentState;
  onChange: (decision: 'granted' | 'denied') => void;
}

/**
 * Controle reutilizável de preferência de estatísticas agregadas (Aceitar / Recusar)
 * exibido em Editar Perfil e na Política de Privacidade.
 */
export const AnalyticsPreferenceControl: React.FC<AnalyticsPreferenceControlProps> = ({
  language,
  consent,
  onChange
}) => {
  const isPt = language === 'pt-BR';
  const statusLabel =
    consent === 'granted'
      ? isPt
        ? 'Ativadas'
        : 'Enabled'
      : consent === 'denied'
        ? isPt
          ? 'Recusadas (desativadas)'
          : 'Declined (disabled)'
        : isPt
          ? 'Não definido (desativadas por padrão)'
          : 'Not set (disabled by default)';

  return (
    <div
      data-testid="analytics-preference-control"
      style={{
        backgroundColor: 'var(--warm-light)',
        border: '1px solid var(--border-light)',
        borderRadius: 'var(--radius-md)',
        padding: '12px 14px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <BarChart3 size={15} color="var(--primary)" style={{ flexShrink: 0 }} />
        <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-main)' }}>
          {isPt ? 'Estatísticas agregadas de alcance' : 'Aggregate reach statistics'}
        </span>
      </div>
      <p style={{ margin: 0, fontSize: '0.76rem', lineHeight: 1.4, color: 'var(--text-muted)' }}>
        {isPt
          ? 'Contagem anônima de visualizações de página via Vercel Web Analytics, sem cookies e sem acesso aos seus registros familiares.'
          : 'Anonymous page view counting via Vercel Web Analytics, without cookies and without access to your family records.'}
      </p>
      <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-main)' }}>
        <strong>{isPt ? 'Estado atual:' : 'Current status:'}</strong> {statusLabel}
      </p>
      <div style={{ display: 'flex', gap: '8px', marginTop: '2px' }}>
        <button
          type="button"
          onClick={() => onChange('denied')}
          aria-pressed={consent === 'denied'}
          data-testid="analytics-pref-decline"
          style={{
            flex: 1,
            minHeight: '38px',
            padding: '6px 10px',
            borderRadius: 'var(--radius-sm)',
            border:
              consent === 'denied'
                ? '1.5px solid var(--text-main)'
                : '1.5px solid var(--border-medium, #D5C8BE)',
            backgroundColor: consent === 'denied' ? 'var(--bg-card)' : 'var(--bg-main)',
            color: 'var(--text-main)',
            fontSize: '0.8rem',
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          {isPt ? 'Recusar' : 'Decline'}
        </button>
        <button
          type="button"
          onClick={() => onChange('granted')}
          aria-pressed={consent === 'granted'}
          data-testid="analytics-pref-accept"
          style={{
            flex: 1,
            minHeight: '38px',
            padding: '6px 10px',
            borderRadius: 'var(--radius-sm)',
            border:
              consent === 'granted'
                ? '1.5px solid var(--primary)'
                : '1.5px solid var(--border-medium, #D5C8BE)',
            backgroundColor: consent === 'granted' ? 'var(--primary)' : 'var(--bg-main)',
            color: consent === 'granted' ? '#FFFFFF' : 'var(--text-main)',
            fontSize: '0.8rem',
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          {isPt ? 'Aceitar' : 'Accept'}
        </button>
      </div>
    </div>
  );
};
