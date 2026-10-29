import React from 'react';
import { UserProfile } from '../types';
import { Pencil } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { LanguageSelector } from './LanguageSelector';
import { getLocalizedStageLabel } from '../locales';
import { formatBabyAgeDetailed, formatDueDate } from '../utils/dateUtils';

interface HeaderProps {
  profile: UserProfile | null;
  onResetProfile: () => void;
  onEditProfile?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ profile, onResetProfile, onEditProfile }) => {
  const { language, t } = useLanguage();

  const renderProfileStatusText = () => {
    if (!profile) return null;

    if (profile.phase === 'baby') {
      const ageText = profile.birthDate
        ? formatBabyAgeDetailed(profile.birthDate, language)
        : getLocalizedStageLabel(profile, language, true);

      if (profile.babyName) {
        return `👶 ${profile.babyName} • ${ageText}`;
      }
      return `👶 ${ageText}`;
    }

    // Gestação
    const stageText = getLocalizedStageLabel(profile, language, true);
    if (profile.dueDate) {
      return `♡ ${stageText} • ${formatDueDate(profile.dueDate, language)}`;
    }
    return `♡ ${stageText}`;
  };

  return (
    <header className="app-header">
      {/* LINHA 1: Símbolo oficial (Opção B - Coração Coral Isolado), Nome da Marca e Idioma */}
      <div className="header-primary-row">
        <div className="brand-badge">
          <svg
            width="22"
            height="22"
            viewBox="0 0 192 192"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="brand-symbol"
            aria-hidden="true"
          >
            <circle cx="96" cy="96" r="88" fill="#FBF0EB" stroke="#EBE4DA" strokeWidth="2" />
            <path
              d="M96 66 C84 54, 60 60, 60 82 C60 102, 96 132, 96 132 C96 132, 132 102, 132 82 C132 60, 108 54, 96 66 Z"
              fill="#C76B50"
            />
          </svg>
          <span className="brand-title">{t.app.name}</span>
        </div>

        <div className="header-actions">
          <LanguageSelector compact />
        </div>
      </div>

      {/* LINHA 2: Contexto Pessoal (Nome do bebê, idade/dias de vida ou fase) + Ação discreta de Editar */}
      {profile && (
        <div className="header-status-row">
          <span className="profile-pill" title={renderProfileStatusText() || undefined}>
            {renderProfileStatusText()}
          </span>
          <button
            onClick={onEditProfile || onResetProfile}
            title={t.header.changePhaseTitle}
            aria-label={t.header.changePhaseAria}
            className="header-reset-btn"
          >
            <Pencil size={11} />
            <span className="header-reset-text">
              {t.header.editBtn || (language === 'pt-BR' ? 'Editar' : 'Edit')}
            </span>
          </button>
        </div>
      )}
    </header>
  );
};
