import type { ContentItem } from '../types/index.ts';

// Biblioteca de Cuidados: em produção, o texto completo e as ideias práticas só aparecem
// para conteúdos com revisão profissional registrada. Hoje nenhum tem, então a demonstração
// pública mostra título, tema, situação da revisão e fonte, sem instruções para seguir.
// No desenvolvimento local o texto continua visível, para a revisão. Os dados e a estrutura
// da biblioteca não mudam.

export function resolveCareFullTextEnabled(env: { DEV?: boolean }): boolean {
  return env.DEV === true;
}

export const CARE_FULL_TEXT_ENABLED = resolveCareFullTextEnabled((import.meta as any).env ?? {});

export function isContentAuthorizedForPublication(
  item: Pick<
    ContentItem,
    'validationStatus' | 'clinicalReview' | 'publicationAllowed' | 'suspendedReason' | 'clinicalApprovalStatus'
  > & { educationalText?: string }
): boolean {
  if (item.suspendedReason) return false;
  if (item.clinicalApprovalStatus === 'rejected') return false;
  if (item.educationalText !== undefined && item.educationalText.trim() === '') return false;
  return (
    item.validationStatus === 'clinically_reviewed' &&
    !!item.clinicalReview &&
    item.publicationAllowed === true
  );
}

export function canShowCareInstructions(
  item: Pick<
    ContentItem,
    'validationStatus' | 'clinicalReview' | 'publicationAllowed' | 'suspendedReason' | 'clinicalApprovalStatus'
  > & { educationalText?: string },
  fullTextEnabled = CARE_FULL_TEXT_ENABLED
): boolean {
  // Itens suspensos ou rejeitados nunca podem ser exibidos em nenhuma circunstância
  if (item.suspendedReason) return false;
  if (item.clinicalApprovalStatus === 'rejected') return false;
  // Sem texto, não há instruções para mostrar
  if (item.educationalText !== undefined && item.educationalText.trim() === '') return false;
  if (fullTextEnabled) return true;
  return isContentAuthorizedForPublication(item);
}
