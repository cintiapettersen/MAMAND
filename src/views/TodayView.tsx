import React, { useMemo } from 'react';
import { UserProfile, JourneyRecord, ActiveTab } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { WeeklyMoments } from '../components/WeeklyMoments';
import { DailyCard } from '../components/DailyCard';
import { getEmergencyContact, langKey } from '../data/emergencyContacts';
import { EmergencyStrip } from '../components/EmergencyStrip';
import {
  Flower2,
  Baby,
  Heart,
  HandHeart,
  ArrowRight,
  PhoneCall,
  X,
  Moon,
  Briefcase,
  ClipboardList
} from 'lucide-react';
import { birthRecordStorage } from '../services/birthRecordStorage';
import { maternityChecklistStorage } from '../services/maternityChecklistStorage';
import { countChecklistProgress } from '../components/MaternityChecklistView';

interface TodayViewProps {
  profile: UserProfile;
  records: JourneyRecord[];
  onNavigate: (tab: ActiveTab, category?: string) => void;
  onAddRecord: (record: JourneyRecord) => void;
  onOpenBirthRecord?: () => void;
  onOpenSupportNetwork?: () => void;
  onOpenSelfCare?: () => void;
  onOpenChecklist?: () => void;
  onOpenHealthChecks?: () => void;
}

