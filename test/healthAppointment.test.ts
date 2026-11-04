import assert from 'node:assert';
import test from 'node:test';
import fs from 'node:fs';
import { indexedDbService } from '../src/services/indexedDbService.ts';
import {
  appointmentEventDate,
  appointmentKindsFor,
  applyAppointmentEdit,
  buildAppointment,
  draftFromRecord,
  emptyAppointmentDraft,
  isPastPlanned,
  parseAppointment
} from '../src/domain/healthAppointment.ts';
import { displayTag, sameTag } from '../src/domain/journeyTags.ts';
import { ptBR } from '../src/locales/pt-BR.ts';
import { en } from '../src/locales/en.ts';
import type { JourneyRecord } from '../src/types/index.ts';

// Consulta de saúde na Jornada: planejada ou realizada, edição de um único registro e
// compatibilidade com backups antigos. Dados fictícios.

(globalThis as any).localStorage ??= {
  getItem: () => null,
  setItem: () => undefined,
  removeItem: () => undefined,
  clear: () => undefined
};

const NOW = new Date('2026-11-02T12:00:00.000Z');

const rec = (id: string, extra: Partial<JourneyRecord> = {}): JourneyRecord => ({
  id,
  subject: 'mom',
  tags: ['Tive uma conquista pessoal hoje'],
  note: 'Relato fictício',
  timestamp: '2026-11-01T10:00:00.000Z',
  eventDate: '2026-11-01',
  dateLabel: '2026-11-01',
  ...extra
});

const plannedRec = () =>
  rec('appt', {
    tags: ['Consulta de saúde'],
    note: undefined,
    appointment: { status: 'planned', kind: 'prenatal', questions: 'Pergunta fictícia?' },
    eventDate: '2026-11-10'
  });

// IndexedDB simulado: uma store, transação com get/put/getAll e "tudo ou nada"
function mockDb(rows: JourneyRecord[]) {
  let store = new Map(rows.map((r) => [r.id, structuredClone(r)]));
  const db = {
    get rows() {
      return store;
    },
    transaction() {
      const staged = new Map([...store].map(([k, v]) => [k, structuredClone(v)]));
      let pending = 0;
      let aborted = false;
      let done = false;
      const tx: any = { error: null };
      const finish = () =>
        setTimeout(() => {
          if (pending || aborted || done) return;
          done = true;
          store = staged;
          tx.oncomplete?.();
        }, 0);
      const request = (fn: () => unknown) => {
        const req: any = {};
        pending++;
        setTimeout(() => {
          if (aborted) return;
          req.result = fn();
          req.onsuccess?.();
          pending--;
          finish();
        }, 0);
        return req;
      };
      tx.objectStore = () => ({
        get: (k: string) => request(() => structuredClone(staged.get(k))),
        getAll: () => request(() => [...staged.values()].map((v) => structuredClone(v))),
        put: (v: JourneyRecord) => request(() => void staged.set(v.id, structuredClone(v)))
      });
      tx.abort = () => {
        if (aborted || done) return;
        aborted = true;
        setTimeout(() => tx.onabort?.(), 0);
      };
      return tx;
    }
  };
  (indexedDbService as any).db = null;
  (indexedDbService as any).openDB = async () => db;
  return db;
}

test('Consulta planejada: data opcional, só perguntas; o que aconteceu fica para depois', () => {
  const draft = { ...emptyAppointmentDraft(), status: 'planned' as const, questions: '  Pergunta?  ', whatHappened: 'não salva' };
  const a = buildAppointment(draft, NOW);
  assert.deepStrictEqual(a, { status: 'planned', dateUnset: true, questions: 'Pergunta?', updatedAt: NOW.toISOString() });
  // Sem data: fica no dia em que foi registrada, marcada como "data a definir"
  assert.deepStrictEqual(appointmentEventDate(draft, new Date(2026, 10, 2, 9)), { eventDate: '2026-11-02' });
  // Com data, inclusive no futuro
  const dated = { ...draft, date: '2026-12-01' };
  assert.strictEqual(buildAppointment(dated, NOW).dateUnset, undefined);
  assert.deepStrictEqual(appointmentEventDate(dated, NOW), { eventDate: '2026-12-01' });
});

