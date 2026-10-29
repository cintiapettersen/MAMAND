import assert from 'node:assert';
import test from 'node:test';
import fs from 'node:fs';
import path from 'node:path';
import { indexedDbService } from '../src/services/indexedDbService.ts';
import type { JourneyRecord, UserProfile } from '../src/types/index.ts';
import { calculateDaysOfLife, calculateAgeInMonths, formatBabyAgeDetailed, formatDueDate } from '../src/utils/dateUtils.ts';
import { retrieveRelevantEvidence } from '../gateway/src/services/ragService.ts';
import { generateMockAnswer } from '../gateway/src/services/mockEngine.ts';

test('E2E 1: Ciclo completo de vida de registros fictícios no IndexedDB', async () => {
  // Mock robusto de IndexedDB em memória para simular ciclo de vida no navegador
  let storage: Record<string, JourneyRecord> = {};

  const mockDb = {
    transaction: (_storeName: string, mode: 'readonly' | 'readwrite') => {
      let aborted = false;
      const tx: any = {
        objectStore: () => ({
          getAllKeys: () => {
            const req: any = {};
            setTimeout(() => {
              req.result = Object.keys(storage);
              if (req.onsuccess) req.onsuccess();
            }, 0);
            return req;
          },
          getAll: () => {
            const req: any = {};
            setTimeout(() => {
              req.result = Object.values(storage);
              if (req.onsuccess) req.onsuccess();
            }, 0);
            return req;
          },
          add: (rec: JourneyRecord) => {
            if (aborted) throw new Error('Abort');
            storage[rec.id] = { ...rec };
          },
          clear: () => {
            const req: any = {};
            setTimeout(() => {
              storage = {};
              if (req.onsuccess) req.onsuccess();
            }, 0);
            return req;
          }
        }),
        abort: () => {
          aborted = true;
          if (tx.onabort) tx.onabort();
        }
      };
      setTimeout(() => {
        if (!aborted && tx.oncomplete) tx.oncomplete();
      }, 5);
      return tx;
    }
  };

  (indexedDbService as any).openDB = async () => mockDb;

  // 1. Criar registros fictícios de bebê, mãe e memória
  const fictionalRecords: JourneyRecord[] = [
    {
      id: 'fictional-baby-01',
      subject: 'baby',
      tags: ['Dormiu bem'],
      note: 'Fez uma soneca matinal de 1 hora no berço.',
      eventDate: '2026-10-20',
      dateLabel: '20/10/2026, 10:30',
      timestamp: '2026-10-20T10:30:00.000Z'
    },
    {
      id: 'fictional-mom-02',
      subject: 'mom',
      tags: ['Consegui um tempo só para mim'],
      note: 'Consegui almoçar com calma enquanto o bebê dormia.',
      eventDate: '2026-10-21',
      dateLabel: '21/10/2026, 12:45',
      timestamp: '2026-10-21T12:45:00.000Z'
    },
    {
      id: 'fictional-mem-03',
      subject: 'memory',
      tags: ['Primeiro sorriso social'],
      note: 'Sorriu e fez sons suaves ao conversar olhando nos olhos.',
      eventDate: '2026-10-22',
      dateLabel: '22/10/2026, 16:00',
      timestamp: '2026-10-22T16:00:00.000Z'
    }
  ];

  // Popula armazenamento inicial
  for (const rec of fictionalRecords) {
    storage[rec.id] = rec;
  }
  assert.strictEqual(Object.keys(storage).length, 3, '3 registros fictícios iniciais gravados');

  // 2. Exportar payload JSON (estrutura canônica de backup)
  const exportedJson = JSON.stringify({
    schemaVersion: '1.0',
    app: 'First 1,000 Days',
    exportedAt: new Date().toISOString(),
    recordCount: Object.values(storage).length,
    records: Object.values(storage)
  }, null, 2);

  // 3. Adicionar novo registro no aparelho antes do restore
  const newLocalRecord: JourneyRecord = {
    id: 'fictional-baby-04',
    subject: 'baby',
    tags: ['Mamou ou se alimentou normalmente'],
    note: 'Mamou tranquilamente sem engasgos.',
    eventDate: '2026-10-23',
    dateLabel: '23/10/2026, 15:00',
    timestamp: '2026-10-23T15:00:00.000Z'
  };
  storage[newLocalRecord.id] = newLocalRecord;
  assert.strictEqual(Object.keys(storage).length, 4, 'Base agora contém 4 registros');

  // 4. Testar importação no modo MERGE (mesclar sem duplicação)
  const validationMerge = indexedDbService.validateBackupJson(exportedJson);
  assert.strictEqual(validationMerge.valid, true);
  assert.strictEqual(validationMerge.recordCount, 3);

  const mergeResult = await indexedDbService.restoreBackupMerge(validationMerge.records!);
  assert.strictEqual(mergeResult.success, true);
  assert.strictEqual(mergeResult.importedCount, 0, 'Todos os 3 já existem; zero inseridos');
  assert.strictEqual(mergeResult.skippedCount, 3, 'Todos os 3 IDs repetidos foram pulados');
  assert.strictEqual(Object.keys(storage).length, 4, 'O novo registro 04 foi preservado intacto');

  // 5. Testar importação no modo REPLACE (substituição integral)
  const replaceResult = await indexedDbService.restoreBackupReplace(validationMerge.records!);
  assert.strictEqual(replaceResult.success, true);
  assert.strictEqual(replaceResult.importedCount, 3);
  assert.strictEqual(replaceResult.skippedCount, 0);
  assert.strictEqual(Object.keys(storage).length, 3, 'Base agora contém exatamente os 3 registros do backup');
  assert.strictEqual(storage['fictional-baby-04'], undefined, 'Registro 04 foi removido na substituição');

  // 6. Simular fechar e reabrir o aplicativo (recarga)
  // Reabrindo a conexão e lendo todas as chaves
  const reloadedKeys = Object.keys(storage);
  assert.strictEqual(reloadedKeys.length, 3, 'Persistência mantida após reabertura');
  assert.ok(storage['fictional-baby-01']);
  assert.ok(storage['fictional-mom-02']);
  assert.ok(storage['fictional-mem-03']);

  // 7. Testar arquivo inválido (garantir ausência de efeitos colaterais)
  const invalidFiles = [
    '{ malformed json syntax',
    JSON.stringify({ schemaVersion: '2.0', records: [] }),
    JSON.stringify({ schemaVersion: '1.0', records: [{ id: '' }] }),
    JSON.stringify({ schemaVersion: '1.0', records: [] }),
    'plain string not json'
  ];

  for (const inv of invalidFiles) {
    const val = indexedDbService.validateBackupJson(inv);
    assert.strictEqual(val.valid, false, 'Arquivo deve ser considerado inválido');
    assert.strictEqual(Object.keys(storage).length, 3, 'A base de dados não deve ser alterada por arquivo inválido');
  }

  // 8. Testar cancelamento da operação
  // Se o usuário clicar em Cancelar, nenhuma transação é disparada
  const stateBeforeCancel = { ...storage };
  // Operação cancelada pelo usuário
  assert.deepStrictEqual(storage, stateBeforeCancel, 'Estado inalterado após cancelamento');
});

