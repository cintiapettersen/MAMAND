import React, { useState } from 'react';
import { UserProfile, UserPhase, MainNeed } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { getLocalizedStageLabel } from '../locales';
import { Baby, Heart, X, Check, Sparkles, Trash2 } from 'lucide-react';
import { calculateAgeInMonths, formatBabyAgeDetailed } from '../utils/dateUtils';

interface ProfileEditModalProps {
  profile: UserProfile;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updated: UserProfile) => void;
  onReset: () => void;
}

export const ProfileEditModal: React.FC<ProfileEditModalProps> = ({
  profile,
  isOpen,
  onClose,
  onSave,
  onReset
}) => {
  const { language, t } = useLanguage();

  const [phase, setPhase] = useState<UserPhase>(profile.phase);
  const [stageValue, setStageValue] = useState<number>(profile.stageValue);
  const [mainNeed, setMainNeed] = useState<MainNeed>(profile.mainNeed);
  const [babyName, setBabyName] = useState<string>(profile.babyName || '');
  const [birthDate, setBirthDate] = useState<string>(profile.birthDate || '');
  const [dueDate, setDueDate] = useState<string>(profile.dueDate || '');

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: UserProfile = {
      ...profile,
      phase,
      stageValue,
      mainNeed,
      preferredLanguage: language,
      babyName: babyName.trim() || undefined,
      birthDate: phase === 'baby' && birthDate ? birthDate : undefined,
      dueDate: phase === 'pregnancy' && dueDate ? dueDate : undefined,
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
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    fontSize: '0.88rem',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-light)',
                    backgroundColor: 'var(--bg-main)'
                  }}
                />
                {birthDate && (
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
                if (window.confirm(t.common.confirmPhaseReset)) {
                  onClose();
                  onReset();
                }
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
              <span>{t.header.changePhaseTitle}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
