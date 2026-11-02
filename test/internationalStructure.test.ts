import assert from 'node:assert';
import test from 'node:test';
import fs from 'node:fs';
import path from 'node:path';
import { ISO_3166_1_ALPHA2 } from '../src/data/isoCountries.ts';
import { isIsoCountry, toIsoCountry } from '../src/domain/countries.ts';
import {
  isUsable,
  usability,
  selectWithoutSubstitution,
  scopeFromLegacyJurisdiction,
  type ContentMeta
} from '../src/domain/contentScope.ts';
import {
  createManualHealthCheck,
  createFromCatalog,
  setMilestone,
  usableCatalogs,
  catalogEntriesFor,
  validateHealthCheckRecord,
  parseHealthChecksFromBackup,
  type HealthCheckCatalog
} from '../src/domain/healthChecks.ts';
import { getProfileCountries } from '../src/domain/profileCountries.ts';
import { indexedDbService } from '../src/services/indexedDbService.ts';

// Etapa 1 da arquitetura internacional e de "Exames e triagens". Dados fictícios.
// Países usados: IS como país com catálogo fictício; KE e JP como países sem catálogo;
// XA e XB (códigos de uso livre, fora da lista oficial) para provar que a regra é genérica.

const NOW = new Date('2026-10-30T12:00:00.000Z');

const meta = (over: Partial<ContentMeta> = {}): ContentMeta => ({
  scope: { kind: 'international' },
  individualAssessment: 'none',
  sources: [{ publisher: 'Fonte fictícia', title: 'Documento fictício', accessedOn: '2026-10-30' }],
  version: '1',
  review: { status: 'source_based' },
  rights: { status: 'confirmed' },
  languages: ['pt-BR', 'en'],
  ...over
});

const catalog = (id: string, country: string, over: Partial<ContentMeta> = {}): HealthCheckCatalog => ({
  id,
  version: '2026.1',
  meta: meta({ scope: { kind: 'country', countries: [country] }, review: { status: 'clinically_reviewed' }, ...over }),
  entries: [
    { id: 'blood-early', subject: 'pregnant_person', kind: 'prenatal_test', indication: 'routine', label: { 'pt-BR': 'Exame de sangue fictício', en: 'Fictitious blood test' } },
    { id: 'scan-mid', subject: 'pregnant_person', kind: 'ultrasound', indication: 'routine', label: { 'pt-BR': 'Ultrassom fictício' } },
    { id: 'heel', subject: 'baby', kind: 'newborn_screening', indication: 'routine', label: { 'pt-BR': 'Triagem neonatal fictícia', en: 'Fictitious newborn screening' } }
  ]
});

// ---- Países

test('Países: lista ISO 3166-1 alfa-2 completa, sem repetição, com nome em pt e en', () => {
  assert.strictEqual(ISO_3166_1_ALPHA2.length, 249);
  assert.strictEqual(new Set(ISO_3166_1_ALPHA2).size, 249);
  const pt = new Intl.DisplayNames(['pt-BR'], { type: 'region' });
  const en = new Intl.DisplayNames(['en'], { type: 'region' });
  for (const code of ISO_3166_1_ALPHA2) {
    assert.match(code, /^[A-Z]{2}$/);
    assert.notStrictEqual(pt.of(code), code, `sem nome em pt: ${code}`);
    assert.notStrictEqual(en.of(code), code, `sem nome em en: ${code}`);
  }
  assert.ok(isIsoCountry('KE') && isIsoCountry('JP') && isIsoCountry('IS'));
  assert.ok(!isIsoCountry('ke') && !isIsoCountry('XA') && !isIsoCountry('ZZ') && !isIsoCountry('BRA') && !isIsoCountry(''));
  assert.strictEqual(toIsoCountry(' ke '), 'KE');
  assert.strictEqual(toIsoCountry('XA'), undefined);
});