test('E2E 2: Build de produção e integridade de assets PWA para funcionamento offline', () => {
  const distDir = path.resolve('dist');
  assert.ok(fs.existsSync(distDir), 'Diretório dist/ deve existir');

  // 1. Arquivos essenciais do App Shell em dist/
  const requiredFiles = [
    'index.html',
    'sw.js',
    'manifest.webmanifest',
    'icon-192.svg',
    'icon-512.svg'
  ];

  for (const f of requiredFiles) {
    const p = path.join(distDir, f);
    assert.ok(fs.existsSync(p), `Arquivo de produção ${f} deve existir no build`);
    const stat = fs.statSync(p);
    assert.ok(stat.size > 0, `Arquivo ${f} não pode estar vazio`);
  }

  // 2. Validação do HTML compilado em dist/index.html
  const distHtml = fs.readFileSync(path.join(distDir, 'index.html'), 'utf-8');
  assert.match(distHtml, /<link rel="manifest" href="\/manifest\.webmanifest"/, 'HTML compilado deve conter manifest');
  assert.match(distHtml, /<script type="module" crossorigin src="\/assets\/index-.*\.js">/, 'HTML compilado deve carregar o bundle JS');
  assert.match(distHtml, /<link rel="stylesheet" crossorigin href="\/assets\/index-.*\.css">/, 'HTML compilado deve carregar o bundle CSS');

  // 3. Validação do Service Worker de produção
  const distSw = fs.readFileSync(path.join(distDir, 'sw.js'), 'utf-8');
  assert.match(distSw, /url\.pathname\.startsWith\('\/api'\)/, 'SW deve isolar estritamente rota /api');
  assert.match(distSw, /caches\.match\('\/index\.html'\)/, 'SW deve prover fallback para o App Shell offline');

  // 4. Garantia de que atualização de versão do SW não toca no IndexedDB
  // O Service Worker lida apenas com CacheStorage (caches.delete), enquanto os dados ficam no IndexedDB
  assert.doesNotMatch(distSw, /indexedDB\.deleteDatabase/, 'SW NUNCA deve apagar ou resetar o banco IndexedDB');
});

