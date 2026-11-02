import assert from 'node:assert';
import test from 'node:test';
import fs from 'node:fs';
import { indexedDbService } from '../src/services/indexedDbService.ts';
import { careCountryPrompt } from '../src/services/careCountryPrompt.ts';
import { createManualHealthCheck, type HealthCheckRecord } from '../src/domain/healthChecks.ts';
import { ptBR } from '../src/locales/pt-BR.ts';
import { en } from '../src/locales/en.ts';
import { HEALTH_CHECK_CATALOGS } from '../src/data/healthCheckCatalogs.ts';
import type { JourneyRecord } from '../src/types/index.ts';

// Etapa 2 de "Exames e triagens": armazenamento local, backup 1.1 e compatibilidade com 1.0.
// Dados fictícios. IndexedDB simulado com várias stores e transação "tudo ou nada".

const NOW = new Date('2026-10-30T12:00:00.000Z');

// localStorage em memória (usado pelo cartão de nascimento no backup e pelo convite)
const memoryStorage = new Map<string, string>();
(globalThis as any).localStorage = {
  getItem: (k: string) => memoryStorage.get(k) ?? null,
  setItem: (k: string, v: string) => void memoryStorage.set(k, String(v)),
  removeItem: (k: string) => void memoryStorage.delete(k),
  clear: () => memoryStorage.clear()
};

type Row = { id: string };

function createMockDb(initial: { journey_records?: Row[]; health_checks?: Row[] }, opts: { failAddId?: string } = {}) {
  const stores: Record<string, Map<string, Row>> = {
    journey_records: new Map((initial.journey_records ?? []).map((r) => [r.id, structuredClone(r)])),
    health_checks: new Map((initial.health_checks ?? []).map((r) => [r.id, structuredClone(r)]))
  };
  const db = {
    stores,
    transaction(names: string | string[]) {
      const list = Array.isArray(names) ? names : [names];
      const staged: Record<string, Map<string, Row>> = {};
      for (const n of list) staged[n] = new Map([...stores[n]].map(([k, v]) => [k, structuredClone(v)]));
      let pending = 0;
      let aborted = false;
      let done = false;
      const tx: any = { error: null };
      const maybeComplete = () => {
        if (pending !== 0 || aborted || done) return;
        setTimeout(() => {
          if (pending !== 0 || aborted || done) return;
          done = true;
          for (const n of list) stores[n] = staged[n];
          tx.oncomplete?.();
        }, 0);
      };
      const request = (fn: () => unknown) => {
        const req: any = {};
        pending += 1;
        setTimeout(() => {
          if (aborted) return;
          try {
            req.result = fn();
            req.onsuccess?.({ target: req });
          } catch (err) {
            req.error = err;
            req.onerror?.();
            tx.abort();
          }
          pending -= 1;
          maybeComplete();
        }, 0);
        return req;
      };
      tx.objectStore = (name: string) => {
        if (!list.includes(name)) throw new Error(`store ${name} fora da transação`);
        const m = staged[name];
        return {
          getAll: () => request(() => [...m.values()].map((v) => structuredClone(v))),
          getAllKeys: () => request(() => [...m.keys()]),
          count: () => request(() => m.size),
          add: (v: Row) =>
            request(() => {
              if (v.id === opts.failAddId) throw new Error('Falha simulada');
              if (m.has(v.id)) throw new Error('ConstraintError');
              m.set(v.id, structuredClone(v));
              return v.id;
            }),
          put: (v: Row) => request(() => void m.set(v.id, structuredClone(v))),
          delete: (k: string) => request(() => void m.delete(k)),
          clear: () => request(() => void m.clear())
        };
      };
      tx.abort = () => {
        if (aborted || done) return;
        aborted = true;
        setTimeout(() => tx.onabort?.(), 0);
      };
      setTimeout(maybeComplete, 0);
      return tx;
    }
  };
  return db;
}

const useDb = (db: ReturnType<typeof createMockDb>) => {
  (indexedDbService as any).db = null;
  (indexedDbService as any).openDB = async () => db;
};

const journey = (id: string, subject: JourneyRecord['subject'] = 'baby'): JourneyRecord => ({
  id,
  subject,
  tags: ['Dormiu bem'],
  note: '',
  eventDate: '2026-10-20',
  dateLabel: '20/10/2026',
  timestamp: '2026-10-20T10:00:00.000Z'
});

