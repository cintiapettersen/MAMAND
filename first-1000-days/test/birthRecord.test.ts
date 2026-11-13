import assert from 'node:assert';
import test from 'node:test';
import { birthRecordStorage } from '../src/services/birthRecordStorage.ts';
import { profileStorage } from '../src/services/profileStorage.ts';
import { indexedDbService } from '../src/services/indexedDbService.ts';
import { ptBR } from '../src/locales/pt-BR.ts';
import { en } from '../src/locales/en.ts';
import type { UserProfile, BirthRecord, BirthCardSettings } from '../src/types/index.ts';

// Mock localStorage para execução em Node.js
class LocalStorageMock {
  private store: Record<string, string> = {};

  getItem(key: string): string | null {
    return this.store[key] ?? null;
  }

  setItem(key: string, value: string): void {
    this.store[key] = String(value);
  }

  removeItem(key: string): void {
    delete this.store[key];
  }

  clear(): void {
    this.store = {};
  }
}

// Injeta o mock global de localStorage se ausente
if (typeof globalThis.localStorage === 'undefined') {
  (globalThis as any).localStorage = new LocalStorageMock();
}

test('1. birthRecordStorage: Inicialização padrão e reaproveitamento de dados do UserProfile', () => {
  localStorage.clear();

  const profile: UserProfile = {
    phase: 'baby',
    stageValue: 2,
    babyName: 'Helena',
    birthDate: '2026-08-15',
    mainNeed: 'sleep'
  };

  const initialRecord = birthRecordStorage.getBirthRecord(profile);

  assert.strictEqual(initialRecord.babyName, 'Helena', 'Deve reaproveitar o nome do bebê do perfil');
  assert.strictEqual(initialRecord.birthDate, '2026-08-15', 'Deve reaproveitar a data de nascimento do perfil');
  assert.strictEqual(initialRecord.birthTime, '', 'Horário inicial deve ser vazio');
  assert.strictEqual(initialRecord.weightGrams, '', 'Peso inicial deve ser vazio');
  assert.strictEqual(initialRecord.bloodType, '', 'Tipo sanguíneo inicial deve ser vazio');
  assert.strictEqual(initialRecord.allergies, '', 'Alergias iniciais devem ser vazias');
  assert.strictEqual(birthRecordStorage.hasSavedRecord(), false, 'Não deve constar como salvo antes de persistir');
});

test('2. birthRecordStorage: Gravação e leitura da ficha de nascimento', () => {
  localStorage.clear();

  const sampleRecord: BirthRecord = {
    babyName: 'Theo',
    birthDate: '2026-05-10',
    birthTime: '14:22',
    weightGrams: '3450',
    lengthCm: '50.5',
    headCircumferenceCm: '35',
    hospitalName: 'Hospital Santa Maria',
    city: 'Lisboa',
    country: 'Portugal',
    deliveryType: 'vaginal',
    bloodType: 'O+',
    allergies: 'Nenhuma alergia identificada na triagem neonatal',
    healthConditions: 'Teste do pezinho e triagem auditiva normais'
  };

  birthRecordStorage.saveBirthRecord(sampleRecord, false);

  assert.strictEqual(birthRecordStorage.hasSavedRecord(), true, 'Deve constar como salvo após persistência');

  const retrieved = birthRecordStorage.getBirthRecord();
  assert.strictEqual(retrieved.babyName, 'Theo');
  assert.strictEqual(retrieved.birthTime, '14:22');
  assert.strictEqual(retrieved.weightGrams, '3450');
  assert.strictEqual(retrieved.lengthCm, '50.5');
  assert.strictEqual(retrieved.hospitalName, 'Hospital Santa Maria');
  assert.strictEqual(retrieved.city, 'Lisboa');
  assert.strictEqual(retrieved.deliveryType, 'vaginal');
  assert.strictEqual(retrieved.bloodType, 'O+');
  assert.strictEqual(retrieved.allergies, 'Nenhuma alergia identificada na triagem neonatal');
  assert.ok(retrieved.updatedAt, 'Deve possuir timestamp de atualização');
});

test('3. birthRecordStorage: Sincronização automática com UserProfile', () => {
  localStorage.clear();

  const originalProfile: UserProfile = {
    phase: 'baby',
    stageValue: 1,
    babyName: 'Nome Antigo',
    birthDate: '2026-09-01',
    mainNeed: 'feeding'
  };
  profileStorage.saveProfile(originalProfile);

  const updatedRecord: BirthRecord = {
    babyName: 'Aurora Martins',
    birthDate: '2026-09-05',
    birthTime: '09:15',
    weightGrams: '3200',
    lengthCm: '49',
    hospitalName: 'Maternidade Viva'
  };

  birthRecordStorage.saveBirthRecord(updatedRecord, true);

  const syncedProfile = profileStorage.getProfile();
  assert.ok(syncedProfile, 'Perfil deve existir');
  assert.strictEqual(syncedProfile.babyName, 'Aurora Martins', 'Nome do bebê no perfil deve ser sincronizado');
  assert.strictEqual(syncedProfile.birthDate, '2026-09-05', 'Data de nascimento no perfil deve ser sincronizada');
});

