import assert from 'node:assert';
import test from 'node:test';
import fs from 'node:fs';
import { buildJourneyTextSummary, journeySummaryFilename, type JourneySummaryInput } from '../src/domain/journeySummary.ts';
import { createManualHealthCheck, type HealthCheckRecord } from '../src/domain/healthChecks.ts';
import { ptBR } from '../src/locales/pt-BR.ts';
import { en } from '../src/locales/en.ts';
import type { JourneyRecord } from '../src/types/index.ts';

// Resumo em texto da Jornada com exames e triagens. Todos os dados são fictícios,
// inclusive as anotações "sensíveis", usadas só para conferir que ficam fora do resumo.

const NOW = new Date('2026-10-30T12:00:00.000Z');
const SENSITIVE = ['CPF 000.000.000-00', 'Rua Fictícia, 123', 'telefone 0000-0000', 'diagnóstico fictício'];

const journey = (id: string, subject: JourneyRecord['subject'], eventDate: string, note?: string): JourneyRecord => ({
  id,
  subject,
  tags: subject === 'memory' ? [] : ['Dormiu bem'],
  note,
  eventDate,
  dateLabel: eventDate,
  timestamp: `${eventDate}T10:00:00.000Z`
});

// Gestação: resultado recebido sem "realizado" marcado (etapas independentes)
const pregnancyExam = createManualHealthCheck(
  {
    subject: 'pregnant_person',
    phase: 'pregnancy',
    kind: 'prenatal_test',
    name: 'Exame de sangue fictício',
    gestationalWeek: 12,
    milestones: { resultReceived: { on: '2026-03-01' } },
    personalNote: `Anotação da gestante: ${SENSITIVE[0]}\nsegunda linha com ${SENSITIVE[1]}`,
    careCountry: 'BR'
  },
  NOW
);
// Gestação: sem etapas e sem campos opcionais
const pregnancyBare = createManualHealthCheck({ subject: 'pregnant_person', phase: 'pregnancy', kind: 'ultrasound', name: 'Ultrassom fictício' }, NOW);
// Bebê: várias etapas, uma sem data
const babyExam = createManualHealthCheck(
  {
    subject: 'baby',
    phase: 'newborn',
    kind: 'newborn_screening',
    name: 'Triagem fictícia do bebê',
    babyAgeDays: 4,
    milestones: { performed: { on: '2026-06-05' }, resultDiscussed: {} },
    personalNote: `Anotação do bebê: ${SENSITIVE[2]} e ${SENSITIVE[3]}`,
    careCountry: 'NO'
  },
  NOW
);
const fromCatalog: HealthCheckRecord = {
  ...createManualHealthCheck({ subject: 'baby', phase: 'infant', kind: 'child_test', name: 'Exame fictício de lista' }, NOW),
  origin: { kind: 'catalog', catalogId: 'cat-ficticio', catalogVersion: '0.1', country: 'NO', entryId: 'e1', labelAtCopy: 'Exame fictício de lista', langAtCopy: 'pt-BR' }
};

const records = [
  journey('j1', 'baby', '2026-06-10', `Nota do diário: ${SENSITIVE[0]}`),
  journey('j2', 'mom', '2026-03-02'),
  journey('j3', 'memory', '2026-07-01', 'Lembrança fictícia')
];
const healthChecks = [pregnancyExam, pregnancyBare, babyExam, fromCatalog];

const build = (over: Partial<JourneySummaryInput> = {}) =>
  buildJourneyTextSummary({
    records,
    healthChecks,
    lang: 'pt-BR',
    t: ptBR,
    stageLabel: 'Recém-nascido (primeiro mês)',
    includeNotes: false,
    exportDate: NOW,
    ...over
  });

// Trecho do resumo entre um título e o próximo
const section = (text: string, from: string, to: string) => {
  const start = text.indexOf(from);
  assert.ok(start >= 0, `seção ${from}`);
  const end = text.indexOf(to, start + from.length);
  return text.slice(start, end < 0 ? undefined : end);
};