const exam = (name: string, subject: 'pregnant_person' | 'baby' = 'pregnant_person'): HealthCheckRecord =>
  createManualHealthCheck(
    subject === 'baby'
      ? { subject, phase: 'newborn', kind: 'newborn_screening', name, milestones: { performed: { on: '2026-10-20' } } }
      : { subject, phase: 'pregnancy', kind: 'prenatal_test', name, gestationalWeek: 12, milestones: { resultReceived: {} } },
    NOW
  );

function captureExport(records: JourneyRecord[], healthChecks: HealthCheckRecord[]): any {
  let href = '';
  (globalThis as any).document = {
    createElement: () => ({ setAttribute: (k: string, v: string) => { if (k === 'href') href = v; }, click() {}, remove() {} }),
    body: { appendChild() {} }
  };
  indexedDbService.exportAsJson(records, healthChecks);
  return JSON.parse(decodeURIComponent(href.replace('data:text/json;charset=utf-8,', '')));
}

test('Exportação 1.1 inclui exames e triagens, e a importação recupera exatamente os mesmos', () => {
  const exams = [exam('Exame fictício da gestação'), exam('Triagem fictícia', 'baby')];
  const file = captureExport([journey('j1')], exams);
  assert.strictEqual(file.schemaVersion, '1.1');
  assert.strictEqual(file.healthChecks.length, 2);
  const v = indexedDbService.validateBackupJson(JSON.stringify(file));
  assert.ok(v.valid);
  assert.deepStrictEqual(v.healthChecks, exams);
  assert.strictEqual(v.recordCount, 1);
});

test('Backup: arquivos novos se chamam mamand_backup_…json; conteúdo e importação não mudam', async () => {
  const { backupFilename } = await import('../src/services/indexedDbService.ts');
  assert.strictEqual(backupFilename('2026-11-02'), 'mamand_backup_2026-11-02.json');
  let name = '';
  let href = '';
  (globalThis as any).document = {
    createElement: () => ({ setAttribute: (k: string, v: string) => { if (k === 'download') name = v; if (k === 'href') href = v; }, click() {}, remove() {} }),
    body: { appendChild() {} }
  };
  const exams = [exam('Exame fictício')];
  indexedDbService.exportAsJson([journey('j1')], exams);
  assert.match(name, /^mamand_backup_\d{4}-\d{2}-\d{2}\.json$/);
  const file = JSON.parse(decodeURIComponent(href.replace('data:text/json;charset=utf-8,', '')));
  assert.strictEqual(file.schemaVersion, '1.1');
  // Mesma estrutura de antes: só o nome do arquivo mudou
  assert.ok(Array.isArray(file.records) && Array.isArray(file.healthChecks) && typeof file.exportedAt === 'string');
  assert.ok(indexedDbService.validateBackupJson(JSON.stringify(file)).valid);
  // Backups antigos (com o nome antigo ou qualquer outro) continuam importáveis: a validação lê só o conteúdo
  const old10 = { schemaVersion: '1.0', exportDate: '2026-10-20T10:00:00.000Z', records: [journey('a'), journey('b', 'mom')] };
  const old11 = { schemaVersion: '1.1', exportDate: '2026-10-30T10:00:00.000Z', records: [journey('c')], healthChecks: [exam('Exame antigo', 'baby')] };
  const v10 = indexedDbService.validateBackupJson(JSON.stringify(old10));
  const v11 = indexedDbService.validateBackupJson(JSON.stringify(old11));
  assert.ok(v10.valid && v10.recordCount === 2 && v10.healthChecks === undefined);
  assert.ok(v11.valid && v11.recordCount === 1 && v11.healthChecks?.length === 1);
  const db = createMockDb({});
  useDb(db);
  await indexedDbService.restoreBackupMerge(v10.records!, v10.healthChecks);
  await indexedDbService.restoreBackupMerge(v11.records!, v11.healthChecks);
  assert.deepStrictEqual([...db.stores.journey_records.keys()].sort(), ['a', 'b', 'c']);
  assert.strictEqual(db.stores.health_checks.size, 1);
});

test('Validação: 1.0 continua aceito; 1.1 sem registros da Jornada mas com exames também', () => {
  const v10 = indexedDbService.validateBackupJson(JSON.stringify({ schemaVersion: '1.0', records: [journey('a')] }));
  assert.ok(v10.valid);
  assert.strictEqual(v10.healthChecks, undefined, '1.0 não traz a seção');
  const onlyExams = indexedDbService.validateBackupJson(JSON.stringify({ schemaVersion: '1.1', records: [], healthChecks: [exam('X')] }));
  assert.ok(onlyExams.valid);
  assert.strictEqual(onlyExams.healthChecks?.length, 1);
  const emptySection = indexedDbService.validateBackupJson(JSON.stringify({ schemaVersion: '1.1', records: [journey('a')], healthChecks: [] }));
  assert.deepStrictEqual(emptySection.healthChecks, []);
});

