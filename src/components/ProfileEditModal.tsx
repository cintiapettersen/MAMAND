import React, { useState } from 'react';
import { UserProfile, UserPhase, MainNeed } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { getLocalizedStageLabel } from '../locales';
import { Baby, Heart, X, Check, Sparkles, Trash2, AlertTriangle, ShieldAlert, Shield, Scale } from 'lucide-react';
import {
  calculateAgeInMonths,
  formatBabyAgeDetailed,
  birthDateBounds,
  dueDateBounds,
  validateBirthDate,
  validateDueDate,
  isDueDatePast
} from '../utils/dateUtils';
import { NameField, CountryField, CareCountryField } from './ProfileFields';
import { AnalyticsPreferenceControl } from './AnalyticsPreferenceControl';
import type { AnalyticsConsentState } from '../services/analyticsConsent';

interface ProfileEditModalProps {
  profile: UserProfile;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updated: UserProfile) => void;
  onReset: () => void;
  onWipeAllData?: () => Promise<void> | void;
  onOpenPrivacy?: () => void;
  onOpenCredits?: () => void;
  analyticsConsent?: AnalyticsConsentState;
  onChangeAnalyticsConsent?: (decision: 'granted' | 'denied') => void;
}

export const ProfileEditModal: React.FC<ProfileEditModalProps> = ({
  profile,
  isOpen,
  onClose,
  onSave,
  onReset,
  onWipeAllData,
  onOpenPrivacy,
  onOpenCredits,
  analyticsConsent,
  onChangeAnalyticsConsent
}) => {
  const { language, t } = useLanguage();

  const [phase, setPhase] = useState<UserPhase>(profile.phase);
  const [stageValue, setStageValue] = useState<number>(profile.stageValue);
  const [mainNeed, setMainNeed] = useState<MainNeed>(profile.mainNeed);
  const [babyName, setBabyName] = useState<string>(profile.babyName || '');
  const [birthDate, setBirthDate] = useState<string>(profile.birthDate || '');
  const [dueDate, setDueDate] = useState<string>(profile.dueDate || '');
  const [displayName, setDisplayName] = useState<string>(profile.displayName || '');
  const [country, setCountry] = useState<string>(profile.country || '');
  const [confirmWipeOpen, setConfirmWipeOpen] = useState<boolean>(false);
  const [isWiping, setIsWiping] = useState<boolean>(false);
  // País do acompanhamento de saúde: independente do país de emergência e do idioma
  const [careCountry, setCareCountry] = useState<string>(profile.careCountry || '');

  if (!isOpen) return null;

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

  const de = t.onboarding.dateErrors;
  const birthError = phase === 'baby' ? validateBirthDate(birthDate) : null;
  const dueError = phase === 'pregnancy' ? validateDueDate(dueDate) : null;
  const birthErrorText = birthError === 'future' ? de.birthFuture : birthError === 'tooOld' ? de.birthTooOld : birthError ? de.birthInvalid : null;
  const dueErrorText = dueError === 'tooFar' ? de.dueTooFar : dueError === 'tooLongAgo' ? de.dueTooLongAgo : dueError ? de.dueInvalid : null;
  const hasDateError = !!(birthErrorText || dueErrorText);
  const birthLimits = birthDateBounds();
  const dueLimits = dueDateBounds();

  const handleBirthDateChange = (dateVal: string) => {
    setBirthDate(dateVal);
    // A etapa só é ajustada a partir de uma data plausível (um ano digitado errado não vira "1 a 2 anos")
    if (dateVal && !validateBirthDate(dateVal)) {
      const months = calculateAgeInMonths(dateVal);
      if (months === 0) setStageValue(0);
      else if (months <= 3) setStageValue(2);
      else if (months <= 6) setStageValue(6);
      else if (months <= 12) setStageValue(12);
      else setStageValue(24);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (hasDateError) return;
    const updated: UserProfile = {
      ...profile,
      phase,
      stageValue,
      mainNeed,
      preferredLanguage: language,
      displayName: displayName.trim() || undefined,
      country: country || undefined,
      careCountry: careCountry || undefined,
      babyName: babyName.trim() || undefined,
      birthDate: phase === 'baby' && birthDate && !validateBirthDate(birthDate) ? birthDate : undefined,
      dueDate: phase === 'pregnancy' && dueDate && !validateDueDate(dueDate) ? dueDate : undefined,
      updatedAt: new Date().toISOString()
    };
    updated.stageLabel = getLocalizedStageLabel(updated, language);
    onSave(updated);
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="profileEditTitle"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(44, 30, 24, 0.45)',
        backdropFilter: 'blur(3px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '16px'
      }}
    >
      <div
        className="card"
        style={{
          width: '100%',
          maxWidth: '480px',
          maxHeight: '90vh',
          overflowY: 'auto',
          backgroundColor: 'var(--bg-card)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: '0 12px 32px rgba(44, 30, 24, 0.16)',
          border: '1px solid var(--border-light)',
          padding: '24px'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
          <h2 id="profileEditTitle" style={{ fontSize: '1.25rem', fontFamily: 'var(--font-serif)', margin: 0 }}>
            {language === 'pt-BR' ? 'Editar Perfil' : 'Edit Profile'}
          </h2>
          <button
            onClick={onClose}
            aria-label={language === 'pt-BR' ? 'Fechar' : 'Close'}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-muted)',
              padding: '4px',
              borderRadius: 'var(--radius-full)'
            }}
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Sobre você: nome opcional e país (números de emergência) */}
          <NameField value={displayName} onChange={setDisplayName} />
          <CountryField value={country} onChange={setCountry} />
          <CareCountryField value={careCountry} onChange={setCareCountry} />

          {/* Alternar Fase */}
          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '6px' }}>
              {language === 'pt-BR' ? 'Momento atual:' : 'Current stage:'}
            </label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                onClick={() => handleSelectPhase('pregnancy')}
                className={`choice-option ${phase === 'pregnancy' ? 'selected' : ''}`}
                style={{ flex: 1, padding: '10px 12px', justifyContent: 'center' }}
              >
                <Heart size={16} color="var(--primary)" />
                <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                  {t.onboarding.phasePregnancyTitle}
                </span>
              </button>
              <button
                type="button"
                onClick={() => handleSelectPhase('baby')}
                className={`choice-option ${phase === 'baby' ? 'selected' : ''}`}
                style={{ flex: 1, padding: '10px 12px', justifyContent: 'center' }}
              >
                <Baby size={16} color="var(--sage)" />
                <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                  {t.onboarding.phaseBabyTitle}
                </span>
              </button>
            </div>
          </div>

          {/* Dados Opcionais */}
          {phase === 'baby' ? (
            <div
              style={{
                backgroundColor: 'var(--warm-light)',
                borderRadius: 'var(--radius-md)',
                padding: '12px 14px',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
                border: '1px solid var(--border-light)'
              }}
            >
              <div>
                <label
                  htmlFor="editBabyName"
                  style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '4px' }}
                >
                  {t.onboarding.optionalBabyNameLabel || 'Nome do bebê (opcional)'}
                </label>
                <input
                  id="editBabyName"
                  type="text"
                  value={babyName}
                  onChange={(e) => setBabyName(e.target.value)}
                  placeholder={t.onboarding.optionalBabyNamePlaceholder || 'Como podemos chamar o bebê?'}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    fontSize: '0.88rem',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-light)',
                    backgroundColor: 'var(--bg-main)'
                  }}
                />
              </div>

              <div>
                <label
                  htmlFor="editBirthDate"
                  style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '4px' }}
                >
                  {t.onboarding.optionalBirthDateLabel || 'Data de nascimento (opcional)'}
                </label>
                <input
                  id="editBirthDate"
                  type="date"
                  value={birthDate}
                  onChange={(e) => handleBirthDateChange(e.target.value)}
                    min={birthLimits.min}
                    max={birthLimits.max}
                    aria-invalid={!!birthErrorText}
                    aria-describedby={birthErrorText ? 'editBirthDateError' : undefined}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    fontSize: '0.88rem',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-light)',
                    backgroundColor: 'var(--bg-main)'
                  }}
                />
                {birthErrorText && (
                  <p id="editBirthDateError" role="alert" className="profile-date-error">{birthErrorText}</p>
                )}
                {birthDate && !birthErrorText && (
                  <div
                    style={{
                      marginTop: '6px',
                      fontSize: '0.78rem',
                      color: 'var(--primary-dark)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px'
                    }}
                  >
                    <Sparkles size={13} color="var(--primary)" />
                    <span>{formatBabyAgeDetailed(birthDate, language)}</span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div
              style={{
                backgroundColor: 'var(--warm-light)',
                borderRadius: 'var(--radius-md)',
                padding: '12px 14px',
                border: '1px solid var(--border-light)'
              }}
            >
              <label
                htmlFor="editDueDate"
                style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '4px' }}
              >
                {t.onboarding.optionalDueDateLabel || 'Data prevista do parto (DPP, opcional)'}
              </label>
              <input
                id="editDueDate"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                  min={dueLimits.min}
                  max={dueLimits.max}
                  aria-invalid={!!dueErrorText}
                  aria-describedby={dueErrorText ? 'editDueDateError' : undefined}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  fontSize: '0.88rem',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-light)',
                  backgroundColor: 'var(--bg-main)'
                }}
              />
              {dueErrorText && (
                <p id="editDueDateError" role="alert" className="profile-date-error">{dueErrorText}</p>
              )}
              {!dueErrorText && phase === 'pregnancy' && isDueDatePast(dueDate) && (
                <p className="profile-date-hint">{de.duePassedHint}</p>
              )}
            </div>
          )}

          {/* Faixa aproximada de desenvolvimento */}
          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '6px' }}>
              {phase === 'pregnancy'
                ? (language === 'pt-BR' ? 'Trimestre gestacional:' : 'Gestational trimester:')
                : (language === 'pt-BR' ? 'Faixa de desenvolvimento:' : 'Developmental stage:')}
            </label>
            <div className="choice-list" style={{ gap: '6px' }}>
              {(phase === 'pregnancy' ? t.onboarding.pregnancyStages : t.onboarding.babyStages).map((item) => {
                const isSelected = stageValue === item.value;
                return (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => setStageValue(item.value)}
                    className={`choice-option ${isSelected ? 'selected' : ''}`}
                    style={{ padding: '8px 12px', fontSize: '0.85rem' }}
                  >
                    <span>{item.label}</span>
                    {isSelected && <Check size={16} color="var(--primary)" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Foco de Atenção */}
          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '6px' }}>
              {language === 'pt-BR' ? 'Foco principal:' : 'Main focus:'}
            </label>
            <select
              value={mainNeed}
              onChange={(e) => setMainNeed(e.target.value as MainNeed)}
              style={{
                width: '100%',
                padding: '8px 12px',
                fontSize: '0.88rem',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-light)',
                backgroundColor: 'var(--bg-main)',
                color: 'var(--text-main)'
              }}
            >
              {(Object.keys(t.onboarding.needs) as MainNeed[]).map((key) => (
                <option key={key} value={key}>
                  {t.onboarding.needs[key].title}
                </option>
              ))}
            </select>
          </div>

          {/* Ações */}
          <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary"
              style={{ flex: 1, minHeight: '44px', justifyContent: 'center' }}
            >
              {language === 'pt-BR' ? 'Cancelar' : 'Cancel'}
            </button>
            <button
              type="submit"
              disabled={hasDateError}
              className="btn btn-primary"
              style={{ flex: 1.5, minHeight: '44px', justifyContent: 'center' }}
            >
              {language === 'pt-BR' ? 'Salvar alterações' : 'Save changes'}
            </button>
          </div>

          {/* Reset opcional */}
          <div style={{ textAlign: 'center', marginTop: '4px' }}>
            <button
              type="button"
              onClick={() => {
                onClose();
                onReset();
              }}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                fontSize: '0.75rem',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <Trash2 size={12} />
              <span>{t.region.restartOnboarding}</span>
            </button>
          </div>

          {/* Preferência de estatísticas de alcance (Analytics) */}
          {analyticsConsent && onChangeAnalyticsConsent && (
            <div style={{ marginTop: '8px' }}>
              <AnalyticsPreferenceControl
                language={language}
                consent={analyticsConsent}
                onChange={onChangeAnalyticsConsent}
              />
            </div>
          )}

          {/* Links para Política de Privacidade e Créditos e Licenças */}
          {(onOpenPrivacy || onOpenCredits) && (
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '14px',
                flexWrap: 'wrap',
                marginTop: '12px',
                paddingTop: '12px',
                borderTop: '1px solid var(--border-light)'
              }}
            >
              {onOpenCredits && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenCredits();
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-muted)',
                    fontSize: '0.76rem',
                    cursor: 'pointer',
                    textDecoration: 'underline',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <Scale size={12} />
                  <span>{language === 'pt-BR' ? 'Créditos e Licenças' : 'Credits & Licenses'}</span>
                </button>
              )}
              {onOpenPrivacy && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenPrivacy();
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-muted)',
                    fontSize: '0.76rem',
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
              )}
            </div>
          )}

          {/* Exclusão Total Irreversível de Dados Locais (LGPD Art. 18, VI / GDPR Art. 17) */}
          {onWipeAllData && (
            <div style={{ marginTop: '16px', paddingTop: '14px', borderTop: '1px dashed rgba(178, 59, 59, 0.3)' }}>
              {!confirmWipeOpen ? (
                <div style={{ textAlign: 'center' }}>
                  <button
                    type="button"
                    onClick={() => setConfirmWipeOpen(true)}
                    style={{
                      background: 'none',
                      border: '1px solid rgba(178, 59, 59, 0.3)',
                      borderRadius: 'var(--radius-md)',
                      padding: '8px 12px',
                      color: '#B23B3B',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <ShieldAlert size={14} />
                    <span>
                      {language === 'pt-BR'
                        ? 'Apagar todos os meus dados deste aparelho'
                        : 'Erase all my data from this device'}
                    </span>
                  </button>
                </div>
              ) : (
                <div
                  role="alertdialog"
                  aria-labelledby="wipeConfirmTitle"
                  style={{
                    backgroundColor: '#FDF3F2',
                    border: '1px solid rgba(178, 59, 59, 0.35)',
                    borderRadius: 'var(--radius-md)',
                    padding: '14px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#8F2424' }}>
                    <AlertTriangle size={18} style={{ flexShrink: 0 }} />
                    <strong id="wipeConfirmTitle" style={{ fontSize: '0.88rem' }}>
                      {language === 'pt-BR'
                        ? 'Confirmar exclusão irreversível?'
                        : 'Confirm irreversible erasure?'}
                    </strong>
                  </div>

                  <p style={{ margin: 0, fontSize: '0.78rem', lineHeight: 1.45, color: '#4A2C2A' }}>
                    {language === 'pt-BR'
                      ? 'Esta ação apagará permanentemente deste navegador: seu perfil, ficha de nascimento, diário da Jornada, rede de apoio, mala da maternidade e preferências locais.'
                      : 'This action will permanently erase from this browser: your profile, birth record, Journey diary, support network, maternity checklist, and local preferences.'}
                  </p>

                  <p style={{ margin: 0, fontSize: '0.75rem', lineHeight: 1.4, color: '#6B4845' }}>
                    {language === 'pt-BR'
                      ? 'Importante: backups JSON ou resumos TXT que você já baixou anteriormente para o seu aparelho NÃO serão apagados. Os arquivos estáticos do aplicativo para funcionamento offline serão preservados.'
                      : 'Important: JSON backups or TXT summaries previously downloaded to your device will NOT be deleted. Static app files required for offline use will be preserved.'}
                  </p>

                  <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                    <button
                      type="button"
                      disabled={isWiping}
                      onClick={() => setConfirmWipeOpen(false)}
                      className="btn btn-secondary"
                      style={{ flex: 1, minHeight: '38px', fontSize: '0.8rem', justifyContent: 'center' }}
                    >
                      {language === 'pt-BR' ? 'Cancelar' : 'Cancel'}
                    </button>
                    <button
                      type="button"
                      disabled={isWiping}
                      onClick={async () => {
                        setIsWiping(true);
                        try {
                          await onWipeAllData();
                        } finally {
                          setIsWiping(false);
                          setConfirmWipeOpen(false);
                        }
                      }}
                      className="btn btn-primary"
                      style={{
                        flex: 1.4,
                        minHeight: '38px',
                        fontSize: '0.8rem',
                        backgroundColor: '#B23B3B',
                        justifyContent: 'center'
                      }}
                    >
                      {isWiping
                        ? (language === 'pt-BR' ? 'Apagando...' : 'Erasing...')
                        : (language === 'pt-BR' ? 'Sim, apagar tudo' : 'Yes, erase everything')}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </form>
      </div>
    </div>
  );
};
