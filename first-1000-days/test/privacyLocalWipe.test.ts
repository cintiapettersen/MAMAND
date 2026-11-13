import assert from 'node:assert';
import test from 'node:test';
import fs from 'node:fs';
import path from 'node:path';
import {
  MAMAND_LOCAL_STORAGE_KEYS,
  wipeAllMamandLocalData
} from '../src/services/localDataWipeService.ts';
import { indexedDbService } from '../src/services/indexedDbService.ts';
import { journeyStorage } from '../src/services/journeyStorage.ts';

function createMockStorage(initial: Record<string, string> = {}) {
  const store = new Map<string, string>(Object.entries(initial));
  return {
    getItem(key: string) {
      return store.has(key) ? store.get(key)! : null;
    },
    setItem(key: string, value: string) {
      store.set(key, String(value));
    },
    removeItem(key: string) {
      store.delete(key);
    },
    snapshot() {
      return Object.fromEntries(store.entries());
    }
  };
}

test('1. Exclusão completa remove todas as chaves do MAMAND e preserva chaves de outras aplicações', async () => {
  const initialData: Record<string, string> = {
    other_app_session: 'keep-me-intact',
    unrelated_user_pref: '{"dark":true}'
  };

  for (const key of MAMAND_LOCAL_STORAGE_KEYS) {
    initialData[key] = `sample-value-for-${key}`;
  }

  const mockStorage = createMockStorage(initialData);
  let idbCleared = false;

  const result = await wipeAllMamandLocalData(mockStorage, async () => {
    idbCleared = true;
  });

  assert.strictEqual(idbCleared, true, 'IndexedDB deve ser limpo');
  assert.strictEqual(result.indexedDbCleared, true, 'Resultado deve confirmar limpeza do IndexedDB');
  assert.deepStrictEqual(result.errors, [], 'Não deve haver erros na limpeza');
  assert.strictEqual(
    result.removedKeys.length,
    MAMAND_LOCAL_STORAGE_KEYS.length,
    'Todas as chaves do MAMAND devem ser removidas'
  );

  const remaining = mockStorage.snapshot();
  for (const key of MAMAND_LOCAL_STORAGE_KEYS) {
    assert.strictEqual(key in remaining, false, `Chave ${key} deve ter sido apagada`);
  }

  assert.strictEqual(remaining.other_app_session, 'keep-me-intact', 'Chave externa deve ser preservada');
  assert.strictEqual(remaining.unrelated_user_pref, '{"dark":true}', 'Preferência externa deve ser preservada');
});

