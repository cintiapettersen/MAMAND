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

      <EmergencyStrip country={profile.country} />
    </div>
  );
};

export default AskView;
