import React, { useEffect, useMemo, useRef, useState } from 'react';
import { X, ChevronDown, ChevronUp } from 'lucide-react';
import type { UserProfile } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { defaultKind, defaultPhase, phaseForKind } from '../domain/healthCheckFormDefaults';
import {
  createFromCatalog,
  createManualHealthCheck,
  validateHealthCheckRecord,
  NAME_MAX,
  NOTE_MAX,
  type CatalogEntryView,
  type HealthCheckKind,
  type HealthCheckMilestones,
  type HealthCheckPhase,
  type HealthCheckRecord,
  type HealthCheckSubject
} from '../domain/healthChecks';

// Folha do formulário de "Exames e triagens": de baixo para cima no celular, janela no
// computador. Nome, tipo e período ficam sempre visíveis; etapas e anotações começam
// recolhidas (na edição, abrem se já tiverem conteúdo). Fechar com alterações pede confirmação.

export const MILESTONE_ORDER: Array<keyof HealthCheckMilestones> = ['discussed', 'scheduled', 'performed', 'resultReceived', 'resultDiscussed'];
const KINDS_BY_SUBJECT: Record<HealthCheckSubject, HealthCheckKind[]> = {
  pregnant_person: ['prenatal_test', 'ultrasound', 'other'],
  baby: ['newborn_screening', 'child_test', 'ultrasound', 'other']
};
const PHASES_BY_SUBJECT: Record<HealthCheckSubject, HealthCheckPhase[]> = {
  pregnant_person: ['pregnancy', 'postpartum'],
  baby: ['newborn', 'infant', 'toddler']
};

export type SheetMode =
  | { kind: 'new'; subject: HealthCheckSubject }
  | { kind: 'edit'; record: HealthCheckRecord }
  | { kind: 'catalog'; view: CatalogEntryView };

interface FormState {
  name: string;
  kind: HealthCheckKind;
  phase: HealthCheckPhase;
  gestationalWeek: string;
  milestones: Partial<Record<keyof HealthCheckMilestones, { checked: boolean; on: string }>>;
  note: string;
}

const subjectOf = (mode: SheetMode): HealthCheckSubject =>
  mode.kind === 'new' ? mode.subject : mode.kind === 'edit' ? mode.record.subject : mode.view.entry.subject;

function initialForm(mode: SheetMode, profile: UserProfile, lang: 'pt-BR' | 'en'): FormState {
  if (mode.kind === 'edit') {
    const r = mode.record;
    return {
      name: r.name,
      kind: r.kind,
      phase: r.phase,
      gestationalWeek: r.gestationalWeek !== undefined ? String(r.gestationalWeek) : '',
      milestones: Object.fromEntries(
        MILESTONE_ORDER.filter((k) => r.milestones[k]).map((k) => [k, { checked: true, on: r.milestones[k]?.on ?? '' }])
      ),
      note: r.personalNote ?? ''
    };
  }
  const subject = subjectOf(mode);
  const agePhase = defaultPhase(subject, profile);
  const kind = mode.kind === 'catalog' ? mode.view.entry.kind : defaultKind(subject, agePhase);
  return {
    name: mode.kind === 'catalog' ? mode.view.entry.label[lang] ?? '' : '',
    kind,
    phase: phaseForKind(kind, agePhase),
    gestationalWeek: '',
    milestones: {},
    note: ''
  };
}

const fieldLabel: React.CSSProperties = { display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '4px' };
const fieldInput: React.CSSProperties = {
  width: '100%',
  padding: '8px 12px',
  fontSize: '0.9rem',
  border: '1px solid var(--border-light)',
  borderRadius: 'var(--radius-sm)',
  backgroundColor: 'var(--bg-main)',
  fontFamily: 'inherit',
  color: 'var(--text-main)',
  boxSizing: 'border-box'
};

interface HealthCheckSheetProps {
  mode: SheetMode;
  profile: UserProfile;
  careCountry?: string;
  onClose: () => void;
  onSave: (record: HealthCheckRecord) => Promise<void>;
}

