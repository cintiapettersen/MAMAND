import React from 'react';
import { UserProfile } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { PageHeader } from '../components/PageHeader';
import { getEmergencyContact, langKey } from '../data/emergencyContacts';
import { MessageCircle, PhoneCall, Heart } from 'lucide-react';

// Aba Pergunte na versão pública: só o aviso de suspensão e os contatos de emergência.
// O assistente experimental (busca, respostas e integração com IA) não faz parte desta
// distribuição enquanto aguarda revisão clínica e regulatória; veja o README.

interface AskViewProps {
  profile: UserProfile;
}

export const AskView: React.FC<AskViewProps> = ({ profile }) => {
  const { language, t } = useLanguage();
  const lk = langKey(language);
  const contact = getEmergencyContact(profile.country);
  const emergency = contact ? contact.emergency.label[lk] : t.ask.suspendedEmergencyFallback;

  return (
    <div className="content-area">
      <PageHeader kicker={t.ask.suspendedBadge} icon={<MessageCircle size={13} />} title={t.ask.suspendedTitle} />

      <div className="ask-disclaimer-card" role="status">
        <Heart size={18} color="#C76B50" style={{ flexShrink: 0, marginTop: '2px' }} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-main)', lineHeight: 1.55 }}>{t.ask.suspendedText}</p>
          <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>{t.ask.suspendedCare(emergency)}</p>
        </div>
      </div>

      {contact && (
        <div className="home-emergency-actions" data-testid="ask-emergency-contacts" style={{ marginTop: '14px' }}>
          <a href={`tel:${contact.emergency.number}`} className="alerts-emergency-btn">
            <PhoneCall size={16} />
            <span>
              {t.region.callBtn.replace('{label}', contact.emergency.label[lk])} {t.region.emergencySuffix}
            </span>
          </a>
          {contact.healthLine && (
            <a href={`tel:${contact.healthLine.number}`} className="alerts-disque-btn">
              <span>{contact.healthLine.label[lk]}</span>
            </a>
          )}
        </div>
      )}
    </div>
  );
};

export default AskView;
