import React, { useState, useEffect, useMemo } from 'react';
import { UserProfile } from '../types';
import { useLanguage } from '../context/LanguageContext';
import {
  consultEducationalAssistant,
  AskResponse,
  checkGatewayHealth
} from '../services/askService';
import {
  MessageCircle,
  Sparkles,
  ArrowRight,
  ArrowUpRight,
  ShieldAlert,
  AlertTriangle,
  PhoneCall,
  RotateCcw,
  BookOpen,
  ChevronDown,
  ChevronUp,
  WifiOff
} from 'lucide-react';

interface AskViewProps {
  profile: UserProfile;
}

// Renderizador de formatação inline (negrito ** e itálico *)
function renderInlineFormatting(line: string, keyPrefix: string): React.ReactNode {
  const parts: React.ReactNode[] = [];
  const regex = /(\*\*([^*]+)\*\*|\*([^*]+)\*)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(line)) !== null) {
    if (match.index > lastIndex) {
      parts.push(line.slice(lastIndex, match.index));
    }
    if (match[2]) {
      parts.push(<strong key={`${keyPrefix}-${match.index}`}>{match[2]}</strong>);
    } else if (match[3]) {
      parts.push(<em key={`${keyPrefix}-${match.index}`}>{match[3]}</em>);
    }
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < line.length) {
    parts.push(line.slice(lastIndex));
  }

  return parts.length > 0 ? parts : line;
}

