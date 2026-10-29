import type { SupportedLanguage } from '../types/index.ts';

/**
 * Calcula a quantidade exata de dias de vida desde o nascimento até a data de referência.
 */
export const calculateDaysOfLife = (birthDateStr: string, refDate = new Date()): number => {
  try {
    const [y, m, d] = birthDateStr.split('-').map(Number);
    const birth = new Date(y, m - 1, d);
    const ref = new Date(refDate.getFullYear(), refDate.getMonth(), refDate.getDate());
    const diffMs = ref.getTime() - birth.getTime();
    return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
  } catch {
    return 0;
  }
};

/**
 * Calcula a idade em meses completos para calibração do motor de recomendações (ruleEngine).
 */
export const calculateAgeInMonths = (birthDateStr: string, refDate = new Date()): number => {
  try {
    const [y, m, d] = birthDateStr.split('-').map(Number);
    const birth = new Date(y, m - 1, d);
    const ref = new Date(refDate.getFullYear(), refDate.getMonth(), refDate.getDate());

    let months = (ref.getFullYear() - birth.getFullYear()) * 12 + (ref.getMonth() - birth.getMonth());
    if (ref.getDate() < birth.getDate()) {
      months--;
    }
    // Idade não negativa e com limite máximo razoável de 24 meses (catálogo dos 1.000 dias)
    return Math.max(0, Math.min(24, months));
  } catch {
    return 0;
  }
};

/**
 * Retorna uma formatação amigável e acolhedora dos dias e meses de vida do bebê.
 */
export const formatBabyAgeDetailed = (
  birthDateStr: string,
  lang: SupportedLanguage = 'pt-BR',
  refDate = new Date()
): string => {
  const days = calculateDaysOfLife(birthDateStr, refDate);
  const months = calculateAgeInMonths(birthDateStr, refDate);
  const isEn = lang === 'en';

  if (days === 0) {
    return isEn ? 'Born today' : 'Nasceu hoje';
  }
  if (days === 1) {
    return isEn ? '1 day old' : '1 dia de vida';
  }
  if (days < 30) {
    return isEn ? `${days} days old` : `${days} dias de vida`;
  }

  // Mais de 30 dias: exibe dias e meses de forma limpa e compacta
  if (months === 1) {
    return isEn ? `${days} days old (1 month)` : `${days} dias de vida (1 mês)`;
  }
  return isEn
    ? `${days} days old (${months} months)`
    : `${days} dias de vida (${months} meses)`;
};

/**
 * Formata a data prevista do parto (DPP) para gestantes de forma delicada.
 */
export const formatDueDate = (
  dueDateStr: string,
  lang: SupportedLanguage = 'pt-BR'
): string => {
  try {
    const [y, m, d] = dueDateStr.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    const formatter = new Intl.DateTimeFormat(lang === 'en' ? 'en-US' : 'pt-BR', {
      day: 'numeric',
      month: 'short'
    });
    const formatted = formatter.format(date).replace(/\./g, '');
    return lang === 'en' ? `Due: ${formatted}` : `DPP: ${formatted}`;
  } catch {
    return '';
  }
};