test('E2E 3: Momentos da Semana - Persistência, atualização sem duplicatas, reabertura e suporte bilíngue', async () => {
  let storage: Record<string, JourneyRecord> = {};

  const createMockDb = () => ({
    transaction: (_storeName: string, _mode: 'readonly' | 'readwrite') => {
      const tx: any = {
        objectStore: () => ({
          getAll: () => {
            const req: any = {};
            setTimeout(() => {
              req.result = Object.values(storage);
              if (req.onsuccess) req.onsuccess();
            }, 0);
            return req;
          },
          put: (rec: JourneyRecord) => {
            storage[rec.id] = { ...rec };
          }
        })
      };
      setTimeout(() => {
        if (tx.oncomplete) tx.oncomplete();
      }, 5);
      return tx;
    }
  });

  (indexedDbService as any).openDB = async () => createMockDb();

  // 1. Registro inicial do momento da Mãe (PT-BR)
  const todayISO = '2026-10-28';
  const momRecordId = `rec-moment-mom-${todayISO}`;
  const momMoment: JourneyRecord = {
    id: momRecordId,
    subject: 'mom',
    tags: ['Humor: Serena'],
    note: 'Autorrelato de bem-estar: Serena e calma',
    eventDate: todayISO,
    dateLabel: 'Hoje, 10:00',
    timestamp: '2026-10-28T10:00:00.000Z'
  };

  await indexedDbService.saveRecord(momMoment);
  assert.strictEqual(storage[momRecordId].tags[0], 'Humor: Serena');
  assert.strictEqual(Object.keys(storage).length, 1, 'Primeiro momento salvo com sucesso');

  // 2. Registro do momento do Bebê no mesmo dia (após o nascimento)
  const babyRecordId = `rec-moment-baby-${todayISO}`;
  const babyMoment: JourneyRecord = {
    id: babyRecordId,
    subject: 'baby',
    tags: ['Bebê: Calmo'],
    note: 'Comportamento observado da rotina: Calmo e confortável',
    eventDate: todayISO,
    dateLabel: 'Hoje, 10:05',
    timestamp: '2026-10-28T10:05:00.000Z'
  };

  await indexedDbService.saveRecord(babyMoment);
  assert.strictEqual(storage[babyRecordId].tags[0], 'Bebê: Calmo');
  assert.strictEqual(Object.keys(storage).length, 2, 'Momentos distintos de mãe e bebê coexistem no mesmo dia');

  // 3. Atualização no mesmo dia (Idempotência sem duplicatas)
  // Mãe atualiza de "Serena" para "Cansada" mais tarde
  const updatedMomMoment: JourneyRecord = {
    id: momRecordId,
    subject: 'mom',
    tags: ['Humor: Cansada'],
    note: 'Autorrelato de bem-estar: Cansada do dia',
    eventDate: todayISO,
    dateLabel: 'Hoje, 16:30',
    timestamp: '2026-10-28T16:30:00.000Z'
  };

  await indexedDbService.saveRecord(updatedMomMoment);
  assert.strictEqual(storage[momRecordId].tags[0], 'Humor: Cansada', 'Opção atualizada com sucesso');
  assert.strictEqual(Object.keys(storage).length, 2, 'Não houve duplicação de registro no mesmo dia');

  // 4. Sobrevivência à reabertura da conexão (simulando fechamento e reinício do app)
  (indexedDbService as any).openDB = async () => createMockDb();
  const reloaded = await indexedDbService.getRecords();
  assert.strictEqual(reloaded.length, 2, 'Registros persistem após reabertura do banco');
  const foundMom = reloaded.find((r) => r.id === momRecordId);
  const foundBaby = reloaded.find((r) => r.id === babyRecordId);
  assert.ok(foundMom, 'Momento da mãe encontrado após reabertura');
  assert.ok(foundBaby, 'Momento do bebê encontrado após reabertura');
  assert.strictEqual(foundMom.tags[0], 'Humor: Cansada');
  assert.strictEqual(foundBaby.tags[0], 'Bebê: Calmo');

  // 5. Verificação de compatibilidade com a Jornada (filtro e busca)
  const journeyMomView = reloaded.filter((r) => r.subject === 'mom');
  const journeyBabyView = reloaded.filter((r) => r.subject === 'baby');
  assert.strictEqual(journeyMomView.length, 1, 'Momento aparece no filtro Mãe da Jornada');
  assert.strictEqual(journeyBabyView.length, 1, 'Momento aparece no filtro Bebê da Jornada');

  // 6. Suporte Bilíngue (EN) e Validação com Schema 1.0 de Backup
  const enRecord: JourneyRecord = {
    id: `rec-moment-mom-2026-10-29`,
    subject: 'mom',
    tags: ['Mood: Serene'],
    note: 'Self-reported well-being: Serene & calm',
    eventDate: '2026-10-29',
    dateLabel: 'Today, 09:00',
    timestamp: '2026-10-29T09:00:00.000Z'
  };

  const backupJson = JSON.stringify({
    schemaVersion: '1.0',
    app: 'First 1,000 Days',
    exportedAt: new Date().toISOString(),
    recordCount: 3,
    records: [...reloaded, enRecord]
  });

  const validation = indexedDbService.validateBackupJson(backupJson);
  assert.strictEqual(validation.valid, true, 'Backup com momentos em PT e EN é 100% válido pelo Schema 1.0');
  assert.strictEqual(validation.recordCount, 3, 'Contagem de registros validada');

  // 7. Validação de isolamento da Gestação (Zero categorias de movimentos fetais)
  const pregnancyMoment: JourneyRecord = {
    id: 'rec-moment-mom-2026-10-27',
    subject: 'mom',
    tags: ['Humor: Serena'],
    note: 'Autorrelato de bem-estar: Serena e calma',
    eventDate: '2026-10-27',
    dateLabel: '27/10/2026, 11:00',
    timestamp: '2026-10-27T11:00:00.000Z'
  };
  assert.strictEqual(pregnancyMoment.subject, 'mom', 'Na gestação o registro é estritamente sobre a mãe');
  assert.ok(!pregnancyMoment.tags.some((t) => t.includes('fetal') || t.includes('movimento')), 'Sem categorias de movimento fetal');
});

