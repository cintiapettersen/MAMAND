import type { JourneyRecord, BirthRecord } from '../types/index.ts';
import { birthRecordStorage } from './birthRecordStorage.ts';
import {
  parseHealthChecksFromBackup,
  validateHealthCheckRecord,
  type HealthCheckRecord
} from '../domain/healthChecks.ts';

const DB_NAME = 'first_1000_days_db';
// Versão 2: acrescenta a store de "Exames e triagens". A atualização a partir da versão 1
// só cria a store nova; os registros da Jornada não são tocados.
const DB_VERSION = 2;
const STORE_NAME = 'journey_records';
const HEALTH_STORE = 'health_checks';

const getTodayISODate = () => new Date().toISOString().split('T')[0];

// Só o nome dos arquivos novos mudou (antes: primeiros_1000_dias_backup_…json); o conteúdo e
// a importação de backups antigos, 1.0 e 1.1, continuam iguais.
export const backupFilename = (isoDate: string) => `mamand_backup_${isoDate}.json`;

// Versões antigas criavam dois registros de exemplo num banco vazio. Um perfil novo agora
// começa sem registros. Os exemplos antigos só são removidos se continuam exatamente como
// foram criados (mesmo id, tipo, marcações e texto); qualquer edição da família os preserva.
const LEGACY_DEMO_RECORDS: Array<Pick<JourneyRecord, 'id' | 'subject' | 'tags' | 'note'>> = [
  {
    id: 'rec-demo-1',
    subject: 'baby',
    tags: ['Dormiu bem', 'Mamou ou se alimentou normalmente'],
    note: 'Hoje o dia começou tranquilo. Conseguiu fazer uma soneca de 1h30 direto.'
  },
  {
    id: 'rec-demo-2',
    subject: 'mom',
    tags: ['Consegui um tempo só para mim', 'Recebi apoio prático que fez a diferença'],
    note: 'Minha mãe ficou com o bebê na sala e consegui tomar um banho demorado e descansar.'
  }
];

export const isUneditedLegacyDemo = (r: JourneyRecord): boolean =>
  LEGACY_DEMO_RECORDS.some(
    (d) =>
      d.id === r.id &&
      d.subject === r.subject &&
      d.note === r.note &&
      Array.isArray(r.tags) &&
      r.tags.length === d.tags.length &&
      d.tags.every((tag, i) => r.tags[i] === tag) &&
      !r.sourceActivityTitle &&
      !r.contentId
  );

class IndexedDbService {
  private db: IDBDatabase | null = null;
  public isSupported: boolean = typeof window !== 'undefined' && 'indexedDB' in window;
  public initError: string | null = null;

