import type { ContentReviewStatus, SupportedLanguage } from '../types/index.ts';
import { normalizeCountryCode, toIsoCountry, type IsoCountry } from './countries.ts';

// Classificação geográfica e regra única de uso dos conteúdos de saúde.
// A regra só compara o código do conteúdo com o país de acompanhamento do perfil;
// nenhum país tem tratamento próprio. Veja docs/arquitetura/jurisdicao-das-evidencias.md.

export type ContentScope =
  | { kind: 'international' }
  | { kind: 'country'; countries: IsoCountry[] };

// none: informação geral; partial: parte depende da equipe de saúde;
// required: só avaliação individual responde (o app não oferece o conteúdo)
export type IndividualAssessment = 'none' | 'partial' | 'required';

export interface SourceRef {
  publisher: string;
  title: string;
  edition?: string;
  pages?: string;
  url?: string;
  publishedOn?: string;
  sourceUpdatedOn?: string;
  accessedOn: string;
  license?: string;
}

export interface ContentReview {
  status: ContentReviewStatus;
  reviewedOn?: string;
  // Referência do registro de revisão, sem dados pessoais no código
  reviewerRef?: string;
  notes?: string;
}

// Direito de uso do texto derivado das fontes; sem confirmação, o conteúdo não é usado
export interface UsageRights {
  status: 'confirmed' | 'pending';
  notes?: string;
}

export interface ContentMeta {
  scope: ContentScope;
  individualAssessment: IndividualAssessment;
  sources: SourceRef[];
  version: string;
  review: ContentReview;
  rights: UsageRights;
  languages: SupportedLanguage[];
  suspendedReason?: string;
}

export interface UsageContext {
  careCountry?: IsoCountry;
  lang?: SupportedLanguage;
}

// Status que permite uso nas respostas educativas atuais (C10). `source_based` é
// fundamentação documental, não aprovação clínica.
const STATUS_ELIGIBLE: ReadonlySet<ContentReviewStatus> = new Set(['source_based', 'clinically_reviewed']);

export function isStatusEligible(meta: Pick<ContentMeta, 'review' | 'suspendedReason'>): boolean {
  return !meta.suspendedReason && STATUS_ELIGIBLE.has(meta.review.status);
}

export function scopeMatches(scope: ContentScope, careCountry?: IsoCountry): boolean {
  if (scope.kind === 'international') return true;
  const country = normalizeCountryCode(careCountry);
  return country !== undefined && scope.countries.some((c) => normalizeCountryCode(c) === country);
}

export type UnusableReason =
  | 'status'
  | 'rights'
  | 'individual_assessment'
  | 'other_country'
  | 'no_care_country'
  | 'language';

export function usability(meta: ContentMeta, ctx: UsageContext): { usable: true } | { usable: false; reason: UnusableReason } {
  if (!isStatusEligible(meta)) return { usable: false, reason: 'status' };
  if (meta.rights.status !== 'confirmed') return { usable: false, reason: 'rights' };
  if (meta.individualAssessment === 'required') return { usable: false, reason: 'individual_assessment' };
  if (!scopeMatches(meta.scope, ctx.careCountry)) {
    return { usable: false, reason: ctx.careCountry ? 'other_country' : 'no_care_country' };
  }
  if (ctx.lang && !meta.languages.includes(ctx.lang)) return { usable: false, reason: 'language' };
  return { usable: true };
}

export function isUsable(meta: ContentMeta, ctx: UsageContext): boolean {
  return usability(meta, ctx).usable;
}

// Sem substituição: se o item mais relevante não puder ser usado (outro país, status,
// direitos), não se responde com o seguinte da lista. Devolve vazio e o motivo.
export function selectWithoutSubstitution<T>(
  ranked: T[],
  metaOf: (item: T) => ContentMeta,
  ctx: UsageContext
): { items: T[]; blockedBy?: UnusableReason } {
  if (ranked.length === 0) return { items: [] };
  const top = usability(metaOf(ranked[0]), ctx);
  if (!top.usable) return { items: [], blockedBy: top.reason };
  return { items: ranked.filter((item) => isUsable(metaOf(item), ctx)) };
}

// Leitura do campo antigo `countryJurisdiction` das evidências, sem alterar o catálogo.
// GLOBAL e WHO viram internacionais; um código ISO vira daquele país; o resto não vale para ninguém.
export function scopeFromLegacyJurisdiction(value: unknown): ContentScope {
  if (value === 'GLOBAL' || value === 'WHO') return { kind: 'international' };
  const country = toIsoCountry(value);
  return { kind: 'country', countries: country ? [country] : [] };
}
