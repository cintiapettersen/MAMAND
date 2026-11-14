import assert from 'node:assert';
import test from 'node:test';
import fs from 'node:fs';
import { build } from 'esbuild';
import { resolveCareFullTextEnabled, canShowCareInstructions } from '../src/config/careContentAvailability.ts';
import { isUneditedLegacyDemo } from '../src/services/indexedDbService.ts';
import type { JourneyRecord } from '../src/types/index.ts';

// Ajustes da demonstração pública: Jornada sem registros de exemplo, Cuidados sem instruções
// sem revisão profissional e contatos de emergência só com fonte oficial conferida.

// emergencyContacts.ts usa imports sem extensão: empacotado em memória
const bundle = await build({ entryPoints: ['src/data/emergencyContacts.ts'], bundle: true, write: false, format: 'esm', platform: 'node' });
const { EMERGENCY_CONTACTS, getEmergencyContact } = await import(
  'data:text/javascript;base64,' + Buffer.from(bundle.outputFiles[0].text).toString('base64')
);

const demo1: JourneyRecord = {
  id: 'rec-demo-1',
  subject: 'baby',
  tags: ['Dormiu bem', 'Mamou ou se alimentou normalmente'],
  note: 'Hoje o dia começou tranquilo. Conseguiu fazer uma soneca de 1h30 direto.',
  timestamp: '2026-10-01T10:00:00.000Z',
  eventDate: '2026-10-01',
  dateLabel: 'Hoje, 10:30'
};

