import React, { useState, useMemo } from 'react';
import { UserProfile, JourneyRecord, ActiveTab, CheckInMood } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { Heart, Baby, Check, ArrowRight, Sparkles } from 'lucide-react';
import { MoodFace, MoodFaceVariant } from './MoodFace';
import { sameTag } from '../domain/journeyTags';

interface WeeklyMomentsProps {
  profile: UserProfile;
  records: JourneyRecord[];
  onAddRecord: (record: JourneyRecord) => void;
  onNavigate: (tab: ActiveTab) => void;
  onMoodChange?: (mood: CheckInMood) => void;
}

interface MomentOption {
  id: string;
  label: string;
  face: MoodFaceVariant;
  tag: string;
  legacyTags?: string[];
  mood?: CheckInMood;
}

export const WeeklyMoments: React.FC<WeeklyMomentsProps> = ({
  profile,
  records,
  onAddRecord,
  onNavigate,
  onMoodChange
}) => {
  const { language, t } = useLanguage();

  // Durante a gestação: apenas o registro da mãe.
  // Após o nascimento: alternador Mãe | Bebê.
  const isPregnancy = profile.phase === 'pregnancy';
  const [activeSubject, setActiveSubject] = useState<'mom' | 'baby'>('mom');

  const todayISO = useMemo(() => new Date().toISOString().split('T')[0], []);

  // 4 Opções para a Mãe (Autorrelato de bem-estar com mapeamento para ruleEngine)
  const momOptions: MomentOption[] = useMemo(
    () => [
      {
        id: 'serene',
        label: language === 'en' ? 'Serene & Calm' : 'Serena e calma',
        face: 'serene',
        tag: language === 'en' ? 'Mood: Serene' : 'Humor: Serena',
        mood: 'good'
      },
      {
        id: 'autopilot',
        label: language === 'en' ? 'On autopilot' : 'No piloto automático',
        face: 'autopilot',
        tag: language === 'en' ? 'Mood: Autopilot' : 'Humor: No piloto automático',
        // Registros antigos de "Tranquila e presente" continuam aparecendo na semana
        legacyTags: ['Mood: Balanced', 'Humor: Tranquila'],
        mood: 'neutral'
      },
      {
        id: 'tired',
        label: language === 'en' ? 'Tired & Sleepy' : 'Cansada do dia',
        face: 'tired',
        tag: language === 'en' ? 'Mood: Tired' : 'Humor: Cansada',
        mood: 'tired'
      },
      {
        id: 'sensitive',
        label: language === 'en' ? 'Sensitive & Overwhelmed' : 'Sensível e emotiva',
        face: 'sensitive',
        tag: language === 'en' ? 'Mood: Sensitive' : 'Humor: Sensível',
        mood: 'struggling'
      }
    ],
    [language]
  );

  // 4 Opções para o Bebê (Comportamento observável da rotina, linguagem neutra e não diagnóstica)
  const babyOptions: MomentOption[] = useMemo(
    () => [
      {
        id: 'calm',
        label: language === 'en' ? 'Calm & Settled' : 'Calmo e confortável',
        face: 'calm',
        tag: language === 'en' ? 'Baby: Calm' : 'Bebê: Calmo'
      },
      {
        id: 'curious',
        label: language === 'en' ? 'Curious & Active' : 'Curioso e atento',
        face: 'curious',
        tag: language === 'en' ? 'Baby: Curious' : 'Bebê: Curioso'
      },
      {
        id: 'sleepy',
        label: language === 'en' ? 'Sleepy & Resting' : 'Sonolento e relaxado',
        face: 'sleepy',
        tag: language === 'en' ? 'Baby: Sleepy' : 'Bebê: Sonolento'
      },
      {
        id: 'fussy',
        label: language === 'en' ? 'Fussy / Needing comfort' : 'Choroso ou pedindo colo',
        face: 'fussy',
        tag: language === 'en' ? 'Baby: Needing comfort' : 'Bebê: Pedindo colo'
      }
    ],
    [language]
  );

  const currentOptions = isPregnancy || activeSubject === 'mom' ? momOptions : babyOptions;

  // Últimos 7 dias (6 anteriores + hoje)
  const last7Days = useMemo(() => {
    const days = [];
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const iso = d.toISOString().split('T')[0];
      const isToday = i === 0;
      const weekdayShort = new Intl.DateTimeFormat(language === 'en' ? 'en-US' : 'pt-BR', {
        weekday: 'short'
      })
        .format(d)
        .toUpperCase()
        .replace(/\./g, '')
        .slice(0, 3);
      const dayNum = d.getDate();
      days.push({ date: d, iso, isToday, weekdayShort, dayNum });
    }
    return days;
  }, [language]);

  // Registro de hoje para o sujeito ativo
  const todayRecord = useMemo(() => {
    const targetSubject = isPregnancy ? 'mom' : activeSubject;
    return records.find(
      (r) =>
        r.eventDate === todayISO &&
        r.subject === targetSubject &&
        (r.id.startsWith('rec-moment-') ||
          r.tags.some((t) => t.startsWith('Humor:') || t.startsWith('Mood:') || t.startsWith('Bebê:') || t.startsWith('Baby:')))
    );
  }, [records, todayISO, isPregnancy, activeSubject]);

  // Encontra indicador para um dia específico da semana
  const getDayIndicator = (isoDate: string) => {
    const targetSubject = isPregnancy ? 'mom' : activeSubject;
    const rec = records.find(
      (r) =>
        r.eventDate === isoDate &&
        r.subject === targetSubject &&
        (r.id.startsWith('rec-moment-') ||
          r.tags.some((t) => t.startsWith('Humor:') || t.startsWith('Mood:') || t.startsWith('Bebê:') || t.startsWith('Baby:')))
    );

    if (!rec) return null;

    // Procura o rosto nas opções conhecidas
    const allOptions = [...momOptions, ...babyOptions];
    const match = allOptions.find(
      // Vale o registro feito em qualquer idioma e com o texto antigo da opção
      (o) => rec.tags.some((t) => sameTag(t, o.tag) || o.legacyTags?.some((tag) => sameTag(t, tag)))
    );
    return match ? <MoodFace variant={match.face} size={16} /> : '●';
  };

  const handleSelectOption = (opt: MomentOption) => {
    const targetSubject = isPregnancy ? 'mom' : activeSubject;
    const now = new Date();
    const timeLabel = `${t.journey.dateTodayPrefix}, ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const momentId = `rec-moment-${targetSubject}-${todayISO}`;

    const newRecord: JourneyRecord = {
      id: momentId,
      subject: targetSubject,
      tags: [opt.tag],
      note:
        targetSubject === 'mom'
          ? language === 'en'
            ? `Self-reported well-being: ${opt.label}`
            : `Autorrelato de bem-estar: ${opt.label}`
          : language === 'en'
            ? `Observable routine behavior: ${opt.label}`
            : `Comportamento observado da rotina: ${opt.label}`,
      timestamp: now.toISOString(),
      eventDate: todayISO,
      dateLabel: timeLabel
    };

    onAddRecord(newRecord);

    if (targetSubject === 'mom' && onMoodChange && opt.mood) {
      onMoodChange(opt.mood);
    }
  };

  return (
    <section className="weekly-moments-card" aria-label={language === 'en' ? 'Daily check-in' : 'Check-in do dia'}>
      {/* Cabeçalho do componente com alternador ou badge de gestante */}
      <div className="weekly-moments-header">
        <div className="weekly-moments-title-wrap">
          <Sparkles size={14} className="weekly-moments-icon" />
          <h2 className="weekly-moments-title">
            {language === 'en' ? 'Daily check-in' : 'Check-in do dia'}
          </h2>
        </div>

        {!isPregnancy ? (
          <div className="weekly-moments-toggle" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={activeSubject === 'mom'}
              onClick={() => setActiveSubject('mom')}
              className={`weekly-toggle-btn ${activeSubject === 'mom' ? 'active-mom' : ''}`}
            >
              <Heart size={12} />
              <span>{language === 'en' ? 'You' : 'Você'}</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeSubject === 'baby'}
              onClick={() => setActiveSubject('baby')}
              className={`weekly-toggle-btn ${activeSubject === 'baby' ? 'active-baby' : ''}`}
            >
              <Baby size={12} />
              <span>{language === 'en' ? 'Baby' : 'Bebê'}</span>
            </button>
          </div>
        ) : (
          <span className="weekly-pregnancy-badge">
            <Heart size={12} />
            <span>{language === 'en' ? 'Your well-being' : 'Seu bem-estar'}</span>
          </span>
        )}
      </div>

      {/* Faixa horizontal dos 7 dias */}
      <div className="weekly-moments-strip">
        {last7Days.map((day) => {
          const indicator = getDayIndicator(day.iso);
          return (
            <div
              key={day.iso}
              className={`weekly-day-col ${day.isToday ? 'today' : ''}`}
              title={day.iso}
            >
              <span className="weekly-day-name">{day.weekdayShort}</span>
              <span className="weekly-day-num">{day.dayNum}</span>
              <div className="weekly-day-indicator">
                {indicator ? (
                  <span className="weekly-indicator-emoji">{indicator}</span>
                ) : (
                  <span className="weekly-indicator-empty">·</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Pergunta / Convite de registro do dia */}
      <p className="weekly-moments-prompt">
        {isPregnancy || activeSubject === 'mom'
          ? language === 'en'
            ? 'How are you feeling today?'
            : 'Como você está se sentindo hoje?'
          : language === 'en'
            ? 'How has baby been today?'
            : 'Como o bebê esteve hoje?'}
      </p>

      {/* 4 Opções táteis rápidas */}
      <div className="weekly-options-grid">
        {currentOptions.map((opt) => {
          const isSelected = todayRecord?.tags.some((t) => sameTag(t, opt.tag)) ?? false;
          const activeClass =
            isSelected
              ? isPregnancy || activeSubject === 'mom'
                ? 'active-mom'
                : 'active-baby'
              : '';

          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => handleSelectOption(opt)}
              className={`weekly-option-card ${activeClass}`}
            >
              <span className="weekly-option-emoji" aria-hidden="true">
                <MoodFace variant={opt.face} />
              </span>
              <span className="weekly-option-label">{opt.label}</span>
              {isSelected && (
                <Check
                  size={14}
                  className="weekly-option-check"
                  color={isPregnancy || activeSubject === 'mom' ? 'var(--primary)' : 'var(--sage)'}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Rodapé informativo: status de hoje e atalho à Jornada */}
      <div className="weekly-footer">
        <span className="weekly-status-text">
          {todayRecord
            ? language === 'en'
              ? 'Recorded today • Tap another to update'
              : 'Registrado hoje • Toque para atualizar'
            : language === 'en'
              ? 'Choose one to note today'
              : 'Selecione uma opção para registrar'}
        </span>

        <button
          type="button"
          onClick={() => onNavigate('journey')}
          className="weekly-journey-link"
        >
          <span>{language === 'en' ? 'Full timeline' : 'Histórico na Jornada'}</span>
          <ArrowRight size={12} />
        </button>
      </div>
    </section>
  );
};
