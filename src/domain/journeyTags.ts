import type { SupportedLanguage } from '../types/index.ts';
import { ptBR } from '../locales/pt-BR.ts';
import { en } from '../locales/en.ts';

// Marcações da Jornada são gravadas como texto, no idioma em uso no momento do registro
// (por exemplo "Mood: Autopilot"). Aqui ficam os pares conhecidos em pt e en, para mostrar
// cada marcação no idioma atual sem alterar os dados gravados. Marcações desconhecidas
// (inclusive as escritas pela família) aparecem como foram gravadas.

interface TagPair {
  pt: string;
  en: string;
  // Textos antigos da mesma marcação, mostrados com o texto atual
  aliases?: string[];
}

const TAG_PAIRS: TagPair[] = [
  // Check-in da mãe
  { pt: 'Humor: Serena', en: 'Mood: Serene' },
  { pt: 'Humor: No piloto automático', en: 'Mood: Autopilot', aliases: ['Humor: Piloto automático'] },
  { pt: 'Humor: Cansada', en: 'Mood: Tired' },
  { pt: 'Humor: Sensível', en: 'Mood: Sensitive' },
  { pt: 'Humor: Tranquila', en: 'Mood: Balanced' },
  // Check-in do bebê
  { pt: 'Bebê: Calmo', en: 'Baby: Calm' },
  { pt: 'Bebê: Curioso', en: 'Baby: Curious' },
  { pt: 'Bebê: Sonolento', en: 'Baby: Sleepy' },
  { pt: 'Bebê: Pedindo colo', en: 'Baby: Needing comfort' },
  // Consulta de saúde (Mãe e Bebê)
  { pt: ptBR.journey.appointment.tag, en: en.journey.appointment.tag },
  // Marcação antiga do bebê, substituída por "Consulta de saúde"; registros antigos continuam iguais
  { pt: 'Teve consulta ou vacina', en: 'Had a checkup or vaccine' },
];

// Marcações do formulário "Novo registro": mesma posição nas listas pt e en
for (const key of ['babyTags', 'momTags'] as const) {
  ptBR.journey[key].forEach((item, i) => {
    const other = en.journey[key][i];
    if (other) TAG_PAIRS.push({ pt: item.tag, en: other.tag });
  });
}

const BY_TEXT = new Map<string, TagPair>();
for (const pair of TAG_PAIRS) {
  for (const text of [pair.pt, pair.en, ...(pair.aliases ?? [])]) BY_TEXT.set(text, pair);
}

export const KNOWN_TAG_PAIRS: ReadonlyArray<Readonly<TagPair>> = TAG_PAIRS;

export function displayTag(tag: string, lang: SupportedLanguage): string {
  const pair = BY_TEXT.get(tag);
  if (!pair) return tag;
  return lang === 'en' ? pair.en : pair.pt;
}

// Duas marcações são a mesma se forem o mesmo texto ou variantes conhecidas da mesma marcação
export function sameTag(a: string, b: string): boolean {
  if (a === b) return true;
  const pa = BY_TEXT.get(a);
  return !!pa && pa === BY_TEXT.get(b);
}
