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

  // Fase Bebê: sem data de nascimento, o perfil guarda só a faixa escolhida no cadastro
  // (0, 2, 6, 12 ou 24), e o rótulo mostra a faixa inteira, como nas opções do cadastro.
  // A forma compacta (cabeçalho, ao lado do 👶 e do nome) é curta para caber em 320 px;
  // a completa entra em frases ("Orientações práticas para…", "guidance for a baby…").
  const range = BABY_STAGE_RANGES[profile.stageValue];
  if (range) {
    if (isEn) return compact ? range.enCompact : range.en;
    return compact ? range.ptCompact : range.pt;
  }

  // Valor fora das faixas (perfis antigos ou importados): o número exato, no singular ou plural
  const months = profile.stageValue;
  if (isEn) {
    const label = `${months}-month-old baby`;
    return compact ? label : `a ${label}`;
  }
  return months === 1 ? 'Bebê de 1 mês' : `Bebê de ${months} meses`;
};

const BABY_STAGE_RANGES: Record<number, { ptCompact: string; pt: string; enCompact: string; en: string }> = {
  0: { ptCompact: 'Recém-nascido (primeiro mês)', pt: 'Recém-nascido (primeiro mês)', enCompact: 'Newborn (first month)', en: 'Newborn (first month)' },
  2: { ptCompact: '2 a 3 meses', pt: 'Bebê de 2 a 3 meses', enCompact: '2 to 3 months old', en: 'a baby aged 2 to 3 months' },
  6: { ptCompact: '4 a 6 meses', pt: 'Bebê de 4 a 6 meses', enCompact: '4 to 6 months old', en: 'a baby aged 4 to 6 months' },
  12: { ptCompact: '7 a 12 meses', pt: 'Bebê de 7 a 12 meses', enCompact: '7 to 12 months old', en: 'a baby aged 7 to 12 months' },
  24: { ptCompact: 'Criança de 1 a 2 anos', pt: 'Criança de 1 a 2 anos', enCompact: 'Toddler (1 to 2 years)', en: 'Toddler (1 to 2 years)' }
};

export * from './types';
export { ptBR, en };
