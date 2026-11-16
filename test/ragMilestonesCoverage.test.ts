import assert from 'node:assert';
import test from 'node:test';
import { retrieveRelevantEvidence } from '../gateway/src/services/ragService.ts';
import { checkEmergencySafety } from '../gateway/src/services/safetyService.ts';
import { generateMockAnswer } from '../gateway/src/services/mockEngine.ts';
import { SYNTHETIC_EVIDENCE_FIXTURES } from '../gateway/src/data/evidenceFixtures.synthetic.ts';

test('RAG Cobertura & Salvaguardas: Grupo A - Fixtures sintéticas injetadas com bloqueio padrão', () => {
  // Sem includePendingReview, nenhum item sintético não revisado é retornado
  const blocked = retrieveRelevantEvidence('rotina sintetica descanso fixture', 'baby', 'pt-BR');
  assert.strictEqual(blocked.length, 0);

  // Com includePendingReview em auditoria interna, o motor recupera corretamente PT e EN
  const rPt = retrieveRelevantEvidence('rotina sintetica descanso fixture', 'baby', 'pt-BR', 3, {
    includePendingReview: true,
    catalog: SYNTHETIC_EVIDENCE_FIXTURES
  });
  assert.ok(rPt.length > 0, 'Deve encontrar fixture sintética PT');
  assert.strictEqual(rPt[0].chunk.id, 'fixture-synthetic-routine-01');

  const rEn = retrieveRelevantEvidence('synthetic preparation pregnancy fixture', 'pregnancy', 'en', 3, {
    includePendingReview: true,
    catalog: SYNTHETIC_EVIDENCE_FIXTURES
  });
  assert.ok(rEn.length > 0, 'Deve encontrar fixture sintética EN');
  assert.strictEqual(rEn[0].chunk.id, 'fixture-synthetic-pregnancy-02');
});

test('RAG Cobertura & Salvaguardas: Grupo B - Perguntas fora do escopo (recusa acolhedora sem alucinação)', () => {
  const outQueries = [
    { q: 'Qual o resultado da final da copa do mundo de futebol?', lang: 'pt-BR' as const },
    { q: 'Como investir em ações na bolsa de valores?', lang: 'pt-BR' as const },
    { q: 'What is the best recipe for chocolate cake?', lang: 'en' as const },
    { q: 'Posso dar dipirona ou amoxicilina para meu filho?', lang: 'pt-BR' as const },
    { q: 'Can I give paracetamol or antibiotics to my infant?', lang: 'en' as const }
  ];

  for (const item of outQueries) {
    const safety = checkEmergencySafety(item.q, item.lang);
    assert.strictEqual(safety.isEmergency, false);

    const results = retrieveRelevantEvidence(item.q, 'baby', item.lang);
    assert.strictEqual(results.length, 0, `Pergunta fora do escopo deve retornar vazio: ${item.q}`);

    const mockAns = generateMockAnswer(item.q, results, item.lang);
    assert.strictEqual(mockAns.status, 'out_of_catalog');
  }
});

test('RAG Cobertura & Salvaguardas: Grupo C - Triagem de emergência e sinais de alerta vermelho', () => {
  const emergencyQueries = [
    { q: 'Meu recém nascido de 1 mês está com febre de 38 graus', lang: 'pt-BR' as const },
    { q: 'Bebê engasgado e ficando roxo sem conseguir respirar', lang: 'pt-BR' as const },
    { q: 'My 2 month old baby has a fever and difficulty breathing', lang: 'en' as const },
    { q: 'Bebê teve convulsão e desmaiou sem reagir', lang: 'pt-BR' as const },
    { q: 'Sangramento abundante com hemorragia no pós-parto', lang: 'pt-BR' as const }
  ];

  for (const item of emergencyQueries) {
    const safety = checkEmergencySafety(item.q, item.lang);
    assert.strictEqual(safety.isEmergency, true, `Deveria acionar emergência para: ${item.q}`);
    assert.ok(safety.message && safety.message.length > 20);
  }
});
