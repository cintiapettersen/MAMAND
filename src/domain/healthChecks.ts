import type { SupportedLanguage } from '../types/index.ts';
import { toIsoCountry, type IsoCountry } from './countries.ts';
import { isUsable, type ContentMeta, type UsageContext } from './contentScope.ts';

// "Exames e triagens": registros pessoais de exames e triagens da gestante e do bebê,
// feitos ou conversados com profissionais de saúde. Funciona em qualquer país, sem catálogo.
// O app não prescreve exames, não interpreta resultados e não faz triagem: não há campo
// de valor de resultado nem de "normal/alterado". Veja docs/arquitetura/exames-e-triagens.md.

export const HEALTH_CHECK_SCHEMA_VERSION = 1;

export type HealthCheckSubject = 'pregnant_person' | 'baby';

export type HealthCheckPhase = 'pregnancy' | 'postpartum' | 'newborn' | 'infant' | 'toddler';

export type HealthCheckKind =
  | 'prenatal_test'
  | 'ultrasound'
  | 'newborn_screening'
  | 'child_test'
  | 'other';

// Cada etapa existe só se aconteceu; a data é opcional. Uma etapa nunca implica outra.
export interface Milestone {
  on?: string; // AAAA-MM-DD
}

export interface HealthCheckMilestones {
  discussed?: Milestone;       // exame ou triagem conversado com profissional
  scheduled?: Milestone;       // data marcada
  performed?: Milestone;       // exame realizado
  resultReceived?: Milestone;  // resultado recebido
  resultDiscussed?: Milestone; // resultado conversado com profissional
}

export type HealthCheckOrigin =
  | { kind: 'manual' }
  | {
      kind: 'catalog';
      catalogId: string;
      catalogVersion: string;
      country: IsoCountry;
      entryId: string;
      // Texto copiado no momento do registro: o registro não muda se o catálogo mudar ou sair
      labelAtCopy: string;
      langAtCopy: SupportedLanguage;
    };

export interface HealthCheckRecord {
  schemaVersion: typeof HEALTH_CHECK_SCHEMA_VERSION;
  id: string;
  subject: HealthCheckSubject;
  phase: HealthCheckPhase;
  gestationalWeek?: number;
  babyAgeDays?: number;
  kind: HealthCheckKind;
  name: string;
  milestones: HealthCheckMilestones;
  personalNote?: string;
  // País de acompanhamento quando o registro foi feito; não muda se a família mudar de país
  careCountry?: IsoCountry;
  origin: HealthCheckOrigin;
  createdAt: string;
  updatedAt: string;
}

const SUBJECTS: ReadonlySet<string> = new Set(['pregnant_person', 'baby']);
const PHASES: ReadonlySet<string> = new Set(['pregnancy', 'postpartum', 'newborn', 'infant', 'toddler']);
const KINDS: ReadonlySet<string> = new Set(['prenatal_test', 'ultrasound', 'newborn_screening', 'child_test', 'other']);
export const MILESTONE_KEYS = ['discussed', 'scheduled', 'performed', 'resultReceived', 'resultDiscussed'] as const;
const RECORD_KEYS: ReadonlySet<string> = new Set([
  'schemaVersion', 'id', 'subject', 'phase', 'gestationalWeek', 'babyAgeDays', 'kind', 'name',
  'milestones', 'personalNote', 'careCountry', 'origin', 'createdAt', 'updatedAt'
]);
const PHASES_BY_SUBJECT: Record<HealthCheckSubject, ReadonlySet<string>> = {
  pregnant_person: new Set(['pregnancy', 'postpartum']),
  baby: new Set(['newborn', 'infant', 'toddler'])
};

export const NAME_MAX = 120;
export const NOTE_MAX = 2000;

const isDate = (v: unknown): v is string => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(v));
const isTimestamp = (v: unknown): v is string => typeof v === 'string' && !Number.isNaN(Date.parse(v));
const isPlainObject = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);

