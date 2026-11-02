import assert from 'node:assert';
import test from 'node:test';
import fs from 'node:fs';
import { build } from 'esbuild';
import { displayTag, sameTag, KNOWN_TAG_PAIRS } from '../src/domain/journeyTags.ts';
import { ptBR } from '../src/locales/pt-BR.ts';
import { en } from '../src/locales/en.ts';

// Revisão de experiência antes da publicação: marcações traduzidas, check-in, cartas do dia,
// tela Hoje, Jornada, cartão de nascimento e aba Pergunte. Dados fictícios.

const bundle = await build({ entryPoints: ['src/data/dailyCards.ts'], bundle: true, write: false, format: 'esm', platform: 'node' });
const { DAILY_CARDS_PT, DAILY_CARDS_EN } = await import(
  'data:text/javascript;base64,' + Buffer.from(bundle.outputFiles[0].text).toString('base64')
);

test('Marcações: aparecem no idioma atual, inclusive registros feitos no outro idioma', () => {
  assert.strictEqual(displayTag('Mood: Autopilot', 'pt-BR'), 'Humor: No piloto automático');
  assert.strictEqual(displayTag('Humor: Piloto automático', 'pt-BR'), 'Humor: No piloto automático', 'texto antigo');
  assert.strictEqual(displayTag('Humor: Piloto automático', 'en'), 'Mood: Autopilot');
  assert.strictEqual(displayTag('Baby: Needing comfort', 'pt-BR'), 'Bebê: Pedindo colo');
  assert.strictEqual(displayTag('Dormiu bem', 'en'), en.journey.babyTags[0].tag);
  assert.strictEqual(displayTag(en.journey.momTags[2].tag, 'pt-BR'), ptBR.journey.momTags[2].tag);
  assert.strictEqual(displayTag('Marcação escrita pela família', 'en'), 'Marcação escrita pela família', 'desconhecida fica como está');
});

test('Marcações: pares do formulário vêm dos arquivos de idioma, sem textos repetidos', () => {
  assert.strictEqual(ptBR.journey.babyTags.length, en.journey.babyTags.length);
  assert.strictEqual(ptBR.journey.momTags.length, en.journey.momTags.length);
  const all = KNOWN_TAG_PAIRS.flatMap((p) => [p.pt, p.en, ...(p.aliases ?? [])]);
  assert.strictEqual(new Set(all).size, all.length);
  assert.ok(sameTag('Mood: Autopilot', 'Humor: No piloto automático'));
  assert.ok(sameTag('Humor: Piloto automático', 'Humor: No piloto automático'));
  assert.ok(!sameTag('Mood: Autopilot', 'Mood: Tired'));
});