  // Abre ou inicializa a conexão com o IndexedDB
  public async openDB(): Promise<IDBDatabase> {
    if (this.db) return this.db;

    if (!this.isSupported) {
      this.initError = 'IndexedDB não é suportado por este navegador.';
      throw new Error(this.initError);
    }

    return new Promise((resolve, reject) => {
      const request = window.indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
          store.createIndex('by_eventDate', 'eventDate', { unique: false });
          store.createIndex('by_subject', 'subject', { unique: false });
          store.createIndex('by_timestamp', 'timestamp', { unique: false });
        }
        if (!db.objectStoreNames.contains(HEALTH_STORE)) {
          const health = db.createObjectStore(HEALTH_STORE, { keyPath: 'id' });
          health.createIndex('by_subject', 'subject', { unique: false });
          health.createIndex('by_updatedAt', 'updatedAt', { unique: false });
        }
      };

      request.onsuccess = async (event) => {
        this.db = (event.target as IDBOpenDBRequest).result;
        // Outra aba com versão mais nova do app pediu atualização do banco: libera a conexão
        this.db.onversionchange = () => {
          this.db?.close();
          this.db = null;
        };

        // Remove os exemplos antigos que nunca foram editados; registros reais não são tocados
        try {
          await this.removeLegacyDemoRecords(this.db);
        } catch (e) {
          console.warn('Aviso ao remover registros de exemplo antigos:', e);
        }

        resolve(this.db);
      };

      request.onerror = (event) => {
        const err = (event.target as IDBOpenDBRequest).error;
        this.initError = err ? err.message : 'Falha ao abrir IndexedDB no navegador.';
        reject(new Error(this.initError));
      };
    });
  }

  private removeLegacyDemoRecords(db: IDBDatabase): Promise<void> {
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      for (const { id } of LEGACY_DEMO_RECORDS) {
        const req = store.get(id);
        req.onsuccess = () => {
          const rec = req.result as JourneyRecord | undefined;
          if (rec && isUneditedLegacyDemo(rec)) store.delete(id);
        };
      }
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  // Retorna todos os registros ordenados do mais recente para o mais antigo
  public async getRecords(): Promise<JourneyRecord[]> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll();

      req.onsuccess = () => {
        const results = req.result as JourneyRecord[];
        // Ordena por eventDate decrescente e timestamp decrescente
        results.sort((a, b) => {
          if (a.eventDate === b.eventDate) {
            return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
          }
          return b.eventDate.localeCompare(a.eventDate);
        });
        resolve(results);
      };

      req.onerror = () => reject(req.error);
    });
  }

  // Salva um registro e retorna a lista atualizada
  public async saveRecord(record: JourneyRecord): Promise<JourneyRecord[]> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.put(record);

      tx.oncomplete = async () => {
        try {
          const all = await this.getRecords();
          resolve(all);
        } catch (err) {
          reject(err);
        }
      };

      tx.onerror = () => reject(tx.error);
    });
  }

  // Verifica se uma atividade de cuidados já foi registrada na data especificada
  public async hasActivityBeenRecorded(contentId: string, eventDate = getTodayISODate()): Promise<boolean> {
    try {
      const records = await this.getRecords();
      return records.some((r) => r.contentId === contentId && r.eventDate === eventDate);
    } catch {
      return false;
    }
  }

  // Exclui um único registro da Jornada. Só toca na store da Jornada: os exames e triagens
  // e os demais registros continuam como estavam.
  public async deleteRecord(id: string): Promise<JourneyRecord[]> {
    const db = await this.openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error || new Error('Exclusão cancelada. Nenhum registro foi alterado.'));
    });
    return this.getRecords();
  }

  // Limpa todos os registros do IndexedDB de forma explícita
  public async clearAllRecords(): Promise<void> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.clear();

      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  // ---- Exames e triagens (store própria; validação estrita antes de gravar)

  public async getHealthChecks(): Promise<HealthCheckRecord[]> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const req = db.transaction(HEALTH_STORE, 'readonly').objectStore(HEALTH_STORE).getAll();
      req.onsuccess = () => {
        const results = req.result as HealthCheckRecord[];
        results.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
        resolve(results);
      };
      req.onerror = () => reject(req.error);
    });
  }

  public async saveHealthCheck(record: HealthCheckRecord): Promise<HealthCheckRecord[]> {
    const check = validateHealthCheckRecord(record);
    if (!check.valid) throw new Error(`Registro de exame inválido: ${check.errors.join(', ')}`);
    const db = await this.openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(HEALTH_STORE, 'readwrite');
      tx.objectStore(HEALTH_STORE).put(check.record);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error ?? new Error('Gravação do exame abortada'));
    });
    return this.getHealthChecks();
  }

  public async deleteHealthCheck(id: string): Promise<HealthCheckRecord[]> {
    const db = await this.openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(HEALTH_STORE, 'readwrite');
      tx.objectStore(HEALTH_STORE).delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    return this.getHealthChecks();
  }

  // Exportação em formato aberto JSON (Soberania e backup dos dados).
  // Versão 1.1: inclui os exames e triagens; arquivos 1.0 continuam importáveis.
  public exportAsJson(records: JourneyRecord[], healthChecks: HealthCheckRecord[] = []): void {
    const savedBirthRecord = birthRecordStorage.hasSavedRecord()
      ? birthRecordStorage.getBirthRecord()
      : undefined;

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(
      JSON.stringify(
        {
          schemaVersion: '1.1',
          app: 'First 1,000 Days',
          exportedAt: new Date().toISOString(),
          totalRecords: records.length,
          records,
          birthRecord: savedBirthRecord,
          healthChecks
        },
        null,
        2
      )
    );
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', backupFilename(getTodayISODate()));
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  }

  // Exportação em resumo de texto legível (para levar ao pediatra ou consulta médica)
  // Baixa o resumo em texto montado por buildJourneyTextSummary; tudo acontece no aparelho
  public downloadTextFile(text: string, filename: string): void {
    const dataStr = 'data:text/plain;charset=utf-8,' + encodeURIComponent(text);
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', filename);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  }

  // Validação estrita de backup JSON antes de qualquer gravação
  public validateBackupJson(rawText: string): BackupValidationResult {
    const trimmed = rawText.trim();
    if (!trimmed) {
      return { valid: false, recordCount: 0, errorKey: 'emptyFile', errorMessage: 'O arquivo está vazio.' };
    }

    let parsed: any;
    try {
      parsed = JSON.parse(trimmed);
    } catch {
      return { valid: false, recordCount: 0, errorKey: 'invalidJson', errorMessage: 'Arquivo JSON inválido ou corrompido.' };
    }

    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return { valid: false, recordCount: 0, errorKey: 'corruptedRecord', errorMessage: 'Estrutura de dados raiz inválida.' };
    }

    if (parsed.schemaVersion !== '1.0' && parsed.schemaVersion !== '1.1') {
      return {
        valid: false,
        recordCount: 0,
        errorKey: 'unsupportedVersion',
        errorMessage: `Versão de esquema "${parsed.schemaVersion || 'desconhecida'}" incompatível (esperado: 1.0 ou 1.1).`
      };
    }

    if (!Array.isArray(parsed.records)) {
      return { valid: false, recordCount: 0, errorKey: 'corruptedRecord', errorMessage: 'Campo "records" deve ser uma lista.' };
    }

    // Exames e triagens (1.1): qualquer registro inválido recusa o arquivo inteiro,
    // para não importar só uma parte sem avisar
    const healthParse = parseHealthChecksFromBackup(parsed);
    if (!healthParse.valid) {
      return {
        valid: false,
        recordCount: 0,
        errorKey: 'corruptedRecord',
        errorMessage: `Exames e triagens inválidos no arquivo: ${healthParse.errors.slice(0, 3).join('; ')}`
      };
    }
    // undefined = o arquivo não traz a seção (1.0); [] = traz a seção vazia
    const healthChecks = parsed.schemaVersion === '1.1' && parsed.healthChecks !== undefined ? healthParse.records : undefined;

    if (parsed.records.length === 0 && !(healthChecks && healthChecks.length > 0)) {
      return {
        valid: false,
        recordCount: 0,
        errorKey: 'emptyFile',
        errorMessage: 'O arquivo de backup não contém nenhum registro para restauração.'
      };
    }

    const validRecords: JourneyRecord[] = [];
    const seenIds = new Set<string>();
    const subjects = { baby: 0, mom: 0, memory: 0 };
    let minDate = '';
    let maxDate = '';

    for (let i = 0; i < parsed.records.length; i++) {
      const rec = parsed.records[i];
      if (!rec || typeof rec !== 'object') {
        return { valid: false, recordCount: 0, errorKey: 'corruptedRecord', errorMessage: `Registro na posição ${i + 1} inválido.` };
      }

      if (typeof rec.id !== 'string' || !rec.id.trim()) {
        return { valid: false, recordCount: 0, errorKey: 'corruptedRecord', errorMessage: `Registro ${i + 1} sem ID válido.` };
      }

      const cleanId = rec.id.trim();
      if (seenIds.has(cleanId)) {
        // Ignora duplicata interna preservando o primeiro
        continue;
      }
      seenIds.add(cleanId);

      if (!['baby', 'mom', 'memory'].includes(rec.subject)) {
        return { valid: false, recordCount: 0, errorKey: 'corruptedRecord', errorMessage: `Registro ${i + 1} com categoria inválida ("${rec.subject}").` };
      }

      if (!Array.isArray(rec.tags) || !rec.tags.every((t: any) => typeof t === 'string')) {
        return { valid: false, recordCount: 0, errorKey: 'corruptedRecord', errorMessage: `Registro ${i + 1} com tags inválidas.` };
      }

      if (typeof rec.eventDate !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(rec.eventDate)) {
        return { valid: false, recordCount: 0, errorKey: 'corruptedRecord', errorMessage: `Registro ${i + 1} com data inválida (esperado YYYY-MM-DD).` };
      }

      const dateLabel = typeof rec.dateLabel === 'string' && rec.dateLabel.trim() ? rec.dateLabel.trim() : rec.eventDate;
      const timestamp = typeof rec.timestamp === 'string' && rec.timestamp.trim() ? rec.timestamp.trim() : new Date().toISOString();

      subjects[rec.subject as 'baby' | 'mom' | 'memory']++;

      if (!minDate || rec.eventDate < minDate) minDate = rec.eventDate;
      if (!maxDate || rec.eventDate > maxDate) maxDate = rec.eventDate;

      validRecords.push({
        id: cleanId,
        subject: rec.subject,
        tags: rec.tags,
        note: typeof rec.note === 'string' ? rec.note : '',
        sourceActivityTitle: typeof rec.sourceActivityTitle === 'string' ? rec.sourceActivityTitle : undefined,
        contentId: typeof rec.contentId === 'string' ? rec.contentId : undefined,
        timestamp,
        eventDate: rec.eventDate,
        dateLabel
      });
    }

    let validBirthRecord: BirthRecord | undefined = undefined;
    if (parsed.birthRecord && typeof parsed.birthRecord === 'object' && !Array.isArray(parsed.birthRecord)) {
      validBirthRecord = {
        babyName: typeof parsed.birthRecord.babyName === 'string' ? parsed.birthRecord.babyName : undefined,
        birthDate: typeof parsed.birthRecord.birthDate === 'string' ? parsed.birthRecord.birthDate : undefined,
        birthTime: typeof parsed.birthRecord.birthTime === 'string' ? parsed.birthRecord.birthTime : undefined,
        weightGrams: parsed.birthRecord.weightGrams !== undefined ? parsed.birthRecord.weightGrams : undefined,
        lengthCm: parsed.birthRecord.lengthCm !== undefined ? parsed.birthRecord.lengthCm : undefined,
        headCircumferenceCm: parsed.birthRecord.headCircumferenceCm !== undefined ? parsed.birthRecord.headCircumferenceCm : undefined,
        hospitalName: typeof parsed.birthRecord.hospitalName === 'string' ? parsed.birthRecord.hospitalName : undefined,
        city: typeof parsed.birthRecord.city === 'string' ? parsed.birthRecord.city : undefined,
        country: typeof parsed.birthRecord.country === 'string' ? parsed.birthRecord.country : undefined,
        deliveryType: typeof parsed.birthRecord.deliveryType === 'string' ? parsed.birthRecord.deliveryType : undefined,
        bloodType: typeof parsed.birthRecord.bloodType === 'string' ? parsed.birthRecord.bloodType : undefined,
        allergies: typeof parsed.birthRecord.allergies === 'string' ? parsed.birthRecord.allergies : undefined,
        healthConditions: typeof parsed.birthRecord.healthConditions === 'string' ? parsed.birthRecord.healthConditions : undefined,
        updatedAt: typeof parsed.birthRecord.updatedAt === 'string' ? parsed.birthRecord.updatedAt : undefined
      };
    }

    return {
      valid: true,
      version: parsed.schemaVersion,
      recordCount: validRecords.length,
      dateRange: validRecords.length > 0 ? { min: minDate, max: maxDate } : undefined,
      subjectCounts: subjects,
      records: validRecords,
      birthRecord: validBirthRecord,
      healthChecks
    };
  }

  // Restauração atômica com Mesclagem (Adicionar sem duplicar IDs existentes).
  // Sem `healthChecks` (arquivo 1.0), os exames e triagens do aparelho não são tocados.
  public async restoreBackupMerge(recordsToImport: JourneyRecord[], healthChecks?: HealthCheckRecord[]): Promise<RestoreResult> {
    if (healthChecks !== undefined) return this.restoreWithHealthChecks('merge', recordsToImport, healthChecks);
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const getAllKeysReq = store.getAllKeys();

      getAllKeysReq.onerror = () => {
        const err = getAllKeysReq.error || new Error('Erro ao consultar chaves existentes no IndexedDB');
        try { tx.abort(); } catch (_) {}
        reject(err);
      };

      getAllKeysReq.onsuccess = () => {
        const existingKeys = new Set((getAllKeysReq.result as string[]).map(String));
        let importedCount = 0;
        let skippedCount = 0;

        for (const rec of recordsToImport) {
          if (existingKeys.has(rec.id)) {
            skippedCount++;
          } else {
            store.add(rec);
            existingKeys.add(rec.id);
            importedCount++;
          }
        }

        tx.oncomplete = () => {
          resolve({
            success: true,
            importedCount,
            skippedCount,
            totalInDb: existingKeys.size,
            mode: 'merge'
          });
        };

        tx.onerror = () => {
          reject(tx.error || new Error('Erro na transação de mesclagem do backup'));
        };

        tx.onabort = () => {
          reject(new Error('Transação de mesclagem abortada. Nenhum dado foi alterado.'));
        };
      };
    });
  }

  // Restauração atômica com Substituição Integral (Sobrescrever histórico).
  // Sem `healthChecks` (arquivo 1.0), os exames e triagens do aparelho são mantidos.
  public async restoreBackupReplace(recordsToImport: JourneyRecord[], healthChecks?: HealthCheckRecord[]): Promise<RestoreResult> {
    if (healthChecks !== undefined) return this.restoreWithHealthChecks('replace', recordsToImport, healthChecks);
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);

      const clearReq = store.clear();

      clearReq.onerror = () => {
        const err = clearReq.error || new Error('Erro ao limpar a base antes da substituição');
        try { tx.abort(); } catch (_) {}
        reject(err);
      };

      clearReq.onsuccess = () => {
        let importedCount = 0;
        for (const rec of recordsToImport) {
          store.add(rec);
          importedCount++;
        }

        tx.oncomplete = () => {
          resolve({
            success: true,
            importedCount,
            skippedCount: 0,
            totalInDb: importedCount,
            mode: 'replace'
          });
        };

        tx.onerror = () => {
          reject(tx.error || new Error('Erro na transação de substituição do backup'));
        };

        tx.onabort = () => {
          reject(new Error('Transação de substituição abortada. O estado anterior foi preservado.'));
        };
      };
    });
  }

  // Restauração de arquivo 1.1: Jornada e exames na mesma transação (tudo ou nada)
  private async restoreWithHealthChecks(
    mode: 'merge' | 'replace',
    recordsToImport: JourneyRecord[],
    healthChecks: HealthCheckRecord[]
  ): Promise<RestoreResult> {
    for (const hc of healthChecks) {
      const check = validateHealthCheckRecord(hc);
      if (!check.valid) throw new Error(`Exame inválido no backup: ${check.errors.join(', ')}`);
    }
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction([STORE_NAME, HEALTH_STORE], 'readwrite');
      const journey = tx.objectStore(STORE_NAME);
      const health = tx.objectStore(HEALTH_STORE);
      const result: RestoreResult = {
        success: true,
        importedCount: 0,
        skippedCount: 0,
        totalInDb: 0,
        mode,
        healthChecks: { importedCount: 0, skippedCount: 0 }
      };

      tx.oncomplete = () => resolve(result);
      tx.onerror = () => reject(tx.error || new Error('Erro na transação de restauração do backup'));
      tx.onabort = () => reject(new Error('Restauração abortada. Nenhum dado foi alterado.'));

      const writeAll = (journeyKeys: Set<string>, healthKeys: Set<string>) => {
        try {
          for (const rec of recordsToImport) {
            if (journeyKeys.has(rec.id)) result.skippedCount++;
            else {
              journey.add(rec);
              journeyKeys.add(rec.id);
              result.importedCount++;
            }
          }
          for (const hc of healthChecks) {
            if (healthKeys.has(hc.id)) result.healthChecks!.skippedCount++;
            else {
              health.add(hc);
              healthKeys.add(hc.id);
              result.healthChecks!.importedCount++;
            }
          }
          result.totalInDb = journeyKeys.size;
        } catch (err) {
          try { tx.abort(); } catch (_) {}
          reject(err);
        }
      };

      if (mode === 'replace') {
        journey.clear();
        health.clear();
        writeAll(new Set(), new Set());
        return;
      }

      const journeyReq = journey.getAllKeys();
      const healthReq = health.getAllKeys();
      let pending = 2;
      const onKeys = () => {
        pending -= 1;
        if (pending === 0) {
          writeAll(
            new Set((journeyReq.result as IDBValidKey[]).map(String)),
            new Set((healthReq.result as IDBValidKey[]).map(String))
          );
        }
      };
      journeyReq.onsuccess = onKeys;
      healthReq.onsuccess = onKeys;
    });
  }
}

export interface BackupValidationResult {
  valid: boolean;
  version?: string;
  recordCount: number;
  dateRange?: { min: string; max: string };
  subjectCounts?: { baby: number; mom: number; memory: number };
  records?: JourneyRecord[];
  birthRecord?: BirthRecord;
  // Só presente se o arquivo trouxer a seção de exames (1.1)
  healthChecks?: HealthCheckRecord[];
  errorKey?: 'invalidJson' | 'unsupportedVersion' | 'corruptedRecord' | 'emptyFile';
  errorMessage?: string;
}

export interface RestoreResult {
  success: boolean;
  importedCount: number;
  skippedCount: number;
  totalInDb: number;
  mode: 'merge' | 'replace';
  // Exames e triagens: ausente quando o arquivo não traz a seção (eles ficam como estão)
  healthChecks?: { importedCount: number; skippedCount: number };
  errorMessage?: string;
}

export const indexedDbService = new IndexedDbService();