// Validação estrita, usada também na importação de backup. Campos desconhecidos são
// recusados, para que nenhum dado de interpretação de resultado entre por importação.
export function validateHealthCheckRecord(value: unknown): { valid: true; record: HealthCheckRecord } | { valid: false; errors: string[] } {
  const errors: string[] = [];
  if (!isPlainObject(value)) return { valid: false, errors: ['registro não é um objeto'] };
  for (const key of Object.keys(value)) if (!RECORD_KEYS.has(key)) errors.push(`campo desconhecido: ${key}`);

  if (value.schemaVersion !== HEALTH_CHECK_SCHEMA_VERSION) errors.push('schemaVersion');
  if (typeof value.id !== 'string' || value.id.trim() === '') errors.push('id');
  if (typeof value.subject !== 'string' || !SUBJECTS.has(value.subject)) errors.push('subject');
  if (typeof value.phase !== 'string' || !PHASES.has(value.phase)) errors.push('phase');
  else if (SUBJECTS.has(value.subject as string) && !PHASES_BY_SUBJECT[value.subject as HealthCheckSubject].has(value.phase)) {
    errors.push('phase incompatível com subject');
  }
  if (value.gestationalWeek !== undefined && !(Number.isInteger(value.gestationalWeek) && (value.gestationalWeek as number) >= 0 && (value.gestationalWeek as number) <= 45)) errors.push('gestationalWeek');
  if (value.babyAgeDays !== undefined && !(Number.isInteger(value.babyAgeDays) && (value.babyAgeDays as number) >= 0 && (value.babyAgeDays as number) <= 1500)) errors.push('babyAgeDays');
  if (value.subject === 'baby' && value.gestationalWeek !== undefined) errors.push('gestationalWeek em registro do bebê');
  if (value.subject === 'pregnant_person' && value.babyAgeDays !== undefined) errors.push('babyAgeDays em registro da gestante');
  if (typeof value.kind !== 'string' || !KINDS.has(value.kind)) errors.push('kind');
  if (typeof value.name !== 'string' || value.name.trim() === '' || value.name.length > NAME_MAX) errors.push('name');
  if (value.personalNote !== undefined && (typeof value.personalNote !== 'string' || value.personalNote.length > NOTE_MAX)) errors.push('personalNote');
  if (value.careCountry !== undefined && toIsoCountry(value.careCountry) !== value.careCountry) errors.push('careCountry');
  if (!isTimestamp(value.createdAt)) errors.push('createdAt');
  if (!isTimestamp(value.updatedAt)) errors.push('updatedAt');

  if (!isPlainObject(value.milestones)) errors.push('milestones');
  else {
    for (const key of Object.keys(value.milestones)) {
      if (!(MILESTONE_KEYS as readonly string[]).includes(key)) errors.push(`etapa desconhecida: ${key}`);
      const m = value.milestones[key];
      if (!isPlainObject(m) || Object.keys(m).some((k) => k !== 'on') || (m.on !== undefined && !isDate(m.on))) {
        errors.push(`etapa inválida: ${key}`);
      }
    }
  }

  const origin = value.origin;
  if (!isPlainObject(origin)) errors.push('origin');
  else if (origin.kind === 'manual') {
    if (Object.keys(origin).length !== 1) errors.push('origin manual com campos extras');
  } else if (origin.kind === 'catalog') {
    const keys = ['kind', 'catalogId', 'catalogVersion', 'country', 'entryId', 'labelAtCopy', 'langAtCopy'];
    if (Object.keys(origin).some((k) => !keys.includes(k))) errors.push('origin com campos extras');
    for (const k of ['catalogId', 'catalogVersion', 'entryId', 'labelAtCopy']) {
      if (typeof origin[k] !== 'string' || (origin[k] as string).trim() === '') errors.push(`origin.${k}`);
    }
    if (toIsoCountry(origin.country) !== origin.country) errors.push('origin.country');
    if (origin.langAtCopy !== 'pt-BR' && origin.langAtCopy !== 'en') errors.push('origin.langAtCopy');
  } else errors.push('origin.kind');

  return errors.length ? { valid: false, errors } : { valid: true, record: value as unknown as HealthCheckRecord };
}

