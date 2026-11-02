import type { JourneyRecord, RecordSubject, SupportedLanguage } from '../types/index.ts';
import type { TranslationDictionary } from '../locales/types.ts';
import { MILESTONE_KEYS, validateHealthCheckRecord, type HealthCheckRecord, type HealthCheckSubject } from './healthChecks.ts';
import { countryName } from './countryNames.ts';
import { displayTag } from './journeyTags.ts';
import { formatRecordDateAbsolute } from './recordDate.ts';

// Resumo em texto da Jornada para ler, imprimir ou levar à consulta. Gerado no aparelho,
// sem envio a servidores. Mostra só o que a família registrou: sem interpretação de
// resultados e sem deduzir uma etapa a partir de outra. As anotações livres só entram
// quando a família escolhe incluí-las.

export interface JourneySummaryInput {
  records: JourneyRecord[];
  healthChecks: HealthCheckRecord[];
  lang: SupportedLanguage;
  t: Pick<TranslationDictionary, 'journeySummary' | 'healthChecks' | 'journey'>;
  stageLabel: string;
  includeNotes: boolean;
  exportDate: Date;
}

const RULE = '------------------------------------------------------------';
const JOURNEY_SUBJECTS: RecordSubject[] = ['baby', 'mom', 'memory'];
const HEALTH_SUBJECTS: HealthCheckSubject[] = ['pregnant_person', 'baby'];

// AAAA-MM-DD sem passar pelo fuso horário, para a data não mudar de dia
const formatIsoDate = (iso: string, lang: SupportedLanguage) => {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString(lang === 'en' ? 'en-GB' : 'pt-BR', {
    day: '2-digit',
    month: lang === 'en' ? 'short' : '2-digit',
    year: 'numeric',
    timeZone: 'UTC'
  });
};

// Anotações com várias linhas continuam recuadas, para não se confundirem com outro campo
const quoteNote = (note: string, indent: string) => `"${note.replace(/\r\n?/g, '\n').trim().split('\n').join(`\n${indent}  `)}"`;

// Mais recentes primeiro, como na tela
const healthSortKey = (r: HealthCheckRecord) => {
  const dates = MILESTONE_KEYS.map((k) => r.milestones[k]?.on).filter((d): d is string => !!d).sort();
  return dates.length ? dates[dates.length - 1] : r.createdAt.slice(0, 10);
};

function journeySection(input: JourneySummaryInput): string[] {
  const { t, lang, includeNotes } = input;
  const s = t.journeySummary;
  const records = input.records
    .filter((r) => JOURNEY_SUBJECTS.includes(r.subject))
    .sort((a, b) => b.eventDate.localeCompare(a.eventDate) || b.timestamp.localeCompare(a.timestamp));
  const lines = [s.journeyTitle, s.count(records.length), ''];
  if (records.length === 0) return [...lines, s.empty, ''];

  records.forEach((rec, idx) => {
    lines.push(`[${idx + 1}] ${s.dateLabel}: ${formatRecordDateAbsolute(rec, lang)} | ${s.typeLabel}: ${t.journey.subjectOptions[rec.subject]}`);
    if (rec.tags?.length) lines.push(`    ${s.tagsLabel}: ${rec.tags.map((tag) => displayTag(tag, lang)).join(', ')}`);
    if (rec.sourceActivityTitle) lines.push(`    ${s.practicedLabel}: ${rec.sourceActivityTitle}`);
    if (includeNotes && rec.note?.trim()) lines.push(`    ${s.noteLabel}: ${quoteNote(rec.note, '    ')}`);
    lines.push('');
  });
  return lines;
}

function healthCheckLines(r: HealthCheckRecord, input: JourneySummaryInput): string[] {
  const { t, lang, includeNotes } = input;
  const s = t.journeySummary;
  const h = t.healthChecks;
  const period = [h.phases[r.phase]];
  if (r.gestationalWeek !== undefined) period.push(h.weekShort(r.gestationalWeek));
  if (r.babyAgeDays !== undefined) period.push(s.babyAgeDays(r.babyAgeDays));

  const lines = [`• ${r.name}`, `  ${h.kindLabel}: ${h.kinds[r.kind]} | ${h.phaseLabel}: ${period.join(', ')}`];

  // Só as etapas marcadas, cada uma com a própria data; nenhuma é deduzida das outras
  const marked = MILESTONE_KEYS.filter((k) => r.milestones[k]);
  if (marked.length === 0) lines.push(`  ${s.stepsTitle}: ${h.noMilestones}`);
  else {
    lines.push(`  ${s.stepsTitle}:`);
    for (const k of marked) {
      const on = r.milestones[k]?.on;
      lines.push(`    - ${h.milestones[k]}: ${on ? formatIsoDate(on, lang) : s.noDate}`);
    }
  }

  const care = countryName(r.careCountry, lang);
  if (care) lines.push(`  ${h.careCountryOnRecord(care)}`);
  if (r.origin.kind === 'catalog') {
    lines.push(`  ${h.fromCatalog(countryName(r.origin.country, lang) ?? r.origin.country, r.origin.catalogVersion)}`);
  }
  if (includeNotes && r.personalNote?.trim()) lines.push(`  ${s.noteLabel}: ${quoteNote(r.personalNote, '  ')}`);
  return lines;
}

function healthChecksSection(input: JourneySummaryInput): string[] {
  const s = input.t.journeySummary;
  const h = input.t.healthChecks;
  // Registros que não passam na validação ficam de fora e são contados, sem tentar corrigi-los
  const valid: HealthCheckRecord[] = [];
  let skipped = 0;
  for (const r of input.healthChecks) {
    if (validateHealthCheckRecord(r).valid) valid.push(r);
    else skipped++;
  }

  const lines = [s.healthChecksTitle, s.healthChecksIntro, ''];
  for (const subject of HEALTH_SUBJECTS) {
    const group = valid
      .filter((r) => r.subject === subject)
      .sort((a, b) => healthSortKey(b).localeCompare(healthSortKey(a)) || b.createdAt.localeCompare(a.createdAt));
    const title = subject === 'pregnant_person' ? h.subjectPregnancy : h.subjectBaby;
    lines.push(`${title.toUpperCase()} (${s.count(group.length)})`);
    if (group.length === 0) lines.push(s.empty);
    group.forEach((r) => lines.push(...healthCheckLines(r, input), ''));
    if (group.length === 0) lines.push('');
  }
  if (skipped > 0) lines.push(s.skippedInvalid(skipped), '');
  return lines;
}

export function buildJourneyTextSummary(input: JourneySummaryInput): string {
  const s = input.t.journeySummary;
  const exportDate = input.exportDate.toLocaleDateString(input.lang === 'en' ? 'en-GB' : 'pt-BR', {
    day: '2-digit',
    month: input.lang === 'en' ? 'short' : '2-digit',
    year: 'numeric'
  });
  const lines = [
    s.title,
    s.familyReported,
    s.notOfficial,
    '',
    s.exportDate(exportDate),
    `${s.currentStage}: ${input.stageLabel}`,
    input.includeNotes ? s.notesIncluded : s.notesExcluded,
    RULE,
    '',
    ...journeySection(input),
    RULE,
    '',
    ...healthChecksSection(input),
    RULE,
    s.familyReported,
    s.notOfficial
  ];
  return `${lines.join('\n')}\n`;
}

export const journeySummaryFilename = (prefix: string, isoDate: string) => `${prefix}_${isoDate}.txt`;
