import assert from 'node:assert';
import test from 'node:test';
import fs from 'node:fs';
import path from 'node:path';
import { CONTENTS_CATALOG_PT, CONTENTS_CATALOG_EN, getContentCatalog } from '../src/data/contents.ts';

// Classificação dos temas de Cuidados (veja CONTENT.md; pendência interna C1). Na versão
// pública não há catálogo de evidências nem busca: só a biblioteca de temas.
// Citar uma instituição não é revisão clínica: só 'clinically_reviewed' afirma revisão,
// e só com registro documentado (quem revisou, credencial, data e referência do registro).

const STATUSES = ['clinically_reviewed', 'source_based', 'pending_review', 'demonstrative'];
const CONTENTS = [...CONTENTS_CATALOG_PT, ...CONTENTS_CATALOG_EN];

type Reviewable = { id: string; validationStatus: string; clinicalReview?: Record<string, string> };

function assertReviewRecord(item: Reviewable) {
  if (item.validationStatus !== 'clinically_reviewed') {
    assert.strictEqual(item.clinicalReview, undefined, `${item.id}: registro de revisão sem status correspondente`);
    return;
  }
  const r = item.clinicalReview;
  assert.ok(r, `${item.id}: 'clinically_reviewed' exige registro de revisão`);
  for (const field of ['reviewer', 'credential', 'date', 'reference']) {
    assert.ok(r[field] && r[field].trim().length > 0, `${item.id}: registro de revisão sem "${field}"`);
  }
}

test('Classificação: todo conteúdo usa um dos quatro status, sem "verified"', () => {
  for (const item of CONTENTS) {
    assert.ok(STATUSES.includes(item.validationStatus), `${item.id}: status inválido "${item.validationStatus}"`);
  }
});

test('Classificação: revisão clínica só com registro documentado', () => {
  for (const item of CONTENTS as Reviewable[]) assertReviewRecord(item);
});

test('Classificação: "source_based" exige publicação identificável', () => {
  for (const c of CONTENTS.filter((c) => c.validationStatus === 'source_based')) {
    assert.ok(c.source && c.source.length > 10, `${c.id}: fonte ausente`);
  }
});

test('Classificação: versões pt e en de cada conteúdo têm o mesmo status', () => {
  const en = new Map(CONTENTS_CATALOG_EN.map((c) => [c.id, c.validationStatus]));
  for (const c of CONTENTS_CATALOG_PT) {
    if (en.has(c.id)) assert.strictEqual(en.get(c.id), c.validationStatus, `${c.id}: status diferente entre pt e en`);
  }
});

test('Classificação: contagem atual (nenhuma revisão clínica documentada)', () => {
  const count = (list: Reviewable[], s: string) => list.filter((c) => c.validationStatus === s).length;
  assert.strictEqual(count(CONTENTS, 'clinically_reviewed'), 0);
  assert.strictEqual(count(CONTENTS, 'source_based'), 12);
  assert.strictEqual(count(CONTENTS, 'pending_review'), 48);
});

test('Suspensão: conteúdos suspensos ficam fora da interface', () => {
  const suspendedContents = CONTENTS.filter((c) => c.suspendedReason);
  assert.deepStrictEqual(
    [...new Set(suspendedContents.map((c) => c.id))].sort(),
    ['preg-movement-awareness', 'preg-pelvic-breathing']
  );
  // Suspenso nunca é revisado: continua pendente
  for (const c of suspendedContents) assert.strictEqual(c.validationStatus, 'pending_review', `${c.id} suspenso deve seguir pendente`);
  for (const lang of ['pt-BR', 'en'] as const) {
    assert.ok(!getContentCatalog(lang).some((c) => c.suspendedReason), `Catálogo ${lang} não exibe suspensos`);
    assert.strictEqual(getContentCatalog(lang).length, 28);
  }
});

test('Versão pública: só informações básicas dos temas, sem textos completos, ideias práticas ou notas de revisão', () => {
  for (const c of CONTENTS as Array<Record<string, unknown>>) {
    assert.strictEqual(c.educationalText, '', `${c.id}: texto completo`);
    for (const k of ['practicalAction', 'reviewNote', 'tagLabel', 'clinicalReview']) assert.strictEqual(c[k], undefined, `${c.id}: ${k}`);
    for (const k of ['id', 'title', 'category', 'categoryLabel', 'phase', 'theme', 'source', 'validationStatus']) assert.ok(c[k], `${c.id}: ${k}`);
  }
});

test('Interface: nenhum texto afirma conteúdo "verificado" ou validado', () => {
  const files = [
    ...['src/locales/pt-BR.ts', 'src/locales/en.ts'],
    ...fs.readdirSync('src/views').map((f) => `src/views/${f}`),
    ...fs.readdirSync('src/components').map((f) => `src/components/${f}`)
  ];
  const forbidden = /\bverified\b|verificad[ao]s?\b|clinicamente\s+validad|clinically\s+validated|validad[ao]\s+por\s+(?:m[eé]dic|profission)/i;
  for (const f of files) {
    const text = fs.readFileSync(path.resolve(f), 'utf-8');
    assert.ok(!forbidden.test(text), `${f} contém afirmação de validação: "${text.match(forbidden)?.[0]}"`);
  }
});
