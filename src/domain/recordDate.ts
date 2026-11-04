import type { JourneyRecord, SupportedLanguage } from '../types/index.ts';

// Data mostrada para cada registro da Jornada, calculada na exibição. O texto gravado em
// `dateLabel` ("Hoje, 10:30", "Today, 09:00") fica preso ao idioma e ao dia em que foi
// criado; aqui ele só é usado quando não há data válida. Os dados gravados não mudam.
//
// - Registro do próprio momento (a data do acontecimento é a do dia em que foi criado):
//   data e hora do `timestamp`, no fuso local do aparelho.
// - Registro de outro dia ("Ontem" ou "Outra data"): só a data do acontecimento, sem hora,
//   porque o `timestamp` é a hora em que a família registrou, não a do acontecimento.

export interface RecordMoment {
  date: string; // AAAA-MM-DD, no fuso local
  time?: string; // HH:mm, no fuso local
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const pad = (n: number) => String(n).padStart(2, '0');
export const localDate = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

const isValidIsoDate = (v: unknown): v is string => {
  if (typeof v !== 'string' || !ISO_DATE.test(v)) return false;
  const [y, m, d] = v.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  return dt.getFullYear() === y && dt.getMonth() === m - 1 && dt.getDate() === d;
};

const parseTimestamp = (v: unknown): Date | null => {
  if (typeof v !== 'string' || v.trim() === '') return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
};

export function recordMoment(rec: Pick<JourneyRecord, 'eventDate' | 'timestamp'>): RecordMoment | null {
  const ts = parseTimestamp(rec.timestamp);
  const eventOk = isValidIsoDate(rec.eventDate);
  // Versões antigas gravavam a data do dia em UTC; vale qualquer uma das duas leituras
  if (ts && (!eventOk || rec.eventDate === localDate(ts) || rec.eventDate === ts.toISOString().slice(0, 10))) {
    return { date: localDate(ts), time: `${pad(ts.getHours())}:${pad(ts.getMinutes())}` };
  }
  if (eventOk) return { date: rec.eventDate };
  return null;
}

const locale = (lang: SupportedLanguage) => (lang === 'en' ? 'en-GB' : 'pt-BR');

const formatDay = (iso: string, lang: SupportedLanguage, opts: Intl.DateTimeFormatOptions) => {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(locale(lang), opts);
};

// Só o dia, sem hora: "12 de nov. de 2026" (consultas planejadas)
export const formatEventDay = (iso: string, lang: SupportedLanguage) =>
  isValidIsoDate(iso) ? formatDay(iso, lang, { day: 'numeric', month: 'short', year: 'numeric' }) : iso;

export interface RelativeLabels {
  today: string;
  yesterday: string;
}

// Para a tela: "Hoje, 20:36", "Ontem", "28 de out. de 2026, 09:00"
export function formatRecordDate(
  rec: Pick<JourneyRecord, 'eventDate' | 'timestamp' | 'dateLabel'>,
  lang: SupportedLanguage,
  labels: RelativeLabels,
  now = new Date()
): string {
  const m = recordMoment(rec);
  if (!m) return rec.dateLabel ?? '';
  const today = localDate(now);
  const y = new Date(now);
  y.setDate(y.getDate() - 1);
  const day =
    m.date === today
      ? labels.today
      : m.date === localDate(y)
        ? labels.yesterday
        : formatDay(m.date, lang, { day: 'numeric', month: 'short', year: 'numeric' });
  return m.time ? `${day}, ${m.time}` : day;
}

// Para o resumo exportado (lido depois, por isso sem "Hoje" nem "Ontem"): "28/10/2026, 09:00"
export function formatRecordDateAbsolute(rec: Pick<JourneyRecord, 'eventDate' | 'timestamp' | 'dateLabel'>, lang: SupportedLanguage): string {
  const m = recordMoment(rec);
  if (!m) return rec.dateLabel ?? '';
  const day = formatDay(m.date, lang, { day: '2-digit', month: lang === 'en' ? 'short' : '2-digit', year: 'numeric' });
  return m.time ? `${day}, ${m.time}` : day;
}