export const TodayView: React.FC<TodayViewProps> = ({
  profile,
  records,
  onNavigate,
  onAddRecord,
  onOpenBirthRecord,
  onOpenSupportNetwork,
  onOpenSelfCare,
  onOpenChecklist,
  onOpenHealthChecks
}) => {
  const { language, t } = useLanguage();

  // Modal de Sinais de Alerta Educativo

  const formattedDateKicker = useMemo(() => {
    try {
      const now = new Date();
      const formatter = new Intl.DateTimeFormat(language === 'en' ? 'en-US' : 'pt-BR', {
        weekday: 'short',
        day: 'numeric',
        month: 'short'
      });
      return formatter.format(now).toUpperCase().replace(/\./g, '');
    } catch {
      return language === 'en' ? 'TODAY' : 'HOJE';
    }
  }, [language]);

  const stageKicker = useMemo(() => {
    if (profile.phase === 'pregnancy') {
      if (profile.stageValue <= 13) {
        return language === 'en' ? 'EARLY PREGNANCY' : 'INÍCIO DA GESTAÇÃO';
      }
      if (profile.stageValue <= 27) {
        return language === 'en' ? 'MID-PREGNANCY' : 'MEIO DA GESTAÇÃO';
      }
      return language === 'en' ? 'FINAL STRETCH' : 'RETA FINAL';
    }
    if (profile.stageValue === 0) {
      return language === 'en' ? 'NEWBORN' : 'RECÉM-NASCIDO';
    }
    return language === 'en'
      ? `BABY · ${profile.stageValue}M`
      : `BEBÊ · ${profile.stageValue}M`;
  }, [profile, language]);

  const localizedFocus = t.onboarding.needs[profile.mainNeed]?.title;

  const birthRecord = useMemo(() => {
    return birthRecordStorage.getBirthRecord(profile);
  }, [profile]);

  const hasBirthRecord = useMemo(() => {
    return birthRecordStorage.hasSavedRecord();
  }, [profile]);

  // Números de emergência do país informado (sem país: só orientação genérica)
  const emergencyContact = getEmergencyContact(profile.country);
  const lk = langKey(language);
  const firstName = profile.displayName?.trim();

  const checklistProgress = useMemo(
    () => countChecklistProgress(maternityChecklistStorage.getState()),
    []
  );

  const babyDisplayName = useMemo(() => {
    return birthRecord.babyName?.trim() || profile.babyName?.trim() || (language === 'en' ? 'Baby' : 'Bebê');
  }, [birthRecord.babyName, profile.babyName, language]);

  // Exames e triagens: um dos quatro acessos principais
  const healthChecksCard = (
    <button type="button" onClick={() => onOpenHealthChecks?.()} className="home-hub-card card-hc" data-testid="home-hc-card">
      <div className="hub-card-icon-wrap icon-sage">
        <ClipboardList size={22} />
      </div>
      <div className="hub-card-content">
        <h3 className="hub-card-title">{t.healthChecks.journeyCardTitle}</h3>
        <p className="hub-card-desc">{t.healthChecks.journeyCardDesc}</p>
      </div>
      <div className="hub-card-action">
        <span>{t.healthChecks.homeCardAction}</span>
        <ArrowRight size={14} />
      </div>
    </button>
  );

  // Contatos de emergência: faixa compacta, sem critérios clínicos
  const emergencyCard = <EmergencyStrip country={profile.country} />;

  return (
    <div className="content-area">
      {/* 1. KICKER: data e fase à esquerda, foco principal à direita */}
      <div className="editorial-date-kicker">
        <span>{formattedDateKicker}</span>
        <span>•</span>
        <span>{stageKicker}</span>
        {localizedFocus && (
          <span className="editorial-focus-tag">{localizedFocus.toUpperCase()}</span>
        )}
      </div>

      {/* 2. ABERTURA: saudação + coração da marca */}
      <section className="editorial-hero-split">
        <div className="editorial-hero-text">
          <h1 className="editorial-hero-title">
            {firstName
              ? language === 'en'
                ? `Hello, ${firstName}!`
                : `Olá, ${firstName}!`
              : language === 'en'
                ? 'Hello!'
                : 'Olá!'}
          </h1>
          <p className="editorial-hero-subtitle">
            {language === 'en'
              ? 'A quiet moment to check in with the two of you.'
              : 'Um momento de calma para acompanhar vocês dois.'}
          </p>
        </div>

        {/* Coração costurado em círculo branco (SVG vetorial leve, offline) */}
        <div className="editorial-hero-art">
          <div className="editorial-art-wrap">
            <svg
              viewBox="0 0 100 100"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="editorial-line-art-svg"
              aria-hidden="true"
            >
              <path
                d="M50 84C50 84 14 60 14 36C14 22 24 14 35 14C42 14 47 18 50 23C53 18 58 14 65 14C76 14 86 22 86 36C86 60 50 84 50 84Z"
                fill="#C76B50"
              />
              <path
                d="M50 78C50 78 19.5 57 19.5 36.5C19.5 25.5 27 19.5 35.5 19.5C41.5 19.5 46.5 23.5 50 30C53.5 23.5 58.5 19.5 64.5 19.5C73 19.5 80.5 25.5 80.5 36.5C80.5 57 50 78 50 78Z"
                stroke="#FBF0EB"
                strokeWidth="1.2"
                strokeDasharray="2.4 2.4"
                strokeLinecap="round"
                opacity="0.8"
              />
            </svg>
          </div>
        </div>
      </section>

      {/* 1.5 CARTA DO DIA: UMA MENSAGEM DE ACOLHIMENTO PARA TIRAR */}
      <DailyCard phase={profile.phase} />

      {/* 2. COMPONENTE COMPACTO: MOMENTOS DA SEMANA (Etapa 6C) */}
      <WeeklyMoments
        profile={profile}
        records={records}
        onAddRecord={onAddRecord}
        onNavigate={onNavigate}
      />

      {/* 2.3 MALA DA MATERNIDADE: SÓ DURANTE A GESTAÇÃO */}
      {profile.phase === 'pregnancy' && (
        <section className="home-birth-card-section home-checklist-section" aria-label={t.maternityChecklist.homeTitle}>
          <button
            type="button"
            onClick={() => onOpenChecklist?.()}
            className="home-birth-card home-checklist-card"
          >
            <div className="home-birth-left">
              <div className="home-birth-icon-wrap">
                <Briefcase size={24} />
              </div>
              <div className="home-birth-content">
                <div className="home-birth-badge-row">
                  <span className="home-birth-badge">{t.maternityChecklist.homeBadge}</span>
                </div>
                <h3 className="home-birth-title">{t.maternityChecklist.homeTitle}</h3>
                <p className="home-birth-subtitle">
                  {checklistProgress.done > 0
                    ? t.maternityChecklist.homeProgress
                        .replace('{done}', String(checklistProgress.done))
                        .replace('{total}', String(checklistProgress.total))
                    : t.maternityChecklist.homeSubtitle}
                </p>
                {checklistProgress.done > 0 && (
                  <span className="home-checklist-bar" aria-hidden="true">
                    <span style={{ width: `${(checklistProgress.done / checklistProgress.total) * 100}%` }} />
                  </span>
                )}
              </div>
            </div>
            <div className="home-birth-arrow">
              <ArrowRight size={18} />
            </div>
          </button>
        </section>
      )}

      {/* 2.4 UM MOMENTO PARA MIM: DESCANSO, SONS E RESPIRAÇÃO */}
      <section className="home-birth-card-section home-selfcare-section" aria-label={t.selfCare.homeTitle}>
        <button
          type="button"
          onClick={() => onOpenSelfCare?.()}
          className="home-birth-card home-selfcare-card"
        >
          <div className="home-birth-left">
            <div className="home-birth-icon-wrap">
              <Moon size={24} />
            </div>
            <div className="home-birth-content">
              <div className="home-birth-badge-row">
                <span className="home-birth-badge">{t.selfCare.homeBadge}</span>
              </div>
              <h3 className="home-birth-title">{t.selfCare.homeTitle}</h3>
              <p className="home-birth-subtitle">{t.selfCare.homeSubtitle}</p>
            </div>
          </div>
          <div className="home-birth-arrow">
            <ArrowRight size={18} />
          </div>
        </button>
      </section>

      {/* 2.5 MEU NASCIMENTO: CARTÃO COMPACTO AFETIVO NA HOME */}
      <section className="home-birth-card-section" aria-label={t.birthRecord.homeCardTitle}>
        <button
          type="button"
          onClick={() => onOpenBirthRecord?.()}
          className="home-birth-card"
        >
          <div className="home-birth-left">
            <div className="home-birth-icon-wrap">
              <Baby size={24} />
            </div>
            <div className="home-birth-content">
              <div className="home-birth-badge-row">
                <span className="home-birth-badge">
                  {t.birthRecord.homeCardBadge}
                </span>
              </div>
              <h3 className="home-birth-title">{t.birthRecord.homeCardTitle}</h3>
              <p className="home-birth-subtitle">
                {hasBirthRecord
                  ? `${babyDisplayName}${birthRecord.birthDate ? ` • ${birthRecord.birthDate}` : ''} — ${t.birthRecord.homeCardFilledCta}`
                  : t.birthRecord.homeCardEmptySubtitle}
              </p>
            </div>
          </div>
          <div className="home-birth-arrow">
            <ArrowRight size={18} />
          </div>
        </button>
      </section>

      {/* 3. HUB EDITORIAL: "COMO PODEMOS AJUDAR HOJE?" (Grid 2x2 Limpo e Arejado) */}
      <section className="home-hub-section" aria-labelledby="homeHubTitle">
        <div className="home-hub-header">
          <h2 id="homeHubTitle" className="home-hub-title">
            {t.today.hubSectionTitle}
          </h2>
          <p className="home-hub-subtitle">
            {t.today.hubSectionSubtitle}
          </p>
        </div>

        <div className="home-hub-grid">
          {profile.phase === 'pregnancy' ? (
            <>
              {/* Card 1: Meu bem-estar */}
              <button
                type="button"
                onClick={() => onNavigate('care', 'mom')}
                className="home-hub-card card-sage"
              >
                <div className="hub-card-icon-wrap icon-sage">
                  <Flower2 size={22} />
                </div>
                <div className="hub-card-content">
                  <h3 className="hub-card-title">{t.today.hubPregWellbeingTitle}</h3>
                  <p className="hub-card-desc">{t.today.hubPregWellbeingDesc}</p>
                </div>
                <div className="hub-card-action">
                  <span>{language === 'en' ? 'Open Care' : 'Ver em Cuidados'}</span>
                  <ArrowRight size={14} />
                </div>
              </button>

              {/* Card 2: Exames e triagens */}
              {healthChecksCard}

              {/* Card 3: Minha gestação */}
              <button
                type="button"
                onClick={() => onNavigate('care', 'all')}
                className="home-hub-card card-warm"
              >
                <div className="hub-card-icon-wrap icon-warm">
                  <Heart size={22} />
                </div>
                <div className="hub-card-content">
                  <h3 className="hub-card-title">{t.today.hubPregJourneyTitle}</h3>
                  <p className="hub-card-desc">{t.today.hubPregJourneyDesc}</p>
                </div>
                <div className="hub-card-action">
                  <span>{language === 'en' ? 'All Guidance' : 'Todas as Orientações'}</span>
                  <ArrowRight size={14} />
                </div>
              </button>

              {/* Card 4: Minha Rede de Apoio (Pergunte segue no menu fixo) */}
              <button
                type="button"
                onClick={() => onOpenSupportNetwork?.()}
                className="home-hub-card card-coral"
              >
                <div className="hub-card-icon-wrap icon-coral">
                  <HandHeart size={22} />
                </div>
                <div className="hub-card-content">
                  <h3 className="hub-card-title">{t.today.hubSupportTitle}</h3>
                  <p className="hub-card-desc">{t.today.hubSupportDesc}</p>
                </div>
                <div className="hub-card-action">
                  <span>{t.today.hubSupportAction}</span>
                  <ArrowRight size={14} />
                </div>
              </button>
            </>
          ) : (
            <>
              {/* Card 1: Sua recuperação */}
              <button
                type="button"
                onClick={() => onNavigate('care', 'mom')}
                className="home-hub-card card-coral"
              >
                <div className="hub-card-icon-wrap icon-coral">
                  <Flower2 size={22} />
                </div>
                <div className="hub-card-content">
                  <h3 className="hub-card-title">{t.today.hubBabyRecoveryTitle}</h3>
                  <p className="hub-card-desc">{t.today.hubBabyRecoveryDesc}</p>
                </div>
                <div className="hub-card-action">
                  <span>{language === 'en' ? 'Mother Care' : 'Cuidados da Mãe'}</span>
                  <ArrowRight size={14} />
                </div>
              </button>

              {/* Card 2: Exames e triagens */}
              {healthChecksCard}

              {/* Card 3: Cuidados do bebê */}
              <button
                type="button"
                onClick={() => onNavigate('care', 'baby')}
                className="home-hub-card card-sage"
              >
                <div className="hub-card-icon-wrap icon-sage">
                  <Baby size={22} />
                </div>
                <div className="hub-card-content">
                  <h3 className="hub-card-title">{t.today.hubBabyCareTitle}</h3>
                  <p className="hub-card-desc">{t.today.hubBabyCareDesc}</p>
                </div>
                <div className="hub-card-action">
                  <span>{language === 'en' ? 'Baby Care' : 'Ver Cuidados'}</span>
                  <ArrowRight size={14} />
                </div>
              </button>

              {/* Card 4: Minha Rede de Apoio (Pergunte segue no menu fixo) */}
              <button
                type="button"
                onClick={() => onOpenSupportNetwork?.()}
                className="home-hub-card card-warm"
              >
                <div className="hub-card-icon-wrap icon-warm">
                  <HandHeart size={22} />
                </div>
                <div className="hub-card-content">
                  <h3 className="hub-card-title">{t.today.hubSupportTitle}</h3>
                  <p className="hub-card-desc">{t.today.hubSupportDesc}</p>
                </div>
                <div className="hub-card-action">
                  <span>{t.today.hubSupportAction}</span>
                  <ArrowRight size={14} />
                </div>
              </button>
            </>
          )}
        </div>
        {emergencyCard}
      </section>
    </div>
  );
};
export default TodayView;