test('2. Após exclusão e recarregamento, IndexedDB e journeyStorage não recriam registros demonstrativos', async () => {
  // Simula um banco IndexedDB existente (versão 1 já criada anteriormente, logo onupgradeneeded NÃO dispara na reabertura)
  let recordsStore: Record<string, any> = {
    'rec-1': { id: 'rec-1', subject: 'baby', tags: ['Dormiu bem'], eventDate: '2026-11-10', dateLabel: '10/11', timestamp: '2026-11-10T10:00:00.000Z' }
  };
  let seedCalled = false;

  // Simula window.indexedDB com fluxo real de abertura sem onupgradeneeded (recarregamento após wipe)
  const originalWindow = (globalThis as any).window;
  const originalLocalStorage = (globalThis as any).localStorage;

  try {
    const mockStorage = createMockStorage({
      p1000_journey_records_v1: JSON.stringify([{ id: 'legacy-1' }])
    });
    (globalThis as any).localStorage = mockStorage;

    const fakeDb: any = {
      objectStoreNames: { contains: () => true },
      transaction: (_storeName: string, _mode: string) => {
        const tx: any = {
          objectStore: () => ({
            count: () => {
              const req: any = {};
              setTimeout(() => {
                req.result = Object.keys(recordsStore).length;
                if (req.onsuccess) req.onsuccess();
              }, 0);
              return req;
            },
            getAll: () => {
              const req: any = {};
              setTimeout(() => {
                req.result = Object.values(recordsStore);
                if (req.onsuccess) req.onsuccess();
              }, 0);
              return req;
            },
            add: () => {
              seedCalled = true;
            },
            clear: () => {
              const req: any = {};
              setTimeout(() => {
                recordsStore = {};
                if (req.onsuccess) req.onsuccess();
              }, 0);
              return req;
            }
          })
        };
        setTimeout(() => {
          if (tx.oncomplete) tx.oncomplete();
        }, 5);
        return tx;
      }
    };

    (globalThis as any).window = {
      indexedDB: {
        open: () => {
          const req: any = {};
          setTimeout(() => {
            // Simula abertura de banco já existente (sem onupgradeneeded)
            if (req.onsuccess) req.onsuccess({ target: { result: fakeDb } });
          }, 0);
          return req;
        }
      }
    };

    // Reseta conexão em memória para forçar reabertura simulada
    (indexedDbService as any).db = null;
    (indexedDbService as any).isSupported = true;

    await wipeAllMamandLocalData(mockStorage, () => indexedDbService.clearAllRecords());
    assert.strictEqual(Object.keys(recordsStore).length, 0, 'Store deve estar vazio após wipe');

    // Simula recarregamento da aplicação (nova abertura do banco)
    (indexedDbService as any).db = null;
    const loadedAfterReload = await indexedDbService.getRecords();

    assert.strictEqual(seedCalled, false, 'Não deve recriar registros demonstrativos após exclusão');
    assert.deepStrictEqual(loadedAfterReload, [], 'Nenhum registro pessoal ou demo deve existir após recarregar');
    assert.deepStrictEqual(journeyStorage.getRecords(), [], 'journeyStorage legado também deve retornar lista vazia');
  } finally {
    (globalThis as any).window = originalWindow;
    (globalThis as any).localStorage = originalLocalStorage;
    (indexedDbService as any).db = null;
  }
});

test('3. Interface e confirmação explícita de exclusão irreversível + aviso sobre backups', () => {
  const modalContent = fs.readFileSync(path.resolve('src/components/ProfileEditModal.tsx'), 'utf-8');
  const appContent = fs.readFileSync(path.resolve('src/App.tsx'), 'utf-8');

  assert.match(modalContent, /Apagar todos os meus dados deste aparelho/, 'Botão de exclusão completa deve existir na UI');
  assert.match(modalContent, /Confirmar exclusão irreversível/, 'Deve exigir confirmação explícita antes da exclusão');
  assert.match(modalContent, /backups JSON ou resumos TXT.*NÃO serão apagados/, 'Deve explicar que backups já baixados não são apagados');
  assert.match(modalContent, /arquivos estáticos.*preservados/, 'Deve informar preservação de arquivos estáticos offline');

  assert.match(appContent, /wipeAllMamandLocalData/, 'App deve acionar o serviço completo de limpeza');
  assert.match(appContent, /setProfile\(null\)/, 'App deve reiniciar o estado do perfil em memória');
  assert.match(appContent, /setRecords\(\[\]\)/, 'App deve reiniciar os registros em memória');
  assert.match(appContent, /<Onboarding key=\{resetCounter\}/, 'App deve remontar Onboarding limpo após exclusão');
});

test('4. Build de produção não contém chamadas ao Google Fonts e inclui fontes locais', () => {
  const distHtmlPath = path.resolve('dist/index.html');
  assert.ok(fs.existsSync(distHtmlPath), 'dist/index.html deve existir após build');

  const distHtml = fs.readFileSync(distHtmlPath, 'utf-8');
  assert.ok(
    !distHtml.includes('fonts.googleapis.com') && !distHtml.includes('fonts.gstatic.com'),
    'Build de produção não deve conter referências ao Google Fonts'
  );

  assert.ok(fs.existsSync(path.resolve('dist/fonts/fraunces-latin.woff2')), 'dist/fonts/fraunces-latin.woff2 deve existir');
  assert.ok(fs.existsSync(path.resolve('dist/fonts/nunito-latin.woff2')), 'dist/fonts/nunito-latin.woff2 deve existir');
  assert.ok(fs.existsSync(path.resolve('dist/fonts/plus-jakarta-sans-latin.woff2')), 'dist/fonts/plus-jakarta-sans-latin.woff2 deve existir');
});
