import { SupportedLanguage } from '../types';

// Números de emergência por país. Sem país informado, o app não mostra número nenhum:
// só orienta a ligar para o serviço de emergência local (nunca supõe o Brasil).
// Cada país só entra com fonte oficial conferida (sources/checkedOn). País sem fonte
// confirmada fica fora da lista e recebe a orientação genérica.
export interface EmergencyLine {
  number: string;
  label: { pt: string; en: string };
}

export interface EmergencyContact {
  code: string;
  name: { pt: string; en: string };
  // Emergência médica (ambulância)
  emergency: EmergencyLine;
  // Linha de saúde que não é emergência; o rótulo diz para que serve
  healthLine?: EmergencyLine;
  sources: string[];
  checkedOn: string; // AAAA-MM-DD
}

const EU_112 = 'https://europa.eu/youreurope/citizens/travel/security-and-emergencies/emergency/index_en.htm';
const CHECKED = '2026-11-02';

export const EMERGENCY_CONTACTS: EmergencyContact[] = [
  {
    code: 'BR',
    name: { pt: 'Brasil', en: 'Brazil' },
    emergency: { number: '192', label: { pt: 'SAMU 192', en: 'SAMU 192' } },
    healthLine: {
      number: '136',
      label: {
        pt: 'Disque Saúde 136: informações e ouvidoria do SUS (não é emergência)',
        en: 'Disque Saúde 136: Brazilian health ministry information line (not for emergencies)'
      }
    },
    sources: [
      'https://www.gov.br/saude/pt-br/assuntos/saude-de-a-a-z/s/samu-192',
      'https://www.gov.br/saude/pt-br/canais-de-atendimento/ouvsus'
    ],
    checkedOn: CHECKED
  },
  {
    code: 'PT',
    name: { pt: 'Portugal', en: 'Portugal' },
    emergency: { number: '112', label: { pt: '112', en: '112' } },
    healthLine: {
      number: '808242424',
      label: { pt: 'SNS 24 (808 24 24 24): aconselhamento de saúde (não é emergência)', en: 'SNS 24 (808 24 24 24): health advice line (not for emergencies)' }
    },
    sources: [EU_112, 'https://www.sns24.gov.pt/'],
    checkedOn: CHECKED
  },
  {
    code: 'US',
    name: { pt: 'Estados Unidos', en: 'United States' },
    emergency: { number: '911', label: { pt: '911', en: '911' } },
    sources: ['https://www.fcc.gov/general/9-1-1-and-e9-1-1-services'],
    checkedOn: CHECKED
  },
  {
    code: 'CA',
    name: { pt: 'Canadá', en: 'Canada' },
    emergency: { number: '911', label: { pt: '911', en: '911' } },
    sources: ['https://www.canada.ca/en/public-health/services/mental-health-services/mental-health-get-help.html'],
    checkedOn: CHECKED
  },
  {
    code: 'GB',
    name: { pt: 'Reino Unido', en: 'United Kingdom' },
    emergency: { number: '999', label: { pt: '999', en: '999' } },
    healthLine: { number: '111', label: { pt: 'NHS 111: ajuda médica que não é emergência', en: 'NHS 111: medical help when it is not an emergency' } },
    sources: ['https://www.nhs.uk/nhs-services/urgent-and-emergency-care-services/when-to-use-111/'],
    checkedOn: CHECKED
  },
  {
    code: 'IE',
    name: { pt: 'Irlanda', en: 'Ireland' },
    emergency: { number: '112', label: { pt: '112 ou 999', en: '112 or 999' } },
    sources: ['https://www.gov.ie/en/department-of-the-taoiseach/services/how-to-contact-emergency-services-in-ireland/'],
    checkedOn: CHECKED
  },
  {
    code: 'NO',
    name: { pt: 'Noruega', en: 'Norway' },
    // 113 é a emergência médica; 112 é a polícia e 110 os bombeiros
    emergency: { number: '113', label: { pt: '113', en: '113' } },
    healthLine: {
      number: '116117',
      label: { pt: 'Legevakt 116 117: atendimento médico fora do horário (não é emergência)', en: 'Legevakt 116 117: out-of-hours medical service (not for emergencies)' }
    },
    sources: ['https://www.helsenorge.no/en/help-services-in-the-municipalities/out-of-hours-medical-service/'],
    checkedOn: CHECKED
  },
  {
    code: 'SE',
    name: { pt: 'Suécia', en: 'Sweden' },
    emergency: { number: '112', label: { pt: '112', en: '112' } },
    healthLine: { number: '1177', label: { pt: '1177 Vårdguiden: aconselhamento de saúde (não é emergência)', en: '1177 Vårdguiden: health advice line (not for emergencies)' } },
    sources: [EU_112, 'https://www.1177.se/en/other-languages/other-languages/'],
    checkedOn: CHECKED
  },
  {
    code: 'DK',
    name: { pt: 'Dinamarca', en: 'Denmark' },
    emergency: { number: '112', label: { pt: '112', en: '112' } },
    sources: [EU_112],
    checkedOn: CHECKED
  },
  {
    code: 'FI',
    name: { pt: 'Finlândia', en: 'Finland' },
    emergency: { number: '112', label: { pt: '112', en: '112' } },
    sources: [EU_112],
    checkedOn: CHECKED
  },
  {
    code: 'DE',
    name: { pt: 'Alemanha', en: 'Germany' },
    emergency: { number: '112', label: { pt: '112', en: '112' } },
    sources: [EU_112],
    checkedOn: CHECKED
  },
  {
    code: 'FR',
    name: { pt: 'França', en: 'France' },
    // 15 é o SAMU (urgência médica); 112 também funciona
    emergency: { number: '15', label: { pt: 'SAMU 15 (ou 112)', en: 'SAMU 15 (or 112)' } },
    sources: ['https://www.masecurite.interieur.gouv.fr/fr/fiches-pratiques/famille-et-aides-aux-victimes/numeros-utiles-nationaux', EU_112],
    checkedOn: CHECKED
  },
  {
    code: 'ES',
    name: { pt: 'Espanha', en: 'Spain' },
    emergency: { number: '112', label: { pt: '112', en: '112' } },
    sources: [EU_112],
    checkedOn: CHECKED
  },
  {
    code: 'IT',
    name: { pt: 'Itália', en: 'Italy' },
    emergency: { number: '112', label: { pt: '112', en: '112' } },
    sources: [EU_112],
    checkedOn: CHECKED
  },
  {
    code: 'NL',
    name: { pt: 'Países Baixos', en: 'Netherlands' },
    emergency: { number: '112', label: { pt: '112', en: '112' } },
    sources: [EU_112],
    checkedOn: CHECKED
  },
  {
    code: 'AU',
    name: { pt: 'Austrália', en: 'Australia' },
    emergency: { number: '000', label: { pt: '000', en: '000' } },
    healthLine: {
      number: '1800022222',
      label: { pt: 'Healthdirect 1800 022 222: aconselhamento de saúde (não é emergência)', en: 'Healthdirect 1800 022 222: health advice line (not for emergencies)' }
    },
    sources: ['https://www.healthdirect.gov.au/'],
    checkedOn: CHECKED
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
