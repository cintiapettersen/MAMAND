import type { EvidenceChunk, RetrievalResult, SupportedLang, UserPhase } from '../serverTypes.ts';
import { SYNTHETIC_EVIDENCE_FIXTURES } from '../data/evidenceFixtures.synthetic.ts';
import { CONFIG } from '../config.ts';

const STOP_WORDS = new Set([
  'como', 'para', 'com', 'que', 'uma', 'um', 'dos', 'das', 'seu', 'sua', 'meu', 'minha',
  'por', 'mais', 'tem', 'ter', 'fazer', 'quando', 'onde', 'qual', 'quais', 'pode', 'devo',
  'posso', 'dar', 'daria', 'dia', 'dias', 'semana', 'semanas', 'mes', 'meses', 'ano', 'anos',
  'estou', 'esta', 'estao', 'estar', 'sobre', 'muito', 'muita', 'algo', 'tudo', 'nesse', 'nessa',
  'bebe', 'baby', 'crianca', 'child', 'infant', 'recem', 'nascido', 'sem', 'ate', 'apos',
  'isso', 'isto', 'aquilo', 'este', 'esta', 'esse', 'essa', 'aquele', 'aquela',
  'what', 'how', 'when', 'where', 'with', 'from', 'this', 'that', 'should', 'could', 'have',
  'can', 'give', 'days', 'weeks', 'months', 'years', 'very', 'much', 'about',
  'the', 'for', 'and', 'are', 'you', 'your', 'our', 'all', 'any', 'not', 'out', 'who', 'why',
  'they', 'them', 'then', 'than', 'into', 'some', 'such'
]);

function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function stemWord(word: string): string {
  const w = word.toLowerCase();
  if (w.length <= 3) return w;

  // Sufixos em Português
  if (w.length > 5) {
    if (w.endsWith('mente')) return w.slice(0, -5);
    if (w.endsWith('dades')) return w.slice(0, -5);
    if (w.endsWith('acoes') || w.endsWith('icoes')) return w.slice(0, -5);
  }
  if (w.length > 4) {
    if (w.endsWith('ando') || w.endsWith('endo') || w.endsWith('indo')) return w.slice(0, -4);
    if (w.endsWith('aram') || w.endsWith('eram') || w.endsWith('iram')) return w.slice(0, -4);
    if (w.endsWith('avam') || w.endsWith('aria') || w.endsWith('asse') || w.endsWith('esse') || w.endsWith('isse')) return w.slice(0, -4);
    if (w.endsWith('ment')) return w.slice(0, -4);
    if (w.endsWith('ness')) return w.slice(0, -4);
    if (w.endsWith('tion') || w.endsWith('tions')) return w.slice(0, -4);
  }
  if (w.length > 3) {
    if (w.endsWith('ou') || w.endsWith('eu') || w.endsWith('iu') || w.endsWith('ar') || w.endsWith('er') || w.endsWith('ir')) return w.slice(0, -2);
    if (w.endsWith('ava') || w.endsWith('ada') || w.endsWith('ado') || w.endsWith('ida') || w.endsWith('ido')) return w.slice(0, -3);
    if (w.endsWith('ing')) return w.slice(0, -3);
    if (w.endsWith('ed')) return w.slice(0, -2);
    if (w.endsWith('es')) return w.slice(0, -2);
    if (w.endsWith('s') && !w.endsWith('ss')) return w.slice(0, -1);
  }
  return w;
}

function tokenize(text: string): string[] {
  return normalizeText(text)
    .split(' ')
    .filter(token => token.length >= 3 && !STOP_WORDS.has(token));
}

// Mapeamento Canônico de Conceitos Clínicos Estritos (sem mesclar marcos ou condutas distintas)
interface ConceptCluster {
  targetChunkIds: string[];
  patterns: string[];
  exclusiveBonus: number;
}

