import type {
  AppointmentKind,
  AppointmentStatus,
  HealthAppointment,
  JourneyRecord,
  RecordSubject
} from '../types/index.ts';
import { localDate } from './recordDate.ts';

// Consulta de saúde na Jornada: um registro leve, feito antes ou depois da consulta, separado
// de "Exames e triagens". Todos os campos são opcionais e o app não interpreta o que foi
// escrito. Uma consulta planejada continua planejada até a família dizer que ela aconteceu.

export const APPOINTMENT_KINDS: readonly AppointmentKind[] = [
  'prenatal',
  'postnatal',
  'baby_checkup',
  'vaccination',
  'specialist',
  'other'
];

const KINDS_BY_SUBJECT: Record<'mom' | 'baby', readonly AppointmentKind[]> = {
  mom: ['prenatal', 'postnatal', 'vaccination', 'specialist', 'other'],
  baby: ['baby_checkup', 'vaccination', 'specialist', 'other']
};

export const appointmentKindsFor = (subject: RecordSubject): readonly AppointmentKind[] =>
  subject === 'baby' ? KINDS_BY_SUBJECT.baby : KINDS_BY_SUBJECT.mom;

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

// Estado dos campos no formulário; `date` vazio significa "sem data"
export interface AppointmentDraft {
  status: AppointmentStatus;
  kind?: AppointmentKind;
  date: string;
  questions: string;
  whatHappened: string;
  nextSteps: string;
}

export const emptyAppointmentDraft = (): AppointmentDraft => ({
  status: 'done',
  date: '',
  questions: '',
  whatHappened: '',
  nextSteps: ''
});

const clean = (v: string) => (v.trim() ? v.trim() : undefined);

// O que foi conversado e os próximos passos só existem depois da consulta
export function buildAppointment(draft: AppointmentDraft, now = new Date()): HealthAppointment {
  const done = draft.status === 'done';
  const appt: HealthAppointment = { status: draft.status, updatedAt: now.toISOString() };
  if (draft.kind) appt.kind = draft.kind;
  if (!done && !ISO_DATE.test(draft.date)) appt.dateUnset = true;
  const questions = clean(draft.questions);
  if (questions) appt.questions = questions;
  if (done) {
    const what = clean(draft.whatHappened);
    const next = clean(draft.nextSteps);
    if (what) appt.whatHappened = what;
    if (next) appt.nextSteps = next;
  }
  return appt;
}

export function draftFromRecord(rec: JourneyRecord): AppointmentDraft {
  const a = rec.appointment;
  return {
    status: a?.status ?? 'done',
    kind: a?.kind,
    date: a?.status === 'planned' && a.dateUnset ? '' : rec.eventDate,
    questions: a?.questions ?? '',
    whatHappened: a?.whatHappened ?? '',
    nextSteps: a?.nextSteps ?? ''
  };
}

export type AppointmentDateError = 'doneDateRequired' | 'doneDateInFuture';

// Data do acontecimento para o registro: a da consulta ou, se planejada sem data, o dia em
// que foi registrada (só para posicionar na linha do tempo)
export function appointmentEventDate(
  draft: AppointmentDraft,
  createdAt: Date,
  today = localDate(new Date())
): { eventDate: string } | { error: AppointmentDateError } {
  const hasDate = ISO_DATE.test(draft.date);
  if (draft.status === 'planned') return { eventDate: hasDate ? draft.date : localDate(createdAt) };
  if (!hasDate) return { error: 'doneDateRequired' };
  if (draft.date > today) return { error: 'doneDateInFuture' };
  return { eventDate: draft.date };
}

// Edição: muda só os dados da consulta e a data do acontecimento. Id, tipo, marcações,
// relato e data de criação do registro continuam os mesmos.
export function applyAppointmentEdit(rec: JourneyRecord, appointment: HealthAppointment, eventDate: string): JourneyRecord {
  return { ...rec, appointment, eventDate };
}

const text = (v: unknown) => (typeof v === 'string' && v.trim() ? v : undefined);

// Leitura do campo num backup. Um campo malformado é ignorado (o registro continua válido);
// tipos desconhecidos saem, os textos ficam como foram escritos.
export function parseAppointment(raw: unknown): HealthAppointment | undefined {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return undefined;
  const r = raw as Record<string, unknown>;
  if (r.status !== 'planned' && r.status !== 'done') return undefined;
  const appt: HealthAppointment = { status: r.status };
  if (typeof r.kind === 'string' && (APPOINTMENT_KINDS as readonly string[]).includes(r.kind)) {
    appt.kind = r.kind as AppointmentKind;
  }
  if (r.status === 'planned' && r.dateUnset === true) appt.dateUnset = true;
  const questions = text(r.questions);
  const what = text(r.whatHappened);
  const next = text(r.nextSteps);
  const updatedAt = text(r.updatedAt);
  if (questions) appt.questions = questions;
  if (what) appt.whatHappened = what;
  if (next) appt.nextSteps = next;
  if (updatedAt) appt.updatedAt = updatedAt;
  return appt;
}

// Consulta planejada cuja data já passou: o app não presume que aconteceu, só lembra que
// o registro pode ser atualizado
export const isPastPlanned = (rec: JourneyRecord, today = localDate(new Date())) =>
  rec.appointment?.status === 'planned' && !rec.appointment.dateUnset && rec.eventDate < today;
