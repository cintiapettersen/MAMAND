import type { SupportedLanguage } from '../types/index.ts';

const pad2 = (n: number) => String(n).padStart(2, '0');
const toIso = (d: Date) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;

const isRealIsoDate = (v: string) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return false;
  const [y, m, d] = v.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  return dt.getFullYear() === y && dt.getMonth() === m - 1 && dt.getDate() === d;
};

/**
 * Calcula a quantidade exata de dias de vida desde o nascimento até a data de referência.
 * Retorna -1 para datas futuras ou formatos inválidos (nunca converte data futura em zero).
 */
export const calculateDaysOfLife = (birthDateStr: string, refDate = new Date()): number => {
  try {
    if (!birthDateStr || !isRealIsoDate(birthDateStr)) return -1;
    const [y, m, d] = birthDateStr.split('-').map(Number);
    const birth = new Date(y, m - 1, d);
    const ref = new Date(refDate.getFullYear(), refDate.getMonth(), refDate.getDate());
    const diffMs = ref.getTime() - birth.getTime();
    if (diffMs < 0) return -1; // Nascimento no futuro: idade negativa inválida
    return Math.floor(diffMs / (1000 * 60 * 60 * 24));
  } catch {
    return -1;
  }
};

/**
 * Calcula a idade em meses completos para calibração do motor de recomendações (ruleEngine).
 */
export const calculateAgeInMonths = (birthDateStr: string, refDate = new Date()): number => {
  const months = completedMonths(birthDateStr, refDate);
  if (months < 0) return 0;
  // Limite máximo razoável de 24 meses (catálogo dos 1.000 dias)
  return Math.min(24, months);
};

// Meses completos sem o limite de 24, só para exibir a idade
const completedMonths = (birthDateStr: string, refDate: Date): number => {
  try {
    if (!birthDateStr || !isRealIsoDate(birthDateStr)) return -1;
    const [y, m, d] = birthDateStr.split('-').map(Number);
    const birth = new Date(y, m - 1, d);
    const ref = new Date(refDate.getFullYear(), refDate.getMonth(), refDate.getDate());
    if (ref.getTime() < birth.getTime()) return -1;

    let months = (ref.getFullYear() - birth.getFullYear()) * 12 + (ref.getMonth() - birth.getMonth());
    if (ref.getDate() < birth.getDate()) {
      months--;
    }
    return Math.max(0, months);
  } catch {
    return -1;
  }
};

/**
 * Retorna uma formatação amigável e acolhedora dos dias e meses de vida do bebê.
 * NUNCA converte data futura em "Nasceu hoje": retorna vazio se for futura ou inválida.
 */
export const formatBabyAgeDetailed = (
  birthDateStr: string,
  lang: SupportedLanguage = 'pt-BR',
  refDate = new Date()
): string => {
  // Rejeição imediata de datas inválidas ou futuras
  if (!birthDateStr || validateBirthDate(birthDateStr, refDate)) {
    return '';
  }

  const days = calculateDaysOfLife(birthDateStr, refDate);
  const months = completedMonths(birthDateStr, refDate);
  if (days < 0 || months < 0) {
    return '';
  }

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

  // Mais de 30 dias: exibe dias e meses de forma limpa e compacta. Antes de completar o
  // primeiro mês (30 dias, por exemplo), mostra só os dias, sem "(0 meses)".
  if (months === 0) {
    return isEn ? `${days} days old` : `${days} dias de vida`;
  }
  if (months === 1) {
    return isEn ? `${days} days old (1 month)` : `${days} dias de vida (1 mês)`;
  }
  return isEn
    ? `${days} days old (${months} months)`
    : `${days} dias de vida (${months} meses)`;
};

// Limites das datas do perfil, no fuso local. Evitam anos digitados errado (0202) e datas
// impossíveis: nascimento no futuro ou há mais de 5 anos; DPP a mais de 10 meses ou que
// passou há mais de 6 semanas.
const BIRTH_MAX_YEARS = 5;
const DUE_MAX_DAYS_AHEAD = 300;
const DUE_MAX_DAYS_PAST = 42;

const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);

export const birthDateBounds = (today = new Date()) => ({
  min: toIso(new Date(today.getFullYear() - BIRTH_MAX_YEARS, today.getMonth(), today.getDate())),
  max: toIso(today)
});

export const dueDateBounds = (today = new Date()) => ({
  min: toIso(addDays(today, -DUE_MAX_DAYS_PAST)),
  max: toIso(addDays(today, DUE_MAX_DAYS_AHEAD))
});

export type BirthDateError = 'invalid' | 'future' | 'tooOld';
export type DueDateError = 'invalid' | 'tooFar' | 'tooLongAgo';

// Data vazia é válida (o campo é opcional)
export const validateBirthDate = (value: string, today = new Date()): BirthDateError | null => {
  if (!value) return null;
  if (!isRealIsoDate(value)) return 'invalid';
  const { min, max } = birthDateBounds(today);
  if (value > max) return 'future';
  if (value < min) return 'tooOld';
  return null;
};

export const validateDueDate = (value: string, today = new Date()): DueDateError | null => {
  if (!value) return null;
  if (!isRealIsoDate(value)) return 'invalid';
  const { min, max } = dueDateBounds(today);
  if (value > max) return 'tooFar';
  if (value < min) return 'tooLongAgo';
  return null;
};

export const isDueDatePast = (dueDateStr: string, today = new Date()) =>
  isRealIsoDate(dueDateStr) && dueDateStr < toIso(today);

/**
 * Formata a data prevista do parto (DPP) para gestantes de forma delicada. Se a data já
 * passou, diz isso, sem presumir que o bebê nasceu.
 */
export const formatDueDate = (
  dueDateStr: string,
  lang: SupportedLanguage = 'pt-BR',
  today = new Date()
): string => {
  try {
    const [y, m, d] = dueDateStr.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    const formatter = new Intl.DateTimeFormat(lang === 'en' ? 'en-US' : 'pt-BR', {
      day: 'numeric',
      month: 'short'
    });
    const formatted = formatter.format(date).replace(/\./g, '');
    if (isDueDatePast(dueDateStr, today)) {
      return lang === 'en' ? `Past due: ${formatted}` : `DPP passou: ${formatted}`;
    }
    return lang === 'en' ? `Due: ${formatted}` : `DPP: ${formatted}`;
  } catch {
    return '';
  }
};
