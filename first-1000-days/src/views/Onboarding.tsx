import React, { useState } from 'react';
import { UserProfile, UserPhase, MainNeed } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { getLocalizedStageLabel } from '../locales';
import { Baby, Heart, Check, Sparkles, Shield } from 'lucide-react';
import { calculateAgeInMonths, formatBabyAgeDetailed } from '../utils/dateUtils';
import { detectCountryFromDevice } from '../data/emergencyContacts';
import { NameField, CountryField } from '../components/ProfileFields';

interface OnboardingProps {
  onComplete: (profile: UserProfile) => void;
  initialProfile?: UserProfile | null;
  onOpenPrivacy?: () => void;
}

export const Onboarding: React.FC<OnboardingProps> = ({ onComplete, initialProfile, onOpenPrivacy }) => {
  const { language, t } = useLanguage();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [phase, setPhase] = useState<UserPhase>(initialProfile?.phase || 'baby');
  const [stageValue, setStageValue] = useState<number>(
    initialProfile?.stageValue ?? (initialProfile?.phase === 'pregnancy' ? 24 : 2)
  );
  const [mainNeed, setMainNeed] = useState<MainNeed>(initialProfile?.mainNeed || 'understand_baby');
  const [babyName, setBabyName] = useState<string>(initialProfile?.babyName || '');
  const [birthDate, setBirthDate] = useState<string>(initialProfile?.birthDate || '');
  const [dueDate, setDueDate] = useState<string>(initialProfile?.dueDate || '');
  const [displayName, setDisplayName] = useState<string>(initialProfile?.displayName || '');
  // País sugerido pelo idioma do aparelho; a usuária confirma ou troca
  const [country, setCountry] = useState<string>(initialProfile?.country ?? detectCountryFromDevice());

  const handleSelectPhase = (selectedPhase: UserPhase) => {
    setPhase(selectedPhase);
    if (selectedPhase === 'pregnancy') {
      setStageValue(24);
      setBirthDate('');
    } else {
      setStageValue(2);
      setDueDate('');
    }
  };

  const handleBirthDateChange = (dateVal: string) => {
    setBirthDate(dateVal);
    if (dateVal) {
      const months = calculateAgeInMonths(dateVal);
      if (months === 0) setStageValue(0);
      else if (months <= 3) setStageValue(2);
      else if (months <= 6) setStageValue(6);
      else if (months <= 12) setStageValue(12);
      else setStageValue(24);
    }
  };

  const handleFinish = (need: MainNeed) => {
    setMainNeed(need);
    const tempProfile: UserProfile = {
      phase,
      stageValue,
      stageLabel: '',
      mainNeed: need,
      preferredLanguage: language,
      displayName: displayName.trim() || undefined,
      country: country || undefined,
      babyName: babyName.trim() || undefined,
      birthDate: phase === 'baby' && birthDate ? birthDate : undefined,
      dueDate: phase === 'pregnancy' && dueDate ? dueDate : undefined,
      createdAt: initialProfile?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    tempProfile.stageLabel = getLocalizedStageLabel(tempProfile, language);
    onComplete(tempProfile);
  };

  return (
    <div className="content-area" style={{ paddingTop: '20px' }}>
      {/* Indicador de Progresso das 3 Etapas */}
      <div style={{ display: 'flex', gap: '8px', width: '100%', marginBottom: '24px' }}>
        {[1, 2, 3].map((s) => (
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
            <span className="tag-badge tag-primary" style={{ marginBottom: '8px' }}>
              {t.onboarding.welcomeBadge}
            </span>
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

          {/* Sobre você: nome opcional e país (para números de emergência) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '22px' }}>
            <NameField value={displayName} onChange={setDisplayName} />
            <CountryField value={country} onChange={setCountry} />
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

          {/* Aviso Acolhedor de Privacidade Local (Sem Caixa Genérica de Consentimento) */}
          <div
            style={{
              marginTop: '24px',
              padding: '14px 16px',
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-light)',
              borderRadius: 'var(--radius-md)',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px'
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

      {step === 2 && (
        <div>
          <div style={{ marginBottom: '20px' }}>
            <span className="tag-badge tag-sage" style={{ marginBottom: '8px' }}>
              {t.onboarding.stageBadge}
            </span>
            <h1 className="card-title" style={{ fontSize: '1.4rem', marginTop: '6px' }}>
              {t.onboarding.step2Title}
            </h1>
            <p className="card-subtitle">
              {t.onboarding.step2Subtitle}
            </p>
          </div>

          {/* Campos Opcionais de Personalização */}
          <div
            style={{
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-light)',
              borderRadius: 'var(--radius-md)',
              padding: '14px 16px',
              marginBottom: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}
          >
            {phase === 'baby' ? (
              <>
                <div>
                  <label
                    htmlFor="babyNameInput"
                    style={{
                      display: 'block',
                      fontSize: '0.82rem',
                      fontWeight: 600,
                      color: 'var(--text-main)',
                      marginBottom: '4px'
                    }}
                  >
                    {t.onboarding.optionalBabyNameLabel || 'Nome do bebê (opcional)'}
                  </label>
                  <input
                    id="babyNameInput"
                    type="text"
                    value={babyName}
                    onChange={(e) => setBabyName(e.target.value)}
                    placeholder={t.onboarding.optionalBabyNamePlaceholder || 'Como podemos chamar o bebê?'}
                    className="input-field"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      fontSize: '0.88rem',
                      border: '1px solid var(--border-light)',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: 'var(--bg-main)'
                    }}
                  />
                </div>

                <div>
                  <label
                    htmlFor="birthDateInput"
                    style={{
                      display: 'block',
                      fontSize: '0.82rem',
                      fontWeight: 600,
                      color: 'var(--text-main)',
                      marginBottom: '4px'
                    }}
                  >
                    {t.onboarding.optionalBirthDateLabel || 'Data de nascimento (opcional)'}
                  </label>
                  <input
                    id="birthDateInput"
                    type="date"
                    value={birthDate}
                    onChange={(e) => handleBirthDateChange(e.target.value)}
                    className="input-field"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      fontSize: '0.88rem',
                      border: '1px solid var(--border-light)',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: 'var(--bg-main)'
                    }}
                  />
                  {birthDate && (
                    <div
                      style={{
                        marginTop: '8px',
                        padding: '6px 10px',
                        backgroundColor: 'var(--warm-light)',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.78rem',
                        color: 'var(--primary-dark)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      <Sparkles size={14} color="var(--primary)" />
                      <span>{formatBabyAgeDetailed(birthDate, language)}</span>
                    </div>
                  )}
                  <span
                    style={{
                      display: 'block',
                      fontSize: '0.72rem',
                      color: 'var(--text-muted)',
                      marginTop: '4px'
                    }}
                  >
                    {t.onboarding.optionalExactAgeHint || 'Calcula automaticamente a idade exata e os dias de vida'}
                  </span>
                </div>
              </>
            ) : (
              <div>
                <label
                  htmlFor="dueDateInput"
                  style={{
                    display: 'block',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    color: 'var(--text-main)',
                    marginBottom: '4px'
                  }}
                >
                  {t.onboarding.optionalDueDateLabel || 'Data prevista do parto (DPP, opcional)'}
                </label>
                <input
                  id="dueDateInput"
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="input-field"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    fontSize: '0.88rem',
                    border: '1px solid var(--border-light)',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: 'var(--bg-main)'
                  }}
                />
              </div>
            )}
          </div>

          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '8px', fontWeight: 600 }}>
            {phase === 'pregnancy'
              ? (language === 'pt-BR' ? 'Trimestre gestacional:' : 'Gestational trimester:')
              : (language === 'pt-BR' ? 'Faixa aproximada de desenvolvimento:' : 'Approximate developmental stage:')}
          </div>

          <div className="choice-list">
            {(phase === 'pregnancy' ? t.onboarding.pregnancyStages : t.onboarding.babyStages).map((item) => {
              const isSelected = stageValue === item.value;
              return (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => setStageValue(item.value)}
                  className={`choice-option ${isSelected ? 'selected' : ''}`}
                  style={{ textAlign: 'left', width: '100%' }}
                >
                  <span style={{ fontWeight: isSelected ? 600 : 500 }}>{item.label}</span>
                  {isSelected ? (
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
              );
            })}
          </div>

          <div style={{ display: 'flex', gap: '10px', marginTop: '24px' }}>
            <button
              type="button"
              onClick={() => setStep(1)}
              className="btn btn-secondary"
              style={{ flex: 1, minHeight: '46px', fontSize: '0.88rem', justifyContent: 'center' }}
            >
              ← {t.onboarding.backBtn}
            </button>
            <button
              type="button"
              onClick={() => setStep(3)}
              className="btn btn-primary"
              style={{ flex: 1.5, minHeight: '46px', fontSize: '0.92rem', justifyContent: 'center' }}
            >
              {t.onboarding.nextBtn} →
            </button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div>
          <div style={{ marginBottom: '20px' }}>
            <span className="tag-badge tag-warm" style={{ marginBottom: '8px' }}>
              {t.onboarding.focusBadge}
            </span>
            <h1 className="card-title" style={{ fontSize: '1.4rem', marginTop: '6px' }}>
              {t.onboarding.step3Title}
            </h1>
            <p className="card-subtitle">
              {t.onboarding.step3Subtitle}
            </p>
          </div>

          <div className="choice-list">
            {(Object.keys(t.onboarding.needs) as MainNeed[]).map((key) => {
              const item = t.onboarding.needs[key];
              const isSelected = mainNeed === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setMainNeed(key)}
                  className={`choice-option ${isSelected ? 'selected' : ''}`}
                  style={{ textAlign: 'left', width: '100%' }}
                >
                  <div>
                    <div style={{ fontWeight: isSelected ? 600 : 500 }}>{item.title}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                      {item.subtitle}
                    </div>
                  </div>
                  {isSelected ? (
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
              );
            })}
          </div>

          <div style={{ display: 'flex', gap: '10px', marginTop: '24px' }}>
            <button
              type="button"
              onClick={() => setStep(2)}
              className="btn btn-secondary"
              style={{ flex: 1, minHeight: '46px', fontSize: '0.88rem', justifyContent: 'center' }}
            >
              ← {t.onboarding.backBtn}
            </button>
            <button
              type="button"
              onClick={() => handleFinish(mainNeed)}
              className="btn btn-primary"
              style={{ flex: 1.5, minHeight: '46px', fontSize: '0.92rem', justifyContent: 'center' }}
            >
              {t.onboarding.startBtn} →
            </button>
          </div>
        </div>
      )}

      {onOpenPrivacy && (
        <div style={{ textAlign: 'center', marginTop: '24px', paddingBottom: '12px' }}>
          <button
            type="button"
            onClick={onOpenPrivacy}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              fontSize: '0.78rem',
              cursor: 'pointer',
              textDecoration: 'underline',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <Shield size={12} />
            <span>{t.privacy.policyLink}</span>
          </button>
        </div>
      )}
    </div>
  );
};
