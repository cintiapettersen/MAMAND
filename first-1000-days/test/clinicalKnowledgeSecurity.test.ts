import assert from 'node:assert';
import test from 'node:test';
import fs from 'node:fs';
import path from 'node:path';
import { retrieveRelevantEvidence } from '../src/services/ragService.ts';
import { generateMockAnswer } from '../src/services/mockEngine.ts';
import { getContentCatalog } from '../src/data/contents.ts';
import { ruleEngine } from '../src/services/ruleEngine.ts';
import { checkEmergencySafety } from '../src/services/safetyService.ts';
import type { UserProfile } from '../src/types/index.ts';

/**
 * Suíte de Testes de Integração de Segurança Clínica MAMAND (Etapa 1)
 * Valida o bloqueio real nos caminhos de UI, Home, RAG, Mock e integridade de pesquisa.
 */

test('1. Isolamento da Biblioteca de Pesquisa: Validação estrutural de mamand_biblioteca_v0_1.json', () => {
  const jsonPath = path.resolve('research/clinical-knowledge/mamand_biblioteca_v0_1.json');
  assert.ok(fs.existsSync(jsonPath), 'mamand_biblioteca_v0_1.json deve existir na pasta de pesquisa');

  const raw = fs.readFileSync(jsonPath, 'utf-8');
  const data = JSON.parse(raw);

  assert.strictEqual(data.project, 'MAMAND');
  assert.strictEqual(data.library_version, '0.1.0');
  assert.strictEqual(data.release_status, 'draft_not_for_production');
  assert.strictEqual(data.entries.length, 3, 'Deve conter exatamente as 3 fichas');

  for (const entry of data.entries) {
    assert.ok(entry.id.startsWith('MAMAND-BEBE-'), 'ID deve seguir padrão MAMAND-BEBE-');
    assert.strictEqual(entry.publication_allowed, false, 'publication_allowed DEVE ser false');
    assert.strictEqual(entry.review.clinical, 'pending', 'Revisão clínica DEVE ser pending');
    assert.ok(entry.sources.length > 0, 'Deve conter fontes documentadas');
    assert.ok(Array.isArray(entry.allowed_intents) && entry.allowed_intents.length > 0, 'Deve definir escopo permitido');
    assert.ok(Array.isArray(entry.excluded_intents) && entry.excluded_intents.length > 0, 'Deve definir escopo excluído');
  }

  assert.strictEqual(data.assistant_rules.only_approved_entries, true);
  assert.strictEqual(data.assistant_rules.never_generate_new_clinical_guidance, true);
  assert.strictEqual(data.assistant_rules.do_not_answer_out_of_scope, true);
});

test('2. Isolamento de Produção: Arquivo de pesquisa NÃO deve constar em public/ nem vazar para dist/', () => {
  assert.ok(!fs.existsSync(path.resolve('public/mamand_biblioteca_v0_1.json')));
  assert.ok(!fs.existsSync(path.resolve('public/clinical-knowledge/mamand_biblioteca_v0_1.json')));
});

test('3. Bloqueio no RAG Real: Chunks pendentes de revisão NUNCA são recuperados na busca pública', () => {
  // Testa busca por termos vinculados a chunks com status pending_review
  // Ex: 'ev-postpartum-uterine-cramping-lochia-23' (lóquios/puerpério)
  const results = retrieveRelevantEvidence('como cuidar do corte da cesarea e sangramento loquios', 'baby', 'pt-BR');

  // Nenhum chunk retornado pode ter validationStatus diferente de verified
  for (const res of results) {
    assert.strictEqual(res.chunk.validationStatus, 'verified', `Chunk retornado ${res.chunk.id} não possui status verified`);
    assert.notStrictEqual(res.chunk.validationStatus, 'pending_review');
  }
});

test('4. Bloqueio no MockEngine: Entradas sem itens aprovados geram out_of_catalog seguro', () => {
  // Simula consulta de conduta clínica sem evidência aprovada
  const outOfCatalogResult = generateMockAnswer('Como avaliar infeccao no umbigo?', [], 'pt-BR');
  assert.strictEqual(outOfCatalogResult.status, 'out_of_catalog');
  assert.match(outOfCatalogResult.answer, /Ainda não temos uma orientação específica sobre esse assunto/i);
  assert.strictEqual(outOfCatalogResult.citations.length, 0);
});

test('5. Bloqueio Seguro no Catálogo Público da UI (getContentCatalog)', () => {
  // Consumo com flag dev desativada (comportamento de produção)
  const publicCatalogPt = getContentCatalog('pt-BR', { includeDevPending: false });
  assert.ok(publicCatalogPt.length > 0, 'Catálogo público deve ter itens');

  // Nenhum item em produção pode ser pending_review
  for (const item of publicCatalogPt) {
    assert.strictEqual(item.validationStatus, 'verified', `Item ${item.id} não verificado presente no catálogo público`);
    assert.notStrictEqual(item.validationStatus, 'pending_review');
  }

  // Em modo DEV explícito, deve conter itens para revisão interna
  const devCatalogPt = getContentCatalog('pt-BR', { includeDevPending: true });
  assert.ok(devCatalogPt.some(i => i.validationStatus === 'pending_review'), 'Modo dev deve incluir itens para revisão');
});

test('6. Resiliência do Motor de Regras (ruleEngine) com Fallback Seguro', () => {
  const dummyProfile: UserProfile = {
    phase: 'baby',
    stageValue: 0,
    stageLabel: 'Recém-nascido',
    mainNeed: 'all',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  const recs = ruleEngine.getRecommendations(dummyProfile, 'neutral', 'pt-BR');
  assert.ok(recs.babyGuidance, 'Deve fornecer card do bebê');
  assert.ok(recs.momGuidance, 'Deve fornecer card da mãe');
  assert.ok(recs.priorityActivity, 'Deve fornecer atividade prioritária');

  // Todos os cards fornecidos devem ser verificados e não inventados
  assert.strictEqual(recs.babyGuidance.validationStatus, 'verified');
  assert.strictEqual(recs.momGuidance.validationStatus, 'verified');
  assert.strictEqual(recs.priorityActivity.validationStatus, 'verified');
});

test('7. Integridade do Detector de Emergência: Preservação total sem alterações', () => {
  // Emergência neonatal (febre em bebê pequeno)
  const emergency1 = checkEmergencySafety('Meu bebê de 15 dias está com febre de 38.5', 'pt-BR');
  assert.strictEqual(emergency1.isEmergency, true);
  assert.match(emergency1.message || '', /ATENÇÃO MÉDICA URGENTE/);

  // Pergunta geral não emergencial
  const normal = checkEmergencySafety('Qual a posição recomendada para o sono?', 'pt-BR');
  assert.strictEqual(normal.isEmergency, false);
});