test('Check-in: "No piloto automático", reconhecendo registros antigos e do outro idioma', () => {
  const src = fs.readFileSync('src/components/WeeklyMoments.tsx', 'utf8');
  assert.match(src, /'No piloto automático'/);
  assert.match(src, /'Humor: No piloto automático'/);
  assert.ok(!/: 'Piloto automático'/.test(src));
  assert.match(src, /rec\.tags\.some\(\(t\) => sameTag\(t, o\.tag\)/);
  assert.match(src, /todayRecord\?\.tags\.some\(\(t\) => sameTag\(t, opt\.tag\)\)/);
});

test('Cartas do dia: sem tom oficial, conselho clínico, culpa ou suposição de que quem usa é a mãe', () => {
  const forbidden = /oficial|official|minist|científic|scientific|boa mãe|good mom|mãe pior|worse mom|só precisa acabar|just has to end|travesseiro|pillow|conselho de internet|advice online|grata\b|cansada\b/i;
  for (const c of [...DAILY_CARDS_PT, ...DAILY_CARDS_EN]) assert.ok(!forbidden.test(c.text), `${c.id}: ${c.text}`);
  assert.deepStrictEqual(DAILY_CARDS_PT.map((c: any) => c.id), DAILY_CARDS_EN.map((c: any) => c.id));
  assert.deepStrictEqual(DAILY_CARDS_PT.map((c: any) => [c.category, c.phase]), DAILY_CARDS_EN.map((c: any) => [c.category, c.phase]));
  assert.strictEqual(new Set(DAILY_CARDS_PT.map((c: any) => c.id)).size, DAILY_CARDS_PT.length);
  // "um dia de cada vez" aparece uma vez só
  assert.strictEqual(DAILY_CARDS_PT.filter((c: any) => /um dia de cada vez/i.test(c.text)).length, 1);
  for (const phase of ['pregnancy', 'baby']) {
    for (const cat of ['validation', 'selfcare', 'humor', 'perspective']) {
      assert.ok(DAILY_CARDS_PT.some((c: any) => c.category === cat && (c.phase === 'both' || c.phase === phase)), `${phase}/${cat}`);
    }
  }
});

test('Hoje: Exames e triagens entre os quatro acessos; emergência numa faixa própria; sem atalho repetido', () => {
  const today = fs.readFileSync('src/views/TodayView.tsx', 'utf8');
  assert.strictEqual((today.match(/\{healthChecksCard\}/g) || []).length, 2, 'gestação e bebê');
  assert.strictEqual((today.match(/\{emergencyCard\}/g) || []).length, 1, 'faixa abaixo dos acessos');
  assert.match(today, /<EmergencyStrip/);
  assert.ok(!/home-hc-shortcut/.test(today));
  assert.match(today, /onClick=\{\(\) => onOpenHealthChecks\?\.\(\)\}/);
});

test('Faixa de emergência: compacta, com ligação a um toque e contatos separados ao abrir', () => {
  const strip = fs.readFileSync('src/components/EmergencyStrip.tsx', 'utf8');
  const closed = strip.slice(0, strip.indexOf('{open && ('));
  // A ligação para a emergência médica está fora da área que abre: sempre visível
  assert.match(closed, /href=\{`tel:\$\{contact\.emergency\.number\}`\}/);
  assert.match(closed, /aria-expanded=\{open\}/);
  const details = strip.slice(strip.indexOf('{open && ('));
  assert.ok(details.indexOf('emergencyGroupUrgent') < details.indexOf('emergencyGroupOther'), 'emergência antes do que não é emergência');
  assert.match(details, /t\.region\.setCountryHint/, 'sem país: orientação para informar o país');
  assert.ok(!/sinais|alerta|warning|febre|fever|sangramento|bleeding/i.test(strip.replace(/\/\/.*$/gm, '')), 'sem critérios clínicos');
  assert.strictEqual(ptBR.today.emergencyStripTitle, 'Precisa de ajuda urgente?');
  assert.strictEqual(ptBR.today.emergencyStripService('SAMU 192'), 'Emergência médica: SAMU 192');
  assert.strictEqual(en.today.emergencyCallShort('113'), 'Call 113');
  assert.strictEqual(ptBR.today.hubSectionTitle, 'O que você precisa hoje?');
  assert.strictEqual(en.today.hubSectionTitle, 'What do you need today?');
  for (const t of [ptBR, en]) {
    for (const k of ['hubPregWellbeingDesc', 'hubPregJourneyDesc', 'hubBabyRecoveryDesc', 'hubBabyCareDesc', 'hubSupportDesc'] as const) {
      assert.ok(t.today[k].length <= 45, `${k}: ${t.today[k]}`);
    }
    assert.ok(t.healthChecks.journeyCardDesc.length <= 45);
  }
});

test('Jornada: título, exclusão individual com confirmação e sem o atalho de exames', () => {
  const view = fs.readFileSync('src/views/JourneyView.tsx', 'utf8');
  assert.match(view, /t\.journey\.timelineTitle/);
  assert.ok(!/journey-hc-card/.test(view));
  assert.match(view, /onClick=\{\(\) => setRecordToDelete\(rec\)\}/, 'o botão só abre a confirmação');
  const modal = view.slice(view.indexOf('{recordToDelete && ('), view.indexOf('{/* MODAL 2'));
  assert.match(modal, /await onDeleteRecord\?\.\(id\)/);
  assert.match(modal, /setRecordToDelete\(null\)/);
  assert.match(view, /displayTag\(tg, language\)/);
  assert.strictEqual(ptBR.journey.timelineTitle, 'Sua linha do tempo');
  assert.match(ptBR.journey.deleteRecordText, /Só este registro/);
});

test('Cartão de nascimento: rodapé, arquivo e mensagens nos dois idiomas, sem o nome antigo', () => {
  const view = fs.readFileSync('src/components/BirthRecordView.tsx', 'utf8');
  assert.ok(!/FIRST 1,000 DAYS|First 1,000 Days|cartao_nascimento|'Privado'|'Erro ao|'Não foi possível/.test(view));
  assert.strictEqual((view.match(/t\.birthRecord\.cardFooter/g) || []).length, 2, 'imagem e prévia');
  assert.strictEqual(ptBR.birthRecord.cardTitle, 'Boas-vindas ao mundo!');
  assert.match(en.birthRecord.cardFooter, /^MAMAND/);
  assert.strictEqual(en.birthRecord.filePrefix, 'birth_card');
});

test('Pergunte: rótulo "Pergunte" e aviso curto, sem instrução de preenchimento', () => {
  assert.strictEqual(ptBR.ask.suspendedBadge, 'Pergunte');
  assert.strictEqual(en.ask.suspendedBadge, 'Ask');
  for (const text of [ptBR.ask.suspendedText, en.ask.suspendedText]) {
    assert.ok(text.length < 110, text);
    assert.ok(!/digite|escreva|não inclua|type|enter|do not include|dados pessoais|personal/i.test(text), text);
  }
});

test('Exames e triagens: mensagem sem lista do país explica o que dá para fazer', () => {
  assert.match(ptBR.healthChecks.infoNoCatalog, /Ainda não há uma lista educativa revisada/);
  assert.match(ptBR.healthChecks.infoManualHint, /registrar qualquer exame ou triagem/);
  assert.strictEqual(ptBR.healthChecks.backBtn, 'Voltar');
});