test('Cabeçalho: registros informados pela família, sem interpretação clínica, gerado no aparelho', () => {
  const text = build();
  const lines = text.split('\n');
  assert.strictEqual(lines[0], 'MAMAND · RESUMO DA JORNADA');
  assert.match(text, /Registros informados pela família\. O MAMAND não interpreta resultados/);
  assert.match(text, /Não é prontuário médico\. Gerado neste aparelho, sem envio para nenhum servidor\./);
  assert.match(text, /Data da exportação: 30\/10\/2026/);
  assert.match(text, /Fase atual: Recém-nascido \(primeiro mês\)/);
  assert.ok(!/1\.000 Dias|1,000 Days/.test(text), 'nome antigo do app');
});

test('Gestação e bebê em seções separadas, sem misturar registros', () => {
  const text = build();
  const pregnancy = section(text, 'GESTAÇÃO (2 registros)', 'BEBÊ (');
  const baby = section(text, 'BEBÊ (2 registros)', '-----');
  assert.match(pregnancy, /Exame de sangue fictício/);
  assert.match(pregnancy, /Ultrassom fictício/);
  assert.ok(!pregnancy.includes('Triagem fictícia do bebê') && !pregnancy.includes('Exame fictício de lista'));
  assert.match(baby, /Triagem fictícia do bebê/);
  assert.match(baby, /Exame fictício de lista/);
  assert.ok(!baby.includes('Exame de sangue fictício') && !baby.includes('Ultrassom fictício'));
});

test('Nome, tipo, período, datas e só as etapas marcadas, cada uma independente', () => {
  const text = build();
  const blood = section(text, '• Exame de sangue fictício', '\n\n');
  assert.match(blood, /Tipo: Exame da gestação \| Período: Durante a gestação, semana 12/);
  assert.match(blood, /- Resultado recebido: 01\/03\/2026/);
  // Resultado recebido não implica realizado, conversado nem resultado discutido
  assert.ok(!/Realizado|Conversado com profissional|Resultado discutido/.test(blood));
  assert.match(blood, /Acompanhamento: Brasil/);

  const screening = section(text, '• Triagem fictícia do bebê', '\n\n');
  assert.match(screening, /Tipo: Triagem neonatal \| Período: Primeiro mês de vida, 4 dias de vida/);
  assert.match(screening, /- Realizado: 05\/06\/2026/);
  assert.match(screening, /- Resultado discutido com profissional: sem data informada/);
  assert.ok(!/Resultado recebido/.test(screening), 'discutido não implica recebido');
  assert.ok(screening.indexOf('Realizado') < screening.indexOf('Resultado discutido'), 'ordem das etapas');

  const bare = section(text, '• Ultrassom fictício', '\n\n');
  assert.match(bare, /Etapas registradas: Nenhuma etapa marcada/);
  assert.ok(!/semana|Acompanhamento|Anotação/.test(bare));

  assert.match(text, /Adicionado de uma lista educativa \(Noruega, versão 0\.1\)/);
  assert.match(text, /Cada etapa foi marcada pela família separadamente/);
});

test('Sem anotações livres por padrão: nenhum trecho sensível fictício aparece', () => {
  const text = build();
  assert.match(text, /Anotações livres: não incluídas/);
  for (const s of SENSITIVE) assert.ok(!text.includes(s), s);
  assert.ok(!/Anotação:/.test(text));
  assert.ok(!text.includes('Lembrança fictícia'));
  // Sem anotação, o resto do registro continua no resumo
  assert.match(text, /Triagem fictícia do bebê/);
  assert.match(text, /Marcações: Dormiu bem/);
});

test('Com anotações: entram as da Jornada e as dos exames, com várias linhas recuadas', () => {
  const text = build({ includeNotes: true });
  assert.match(text, /Anotações livres: incluídas/);
  for (const s of SENSITIVE) assert.ok(text.includes(s), s);
  assert.match(text, /  Anotação: "Anotação da gestante: CPF 000\.000\.000-00\n    segunda linha com Rua Fictícia, 123"/);
  assert.match(text, /Lembrança fictícia/);
});

test('Diário da Jornada: mais recentes primeiro, com o tipo de cada registro', () => {
  const diary = section(build(), 'DIÁRIO DA JORNADA', '-----');
  assert.match(diary, /3 registros/);
  const order = ['01/07/2026', '10/06/2026', '02/03/2026'].map((d) => diary.indexOf(d));
  assert.ok(order.every((i, k) => i > 0 && (k === 0 || i > order[k - 1])), 'ordem por data');
  assert.match(diary, /Tipo: Memória/);
  assert.match(diary, /Tipo: Mãe/);
});