test('Validação: exame inválido, repetido ou com interpretação recusa o arquivo inteiro', () => {
  const e = exam('Exame fictício');
  const cases = [
    { schemaVersion: '1.1', records: [journey('a')], healthChecks: [{ ...e, isNormal: true }] },
    { schemaVersion: '1.1', records: [journey('a')], healthChecks: [e, e] },
    { schemaVersion: '1.1', records: [journey('a')], healthChecks: [{ ...e, subject: 'mom' }] },
    { schemaVersion: '1.1', records: [journey('a')], healthChecks: 'lista' },
    { schemaVersion: '1.1', records: [], healthChecks: [] },
    { schemaVersion: '2.0', records: [journey('a')] }
  ];
  for (const c of cases) {
    const v = indexedDbService.validateBackupJson(JSON.stringify(c));
    assert.strictEqual(v.valid, false, JSON.stringify(c).slice(0, 80));
    assert.strictEqual(v.records, undefined);
  }
});

test('Mesclar (1.1): acrescenta o que falta, mantém o que já existe, nas duas stores', async () => {
  const kept = exam('Já no aparelho');
  const db = createMockDb({ journey_records: [journey('j1')], health_checks: [kept] });
  useDb(db);
  const incoming = exam('Novo');
  const r = await indexedDbService.restoreBackupMerge([journey('j1'), journey('j2', 'mom')], [kept, incoming]);
  assert.deepStrictEqual([r.importedCount, r.skippedCount], [1, 1]);
  assert.deepStrictEqual(r.healthChecks, { importedCount: 1, skippedCount: 1 });
  assert.deepStrictEqual([...db.stores.journey_records.keys()].sort(), ['j1', 'j2']);
  assert.deepStrictEqual([...db.stores.health_checks.keys()].sort(), [kept.id, incoming.id].sort());
});

test('Importar o mesmo backup duas vezes não duplica registros; um 1.0 antigo depois de um 1.1 também não', async () => {
  const exams = [exam('Exame fictício A'), exam('Triagem fictícia B', 'baby')];
  const file = captureExport([journey('j1'), journey('j2', 'mom')], exams);
  const db = createMockDb({});
  useDb(db);
  const v = indexedDbService.validateBackupJson(JSON.stringify(file));
  assert.ok(v.valid);
  await indexedDbService.restoreBackupMerge(v.records!, v.healthChecks);
  const again = await indexedDbService.restoreBackupMerge(v.records!, v.healthChecks);
  assert.deepStrictEqual([again.importedCount, again.skippedCount], [0, 2]);
  assert.deepStrictEqual(again.healthChecks, { importedCount: 0, skippedCount: 2 });
  const old = indexedDbService.validateBackupJson(JSON.stringify({ schemaVersion: '1.0', records: [journey('j1')] }));
  const r10 = await indexedDbService.restoreBackupMerge(old.records!, old.healthChecks);
  assert.deepStrictEqual([r10.importedCount, r10.skippedCount], [0, 1]);
  assert.strictEqual(db.stores.journey_records.size, 2);
  assert.strictEqual(db.stores.health_checks.size, 2);
});

test('Excluir um registro da Jornada: só ele sai; os outros registros e os exames ficam', async () => {
  const exams = [exam('Exame fictício A'), exam('Triagem fictícia B', 'baby')];
  const db = createMockDb({ journey_records: [journey('j1'), journey('j2', 'mom'), journey('j3', 'memory')], health_checks: exams });
  useDb(db);
  const remaining = await indexedDbService.deleteRecord('j2');
  assert.deepStrictEqual(remaining.map((r) => r.id).sort(), ['j1', 'j3']);
  assert.deepStrictEqual([...db.stores.journey_records.keys()].sort(), ['j1', 'j3']);
  assert.deepStrictEqual([...db.stores.health_checks.keys()].sort(), exams.map((e) => e.id).sort());
  assert.deepStrictEqual(db.stores.health_checks.get(exams[0].id), exams[0], 'exame intacto');
  // Id inexistente: nada muda
  await indexedDbService.deleteRecord('nao-existe');
  assert.deepStrictEqual([...db.stores.journey_records.keys()].sort(), ['j1', 'j3']);
});

