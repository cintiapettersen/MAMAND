import { SupportedLanguage, UserProfile } from '../types';
import { TranslationDictionary } from './types';
import { ptBR } from './pt-BR';
import { en } from './en';

export const translations: Record<SupportedLanguage, TranslationDictionary> = {
  'pt-BR': ptBR,
  en
};

export const getLocalizedStageLabel = (
  profile: UserProfile,
  lang: SupportedLanguage,
  compact = false
): string => {
  const isEn = lang === 'en';
  if (profile.phase === 'pregnancy') {
    if (profile.stageValue <= 13) {
      if (compact) return isEn ? 'Early pregnancy' : 'Início da gestação';
      return isEn ? 'Early pregnancy (up to 13 weeks)' : 'Início da gestação (até 13 semanas)';
    }
    if (profile.stageValue <= 27) {
      if (compact) return isEn ? 'Mid-pregnancy' : 'Meio da gestação';
      return isEn ? 'Mid-pregnancy (14 to 27 weeks)' : 'Meio da gestação (14 a 27 semanas)';
    }
    if (compact) return isEn ? 'Final stretch' : 'Reta final';
    return isEn ? 'Final stretch (28 to 40+ weeks)' : 'Reta final (28 a 40 semanas ou mais)';
  }

  // Fase Bebê
  if (profile.stageValue === 0) {
    return isEn ? 'Newborn (first month)' : 'Recém-nascido (primeiro mês)';
  }
  if (profile.stageValue === 24) {
    return isEn ? 'Toddler (1 to 2 years)' : 'Criança de 1 a 2 anos';
  }
  return isEn
    ? `${profile.stageValue}-month-old baby`
    : `Bebê de ${profile.stageValue} meses`;
};

export * from './types';
export { ptBR, en };
