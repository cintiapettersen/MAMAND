import assert from 'node:assert';
import test from 'node:test';
import { retrieveRelevantEvidence } from '../gateway/src/services/ragService.ts';
import { checkEmergencySafety } from '../gateway/src/services/safetyService.ts';
import { generateMockAnswer } from '../gateway/src/services/mockEngine.ts';
import { EVIDENCE_CATALOG } from '../gateway/src/data/evidenceCatalog.ts';

test('RAG Cobertura & Salvaguardas: Grupo A - Perguntas dentro do escopo com resposta clínica fundamentada', () => {
  // 1. Marcha / Bebê começar a andar (PT)
  const q1 = 'Qual a idade média que o bebê começa a andar?';
  const r1 = retrieveRelevantEvidence(q1, 'baby', 'pt-BR');
  assert.ok(r1.length > 0, 'Deve encontrar evidência');
  assert.strictEqual(r1[0].chunk.id, 'ev-milestones-gross-motor-17');
  const a1 = generateMockAnswer(q1, r1, 'pt-BR');
  assert.strictEqual(a1.status, 'success');
  assert.match(a1.answer, /12 meses/i);
  assert.match(a1.answer, /9 e 18 meses|9 a 18 meses/i);

  // 2. Walking / Baby start walking (EN)
  const q2 = 'How old are babies when they usually start walking?';
  const r2 = retrieveRelevantEvidence(q2, 'baby', 'en');
  assert.ok(r2.length > 0);
  assert.strictEqual(r2[0].chunk.id, 'ev-milestones-gross-motor-17');
  const a2 = generateMockAnswer(q2, r2, 'en');
  assert.strictEqual(a2.status, 'success');
  assert.match(a2.answer, /12 months/i);
  assert.match(a2.answer, /9 to 18 months/i);

  // 3. Sentar sem apoio (marco motor específico)
  const q3 = 'Com quantos meses o bebê senta sem apoio?';
  const r3 = retrieveRelevantEvidence(q3, 'baby', 'pt-BR');
  assert.strictEqual(r3[0].chunk.id, 'ev-milestones-gross-motor-17');
  const a3 = generateMockAnswer(q3, r3, 'pt-BR');
  assert.match(a3.answer, /sentar sem apoio/i);

  // 4. Variação fisiológica normal: 14 meses e ainda não anda
  const q4 = 'Meu bebê de 14 meses ainda não anda, isso é normal?';
  const r4 = retrieveRelevantEvidence(q4, 'baby', 'pt-BR');
  assert.strictEqual(r4[0].chunk.id, 'ev-milestones-gross-motor-17');
  const a4 = generateMockAnswer(q4, r4, 'pt-BR');
  assert.match(a4.answer, /normal/i);
  assert.match(a4.answer, /14 meses/i);

  // 5. Primeiras palavras / fala (PT)
  const q5 = 'Quando o bebê começa a falar as primeiras palavras?';
  const r5 = retrieveRelevantEvidence(q5, 'baby', 'pt-BR');
  assert.strictEqual(r5[0].chunk.id, 'ev-milestones-language-18');
  const a5 = generateMockAnswer(q5, r5, 'pt-BR');
  assert.match(a5.answer, /12 meses|10 e 14 meses|primeiras palavras/i);

  // 6. First words / talking (EN)
  const q6 = 'At what age do babies say their first words?';
  const r6 = retrieveRelevantEvidence(q6, 'baby', 'en');
  assert.strictEqual(r6[0].chunk.id, 'ev-milestones-language-18');
  const a6 = generateMockAnswer(q6, r6, 'en');
  assert.match(a6.answer, /first.*words|10 to 14 months|12 months/i);

  // 7. Tummy time (PT)
  const q7 = 'Como estimular o bebê de bruços com segurança (tummy time)?';
  const r7 = retrieveRelevantEvidence(q7, 'baby', 'pt-BR');
  assert.strictEqual(r7[0].chunk.id, 'ev-tummy-time-16');

  // 8. Tummy time (EN)
  const q8 = 'How do I safely do tummy time?';
  const r8 = retrieveRelevantEvidence(q8, 'baby', 'en');
  assert.strictEqual(r8[0].chunk.id, 'ev-tummy-time-16');

  // 9. Oferta de água antes dos 6 meses
  const q9 = 'Posso dar água para o bebê de 3 meses que mama no peito?';
  const r9 = retrieveRelevantEvidence(q9, 'baby', 'pt-BR');
  assert.strictEqual(r9[0].chunk.id, 'ev-water-hydration-infant-19');
  const a9 = generateMockAnswer(q9, r9, 'pt-BR');
  assert.match(a9.answer, /n[ãa]o devem receber [aá]gua|6 meses/i);

  // 10. Introdução alimentar complementar (6 meses)
  const q10 = 'Quando começar a introdução de alimentos sólidos?';
  const r10 = retrieveRelevantEvidence(q10, 'baby', 'pt-BR');
  assert.strictEqual(r10[0].chunk.id, 'ev-complementary-feeding-10');
  const a10 = generateMockAnswer(q10, r10, 'pt-BR');
  assert.match(a10.answer, /6 meses/i);

  // 11. Diferença entre reflexo de gag e engasgo real
  const q11 = 'Qual a diferença entre ânsia de engasgo (reflexo de gag) e engasgo real?';
  const r11 = retrieveRelevantEvidence(q11, 'baby', 'pt-BR');
  assert.strictEqual(r11[0].chunk.id, 'ev-choking-vs-gag-reflex-20');
  const a11 = generateMockAnswer(q11, r11, 'pt-BR');
  assert.match(a11.answer, /gag/i);
  assert.match(a11.answer, /silencioso|emerg[eê]ncia/i);

  // 12. Duração do sono do recém-nascido (OMS)
  const q12 = 'Quantas horas por dia um recém-nascido dorme?';
  const r12 = retrieveRelevantEvidence(q12, 'baby', 'pt-BR');
  assert.strictEqual(r12[0].chunk.id, 'ev-infant-sleep-duration-13');

  // 13. Cólicas do lactente
  const q13 = 'O que fazer para aliviar cólicas do bebê?';
  const r13 = retrieveRelevantEvidence(q13, 'baby', 'pt-BR');
  assert.strictEqual(r13[0].chunk.id, 'ev-infant-colic-14');

  // 14. Segurança da cadeirinha virada para trás
  const q14 = 'Até que idade a cadeirinha do carro deve ficar virada para trás?';
  const r14 = retrieveRelevantEvidence(q14, 'baby', 'pt-BR');
  assert.strictEqual(r14[0].chunk.id, 'ev-car-seat-safety-rear-facing-22');
  const a14 = generateMockAnswer(q14, r14, 'pt-BR');
  assert.match(a14.answer, /1 ano|2 anos/i);

  // 15. Cólicas uterinas da amamentação (afterpains)
  const q15 = 'É normal sentir cólicas no útero enquanto estou amamentando?';
  const r15 = retrieveRelevantEvidence(q15, 'baby', 'pt-BR');
  assert.strictEqual(r15[0].chunk.id, 'ev-postpartum-uterine-cramping-lochia-23');
  const a15 = generateMockAnswer(q15, r15, 'pt-BR');
  assert.match(a15.answer, /ocitocina|involu[çc][ãa]o|normal/i);

  // 16. Tristeza pós-parto (baby blues) vs depressão pós-parto
  const q16 = 'Como diferenciar tristeza pós-parto (baby blues) de depressão pós-parto?';
  const r16 = retrieveRelevantEvidence(q16, 'baby', 'pt-BR');
  assert.strictEqual(r16[0].chunk.id, 'ev-postpartum-mental-health-blues-ppd-24');
  const a16 = generateMockAnswer(q16, r16, 'pt-BR');
  assert.match(a16.answer, /baby blues/i);
  assert.match(a16.answer, /depress[ãa]o p[oó]s-parto/i);
});