export const HealthCheckSheet: React.FC<HealthCheckSheetProps> = ({ mode, profile, careCountry, onClose, onSave }) => {
  const { language, t } = useLanguage();
  const h = t.healthChecks;
  const subject = subjectOf(mode);
  const initial = useMemo(() => initialForm(mode, profile, language), [mode]); // eslint-disable-line react-hooks/exhaustive-deps
  const [form, setForm] = useState<FormState>(initial);
  // Depois que a família escolhe o período, ele não muda mais sozinho
  const [phaseTouched, setPhaseTouched] = useState(mode.kind === 'edit');
  const markedInitially = MILESTONE_ORDER.filter((k) => initial.milestones[k]?.checked).length;
  const [stepsOpen, setStepsOpen] = useState(mode.kind === 'edit' && markedInitially > 0);
  const [notesOpen, setNotesOpen] = useState(mode.kind === 'edit' && initial.note.trim() !== '');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const nameRef = useRef<HTMLInputElement | null>(null);

  const dirty = JSON.stringify(form) !== JSON.stringify(initial);
  const marked = MILESTONE_ORDER.filter((k) => form.milestones[k]?.checked).length;

  const requestClose = () => {
    if (dirty) setConfirmDiscard(true);
    else onClose();
  };

  // Escape fecha (com confirmação se houver alterações); a página de trás não rola
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (confirmDiscard) setConfirmDiscard(false);
      else requestClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    nameRef.current?.focus();
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  const setMilestone = (key: keyof HealthCheckMilestones, patch: Partial<{ checked: boolean; on: string }>) =>
    setForm((f) => {
      const current = f.milestones[key] ?? { checked: false, on: '' };
      return { ...f, milestones: { ...f.milestones, [key]: { ...current, ...patch } } };
    });

  const buildMilestones = (): HealthCheckMilestones => {
    const out: HealthCheckMilestones = {};
    for (const key of MILESTONE_ORDER) {
      const m = form.milestones[key];
      if (m?.checked) out[key] = m.on ? { on: m.on } : {};
    }
    return out;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setError(h.nameRequired);
      nameRef.current?.focus();
      return;
    }
    const week = form.gestationalWeek.trim() === '' ? undefined : Number(form.gestationalWeek);
    const keepWeek = subject === 'pregnant_person' && form.phase === 'pregnancy' ? week : undefined;
    try {
      let record: HealthCheckRecord;
      if (mode.kind === 'edit') {
        // Mantém id, criação, origem e país de acompanhamento da época
        const { gestationalWeek: _w, personalNote: _n, ...rest } = mode.record;
        record = { ...rest, name: form.name.trim(), kind: form.kind, phase: form.phase, milestones: buildMilestones(), updatedAt: new Date().toISOString() };
      } else {
        const base =
          mode.kind === 'catalog'
            ? createFromCatalog(mode.view.catalog, mode.view.entry.id, { careCountry, lang: language }, form.phase)
            : createManualHealthCheck({ subject, phase: form.phase, kind: form.kind, name: form.name, careCountry });
        const { gestationalWeek: _w, personalNote: _n, ...rest } = base;
        record = { ...rest, name: form.name.trim(), kind: form.kind, milestones: buildMilestones() };
      }
      if (keepWeek !== undefined) record.gestationalWeek = keepWeek;
      if (form.note.trim()) record.personalNote = form.note.trim();
      if (!validateHealthCheckRecord(record).valid) throw new Error('invalid');
      setSaving(true);
      await onSave(record);
    } catch (err) {
      console.error('Erro ao salvar exame:', err);
      setError(h.saveError);
      setSaving(false);
    }
  };

  const title = mode.kind === 'edit' ? h.sheetTitleEdit : mode.kind === 'catalog' ? h.sheetTitleFromCatalog : h.sheetTitleNew;
  const subjectLabel = subject === 'pregnant_person' ? h.subjectPregnancy : h.subjectBaby;

  return (
    <div className="hc-sheet-overlay" onMouseDown={(e) => e.target === e.currentTarget && requestClose()}>
      <form className="hc-sheet" role="dialog" aria-modal="true" aria-labelledby="hcSheetTitle" onSubmit={handleSave} noValidate>
        <div className="hc-sheet-header">
          <h2 id="hcSheetTitle" className="hc-sheet-title">
            {title} <span className="hc-sheet-subject">· {subjectLabel}</span>
          </h2>
          <button type="button" className="hc-icon-btn" onClick={requestClose} aria-label={h.closeBtn}>
            <X size={20} />
          </button>
        </div>

        <div className="hc-sheet-body">
          <div>
            <label htmlFor="hcName" style={fieldLabel}>{h.nameLabel}</label>
            <input
              id="hcName"
              ref={nameRef}
              type="text"
              value={form.name}
              maxLength={NAME_MAX}
              placeholder={h.namePlaceholder}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              style={fieldInput}
            />
          </div>

          <div className="hc-two-cols">
            <div>
              <label htmlFor="hcKind" style={fieldLabel}>{h.kindLabel}</label>
              <select id="hcKind" value={form.kind} onChange={(e) => {
                  const kind = e.target.value as HealthCheckKind;
                  setForm({ ...form, kind, phase: phaseTouched ? form.phase : phaseForKind(kind, defaultPhase(subject, profile)) });
                }} style={fieldInput}>
                {KINDS_BY_SUBJECT[subject].map((k) => (
                  <option key={k} value={k}>{h.kinds[k]}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="hcPhase" style={fieldLabel}>{h.phaseLabel}</label>
              <select id="hcPhase" value={form.phase} onChange={(e) => {
                  setPhaseTouched(true);
                  setForm({ ...form, phase: e.target.value as HealthCheckPhase });
                }} style={fieldInput}>
                {PHASES_BY_SUBJECT[subject].map((p) => (
                  <option key={p} value={p}>{h.phases[p]}</option>
                ))}
              </select>
            </div>
          </div>

          {subject === 'pregnant_person' && form.phase === 'pregnancy' && (
            <div>
              <label htmlFor="hcWeek" style={fieldLabel}>{h.weekLabel}</label>
              <input
                id="hcWeek"
                type="number"
                inputMode="numeric"
                min={0}
                max={45}
                value={form.gestationalWeek}
                onChange={(e) => setForm({ ...form, gestationalWeek: e.target.value })}
                style={{ ...fieldInput, maxWidth: '120px' }}
              />
            </div>
          )}

          <div className="hc-disclosure">
            <button type="button" className="hc-disclosure-btn" aria-expanded={stepsOpen} aria-controls="hcSteps" onClick={() => setStepsOpen(!stepsOpen)}>
              <span>{h.stepsToggle(marked)}</span>
              {stepsOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </button>
            {stepsOpen && (
              <div id="hcSteps" className="hc-disclosure-panel">
                <p className="hc-help">{h.milestonesHelp}</p>
                {MILESTONE_ORDER.map((key) => {
                  const m = form.milestones[key];
                  return (
                    <div key={key} className="hc-milestone-row">
                      <label className="hc-milestone-check">
                        <input type="checkbox" checked={!!m?.checked} onChange={(e) => setMilestone(key, { checked: e.target.checked })} />
                        <span>{h.milestones[key]}</span>
                      </label>
                      {m?.checked && (
                        <input
                          type="date"
                          aria-label={`${h.milestones[key]}: ${h.dateLabel}`}
                          value={m.on}
                          onChange={(e) => setMilestone(key, { on: e.target.value })}
                          style={{ ...fieldInput, width: 'auto', padding: '6px 8px', fontSize: '0.84rem' }}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="hc-disclosure">
            <button type="button" className="hc-disclosure-btn" aria-expanded={notesOpen} aria-controls="hcNotes" onClick={() => setNotesOpen(!notesOpen)}>
              <span>{h.notesToggle(form.note.trim() !== '')}</span>
              {notesOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </button>
            {notesOpen && (
              <div id="hcNotes" className="hc-disclosure-panel">
                <label htmlFor="hcNote" className="hc-visually-hidden">{h.noteLabel}</label>
                <textarea
                  id="hcNote"
                  value={form.note}
                  maxLength={NOTE_MAX}
                  rows={3}
                  placeholder={h.notePlaceholder}
                  onChange={(e) => setForm({ ...form, note: e.target.value })}
                  style={{ ...fieldInput, resize: 'vertical' }}
                />
                <p className="hc-help">{h.noteReminder}</p>
              </div>
            )}
          </div>

          {error && <p className="hc-status" role="alert">{error}</p>}
        </div>

        <div className="hc-sheet-footer">
          <button type="submit" className="btn btn-primary hc-small-btn" disabled={saving}>{h.saveBtn}</button>
          <button type="button" className="hc-quiet-btn" onClick={requestClose}>{h.cancelBtn}</button>
        </div>

        {confirmDiscard && (
          <div className="hc-overlay" role="alertdialog" aria-modal="true" aria-labelledby="hcDiscardTitle">
            <div className="card hc-confirm">
              <h3 id="hcDiscardTitle" className="hc-confirm-title">{h.discardTitle}</h3>
              <p className="hc-confirm-text">{h.discardText}</p>
              <div className="hc-row-actions">
                <button type="button" className="btn btn-primary hc-small-btn" onClick={onClose}>{h.discardBtn}</button>
                <button type="button" className="hc-quiet-btn" autoFocus onClick={() => setConfirmDiscard(false)}>{h.keepEditingBtn}</button>
              </div>
            </div>
          </div>
        )}
      </form>
    </div>
  );
};

export default HealthCheckSheet;