test('Substituir (1.1): Jornada e exames são trocados pelos do arquivo', async () => {
  const db = createMockDb({ journey_records: [journey('old')], health_checks: [exam('Antigo')] });
  useDb(db);
  const incoming = exam('Do arquivo', 'baby');
  const r = await indexedDbService.restoreBackupReplace([journey('new')], [incoming]);
  assert.strictEqual(r.importedCount, 1);
  assert.deepStrictEqual([...db.stores.journey_records.keys()], ['new']);
  assert.deepStrictEqual([...db.stores.health_checks.keys()], [incoming.id]);
});

test('Arquivo 1.0 não apaga exames: substituir troca só a Jornada; mesclar não toca nos exames', async () => {
  const mine = exam('Meu exame');
  for (const mode of ['replace', 'merge'] as const) {
    const db = createMockDb({ journey_records: [journey('old')], health_checks: [mine] });
    useDb(db);
    const v = indexedDbService.validateBackupJson(JSON.stringify({ schemaVersion: '1.0', records: [journey('new')] }));
    assert.ok(v.valid && v.healthChecks === undefined);
    const r = mode === 'replace'
      ? await indexedDbService.restoreBackupReplace(v.records!, v.healthChecks)
      : await indexedDbService.restoreBackupMerge(v.records!, v.healthChecks);
    assert.strictEqual(r.healthChecks, undefined, 'resultado indica que os exames não foram tocados');
    assert.deepStrictEqual([...db.stores.health_checks.keys()], [mine.id], mode);
  }
});

test('Tudo ou nada: falha no meio da restauração não altera nenhuma das stores', async () => {
  const before = { journey_records: [journey('j1')], health_checks: [exam('Antes')] };
  const failing = exam('Este falha');
  for (const mode of ['merge', 'replace'] as const) {
    const db = createMockDb(before, { failAddId: failing.id });
    useDb(db);
    const call = mode === 'merge'
      ? indexedDbService.restoreBackupMerge([journey('j2')], [failing])
      : indexedDbService.restoreBackupReplace([journey('j2')], [failing]);
    await assert.rejects(call);
    assert.deepStrictEqual([...db.stores.journey_records.keys()], ['j1'], mode);
    assert.deepStrictEqual([...db.stores.health_checks.keys()], [before.health_checks[0].id], mode);
  }
});

test('Gravar, editar e excluir exames; registro inválido não é gravado', async () => {
  const db = createMockDb({});
  useDb(db);
  const e = exam('Exame fictício');
  assert.strictEqual((await indexedDbService.saveHealthCheck(e)).length, 1);
  const edited = { ...e, name: 'Nome corrigido', updatedAt: NOW.toISOString() };
  const afterEdit = await indexedDbService.saveHealthCheck(edited);
  assert.deepStrictEqual(afterEdit.map((r) => r.name), ['Nome corrigido']);
  await assert.rejects(indexedDbService.saveHealthCheck({ ...e, id: 'x', interpretation: 'normal' } as any));
  assert.strictEqual(db.stores.health_checks.size, 1);
  assert.deepStrictEqual(await indexedDbService.deleteHealthCheck(e.id), []);
  // A Jornada não é tocada
  assert.strictEqual(db.stores.journey_records.size, 0);
});

test('Convite do país de acompanhamento: some com país, pode ser adiado ou dispensado', () => {
  memoryStorage.clear();
  assert.strictEqual(careCountryPrompt.shouldShow(true, NOW), false);
  assert.strictEqual(careCountryPrompt.shouldShow(false, NOW), true);
  careCountryPrompt.snooze(NOW);
  assert.strictEqual(careCountryPrompt.shouldShow(false, NOW), false);
  assert.strictEqual(careCountryPrompt.shouldShow(false, new Date(NOW.getTime() + 31 * 86400000)), true);
  careCountryPrompt.dismiss();
  assert.strictEqual(careCountryPrompt.shouldShow(false, new Date(NOW.getTime() + 400 * 86400000)), false);
});