// Renderizador tipográfico de respostas com espaçamento mobile
function renderFormattedAnswer(text: string): React.ReactNode {
  const blocks = text.split(/\n\n+/);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {blocks.map((block, bIdx) => {
        const lines = block.split(/\n/).map((l) => l.trim()).filter(Boolean);
        const hasListItems = lines.some((l) => /^[•\-*]|\d+\.\s+/.test(l));

        if (!hasListItems) {
          return (
            <p
              key={bIdx}
              style={{
                margin: 0,
                fontSize: '0.92rem',
                color: 'var(--text-main)',
                lineHeight: 1.6
              }}
            >
              {renderInlineFormatting(lines.join(' '), `p-${bIdx}`)}
            </p>
          );
        }

        return (
          <div key={bIdx} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {lines.map((line, lIdx) => {
              const listMatch = line.match(/^([•\-*]|\d+\.)\s*(.+)$/);

              if (listMatch) {
                const marker = listMatch[1];
                const content = listMatch[2];
                const isNumeric = /\d+\./.test(marker);

                return (
                  <div
                    key={`${bIdx}-${lIdx}`}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '8px',
                      padding: '2px 0',
                      fontSize: '0.9rem',
                      lineHeight: 1.55,
                      color: 'var(--text-main)'
                    }}
                  >
                    <span
                      style={{
                        color: 'var(--primary)',
                        fontWeight: isNumeric ? 600 : 700,
                        fontSize: isNumeric ? '0.82rem' : '1.05rem',
                        lineHeight: '1.4rem',
                        userSelect: 'none',
                        flexShrink: 0,
                        minWidth: isNumeric ? '16px' : '8px',
                        textAlign: isNumeric ? 'right' : 'center'
                      }}
                    >
                      {isNumeric ? marker : '•'}
                    </span>
                    <div style={{ flex: 1 }}>
                      {renderInlineFormatting(content, `${bIdx}-${lIdx}`)}
                    </div>
                  </div>
                );
              }

              return (
                <p
                  key={`${bIdx}-${lIdx}`}
                  style={{
                    margin: '0 0 4px 0',
                    fontSize: '0.92rem',
                    color: 'var(--text-main)',
                    lineHeight: 1.6
                  }}
                >
                  {renderInlineFormatting(line, `${bIdx}-${lIdx}`)}
                </p>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

export const AskView: React.FC<AskViewProps> = ({ profile }) => {
  const { language, t } = useLanguage();
  const isDev = Boolean((import.meta as any).env?.DEV);

  const [question, setQuestion] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState<AskResponse | null>(null);
  const [showSources, setShowSources] = useState(false);
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Diagnóstico técnico silencioso restrito ao console do desenvolvedor
  useEffect(() => {
    if (isDev) {
      checkGatewayHealth().then((status) => {
        console.debug('[First 1,000 Days Gateway Health]:', status);
      }).catch(() => {});
    }
  }, [isDev]);

  const maxChars = 300;

  // 3. Perguntas Sugeridas Dinâmicas por Fase e Estágio Real
  const dynamicSampleQuestions = useMemo(() => {
    if (profile.phase === 'pregnancy') {
      return language === 'en'
        ? [
            'How can I care for my well-being and rest during pregnancy?',
            'Which warning signs require immediate medical evaluation?',
            'How can I practice pelvic breathing and gentle relaxation?'
          ]
        : [
            'Como posso cuidar do meu bem-estar e descanso na gestação?',
            'Quais sinais de alerta exigem avaliação médica imediata?',
            'Como praticar respiração e relaxamento pélvico?'
          ];
    }

    // Bebê conforme meses reais
    const months = profile.stageValue ?? 0;
    if (months <= 1) {
      return language === 'en'
        ? [
            'How can I care for my postpartum recovery?',
            'How can I tell if the breastfeeding latch is correct?',
            'How to ensure safe sleep and a clear crib for my newborn?'
          ]
        : [
            'Como posso cuidar da minha recuperação pós-parto?',
            'Como saber se a pega da amamentação está correta?',
            'Como garantir um sono seguro e berço livre para o bebê?'
          ];
    }
    if (months <= 3) {
      return language === 'en'
        ? [
            'How can I care for my recovery and rest?',
            'How to recognize hunger cues and soothing techniques for baby?',
            'What to expect from baby development and gentle tummy time?'
          ]
        : [
            'Como posso cuidar da minha recuperação e descanso?',
            'Como reconhecer sinais de fome e cólica no bebê?',
            'O que esperar do desenvolvimento e estímulos desta fase?'
          ];
    }
    if (months <= 6) {
      return language === 'en'
        ? [
            'How to practice gentle tummy time and floor play safely?',
            'How to prevent falls as the baby begins to roll over?',
            'How to recognize readiness signs for starting solid foods?'
          ]
        : [
            'Como estimular o bebê de bruços com segurança (tummy time)?',
            'Como prevenir quedas quando o bebê começa a rolar?',
            'Como identificar os sinais de prontidão para introdução alimentar?'
          ];
    }
    if (months <= 12) {
      return language === 'en'
        ? [
            'How to prevent choking and small object hazards at home?',
            'How to encourage safe chewing and feeding autonomy?',
            'What to observe as baby learns to sit and crawl?'
          ]
        : [
            'Como prevenir engasgos e perigo de peças pequenas no chão?',
            'Como incentivar a mastigação e autonomia na alimentação?',
            'O que observar nos marcos de engatinhar e sentar sem apoio?'
          ];
    }

    // 1 a 2 anos
    return language === 'en'
      ? [
          'How to childproof the home for an active toddler?',
          'How to support speech, gestures, and early vocabulary?',
          'How to maintain consistent rest and sleep routines?'
        ]
      : [
          'Como prevenir acidentes domésticos e quedas nesta fase ativa?',
          'Como apoiar a fala e o vocabulário da criança?',
          'Como manter uma rotina previsível de sono e descanso?'
        ];
  }, [profile.phase, profile.stageValue, language]);

  const handleAsk = async (textToAsk: string = question) => {
    const trimmed = textToAsk.trim();
    if (!trimmed || trimmed.length < 4 || isLoading) return;

    setIsLoading(true);
    setResponse(null);
    setShowSources(false);

    try {
      const result = await consultEducationalAssistant(trimmed, profile, language);
      setResponse(result);
    } catch {
      setResponse({
        status: 'error',
        answer:
          language === 'pt-BR'
            ? 'Ocorreu uma instabilidade na consulta. Por favor, tente novamente em instantes.'
            : 'A temporary error occurred while processing your query. Please try again.',
        citations: [],
        safetyDisclaimer: '',
        mode: 'mock',
        isEmergency: false,
        retrievedCount: 0
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setQuestion('');
    setResponse(null);
    setShowSources(false);
  };

  return (
    <div className="content-area">
      {/* 1. Identificação Discreta "ASSISTENTE EDUCATIVO" */}
      <div className="ask-header-badge-row">
        <div className="ask-badge-icon-wrap">
          <MessageCircle size={14} color="#5B8266" />
        </div>
        <span className="ask-badge-label">{t.ask.badge}</span>
      </div>

      {/* 2. Título Acolhedor e Subtítulo Breve */}
      <div style={{ marginBottom: '18px' }}>
        <h1 className="ask-main-title">{t.ask.title}</h1>
        <p className="ask-main-subtitle">{t.ask.subtitle}</p>
      </div>

      {/* Alerta de Modo Offline (se aplicável) */}
      {!isOnline && (
        <div className="ask-offline-banner">
          <WifiOff size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
          <div>
            <strong>{language === 'pt-BR' ? 'Modo Offline Ativo' : 'Offline Mode Active'}:</strong>{' '}
            {language === 'pt-BR'
              ? 'Dispositivo sem conexão à internet. As respostas utilizam exclusivamente as evidências oficiais armazenadas no aplicativo.'
              : 'No internet connection detected. Responses use verified local evidence stored on your device.'}
          </div>
        </div>
      )}

      {/* 3. Campo de Pergunta em Destaque */}
      <div className="ask-input-card">
        <label htmlFor="askQuestionInput" className="ask-input-label">
          {t.ask.inputTitle}
        </label>

        <textarea
          id="askQuestionInput"
          value={question}
          onChange={(e) => setQuestion(e.target.value.slice(0, maxChars))}
          placeholder={t.ask.inputPlaceholder}
          disabled={isLoading}
          rows={3}
          className="ask-textarea"
        />

        <div className="ask-input-footer">
          <span className="ask-char-counter">
            {t.ask.inputLimitHint(question.length, maxChars)}
          </span>

          <button
            type="button"
            className="ask-submit-btn"
            disabled={isLoading || question.trim().length < 4}
            onClick={() => handleAsk()}
          >
            <span>{isLoading ? t.ask.consultingBtn : t.ask.consultBtn}</span>
            <ArrowRight size={15} />
          </button>
        </div>
      </div>

      {/* 4. Resposta Gerada (apresentada logo após o formulário) */}
      {response && (
        <div className="ask-response-wrapper">
          {response.isEmergency ? (
            /* Alerta de Emergência Médica (Prioridade Máxima) */
            <div className="ask-emergency-card">
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
                <AlertTriangle size={20} color="#C0392B" />
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#922B21', margin: 0 }}>
                  {t.ask.emergencyAlertTitle}
                </h3>
              </div>
              <p style={{ fontSize: '0.9rem', color: '#641E16', lineHeight: 1.5, margin: '0 0 12px 0', whiteSpace: 'pre-line' }}>
                {response.answer}
              </p>
              {response.emergencyPhone && (
                <div className="ask-emergency-phone-box">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                    <span style={{ fontSize: '0.84rem', fontWeight: 600, color: '#922B21' }}>
                      {t.ask.emergencyPhoneLabel}
                    </span>
                    <a
                      href={`tel:${response.emergencyPhone.replace(/\D/g, '')}`}
                      className="ask-emergency-call-btn"
                    >
                      <PhoneCall size={14} />
                      <span>{t.ask.emergencyCallSAMU}</span>
                    </a>
                  </div>
                  <div style={{ fontSize: '0.74rem', color: '#78281F', borderTop: '1px dashed #F5B7B1', paddingTop: '6px' }}>
                    ℹ️ {t.ask.emergencyIntlNotice}
                  </div>
                </div>
              )}
            </div>
          ) : response.status === 'error' ? (
            /* Erro na Conexão */
            <div className="ask-error-card">
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '6px' }}>
                <AlertTriangle size={18} color="#D35400" />
                <h3 style={{ fontSize: '0.98rem', fontWeight: 700, color: '#A04000', margin: 0 }}>
                  {t.ask.errorCardTitle}
                </h3>
              </div>
              <p style={{ fontSize: '0.88rem', color: '#6E2C00', lineHeight: 1.45, margin: 0 }}>
                {response.answer}
              </p>
            </div>
          ) : (
            /* Resposta Educativa Normal */
            <article className="ask-answer-card">
              {/* Badge de Transparência do Modo */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span
                  className={`tag-badge ${response.mode === 'mock' ? 'tag-warm' : 'tag-sage'}`}
                  style={{ fontSize: '0.74rem', fontWeight: 600 }}
                >
                  {response.mode === 'mock' ? t.ask.modeMockBadge : t.ask.modeLiveBadge}
                </span>

                <button
                  type="button"
                  onClick={handleReset}
                  className="ask-new-query-btn"
                >
                  <RotateCcw size={12} />
                  <span>{t.ask.newConsultationBtn}</span>
                </button>
              </div>

              {/* Texto Formatado da Resposta */}
              <div className="ask-answer-body">
                {renderFormattedAnswer(response.answer)}
              </div>

              {/* Botão de Citações e Fontes Oficiais */}
              {response.citations && response.citations.length > 0 && (
                <div className="ask-sources-section">
                  <button
                    type="button"
                    onClick={() => setShowSources(!showSources)}
                    className="ask-sources-toggle-btn"
                  >
                    <BookOpen size={13} />
                    <span>
                      {showSources ? t.ask.hideSourcesBtn : t.ask.viewSourcesBtn}{' '}
                      {t.ask.sourcesCount(response.citations.length)}
                    </span>
                    {showSources ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                  </button>

                  {showSources && (
                    <div className="ask-sources-list">
                      {response.citations.map((c, i) => (
                        <div key={i} className="ask-source-item">
                          <div style={{ fontWeight: 600, fontSize: '0.8rem', color: 'var(--text-main)', marginBottom: '2px' }}>
                            {c.document || c.sourceName}
                          </div>
                          <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                            {c.sourceName} {c.sectionOrPage && `• ${c.sectionOrPage}`} {c.countryJurisdiction && `• ${c.countryJurisdiction}`}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </article>
          )}
        </div>
      )}

      {/* 5. Perguntas Sugeridas da Fase ("Não sabe por onde começar?") */}
      <section className="ask-suggestions-section" aria-label={t.ask.commonQuestionsTitle}>
        <div className="ask-suggestions-header">
          <Sparkles size={16} color="#C76B50" />
          <h2 className="ask-suggestions-title">{t.ask.commonQuestionsTitle}</h2>
        </div>

        <div className="ask-suggestions-list">
          {dynamicSampleQuestions.map((q, idx) => (
            <button
              key={idx}
              type="button"
              disabled={isLoading}
              onClick={() => {
                setQuestion(q);
                handleAsk(q);
              }}
              className="ask-suggestion-card"
            >
              <span className="ask-suggestion-text">{q}</span>
              <ArrowUpRight size={15} className="ask-suggestion-arrow" />
            </button>
          ))}
        </div>
      </section>

      {/* 6. Aviso Educativo e de Privacidade Compacto no Rodapé */}
      <div className="ask-disclaimer-card">
        <ShieldAlert size={18} color="#C76B50" style={{ flexShrink: 0, marginTop: '2px' }} />
        <div>
          <strong style={{ display: 'block', fontSize: '0.82rem', color: 'var(--text-main)', marginBottom: '2px' }}>
            {t.ask.disclaimerTitle}
          </strong>
          <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
            {t.ask.disclaimerText}
          </p>
        </div>
      </div>
    </div>
  );
};

export default AskView;

