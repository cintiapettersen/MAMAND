import React, { useState, useEffect, useRef, useCallback } from 'react';
import { UserPhase } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { PageHeader } from './PageHeader';
import { ambientSound, AmbientSoundType, isAmbientSoundSupported } from '../utils/ambientSound';
import {
  Moon,
  Play,
  Pause,
  Square,
  RotateCcw,
  Timer,
  Waves,
  Wind,
  Volume2,
  Info,
  Heart,
  Coffee,
  AlarmClock
} from 'lucide-react';

interface SelfCareViewProps {
  phase: UserPhase;
  onBack: () => void;
}

type RestMode = 'pause' | 'nap';
type RestStatus = 'idle' | 'running' | 'paused' | 'done';

interface StoredRestTimer {
  mode: RestMode;
  durationMin: number;
  status: RestStatus;
  endAt: number | null;
  remainingMs: number;
}

const REST_STORAGE_KEY = 'first1000days_rest_timer';
// Durações são apenas opções de tempo disponível, não recomendações clínicas
const MODE_DURATIONS: Record<RestMode, number[]> = {
  pause: [5, 10, 15, 20],
  nap: [10, 20, 30, 45, 60, 90]
};
const MODE_DEFAULT_DURATION: Record<RestMode, number> = { pause: 10, nap: 20 };
const SOUND_OPTIONS: AmbientSoundType[] = ['white', 'pink', 'brown', 'rain'];
const BREATH_IN_SECONDS = 4;
const BREATH_CYCLE_SECONDS = 10;
const BREATH_OPTIONS = [1, 3] as const;

const RING_RADIUS = 92;
const RING_LENGTH = 2 * Math.PI * RING_RADIUS;

const readStoredTimer = (): StoredRestTimer | null => {
  try {
    const data = localStorage.getItem(REST_STORAGE_KEY);
    if (!data) return null;
    const parsed = JSON.parse(data);
    return { ...parsed, mode: parsed.mode === 'nap' ? 'nap' : 'pause' };
  } catch {
    return null;
  }
};