test('Interface sem interpretação, sem cores de alerta e sem catálogos nacionais publicados', () => {
  assert.deepStrictEqual(HEALTH_CHECK_CATALOGS, [], 'nenhuma lista nacional aprovada ainda');
  const info = fs.readFileSync('src/components/HealthCheckInfoSection.tsx', 'utf8');
  // A seção só recebe itens pela regra central (aprovação clínica, direitos e país)
  assert.match(info, /catalogEntriesFor\(catalogs,/);
  assert.ok(!/catalogs\.(filter|map|forEach)|\.entries\.(map|filter)/.test(info));
  assert.ok(!/docs\/conteudo|proposta-exames/.test(info));
  for (const file of ['src/components/HealthChecksView.tsx', 'src/components/HealthCheckSheet.tsx', 'src/components/HealthCheckInfoSection.tsx']) {
    const src = fs.readFileSync(file, 'utf8');
    assert.ok(!/#(?:[0-9a-f]{3}){1,2}\b|\b(red|green|danger|success|error-color)\b/i.test(src), `${file}: sem cores fixas de alerta`);
    assert.ok(!/CheckCircle|CircleCheck|BadgeCheck|ThumbsUp/.test(src), `${file}: sem ícone de "ok"`);
  }
  const css = fs.readFileSync('src/styles/index.css', 'utf8');
  const hcCss = css.slice(css.indexOf('/* ===== Exames e triagens'));
  assert.ok(!/#(?:[0-9a-f]{3}){1,2}\b|\b(red|green)\b/i.test(hcCss));
  for (const dict of [ptBR, en]) {
    const text = JSON.stringify(dict.healthChecks, (_k, v) => (typeof v === 'function' ? v('X', '1') : v)).toLowerCase();
    for (const word of ['normal', 'alterad', 'abnormal', 'obrigatóri', 'mandatory', 'you must', 'você deve', 'pendente', 'missing', 'faltando']) {
      assert.ok(!text.includes(word), `${word}`);
    }
  }
});

test('Perfil: o campo de país de acompanhamento não altera o país de emergência', () => {
  for (const file of ['src/components/ProfileEditModal.tsx', 'src/views/Onboarding.tsx']) {
    const src = fs.readFileSync(file, 'utf8');
    assert.match(src, /careCountry: careCountry \|\| undefined/);
    assert.match(src, /country: country \|\| undefined/);
    assert.ok(!/setCountry\(\s*careCountry|\bcountry: careCountry/.test(src), file);
  }
  const view = fs.readFileSync('src/components/HealthChecksView.tsx', 'utf8');
  assert.match(view, /\{ \.\.\.profile, careCountry: code/);
  assert.ok(!/\bcountry: code|emergencyCountry/.test(view));
});

test('Formulário: período e tipo sugeridos pela idade; triagem neonatal fica no primeiro mês', async () => {
  const { defaultPhase, defaultKind, phaseForKind } = await import('../src/domain/healthCheckFormDefaults.ts');
  const today = new Date(2026, 9, 30);
  const baby = (p: object) => ({ phase: 'baby' as const, stageValue: 2, ...p });
  // Pela data de nascimento, quando houver
  assert.strictEqual(defaultPhase('baby', baby({ birthDate: '2026-10-20' }), today), 'newborn');
  assert.strictEqual(defaultPhase('baby', baby({ birthDate: '2026-08-15' }), today), 'infant');
  assert.strictEqual(defaultPhase('baby', baby({ birthDate: '2025-06-01' }), today), 'toddler');
  // Sem data, pela faixa do perfil
  assert.strictEqual(defaultPhase('baby', baby({ stageValue: 0 }), today), 'newborn');
  assert.strictEqual(defaultPhase('baby', baby({ stageValue: 2 }), today), 'infant');
  assert.strictEqual(defaultPhase('baby', baby({ stageValue: 24 }), today), 'toddler');
  assert.strictEqual(defaultPhase('pregnant_person', { phase: 'pregnancy', stageValue: 24 }, today), 'pregnancy');
  // Triagem neonatal puxa o primeiro mês; os outros tipos mantêm a sugestão pela idade
  assert.strictEqual(phaseForKind('newborn_screening', 'infant'), 'newborn');
  assert.strictEqual(phaseForKind('child_test', 'infant'), 'infant');
  assert.strictEqual(defaultKind('baby', 'newborn'), 'newborn_screening');
  assert.strictEqual(defaultKind('baby', 'infant'), 'child_test');
  assert.strictEqual(defaultKind('pregnant_person', 'pregnancy'), 'prenatal_test');
  for (const dict of [ptBR, en]) {
    assert.ok(!Object.values(dict.healthChecks.phases).some((label) => /até 1 ano|up to 1 year/.test(label)));
  }
});