const CLINICAL_CONCEPTS: ConceptCluster[] = [
  // 1. Marcha e Primeiros Passos (NÃO confundir com apenas ficar de pé ou sentar)
  {
    targetChunkIds: ['ev-milestones-gross-motor-17'],
    patterns: [
      'andar', 'andando', 'andou', 'primeiros passos', 'passos', 'marcha', 'quando anda',
      'comeca a andar', 'idade media andar', 'idade media que o bebe comeca a andar',
      '14 meses nao anda', 'nao anda', 'walk', 'walking', 'walked', 'first steps',
      'start walking', 'start to walk', 'average age walking', '14 months not walking',
      'how old babies start walking', 'when do babies walk'
    ],
    exclusiveBonus: 14.0
  },
  // 2. Sentar sem apoio (marco motor específico)
  {
    targetChunkIds: ['ev-milestones-gross-motor-17'],
    patterns: [
      'sentar sem apoio', 'senta sem apoio', 'com quantos meses senta',
      'sit unsupported', 'sitting without support', 'when do babies sit'
    ],
    exclusiveBonus: 12.0
  },
  // 3. Falar e Primeiras Palavras (NÃO confundir com cuidados responsivos gerais)
  {
    targetChunkIds: ['ev-milestones-language-18'],
    patterns: [
      'primeiras palavras', 'comeca a falar', 'quando fala', 'falar', 'balbucio', 'balbuciar',
      'desenvolvimento da linguagem', 'comunicacao', 'idade primeiras palavras', 'fala do bebe',
      'first words', 'start talking', 'when do babies talk', 'talking', 'babbling', 'babble',
      'say first words', 'speech milestones', 'how old babies talk'
    ],
    exclusiveBonus: 14.0
  },
  // 4. Oferta de Água e Chás na Infância (Regra dos 6 meses)
  {
    targetChunkIds: ['ev-water-hydration-infant-19'],
    patterns: [
      'dar agua', 'agua para bebe', 'cha para bebe', 'chas para bebe', 'introduzir agua',
      'agua 3 meses', 'posso dar agua', 'agua antes dos 6 meses', 'quando dar agua',
      'give water', 'water for baby', 'tea for baby', 'introduce water', 'water 3 months',
      'can i give water', 'water before 6 months', 'when to give water'
    ],
    exclusiveBonus: 14.0
  },
  // 5. Introdução Alimentar de Sólidos aos 6 Meses (NÃO é desmame!)
  {
    targetChunkIds: ['ev-complementary-feeding-10'],
    patterns: [
      'introducao alimentar', 'alimentos solidos', 'comida solida', 'primeiras papinhas',
      'quando comecar a introducao alimentar', 'quando comecar introducao de alimentos solidos',
      'quando comecar introducao', 'quando dar comida',
      'starting solids', 'solid foods', 'complementary feeding', 'start solid foods',
      'when to start solid foods', 'when to start solids'
    ],
    exclusiveBonus: 12.0
  },
  // 6. Reflexo de Gag (ânsia fisiológica) vs Engasgo Real
  {
    targetChunkIds: ['ev-choking-vs-gag-reflex-20'],
    patterns: [
      'reflexo de gag', 'gag reflex', 'ansia', 'diferenca engasgo ansia', 'engasgo vs gag',
      'ansia de engasgo', 'diferenca entre ansia e engasgo', 'gagging', 'difference choking gagging',
      'gag versus choke', 'gagging versus choking'
    ],
    exclusiveBonus: 14.0
  },
  // 7. Janelas de Vigília e Sinais de Cansaço (Rotina de Sono)
  {
    targetChunkIds: ['ev-infant-sleep-routine-wake-windows-21'],
    patterns: [
      'janelas de vigilia', 'tempo acordado', 'sinais de cansaco', 'sinais de sono',
      'wake windows', 'tired cues', 'sleep cues', 'awake time', 'overtired'
    ],
    exclusiveBonus: 12.0
  },
  // 8. Segurança Veicular: Cadeirinha voltada para trás
  {
    targetChunkIds: ['ev-car-seat-safety-rear-facing-22'],
    patterns: [
      'cadeirinha', 'cadeirinha do carro', 'virada para tras', 'bebe conforto',
      'transporte veicular', 'ate que idade cadeirinha', 'seguranca veicular',
      'ate que idade a cadeirinha do carro deve ficar virada para tras',
      'car seat', 'rear facing', 'rear-facing', 'infant car seat',
      'what age rear facing car seat', 'how long rear facing'
    ],
    exclusiveBonus: 14.0
  },
  // 9. Involução Uterina, Cólicas da Amamentação e Lóquios (Pós-Parto)
  {
    targetChunkIds: ['ev-postpartum-uterine-cramping-lochia-23'],
    patterns: [
      'colicas no utero', 'colica no utero', 'colica amamentando', 'involucao uterina', 'loquios',
      'sangramento pos parto', 'e normal sentir colicas no utero enquanto estou amamentando',
      'afterpains', 'dor utero amamentacao', 'uterine cramping', 'cramping while nursing',
      'uterine involution', 'lochia', 'is it normal to feel cramps while breastfeeding'
    ],
    exclusiveBonus: 14.0
  },
  // 10. Baby Blues vs Depressão Pós-Parto
  {
    targetChunkIds: ['ev-postpartum-mental-health-blues-ppd-24'],
    patterns: [
      'baby blues', 'tristeza pos parto', 'depressao pos parto', 'diferenciar baby blues',
      'saude mental materna', 'tristeza puerperal', 'dpp',
      'como diferenciar tristeza pos parto de depressao pos parto',
      'postpartum depression', 'difference baby blues ppd', 'postpartum blues',
      'how to tell baby blues from postpartum depression'
    ],
    exclusiveBonus: 14.0
  },
  // 11. Cuidados com a Cicatriz da Cesárea e Períneo
  {
    targetChunkIds: ['ev-postpartum-incision-care-25'],
    patterns: [
      'cuidar da cicatriz', 'como cuidar da cicatriz', 'cicatriz cesarea', 'cuidados cesarea',
      'pontos cesarea', 'cicatriz perineo', 'cicatrizacao pos parto', 'higiene cicatriz',
      'incision care', 'cesarean scar', 'c-section care', 'stitches cesarean',
      'perineal tear healing', 'how to care for scar'
    ],
    exclusiveBonus: 14.0
  }
];

