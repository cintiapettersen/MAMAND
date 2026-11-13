import assert from 'node:assert';
import test from 'node:test';
import { indexedDbService, backupFilename } from '../src/services/indexedDbService.ts';
import { birthRecordStorage } from '../src/services/birthRecordStorage.ts';
import { createManualHealthCheck } from '../src/domain/healthChecks.ts';
import type { JourneyRecord, UserProfile, BirthRecord } from '../src/types/index.ts';
import type { HealthCheckRecord } from '../src/domain/healthChecks.ts';

// Teste de Compatibilidade de Dados, Migração v1 -> v2 e Cenário de Rollback
// Simula o ciclo de vida real do IndexedDB no mesmo origin (mamand.app)

interface SimDbState {
  version: number;
  stores: Record<string, Map<string, any>>;
}

function createSimulatedIndexedDB(initialState: SimDbState) {
  const state: SimDbState = {
    version: initialState.version,
    stores: {}
  };
  for (const [storeName, map] of Object.entries(initialState.stores)) {
    state.stores[storeName] = new Map(map);
  }

  return {
    state,
    open(name: string, requestedVersion?: number) {
      const req: any = { result: null, error: null };

      setTimeout(() => {
        const currentVersion = state.version;
        const targetVersion = requestedVersion ?? (currentVersion || 1);

        // Especificação W3C IndexedDB: Se a versão solicitada for menor que a atual, lança VersionError
        if (targetVersion < currentVersion) {
          const err = new Error(
            `The requested version (${targetVersion}) is less than the existing version (${currentVersion}).`
          );
          (err as any).name = 'VersionError';
          req.error = err;
          if (req.onerror) req.onerror({ target: req });
          return;
        }

        const isUpgradeNeeded = targetVersion > currentVersion;

        // Representação do objeto IDBDatabase
        const dbObj: any = {
          name,
          version: targetVersion,
          objectStoreNames: {
            contains: (sName: string) => sName in state.stores,
            item: (idx: number) => Object.keys(state.stores)[idx],
            get length() {
              return Object.keys(state.stores).length;
            }
          },
          createObjectStore: (sName: string, _opts?: any) => {
            if (!(sName in state.stores)) {
              state.stores[sName] = new Map();
            }
            return {
              createIndex: () => {}
            };
          },
          transaction: (storeNames: string | string[], mode: string = 'readonly') => {
            const list = Array.isArray(storeNames) ? storeNames : [storeNames];
            const tx: any = {
              error: null,
              objectStore: (sName: string) => {
                const storeMap = state.stores[sName];
                if (!storeMap) throw new Error(`ObjectStore "${sName}" não existe.`);
                return {
                  get: (key: string) => {
                    const getReq: any = { result: storeMap.get(key) };
                    setTimeout(() => getReq.onsuccess?.({ target: getReq }), 0);
                    return getReq;
                  },
                  getAll: () => {
                    const allReq: any = { result: Array.from(storeMap.values()) };
                    setTimeout(() => allReq.onsuccess?.({ target: allReq }), 0);
                    return allReq;
                  },
                  put: (val: any) => {
                    storeMap.set(val.id, structuredClone(val));
                    const putReq: any = { result: val.id };
                    setTimeout(() => putReq.onsuccess?.({ target: putReq }), 0);
                    return putReq;
                  },
                  add: (val: any) => {
                    storeMap.set(val.id, structuredClone(val));
                    const addReq: any = { result: val.id };
                    setTimeout(() => addReq.onsuccess?.({ target: addReq }), 0);
                    return addReq;
                  },
                  delete: (key: string) => {
                    storeMap.delete(key);
                    const delReq: any = { result: undefined };
                    setTimeout(() => delReq.onsuccess?.({ target: delReq }), 0);
                    return delReq;
                  },
                  clear: () => {
                    storeMap.clear();
                    const clrReq: any = { result: undefined };
                    setTimeout(() => clrReq.onsuccess?.({ target: clrReq }), 0);
                    return clrReq;
                  }
                };
              }
            };
            setTimeout(() => tx.oncomplete?.(), 2);
            return tx;
          },
          close: () => {}
        };

        if (isUpgradeNeeded) {
          state.version = targetVersion;
          const upgradeEvent: any = {
            target: { result: dbObj },
            oldVersion: currentVersion,
            newVersion: targetVersion
          };
          if (req.onupgradeneeded) {
            req.onupgradeneeded(upgradeEvent);
          }
        }

        req.result = dbObj;
        if (req.onsuccess) {
          req.onsuccess({ target: req });
        }
      }, 0);

      return req;
    }
  };
}