test('Jornada: o app não cria mais registros de exemplo', () => {
  const src = fs.readFileSync('src/services/indexedDbService.ts', 'utf8');
  assert.ok(!/seedInitialRecords|INITIAL_DEMO_RECORDS/.test(src));
  assert.ok(!/store\.add\(/.test(src.slice(src.indexOf('request.onsuccess'), src.indexOf('request.onerror'))), 'nada é gravado ao abrir o banco');
});

test('Jornada: só os exemplos antigos intactos são removidos; registros reais e exemplos editados ficam', () => {
  assert.strictEqual(isUneditedLegacyDemo(demo1), true);
  assert.strictEqual(isUneditedLegacyDemo({ ...demo1, note: demo1.note + ' Editado pela família.' }), false);
  assert.strictEqual(isUneditedLegacyDemo({ ...demo1, tags: ['Dormiu bem'] }), false);
  assert.strictEqual(isUneditedLegacyDemo({ ...demo1, contentId: 'baby-bath' }), false);
  assert.strictEqual(isUneditedLegacyDemo({ ...demo1, id: 'rec-real-1' }), false, 'mesmo texto, outro id: registro real');
  assert.strictEqual(isUneditedLegacyDemo({ ...demo1, subject: 'mom' }), false);
});

test('Jornada vazia: estado de boas-vindas em pt e en', async () => {
  const { ptBR } = await import('../src/locales/pt-BR.ts');
  const { en } = await import('../src/locales/en.ts');
  assert.strictEqual(ptBR.journey.emptyJourneyTitle, 'Sua Jornada começa aqui');
  assert.ok(en.journey.emptyJourneyTitle.length > 0 && en.journey.emptyJourneySubtitle.length > 0);
  const view = fs.readFileSync('src/views/JourneyView.tsx', 'utf8');
  assert.match(view, /records\.length === 0 \? t\.journey\.emptyJourneyTitle/);
});

test('Cuidados: instruções só com revisão profissional registrada (produção); desenvolvimento mostra tudo', () => {
  assert.strictEqual(resolveCareFullTextEnabled({ DEV: false }), false);
  assert.strictEqual(resolveCareFullTextEnabled({}), false);
  assert.strictEqual(resolveCareFullTextEnabled({ DEV: true }), true);
  assert.strictEqual(canShowCareInstructions({ validationStatus: 'pending_review' }, false), false);
  assert.strictEqual(canShowCareInstructions({ validationStatus: 'source_based' }, false), false);
  assert.strictEqual(canShowCareInstructions({ validationStatus: 'verified' as any }, false), false, '"verified" indica fonte bibliográfica verificada, não revisão clínica; instruções bloqueadas');
  assert.strictEqual(canShowCareInstructions({ validationStatus: 'clinically_reviewed' }, false), false, 'sem registro de revisão');
  assert.strictEqual(
    canShowCareInstructions({ validationStatus: 'clinically_reviewed', clinicalReview: {} as any }, false),
    false,
    'sem publicationAllowed: true, não libera'
  );
  assert.strictEqual(
    canShowCareInstructions({ validationStatus: 'clinically_reviewed', clinicalReview: {} as any, publicationAllowed: true, suspendedReason: 'em reavaliação' }, false),
    false,
    'suspendedReason bloqueia mesmo com revisão'
  );
  assert.strictEqual(
    canShowCareInstructions({ validationStatus: 'clinically_reviewed', clinicalReview: {} as any, publicationAllowed: true }, false),
    true
  );
  assert.strictEqual(canShowCareInstructions({ validationStatus: 'pending_review' }, true), true);
});

test('Cuidados: texto, ideia prática e "Fiz essa atividade" ficam atrás da mesma regra', () => {
  const view = fs.readFileSync('src/views/CareView.tsx', 'utf8');
  const gated = view.slice(view.indexOf('{showInstructions ? ('), view.indexOf('data-testid="care-review-pending"'));
  assert.match(gated, /art\.practicalAction/);
  assert.match(gated, /art\.educationalText/);
  const action = view.slice(view.indexOf('{showInstructions && ('), view.indexOf('</article>'));
  assert.match(action, /t\.care\.doActivityBtn/);
  // Fonte e selo de situação continuam visíveis para todos
  assert.ok(view.indexOf('care-source-note') > view.indexOf('data-testid="care-review-pending"'));
  assert.ok(view.indexOf("'Em Revisão'") < view.indexOf('{showInstructions ? ('));
});

test('Emergência: cada país tem fonte oficial e data de conferência', () => {
  const codes = new Set<string>();
  for (const c of EMERGENCY_CONTACTS) {
    assert.ok(!codes.has(c.code), `${c.code} repetido`);
    codes.add(c.code);
    assert.ok(c.sources.length > 0 && c.sources.every((u: string) => u.startsWith('https://')), `${c.code}: fonte`);
    assert.match(c.checkedOn, /^\d{4}-\d{2}-\d{2}$/);
    assert.match(c.emergency.number, /^\d+$/);
    if (c.healthLine) {
      assert.match(c.healthLine.number, /^\d+$/);
      assert.match(c.healthLine.label.pt, /não é emergência/, `${c.code}: linha de saúde marcada como não emergência`);
      assert.match(c.healthLine.label.en, /not (for )?an? ?emergenc|not for emergencies/, `${c.code} (en)`);
    }
  }
  assert.strictEqual(getEmergencyContact('XX'), null, 'país sem fonte: sem número');
  assert.strictEqual(getEmergencyContact(undefined), null);
});

test('Emergência: Noruega 113 (médica) e 116 117 (legevakt); Brasil SAMU 192 e Disque Saúde 136; França SAMU 15', () => {
  const no = getEmergencyContact('NO');
  assert.strictEqual(no.emergency.number, '113');
  assert.strictEqual(no.emergency.label.pt, '113', 'a faixa já diz "Emergência médica"');
  assert.strictEqual(no.healthLine.number, '116117');
  assert.match(no.healthLine.label.pt, /Legevakt 116 117/);
  const br = getEmergencyContact('BR');
  assert.strictEqual(br.emergency.number, '192');
  assert.strictEqual(br.emergency.label.pt, 'SAMU 192');
  assert.strictEqual(br.healthLine.number, '136');
  assert.match(br.healthLine.label.pt, /informações e ouvidoria do SUS \(não é emergência\)/);
  assert.strictEqual(getEmergencyContact('FR').emergency.number, '15');
  const today = fs.readFileSync('src/views/TodayView.tsx', 'utf8');
  assert.ok(!/healthLineSuffix/.test(today), 'o rótulo da linha de saúde já diz para que serve');
});

test('Cuidados: cabeçalho de produção fala em Guia de cuidados em revisão, sem "orientações práticas" nem "baseadas em evidências"', async () => {
  const view = fs.readFileSync('src/views/CareView.tsx', 'utf8');
  assert.match(view, /CARE_FULL_TEXT_ENABLED \? t\.care\.title : t\.care\.titleUnderReview/);
  assert.ok(!/Evidence-based|Orientações práticas para/.test(view));
  const { ptBR } = await import('../src/locales/pt-BR.ts');
  const { en } = await import('../src/locales/en.ts');
  assert.strictEqual(ptBR.care.titleUnderReview, 'Guia de cuidados');
  assert.strictEqual(en.care.titleUnderReview, 'Care Guide');
  for (const s of [ptBR.care.stageSubtitleUnderReview('X'), en.care.stageSubtitleUnderReview('X')]) {
    assert.ok(!/prátic|practic|evidence|evidência/i.test(s), s);
  }
});

test('Governança Clínica: Ausência de falsas declarações de validação médica na interface', () => {
  const files = [
    ...['src/locales/pt-BR.ts', 'src/locales/en.ts'],
    ...fs.readdirSync('src/views').map((f) => `src/views/${f}`),
    ...fs.readdirSync('src/components').map((f) => `src/components/${f}`)
  ];
  const forbidden = /\bclinicamente\s+validad|clinically\s+validated|validad[ao]\s+por\s+(?:m[eé]dic|profission)/i;
  for (const f of files) {
    const text = fs.readFileSync(f, 'utf-8');
    assert.ok(!forbidden.test(text), `${f} contém afirmação indevida de validação médica: "${text.match(forbidden)?.[0]}"`);
  }
});

test('Governança Clínica: Conteúdos suspensos permanecem excluídos e protegidos', async () => {
  const { getContentCatalog } = await import('../src/data/contents.ts');
  for (const lang of ['pt-BR', 'en'] as const) {
    const catalog = getContentCatalog(lang, { includeDevPending: false });
    // Nenhum item suspenso deve estar no catálogo público
    assert.ok(!catalog.some((c) => c.suspendedReason), `Catálogo público ${lang} não deve exibir itens suspensos`);
  }
});
