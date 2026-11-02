// Fuso fixo, com diferença em relação ao UTC, para testar a virada do dia
process.env.TZ = 'America/Sao_Paulo';

import assert from 'node:assert';
import test from 'node:test';
import { recordMoment, formatRecordDate, formatRecordDateAbsolute } from '../src/domain/recordDate.ts';
import { buildJourneyTextSummary } from '../src/domain/journeySummary.ts';
import { ptBR } from '../src/locales/pt-BR.ts';
import { en } from '../src/locales/en.ts';
import type { JourneyRecord } from '../src/types/index.ts';

// Datas da Jornada calculadas na exibição a partir do timestamp, sem alterar os dados
// gravados. Registros fictícios.

const PT = { today: ptBR.journey.dateTodayPrefix, yesterday: ptBR.journey.dateYesterdayPrefix };
const EN = { today: en.journey.dateTodayPrefix, yesterday: en.journey.dateYesterdayPrefix };
const at = (y: number, mo: number, d: number, h: number, mi: number) => new Date(y, mo - 1, d, h, mi);

const rec = (over: Partial<JourneyRecord>): JourneyRecord => ({
  id: 'r1',
  subject: 'baby',
  tags: [],
  eventDate: '2026-11-02',
  timestamp: at(2026, 11, 2, 20, 36).toISOString(),
  dateLabel: 'Hoje, 20:36',
  ...over
});

test('Registro do momento: "Hoje" e "Ontem" acompanham a virada do dia, com a hora local', () => {
  const r = rec({});
  assert.strictEqual(formatRecordDate(r, 'pt-BR', PT, at(2026, 11, 2, 23, 0)), 'Hoje, 20:36');
  assert.strictEqual(formatRecordDate(r, 'pt-BR', PT, at(2026, 11, 3, 8, 0)), 'Ontem, 20:36');
  assert.strictEqual(formatRecordDate(r, 'pt-BR', PT, at(2026, 11, 10, 8, 0)), '2 de nov. de 2026, 20:36');
  assert.strictEqual(formatRecordDate(r, 'en', EN, at(2026, 11, 2, 23, 0)), 'Today, 20:36');
  assert.strictEqual(formatRecordDate(r, 'en', EN, at(2026, 11, 3, 8, 0)), 'Yesterday, 20:36');
  assert.strictEqual(formatRecordDate(r, 'en', EN, at(2026, 11, 10, 8, 0)), '2 Nov 2026, 20:36');
});

test('Texto gravado em outro idioma não aparece: vale a data calculada', () => {
  const r = rec({ dateLabel: 'Today, 09:00', timestamp: at(2026, 10, 28, 9, 0).toISOString(), eventDate: '2026-10-28' });
  const shown = formatRecordDate(r, 'pt-BR', PT, at(2026, 11, 2, 12, 0));
  assert.strictEqual(shown, '28 de out. de 2026, 09:00');
  assert.ok(!shown.includes('Today'));
});

test('Virada do dia em UTC: data gravada pelo relógio UTC continua mostrando o dia local certo', () => {
  // 22:30 em São Paulo é 01:30 do dia seguinte em UTC; versões antigas gravavam esse dia seguinte
  const ts = at(2026, 11, 2, 22, 30);
  const r = rec({ timestamp: ts.toISOString(), eventDate: ts.toISOString().slice(0, 10) });
  assert.strictEqual(r.eventDate, '2026-11-03');
  assert.deepStrictEqual(recordMoment(r), { date: '2026-11-02', time: '22:30' });
  assert.strictEqual(formatRecordDate(r, 'pt-BR', PT, at(2026, 11, 2, 23, 0)), 'Hoje, 22:30');
});

test('Registro de outro dia ("Ontem" ou "Outra data"): só a data do acontecimento, sem inventar hora', () => {
  const r = rec({ eventDate: '2026-11-01', timestamp: at(2026, 11, 2, 9, 15).toISOString(), dateLabel: 'Ontem' });
  assert.strictEqual(formatRecordDate(r, 'pt-BR', PT, at(2026, 11, 2, 10, 0)), 'Ontem');
  assert.strictEqual(formatRecordDate(r, 'pt-BR', PT, at(2026, 11, 20, 10, 0)), '1 de nov. de 2026');
  const old = rec({ eventDate: '2026-03-15', dateLabel: '15/03/2026' });
  assert.strictEqual(formatRecordDate(old, 'en', EN, at(2026, 11, 2, 10, 0)), '15 Mar 2026');
});

test('Sem timestamp válido: data do acontecimento sem hora; sem nenhuma data válida, o texto gravado', () => {
  assert.strictEqual(formatRecordDate(rec({ timestamp: 'não é data' }), 'pt-BR', PT, at(2026, 11, 2, 10, 0)), 'Hoje');
  assert.deepStrictEqual(recordMoment(rec({ timestamp: '' })), { date: '2026-11-02' });
  const broken = rec({ timestamp: 'x', eventDate: '2026-13-40', dateLabel: 'Hoje, 10:30' });
  assert.strictEqual(recordMoment(broken), null);
  assert.strictEqual(formatRecordDate(broken, 'en', EN, at(2026, 11, 2, 10, 0)), 'Hoje, 10:30');
});

test('Resumo exportado: data absoluta, com hora quando houver, sem "Hoje" nem "Today"', () => {
  const r = rec({ dateLabel: 'Today, 20:36' });
  assert.strictEqual(formatRecordDateAbsolute(r, 'pt-BR'), '02/11/2026, 20:36');
  assert.strictEqual(formatRecordDateAbsolute(r, 'en'), '02 Nov 2026, 20:36');
  for (const [t, lang] of [[ptBR, 'pt-BR'], [en, 'en']] as const) {
    const text = buildJourneyTextSummary({
      records: [r, rec({ id: 'r2', eventDate: '2026-10-30', dateLabel: 'Outra data' })],
      healthChecks: [],
      lang,
      t,
      stageLabel: '',
      includeNotes: false,
      exportDate: at(2026, 11, 3, 9, 0)
    });
    const diary = text.slice(text.indexOf(t.journeySummary.journeyTitle), text.indexOf(t.journeySummary.healthChecksTitle));
    assert.match(diary, lang === 'en' ? /02 Nov 2026, 20:36/ : /02\/11\/2026, 20:36/);
    assert.match(diary, lang === 'en' ? /30 Oct 2026 \|/ : /30\/10\/2026 \|/);
    assert.ok(!/Hoje|Today|Outra data/.test(diary), diary);
  }
});
