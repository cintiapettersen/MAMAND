import { ISO_3166_1_ALPHA2 } from '../data/isoCountries.ts';

// País identificado por código ISO 3166-1 alfa-2, em duas letras maiúsculas.
export type IsoCountry = string;

const OFFICIAL = new Set(ISO_3166_1_ALPHA2);

// Normaliza a grafia (" xa" → "XA"). Não valida: serve para comparar códigos.
export function normalizeCountryCode(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const code = value.trim().toUpperCase();
  return /^[A-Z]{2}$/.test(code) ? code : undefined;
}

// Só códigos oficialmente atribuídos: é o que o perfil aceita.
export function isIsoCountry(value: unknown): value is IsoCountry {
  const code = normalizeCountryCode(value);
  return code !== undefined && code === value && OFFICIAL.has(code);
}

export function toIsoCountry(value: unknown): IsoCountry | undefined {
  const code = normalizeCountryCode(value);
  return code && OFFICIAL.has(code) ? code : undefined;
}