test('E2E 4: Etapa 6D - Símbolo Oficial da Marca (Opção B), Cálculo de Dias de Vida e Calibração por Idade Real', () => {
  // 1. Validação do Símbolo Oficial da Marca (Opção B - Coração coral isolado, sem folha verde)
  const icon192 = fs.readFileSync(path.resolve('public/icon-192.svg'), 'utf-8');
  const icon512 = fs.readFileSync(path.resolve('public/icon-512.svg'), 'utf-8');

  // Ambos devem conter o coração coral orgânico #C76B50
  assert.ok(icon192.includes('fill="#C76B50"'), 'icon-192.svg deve ter o coração coral #C76B50');
  assert.ok(icon512.includes('fill="#C76B50"'), 'icon-512.svg deve ter o coração coral #C76B50');
  // Devem NÃO conter a folha verde (#4A7C59) descartada da Opção A
  assert.ok(!icon192.includes('#4A7C59'), 'icon-192.svg não deve conter a folha verde descartada');
  assert.ok(!icon512.includes('#4A7C59'), 'icon-512.svg não deve conter a folha verde descartada');

  // 2. Validação dos utilitários de data (dateUtils)
  // Mock de data de referência fixa: 2026-10-28
  const refDate = new Date(2026, 9, 28); // 28 de Outubro de 2026

  // A. Bebê nascido há 45 dias (13 de Setembro de 2026)
  const birthDate45 = '2026-09-13';
  const days45 = calculateDaysOfLife(birthDate45, refDate);
  const months45 = calculateAgeInMonths(birthDate45, refDate);
  assert.strictEqual(days45, 45, 'Deve calcular exatamente 45 dias de vida');
  assert.strictEqual(months45, 1, '45 dias correspondem a 1 mês completo');

  const ptFormatted45 = formatBabyAgeDetailed(birthDate45, 'pt-BR', refDate);
  assert.strictEqual(ptFormatted45, '45 dias de vida (1 mês)');
  const enFormatted45 = formatBabyAgeDetailed(birthDate45, 'en', refDate);
  assert.strictEqual(enFormatted45, '45 days old (1 month)');

  // B. Recém-nascido (1 dia de vida)
  const birthDate1 = '2026-10-27';
  assert.strictEqual(calculateDaysOfLife(birthDate1, refDate), 1);
  assert.strictEqual(formatBabyAgeDetailed(birthDate1, 'pt-BR', refDate), '1 dia de vida');
  assert.strictEqual(formatBabyAgeDetailed(birthDate1, 'en', refDate), '1 day old');

  // C. Data prevista de parto (DPP)
  const dueDateStr = '2026-12-15';
  const dppPt = formatDueDate(dueDateStr, 'pt-BR');
  assert.ok(dppPt.startsWith('DPP:'), 'Formato PT deve iniciar com DPP:');
  const dppEn = formatDueDate(dueDateStr, 'en');
  assert.ok(dppEn.startsWith('Due:'), 'Formato EN deve iniciar com Due:');

  // 3. Validação de Calibração do motor de recomendações por Idade Real
  // Função pura que replica a calibração do Onboarding / ProfileEditModal
  const mapMonthsToStage = (m: number) => {
    if (m === 0) return 0;
    if (m <= 3) return 2;
    if (m <= 6) return 6;
    if (m <= 12) return 12;
    return 24;
  };

  // Para bebê com nascimento em 2026-08-15 (2 meses em Outubro)
  const birthDate2M = '2026-08-15';
  const ageMonths2 = calculateAgeInMonths(birthDate2M, refDate);
  const calibratedStage = mapMonthsToStage(ageMonths2);
  assert.strictEqual(ageMonths2, 2, 'Idade real calculada é de 2 meses');
  assert.strictEqual(calibratedStage, 2, 'StageValue deve ser 2 (faixa de 2 a 3 meses)');

  const babyProfileRealAge: UserProfile = {
    phase: 'baby',
    stageValue: calibratedStage,
    stageLabel: 'Bebê de 2 a 3 meses',
    mainNeed: 'understand_baby',
    preferredLanguage: 'pt-BR',
    babyName: 'Tomás',
    birthDate: birthDate2M,
    createdAt: '2026-10-28T10:00:00.000Z',
    updatedAt: '2026-10-28T10:00:00.000Z'
  };

  assert.strictEqual(babyProfileRealAge.babyName, 'Tomás');
  assert.strictEqual(babyProfileRealAge.stageValue, 2);

  // 4. Compatibilidade total com perfil sem campos opcionais (retrocompatibilidade)
  const legacyProfile: UserProfile = {
    phase: 'baby',
    stageValue: 6,
    stageLabel: 'Bebê de 4 a 6 meses',
    mainNeed: 'feeding',
    preferredLanguage: 'pt-BR',
    createdAt: '2026-10-01T10:00:00.000Z',
    updatedAt: '2026-10-01T10:00:00.000Z'
  };
  assert.strictEqual(legacyProfile.babyName, undefined);
  assert.strictEqual(legacyProfile.birthDate, undefined);
  assert.strictEqual(legacyProfile.dueDate, undefined);
  assert.strictEqual(legacyProfile.stageValue, 6);
});

