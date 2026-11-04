import React from 'react';
import type { RecordSubject } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { appointmentKindsFor, type AppointmentDraft } from '../domain/healthAppointment';

// Campos da consulta de saúde, usados ao criar o registro e ao editá-lo. Todos opcionais.
// Planejada: data opcional e perguntas. Realizada: também o que aconteceu e os próximos passos.

interface AppointmentFieldsProps {
  subject: RecordSubject;
  value: AppointmentDraft;
  onChange: (next: AppointmentDraft) => void;
  // Na criação, a data de uma consulta realizada vem do "Quando aconteceu?" do formulário
  showDoneDate: boolean;
  today: string;
  idPrefix: string;
  // Na edição, um registro com outras marcações não volta a ser planejado (elas são de outro dia)
  allowPlanned?: boolean;
  // Na criação, avisa que a consulta planejada fica num registro só dela
  showPlannedOnlyHint?: boolean;
}

export const AppointmentFields: React.FC<AppointmentFieldsProps> = ({
  subject,
  value,
  onChange,
  showDoneDate,
  today,
  idPrefix,
  allowPlanned = true,
  showPlannedOnlyHint = false
}) => {
  const { t } = useLanguage();
  const a = t.journey.appointment;
  const set = (patch: Partial<AppointmentDraft>) => onChange({ ...value, ...patch });
  const planned = value.status === 'planned';

  const textField = (key: 'questions' | 'whatHappened' | 'nextSteps', label: string, placeholder: string) => (
    <div className="journey-appt-field">
      <label htmlFor={`${idPrefix}-${key}`}>{label}</label>
      <textarea
        id={`${idPrefix}-${key}`}
        value={value[key]}
        onChange={(e) => set({ [key]: e.target.value })}
        placeholder={placeholder}
        rows={2}
      />
    </div>
  );

  return (
    <div className="journey-appt-panel" data-testid="appointment-fields">
      {allowPlanned && (
      <div className="journey-appt-group" role="radiogroup" aria-label={a.statusQuestion}>
        <span className="journey-appt-label">{a.statusQuestion}</span>
        <div className="journey-appt-chips">
          {(['done', 'planned'] as const).map((st) => (
            <button
              key={st}
              type="button"
              role="radio"
              aria-checked={value.status === st}
              className={`journey-appt-chip ${value.status === st ? 'is-active' : ''}`}
              onClick={() => set({ status: st })}
            >
              {st === 'done' ? a.statusDone : a.statusPlanned}
            </button>
          ))}
        </div>
      </div>
      )}

      <div className="journey-appt-group" role="radiogroup" aria-label={a.kindQuestion}>
        <span className="journey-appt-label">{a.kindQuestion}</span>
        <div className="journey-appt-chips">
          {appointmentKindsFor(subject).map((k) => (
            <button
              key={k}
              type="button"
              role="radio"
              aria-checked={value.kind === k}
              className={`journey-appt-chip ${value.kind === k ? 'is-active' : ''}`}
              onClick={() => set({ kind: value.kind === k ? undefined : k })}
            >
              {a.kinds[k]}
            </button>
          ))}
        </div>
      </div>

      {(planned || showDoneDate) && (
        <div className="journey-appt-field">
          <label htmlFor={`${idPrefix}-date`}>{planned ? a.plannedDateLabel : a.doneDateLabel}</label>
          <input
            id={`${idPrefix}-date`}
            type="date"
            value={value.date}
            max={planned ? undefined : today}
            onChange={(e) => set({ date: e.target.value })}
          />
        </div>
      )}

      {textField('questions', planned ? a.questionsPlannedLabel : a.questionsDoneLabel, a.questionsPlaceholder)}
      {!planned && textField('whatHappened', a.whatHappenedLabel, a.whatHappenedPlaceholder)}
      {!planned && textField('nextSteps', a.nextStepsLabel, a.nextStepsPlaceholder)}

      {planned && showPlannedOnlyHint && <p className="journey-appt-hint">{a.plannedOnlyHint}</p>}
      <p className="journey-appt-hint">{a.privacyHint}</p>
    </div>
  );
};
