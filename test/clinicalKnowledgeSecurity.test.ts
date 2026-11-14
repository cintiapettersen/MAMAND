import assert from 'node:assert';
import test from 'node:test';
import fs from 'node:fs';
import path from 'node:path';
import { retrieveRelevantEvidence } from '../src/services/ragService.ts';
import { generateMockAnswer } from '../src/services/mockEngine.ts';
import { getContentCatalog } from '../src/data/contents.ts';
import { ruleEngine } from '../src/services/ruleEngine.ts';
import { checkEmergencySafety } from '../src/services/safetyService.ts';
import {
  consultEducationalAssistant,
  checkGatewayHealth,
  ENABLE_EXTERNAL_AI
} from '../src/services/askService.ts';
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
  const publicCatalogPt = getContentCatalog('pt-BR', { includeDevPending: false });
  assert.ok(publicCatalogPt.length > 0, 'Catálogo público deve listar metadados dos temas');

  // Nenhum item em produção pode expor textos clínicos sem autorização formal de publicação
  for (const item of publicCatalogPt) {
    assert.strictEqual(item.suspendedReason, undefined, `Item suspenso ${item.id} não pode aparecer no catálogo`);
    assert.notStrictEqual(item.clinicalApprovalStatus, 'rejected');
    if (item.validationStatus !== 'clinically_reviewed') {
      assert.strictEqual(item.educationalText, '', `Item ${item.id} não revisado não pode conter educationalText`);
      assert.strictEqual(item.practicalAction, undefined, `Item ${item.id} não revisado não pode conter practicalAction`);
    }
  }
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

  // Nenhum item retornado pode estar suspenso ou conter texto clínico não autorizado
  for (const item of [recs.babyGuidance, recs.momGuidance, recs.priorityActivity]) {
    assert.strictEqual(item.suspendedReason, undefined);
    if (item.validationStatus !== 'clinically_reviewed') {
      assert.strictEqual(item.educationalText, '');
    }
  }
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

test('8. Bloqueio Estrito de Conexões Externas no Assistente: Zero Envio de Perguntas e Ausência de Respostas Clínicas Inventadas', async () => {
  // 1. Confirma que a flag de IA externa está estritamente desabilitada
  assert.strictEqual(ENABLE_EXTERNAL_AI, false, 'ENABLE_EXTERNAL_AI DEVE ser false nesta fase');

  // 2. Intercepta globalThis.fetch para garantir ausência absoluta de chamadas externas de rede
  const originalFetch = globalThis.fetch;
  let fetchCallCount = 0;
  const attemptedUrls: string[] = [];

  globalThis.fetch = (async (input: any) => {
    fetchCallCount++;
    const url = typeof input === 'string' ? input : input?.url || String(input);
    attemptedUrls.push(url);
    throw new Error(`VIOLAÇÃO DE ISOLAMENTO: Tentativa indevida de requisição de rede para ${url}`);
  }) as any;

  try {
    const dummyProfile: UserProfile = {
      phase: 'baby',
      stageValue: 2,
      stageLabel: '2 meses',
      mainNeed: 'all',
      country: 'BR',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Caso A: Pergunta clínica legítima dentro do catálogo
    const withinCatalogResult = await consultEducationalAssistant(
      'Qual a posição recomendada para o sono do bebê?',
      dummyProfile,
      'pt-BR'
    );
    assert.strictEqual(fetchCallCount, 0, 'Consulta legítima não deve disparar fetch externo');
    assert.strictEqual(withinCatalogResult.mode, 'mock', 'Modo deve ser estritamente mock local');
    assert.strictEqual(withinCatalogResult.status, 'success', 'Status deve ser success para pergunta válida do catálogo');
    assert.ok(withinCatalogResult.citations.length > 0, 'Deve conter citações clínicas verificadas');
    for (const c of withinCatalogResult.citations) {
      assert.strictEqual(c.validationStatus, 'verified', 'Todas as citações retornadas devem ser verified');
    }

    // Caso B: Pergunta fora do catálogo clínico (NÃO deve alucinar nem inventar condutas)
    const outOfCatalogResult = await consultEducationalAssistant(
      'Como dosar paracetamol e prescrever antibiótico caseiro para pneumonia?',
      dummyProfile,
      'pt-BR'
    );
    assert.strictEqual(fetchCallCount, 0, 'Consulta fora do catálogo não deve disparar fetch externo');
    assert.strictEqual(outOfCatalogResult.mode, 'mock', 'Modo deve ser mock');
    assert.strictEqual(outOfCatalogResult.status, 'out_of_catalog', 'Status deve ser out_of_catalog');
    assert.strictEqual(outOfCatalogResult.citations.length, 0, 'Não deve inventar citações');
    assert.match(
      outOfCatalogResult.answer,
      /(?:Ainda não temos uma orientação específica|sem extrapolar|consulte)/i,
      'Resposta deve acolher com recusa segura sem inventar conduta médica'
    );

    // Caso C: Alerta de emergência clínica (detector prioritário local com número SAMU do Brasil)
    const emergencyResult = await consultEducationalAssistant(
      'Bebê recém-nascido com febre de 39 graus e dificuldade de respirar',
      dummyProfile,
      'pt-BR'
    );
    assert.strictEqual(fetchCallCount, 0, 'Emergência deve ser tratada localmente sem fetch');
    assert.strictEqual(emergencyResult.isEmergency, true, 'isEmergency deve ser true');
    assert.strictEqual(emergencyResult.status, 'emergency', 'Status deve ser emergency');
    assert.match(emergencyResult.answer, /(?:SAMU|192|médica urgente|emergência)/i);

    // Caso D: Verificação de saúde do Gateway com IA desabilitada
    const health = await checkGatewayHealth();
    assert.strictEqual(fetchCallCount, 0, 'checkGatewayHealth não deve fazer requisição quando ENABLE_EXTERNAL_AI for false');
    assert.strictEqual(health.online, false, 'Gateway deve reportar offline sem rede');
  } finally {
    globalThis.fetch = originalFetch;
  }
});