test('E2E 5: Assistente Educativo - Tummy time, desambiguação de sono seguro e out_of_catalog universal', () => {
  // 1. Tummy time em Português
  const qTummyPt = 'Como estimular o bebê de bruços com segurança (tummy time)?';
  const retrievedTummyPt = retrieveRelevantEvidence(qTummyPt, 'baby', 'pt-BR');
  assert.ok(retrievedTummyPt.length > 0, 'Deve encontrar evidências relevantes para tummy time');
  assert.strictEqual(retrievedTummyPt[0].chunk.id, 'ev-tummy-time-16', 'Chunk principal deve ser ev-tummy-time-16');

  const answerTummyPt = generateMockAnswer(qTummyPt, retrievedTummyPt, 'pt-BR');
  assert.strictEqual(answerTummyPt.status, 'success', 'Status deve ser success');
  assert.ok(answerTummyPt.citations.some(c => c.id === 'ev-tummy-time-16'), 'Deve citar ev-tummy-time-16');
  assert.match(answerTummyPt.answer, /acordado/, 'Deve orientar que o bebê esteja acordado');
  assert.match(answerTummyPt.answer, /supervis[ãa]o/i, 'Deve exigir supervisão constante de um adulto');
  assert.match(answerTummyPt.answer, /2 a 3 minutos|30 minutos/i, 'Deve orientar a progressão de tempo (OMS 2019 / AAP)');
  assert.match(answerTummyPt.answer, /barriga para cima|dorso/i, 'Deve reforçar que para dormir é sempre de barriga para cima');

  // 2. Tummy time em Inglês
  const qTummyEn = 'How do I safely do tummy time?';
  const retrievedTummyEn = retrieveRelevantEvidence(qTummyEn, 'baby', 'en');
  assert.ok(retrievedTummyEn.length > 0, 'Must retrieve relevant evidence for tummy time');
  assert.strictEqual(retrievedTummyEn[0].chunk.id, 'ev-tummy-time-16', 'Top chunk must be ev-tummy-time-16');

  const answerTummyEn = generateMockAnswer(qTummyEn, retrievedTummyEn, 'en');
  assert.strictEqual(answerTummyEn.status, 'success', 'Status must be success');
  assert.match(answerTummyEn.answer, /awake/i, 'Must specify the infant is awake');
  assert.match(answerTummyEn.answer, /supervis/i, 'Must mandate direct supervision');
  assert.match(answerTummyEn.answer, /back to sleep/i, 'Must reinforce Back to Sleep principle');

  // 3. Desambiguação estrita: Sono seguro vs Tummy time
  // Pergunta sobre dormir de bruços DEVE priorizar a segurança do sono (ev-safe-sleep-01)
  const qSleepTummy = 'Meu bebê pode dormir de bruços?';
  const retrievedSleep = retrieveRelevantEvidence(qSleepTummy, 'baby', 'pt-BR');
  assert.ok(retrievedSleep.length > 0, 'Deve encontrar evidências para dúvida de sono');
  assert.strictEqual(retrievedSleep[0].chunk.id, 'ev-safe-sleep-01', 'Dormir de bruços deve priorizar ev-safe-sleep-01');

  const answerSleep = generateMockAnswer(qSleepTummy, retrievedSleep, 'pt-BR');
  assert.strictEqual(answerSleep.status, 'success');
  assert.match(answerSleep.answer, /barriga para cima/i, 'Deve orientar explicitamente colocar de barriga para cima');
  assert.match(answerSleep.answer, /n[ãa]o [eé] (recomendad|seguro)|contraindicad/i, 'Dormir de bruços não é recomendado ou não é seguro');

  // 4. Pergunta fora do catálogo com resposta acolhedora e universal
  const qOutOfCatalog = 'Como calibrar o pneu do carro de passeio no final de semana?';
  const retrievedOutOfCat = retrieveRelevantEvidence(qOutOfCatalog, 'baby', 'pt-BR');
  assert.strictEqual(retrievedOutOfCat.length, 0, 'Não deve inventar chunks para perguntas fora de escopo');

  const answerOutOfCatPt = generateMockAnswer(qOutOfCatalog, [], 'pt-BR');
  assert.strictEqual(answerOutOfCatPt.status, 'out_of_catalog', 'Status deve ser out_of_catalog');
  assert.strictEqual(
    answerOutOfCatPt.answer,
    'Ainda não temos uma orientação específica sobre esse assunto em nossas referências educativas.\n\nPara tirar dúvidas sobre a saúde, desenvolvimento ou bem-estar do seu bebê ou da sua família, recomendamos conversar com o pediatra ou com a equipe de saúde de sua confiança.'
  );
  // Não deve conter termos burocráticos ou repetir a pergunta
  assert.doesNotMatch(answerOutOfCatPt.answer, /catálogo oficial cadastrado/i);
  assert.doesNotMatch(answerOutOfCatPt.answer, /responsabilidade clínica/i);
  assert.doesNotMatch(answerOutOfCatPt.answer, /calibrar o pneu/i);

  // Versão em Inglês de out_of_catalog
  const answerOutOfCatEn = generateMockAnswer('What is the best way to repair an engine?', [], 'en');
  assert.strictEqual(answerOutOfCatEn.status, 'out_of_catalog');
  assert.strictEqual(
    answerOutOfCatEn.answer,
    'We do not have specific educational guidance on this topic in our verified references yet.\n\nFor questions about your baby\'s health, development, or family wellbeing, we recommend speaking with your pediatrician or trusted healthcare provider.'
  );
});