test('RAG Cobertura & Salvaguardas: Grupo B - Perguntas fora do escopo (recusa acolhedora sem alucinação)', () => {
  const outOfScopeQueries = [
    'Como regular a pressão dos pneus de um automóvel?',
    'Qual é a cotação do dólar hoje?',
    'Qual a melhor linguagem de programação para inteligência artificial?',
    'Receita de bolo de chocolate sem açúcar para adultos',
    'Como declarar imposto de renda sobre aluguel?'
  ];

  for (const q of outOfScopeQueries) {
    const res = retrieveRelevantEvidence(q, 'baby', 'pt-BR');
    assert.strictEqual(res.length, 0, `Query fora de escopo não deve pontuar: "${q}"`);
    const ans = generateMockAnswer(q, res, 'pt-BR');
    assert.strictEqual(ans.status, 'out_of_catalog');
    assert.match(ans.answer, /Ainda não temos uma orientação específica/i);
    assert.doesNotMatch(ans.answer, /catálogo oficial cadastrado/i);
  }
});

test('RAG Cobertura & Salvaguardas: Grupo C - Perguntas ambíguas ou polissêmicas (desambiguação clínica)', () => {
  // 22. Dormir de bruços: DEVE priorizar ev-safe-sleep-01 e NÃO tummy time
  const q22 = 'Meu bebê pode dormir de bruços?';
  const r22 = retrieveRelevantEvidence(q22, 'baby', 'pt-BR');
  assert.strictEqual(r22[0].chunk.id, 'ev-safe-sleep-01', 'Dormir de bruços deve priorizar ev-safe-sleep-01');

  // 23. Duração do sono por fase (bebê)
  const q23 = 'Quanto tempo dura o sono?';
  const r23 = retrieveRelevantEvidence(q23, 'baby', 'pt-BR');
  assert.strictEqual(r23[0].chunk.id, 'ev-infant-sleep-duration-13');

  // 24. Quando introduzir água e chás (regra 6 meses)
  const q24 = 'Quando introduzir água e chás?';
  const r24 = retrieveRelevantEvidence(q24, 'baby', 'pt-BR');
  assert.strictEqual(r24[0].chunk.id, 'ev-water-hydration-infant-19');

  // 25. Bebê que chora muito à noite
  const q25 = 'Bebê que chora muito à noite';
  const r25 = retrieveRelevantEvidence(q25, 'baby', 'pt-BR');
  assert.strictEqual(r25[0].chunk.id, 'ev-infant-crying-15');

  // 26. Como cuidar da cicatriz (pós-parto / cesárea)
  const q26 = 'Como cuidar da cicatriz?';
  const r26 = retrieveRelevantEvidence(q26, 'baby', 'pt-BR');
  assert.strictEqual(r26[0].chunk.id, 'ev-postpartum-incision-care-25');
});

