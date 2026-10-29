import { SupportedLanguage } from '../types';

// Números de emergência por país. Sem país informado, o app não mostra número nenhum:
// só orienta a ligar para o serviço de emergência local (nunca supõe o Brasil).
export interface EmergencyLine {
  number: string;
  label: { pt: string; en: string };
}

export interface EmergencyContact {
  code: string;
  name: { pt: string; en: string };
  emergency: EmergencyLine;
  healthLine?: EmergencyLine;
}

export const EMERGENCY_CONTACTS: EmergencyContact[] = [
  {
    code: 'BR',
    name: { pt: 'Brasil', en: 'Brazil' },
    emergency: { number: '192', label: { pt: 'SAMU 192', en: 'SAMU 192' } },
    healthLine: { number: '136', label: { pt: 'Disque Saúde 136', en: 'Disque Saúde 136 (health line)' } }
  },
  {
    code: 'PT',
    name: { pt: 'Portugal', en: 'Portugal' },
    emergency: { number: '112', label: { pt: '112', en: '112' } },
    healthLine: { number: '808242424', label: { pt: 'SNS 24 (808 24 24 24)', en: 'SNS 24 (808 24 24 24)' } }
  },
  {
    code: 'US',
    name: { pt: 'Estados Unidos', en: 'United States' },
    emergency: { number: '911', label: { pt: '911', en: '911' } }
  },
  {
    code: 'CA',
    name: { pt: 'Canadá', en: 'Canada' },
    emergency: { number: '911', label: { pt: '911', en: '911' } }
  },
  {
    code: 'GB',
    name: { pt: 'Reino Unido', en: 'United Kingdom' },
    emergency: { number: '999', label: { pt: '999', en: '999' } },
    healthLine: { number: '111', label: { pt: 'NHS 111', en: 'NHS 111' } }
  },
  {
    code: 'IE',
    name: { pt: 'Irlanda', en: 'Ireland' },
    emergency: { number: '112', label: { pt: '112 ou 999', en: '112 or 999' } }
  },
  {
    code: 'NO',
    name: { pt: 'Noruega', en: 'Norway' },
    emergency: { number: '113', label: { pt: '113 (ambulância)', en: '113 (ambulance)' } },
    healthLine: { number: '116117', label: { pt: 'Legevakt 116 117', en: 'Legevakt 116 117' } }
  },
  {
    code: 'SE',
    name: { pt: 'Suécia', en: 'Sweden' },
    emergency: { number: '112', label: { pt: '112', en: '112' } },
    healthLine: { number: '1177', label: { pt: '1177 Vårdguiden', en: '1177 Vårdguiden' } }
  },
  {
    code: 'DK',
    name: { pt: 'Dinamarca', en: 'Denmark' },
    emergency: { number: '112', label: { pt: '112', en: '112' } }
  },
  {
    code: 'FI',
    name: { pt: 'Finlândia', en: 'Finland' },
    emergency: { number: '112', label: { pt: '112', en: '112' } }
  },
  {
    code: 'DE',
    name: { pt: 'Alemanha', en: 'Germany' },
    emergency: { number: '112', label: { pt: '112', en: '112' } }
  },
  {
    code: 'FR',
    name: { pt: 'França', en: 'France' },
    emergency: { number: '112', label: { pt: '112 (ou 15, SAMU)', en: '112 (or 15, SAMU)' } }
  },
  {
    code: 'ES',
    name: { pt: 'Espanha', en: 'Spain' },
    emergency: { number: '112', label: { pt: '112', en: '112' } }
  },
  {
    code: 'IT',
    name: { pt: 'Itália', en: 'Italy' },
    emergency: { number: '112', label: { pt: '112', en: '112' } }
  },
  {
    code: 'NL',
    name: { pt: 'Países Baixos', en: 'Netherlands' },
    emergency: { number: '112', label: { pt: '112', en: '112' } }
  },
  {
    code: 'AU',
    name: { pt: 'Austrália', en: 'Australia' },
    emergency: { number: '000', label: { pt: '000', en: '000' } },
    healthLine: { number: '1800022222', label: { pt: 'Healthdirect 1800 022 222', en: 'Healthdirect 1800 022 222' } }
  }
];

export const getEmergencyContact = (code?: string): EmergencyContact | null =>
  EMERGENCY_CONTACTS.find((c) => c.code === code) || null;

export const langKey = (lang: SupportedLanguage): 'pt' | 'en' => (lang === 'en' ? 'en' : 'pt');

// Sugere o país pela região do idioma do aparelho (ex.: pt-BR → BR, nb-NO → NO).
// É só uma sugestão no onboarding: a usuária confirma ou troca.
export const detectCountryFromDevice = (): string => {
  try {
    const locales = typeof navigator !== 'undefined' ? navigator.languages || [navigator.language] : [];
    for (const locale of locales) {
      const region = locale.split('-')[1]?.toUpperCase();
      if (region && getEmergencyContact(region)) return region;
    }
  } catch {
    // Sem acesso ao idioma do aparelho: nenhuma sugestão
  }
  return '';
};

export const getCountryOptions = (lang: SupportedLanguage) =>
  [...EMERGENCY_CONTACTS]
    .map((c) => ({ code: c.code, name: c.name[langKey(lang)] }))
    .sort((a, b) => a.name.localeCompare(b.name, lang));
