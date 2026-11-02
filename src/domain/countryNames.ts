import type { SupportedLanguage } from '../types/index.ts';
import { ISO_3166_1_ALPHA2 } from '../data/isoCountries.ts';
import { toIsoCountry } from './countries.ts';

// Nomes dos países no idioma do app (Intl.DisplayNames), sem tradução manual
export function countryName(code: string | undefined, lang: SupportedLanguage): string | undefined {
  const iso = toIsoCountry(code);
  if (!iso) return undefined;
  try {
    return new Intl.DisplayNames([lang], { type: 'region' }).of(iso) ?? iso;
  } catch {
    return iso;
  }
}

export function getAllCountryOptions(lang: SupportedLanguage): Array<{ code: string; name: string }> {
  const collator = new Intl.Collator(lang);
  return ISO_3166_1_ALPHA2.map((code) => ({ code, name: countryName(code, lang) ?? code })).sort((a, b) =>
    collator.compare(a.name, b.name)
  );
}