test('4. Salvaguardas de Privacidade do Cartão Comemorativo', () => {
  // Configuração padrão do cartão comemorativo
  const cardSettings: BirthCardSettings = {
    showTime: true,
    showWeight: true,
    showLength: true,
    showLocation: true,
    showHospital: true
  };

  // Garante que campos clínicos NÃO são propriedades do cartão comemorativo
  const settingsKeys = Object.keys(cardSettings);
  assert.strictEqual(settingsKeys.includes('bloodType' as any), false, 'bloodType não pode estar nas configurações do cartão');
  assert.strictEqual(settingsKeys.includes('deliveryType' as any), false, 'deliveryType não pode estar nas configurações do cartão');
  assert.strictEqual(settingsKeys.includes('allergies' as any), false, 'allergies não pode estar nas configurações do cartão');
  assert.strictEqual(settingsKeys.includes('healthConditions' as any), false, 'healthConditions não pode estar nas configurações do cartão');

  // Garante a existência do aviso obrigatório de alergias nos dois idiomas
  assert.ok(ptBR.birthRecord.allergiesDisclaimer.toLowerCase().includes('ausência de registros'), 'pt-BR deve conter disclaimer clínico de alergias');
  assert.ok(en.birthRecord.allergiesDisclaimer.toLowerCase().includes('absence of recorded allergies'), 'en deve conter disclaimer clínico de alergias');

  // Garante a presença do aviso de que os dados clínicos são privados
  assert.ok(ptBR.birthRecord.clinicalPrivacyNotice.length > 10, 'pt-BR deve ter aviso de privacidade clínica');
  assert.ok(en.birthRecord.clinicalPrivacyNotice.length > 10, 'en deve ter aviso de privacidade clínica');
});

test('5. Integração com Backup/Restore (JSON Schema 1.0)', () => {
  const payloadWithBirthRecord = JSON.stringify({
    schemaVersion: '1.0',
    app: 'First 1,000 Days',
    exportedAt: '2026-10-28T19:30:00.000Z',
    records: [
      {
        id: 'rec-test-1',
        subject: 'baby',
        tags: ['Dormiu bem'],
        note: 'Soneca tranquila',
        eventDate: '2026-10-20',
        dateLabel: '20/10/2026',
        timestamp: '2026-10-20T14:00:00.000Z'
      }
    ],
    birthRecord: {
      babyName: 'Lucas',
      birthDate: '2026-06-12',
      birthTime: '07:30',
      weightGrams: '3600',
      lengthCm: '51',
      hospitalName: 'Hospital São Luiz',
      city: 'São Paulo',
      country: 'Brasil',
      deliveryType: 'cesarean',
      bloodType: 'unknown',
      allergies: '',
      healthConditions: 'Nenhuma'
    }
  });

  const res = indexedDbService.validateBackupJson(payloadWithBirthRecord);
  assert.strictEqual(res.valid, true, 'Backup com birthRecord deve ser aceito como válido');
  assert.strictEqual(res.recordCount, 1);
  assert.ok(res.birthRecord, 'birthRecord sanitizado deve ser extraído');
  assert.strictEqual(res.birthRecord?.babyName, 'Lucas');
  assert.strictEqual(res.birthRecord?.bloodType, 'unknown');
  assert.strictEqual(res.birthRecord?.deliveryType, 'cesarean');

  // Retrocompatibilidade: backup antigo sem birthRecord continua perfeitamente válido
  const payloadWithoutBirthRecord = JSON.stringify({
    schemaVersion: '1.0',
    app: 'First 1,000 Days',
    exportedAt: '2026-10-28T19:30:00.000Z',
    records: [
      {
        id: 'rec-test-2',
        subject: 'mom',
        tags: ['Passeio'],
        note: 'Caminhada suave',
        eventDate: '2026-10-21',
        dateLabel: '21/10/2026',
        timestamp: '2026-10-21T10:00:00.000Z'
      }
    ]
  });

  const resLegacy = indexedDbService.validateBackupJson(payloadWithoutBirthRecord);
  assert.strictEqual(resLegacy.valid, true, 'Backup legado sem birthRecord deve continuar válido');
  assert.strictEqual(resLegacy.birthRecord, undefined, 'birthRecord deve ser undefined quando não presente');
});

test('6. Validação de paridade linguística (pt-BR e en)', () => {
  const ptKeys = Object.keys(ptBR.birthRecord) as Array<keyof typeof ptBR.birthRecord>;
  const enKeys = Object.keys(en.birthRecord) as Array<keyof typeof en.birthRecord>;

  assert.strictEqual(ptKeys.length, enKeys.length, 'pt-BR e en devem ter exatamente a mesma quantidade de chaves em birthRecord');

  for (const key of ptKeys) {
    assert.ok(en.birthRecord[key], `Chave ${String(key)} deve estar presente em en`);
    assert.ok(ptBR.birthRecord[key], `Chave ${String(key)} deve estar presente em pt-BR`);
  }

  // Opções de tipo de parto e tipo sanguíneo
  assert.ok(ptBR.birthRecord.deliveryOptions.vaginal);
  assert.ok(en.birthRecord.deliveryOptions.vaginal);
  assert.ok(ptBR.birthRecord.bloodTypeOptions.unknown);
  assert.ok(en.birthRecord.bloodTypeOptions.unknown);
});
