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
      {/* LINHA 1: Marca MAMAND (wordmark + linha de apoio) e Idioma */}
      <div className="header-primary-row">
        <div className="brand-badge">
          <span className="brand-title">{t.app.name}</span>
          <span className="brand-line">{t.app.brandLine}</span>
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
