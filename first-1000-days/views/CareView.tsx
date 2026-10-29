import React, { useState, useMemo } from 'react';
import { UserProfile, JourneyRecord, ActiveTab, ContentItem } from '../types';
import { getContentCatalog } from '../data/contents';
import { journeyStorage } from '../services/journeyStorage';
import { useLanguage } from '../context/LanguageContext';
import { getLocalizedStageLabel } from '../locales';
import {
  Baby,
  Heart,
  Shield,
  ShieldCheck,
  Milk,
  Sparkles,
  BookOpen,
  Check,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  AlertCircle
} from 'lucide-react';

interface CareViewProps {
  profile: UserProfile;
  onAddRecord: (record: JourneyRecord) => void;
  onNavigate: (tab: ActiveTab) => void;
  initialCategory?: string;
}

export const CareView: React.FC<CareViewProps> = ({
  profile,
  onAddRecord,
  onNavigate,
  initialCategory
}) => {
  const { language, t } = useLanguage();
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory || 'all');
  const [activityNote, setActivityNote] = useState<string>('');
  const [activeModalId, setActiveModalId] = useState<string | null>(null);

  // Controle de artigos expandidos individualmente
  const [expandedArticles, setExpandedArticles] = useState<Record<string, boolean>>({});

  React.useEffect(() => {
    if (initialCategory) {
      setSelectedCategory(initialCategory);
    }
  }, [initialCategory]);

  const toggleExpand = (artId: string) => {
    setExpandedArticles((prev) => ({
      ...prev,
      [artId]: !prev[artId]
    }));
  };

  // 1. Organização dos Filtros Prioritários: Tudo | Mãe | Bebê | Segurança (adaptado à fase)
  const filterOptions = useMemo(() => {
    if (profile.phase === 'pregnancy') {
      return [
        { id: 'all', label: t.care.catAll, icon: BookOpen },
        { id: 'mom', label: language === 'en' ? 'Mother' : 'Mãe & Bem-estar', icon: Heart },
        { id: 'baby', label: language === 'en' ? 'Baby' : 'Bebê', icon: Baby },
        { id: 'safety_prevention', label: t.care.catSafety, icon: Shield }
      ];
    }

    return [
      { id: 'all', label: t.care.catAll, icon: BookOpen },
      { id: 'mom', label: language === 'en' ? 'Mother' : 'Mãe', icon: Heart },
      { id: 'baby', label: t.care.catBaby || (language === 'en' ? 'Baby' : 'Bebê'), icon: Baby },
      { id: 'safety_prevention', label: t.care.catSafety, icon: Shield },
      { id: 'feeding', label: t.care.catFeeding, icon: Milk },
      { id: 'development', label: t.care.catDevelopment, icon: Sparkles }
    ];
  }, [profile.phase, language, t]);

  // Catálogo no idioma ativo
  const catalog = getContentCatalog(language);

  // Filtra catálogo pela fase da usuária
  const phaseArticles = useMemo(() => {
    return catalog.filter((item) => {
      if (item.phase !== 'both' && item.phase !== profile.phase) return false;
      if (profile.phase === 'baby') {
        const min = item.minStageMonths ?? 0;
        const max = item.maxStageMonths ?? 24;
        return profile.stageValue >= min && profile.stageValue <= max;
      }
      return true;
    });
  }, [catalog, profile.phase, profile.stageValue]);

  // Filtra artigos pela categoria selecionada
  const filteredArticles = useMemo(() => {
    return phaseArticles.filter((item) => {
      if (selectedCategory === 'all') return true;
      if (selectedCategory === 'mom' || selectedCategory === 'wellbeing') {
        return item.audience === 'mom' || item.category === 'wellbeing' || item.category === 'mom_care';
      }
      if (selectedCategory === 'baby') {
        return item.audience === 'baby' || item.category === 'baby_care' || item.category === 'development';
      }
      return item.category === selectedCategory;
    });
  }, [phaseArticles, selectedCategory]);

  const handleOpenNoteModal = (artId: string) => {
    setActiveModalId(artId);
    setActivityNote('');
  };

  const handleConfirmActivity = (art: ContentItem) => {
    const todayStr = new Date().toISOString().split('T')[0];
    const now = new Date();
    const timeLabel = `${t.journey.dateTodayPrefix}, ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const defaultNote = language === 'en'
      ? `Practiced care guidance: "${art.title}"`
      : `Pratiquei a orientação de cuidados: "${art.title}"`;

    const newRecord: JourneyRecord = {
      id: `rec-care-${Date.now()}`,
      subject: art.audience === 'mom' ? 'mom' : 'baby',
      tags: [art.tagLabel || art.title],
      note: activityNote.trim() || defaultNote,
      sourceActivityTitle: art.title,
      contentId: art.id,
      timestamp: now.toISOString(),
      eventDate: todayStr,
      dateLabel: timeLabel
    };

    onAddRecord(newRecord);
    setActiveModalId(null);
    setActivityNote('');
  };

  const localizedStage = getLocalizedStageLabel(profile, language);

  return (
    <div className="content-area">
      {/* Cabeçalho Editorial da Biblioteca de Cuidados */}
      <div style={{ marginBottom: '20px' }}>
        <span className="tag-badge tag-warm" style={{ marginBottom: '6px' }}>
          {t.care.badge}
        </span>
        <h1 style={{ fontSize: '1.45rem', fontFamily: 'var(--font-serif)', fontWeight: 700, color: 'var(--text-main)', margin: '4px 0 6px 0' }}>
          {t.care.title}
        </h1>
        <p style={{ fontSize: '0.86rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.4 }}>
          {language === 'en'
            ? `Evidence-based guidance for ${localizedStage}. When practiced, you can log it to your Journey.`
            : `Orientações práticas para ${localizedStage}. Ao praticar, registre um momento na sua Jornada.`}
        </p>
      </div>

      {/* 2. Pílulas de Filtros Prioritárias (Tudo | Mãe | Bebê | Segurança | ...) */}
      <div
        className="care-filter-scroll"
        role="tablist"
        aria-label={language === 'en' ? 'Filter care categories' : 'Filtrar categorias de cuidados'}
      >
        {filterOptions.map((cat) => {
          const isSelected = selectedCategory === cat.id;
          const IconComponent = cat.icon;
          return (
            <button
              key={cat.id}
              role="tab"
              aria-selected={isSelected}
              onClick={() => setSelectedCategory(cat.id)}
              className={`care-filter-pill ${isSelected ? 'active' : ''}`}
            >
              <IconComponent size={14} className="filter-pill-icon" />
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* 3. Lista de Cartões Editoriais com Medalhão Circular Sobreposto */}
      <div className="care-cards-stack">
        {filteredArticles.length === 0 ? (
          <div className="care-empty-state">
            <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', margin: 0 }}>
              {language === 'en'
                ? 'No guidelines found for this category.'
                : 'Nenhuma orientação encontrada para esta categoria.'}
            </p>
          </div>
        ) : (
          filteredArticles.map((art) => {
            const isRecordedToday = journeyStorage.hasActivityBeenRecorded(art.id);
            const isModalOpen = activeModalId === art.id;
            const isSafetyArticle = art.category === 'safety_prevention';
            const isExpanded = expandedArticles[art.id] || false;

            // Determina a identidade visual do medalhão: Mãe, Bebê ou Segurança
            const isMomContent = art.audience === 'mom' || art.category === 'wellbeing' || art.category === 'mom_care';
            const badgeType = isSafetyArticle ? 'shield' : isMomContent ? 'mom' : 'baby';

            return (
              <article key={art.id} className={`care-editorial-card card-badge-${badgeType}`}>
                {/* 1. Pequeno medalhão circular centralizado sobreposto à borda superior */}
                <div
                  className={`care-medallion-badge medallion-${badgeType}`}
                  aria-hidden="true"
                >
                  {isSafetyArticle ? (
                    <Shield size={14} color="#C76B50" />
                  ) : isMomContent ? (
                    <Heart size={14} color="#C76B50" />
                  ) : (
                    <Baby size={14} color="#5B8266" />
                  )}
                </div>

                {/* Cabeçalho do Cartão: Categoria e Validação */}
                <div className="care-card-header">
                  <span className={`tag-badge ${isMomContent ? 'tag-primary' : isSafetyArticle ? 'tag-alert' : 'tag-sage'}`} style={{ fontSize: '0.72rem' }}>
                    {art.categoryLabel}
                  </span>

                  {art.validationStatus === 'verified' && (
                    <span style={{ fontSize: '0.72rem', color: 'var(--sage)', display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
                      <ShieldCheck size={13} color="var(--sage)" />
                      <span>{language === 'en' ? 'Official Guideline' : 'Fonte Oficial'}</span>
                    </span>
                  )}
                  {art.validationStatus === 'pending_review' && (
                    <span style={{ fontSize: '0.72rem', color: '#99631E', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                      <AlertCircle size={12} color="#99631E" />
                      <span>{language === 'en' ? 'Under Review' : 'Em Revisão'}</span>
                    </span>
                  )}
                </div>

                {/* Título Editorial com Tipografia Serena */}
                <h2 className="care-card-title">
                  {art.title}
                </h2>

                {/* Prática Recomendada SEMPRE Visível em Destaque */}
                {art.practicalAction && (
                  <div className={`care-action-box action-box-${badgeType}`}>
                    <strong style={{ color: isSafetyArticle ? '#9B3E25' : isMomContent ? '#9B5E46' : '#456D50' }}>
                      {language === 'en' ? 'Practical Idea: ' : 'Ideia prática: '}
                    </strong>
                    <span>{art.practicalAction}</span>
                  </div>
                )}

                {/* Texto Educativo com Redução de Densidade Textual */}
                <div className="care-educational-wrap">
                  {/* Salvaguarda: Artigos de segurança NÃO são escondidos em acordeom */}
                  {isSafetyArticle ? (
                    <p className="care-educational-text full">
                      {art.educationalText}
                    </p>
                  ) : (
                    <>
                      <p className="care-educational-text">
                        {isExpanded || art.educationalText.length <= 120
                          ? art.educationalText
                          : `${art.educationalText.slice(0, 120)}...`}
                      </p>

                      {art.educationalText.length > 120 && (
                        <button
                          type="button"
                          onClick={() => toggleExpand(art.id)}
                          className="care-expand-btn"
                          aria-expanded={isExpanded}
                        >
                          {isExpanded ? (
                            <>
                              <span>{t.care.collapseBtn || (language === 'en' ? 'Collapse' : 'Recolher')}</span>
                              <ChevronUp size={13} />
                            </>
                          ) : (
                            <>
                              <span>{t.care.expandBtn || (language === 'en' ? 'Read full guidance' : 'Ler orientação completa')}</span>
                              <ChevronDown size={13} />
                            </>
                          )}
                        </button>
                      )}
                    </>
                  )}
                </div>

                {/* Rodapé: Citação da Fonte e Ação de Registro na Jornada */}
                <div className="care-card-footer">
                  <div className="care-source-note">
                    <BookOpen size={12} />
                    <span title={art.source}>{art.source}</span>
                  </div>

                  <div className="care-action-container">
                    {!isRecordedToday ? (
                      !isModalOpen ? (
                        <button
                          type="button"
                          onClick={() => handleOpenNoteModal(art.id)}
                          className="care-record-btn"
                        >
                          <Check size={14} />
                          <span>{t.care.doActivityBtn}</span>
                        </button>
                      ) : (
                        <div className="care-note-modal-inline">
                          <div style={{ fontSize: '0.8rem', fontWeight: 600, marginBottom: '6px', color: 'var(--text-main)' }}>
                            {t.care.modalDesc}
                          </div>
                          <textarea
                            value={activityNote}
                            onChange={(e) => setActivityNote(e.target.value)}
                            placeholder={t.care.modalPlaceholder}
                            rows={2}
                            className="care-note-textarea"
                          />
                          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                            <button
                              type="button"
                              onClick={() => setActiveModalId(null)}
                              className="btn btn-secondary"
                              style={{ padding: '6px 12px', fontSize: '0.78rem', minHeight: '34px' }}
                            >
                              {t.care.modalCancelBtn}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleConfirmActivity(art)}
                              className="btn btn-primary"
                              style={{ padding: '6px 14px', fontSize: '0.8rem', minHeight: '34px' }}
                            >
                              {t.care.modalConfirmBtn}
                            </button>
                          </div>
                        </div>
                      )
                    ) : (
                      <div className="care-done-row">
                        <span className="care-done-badge">
                          <Check size={14} />
                          <span>{t.care.activityDoneBadge}</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => onNavigate('journey')}
                          className="care-journey-link"
                        >
                          <span>{language === 'en' ? 'View in Journey' : 'Ver na Jornada'}</span>
                          <ArrowRight size={12} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </article>
            );
          })
        )}
      </div>
    </div>
  );
};

export default CareView;