test('Compatibilidade e Migração v1 -> v2: Preservação integral de Jornada, Perfil e Nascimento', async () => {
  // 1. Simula ambiente do origin mamand.app na versão 1
  const mockLocalStorage = new Map<string, string>();
  (globalThis as any).localStorage = {
    getItem: (k: string) => mockLocalStorage.get(k) ?? null,
    setItem: (k: string, v: string) => void mockLocalStorage.set(k, String(v)),
    removeItem: (k: string) => void mockLocalStorage.delete(k),
    clear: () => mockLocalStorage.clear()
  };

  const initialProfile: UserProfile = {
    name: 'Camila Santos',
    phase: 'baby',
    stageValue: 3,
    country: 'BR',
    language: 'pt-BR',
    supportFocus: 'sono'
  };
  mockLocalStorage.set('first_1000_days_user_profile', JSON.stringify(initialProfile));

  const initialBirthRecord: BirthRecord = {
    babyName: 'Helena',
    birthDate: '2026-08-12',
    birthTime: '08:45',
    weightGrams: '3280',
    lengthCm: '49',
    headCircumferenceCm: '34.5',
    hospitalName: 'Maternidade Santa Joana',
    city: 'São Paulo',
    country: 'Brasil',
    deliveryType: 'vaginal'
  };
  mockLocalStorage.set('first1000days_birth_record', JSON.stringify(initialBirthRecord));

  // Banco IndexedDB inicial v1 com registros reais da família
  const v1UserRecords: JourneyRecord[] = [
    {
      id: 'rec-fam-001',
      subject: 'baby',
      tags: ['Dormiu bem', 'Mamou no peito'],
      note: 'Dormiu 3 horas seguidas à tarde. Muito calma.',
      eventDate: '2026-10-01',
      timestamp: '2026-10-01T14:30:00.000Z',
      dateLabel: '01/10/2026'
    },
    {
      id: 'rec-fam-002',
      subject: 'mom',
      tags: ['Consegui descansar', 'Apoio da rede'],
      note: 'Minha mãe preparou o almoço e consegui tomar um banho demorado.',
      eventDate: '2026-10-02',
      timestamp: '2026-10-02T13:00:00.000Z',
      dateLabel: '02/10/2026'
    },
    {
      id: 'rec-demo-2',
      subject: 'mom',
      tags: ['Consegui um tempo só para mim'],
      note: 'Exemplo original editado pela mãe com suas próprias palavras.',
      eventDate: '2026-10-03',
      timestamp: '2026-10-03T16:00:00.000Z',
      dateLabel: '03/10/2026'
    }
  ];

  const simEngine = createSimulatedIndexedDB({
    version: 1,
    stores: {
      journey_records: new Map(v1UserRecords.map((r) => [r.id, r]))
    }
  });

  (globalThis as any).window = {
    indexedDB: simEngine
  };

  // Reseta estado interno do singleton
  (indexedDbService as any).db = null;
  (indexedDbService as any).isSupported = true;

  // 2. Executa a inicialização do app consolidado v2
  const dbV2 = await indexedDbService.openDB();

  // Verifica que o banco subiu para a versão 2
  assert.strictEqual(dbV2.version, 2, 'Banco deve ser migrado para versão 2');
  assert.strictEqual(simEngine.state.version, 2, 'Estado simulado deve refletir versão 2');

  // Verifica que a nova store de health_checks foi criada
  assert.ok(dbV2.objectStoreNames.contains('health_checks'), 'Store health_checks deve ter sido criada na v2');
  assert.ok(dbV2.objectStoreNames.contains('journey_records'), 'Store journey_records deve ter sido preservada');

  // 3. Confirma a preservação integral dos registros da Jornada
  const recordsAfterUpgrade = await indexedDbService.getRecords();
  assert.strictEqual(recordsAfterUpgrade.length, 3, 'Todos os 3 registros devem continuar existindo');

  const rec1 = recordsAfterUpgrade.find((r) => r.id === 'rec-fam-001');
  assert.ok(rec1, 'Registro da família deve existir');
  assert.strictEqual(rec1!.note, 'Dormiu 3 horas seguidas à tarde. Muito calma.');
  assert.deepStrictEqual(rec1!.tags, ['Dormiu bem', 'Mamou no peito']);

  // Confirma que o exemplo que foi editado NÃO foi excluído pela limpeza de exemplos intactos
  const recEditedDemo = recordsAfterUpgrade.find((r) => r.id === 'rec-demo-2');
  assert.ok(recEditedDemo, 'Exemplo editado pela família deve ser rigorosamente preservado');
  assert.strictEqual(recEditedDemo!.note, 'Exemplo original editado pela mãe com suas próprias palavras.');

  // 4. Confirma que o perfil e a ficha de nascimento no localStorage permaneceram intactos
  const profileJson = mockLocalStorage.get('first_1000_days_user_profile');
  assert.ok(profileJson);
  assert.strictEqual(JSON.parse(profileJson!).name, 'Camila Santos');

  assert.strictEqual(birthRecordStorage.hasSavedRecord(), true);
  const birthRec = birthRecordStorage.getBirthRecord();
  assert.strictEqual(birthRec?.babyName, 'Helena');
  assert.strictEqual(birthRec?.hospitalName, 'Maternidade Santa Joana');

  // 5. Grava um novo exame na nova store v2
  const newHealthCheck = createManualHealthCheck(
    {
      subject: 'baby',
      phase: 'newborn',
      kind: 'newborn_screening',
      name: 'Teste do Pezinho',
      careCountry: 'BR'
    },
    new Date('2026-08-17T10:00:00.000Z')
  );
  await indexedDbService.saveHealthCheck(newHealthCheck);

  const healthChecksList = await indexedDbService.getHealthChecks();
  assert.strictEqual(healthChecksList.length, 1);
  assert.strictEqual(healthChecksList[0].name, 'Teste do Pezinho');
});