test('Marcações gravadas no outro idioma aparecem traduzidas no resumo', () => {
  const rec = { ...journey('jx', 'mom', '2026-05-05'), tags: ['Mood: Autopilot', 'Marcação livre'] };
  const text = build({ records: [rec], healthChecks: [] });
  assert.match(text, /Marcações: Humor: No piloto automático, Marcação livre/);
});

test('Sem registros: as seções aparecem vazias, sem erro', () => {
  const text = build({ records: [], healthChecks: [] });
  assert.match(text, /DIÁRIO DA JORNADA\n0 registros\n\nNenhum registro\./);
  assert.match(text, /GESTAÇÃO \(0 registros\)\nNenhum registro\./);
  assert.match(text, /BEBÊ \(0 registros\)\nNenhum registro\./);
});

test('Registro de exame inválido fica de fora e é contado; não vai para a seção errada', () => {
  const mixed = { ...babyExam, id: 'invalido', subject: 'pregnant_person' as const, name: 'Registro inconsistente' };
  const extra = { ...pregnancyBare, id: 'extra', isNormal: true, name: 'Com campo de interpretação' } as unknown as HealthCheckRecord;
  const text = build({ healthChecks: [...healthChecks, mixed, extra] });
  assert.ok(!text.includes('Registro inconsistente'));
  assert.ok(!text.includes('Com campo de interpretação'));
  assert.match(text, /2 registros de exames não foram incluídos porque estão incompletos\./);
});

test('Inglês: mesma estrutura, sem textos em português do resumo', () => {
  const text = build({ lang: 'en', t: en, stageLabel: 'Newborn (first month)' });
  assert.strictEqual(text.split('\n')[0], 'MAMAND · JOURNEY SUMMARY');
  assert.match(text, /Records entered by the family\. MAMAND does not interpret results/);
  assert.match(text, /Personal notes: not included/);
  assert.match(text, /PREGNANCY \(2 records\)/);
  assert.match(text, /BABY \(2 records\)/);
  assert.match(text, /- Result received: 01 Mar 2026/);
  assert.match(text, /- Result discussed with a professional: no date given/);
  assert.match(text, /Care in: Norway/);
  for (const pt of ['Etapas registradas', 'Anotações livres', 'Nenhum registro', 'sem data informada']) assert.ok(!text.includes(pt), pt);
});

test('Sem palavras de interpretação clínica nos textos fixos do resumo', () => {
  for (const [t, lang] of [[ptBR, 'pt-BR'], [en, 'en']] as const) {
    const text = buildJourneyTextSummary({ records: [], healthChecks: [babyExam], lang, t, stageLabel: '', includeNotes: false, exportDate: NOW });
    assert.ok(!/\b(normal|alterado|anormal|abnormal|positivo|negativo|positive|negative|risco|risk)\b/i.test(text), lang);
  }
});

test('Datas não mudam de dia por causa do fuso horário', () => {
  const late = createManualHealthCheck(
    { subject: 'baby', phase: 'infant', kind: 'child_test', name: 'Data limite', milestones: { performed: { on: '2026-01-01' } } },
    NOW
  );
  assert.match(build({ healthChecks: [late] }), /- Realizado: 01\/01\/2026/);
});

test('Nome do arquivo e nenhuma transmissão: o resumo é montado e baixado no aparelho', () => {
  assert.strictEqual(journeySummaryFilename(ptBR.journeySummary.filenamePrefix, '2026-10-30'), 'mamand_resumo_2026-10-30.txt');
  assert.strictEqual(journeySummaryFilename(en.journeySummary.filenamePrefix, '2026-10-30'), 'mamand_summary_2026-10-30.txt');
  const network = /\b(fetch|XMLHttpRequest|sendBeacon|WebSocket|EventSource|navigator\.share)\b/;
  for (const file of ['src/domain/journeySummary.ts', 'src/services/indexedDbService.ts']) {
    assert.ok(!network.test(fs.readFileSync(file, 'utf8')), file);
  }
  const view = fs.readFileSync('src/views/JourneyView.tsx', 'utf8');
  const handler = view.slice(view.indexOf('buildJourneyTextSummary({'), view.indexOf('downloadTextFile(') + 200);
  assert.ok(!network.test(handler));
  assert.match(view, /useState\(false\);\n/, 'anotações começam desmarcadas');
  assert.match(view, /summaryIncludesNotes/);
});