test('RAG Cobertura & Salvaguardas: Grupo D - Triagem de emergência e sinais de alerta vermelho', () => {
  const emergencyCases = [
    { q: 'Recém-nascido de 20 dias com febre de 38,5°C', lang: 'pt-BR' as const },
    { q: '1-month-old baby with high fever and lethargy', lang: 'en' as const },
    { q: 'Bebê respirando muito rápido com o peito afundando', lang: 'pt-BR' as const },
    { q: 'Sangramento pós-parto muito intenso encharcando absorventes em menos de uma hora', lang: 'pt-BR' as const },
    { q: 'Bebê caiu da cama e vomitou em seguida', lang: 'pt-BR' as const },
    { q: 'Estou com vontade de sumir e não sinto conexão nenhuma com o bebê', lang: 'pt-BR' as const }
  ];

  for (const c of emergencyCases) {
    const check = checkEmergencySafety(c.q, c.lang);
    assert.strictEqual(check.isEmergency, true, `Deve acionar emergência para: "${c.q}"`);
    assert.ok(check.emergencyPhone, 'Deve conter telefone de emergência');
    assert.match(check.message || '', /ATENÇÃO MÉDICA URGENTE|URGENT MEDICAL NOTICE/i);
  }
});

test('RAG Integridade: Auditoria de Confiabilidade das Fontes e Status Clínico', () => {
  // Garantir que todos os chunks possuem metadados completos
  for (const chunk of EVIDENCE_CATALOG) {
    assert.ok(chunk.id, 'Chunk deve ter ID');
    assert.ok(chunk.title_pt && chunk.title_en, 'Chunk deve ter títulos bilíngues');
    assert.ok(chunk.summary_pt && chunk.summary_en, 'Chunk deve ter sumários bilíngues');
    assert.ok(chunk.conversationalAnswer_pt && chunk.conversationalAnswer_en, 'Chunk deve ter respostas conversacionais');
    assert.ok(chunk.sourceName, 'Chunk deve citar a instituição oficial');
    assert.ok(chunk.url && chunk.url.startsWith('http'), 'Chunk deve ter link de acesso à fonte');
    assert.ok(['verified', 'pending_review', 'demonstrative'].includes(chunk.validationStatus), 'Status deve ser válido');
  }

  // Verificar distribuição de status: novos conteúdos NÃO são classificados automaticamente como 'verified'
  const pending = EVIDENCE_CATALOG.filter(c => c.validationStatus === 'pending_review');
  const verified = EVIDENCE_CATALOG.filter(c => c.validationStatus === 'verified');

  assert.strictEqual(pending.length, 9, 'Exatamente 9 novos chunks devem aguardar revisão clínica (pending_review)');
  assert.strictEqual(verified.length, 16, 'Exatamente 16 chunks preexistentes permanecem como verified');
});
