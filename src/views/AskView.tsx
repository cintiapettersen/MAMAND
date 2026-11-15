import React from 'react';
import { MessageCircle, ShieldAlert } from 'lucide-react';
import type { UserProfile } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { PageHeader } from '../components/PageHeader';
import { EmergencyStrip } from '../components/EmergencyStrip';
import { getEmergencyContact, langKey } from '../data/emergencyContacts';

interface AskViewProps {
  profile: UserProfile;
}

export const AskView: React.FC<AskViewProps> = ({ profile }) => {
  const { language, t } = useLanguage();
  const contact = getEmergencyContact(profile.country);
  const emergencyLabel = contact
    ? contact.emergency.label[langKey(language)]
    : t.ask.suspendedEmergencyFallback;

  return (
    <div className="content-area">
      <PageHeader
        kicker={t.ask.suspendedBadge}
        icon={<MessageCircle size={13} />}
        title={t.ask.suspendedTitle}
        subtitle={t.ask.suspendedText}
      />

      <section className="card" style={{ marginBottom: '16px' }} data-testid="ask-suspended-notice">
        <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
          <ShieldAlert size={20} color="#C76B50" style={{ flexShrink: 0, marginTop: '2px' }} aria-hidden="true" />
          <p style={{ margin: 0, fontSize: '0.92rem', lineHeight: 1.55, color: 'var(--text-main)' }}>
            {t.ask.suspendedCare(emergencyLabel)}
          </p>
        </div>
      </section>

      <section
        className="card"
        style={{ marginBottom: '16px', opacity: 0.78 }}
        aria-disabled="true"
        data-testid="ask-disabled-preview"
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', gap: '8px' }}>
          <label
            htmlFor="askDisabledPreviewInput"
            style={{ fontSize: '0.86rem', fontWeight: 700, color: 'var(--text-main)' }}
          >
            {t.ask.inputTitle}
          </label>
          <span
            style={{
              fontSize: '0.72rem',
              fontWeight: 600,
              color: '#99631E',
              backgroundColor: 'rgba(199, 107, 80, 0.1)',
              padding: '2px 8px',
              borderRadius: '999px'
            }}
          >
            {language === 'en' ? 'Under review' : 'Em revisão'}
          </span>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <input
            id="askDisabledPreviewInput"
            type="text"
            disabled
            readOnly
            value=""
            placeholder={t.ask.inputPlaceholder}
            style={{
              flex: 1,
              minHeight: '42px',
              padding: '10px 12px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-light)',
              backgroundColor: 'var(--bg-soft, #f7f4f0)',
              color: 'var(--text-muted)',
              fontSize: '0.88rem',
              cursor: 'not-allowed'
            }}
          />
          <button
            type="button"
            disabled
            className="btn btn-secondary"
            style={{ width: 'auto', minHeight: '42px', padding: '0 16px', cursor: 'not-allowed' }}
          >
            {t.ask.consultBtn}
          </button>
        </div>
      </section>

      <EmergencyStrip country={profile.country} />
    </div>
  );
};

export default AskView;
