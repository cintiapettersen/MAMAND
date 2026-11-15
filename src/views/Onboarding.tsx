import React, { useState } from 'react';
import { UserProfile, UserPhase, MainNeed } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { getLocalizedStageLabel } from '../locales';
import { Baby, Heart, Check, Shield } from 'lucide-react';
import { detectCountryFromDevice } from '../data/emergencyContacts';
import { NameField, CountryField, CareCountryField } from '../components/ProfileFields';

interface OnboardingProps {
  onComplete: (profile: UserProfile) => void;
  initialProfile?: UserProfile | null;
  onOpenPrivacy?: () => void;
}

export const Onboarding: React.FC<OnboardingProps> = ({ onComplete, initialProfile, onOpenPrivacy }) => {
  const { language, t } = useLanguage();
  const [step, setStep] = useState<1 | 2>(1);
  const [phase, setPhase] = useState<UserPhase>(initialProfile?.phase || 'baby');
  const [stageValue, setStageValue] = useState<number>(
    initialProfile?.stageValue ?? (initialProfile?.phase === 'pregnancy' ? 24 : 2)
  );
  const [mainNeed] = useState<MainNeed>(initialProfile?.mainNeed || 'understand_baby');
  const [displayName, setDisplayName] = useState<string>(initialProfile?.displayName || '');
  // País sugerido pelo idioma do aparelho; a usuária confirma ou troca
  const [country, setCountry] = useState<string>(initialProfile?.country ?? detectCountryFromDevice());
  // País do acompanhamento de saúde: opcional, sem sugestão automática
  const [careCountry, setCareCountry] = useState<string>(initialProfile?.careCountry || '');

  const handleSelectPhase = (selectedPhase: UserPhase) => {
    setPhase(selectedPhase);
    if (selectedPhase === 'pregnancy') {
      setStageValue(24);
    } else {
      setStageValue(2);
    }
  };

  const handleFinish = () => {
    const tempProfile: UserProfile = {
      phase,
      stageValue,
      stageLabel: '',
      mainNeed,
      preferredLanguage: language,
      displayName: displayName.trim() || undefined,
      country: country || undefined,
      careCountry: careCountry || undefined,
      babyName: initialProfile?.babyName,
      birthDate: phase === 'baby' ? initialProfile?.birthDate : undefined,
      dueDate: phase === 'pregnancy' ? initialProfile?.dueDate : undefined,
      createdAt: initialProfile?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    tempProfile.stageLabel = getLocalizedStageLabel(tempProfile, language);
    onComplete(tempProfile);
  };

  return (
    <div className="content-area" style={{ paddingTop: '20px' }}>
      {/* Indicador de Progresso das 2 Etapas */}
      <div style={{ display: 'flex', gap: '8px', width: '100%', marginBottom: '20px' }}>
        {[1, 2].map((s) => (
          <div
            key={s}
            style={{
              height: '4px',
              flex: 1,
              borderRadius: '2px',
              backgroundColor: s <= step ? 'var(--primary)' : 'var(--border-light)',
              transition: 'background-color 0.2s ease'
            }}
          />
        ))}
      </div>

      {step === 1 && (
        <div>
          <div style={{ marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span className="tag-badge tag-primary">
                {t.onboarding.welcomeBadge}
              </span>
              <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                {t.onboarding.stepIndicator(1, 2)}
              </span>
            </div>
            <h1 className="card-title" style={{ fontSize: '1.45rem', marginTop: '6px' }}>
              {t.onboarding.step1Title}
            </h1>
            <p className="card-subtitle">
              {t.onboarding.step1Subtitle}
            </p>
          </div>

          <div className="choice-list">
            <button
              type="button"
              onClick={() => handleSelectPhase('pregnancy')}
              className={`choice-option ${phase === 'pregnancy' ? 'selected' : ''}`}
              style={{ textAlign: 'left', width: '100%' }}
            >
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <div className="choice-icon-wrap">
                  <Heart size={20} />
                </div>
                <div>
                  <div style={{ fontWeight: phase === 'pregnancy' ? 600 : 500 }}>
                    {t.onboarding.phasePregnancyTitle}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {t.onboarding.phasePregnancyDesc}
                  </div>
                </div>
              </div>
              {phase === 'pregnancy' ? (
                <Check size={18} color="var(--primary)" />
              ) : (
                <div
                  style={{
                    width: 18,
                    height: 18,
                    borderRadius: '50%',
                    border: '1.5px solid var(--border-light)'
                  }}
                />
              )}
            </button>

            <button
              type="button"
              onClick={() => handleSelectPhase('baby')}
              className={`choice-option ${phase === 'baby' ? 'selected' : ''}`}
              style={{ textAlign: 'left', width: '100%' }}
            >
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <div className="choice-icon-wrap">
                  <Baby size={20} />
                </div>
                <div>
                  <div style={{ fontWeight: phase === 'baby' ? 600 : 500 }}>
                    {t.onboarding.phaseBabyTitle}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {t.onboarding.phaseBabyDesc}
                  </div>
                </div>
              </div>
              {phase === 'baby' ? (
                <Check size={18} color="var(--primary)" />
              ) : (
                <div
                  style={{
                    width: 18,
                    height: 18,
                    borderRadius: '50%',
                    border: '1.5px solid var(--border-light)'
                  }}
                />
              )}
            </button>
          </div>

          <div style={{ marginTop: '24px' }}>
            <button
              type="button"
              onClick={() => setStep(2)}
              className="btn btn-primary"
              style={{ width: '100%', minHeight: '46px', fontSize: '0.92rem', justifyContent: 'center' }}
            >
              {t.onboarding.nextBtn} →
            </button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div>
          <div style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <button
                type="button"
                onClick={() => setStep(1)}
                style={{
                  background: 'none',
                  border: 'none',
                  padding: '2px 0',
                  color: 'var(--text-muted)',
                  fontSize: '0.84rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                ← {t.onboarding.backBtn}
              </button>
              <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                {t.onboarding.stepIndicator(2, 2)}
              </span>
            </div>
            <h1 className="card-title" style={{ fontSize: '1.4rem', marginTop: '6px' }}>
              {t.onboarding.personalizeTitle}
            </h1>
            <p className="card-subtitle">
              {t.onboarding.personalizeSubtitle}
            </p>
          </div>

          {/* Personalização: nome opcional e países */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <NameField value={displayName} onChange={setDisplayName} />
            <CountryField value={country} onChange={setCountry} />
            <CareCountryField value={careCountry} onChange={setCareCountry} />
          </div>

          <div style={{ marginTop: '24px' }}>
            <button
              type="button"
              onClick={handleFinish}
              className="btn btn-primary"
              style={{ width: '100%', minHeight: '46px', fontSize: '0.92rem', justifyContent: 'center' }}
            >
              {t.onboarding.startBtn} →
            </button>
          </div>

          {/* Aviso Compacto de Privacidade Local */}
          <div
            style={{
              marginTop: '20px',
              padding: '12px 14px',
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-light)',
              borderRadius: 'var(--radius-md)',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--sage)', fontSize: '0.78rem', fontWeight: 700 }}>
              <Shield size={14} />
              <span>{t.privacy.onboardingBadge}</span>
            </div>
            <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.45 }}>
              {t.privacy.onboardingNotice}
            </p>
            {onOpenPrivacy && (
              <button
                type="button"
                onClick={onOpenPrivacy}
                style={{
                  alignSelf: 'flex-start',
                  background: 'none',
                  border: 'none',
                  padding: '2px 0',
                  color: 'var(--primary)',
                  fontSize: '0.79rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  textDecoration: 'underline'
                }}
              >
                {t.privacy.policyLink} →
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