export function retrieveRelevantEvidence(
  query: string,
  phase?: UserPhase,
  lang: SupportedLang = 'pt-BR',
  topK: number = CONFIG.TOP_K_CHUNKS,
  options?: { includePendingReview?: boolean; catalog?: EvidenceChunk[] }
): RetrievalResult[] {
  const normalizedQuery = normalizeText(query);
  const queryTokens = tokenize(query);

  if (queryTokens.length === 0 || normalizedQuery.length < CONFIG.MIN_QUESTION_LENGTH) {
    return [];
  }

  const queryWordSet = new Set(normalizedQuery.split(' '));
  const queryStems = new Set(queryTokens.map(stemWord));

  // Identificação de intenções estritas para desambiguações críticas
  const isSleepQuery =
    normalizedQuery.includes('dormir') ||
    normalizedQuery.includes('sono') ||
    normalizedQuery.includes('sleep') ||
    normalizedQuery.includes('sleeping') ||
    normalizedQuery.includes('berco') ||
    normalizedQuery.includes('crib');

  const hasSafeSleepIntent =
    normalizedQuery.includes('posicao') ||
    normalizedQuery.includes('barriga para cima') ||
    normalizedQuery.includes('berco') ||
    normalizedQuery.includes('travesseiro') ||
    normalizedQuery.includes('onde dormir') ||
    normalizedQuery.includes('morte subita') ||
    normalizedQuery.includes('smsl') ||
    normalizedQuery.includes('sufocamento') ||
    normalizedQuery.includes('dormir de lado') ||
    normalizedQuery.includes('dormir de brucos') ||
    normalizedQuery.includes('safe sleep') ||
    normalizedQuery.includes('crib') ||
    normalizedQuery.includes('supine') ||
    normalizedQuery.includes('back to sleep');

  const hasSleepDurationIntent =
    normalizedQuery.includes('horas de sono') ||
    normalizedQuery.includes('quantas horas') ||
    normalizedQuery.includes('duracao do sono') ||
    normalizedQuery.includes('duracao sono') ||
    normalizedQuery.includes('tempo de sono') ||
    normalizedQuery.includes('quanto tempo dorme') ||
    normalizedQuery.includes('hours of sleep') ||
    normalizedQuery.includes('how many hours') ||
    normalizedQuery.includes('sleep duration');

  const hasTummyTimeIntent =
    normalizedQuery.includes('tummy time') ||
    normalizedQuery.includes('tummy') ||
    normalizedQuery.includes('de brucos') ||
    normalizedQuery.includes('brucos') ||
    normalizedQuery.includes('barriga para baixo') ||
    normalizedQuery.includes('barriguinha') ||
    normalizedQuery.includes('plagiocefalia') ||
    normalizedQuery.includes('cabeca chata') ||
    normalizedQuery.includes('posicao prona') ||
    normalizedQuery.includes('prone') ||
    normalizedQuery.includes('belly time') ||
    normalizedQuery.includes('tummy play');

  const hasColicIntent =
    normalizedQuery.includes('colica') ||
    normalizedQuery.includes('colicas') ||
    normalizedQuery.includes('aliviar colicas') ||
    normalizedQuery.includes('gases bebe') ||
    normalizedQuery.includes('colic');

  const hasHiccupsIntent =
    normalizedQuery.includes('soluco') ||
    normalizedQuery.includes('solucos') ||
    normalizedQuery.includes('solucando') ||
    normalizedQuery.includes('hiccup') ||
    normalizedQuery.includes('hiccups');

  const hasCryingIntent =
    normalizedQuery.includes('chora muito') ||
    normalizedQuery.includes('choro persistente') ||
    normalizedQuery.includes('acalmar o bebe') ||
    normalizedQuery.includes('choro') ||
    normalizedQuery.includes('chora');

  const hasLatchIntent =
    normalizedQuery.includes('pega') ||
    normalizedQuery.includes('abocanhar') ||
    normalizedQuery.includes('fissura') ||
    normalizedQuery.includes('rachadura') ||
    normalizedQuery.includes('dor ao amamentar') ||
    normalizedQuery.includes('latch');

  const scoredResults: RetrievalResult[] = [];
  const activeCatalog = options?.catalog ?? SYNTHETIC_EVIDENCE_FIXTURES;

  for (const chunk of activeCatalog) {
    // SALVAGUARDA DE SEGURANÇA CLÍNICA (Fail-Safe):
    // Bloqueia categoricamente itens com status pending_review, ausente, inválido ou sem liberação
    // Exceto se explicitamente solicitado em ambiente interno/auditoria
    if (!options?.includePendingReview) {
      if (chunk.validationStatus !== 'verified' || chunk.publicationAllowed === false) {
        continue;
      }
    }

    let phaseMultiplier = 1.0;
    if (phase && chunk.phase !== 'all') {
      if (chunk.phase !== phase) {
        phaseMultiplier = 0.4;
      } else {
        phaseMultiplier = 1.2;
      }
    }

    const titleNorm = normalizeText(lang === 'pt-BR' ? chunk.title_pt : chunk.title_en);
    const summaryNorm = normalizeText(lang === 'pt-BR' ? chunk.summary_pt : chunk.summary_en);
    const keywords = (lang === 'pt-BR' ? chunk.keywords_pt : chunk.keywords_en).map(k => normalizeText(k));

    const titleTokens = tokenize(titleNorm);
    const summaryTokens = tokenize(summaryNorm);
    const titleWords = new Set(titleTokens);
    const summaryWords = new Set(summaryTokens);
    const titleStems = new Set(titleTokens.map(stemWord));

    let score = 0;

    // 1. Pontuação por Conceitos Clínicos Estritos (Thesaurus)
    for (const concept of CLINICAL_CONCEPTS) {
      if (concept.targetChunkIds.includes(chunk.id)) {
        for (const pattern of concept.patterns) {
          if (normalizedQuery.includes(pattern)) {
            score += concept.exclusiveBonus;
            break;
          }
        }
      }
    }

    // 2. Pontuação por Palavras-Chave e Frases
    for (const kw of keywords) {
      if (kw.includes(' ')) {
        if (normalizedQuery.includes(kw)) {
          score += 7.0;
        }
      } else {
        if (queryWordSet.has(kw)) {
          score += 3.5;
        } else if (queryStems.has(stemWord(kw))) {
          score += 2.0;
        } else if (normalizedQuery.includes(kw) && kw.length >= 4) {
          score += 1.2;
        }
      }
    }

    // 3. Pontuação por Título e Sumário
    for (const token of queryTokens) {
      if (titleWords.has(token)) {
        score += 3.0;
      } else if (titleStems.has(stemWord(token))) {
        score += 1.8;
      }

      if (summaryWords.has(token)) {
        score += 0.8;
      }
    }

    // 4. Bônus por intenção específica direta
    if (chunk.topic === 'sleep_duration' && hasSleepDurationIntent) {
      score += 8.0;
    }
    if (chunk.topic === 'safe_sleep' && hasSafeSleepIntent) {
      score += 8.0;
    }
    if (chunk.id === 'ev-infant-hiccups-03' && hasHiccupsIntent) {
      score += 10.0;
    }
    if (chunk.id === 'ev-infant-colic-14' && hasColicIntent) {
      score += 10.0;
    }
    if (chunk.id === 'ev-infant-crying-15' && hasCryingIntent) {
      score += 10.0;
    }
    if (chunk.topic === 'breastfeeding' && hasLatchIntent) {
      score += 8.0;
    }
    if (chunk.topic === 'tummy_time' && hasTummyTimeIntent) {
      score += 10.0;
    }

    // 5. Desambiguações Clínicas Estritas (Penalidades)
    // A. Sono Seguro vs Tummy Time
    if (isSleepQuery) {
      if (chunk.topic === 'safe_sleep') {
        score += 12.0;
      }
      if (chunk.topic === 'tummy_time') {
        score -= 6.0;
      }
    } else if (hasTummyTimeIntent) {
      if (chunk.topic === 'tummy_time') {
        score += 14.0;
      }
      if (chunk.topic === 'safe_sleep') {
        score -= 6.0;
      }
    }

    // B. Cólica vs Soluço vs Pega
    if (hasColicIntent) {
      if (chunk.id === 'ev-infant-hiccups-03' && !hasHiccupsIntent) {
        score -= 12.0;
      }
      if (chunk.topic === 'breastfeeding' && !hasLatchIntent) {
        score -= 8.0;
      }
    }
    if (hasHiccupsIntent) {
      if (chunk.id === 'ev-infant-colic-14' && !hasColicIntent) {
        score -= 12.0;
      }
      if (chunk.topic === 'breastfeeding' && !hasLatchIntent) {
        score -= 8.0;
      }
    }

    // C. Sono do Bebê vs Cansaço na Gestação
    if (normalizedQuery.includes('quanto tempo dura o sono') || normalizedQuery.includes('tempo dura o sono')) {
      if (phase === 'pregnancy' && chunk.id === 'ev-pregnancy-sleep-fatigue-07') {
        score += 8.0;
      } else if (chunk.id === 'ev-infant-sleep-duration-13') {
        score += 8.0;
      }
    }

    score *= phaseMultiplier;

    if (score >= CONFIG.RAG_CONFIDENCE_THRESHOLD) {
      scoredResults.push({ chunk, score });
    }
  }

  scoredResults.sort((a, b) => b.score - a.score);

  if (scoredResults.length === 0) {
    return [];
  }

  // Corte dinâmico
  const topResult = scoredResults[0];
  const filteredResults: RetrievalResult[] = [topResult];

  if (scoredResults.length > 1) {
    const candidate2 = scoredResults[1];
    const relativeScoreRatio = candidate2.score / topResult.score;
    const isSameTopic = candidate2.chunk.topic === topResult.chunk.topic;

    if (relativeScoreRatio >= CONFIG.RAG_RELATIVE_CUTOFF_RATIO && isSameTopic) {
      filteredResults.push(candidate2);
    }
  }

  return filteredResults.slice(0, topK);
}