test('Consulta realizada: precisa de data até hoje; campos vazios não são gravados', () => {
  const draft = { ...emptyAppointmentDraft(), status: 'done' as const, whatHappened: 'Conversa fictícia', nextSteps: ' ' };
  assert.deepStrictEqual(buildAppointment(draft, NOW), { status: 'done', whatHappened: 'Conversa fictícia', updatedAt: NOW.toISOString() });
  assert.deepStrictEqual(appointmentEventDate(draft, NOW, '2026-11-02'), { error: 'doneDateRequired' });
  assert.deepStrictEqual(appointmentEventDate({ ...draft, date: '2026-11-03' }, NOW, '2026-11-02'), { error: 'doneDateInFuture' });
  assert.deepStrictEqual(appointmentEventDate({ ...draft, date: '2026-11-02' }, NOW, '2026-11-02'), { eventDate: '2026-11-02' });
});

test('Tipos de consulta por pessoa', () => {
  assert.deepStrictEqual(appointmentKindsFor('mom'), ['prenatal', 'postnatal', 'vaccination', 'specialist', 'other']);
  assert.deepStrictEqual(appointmentKindsFor('baby'), ['baby_checkup', 'vaccination', 'specialist', 'other']);
  for (const k of [...appointmentKindsFor('mom'), ...appointmentKindsFor('baby')]) {
    assert.ok(ptBR.journey.appointment.kinds[k] && en.journey.appointment.kinds[k], k);
  }
});

test('Planejada com data passada continua planejada; editar preenche os mesmos campos', () => {
  const r = plannedRec();
  assert.strictEqual(isPastPlanned(r, '2026-11-20'), true);
  assert.strictEqual(r.appointment?.status, 'planned', 'o app não presume que aconteceu');
  assert.strictEqual(isPastPlanned(r, '2026-11-05'), false);
  assert.strictEqual(isPastPlanned({ ...r, appointment: { ...r.appointment!, dateUnset: true } }, '2026-11-20'), false);
  assert.deepStrictEqual(draftFromRecord(r), {
    status: 'planned',
    kind: 'prenatal',
    date: '2026-11-10',
    questions: 'Pergunta fictícia?',
    whatHappened: '',
    nextSteps: ''
  });
  assert.strictEqual(draftFromRecord({ ...r, appointment: { status: 'planned', dateUnset: true } }).date, '');
});

test('Edição muda só a consulta e a data; id, marcações, relato e criação ficam', () => {
  const r = { ...plannedRec(), note: 'Relato' };
  const appt = buildAppointment({ ...draftFromRecord(r), status: 'done', whatHappened: 'Fictício', date: '2026-11-10' }, NOW);
  const edited = applyAppointmentEdit(r, appt, '2026-11-10');
  assert.deepStrictEqual({ ...edited, appointment: undefined }, { ...r, appointment: undefined });
  assert.strictEqual(edited.appointment?.status, 'done');
  assert.strictEqual(edited.appointment?.questions, 'Pergunta fictícia?');
});

test('Editar no banco: só a consulta escolhida é regravada; os outros registros ficam idênticos', async () => {
  const others = [rec('a'), rec('b', { subject: 'baby', tags: ['Dormiu bem'] })];
  const db = mockDb([...others, plannedRec()]);
  const appt = buildAppointment({ ...draftFromRecord(plannedRec()), status: 'done', date: '2026-11-01', nextSteps: 'Voltar' }, NOW);
  const all = await indexedDbService.updateAppointment('appt', appt, '2026-11-01');
  assert.strictEqual(all.length, 3);
  assert.deepStrictEqual(db.rows.get('a'), others[0]);
  assert.deepStrictEqual(db.rows.get('b'), others[1]);
  const saved = db.rows.get('appt')!;
  assert.strictEqual(saved.appointment?.status, 'done');
  assert.strictEqual(saved.appointment?.nextSteps, 'Voltar');
  assert.strictEqual(saved.eventDate, '2026-11-01');
  assert.strictEqual(saved.timestamp, plannedRec().timestamp);
  assert.deepStrictEqual(saved.tags, ['Consulta de saúde']);
});

