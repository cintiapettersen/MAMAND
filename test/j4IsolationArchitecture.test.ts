import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { retrieveRelevantEvidence as retrieveAppEvidence } from '../src/services/ragService.ts';
import { retrieveRelevantEvidence as retrieveGatewayEvidence } from '../gateway/src/services/ragService.ts';
import { SYNTHETIC_EVIDENCE_FIXTURES as APP_FIXTURES } from '../src/data/evidenceFixtures.synthetic.ts';
import { SYNTHETIC_EVIDENCE_FIXTURES as GW_FIXTURES } from '../gateway/src/data/evidenceFixtures.synthetic.ts';

const ROOT = path.resolve(import.meta.dirname, '..');

test('1. Fixtures sintéticas não possuem status clinicamente aprovado nem fontes externas protegidas', () => {
  for (const fixtures of [APP_FIXTURES, GW_FIXTURES]) {
    assert.ok(fixtures.length >= 2);
    for (const item of fixtures) {
      assert.equal(item.validationStatus, 'pending_review');
      assert.equal(item.publicationAllowed, false);
      assert.match(item.id, /^fixture-synthetic-/);
      assert.doesNotMatch(item.sourceName, /OMS|WHO|Ministério da Saúde|AAP|UNICEF/i);
    }
  }
});

test('2. Motor RAG (src e gateway) bloqueia fixtures sintéticas por padrão quando sem revisão', () => {
  const appDefault = retrieveAppEvidence('rotina sintetica descanso fixture', 'baby', 'pt-BR', 3, {
    catalog: APP_FIXTURES
  });
  const gwDefault = retrieveGatewayEvidence('rotina sintetica descanso fixture', 'baby', 'pt-BR', 3, {
    catalog: GW_FIXTURES
  });

  assert.equal(appDefault.length, 0);
  assert.equal(gwDefault.length, 0);
});

test('3. Motor RAG (src e gateway) opera integralmente com fixtures sintéticas injetadas (PT e EN)', () => {
  const appPt = retrieveAppEvidence('rotina sintetica descanso fixture', 'baby', 'pt-BR', 3, {
    includePendingReview: true,
    catalog: APP_FIXTURES
  });
  const gwEn = retrieveGatewayEvidence('synthetic preparation pregnancy fixture', 'pregnancy', 'en', 3, {
    includePendingReview: true,
    catalog: GW_FIXTURES
  });

  assert.equal(appPt.length, 1);
  assert.equal(appPt[0].chunk.id, 'fixture-synthetic-routine-01');
  assert.equal(gwEn.length, 1);
  assert.equal(gwEn[0].chunk.id, 'fixture-synthetic-pregnancy-02');
});

test('4. Plano de isolamento J4 documenta preservação, histórico Git e checklist da fundadora', () => {
  const plan = fs.readFileSync(
    path.join(ROOT, 'docs/governanca/j4-plano-isolamento-pesquisa.md'),
    'utf8'
  );
  assert.match(plan, /não elimina cópias já existentes no histórico público do Git/);
  assert.match(plan, /não.*resolve automaticamente direitos autorais/i);
  assert.match(plan, /Indicador 2/);
  assert.match(plan, /Indicador 3/);
  assert.match(plan, /Indicador 8/);
});