const formatClock = (ms: number) => {
  const totalSeconds = Math.ceil(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

export const SelfCareView: React.FC<SelfCareViewProps> = ({ phase, onBack }) => {
  const { t } = useLanguage();
  const s = t.selfCare;

  // ---- Descanso (temporizador baseado em horário de término, sobrevive a recarregar/navegar) ----
  const [stored] = useState(readStoredTimer);
  // Sessão que terminou enquanto a usuária estava fora desta tela (sem aviso sonoro)
  const finishedAway =
    stored?.status === 'running' && stored.endAt !== null && stored.endAt <= Date.now();

  const [mode, setMode] = useState<RestMode>(stored?.mode ?? 'pause');
  const [durationMin, setDurationMin] = useState<number>(
    stored?.durationMin ?? MODE_DEFAULT_DURATION[stored?.mode ?? 'pause']
  );
  const [restStatus, setRestStatus] = useState<RestStatus>(() => {
    if (!stored || stored.status === 'done') return 'idle';
    return finishedAway ? 'done' : stored.status;
  });
  const [showAwayNote, setShowAwayNote] = useState(finishedAway);
  const [endAt, setEndAt] = useState<number | null>(finishedAway ? null : stored?.endAt ?? null);
  const [remainingMs, setRemainingMs] = useState<number>(finishedAway ? 0 : stored?.remainingMs ?? 0);
  const [now, setNow] = useState(Date.now());
  const wakeLockRef = useRef<any>(null);

  const durationMs = durationMin * 60000;
  const currentRemaining =
    restStatus === 'running' && endAt ? Math.max(0, endAt - now) : restStatus === 'idle' ? durationMs : remainingMs;

  useEffect(() => {
    try {
      localStorage.setItem(
        REST_STORAGE_KEY,
        JSON.stringify({ mode, durationMin, status: restStatus, endAt, remainingMs } satisfies StoredRestTimer)
      );
    } catch {
      // Sem armazenamento: o temporizador só não é restaurado
    }
  }, [mode, durationMin, restStatus, endAt, remainingMs]);

  const selectMode = (next: RestMode) => {
    setMode(next);
    if (!MODE_DURATIONS[next].includes(durationMin)) setDurationMin(MODE_DEFAULT_DURATION[next]);
  };

  // ---- Sons ----
  const soundSupported = isAmbientSoundSupported();
  const [activeSound, setActiveSound] = useState<AmbientSoundType | null>(null);
  const [volume, setVolume] = useState(0.6);

  const toggleSound = (type: AmbientSoundType) => {
    if (activeSound === type) {
      ambientSound.stop();
      setActiveSound(null);
    } else {
      ambientSound.setVolume(volume);
      ambientSound.play(type);
      setActiveSound(type);
    }
  };

  const stopSound = () => {
    ambientSound.stop();
    setActiveSound(null);
  };

  // Para o som ao sair da página
  useEffect(() => () => ambientSound.stop(0.4), []);

  // ---- Tela acesa enquanto o descanso corre ----
  const releaseWakeLock = useCallback(() => {
    wakeLockRef.current?.release?.().catch(() => undefined);
    wakeLockRef.current = null;
  }, []);

  useEffect(() => {
    if (restStatus !== 'running') {
      releaseWakeLock();
      return;
    }
    const request = async () => {
      try {
        if ('wakeLock' in navigator && document.visibilityState === 'visible') {
          wakeLockRef.current = await (navigator as any).wakeLock.request('screen');
        }
      } catch {
        // Sem suporte ou sem permissão: o temporizador funciona do mesmo jeito
      }
    };
    void request();
    const onVisible = () => document.visibilityState === 'visible' && void request();
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      releaseWakeLock();
    };
  }, [restStatus, releaseWakeLock]);

  const finishRest = useCallback(() => {
    setRestStatus('done');
    setRemainingMs(0);
    setEndAt(null);
    ambientSound.stop(3);
    setActiveSound(null);
    ambientSound.chime();
    navigator.vibrate?.([200, 120, 200]);
  }, []);

  useEffect(() => {
    if (restStatus !== 'running') return;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [restStatus]);

  useEffect(() => {
    if (restStatus === 'running' && endAt && now >= endAt) finishRest();
  }, [now, endAt, restStatus, finishRest]);

  const startRest = () => {
    const start = Date.now();
    setNow(start);
    setEndAt(start + durationMs);
    setRemainingMs(durationMs);
    setShowAwayNote(false);
    setRestStatus('running');
  };

  const pauseRest = () => {
    setRemainingMs(currentRemaining);
    setEndAt(null);
    setRestStatus('paused');
  };

  const resumeRest = () => {
    const start = Date.now();
    setNow(start);
    setEndAt(start + remainingMs);
    setRestStatus('running');
  };

  const resetRest = () => {
    setEndAt(null);
    setRemainingMs(durationMs);
    setShowAwayNote(false);
    setRestStatus('idle');
  };

  // Encerrar a sessão também encerra o som, para o final ser previsível
  const endSession = () => {
    resetRest();
    if (activeSound) stopSound();
  };

  // ---- Respiração guiada (pausar retoma no início do ciclo, sem prender o ar) ----
  const [breathMinutes, setBreathMinutes] = useState<number>(1);
  const [breathActive, setBreathActive] = useState(false);
  const [breathRunning, setBreathRunning] = useState(false);
  const [breathBase, setBreathBase] = useState(0);
  const [breathSegmentStart, setBreathSegmentStart] = useState(0);
  const [breathTick, setBreathTick] = useState(0);
  const [breathDone, setBreathDone] = useState(false);

  const breathElapsed = breathRunning ? breathBase + (breathTick - breathSegmentStart) / 1000 : breathBase;

  useEffect(() => {
    if (!breathRunning) return;
    const id = window.setInterval(() => setBreathTick(Date.now()), 250);
    return () => window.clearInterval(id);
  }, [breathRunning]);

  useEffect(() => {
    if (breathRunning && breathElapsed >= breathMinutes * 60) {
      setBreathRunning(false);
      setBreathActive(false);
      setBreathBase(0);
      setBreathDone(true);
    }
  }, [breathRunning, breathElapsed, breathMinutes]);

  const startBreath = () => {
    const start = Date.now();
    setBreathDone(false);
    setBreathBase(0);
    setBreathSegmentStart(start);
    setBreathTick(start);
    setBreathActive(true);
    setBreathRunning(true);
  };

  const pauseBreath = () => {
    setBreathBase(breathElapsed);
    setBreathRunning(false);
  };

  const resumeBreath = () => {
    const start = Date.now();
    setBreathBase(Math.floor(breathBase / BREATH_CYCLE_SECONDS) * BREATH_CYCLE_SECONDS);
    setBreathSegmentStart(start);
    setBreathTick(start);
    setBreathRunning(true);
  };

  const endBreath = () => {
    setBreathRunning(false);
    setBreathActive(false);
    setBreathBase(0);
  };

  const isInhale = breathRunning && breathElapsed % BREATH_CYCLE_SECONDS < BREATH_IN_SECONDS;
  const breathRemaining = Math.max(0, breathMinutes * 60 - breathElapsed);

  const breathText = breathRunning
    ? isInhale
      ? s.breathIn
      : s.breathOut
    : breathActive
      ? s.breathPaused
      : breathDone
        ? s.breathDone
        : s.breathReady;

  const soundLabels: Record<AmbientSoundType, [string, string]> = {
    white: [s.soundWhite, s.soundWhiteDesc],
    pink: [s.soundPink, s.soundPinkDesc],
    brown: [s.soundBrown, s.soundBrownDesc],
    rain: [s.soundRain, s.soundRainDesc]
  };

  const isNap = mode === 'nap';

  return (
    <div className="content-area selfcare-page">
      <PageHeader
        onBack={onBack}
        backLabel={s.backBtn}
        kicker={s.viewKicker}
        icon={<Moon size={13} />}
        title={s.viewTitle}
        subtitle={s.viewSubtitle}
      />

      {/* 1. PAUSA OU COCHILO COM TEMPORIZADOR */}
      <section className="selfcare-card selfcare-rest" aria-labelledby="restTitle">
        <div className="selfcare-card-header">
          <span className="selfcare-card-icon icon-rest">
            <Timer size={18} />
          </span>
          <div>
            <h2 id="restTitle" className="selfcare-card-title">{s.restTitle}</h2>
            <p className="selfcare-card-subtitle">{s.restSubtitle}</p>
          </div>
        </div>

        {restStatus === 'idle' && (
          <>
            <div className="selfcare-mode-options" role="radiogroup" aria-label={s.restTitle}>
              {(['pause', 'nap'] as RestMode[]).map((option) => (
                <button
                  key={option}
                  type="button"
                  role="radio"
                  aria-checked={mode === option}
                  className={`selfcare-mode-option ${mode === option ? 'selected' : ''}`}
                  onClick={() => selectMode(option)}
                >
                  {option === 'pause' ? <Coffee size={18} /> : <Moon size={18} />}
                  <strong>{option === 'pause' ? s.modePause : s.modeNap}</strong>
                  <span>{option === 'pause' ? s.modePauseDesc : s.modeNapDesc}</span>
                </button>
              ))}
            </div>

            <p className="selfcare-duration-label">{s.durationLabel}</p>
            <div
              className={`selfcare-rest-options ${isNap ? 'cols-3' : 'cols-4'}`}
              role="radiogroup"
              aria-label={s.durationLabel}
            >
              {MODE_DURATIONS[mode].map((min) => (
                <button
                  key={min}
                  type="button"
                  role="radio"
                  aria-checked={durationMin === min}
                  className={`selfcare-rest-option ${durationMin === min ? 'selected' : ''}`}
                  onClick={() => {
                    setDurationMin(min);
                    setRemainingMs(min * 60000);
                  }}
                >
                  <strong>{min}</strong>
                  <span>{s.minutesShort}</span>
                </button>
              ))}
            </div>
          </>
        )}

        {restStatus === 'done' ? (
          <div className="selfcare-rest-done" role="status">
            <span className="selfcare-done-icon">
              <Heart size={22} />
            </span>
            <strong>{isNap ? s.napDoneTitle : s.pauseDoneTitle}</strong>
            <p>{isNap ? s.napDoneText : s.pauseDoneText}</p>
            {showAwayNote && <p className="selfcare-away-note">{s.finishedWhileAway}</p>}
            <button type="button" className="btn btn-secondary" onClick={resetRest}>
              <RotateCcw size={16} />
              <span>{isNap ? s.napAgain : s.pauseAgain}</span>
            </button>
          </div>
        ) : (
          <>
            <div className="selfcare-ring-wrap">
              <svg viewBox="0 0 220 220" className="selfcare-ring" aria-hidden="true">
                <circle cx="110" cy="110" r={RING_RADIUS} className="selfcare-ring-track" />
                <circle
                  cx="110"
                  cy="110"
                  r={RING_RADIUS}
                  className="selfcare-ring-progress"
                  strokeDasharray={RING_LENGTH}
                  strokeDashoffset={RING_LENGTH * (1 - currentRemaining / durationMs)}
                />
              </svg>
              <div className="selfcare-ring-center" role="timer" aria-live="off">
                <span className="selfcare-clock">{formatClock(currentRemaining)}</span>
                <span className="selfcare-clock-label">
                  {restStatus === 'paused' ? s.restPaused : isNap ? s.restRemaining : s.pauseRemaining}
                </span>
              </div>
            </div>

            <div className="selfcare-controls">
              {restStatus === 'idle' && (
                <button type="button" className="btn btn-primary" onClick={startRest}>
                  <Play size={16} />
                  <span>{isNap ? s.restStart : s.pauseStart}</span>
                </button>
              )}
              {restStatus === 'running' && (
                <button type="button" className="btn btn-secondary" onClick={pauseRest}>
                  <Pause size={16} />
                  <span>{s.restPause}</span>
                </button>
              )}
              {restStatus === 'paused' && (
                <button type="button" className="btn btn-primary" onClick={resumeRest}>
                  <Play size={16} />
                  <span>{s.restResume}</span>
                </button>
              )}
              {(restStatus === 'running' || restStatus === 'paused') && (
                <button type="button" className="selfcare-link-btn" onClick={endSession}>
                  <Square size={13} />
                  <span>{s.restEnd}</span>
                </button>
              )}
            </div>
          </>
        )}

        {/* Avisos honestos: o navegador não garante aviso com a tela bloqueada */}
        {isNap ? (
          <>
            <p className="selfcare-alarm-warning">
              <AlarmClock size={16} aria-hidden="true" />
              <span>{s.napAlarmWarning}</span>
            </p>
            {phase === 'baby' && <p className="selfcare-note selfcare-safe-sleep">{s.safeSleepTip}</p>}
          </>
        ) : (
          <p className="selfcare-note">{s.screenNote}</p>
        )}
        <p className="selfcare-note">{s.restChoiceNote}</p>
      </section>

      {/* 2. SONS CALMOS GERADOS NO APARELHO */}
      <section className="selfcare-card selfcare-sounds" aria-labelledby="soundsTitle">
        <div className="selfcare-card-header">
          <span className="selfcare-card-icon icon-sounds">
            <Waves size={18} />
          </span>
          <div>
            <h2 id="soundsTitle" className="selfcare-card-title">{s.soundsTitle}</h2>
            <p className="selfcare-card-subtitle">{s.soundsSubtitle}</p>
          </div>
        </div>

        {soundSupported ? (
          <>
            <div className="selfcare-sound-grid">
              {SOUND_OPTIONS.map((type) => {
                const [label, desc] = soundLabels[type];
                const isActive = activeSound === type;
                return (
                  <button
                    key={type}
                    type="button"
                    aria-pressed={isActive}
                    className={`selfcare-sound sound-${type} ${isActive ? 'active' : ''}`}
                    onClick={() => toggleSound(type)}
                  >
                    <span className="selfcare-sound-play" aria-hidden="true">
                      {isActive ? <Pause size={14} /> : <Play size={14} />}
                    </span>
                    <strong>{label}</strong>
                    <span>{desc}</span>
                    {isActive && (
                      <span className="selfcare-eq" aria-hidden="true">
                        <i />
                        <i />
                        <i />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="selfcare-volume">
              <Volume2 size={16} aria-hidden="true" />
              <label htmlFor="ambientVolume" className="sr-only">
                {s.volumeLabel}
              </label>
              <input
                id="ambientVolume"
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={volume}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  setVolume(v);
                  ambientSound.setVolume(v);
                }}
              />
              {activeSound && (
                <button type="button" className="selfcare-link-btn" onClick={stopSound}>
                  <Square size={13} />
                  <span>{s.soundStop}</span>
                </button>
              )}
            </div>

            <ul className="selfcare-tips">
              <li>{s.soundAutoStop}</li>
              <li>{s.soundMuteHint}</li>
            </ul>
          </>
        ) : (
          <p className="selfcare-note">{s.soundUnsupported}</p>
        )}
      </section>

      {/* 3. RESPIRAÇÃO GUIADA VISUAL */}
      <section className="selfcare-card selfcare-breath" aria-labelledby="breathTitle">
        <div className="selfcare-card-header">
          <span className="selfcare-card-icon icon-breath">
            <Wind size={18} />
          </span>
          <div>
            <h2 id="breathTitle" className="selfcare-card-title">{s.breathTitle}</h2>
            <p className="selfcare-card-subtitle">{s.breathSubtitle}</p>
          </div>
        </div>

        <div className="selfcare-breath-stage">
          <div
            className={`selfcare-breath-circle ${breathRunning ? (isInhale ? 'inhale' : 'exhale') : ''}`}
            aria-hidden="true"
          />
          <p className="selfcare-breath-text" aria-live="polite">
            {breathText}
          </p>
          {breathActive && <span className="selfcare-breath-timer">{formatClock(breathRemaining * 1000)}</span>}
        </div>

        <div className="selfcare-breath-controls">
          {breathActive ? (
            <>
              {breathRunning ? (
                <button type="button" className="btn btn-secondary" onClick={pauseBreath}>
                  <Pause size={16} />
                  <span>{s.breathPause}</span>
                </button>
              ) : (
                <button type="button" className="btn btn-primary" onClick={resumeBreath}>
                  <Play size={16} />
                  <span>{s.breathResume}</span>
                </button>
              )}
              <button type="button" className="selfcare-link-btn" onClick={endBreath}>
                <Square size={13} />
                <span>{s.breathStop}</span>
              </button>
            </>
          ) : (
            <>
              <div className="selfcare-segment" role="radiogroup">
                {BREATH_OPTIONS.map((min) => (
                  <button
                    key={min}
                    type="button"
                    role="radio"
                    aria-checked={breathMinutes === min}
                    className={breathMinutes === min ? 'selected' : ''}
                    onClick={() => setBreathMinutes(min)}
                  >
                    {min} {s.minutesShort}
                  </button>
                ))}
              </div>
              <button type="button" className="btn btn-primary selfcare-breath-start" onClick={startBreath}>
                <Play size={16} />
                <span>{s.breathStart}</span>
              </button>
            </>
          )}
        </div>
      </section>

      <p className="selfcare-footer">
        <Info size={14} aria-hidden="true" />
        <span>{s.footerNote}</span>
      </p>
    </div>
  );
};

export default SelfCareView;