test('Lógica sem regra para países específicos: nenhum código de país fixo fora dos dados', () => {
  const official = new Set(ISO_3166_1_ALPHA2);
  // Ocorrência antiga conhecida: o tipo de `countryJurisdiction`, substituído por ContentScope na etapa de integração
  const allowed = [/countryJurisdiction\?: 'BR' \| 'GLOBAL' \| 'WHO'/];
  const dirs = ['src/domain', 'src/services', 'src/views', 'src/components', 'src/config', 'src/utils', 'src/context'];
  const files = dirs.flatMap((d) => fs.readdirSync(d, { recursive: true }).map((f) => path.join(d, String(f))))
    .filter((f) => /\.(ts|tsx)$/.test(f));
  const offenders: string[] = [];
  for (const file of files) {
    fs.readFileSync(file, 'utf8').split('\n').forEach((line, i) => {
      if (allowed.some((re) => re.test(line))) return;
      for (const m of line.matchAll(/['"`]([A-Z]{2})['"`]/g)) {
        if (official.has(m[1])) offenders.push(`${file}:${i + 1}: ${m[1]}`);
      }
    });
  }
  assert.deepStrictEqual(offenders, []);
});

// ---- Regra única de uso

test('Uso: internacional vale sem país; de país só vale para o país de acompanhamento', () => {
  const intl = meta();
  const xa = meta({ scope: { kind: 'country', countries: ['XA'] } });
  assert.ok(isUsable(intl, {}) && isUsable(intl, { careCountry: 'KE' }));
  assert.ok(isUsable(xa, { careCountry: 'XA' }));
  assert.ok(isUsable(xa, { careCountry: 'xa' }));
  assert.deepStrictEqual(usability(xa, { careCountry: 'XB' }), { usable: false, reason: 'other_country' });
  assert.deepStrictEqual(usability(xa, {}), { usable: false, reason: 'no_care_country' });
  assert.ok(!isUsable(meta({ scope: { kind: 'country', countries: [] } }), { careCountry: 'XA' }));
});

test('Uso: status, suspensão, direitos, avaliação individual e idioma bloqueiam', () => {
  const ctx = { careCountry: 'KE' };
  assert.strictEqual(usability(meta({ review: { status: 'pending_review' } }), ctx).usable, false);
  assert.strictEqual(usability(meta({ review: { status: 'demonstrative' } }), ctx).usable, false);
  assert.ok(isUsable(meta({ review: { status: 'clinically_reviewed' } }), ctx));
  assert.deepStrictEqual(usability(meta({ suspendedReason: 'teste' }), ctx), { usable: false, reason: 'status' });
  assert.deepStrictEqual(usability(meta({ rights: { status: 'pending' } }), ctx), { usable: false, reason: 'rights' });
  assert.deepStrictEqual(usability(meta({ individualAssessment: 'required' }), ctx), { usable: false, reason: 'individual_assessment' });
  assert.ok(isUsable(meta({ individualAssessment: 'partial' }), ctx));
  assert.deepStrictEqual(usability(meta({ languages: ['pt-BR'] }), { ...ctx, lang: 'en' }), { usable: false, reason: 'language' });
});

test('Sem substituição: se o mais relevante é de outro país, não se usa o seguinte', () => {
  const ranked = [
    { id: 'xb-protocol', meta: meta({ scope: { kind: 'country', countries: ['XB'] } }) },
    { id: 'general', meta: meta() }
  ];
  const r = selectWithoutSubstitution(ranked, (x) => x.meta, { careCountry: 'XA' });
  assert.deepStrictEqual(r, { items: [], blockedBy: 'other_country' });

  const ranked2 = [ranked[1], ranked[0], { id: 'xa', meta: meta({ scope: { kind: 'country', countries: ['XA'] } }) }];
  assert.deepStrictEqual(selectWithoutSubstitution(ranked2, (x) => x.meta, { careCountry: 'XA' }).items.map((x) => x.id), ['general', 'xa']);
  assert.deepStrictEqual(selectWithoutSubstitution([], (x: { meta: ContentMeta }) => x.meta, {}), { items: [] });
});

test('Leitura do campo antigo de jurisdição', () => {
  assert.deepStrictEqual(scopeFromLegacyJurisdiction('GLOBAL'), { kind: 'international' });
  assert.deepStrictEqual(scopeFromLegacyJurisdiction('WHO'), { kind: 'international' });
  assert.deepStrictEqual(scopeFromLegacyJurisdiction('KE'), { kind: 'country', countries: ['KE'] });
  assert.deepStrictEqual(scopeFromLegacyJurisdiction('???'), { kind: 'country', countries: [] });
});

// ---- Exames e triagens

test('Registro manual funciona em qualquer país, sem país e sem catálogo', () => {
  for (const careCountry of ['KE', 'JP', undefined]) {
    const r = createManualHealthCheck({ subject: 'pregnant_person', phase: 'pregnancy', kind: 'prenatal_test', name: ' Exame de sangue ', gestationalWeek: 10, careCountry }, NOW);
    assert.strictEqual(r.name, 'Exame de sangue');
    assert.deepStrictEqual(r.origin, { kind: 'manual' });
    assert.strictEqual(r.careCountry, careCountry);
    assert.deepStrictEqual(r.milestones, {});
    assert.ok(validateHealthCheckRecord(r).valid);
  }
  const kinds = [
    ['pregnant_person', 'pregnancy', 'ultrasound'],
    ['baby', 'newborn', 'newborn_screening'],
    ['baby', 'infant', 'child_test'],
    ['baby', 'toddler', 'other'],
    ['pregnant_person', 'postpartum', 'other']
  ] as const;
  for (const [subject, phase, kind] of kinds) {
    assert.ok(validateHealthCheckRecord(createManualHealthCheck({ subject, phase, kind, name: 'Registro fictício' }, NOW)).valid);
  }
  assert.throws(() => createManualHealthCheck({ subject: 'baby', phase: 'pregnancy', kind: 'other', name: 'x' }, NOW));
  assert.throws(() => createManualHealthCheck({ subject: 'pregnant_person', phase: 'pregnancy', kind: 'other', name: '   ' }, NOW));
  assert.throws(() => createManualHealthCheck({ subject: 'baby', phase: 'newborn', kind: 'other', name: 'x', gestationalWeek: 30 }, NOW));
  // País fora da lista oficial não é guardado
  assert.strictEqual(createManualHealthCheck({ subject: 'baby', phase: 'newborn', kind: 'other', name: 'x', careCountry: 'XA' }, NOW).careCountry, undefined);
});

test('Etapas separadas: realizado, resultado recebido e resultado conversado não se implicam', () => {
  let r = createManualHealthCheck({ subject: 'baby', phase: 'newborn', kind: 'newborn_screening', name: 'Triagem fictícia' }, NOW);
  r = setMilestone(r, 'performed', { on: '2026-10-20' }, NOW);
  assert.deepStrictEqual(r.milestones, { performed: { on: '2026-10-20' } });
  r = setMilestone(r, 'resultReceived', {}, NOW);
  assert.deepStrictEqual(Object.keys(r.milestones).sort(), ['performed', 'resultReceived']);
  assert.strictEqual(r.milestones.resultDiscussed, undefined);
  r = setMilestone(r, 'performed', null, NOW);
  assert.deepStrictEqual(Object.keys(r.milestones), ['resultReceived']);
  assert.throws(() => setMilestone(r, 'performed', { on: '20/10/2026' }, NOW));
});

test('Sem interpretação de resultado: campos de valor, normalidade ou etapas extras são recusados', () => {
  const base = createManualHealthCheck({ subject: 'pregnant_person', phase: 'pregnancy', kind: 'prenatal_test', name: 'Exame fictício' }, NOW);
  for (const extra of [{ result: '12' }, { resultValue: 12 }, { isNormal: true }, { interpretation: 'normal' }, { reference: '11-15' }]) {
    assert.strictEqual(validateHealthCheckRecord({ ...base, ...extra }).valid, false, JSON.stringify(extra));
  }
  for (const milestones of [{ normal: {} }, { performed: { on: '2026-10-20', ok: true } }, { performed: 'sim' }]) {
    assert.strictEqual(validateHealthCheckRecord({ ...base, milestones }).valid, false, JSON.stringify(milestones));
  }
  const src = fs.readFileSync('src/domain/healthChecks.ts', 'utf8');
  assert.ok(!/\b(isNormal|abnormal|referenceRange|resultValue)\b/.test(src));
});

test('Catálogos nacionais: separados, versionados, só com elegibilidade, revisão e direitos', () => {
  const all = [
    catalog('is-ok', 'IS'),
    catalog('is-pending-review', 'IS', { review: { status: 'pending_review' } }),
    // Listas nacionais exigem aprovação clínica: fundamentação documental não basta
    catalog('is-source-based', 'IS', { review: { status: 'source_based' } }),
    catalog('is-pending-rights', 'IS', { rights: { status: 'pending' } }),
    catalog('is-suspended', 'IS', { suspendedReason: 'teste' })
  ];
  assert.deepStrictEqual(usableCatalogs(all, { careCountry: 'IS' }).map((c) => c.id), ['is-ok']);
  // Países sem catálogo e perfil sem país: nenhuma lista, e o registro manual continua funcionando
  for (const careCountry of ['KE', 'JP', undefined]) {
    assert.deepStrictEqual(usableCatalogs(all, { careCountry }), []);
  }
  assert.throws(() => createFromCatalog(all[0], 'blood-early', { careCountry: 'KE', lang: 'pt-BR' }, 'pregnancy', NOW));
  assert.throws(() => createFromCatalog(all[1], 'blood-early', { careCountry: 'IS', lang: 'pt-BR' }, 'pregnancy', NOW));
  assert.throws(() => createFromCatalog(all[0], 'scan-mid', { careCountry: 'IS', lang: 'en' }, 'pregnancy', NOW));
  assert.throws(() => createFromCatalog(all[0], 'inexistente', { careCountry: 'IS', lang: 'pt-BR' }, 'pregnancy', NOW));
});

test('Item copiado do catálogo guarda texto e versão; mudança ou saída do catálogo não altera o registro', () => {
  const cat = catalog('is-ok', 'IS');
  const r = createFromCatalog(cat, 'heel', { careCountry: 'IS', lang: 'pt-BR' }, 'newborn', NOW);
  assert.strictEqual(r.name, 'Triagem neonatal fictícia');
  assert.deepStrictEqual(r.origin, {
    kind: 'catalog', catalogId: 'is-ok', catalogVersion: '2026.1', country: 'IS',
    entryId: 'heel', labelAtCopy: 'Triagem neonatal fictícia', langAtCopy: 'pt-BR'
  });
  const snapshot = JSON.stringify(r);
  cat.version = '2027.1';
  cat.entries[2].label['pt-BR'] = 'Outro texto';
  assert.strictEqual(JSON.stringify(r), snapshot);
  assert.deepStrictEqual(usableCatalogs([], { careCountry: 'IS' }), []);
  assert.ok(validateHealthCheckRecord(r).valid);
});

test('Mudança de país: registros históricos não são perdidos nem reclassificados', () => {
  const before = { country: 'IS', careCountry: 'IS' };
  const cat = catalog('is-ok', 'IS');
  const records = [
    createFromCatalog(cat, 'blood-early', { careCountry: 'IS', lang: 'pt-BR' }, 'pregnancy', NOW),
    createManualHealthCheck({ subject: 'baby', phase: 'newborn', kind: 'newborn_screening', name: 'Manual', careCountry: 'IS' }, NOW)
  ];
  const frozen = JSON.stringify(records);
  const after = { ...before, careCountry: 'KE', emergencyCountry: 'KE' };
  assert.deepStrictEqual(getProfileCountries(after), { care: 'KE', emergency: 'KE' });
  assert.deepStrictEqual(usableCatalogs([cat], { careCountry: getProfileCountries(after).care }), []);
  assert.strictEqual(JSON.stringify(records), frozen);
  for (const r of records) {
    assert.strictEqual(r.careCountry, 'IS');
    assert.ok(validateHealthCheckRecord(r).valid);
  }
  // Novo registro no novo país convive com os antigos
  const newer = createManualHealthCheck({ subject: 'baby', phase: 'infant', kind: 'child_test', name: 'Novo', careCountry: 'KE' }, NOW);
  assert.strictEqual(newer.careCountry, 'KE');
});

// ---- Perfil

test('Perfil: campo antigo vira só país de emergência; países e idioma independentes', () => {
  assert.deepStrictEqual(getProfileCountries({ country: 'IS' }), { emergency: 'IS' });
  assert.deepStrictEqual(getProfileCountries({}), {});
  assert.deepStrictEqual(
    getProfileCountries({ country: 'IS', residenceCountry: 'SE', careCountry: 'NO', emergencyCountry: 'SE' }),
    { residence: 'SE', care: 'NO', emergency: 'SE' }
  );
  assert.deepStrictEqual(getProfileCountries({ residenceCountry: 'XA', careCountry: 'jp ', emergencyCountry: 'ZZ' }), { care: 'JP' });
  const src = fs.readFileSync('src/domain/profileCountries.ts', 'utf8');
  assert.ok(!/preferredLanguage|navigator\.language/.test(src.replace(/^\s*\/\/.*$/gm, '')), 'país não pode vir do idioma');
});

// ---- Backup

test('Backup: 1.0 continua válido; 1.1 traz exames validados; erros recusam o arquivo', () => {
  const r = createManualHealthCheck({ subject: 'pregnant_person', phase: 'pregnancy', kind: 'ultrasound', name: 'Ultrassom fictício' }, NOW);
  assert.deepStrictEqual(parseHealthChecksFromBackup({ schemaVersion: '1.0', records: [] }), { valid: true, records: [] });
  assert.deepStrictEqual(parseHealthChecksFromBackup({ schemaVersion: '1.1', records: [] }), { valid: true, records: [] });
  const ok = parseHealthChecksFromBackup({ schemaVersion: '1.1', records: [], healthChecks: [r] });
  assert.ok(ok.valid && ok.records.length === 1);
  assert.strictEqual(parseHealthChecksFromBackup({ schemaVersion: '1.1', healthChecks: [r, r] }).valid, false);
  assert.strictEqual(parseHealthChecksFromBackup({ schemaVersion: '1.1', healthChecks: [{ ...r, isNormal: true }] }).valid, false);
  assert.strictEqual(parseHealthChecksFromBackup({ schemaVersion: '1.1', healthChecks: {} }).valid, false);
  assert.strictEqual(parseHealthChecksFromBackup({ schemaVersion: '2.0' }).valid, false);
  // O importador atual da Jornada continua aceitando arquivos 1.0
  const legacy = JSON.stringify({ schemaVersion: '1.0', records: [{ id: 'r1', subject: 'baby', tags: ['Dormiu bem'], eventDate: '2026-10-20', dateLabel: '20/10/2026', timestamp: '2026-10-20T10:00:00.000Z' }] });
  assert.strictEqual(indexedDbService.validateBackupJson(legacy).valid, true);
});

test('Lista do país para a tela: rotina e por indicação separadas, por pessoa e idioma, com "já registrado"', () => {
  const cat = catalog('is-ok', 'IS');
  cat.entries.push({ id: 'extra', subject: 'pregnant_person', kind: 'prenatal_test', indication: 'by_indication', label: { 'pt-BR': 'Exame por indicação fictício', en: 'Fictitious test by indication' } });
  const ctx = { careCountry: 'IS', lang: 'pt-BR' as const };
  let view = catalogEntriesFor([cat], ctx, 'pregnant_person', []);
  assert.deepStrictEqual(view.routine.map((v) => v.entry.id), ['blood-early', 'scan-mid']);
  assert.deepStrictEqual(view.byIndication.map((v) => v.entry.id), ['extra']);
  assert.ok([...view.routine, ...view.byIndication].every((v) => !v.alreadyRecorded));
  // Bebê vê só os itens do bebê
  assert.deepStrictEqual(catalogEntriesFor([cat], ctx, 'baby', []).routine.map((v) => v.entry.id), ['heel']);
  // Item sem texto no idioma não aparece
  assert.deepStrictEqual(catalogEntriesFor([cat], { careCountry: 'IS', lang: 'en' }, 'pregnant_person', []).routine.map((v) => v.entry.id), ['blood-early']);
  // "Já registrado" vale para qualquer versão do mesmo item do mesmo catálogo
  const rec = createFromCatalog(cat, 'blood-early', { careCountry: 'IS', lang: 'pt-BR' }, 'pregnancy', NOW);
  cat.version = '2027.1';
  view = catalogEntriesFor([cat], ctx, 'pregnant_person', [rec]);
  assert.deepStrictEqual(view.routine.map((v) => [v.entry.id, v.alreadyRecorded]), [['blood-early', true], ['scan-mid', false]]);
  // Registro manual com o mesmo nome não conta como "já registrado"
  const manual = createManualHealthCheck({ subject: 'pregnant_person', phase: 'pregnancy', kind: 'prenatal_test', name: 'Ultrassom fictício' }, NOW);
  assert.strictEqual(catalogEntriesFor([cat], ctx, 'pregnant_person', [manual]).routine[1].alreadyRecorded, false);
});

test('Lista do país: nada aparece sem aprovação clínica, direitos, país correspondente ou país informado', () => {
  const hidden = [
    catalog('a', 'IS', { review: { status: 'source_based' } }),
    catalog('b', 'IS', { review: { status: 'pending_review' } }),
    catalog('c', 'IS', { rights: { status: 'pending' } }),
    catalog('d', 'IS', { suspendedReason: 'teste' }),
    catalog('e', 'KE')
  ];
  for (const subject of ['pregnant_person', 'baby'] as const) {
    const v = catalogEntriesFor(hidden, { careCountry: 'IS', lang: 'pt-BR' }, subject, []);
    assert.strictEqual(v.routine.length + v.byIndication.length, 0, subject);
    const none = catalogEntriesFor([catalog('ok', 'IS')], { careCountry: undefined, lang: 'pt-BR' }, subject, []);
    assert.strictEqual(none.routine.length + none.byIndication.length, 0);
  }
});