export interface ManualHealthCheckInput {
  subject: HealthCheckSubject;
  phase: HealthCheckPhase;
  kind: HealthCheckKind;
  name: string;
  gestationalWeek?: number;
  babyAgeDays?: number;
  milestones?: HealthCheckMilestones;
  personalNote?: string;
  careCountry?: IsoCountry;
}

const newId = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `hc-${Date.now()}-${Math.random().toString(36).slice(2)}`;

// Registro manual: funciona em qualquer país, com ou sem país de acompanhamento.
export function createManualHealthCheck(input: ManualHealthCheckInput, now = new Date()): HealthCheckRecord {
  const at = now.toISOString();
  const record: HealthCheckRecord = {
    schemaVersion: HEALTH_CHECK_SCHEMA_VERSION,
    id: newId(),
    subject: input.subject,
    phase: input.phase,
    kind: input.kind,
    name: input.name.trim(),
    milestones: input.milestones ?? {},
    origin: { kind: 'manual' },
    createdAt: at,
    updatedAt: at
  };
  if (input.gestationalWeek !== undefined) record.gestationalWeek = input.gestationalWeek;
  if (input.babyAgeDays !== undefined) record.babyAgeDays = input.babyAgeDays;
  if (input.personalNote?.trim()) record.personalNote = input.personalNote.trim();
  const country = toIsoCountry(input.careCountry);
  if (country) record.careCountry = country;
  return assertValid(record);
}

// Marca ou desmarca uma etapa. Nenhuma etapa é preenchida por inferência.
export function setMilestone(
  record: HealthCheckRecord,
  key: keyof HealthCheckMilestones,
  value: Milestone | null,
  now = new Date()
): HealthCheckRecord {
  const milestones = { ...record.milestones };
  if (value === null) delete milestones[key];
  else milestones[key] = value.on ? { on: value.on } : {};
  return assertValid({ ...record, milestones, updatedAt: now.toISOString() });
}

function assertValid(record: HealthCheckRecord): HealthCheckRecord {
  const result = validateHealthCheckRecord(record);
  if (!result.valid) throw new Error(`Registro de exame inválido: ${result.errors.join(', ')}`);
  return result.record;
}

// ---- Catálogos nacionais (listas educativas). Separados, versionados e só usados se elegíveis.

export type CatalogIndication = 'routine' | 'by_indication' | 'regional';

export interface HealthCheckCatalogEntry {
  id: string;
  subject: HealthCheckSubject;
  kind: HealthCheckKind;
  label: Partial<Record<SupportedLanguage, string>>;
  // Explicação educativa curta, escrita a partir da fonte do catálogo
  description?: Partial<Record<SupportedLanguage, string>>;
  window?: { fromWeek?: number; toWeek?: number; fromDay?: number; toDay?: number };
  indication: CatalogIndication;
}

export interface HealthCheckCatalog {
  id: string;
  version: string;
  meta: ContentMeta; // escopo (país), fontes, datas, revisão, direitos, idiomas
  entries: HealthCheckCatalogEntry[];
}

// Listas nacionais de exames exigem mais que as evidências: aprovação clínica registrada
// (`clinically_reviewed`), além de direitos confirmados e do país de acompanhamento.
export function isCatalogUsable(catalog: HealthCheckCatalog, ctx: UsageContext): boolean {
  return catalog.meta.review.status === 'clinically_reviewed' && isUsable(catalog.meta, ctx);
}

// Catálogos disponíveis para o contexto. Sem catálogo elegível, a lista é vazia e os
// registros manuais continuam funcionando.
export function usableCatalogs(catalogs: HealthCheckCatalog[], ctx: UsageContext): HealthCheckCatalog[] {
  return catalogs.filter((c) => isCatalogUsable(c, ctx));
}