test('Editar no banco: registro inexistente ou que não é consulta não muda nada', async () => {
  const rows = [rec('a'), plannedRec()];
  const db = mockDb(rows);
  const appt = buildAppointment({ ...emptyAppointmentDraft(), date: '2026-11-01' }, NOW);
  await assert.rejects(indexedDbService.updateAppointment('nao-existe', appt, '2026-11-01'));
  await assert.rejects(indexedDbService.updateAppointment('a', appt, '2026-11-01'));
  assert.deepStrictEqual(db.rows.get('a'), rows[0]);
  assert.deepStrictEqual(db.rows.get('appt'), rows[1]);
});

test('Backup: a consulta é exportada e importada; backups antigos continuam válidos', () => {
  const file = (schemaVersion: string, records: unknown[]) => JSON.stringify({ schemaVersion, records });
  const withAppt = indexedDbService.validateBackupJson(file('1.1', [plannedRec(), rec('a')]));
  assert.strictEqual(withAppt.valid, true);
  assert.deepStrictEqual(withAppt.records![0].appointment, plannedRec().appointment);
  assert.strictEqual(withAppt.records![1].appointment, undefined);
  // 1.0 sem o campo
  const old = indexedDbService.validateBackupJson(file('1.0', [rec('a')]));
  assert.strictEqual(old.valid, true);
  assert.strictEqual(old.records![0].appointment, undefined);
  // Campo malformado: o registro entra, só a consulta inválida é ignorada
  const bad = indexedDbService.validateBackupJson(file('1.1', [{ ...rec('x'), appointment: { status: 'talvez' } }]));
  assert.strictEqual(bad.valid, true);
  assert.strictEqual(bad.records![0].appointment, undefined);
});

test('Leitura do campo no backup: tipo desconhecido sai, textos ficam', () => {
  assert.strictEqual(parseAppointment(null), undefined);
  assert.strictEqual(parseAppointment([]), undefined);
  assert.deepStrictEqual(parseAppointment({ status: 'done', kind: 'cirurgia', whatHappened: 'Texto', nextSteps: 3 }), {
    status: 'done',
    whatHappened: 'Texto'
  });
  // "Sem data" só vale para consulta planejada
  assert.deepStrictEqual(parseAppointment({ status: 'done', dateUnset: true }), { status: 'done' });
});

test('Marcação "Consulta de saúde" em pt e en; a antiga do bebê continua legível', () => {
  assert.strictEqual(ptBR.journey.appointment.tag, 'Consulta de saúde');
  assert.strictEqual(en.journey.appointment.tag, 'Health appointment');
  assert.strictEqual(displayTag('Consulta de saúde', 'en'), 'Health appointment');
  assert.strictEqual(displayTag('Health appointment', 'pt-BR'), 'Consulta de saúde');
  assert.ok(sameTag('Health appointment', 'Consulta de saúde'));
  assert.strictEqual(displayTag('Teve consulta ou vacina', 'en'), 'Had a checkup or vaccine');
  assert.ok(!ptBR.journey.babyTags.some((t) => t.tag === 'Teve consulta ou vacina'), 'saiu do formulário');
  assert.strictEqual(ptBR.journey.babyTags.length, en.journey.babyTags.length);
  assert.deepStrictEqual(Object.keys(ptBR.journey.appointment).sort(), Object.keys(en.journey.appointment).sort());
});

test('Consulta fica fora de Exames e triagens e não entra no resumo nesta etapa', () => {
  const view = fs.readFileSync(new URL('../src/views/JourneyView.tsx', import.meta.url), 'utf8');
  const domain = fs.readFileSync(new URL('../src/domain/healthAppointment.ts', import.meta.url), 'utf8');
  const summary = fs.readFileSync(new URL('../src/domain/journeySummary.ts', import.meta.url), 'utf8');
  assert.ok(!/healthChecks/.test(domain), 'o domínio da consulta não depende de exames');
  assert.ok(!/appointment/.test(summary), 'resumo inalterado');
  assert.match(view, /disabled=\{apptPlanned\}/, 'planejada fica num registro só dela');
});
