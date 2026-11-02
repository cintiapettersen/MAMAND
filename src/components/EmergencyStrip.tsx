import React, { useState } from 'react';
import { PhoneCall, ChevronDown, ChevronUp } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { getEmergencyContact, langKey } from '../data/emergencyContacts';

// Faixa compacta de emergência da tela Hoje. A ligação para a emergência médica do país
// fica sempre visível, a um toque. Tocar no texto mostra os outros contatos, separando
// emergência de canais que não são de emergência. Sem critérios clínicos.

interface EmergencyStripProps {
  country?: string;
  // Conteúdo extra na área aberta (no branch privado: acesso ao painel em revisão, só no desenvolvimento)
  extra?: React.ReactNode;
}

export const EmergencyStrip: React.FC<EmergencyStripProps> = ({ country, extra }) => {
  const { language, t } = useLanguage();
  const lk = langKey(language);
  const contact = getEmergencyContact(country);
  const [open, setOpen] = useState(false);

  return (
    <section className="emergency-strip" data-testid="home-emergency-card" aria-label={t.today.emergencyStripTitle}>
      <div className="emergency-strip-row">
        <button
          type="button"
          className="emergency-strip-toggle"
          aria-expanded={open}
          aria-controls="emergency-strip-details"
          onClick={() => setOpen((o) => !o)}
        >
          <PhoneCall size={16} aria-hidden="true" className="emergency-strip-icon" />
          <span className="emergency-strip-text">
            <span className="emergency-strip-title">{t.today.emergencyStripTitle}</span>
            <span className="emergency-strip-service">
              {contact ? t.today.emergencyStripService(contact.emergency.label[lk]) : t.region.genericEmergency}
            </span>
          </span>
          {open ? <ChevronUp size={16} aria-hidden="true" /> : <ChevronDown size={16} aria-hidden="true" />}
          <span className="sr-only">{open ? t.today.emergencyHideContacts : t.today.emergencyShowContacts}</span>
        </button>
        {contact && (
          <a
            href={`tel:${contact.emergency.number}`}
            className="emergency-strip-call"
            data-testid="emergency-call"
            aria-label={`${t.region.callBtn.replace('{label}', contact.emergency.label[lk])} ${t.region.emergencySuffix}`}
          >
            {t.today.emergencyCallShort(contact.emergency.number)}
          </a>
        )}
      </div>

      {open && (
        <div id="emergency-strip-details" className="emergency-strip-details">
          {contact ? (
            <>
              <p className="emergency-strip-group">{t.today.emergencyGroupUrgent}</p>
              <a href={`tel:${contact.emergency.number}`} className="emergency-strip-line is-urgent">
                <PhoneCall size={14} aria-hidden="true" />
                <span>
                  {t.region.callBtn.replace('{label}', contact.emergency.label[lk])} {t.region.emergencySuffix}
                </span>
              </a>
              {contact.healthLine && (
                <>
                  <p className="emergency-strip-group">{t.today.emergencyGroupOther}</p>
                  <a href={`tel:${contact.healthLine.number}`} className="emergency-strip-line">
                    <span>{contact.healthLine.label[lk]}</span>
                  </a>
                </>
              )}
            </>
          ) : (
            <p className="alerts-country-hint">{t.region.setCountryHint}</p>
          )}
          {extra}
        </div>
      )}
    </section>
  );
};
