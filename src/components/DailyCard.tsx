import React, { useState, useMemo, useEffect, useRef } from 'react';
import { UserPhase } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { getDailyCards, DailyCardCategory } from '../data/dailyCards';
import { Sparkles, Heart, Coffee, Smile, Sun, RefreshCw } from 'lucide-react';

interface DailyCardProps {
  phase: UserPhase;
}

interface StoredDailyCard {
  date: string;
  cardId: string | null;
  draws: number;
  history: string[];
}

const STORAGE_KEY = 'first1000days_daily_card';
const HISTORY_SIZE = 10;
// Limite de cartas por dia, para a carta continuar especial
const DAILY_LIMIT = 3;
const FLIP_MS = 450;

const todayKey = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const readStored = (): StoredDailyCard => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      const parsed = JSON.parse(data);
      // A carta tirada vale até o fim do dia; o histórico evita repetições
      const isToday = parsed.date === todayKey();
      return {
        date: todayKey(),
        cardId: isToday ? parsed.cardId : null,
        draws: isToday ? parsed.draws ?? (parsed.cardId ? 1 : 0) : 0,
        history: Array.isArray(parsed.history) ? parsed.history : []
      };
    }
  } catch {
    // Sem armazenamento: a carta só não é lembrada
  }
  return { date: todayKey(), cardId: null, draws: 0, history: [] };
};

const CATEGORY_ICONS: Record<DailyCardCategory, React.ElementType> = {
  validation: Heart,
  selfcare: Coffee,
  humor: Smile,
  perspective: Sun
};

export const DailyCard: React.FC<DailyCardProps> = ({ phase }) => {
  const { language, t } = useLanguage();
  const s = t.dailyCard;
  const cards = useMemo(
    () => getDailyCards(language).filter((c) => c.phase === 'both' || c.phase === phase),
    [language, phase]
  );

  const [stored, setStored] = useState<StoredDailyCard>(readStored);
  const [isFlipped, setIsFlipped] = useState(() => stored.cardId !== null);
  const [isAnimating, setIsAnimating] = useState(false);
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
    } catch {
      // ignora
    }
  }, [stored]);

  useEffect(() => () => {
    if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
  }, []);

  // Busca na lista completa: a carta do dia continua válida mesmo se a fase mudar
  const currentCard = getDailyCards(language).find((c) => c.id === stored.cardId) || null;

  const pickCard = () => {
    const recent = new Set([stored.cardId, ...stored.history]);
    const pool = cards.filter((c) => !recent.has(c.id));
    const options = pool.length > 0 ? pool : cards.filter((c) => c.id !== stored.cardId);
    return options[Math.floor(Math.random() * options.length)];
  };

  const remaining = Math.max(0, DAILY_LIMIT - stored.draws);

  const drawCard = () => {
    if (isAnimating || cards.length === 0 || remaining === 0) return;
    const next = pickCard();
    const save = () =>
      setStored((prev) => ({
        date: todayKey(),
        cardId: next.id,
        draws: prev.draws + 1,
        history: [next.id, ...prev.history.filter((id) => id !== next.id)].slice(0, HISTORY_SIZE)
      }));

    if (!isFlipped) {
      save();
      setIsFlipped(true);
      return;
    }
    // Já revelada: vira de volta, troca a mensagem e revela de novo
    setIsAnimating(true);
    setIsFlipped(false);
    timeoutRef.current = window.setTimeout(() => {
      save();
      setIsFlipped(true);
      setIsAnimating(false);
    }, FLIP_MS);
  };

  const categoryLabel: Record<DailyCardCategory, string> = {
    validation: s.catValidation,
    selfcare: s.catSelfcare,
    humor: s.catHumor,
    perspective: s.catPerspective
  };
  const CategoryIcon = currentCard ? CATEGORY_ICONS[currentCard.category] : Heart;

  return (
    <section className="daily-card-section" aria-label={s.kicker}>
      <div className={`daily-card-deck ${isFlipped ? 'revealed' : ''}`}>
        <div className={`daily-card ${isFlipped ? 'flipped' : ''}`}>
          {/* Frente: carta virada, convidando a tirar */}
          <button
            type="button"
            className="daily-card-face daily-card-front"
            onClick={drawCard}
            aria-hidden={isFlipped}
            tabIndex={isFlipped ? -1 : 0}
          >
            <span className="daily-card-front-icon">
              <Sparkles size={22} />
            </span>
            <span className="daily-card-front-text">
              <strong>{s.drawTitle}</strong>
              <span>{s.drawHint}</span>
            </span>
          </button>

          {/* Verso: a mensagem do dia */}
          <div
            className={`daily-card-face daily-card-back cat-${currentCard?.category ?? 'validation'}`}
            aria-hidden={!isFlipped}
          >
            <div className="daily-card-back-header">
              <span className="daily-card-chip">
                <CategoryIcon size={13} />
                <span>{currentCard ? categoryLabel[currentCard.category] : ''}</span>
              </span>
              <span className="daily-card-kicker">{s.kicker}</span>
            </div>
            <p className="daily-card-message" aria-live="polite">
              {currentCard?.text}
            </p>
            {remaining > 0 ? (
              <div className="daily-card-footer">
                <button
                  type="button"
                  className="daily-card-another"
                  onClick={drawCard}
                  disabled={isAnimating}
                  tabIndex={isFlipped ? 0 : -1}
                >
                  <RefreshCw size={13} />
                  <span>{s.anotherBtn}</span>
                </button>
                <span className="daily-card-remaining">
                  {remaining === 1 ? s.remainingOne : s.remainingMany.replace('{count}', String(remaining))}
                </span>
              </div>
            ) : (
              <p className="daily-card-limit">{s.limitReached}</p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default DailyCard;