test('Comportamento de Rollback: Tentativa de reabrir banco v2 por código anterior em v1', async () => {
  // Cenário: O navegador já migrou para v2 e possui dados na store v2
  const simEngine = createSimulatedIndexedDB({
    version: 2,
    stores: {
      journey_records: new Map([
        ['rec-fam-1', { id: 'rec-fam-1', subject: 'baby', note: 'Registro gravado na v2' }]
      ]),
      health_checks: new Map([
        ['hc-1', { id: 'hc-1', name: 'Triagem Neonatal Auditiva', schemaVersion: '1.1' }]
      ])
    }
  });

  (globalThis as any).window = {
    indexedDB: simEngine
  };

  // Simula o comportamento do build antigo (versão 1) que executa:
  // window.indexedDB.open('first_1000_days_db', 1)
  const openV1Request = simEngine.open('first_1000_days_db', 1);

  await new Promise<void>((resolve, reject) => {
    openV1Request.onsuccess = () => {
      reject(new Error('Rollback para versão menor NÃO deve ter sucesso no IndexedDB'));
    };
    openV1Request.onerror = (evt: any) => {
      const err = evt.target.error;
      // Confirma que a especificação dispara VersionError
      assert.strictEqual(err.name, 'VersionError');
      assert.match(err.message, /The requested version \(1\) is less than the existing version \(2\)/);
      resolve();
    };
  });

  // VERIFICAÇÃO CRÍTICA DE INTEGRIDADE:
  // A tentativa frustrada de abertura com versão inferior NÃO corrompe nem apaga nenhuma store ou registro
  assert.strictEqual(simEngine.state.version, 2, 'Versão do banco deve permanecer inalterada em 2');
  assert.strictEqual(simEngine.state.stores.journey_records.size, 1, 'Registros da Jornada continuam intactos');
  assert.strictEqual(simEngine.state.stores.health_checks.size, 1, 'Exames e triagens continuam intactos');
});