export interface CatalogEntryView {
  catalog: HealthCheckCatalog;
  entry: HealthCheckCatalogEntry;
  // Já existe um registro copiado deste item (qualquer versão). Só informa; não indica realização.
  alreadyRecorded: boolean;
}

// Itens de catálogos utilizáveis para quem está sendo acompanhado (gestante ou bebê),
// no idioma da tela. Itens de rotina e itens por indicação ficam separados.
export function catalogEntriesFor(
  catalogs: HealthCheckCatalog[],
  ctx: UsageContext & { lang: SupportedLanguage },
  subject: HealthCheckSubject,
  records: HealthCheckRecord[]
): { routine: CatalogEntryView[]; byIndication: CatalogEntryView[] } {
  const recorded = new Set(
    records.flatMap((r) => (r.origin.kind === 'catalog' ? [`${r.origin.catalogId}::${r.origin.entryId}`] : []))
  );
  const routine: CatalogEntryView[] = [];
  const byIndication: CatalogEntryView[] = [];
  for (const catalog of usableCatalogs(catalogs, ctx)) {
    for (const entry of catalog.entries) {
      if (entry.subject !== subject || !entry.label[ctx.lang]) continue;
      const view = { catalog, entry, alreadyRecorded: recorded.has(`${catalog.id}::${entry.id}`) };
      (entry.indication === 'routine' ? routine : byIndication).push(view);
    }
  }
  return { routine, byIndication };
}

// Copia um item de um catálogo utilizável para um registro pessoal. O texto e a versão
// ficam guardados no registro.
export function createFromCatalog(
  catalog: HealthCheckCatalog,
  entryId: string,
  ctx: UsageContext & { lang: SupportedLanguage },
  phase: HealthCheckPhase,
  now = new Date()
): HealthCheckRecord {
  if (!isCatalogUsable(catalog, ctx)) throw new Error('Catálogo não utilizável para este contexto');
  if (catalog.meta.scope.kind !== 'country' || catalog.meta.scope.countries.length !== 1) {
    throw new Error('Catálogo de exames precisa ser de um único país');
  }
  const entry = catalog.entries.find((e) => e.id === entryId);
  const label = entry?.label[ctx.lang];
  if (!entry || !label) throw new Error('Item do catálogo indisponível neste idioma');
  const record = createManualHealthCheck({ subject: entry.subject, phase, kind: entry.kind, name: label, careCountry: ctx.careCountry }, now);
  return assertValid({
    ...record,
    origin: {
      kind: 'catalog',
      catalogId: catalog.id,
      catalogVersion: catalog.version,
      country: catalog.meta.scope.countries[0],
      entryId: entry.id,
      labelAtCopy: label,
      langAtCopy: ctx.lang
    }
  });
}

// ---- Backup: a versão 1.1 acrescenta `healthChecks`; arquivos 1.0 continuam válidos.

export function parseHealthChecksFromBackup(parsed: unknown): { valid: true; records: HealthCheckRecord[] } | { valid: false; errors: string[] } {
  if (!isPlainObject(parsed)) return { valid: false, errors: ['backup não é um objeto'] };
  if (parsed.schemaVersion === '1.0') return { valid: true, records: [] };
  if (parsed.schemaVersion !== '1.1') return { valid: false, errors: [`schemaVersion ${String(parsed.schemaVersion)}`] };
  if (parsed.healthChecks === undefined) return { valid: true, records: [] };
  if (!Array.isArray(parsed.healthChecks)) return { valid: false, errors: ['healthChecks não é uma lista'] };
  const records: HealthCheckRecord[] = [];
  const errors: string[] = [];
  const ids = new Set<string>();
  parsed.healthChecks.forEach((item, i) => {
    const r = validateHealthCheckRecord(item);
    if (!r.valid) errors.push(...r.errors.map((e) => `healthChecks[${i}]: ${e}`));
    else if (ids.has(r.record.id)) errors.push(`healthChecks[${i}]: id repetido`);
    else {
      ids.add(r.record.id);
      records.push(r.record);
    }
  });
  return errors.length ? { valid: false, errors } : { valid: true, records };
}