test('Estratégia de Recuperação: Restauração para v2 restaura acesso imediato aos dados', async () => {
  // Após a falha de abertura pelo build v1 desatualizado, o operador restabelece o deploy v2 (roll-forward)
  const simEngine = createSimulatedIndexedDB({
    version: 2,
    stores: {
      journey_records: new Map([
        ['rec-fam-1', { id: 'rec-fam-1', subject: 'baby', note: 'Registro salvo com sucesso', tags: ['Sono'], eventDate: '2026-10-10', timestamp: '2026-10-10T12:00:00.000Z' }]
      ]),
      health_checks: new Map([
        ['hc-1', { id: 'hc-1', name: 'Triagem Visual', createdAt: '2026-10-10T10:00:00.000Z' }]
      ])
    }
  });

  (globalThis as any).window = {
    indexedDB: simEngine
  };
  (indexedDbService as any).db = null;

  // Abertura com o serviço v2 restabelecido
  const db = await indexedDbService.openDB();
  assert.strictEqual(db.version, 2);

  const records = await indexedDbService.getRecords();
  assert.strictEqual(records.length, 1);
  assert.strictEqual(records[0].note, 'Registro salvo com sucesso');

  const hcs = await indexedDbService.getHealthChecks();
  assert.strictEqual(hcs.length, 1);
  assert.strictEqual(hcs[0].name, 'Triagem Visual');
});

test('Estratégia de Recuperação: Restauração de backup JSON v1.1 e v1.0 restaura dados mesmo após reset', async () => {
  // Simula backup JSON schemaVersion 1.1 gerado no app v2
  const backupJsonV11 = JSON.stringify({
    schemaVersion: '1.1',
    app: 'First 1,000 Days',
    exportedAt: '2026-10-31T18:00:00.000Z',
    records: [
      {
        id: 'rec-restored-1',
        subject: 'baby',
        tags: ['Dormiu bem'],
        note: 'Soneca longa e tranquila',
        eventDate: '2026-10-28',
        timestamp: '2026-10-28T14:00:00.000Z',
        dateLabel: '28/10/2026'
      }
    ],
    birthRecord: {
      babyName: 'Helena Santos',
      birthDate: '2026-08-12',
      weightGrams: '3280',
      lengthCm: '49',
      hospitalName: 'Maternidade Santa Joana'
    },
    healthChecks: [
      createManualHealthCheck(
        { subject: 'baby', phase: 'newborn', kind: 'newborn_screening', name: 'Triagem Auditiva' },
        new Date('2026-08-15T10:00:00.000Z')
      )
    ]
  });

  // Validação da estrutura
  const validation = indexedDbService.validateBackupJson(backupJsonV11);
  assert.strictEqual(validation.valid, true);
  assert.strictEqual(validation.recordCount, 1);

  // Inicializa banco vazio na v2
  const simEngine = createSimulatedIndexedDB({
    version: 2,
    stores: {
      journey_records: new Map(),
      health_checks: new Map()
    }
  });

  (globalThis as any).window = {
    indexedDB: simEngine
  };
  (indexedDbService as any).db = null;

  // Executa restauração com modo replace
  if (validation.birthRecord) {
    birthRecordStorage.saveBirthRecord(validation.birthRecord);
  }
  const restoreRes = await indexedDbService.restoreBackupReplace(validation.records!, validation.healthChecks);
  assert.strictEqual(restoreRes.success, true);
  assert.strictEqual(restoreRes.importedCount, 1);

  // Confirma recuperação dos dados no IndexedDB
  const records = await indexedDbService.getRecords();
  assert.strictEqual(records.length, 1);
  assert.strictEqual(records[0].id, 'rec-restored-1');

  const hcs = await indexedDbService.getHealthChecks();
  assert.strictEqual(hcs.length, 1);
  assert.strictEqual(hcs[0].name, 'Triagem Auditiva');

  // Confirma restauração da ficha de nascimento
  assert.strictEqual(birthRecordStorage.getBirthRecord().babyName, 'Helena Santos');
});

