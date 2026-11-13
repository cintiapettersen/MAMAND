"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// scripts/localGateway.ts
var import_node_http = __toESM(require("node:http"), 1);
var import_node_fs = __toESM(require("node:fs"), 1);
var import_node_path = __toESM(require("node:path"), 1);

// src/config.ts
var CONFIG = {
  DEFAULT_MODEL: "gemini-3.5-flash-lite",
  MAX_QUESTION_LENGTH: 300,
  MIN_QUESTION_LENGTH: 4,
  RATE_LIMIT_PER_WINDOW: 15,
  RATE_LIMIT_WINDOW_SECONDS: 600,
  // 10 minutos
  DAILY_GLOBAL_QUOTA: 500,
  RAG_CONFIDENCE_THRESHOLD: 4,
  RAG_RELATIVE_CUTOFF_RATIO: 0.7,
  TOP_K_CHUNKS: 3,
  MOCK_DELAY_MS: 320,
  DEFAULT_LANG: "pt-BR",
  EMERGENCY_PHONE_BR: "192 (SAMU) ou 193 (Bombeiros)",
  EMERGENCY_PHONE_INTL: "Local Emergency Medical Services (e.g., 911, 112, 999)",
  // Tarifas oficiais Google AI Studio (Plano Pago, Outubro 2026):
  // Gemini 3.5 Flash-Lite: Entrada $0.30 / 1M tokens | Saída $2.50 / 1M tokens (inclui raciocínio)
  PRICING_PER_1M_INPUT_USD: 0.3,
  PRICING_PER_1M_OUTPUT_USD: 2.5
};

// src/services/rateLimiter.ts
var inMemoryRateMap = /* @__PURE__ */ new Map();
var inMemoryDailyQuotaRecord = {
  date: (/* @__PURE__ */ new Date()).toISOString().slice(0, 10),
  count: 0
};
var EPHEMERAL_SALT = "f1k-salt-" + Math.random().toString(36).substring(2, 10);
async function hashIp(clientIp) {
  const today = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
  const data = new TextEncoder().encode(`${clientIp}-${today}-${EPHEMERAL_SALT}`);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("").slice(0, 16);
}
async function checkRateLimit(hashedClient, maxPerWindow = CONFIG.RATE_LIMIT_PER_WINDOW, windowSeconds = CONFIG.RATE_LIMIT_WINDOW_SECONDS, kv) {
  if (kv) {
    try {
      const windowSlot = Math.floor(Date.now() / (windowSeconds * 1e3));
      const key = `ratelimit:${hashedClient}:${windowSlot}`;
      const rawCount = await kv.get(key);
      const current = rawCount ? parseInt(rawCount, 10) : 0;
      if (current >= maxPerWindow) {
        return { allowed: false, remaining: 0 };
      }
      await kv.put(key, String(current + 1), { expirationTtl: windowSeconds * 2 });
      return { allowed: true, remaining: maxPerWindow - (current + 1) };
    } catch {
    }
  }
  const now = Date.now();
  const windowMs = windowSeconds * 1e3;
  const record = inMemoryRateMap.get(hashedClient) || { timestamps: [] };
  const validTimestamps = record.timestamps.filter((ts) => now - ts < windowMs);
  if (validTimestamps.length >= maxPerWindow) {
    return {
      allowed: false,
      remaining: 0
    };
  }
  validTimestamps.push(now);
  inMemoryRateMap.set(hashedClient, { timestamps: validTimestamps });
  return {
    allowed: true,
    remaining: maxPerWindow - validTimestamps.length
  };
}
async function checkGlobalDailyQuota(maxDaily = CONFIG.DAILY_GLOBAL_QUOTA, kv) {
  const today = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
  if (kv) {
    try {
      const key = `quota:${today}`;
      const rawCount = await kv.get(key);
      const current = rawCount ? parseInt(rawCount, 10) : 0;
      if (current >= maxDaily) {
        return { allowed: false, remaining: 0 };
      }
      await kv.put(key, String(current + 1), { expirationTtl: 86400 * 2 });
      return { allowed: true, remaining: maxDaily - (current + 1) };
    } catch {
    }
  }
  if (inMemoryDailyQuotaRecord.date !== today) {
    inMemoryDailyQuotaRecord = { date: today, count: 0 };
  }
  if (inMemoryDailyQuotaRecord.count >= maxDaily) {
    return {
      allowed: false,
      remaining: 0
    };
  }
  inMemoryDailyQuotaRecord.count += 1;
  return {
    allowed: true,
    remaining: maxDaily - inMemoryDailyQuotaRecord.count
  };
}
function getDailyQuotaStatus() {
  return { ...inMemoryDailyQuotaRecord };
}

// src/services/piiScrubber.ts
var CPF_REGEX = /\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b/g;
var PHONE_REGEX = /\b(?:\+?55\s?)?(?:\(?\d{2}\)?\s?)?(?:9\s?\d{4}[-\s]?\d{4}|\d{4}[-\s]?\d{4})\b/g;
var EMAIL_REGEX = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
var NAME_INTRO_REGEX = /\b(meu nome [eé]|me chamo|o nome do meu beb[eê] [eé]|meu filho se chama|minha filha se chama)\s+([A-ZÁÉÍÓÚÂÊÔÃÕ][a-záéíóúâêôãõç]+(?:\s+[A-ZÁÉÍÓÚÂÊÔÃÕ][a-záéíóúâêôãõç]+)*)/gi;
var NAME_INTRO_EN_REGEX = /\b(my name is|i am called|my baby name is|my child is named)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/gi;
function sanitizeUserInput(input, lang = "pt-BR") {
  let text = input.trim();
  let piiDetected = false;
  if (CPF_REGEX.test(text)) {
    text = text.replace(CPF_REGEX, "[DOCUMENTO_OMITIDO]");
    piiDetected = true;
  }
  if (PHONE_REGEX.test(text)) {
    text = text.replace(PHONE_REGEX, "[TELEFONE_OMITIDO]");
    piiDetected = true;
  }
  if (EMAIL_REGEX.test(text)) {
    text = text.replace(EMAIL_REGEX, "[EMAIL_OMITIDO]");
    piiDetected = true;
  }
  if (NAME_INTRO_REGEX.test(text)) {
    text = text.replace(NAME_INTRO_REGEX, "$1 [NOME_OMITIDO]");
    piiDetected = true;
  }
  if (NAME_INTRO_EN_REGEX.test(text)) {
    text = text.replace(NAME_INTRO_EN_REGEX, "$1 [NAME_OMITTED]");
    piiDetected = true;
  }
  const warning = piiDetected ? lang === "pt-BR" ? "Aviso: Informa\xE7\xF5es potencialmente identific\xE1veis foram mascaradas. Importante: A filtragem autom\xE1tica por express\xF5es regulares n\xE3o garante 100% de anonimiza\xE7\xE3o. Nunca insira nomes completos, documentos ou contatos." : "Notice: Potentially identifiable details were masked. Important: Automated regex filtering cannot guarantee 100% anonymization. Never submit full names, IDs, or contact information." : void 0;
  return {
    sanitized: text,
    piiDetected,
    warning
  };
}

// src/services/safetyService.ts
var EMERGENCY_PATTERNS = [
  // Febre em recém-nascido ou lactente jovem (< 3 meses)
  {
    regex: /(?:febre|temperatura\s+alta|38|39).*(?:rec[eé]m[\s-]nascido|dias|1\s*m[eê]s|2\s*meses|beb[eê].*pequeno|neonato)|(?:rec[eé]m[\s-]nascido|dias|1\s*m[eê]s|2\s*meses|beb[eê].*pequeno|neonato).*(?:febre|temperatura\s+alta|38|39)/i,
    category: "neonatal_fever"
  },
  {
    regex: /(?:fever|high\s+temp).*(?:newborn|infant|days|1[\s-]*month|2[\s-]*months|baby)|(?:newborn|infant|days|1[\s-]*month|2[\s-]*months|baby).*(?:fever|high\s+temp)/i,
    category: "neonatal_fever"
  },
  // Desconforto respiratório grave
  {
    regex: /(falta\s+de\s+ar|gemendo\s+para\s+respirar|peito\s+afundando|tiragem|l[aá]bios\s+roxos|cianose|sem\s+respirar|engasgado|engasgou|sufocando)/i,
    category: "respiratory_distress"
  },
  {
    regex: /(can'?t\s+breathe|struggling\s+to\s+breathe|blue\s+lips|choking|choked|suffocating|stopped\s+breathing)/i,
    category: "respiratory_distress"
  },
  // Convulsão / espasmos agudos
  {
    regex: /(convuls[aã]o|convulsionando|espasmos\s+fortes|ataque\s+epil[eé]ptico)/i,
    category: "seizures"
  },
  {
    regex: /(seizure|convulsion|shaking\s+uncontrollably)/i,
    category: "seizures"
  },
  // Sangramento materno profuso ou dor súbita incapacitante
  {
    regex: /(hemorragia|sangramento\s+muito\s+forte|sangramento\s+abundante|jorrando\s+sangue|dor\s+abdominal\s+insuport[aá]vel|encharcando\s+absorvente)/i,
    category: "maternal_hemorrhage"
  },
  {
    regex: /(heavy\s+bleeding|hemorrhage|gushing\s+blood|unbearable\s+abdominal\s+pain|soaking\s+pads)/i,
    category: "maternal_hemorrhage"
  },
  // Perda de consciência / letargia profunda
  {
    regex: /(desmaiou|inconsciente|n[aã]o\s+acorda|n[aã]o\s+reage|comatoso|let[aá]rgico|letargia)/i,
    category: "unresponsive"
  },
  {
    regex: /(unconscious|passed\s+out|won'?t\s+wake\s+up|unresponsive|lethargic|lethargy)/i,
    category: "unresponsive"
  },
  // Traumatismo craniano / queda seguida de vômito
  {
    regex: /(caiu.*vomit|vomit.*caiu|bateu\s+a\s+cabe[çc]a.*vomit|trauma.*cabeca|fell.*vomit|head\s+injury.*vomit)/i,
    category: "head_trauma_vomiting"
  },
  // Ideação de dano / crise emocional aguda
  {
    regex: /(machucar\s+meu\s+beb[eê]|me\s+machucar|suic[ií]dio|n[aã]o\s+quero\s+viver|vontade\s+de\s+sumir|n[aã]o\s+sinto\s+conex[aã]o)/i,
    category: "crisis_harm"
  },
  {
    regex: /(harm\s+myself|harm\s+my\s+baby|suicide|don'?t\s+want\s+to\s+live|want\s+to\s+disappear|no\s+connection.*baby)/i,
    category: "crisis_harm"
  }
];
function checkEmergencySafety(question, lang = "pt-BR") {
  const normalized = question.trim().toLowerCase();
  for (const pattern of EMERGENCY_PATTERNS) {
    if (pattern.regex.test(normalized)) {
      const isPt = lang === "pt-BR";
      const phone = isPt ? CONFIG.EMERGENCY_PHONE_BR : CONFIG.EMERGENCY_PHONE_INTL;
      const message = isPt ? `\u{1F6A8} ATEN\xC7\xC3O M\xC9DICA URGENTE: Sua mensagem cont\xE9m termos associados a uma situa\xE7\xE3o potencialmente grave ou aguda. Por salvaguarda de seguran\xE7a, este assistente educativo n\xE3o realiza diagn\xF3stico ou triagem cl\xEDnica. Procure atendimento m\xE9dico presencial imediatamente ou acione o servi\xE7o de urg\xEAncia: Ligue ${phone}. N\xE3o aguarde respostas em aplicativos diante de sinais de emerg\xEAncia.

\u26A0\uFE0F *Nota de Limita\xE7\xE3o:* Filtros autom\xE1ticos por termos s\xE3o salvaguardas preliminares e N\xC3O detectam todas as urg\xEAncias m\xE9dicas. Em qualquer d\xFAvida sobre a sa\xFAde da m\xE3e ou do beb\xEA, busque atendimento presencial imediato.` : `\u{1F6A8} URGENT MEDICAL NOTICE: Your message contains terms associated with an acute or potentially life-threatening situation. As a safety safeguard, this educational assistant does not provide clinical diagnosis or emergency triage. Seek immediate in-person emergency care or call emergency services: ${phone}. Do not wait for app responses during an emergency.

\u26A0\uFE0F *Safety Limitation:* Automated keyword filters are preliminary safeguards and CANNOT detect all possible medical urgencies. When in doubt regarding maternal or infant health, always seek in-person medical evaluation immediately.`;
      return {
        isEmergency: true,
        message,
        emergencyPhone: phone
      };
    }
  }
  return { isEmergency: false };
}

// src/data/evidenceCatalog.ts
var EVIDENCE_CATALOG = [
  {
    id: "ev-safe-sleep-01",
    phase: "baby",
    stageRange: "0-12m",
    topic: "safe_sleep",
    title_pt: "Posi\xE7\xE3o e Ambiente Seguro para o Sono do Beb\xEA",
    title_en: "Safe Sleep Position and Environment for Infants",
    summary_pt: "O beb\xEA deve ser colocado para dormir sempre de barriga para cima (dec\xFAbito dorsal) em superf\xEDcie firme e plana. O ber\xE7o deve estar livre de travesseiros, protetores acolchoados, bichos de pel\xFAcia, cobertores soltos ou panos que possam cobrir as vias a\xE9reas. Esta medida \xE9 a principal interven\xE7\xE3o comprovada para prevenir a S\xEDndrome da Morte S\xFAbita do Lactente (SMSL). O compartilhamento do mesmo quarto (ber\xE7o ao lado da cama dos pais) \xE9 recomendado nos primeiros 6 meses, mas a cama compartilhada n\xE3o \xE9 recomendada por risco de sufocamento.",
    summary_en: "Infants should always be placed to sleep on their backs (supine position) on a firm, flat surface. The crib must remain clear of pillows, soft bumpers, stuffed toys, loose blankets, or cloths that could cover the airways. This is the single most effective proven measure to prevent Sudden Infant Death Syndrome (SIDS). Room-sharing (baby crib beside parents bedroom) is recommended for the first 6 months, while bed-sharing is not recommended due to suffocation hazards.",
    conversationalAnswer_pt: "A recomenda\xE7\xE3o fundamental para o sono seguro \xE9 colocar o beb\xEA sempre para dormir de barriga para cima, em um colch\xE3o firme e plano.\n\nDormir de bru\xE7os ou de lado n\xE3o \xE9 seguro e aumenta expressivamente o risco de sufocamento e de S\xEDndrome da Morte S\xFAbita do Lactente (SMSL). A posi\xE7\xE3o de bru\xE7os \xE9 recomendada exclusivamente para momentos de brincadeira e est\xEDmulo enquanto o beb\xEA estiver acordado e sob supervis\xE3o atenta de um adulto (tummy time).\n\nO ber\xE7o deve ficar livre de travesseiros, bichinhos de pel\xFAcia, protetores acolchoados e cobertores soltos. Manter o espa\xE7o limpo e desimpedido \xE9 o cuidado mais importante para que o beb\xEA respire livremente durante o sono.\n\nNos primeiros 6 meses, o ideal \xE9 que o ber\xE7o fique no mesmo quarto dos pais, facilitando os cuidados e as mamadas da noite sem colocar o beb\xEA para dormir na mesma cama dos adultos.",
    conversationalAnswer_en: "The golden rule for safe infant sleep is to always place your baby to sleep on their back, on a firm, flat mattress.\n\nSleeping on their tummy (stomach) or side is unsafe and significantly increases the risk of suffocation and Sudden Infant Death Syndrome (SIDS). Tummy time is strictly recommended for awake play and motor stimulation under direct adult supervision.\n\nThe crib must be kept completely clear of pillows, stuffed toys, padded bumpers, and loose blankets. Keeping the sleep space empty and uncluttered protects your baby airway.\n\nFor the first 6 months, having the baby crib in the same bedroom as the parents is recommended to make night care and feedings safer and easier.",
    keywords_pt: ["posicao", "barriga para cima", "berco", "travesseiro", "morte subita", "smsl", "cobertor", "seguranca sono", "onde dormir", "dormir de brucos", "pode dormir de brucos", "dormir de barriga para baixo"],
    keywords_en: ["position", "back sleep", "supine", "crib", "pillow", "sids", "blanket", "safe sleep environment", "where to sleep", "sleep on tummy", "sleep on stomach", "can baby sleep on tummy"],
    sourceName: "Minist\xE9rio da Sa\xFAde do Brasil e Academia Americana de Pediatria (AAP)",
    document: "Caderneta da Crian\xE7a (MS) e Diretrizes de Sono Seguro (AAP)",
    edition: "5\xAA Edi\xE7\xE3o MS / AAP Policy Statement 2022",
    sectionOrPage: "P\xE1gina 43 (Cuidados com o Sono e Preven\xE7\xE3o de Acidentes) / AAP Safe Sleep",
    url: "https://www.gov.br/saude/pt-br/assuntos/saude-de-a-a-z/s/saude-da-crianca/caderneta-da-crianca",
    validationStatus: "verified",
    countryJurisdiction: "BR"
  },
  {
    id: "ev-infant-sleep-duration-13",
    phase: "baby",
    stageRange: "0-6m",
    topic: "sleep_duration",
    title_pt: "Dura\xE7\xE3o e Padr\xF5es de Sono Recomendados pela OMS para Menores de 5 Anos",
    title_en: "WHO Recommended Sleep Duration and Patterns for Children Under 5",
    summary_pt: "Segundo as diretrizes globais da Organiza\xE7\xE3o Mundial da Sa\xFAde (OMS, 2019), a quantidade di\xE1ria recomendada de sono de boa qualidade em 24 horas (incluindo cochilos e sono noturno) \xE9:\n- 0 a 3 meses: 14 a 17 horas di\xE1rias.\n- 4 a 11 meses: 12 a 16 horas di\xE1rias.\n- 1 a 2 anos: 11 a 14 horas di\xE1rias.\nNos primeiros meses de vida, o sono do beb\xEA \xE9 polif\xE1sico e fragmentado em ciclos curtos de 2 a 4 horas entre as mamadas. Varia\xE7\xF5es individuais s\xE3o normais quando o ganho de peso e o desenvolvimento est\xE3o saud\xE1veis.",
    summary_en: "According to World Health Organization (WHO, 2019) global guidelines, recommended amounts of good quality sleep in a 24-hour day (including naps and night sleep) are:\n- 0 to 3 months: 14 to 17 hours daily.\n- 4 to 11 months: 12 to 16 hours daily.\n- 1 to 2 years: 11 to 14 hours daily.\nDuring early infancy, sleep is polyphasic and broken into 2- to 4-hour intervals around feedings. Individual variations are expected when growth and development are on track.",
    conversationalAnswer_pt: "A Organiza\xE7\xE3o Mundial da Sa\xFAde (OMS) orienta as seguintes faixas de sono de boa qualidade em 24 horas (somando as sonecas e a noite):\n\n\u2022 De 0 a 3 meses: de 14 a 17 horas por dia.\n\u2022 De 4 a 11 meses: de 12 a 16 horas por dia.\n\u2022 De 1 a 2 anos: de 11 a 14 horas por dia.\n\nNos primeiros meses, esse sono acontece em ciclos curtinhos de 2 a 4 horas entre as mamadas, tanto de dia quanto de noite. Conforme o beb\xEA cresce, o sono vai se concentrando mais na noite.\n\nCada beb\xEA tem seu ritmo pr\xF3prio. Se o ganho de peso e o desenvolvimento estiverem indo bem, essas varia\xE7\xF5es individuais fazem parte do processo.",
    conversationalAnswer_en: "The World Health Organization (WHO) recommends the following ranges of good quality sleep in a 24-hour day (combining naps and nighttime sleep):\n\n\u2022 0 to 3 months: 14 to 17 hours daily.\n\u2022 4 to 11 months: 12 to 16 hours daily.\n\u2022 1 to 2 years: 11 to 14 hours daily.\n\nDuring the first months, sleep is spread across short 2- to 4-hour stretches around feedings, day and night. As your baby grows, longer stretches gradually consolidate at night.\n\nEvery baby develops their own rhythm. As long as growth and developmental milestones are on track, these individual variations are completely natural.",
    keywords_pt: ["horas de sono", "quantas horas", "dorme", "sono", "duracao sono", "tempo de sono", "esperadas", "soneca", "noite", "ciclo sono", "recomendacao sono"],
    keywords_en: ["hours of sleep", "how many hours", "sleep duration", "sleep", "sleeping", "expected sleep", "night waking", "nap", "sleep cycle", "who sleep"],
    sourceName: "OMS / WHO (Organiza\xE7\xE3o Mundial da Sa\xFAde)",
    document: "Diretrizes sobre Atividade F\xEDsica, Comportamento Sedent\xE1rio e Sono para Crian\xE7as Menores de 5 Anos",
    edition: "Edi\xE7\xE3o Global, 2019",
    sectionOrPage: "Recomenda\xE7\xF5es de Sono Infantil em 24 Horas (pp. 16-21)",
    url: "https://www.who.int/news/item/24-04-2019-to-grow-up-healthy-children-need-to-sit-less-and-play-more",
    validationStatus: "verified",
    countryJurisdiction: "GLOBAL"
  },
  {
    id: "ev-breastfeeding-latch-02",
    phase: "baby",
    stageRange: "0-6m",
    topic: "breastfeeding",
    title_pt: "T\xE9cnica de Pega Correta e Amamenta\xE7\xE3o Sem Dor",
    title_en: "Proper Breastfeeding Latch Technique and Pain-Free Nursing",
    summary_pt: "A pega adequada \xE9 essencial para a extra\xE7\xE3o eficaz do leite e para prevenir fissuras mam\xE1rias. Sinais de boa pega: boca bem aberta (\xE2ngulo de 120\xB0), l\xE1bio inferior virado para fora (evertido), queixo tocando o peito da m\xE3e, bochechas arredondadas (sem covinhas durante a suc\xE7\xE3o) e ar\xE9ola mais vis\xEDvel acima da boca do que abaixo. A suc\xE7\xE3o deve ser ampla e lenta, intercalando pausas com som suave de degluti\xE7\xE3o. A amamenta\xE7\xE3o n\xE3o deve causar dor cont\xEDnua; dor persistente indica necessidade de ajuste da pega.",
    summary_en: "An effective latch is essential for adequate milk transfer and for preventing nipple fissures. Key signs of a good latch: wide-open mouth (approx. 120 degrees), everted lower lip, chin touching the breast, rounded cheeks without dimpling during sucking, and more areola visible above the upper lip than below. Sucking rhythm should be slow and deep with audible swallowing. Nursing should not cause continuous pain; persisting pain signals need for latch correction.",
    conversationalAnswer_pt: "A boa pega \xE9 o segredo para o beb\xEA mamar bem e para voc\xEA amamentar com tranquilidade e sem dor.\n\nVoc\xEA sabe que a pega est\xE1 adequada quando o beb\xEA abre bem a boquinha, com o l\xE1bio inferior virado para fora (como uma boquinha de peixe) e o queixo bem encostado no peito. As bochechas ficam cheinhas e arredondadas enquanto ele suga, sem formar covinhas, e voc\xEA ouve o som suave dele engolindo o leite.\n\nA amamenta\xE7\xE3o pode causar uma sensa\xE7\xE3o de repuxo nos primeiros segundos, mas n\xE3o deve machucar ou doer durante a mamada. Se sentir dor cont\xEDnua, desfa\xE7a suavemente o v\xE1cuo colocando a pontinha do dedo no cantinho da boca do beb\xEA e reposicione.",
    conversationalAnswer_en: "A good latch is the key to comfortable nursing and ensuring your baby gets enough milk.\n\nYou can tell the latch is right when your baby opens their mouth wide, with the lower lip turned outward like a fish and the chin touching your breast. Their cheeks should look round and full without dimpling, and you will hear gentle, rhythmic swallowing sounds.\n\nNursing may feel like a tug at first, but it should not cause ongoing pain or cracked nipples. If it hurts, gently break the seal by slipping a clean finger into the corner of your baby mouth and try latching again.",
    keywords_pt: ["amamentacao", "pega", "mamar", "leite", "fissura", "dor mamar", "areola", "labio peixe", "peito", "bico do peito", "suc\xE7\xE3o"],
    keywords_en: ["breastfeeding", "latch", "nursing", "milk transfer", "nipple pain", "fissure", "areola", "suckling", "breast latch"],
    sourceName: "Minist\xE9rio da Sa\xFAde do Brasil",
    document: "Caderneta da Crian\xE7a - Passaporte da Cidadania",
    edition: "5\xAA Edi\xE7\xE3o, 2022/2023",
    sectionOrPage: "P\xE1ginas 31-33 (Amamenta\xE7\xE3o e Pega Correta)",
    url: "https://www.gov.br/saude/pt-br/assuntos/saude-de-a-a-z/s/saude-da-crianca/caderneta-da-crianca",
    validationStatus: "verified",
    countryJurisdiction: "BR"
  },
  {
    id: "ev-infant-hiccups-03",
    phase: "baby",
    stageRange: "0-6m",
    topic: "development",
    title_pt: "Solu\xE7os Fisiol\xF3gicos no Lactente",
    title_en: "Physiological Infant Hiccups",
    summary_pt: "Solu\xE7os s\xE3o contra\xE7\xF5es involunt\xE1rias e benignas do diafragma, decorrentes da imaturidade das vias neurais e do controle diafragm\xE1tico no in\xEDcio da vida. Ocorrem com frequ\xEAncia ap\xF3s as mamadas. Quando o beb\xEA est\xE1 tranquilo e sem desconforto evidente, os solu\xE7os cessam espontaneamente e n\xE3o necessitam de medicamentos, ch\xE1s ou interven\xE7\xF5es. Manter o beb\xEA na posi\xE7\xE3o vertical no colo por alguns minutos ou oferecer breve suc\xE7\xE3o ao peito pode auxiliar no relaxamento do diafragma.",
    summary_en: "Hiccups are involuntary, benign contractions of the diaphragm, very common in newborns and young infants due to immaturity of the nervous system and diaphragmatic control. They frequently happen after feedings or temperature changes. If the baby is comfortable, hiccups do not cause pain and stop spontaneously without any medications, home remedies, or teas. Holding the baby upright for a few minutes after feeding or offering a brief nursing session may help relax the diaphragm.",
    conversationalAnswer_pt: "Solu\xE7os s\xE3o muito frequentes em rec\xE9m-nascidos e lactentes jovens, decorrentes do amadurecimento natural do diafragma e das vias neurais.\n\nCostumam acontecer logo ap\xF3s as mamadas e, na grande maioria das vezes, n\xE3o provocam dor nem causam inc\xF4modo ao beb\xEA, passando sozinhos em poucos minutos.\n\nManter o beb\xEA na posi\xE7\xE3o vertical no colo por alguns minutos ap\xF3s mamar ou coloc\xE1-lo para sugar brevemente o peito s\xE3o medidas simples que podem auxiliar no relaxamento do diafragma. N\xE3o h\xE1 indica\xE7\xE3o de ch\xE1s, gotas caseiras ou rem\xE9dios para solu\xE7os normais. Se os epis\xF3dios forem acompanhados de irritabilidade excessiva, engasgos constantes ou dificuldade para respirar, procure avalia\xE7\xE3o da equipe de sa\xFAde.",
    conversationalAnswer_en: "Hiccups are very common in newborns and young infants, stemming from the normal developmental maturation of the diaphragm and nervous system.\n\nThey often occur right after feedings and generally do not cause pain or distress, resolving on their own within minutes.\n\nHolding your baby upright in your arms for a few minutes after feeding or offering a brief nursing session can help settle the diaphragm. Teas, drops, or medications are not recommended for normal hiccups. If episodes are accompanied by persistent distress, frequent choking, or breathing difficulty, consult your pediatrician.",
    keywords_pt: ["soluco", "solucos", "solucando", "soluco depois de mamar", "soluco e normal", "bebe soluca"],
    keywords_en: ["hiccups", "hiccup", "hiccuping", "hiccups after nursing", "baby hiccups", "is hiccup normal"],
    sourceName: "Minist\xE9rio da Sa\xFAde do Brasil",
    document: "Caderneta da Crian\xE7a - Passaporte da Cidadania",
    edition: "5\xAA Edi\xE7\xE3o, 2022/2023",
    sectionOrPage: "P\xE1gina 38 (D\xFAvidas Comuns no Primeiro Trimestre - Solu\xE7os)",
    url: "https://www.gov.br/saude/pt-br/assuntos/saude-de-a-a-z/s/saude-da-crianca/caderneta-da-crianca",
    validationStatus: "verified",
    countryJurisdiction: "BR"
  },
  {
    id: "ev-infant-colic-14",
    phase: "baby",
    stageRange: "0-4m",
    topic: "development",
    title_pt: "C\xF3licas do Lactente e Pr\xE1ticas de Conforto",
    title_en: "Infant Colic and Supportive Comfort Practices",
    summary_pt: "As c\xF3licas do primeiro trimestre caracterizam-se por epis\xF3dios de choro intenso e inquieta\xE7\xE3o, habitualmente com in\xEDcio entre a 2\xAA e 3\xAA semana de vida e melhora gradual por volta do 3\xBA ou 4\xBA m\xEAs. Sua causa exata n\xE3o \xE9 totalmente estabelecida na literatura cient\xEDfica, envolvendo m\xFAltiplos fatores do desenvolvimento, sem causa \xFAnica isolada nem tratamento curativo garantido. Pr\xE1ticas de acolhimento e suporte ajudam a atenuar o desconforto: contato pele a pele, conten\xE7\xE3o calma no colo, diminui\xE7\xE3o de est\xEDmulos ambientais, massagens suaves no abdome no sentido hor\xE1rio e movimento gentil de flex\xE3o das perninhas. N\xE3o oferecer ch\xE1s nem rem\xE9dios sem prescri\xE7\xE3o m\xE9dica.",
    summary_en: "Infant colic features episodes of irritability and prolonged crying, typically beginning around 2 to 3 weeks of age and gradually easing by 3 to 4 months. Its precise cause is not fully established in medical literature, involving multiple developmental factors without a single isolated cause or guaranteed cure. Supportive comfort measures can help relieve distress: skin-to-skin contact, gentle holding, low-stimulation environments, soft clockwise abdominal massage, and gentle leg bending. Avoid teas or unprescribed medications.",
    conversationalAnswer_pt: "Algumas pr\xE1ticas de acolhimento e conforto podem ajudar a aliviar o desconforto do beb\xEA durante as crises de c\xF3lica:\n\n\u2022 Contato pele a pele no peito ou colo aquecido, transmitindo calma e aconchego.\n\u2022 Redu\xE7\xE3o de est\xEDmulos no ambiente, mantendo o quarto com pouca luz e sil\xEAncio.\n\u2022 Massagens circulares e suaves na barriguinha no sentido hor\xE1rio e movimento delicado de flex\xE3o das perninhas, respeitando o conforto da crian\xE7a.\n\u2022 Conter o beb\xEA com firmeza e carinho, revezando os cuidados com outro adulto de apoio sempre que poss\xEDvel para evitar a exaust\xE3o.\n\nAs c\xF3licas e os per\xEDodos de choro mais intenso s\xE3o frequentes nas primeiras semanas de vida (com in\xEDcio comum entre a 2\xAA e a 3\xAA semana e redu\xE7\xE3o gradual por volta do 3\xBA ou 4\xBA m\xEAs). A literatura m\xE9dica indica que o quadro n\xE3o decorre de uma causa \xFAnica isolada. N\xE3o existe um tratamento \xFAnico ou cura garantida para as c\xF3licas.\n\nEvite oferecer ch\xE1s, solu\xE7\xF5es caseiras ou medicamentos sem orienta\xE7\xE3o do pediatra. Se o choro vier acompanhado de febre, v\xF4mitos, recusa persistente de mamar ou sangue nas fezes, procure atendimento m\xE9dico presencial imediato.",
    conversationalAnswer_en: "Supportive comfort practices can help soothe your baby and ease distress during periods of colic:\n\n\u2022 Skin-to-skin contact against your chest or warm holding, providing calm reassurance.\n\u2022 Reducing environmental stimulation by dimming lights and creating a quiet space.\n\u2022 Gentle, clockwise circular tummy rubs and soft leg bending toward the abdomen, respecting your baby comfort.\n\u2022 Holding your baby steadily and taking turns with a partner or support person to avoid exhaustion.\n\nColic and intense crying episodes are common in early infancy (typically emerging around 2 to 3 weeks and easing around the 3rd or 4th month). Medical evidence shows that colic does not have a single isolated cause, and there is no guaranteed cure or single medication.\n\nDo not offer teas or medications without pediatric guidance. If crying is accompanied by fever, vomiting, feeding refusal, or blood in the stool, seek prompt in-person medical care.",
    keywords_pt: ["colica", "colicas", "como lidar com colica", "como lidar com colicas", "aliviar colica", "dor de colica", "gases bebe", "choro de colica", "barriga dura colica"],
    keywords_en: ["colic", "infant colic", "how to handle colic", "dealing with colic", "soothing colic", "colic crying", "baby gas pain", "tummy discomfort"],
    sourceName: "Minist\xE9rio da Sa\xFAde do Brasil",
    document: "Caderneta da Crian\xE7a - Passaporte da Cidadania",
    edition: "5\xAA Edi\xE7\xE3o, 2022/2023",
    sectionOrPage: "P\xE1gina 39 (D\xFAvidas Comuns no Primeiro Trimestre - C\xF3licas)",
    url: "https://www.gov.br/saude/pt-br/assuntos/saude-de-a-a-z/s/saude-da-crianca/caderneta-da-crianca",
    validationStatus: "verified",
    countryJurisdiction: "BR"
  },
  {
    id: "ev-infant-crying-15",
    phase: "baby",
    stageRange: "0-12m",
    topic: "development",
    title_pt: "Compreens\xE3o do Choro do Beb\xEA e Estrat\xE9gias de Acolhimento",
    title_en: "Understanding Infant Crying and Soothing Strategies",
    summary_pt: "O choro \xE9 a forma prim\xE1ria de comunica\xE7\xE3o do rec\xE9m-nascido e lactente pequeno, expressando necessidades imediatas como fome, sono, fralda suja, calor, frio ou car\xEAncia de contato f\xEDsico e conten\xE7\xE3o. Quando as necessidades b\xE1sicas forem verificadas e o beb\xEA continuar chorando, recomenda-se acolhimento tranquilo, contato corporal e embalo suave. Se o choro for cont\xEDnuo, inconsol\xE1vel ou diferente do padr\xE3o habitual, a crian\xE7a deve ser avaliada por profissional de sa\xFAde para investigar causas de desconforto ou adoecimento.",
    summary_en: "Crying is your baby primary way of communicating in early infancy, signaling hunger, tiredness, a wet diaper, temperature discomfort, or simply the need for physical closeness and comfort. When immediate physical needs have been met and your baby continues to cry inconsolably, comforting steps include skin-to-skin holding, low-stimulation environments, and steady, slow rocking. If crying is persistent, inconsolable, or different from usual, seek in-person medical evaluation.",
    conversationalAnswer_pt: "O choro \xE9 a principal forma de comunica\xE7\xE3o do beb\xEA nos primeiros meses, sendo a maneira como ele expressa fome, sono, fralda molhada, desconforto t\xE9rmico ou necessidade de aconchego e contato f\xEDsico.\n\nQuando as necessidades imediatas j\xE1 foram checadas e o beb\xEA continua chorando muito sem que voc\xEA consiga acalm\xE1-lo, algumas medidas de suporte podem auxiliar:\n\n\u2022 Segurar o beb\xEA bem pr\xF3ximo ao seu corpo, transmitindo seu calor e o ritmo calmo da sua respira\xE7\xE3o.\n\u2022 Levar o beb\xEA para um ambiente mais silencioso e com pouca luz.\n\u2022 Falar com voz suave e embalar em ritmo constante e lento.\n\u2022 Se voc\xEA estiver se sentindo muito exausta ou tensa, revezar o colo com algu\xE9m da sua rede de apoio.\n\nSe o choro for inconsol\xE1vel, persistente por horas ou acompanhado de febre, palidez, gem\xEAncia ou recusa alimentar, leve o beb\xEA para avalia\xE7\xE3o m\xE9dica presencial.",
    conversationalAnswer_en: "Crying is your baby primary way of communicating in early infancy, signaling hunger, tiredness, a wet diaper, temperature discomfort, or simply the need for physical closeness and comfort.\n\nWhen immediate physical needs have been met and your baby continues to cry inconsolably, comforting steps include:\n\n\u2022 Holding your baby close against your body for warmth and steady heartbeat reassurance.\n\u2022 Moving to a quiet, dimly lit room to reduce overstimulation.\n\u2022 Speaking in a calm, soothing voice and rocking with slow, steady rhythm.\n\u2022 If you feel overwhelmed or exhausted, safely hand over to a partner or support person for a break.\n\nIf crying is inconsolable, persists for hours, or is accompanied by fever, pallor, moaning, or feeding refusal, seek in-person medical care promptly.",
    keywords_pt: ["chora muito", "bebe chorando", "choro persistente", "nao consigo acalmar", "como acalmar bebe", "choro inconsolavel", "acalmar choro", "bebe chora sem parar"],
    keywords_en: ["crying a lot", "baby crying", "persistent crying", "cannot calm baby", "how to soothe baby", "inconsolable cry", "soothing baby crying", "baby cries non stop"],
    sourceName: "Minist\xE9rio da Sa\xFAde do Brasil",
    document: "Caderneta da Crian\xE7a - Passaporte da Cidadania",
    edition: "5\xAA Edi\xE7\xE3o, 2022/2023",
    sectionOrPage: "P\xE1ginas 38-40 (Comunica\xE7\xE3o e Desenvolvimento no Primeiro Ano)",
    url: "https://www.gov.br/saude/pt-br/assuntos/saude-de-a-a-z/s/saude-da-crianca/caderneta-da-crianca",
    validationStatus: "verified",
    countryJurisdiction: "BR"
  },
  {
    id: "ev-prevent-falls-04",
    phase: "baby",
    stageRange: "0-24m",
    topic: "safety",
    title_pt: "Preven\xE7\xE3o de Quedas de Superf\xEDcies Elevadas",
    title_en: "Fall Prevention from Elevated Surfaces",
    summary_pt: "Quedas de trocadores, camas de adultos e sof\xE1s est\xE3o entre as causas mais frequentes de traumatismo craniano em lactentes. Beb\xEAs podem rolar ou se impulsionar de modo repentino, mesmo antes de dominarem o rolamento volunt\xE1rio. Regra de ouro: nunca deixar a crian\xE7a sozinha em superf\xEDcies altas, nem por um segundo. Deixar todo o material de troca ao alcance da m\xE3o antes de despir a crian\xE7a ou optar por trocar a fralda em tapete ou colch\xE3o diretamente no ch\xE3o.",
    summary_en: "Falls from changing tables, adult beds, and sofas represent one of the leading causes of infant head injuries. Infants can roll or push themselves unexpectedly before mastering purposeful rolling. Golden rule: never leave an infant unattended on an elevated surface for even a second. Gather all diapering essentials before placing the baby, or prefer changing diapers on a clean mat directly on the floor.",
    conversationalAnswer_pt: "A regra de ouro com beb\xEAs em superf\xEDcies altas \xE9 simples: nunca deix\xE1-los sozinhos, nem por um \xFAnico segundo.\n\nMesmo antes de aprender a rolar por conta pr\xF3pria, o beb\xEA pode se impulsionar ou escorregar de repente do trocador, da cama ou do sof\xE1. Quedas dessas alturas representam uma das causas mais comuns de batidas na cabecinha.\n\nUma dica pr\xE1tica \xE9 deixar fraldas, len\xE7os e roupinhas sempre ao alcance da sua m\xE3o antes de colocar o beb\xEA no trocador. E sempre que puder, prefira trocar a fralda em um tapetinho limpo no ch\xE3o.",
    conversationalAnswer_en: "The golden rule for babies on high surfaces is simple: never leave them unattended, even for a single second.\n\nEven before mastering rolling, infants can suddenly push themselves or wiggle off changing tables, adult beds, or sofas. Falls from these heights are among the most frequent causes of head bumps and injuries.\n\nA great practical habit is preparing diapers, wipes, and clothes within arm reach before setting your baby down, or choosing to change diapers on a clean mat right on the floor.",
    keywords_pt: ["queda", "cair", "trocador", "cama adulto", "sofa", "superficie alta", "acidente bebe", "trauma cabeca"],
    keywords_en: ["fall", "falling", "changing table", "bed", "sofa", "elevated surface", "baby accident", "head bump"],
    sourceName: "Minist\xE9rio da Sa\xFAde do Brasil",
    document: "Caderneta da Crian\xE7a - Passaporte da Cidadania",
    edition: "5\xAA Edi\xE7\xE3o, 2022/2023",
    sectionOrPage: "P\xE1ginas 44-45 (Preven\xE7\xE3o de Acidentes Dom\xE9sticos)",
    url: "https://www.gov.br/saude/pt-br/assuntos/saude-de-a-a-z/s/saude-da-crianca/caderneta-da-crianca",
    validationStatus: "verified",
    countryJurisdiction: "BR"
  },
  {
    id: "ev-bath-water-temp-05",
    phase: "baby",
    stageRange: "0-12m",
    topic: "safety",
    title_pt: "Seguran\xE7a no Banho e Temperatura da \xC1gua",
    title_en: "Bath Safety and Water Temperature Verification",
    summary_pt: "A pele do beb\xEA \xE9 mais fina e sens\xEDvel a queimaduras t\xE9rmicas e hipotermia. A temperatura recomendada da \xE1gua do banho \xE9 de 36\xB0C a 37\xB0C. Antes de colocar o beb\xEA, o cuidador deve sempre testar a temperatura usando o dorso da m\xE3o ou o cotovelo, certificando-se de que a \xE1gua esteja agradavelmente morna. Jamais deixar o beb\xEA desacompanhado na banheira ou balde, mesmo com pouca \xE1gua, devido ao risco iminente de afogamento silencioso.",
    summary_en: "Infant skin is significantly thinner and vulnerable to thermal burns and rapid heat loss. The recommended bath water temperature is 36\xB0C to 37\xB0C (97\xB0F-98.6\xB0F). Always test the water with the back of your hand or inner elbow before immersing the baby. Never leave an infant unattended in a tub or bath seat, even in shallow water, due to the acute risk of silent drowning.",
    conversationalAnswer_pt: "A pele do beb\xEA \xE9 bem mais fininha e delicada do que a nossa, por isso a \xE1gua do banho deve estar morninha, entre 36\xB0C e 37\xB0C.\n\nO teste mais f\xE1cil e confi\xE1vel \xE9 usar o dorso da m\xE3o ou o cotovelo: a \xE1gua deve dar uma sensa\xE7\xE3o agrad\xE1vel, sem parecer quente demais nem fria.\n\nE outro cuidado indispens\xE1vel: nunca deixe o beb\xEA desacompanhado na banheira, nem por um instante e mesmo com pouquinha \xE1gua, pois beb\xEAs pequenos podem se desequilibrar em segundos.",
    conversationalAnswer_en: "A baby skin is much thinner and more sensitive than adult skin, so bath water should be comfortably lukewarm, between 36\xB0C and 37\xB0C (97\xB0F\u201398.6\xB0F).\n\nThe easiest test is dipping the back of your hand or your inner elbow: the water should feel comfortably warm, neither hot nor cold.\n\nEqually important: never leave your baby alone in the tub, even for an instant and even in very shallow water, as babies can lose their balance silently in seconds.",
    keywords_pt: ["banho", "temperatura agua", "agua morna", "cotovelo", "queimadura banho", "afogamento banheira", "banheira"],
    keywords_en: ["bath", "water temperature", "warm water", "elbow test", "bath safety", "tub drowning", "baby tub"],
    sourceName: "Minist\xE9rio da Sa\xFAde do Brasil",
    document: "Caderneta da Crian\xE7a - Passaporte da Cidadania",
    edition: "5\xAA Edi\xE7\xE3o, 2022/2023",
    sectionOrPage: "P\xE1ginas 45-46 (Higiene e Preven\xE7\xE3o de Queimaduras)",
    url: "https://www.gov.br/saude/pt-br/assuntos/saude-de-a-a-z/s/saude-da-crianca/caderneta-da-crianca",
    validationStatus: "verified",
    countryJurisdiction: "BR"
  },
  {
    id: "ev-choking-hazards-06",
    phase: "baby",
    stageRange: "0-24m",
    topic: "safety",
    title_pt: "Preven\xE7\xE3o de Engasgos e Sufoca\xE7\xE3o por Objetos Pequenos",
    title_en: "Choking and Suffocation Prevention from Small Objects",
    summary_pt: "A explora\xE7\xE3o oral \xE9 uma etapa natural do desenvolvimento psicomotor, mas apresenta alto risco de aspira\xE7\xE3o de corpo estranho. Qualquer objeto ou brinquedo menor que 3 cm de di\xE2metro (que caiba dentro de um tubo de filme fotogr\xE1fico ou rolo de papel higi\xEAnico) deve ser mantido fora do alcance da crian\xE7a. Cuidado rigoroso com baterias do tipo bot\xE3o, moedas, tampinhas, bal\xF5es de l\xE1tex, gr\xE3os crus e castanhas inteiras.",
    summary_en: "Oral exploration is a normal milestone in infant sensory-motor development, yet poses high foreign-body aspiration hazards. Any toy or object smaller than 3 cm in diameter (able to fit through a toilet paper cardboard cylinder) must be strictly kept out of reach. Pay critical attention to button batteries, coins, caps, deflated balloons, whole nuts, and raw grains.",
    conversationalAnswer_pt: "Levar as m\xE3ozinhas e objetos \xE0 boca \xE9 uma etapa saud\xE1vel de curiosidade do beb\xEA, mas exige aten\xE7\xE3o redobrada com coisas pequenas pela casa.\n\nComo refer\xEAncia pr\xE1tica, qualquer objeto menor do que cerca de 3 cent\xEDmetros \u2014 ou que caiba com folga dentro de um rolinho de papel higi\xEAnico \u2014 deve ficar fora do alcance da crian\xE7a.\n\nAten\xE7\xE3o especial a moedas, baterias bot\xE3o de rel\xF3gio, tampinhas de garrafa, bal\xF5es de festa e gr\xE3os inteiros (como amendoins ou castanhas), que t\xEAm alto risco de engasgo.",
    conversationalAnswer_en: "Bringing hands and toys to the mouth is a healthy exploratory milestone for babies, but requires close attention to small objects around the house.\n\nA helpful rule of thumb: any object smaller than 3 centimeters \u2014 or that fits easily inside a toilet paper cardboard roll \u2014 should be kept out of reach.\n\nKeep particular watch over coins, small button batteries, bottle caps, party balloons, and whole nuts or raw grains, which present high choking hazards.",
    keywords_pt: ["engasgo", "engasgar", "objeto pequeno", "brinquedo pequeno", "asfixia", "moeda", "bateria botao", "aspiracao"],
    keywords_en: ["choking", "small objects", "toy safety", "aspiration", "suffocation", "coins", "button batteries", "choke hazard"],
    sourceName: "Minist\xE9rio da Sa\xFAde do Brasil",
    document: "Caderneta da Crian\xE7a - Passaporte da Cidadania",
    edition: "5\xAA Edi\xE7\xE3o, 2022/2023",
    sectionOrPage: "P\xE1gina 46 (Preven\xE7\xE3o de Sufoca\xE7\xE3o e Aspira\xE7\xE3o)",
    url: "https://www.gov.br/saude/pt-br/assuntos/saude-de-a-a-z/s/saude-da-crianca/caderneta-da-crianca",
    validationStatus: "verified",
    countryJurisdiction: "BR"
  },
  {
    id: "ev-pregnancy-sleep-fatigue-07",
    phase: "pregnancy",
    stageRange: "1st-trimester",
    topic: "maternal_rest",
    title_pt: "Sono e Cansa\xE7o Intenso no Primeiro Trimestre da Gesta\xE7\xE3o",
    title_en: "Sleepiness and Intense Fatigue in the First Trimester of Pregnancy",
    summary_pt: "O aumento expressivo de sonol\xEAncia e fadiga no in\xEDcio da gravidez \xE9 fisiol\xF3gico e esperado. Decorre principalmente da eleva\xE7\xE3o acentuada dos n\xEDveis de progesterona, da expans\xE3o do volume sangu\xEDneo e da alta demanda metab\xF3lica para a forma\xE7\xE3o inicial da placenta e \xF3rg\xE3os embrion\xE1rios. Recomenda-se repousar sempre que o corpo solicitar, manter hidrata\xE7\xE3o abundante, fracionar refei\xE7\xF5es para evitar hipoglicemia e delegar tarefas com o apoio da fam\xEDlia e parceiro.",
    summary_en: "Marked increase in sleepiness and physical fatigue during early pregnancy is completely physiological. It is primarily driven by sharp rises in progesterone levels, rapid plasma volume expansion, and the intense metabolic demands of early placental and embryonic organogenesis. Rest whenever possible, prioritize hydration, eat smaller and more frequent balanced meals to prevent hypoglycemia, and share chores with family support.",
    conversationalAnswer_pt: "Sentir muito sono e um cansa\xE7o pesado no come\xE7o da gravidez \xE9 completamente normal e esperado.\n\nSeu corpo est\xE1 trabalhando em ritmo acelerado para formar a placenta e os primeiros \xF3rg\xE3os do embri\xE3o, al\xE9m de passar por uma onda hormonal intensa de progesterona, que naturalmente d\xE1 aquela sensa\xE7\xE3o de sono irresist\xEDvel.\n\nO melhor rem\xE9dio \xE9 respeitar o que o seu corpo est\xE1 pedindo: tire pequenos cochilos sempre que der, beba bastante \xE1gua, divida as refei\xE7\xF5es em por\xE7\xF5es menores ao longo do dia e conte com a ajuda da sua rede de apoio para as tarefas de casa.",
    conversationalAnswer_en: "Feeling deeply exhausted and overwhelmingly sleepy during the first weeks of pregnancy is completely natural and expected.\n\nYour body is working around the clock to build the placenta and nurture the early embryo, alongside a surge in progesterone that acts as a natural relaxant.\n\nThe best response is listening to what your body is asking for: take short naps when possible, stay well hydrated, eat small and frequent meals to keep energy steady, and lean on family support for daily chores.",
    keywords_pt: ["sono gravidez", "muito sono gestacao", "cansaco primeiro trimestre", "fadiga gestante", "progesterona sono", "descanso gravidez"],
    keywords_en: ["pregnancy sleep", "first trimester fatigue", "tired in pregnancy", "sleepy pregnant", "progesterone fatigue", "pregnancy rest"],
    sourceName: "Minist\xE9rio da Sa\xFAde do Brasil",
    document: "Caderneta da Gestante",
    edition: "6\xAA Edi\xE7\xE3o, 2022",
    sectionOrPage: "P\xE1gina 28 (Sintomas Comuns no Primeiro Trimestre)",
    url: "https://www.gov.br/saude/pt-br/assuntos/saude-de-a-a-z/s/saude-da-mulher/caderneta-da-gestante",
    validationStatus: "verified",
    countryJurisdiction: "BR"
  },
  {
    id: "ev-pregnancy-nutrition-risks-08",
    phase: "pregnancy",
    stageRange: "all-pregnancy",
    topic: "nutrition",
    title_pt: "Cuidados Alimentares e Alimentos a Evitar na Gesta\xE7\xE3o",
    title_en: "Dietary Precautions and Foods to Avoid During Pregnancy",
    summary_pt: "Para prevenir infec\xE7\xF5es cong\xEAnitas graves como toxoplasmose, listeriose e salmonelose, a gestante deve evitar carnes, aves e peixes crus ou malpassados; queijos feitos com leite n\xE3o pasteurizado (brie, camembert, queijo minas frescal artesanal sem registro); ovos crus ou com gema mole; e embutidos crus. Todas as frutas e vegetais consumidos crus devem ser lavados em \xE1gua corrente e desinfetados em solu\xE7\xE3o clorada. Bebidas alco\xF3licas devem ser evitadas em qualquer quantidade, pois n\xE3o h\xE1 limite seguro conhecido para o feto.",
    summary_en: "To prevent severe congenital infections including toxoplasmosis, listeriosis, and salmonellosis, pregnant women must avoid raw or undercooked meats, poultry, and fish; unpasteurized milk and soft cheeses; raw or runny eggs; and raw cured meats. All raw fruits and vegetables must be thoroughly washed and disinfected. Alcohol consumption must be completely avoided at all stages, as there is no known safe intake threshold for fetal health.",
    conversationalAnswer_pt: "Durante a gesta\xE7\xE3o, alguns cuidados com a comida s\xE3o fundamentais para proteger a sua sa\xFAde e o desenvolvimento do beb\xEA.\n\nEvite carnes, peixes ou aves cruas ou malpassadas, ovos com gema mole e queijos feitos com leite n\xE3o pasteurizado (como queijo minas frescal sem inspe\xE7\xE3o, brie ou camembert), devido ao risco de infec\xE7\xF5es como toxoplasmose e listeriose.\n\nLave muito bem as frutas e verduras em \xE1gua corrente e fa\xE7a a higieniza\xE7\xE3o com solu\xE7\xE3o clorada pr\xF3pria para alimentos. E lembre-se: bebidas alco\xF3licas devem ser totalmente evitadas, pois n\xE3o existe quantidade segura comprovada.",
    conversationalAnswer_en: "During pregnancy, a few straightforward food safety habits protect both your health and your baby development.\n\nAvoid raw or undercooked meats, raw fish, soft or runny eggs, and unpasteurized soft cheeses (such as raw milk cheese, brie, or camembert), to guard against infections like toxoplasmosis and listeriosis.\n\nWash all raw fruits and vegetables thoroughly under running water and disinfect raw greens. Keep in mind that alcohol should be completely avoided throughout pregnancy, as there is no known safe amount.",
    keywords_pt: ["alimentos evitar", "o que nao comer gravidez", "carne crua gestacao", "queijo cru", "toxoplasmose comida", "alcool gravidez"],
    keywords_en: ["foods to avoid pregnancy", "what not to eat pregnancy", "raw meat pregnancy", "unpasteurized cheese", "toxoplasmosis diet", "alcohol pregnancy"],
    sourceName: "Minist\xE9rio da Sa\xFAde do Brasil",
    document: "Caderneta da Gestante",
    edition: "6\xAA Edi\xE7\xE3o, 2022",
    sectionOrPage: "P\xE1ginas 34-35 (Alimenta\xE7\xE3o Saud\xE1vel e Segura na Gravidez)",
    url: "https://www.gov.br/saude/pt-br/assuntos/saude-de-a-a-z/s/saude-da-mulher/caderneta-da-gestante",
    validationStatus: "verified",
    countryJurisdiction: "BR"
  },
  {
    id: "ev-labor-early-signs-09",
    phase: "pregnancy",
    stageRange: "3rd-trimester",
    topic: "warning_signs",
    title_pt: "Sinais de In\xEDcio do Trabalho de Parto e Quando Procurar a Maternidade",
    title_en: "Early Signs of Labor and When to Seek the Hospital",
    summary_pt: "O trabalho de parto ativo \xE9 caracterizado por contra\xE7\xF5es uterinas dolorosas e regulares (que endurecem toda a barriga), que ocorrem a cada 4 a 5 minutos, durando cerca de 40 a 60 segundos, mantendo esse padr\xE3o por pelo menos 1 a 2 horas cont\xEDnuas. A perda do tamp\xE3o mucoso (secre\xE7\xE3o gelatinosa com estrias de sangue) pode ocorrer dias antes e n\xE3o exige corrida imediata ao hospital se n\xE3o houver contra\xE7\xF5es regulares ou perda de l\xEDquido. Sinais de alerta imediato: sangramento vermelho vivo abundante, sa\xEDda repentina de l\xEDquido amni\xF3tico, aus\xEAncia ou redu\xE7\xE3o n\xEDtida dos movimentos do beb\xEA.",
    summary_en: "Active labor is defined by regular, painful uterine contractions that harden the entire abdomen, occurring every 4 to 5 minutes, lasting 40 to 60 seconds, and persisting consistently for at least 1 to 2 hours. Loss of the mucous plug (gelatinous discharge tinged with brown/pink streaks) can occur days before and does not require immediate hospital admission without regular contractions or ruptured membranes. Seek emergency maternity evaluation immediately for: bright red vaginal bleeding, sudden leakage of amniotic fluid, or noticeable decrease in fetal movements.",
    conversationalAnswer_pt: "O verdadeiro trabalho de parto se manifesta quando as contra\xE7\xF5es ficam r\xEDtmicas e constantes: a barriga inteira endurece com dor a cada 4 ou 5 minutos, durando cerca de 1 minuto, e esse ritmo se mant\xE9m firme por 1 a 2 horas seguidas.\n\nA sa\xEDda do tamp\xE3o mucoso (uma secre\xE7\xE3o gelatinosa, \xE0s vezes com raias de sangue) pode acontecer dias antes e n\xE3o \xE9 motivo de corrida para a maternidade se voc\xEA estiver sem contra\xE7\xF5es regulares e com a bolsa \xEDntegra.\n\nPor outro lado, procure a maternidade imediatamente se tiver sangramento vivo como menstrua\xE7\xE3o, perda s\xFAbita de l\xEDquido (bolsa rota) ou se sentir que o beb\xEA parou ou reduziu bastante os movimentos.",
    conversationalAnswer_en: "True active labor announces itself when contractions become regular and steady: your entire belly tightens with cramp-like sensations every 4 to 5 minutes, lasting about a minute each, continuing steadily for 1 to 2 hours.\n\nLosing the mucous plug (a jelly-like discharge with faint pink or brown streaks) often happens days before labor and does not require rushing to the hospital on its own if contractions are absent.\n\nHowever, head to the hospital immediately if you notice bright red vaginal bleeding, a sudden leak of clear fluid (water breaking), or a clear decrease in your baby movements.",
    keywords_pt: ["sinais trabalho de parto", "contracoes ritmicas", "quando ir maternidade", "bolsa estourou", "tampao mucoso", "inicio parto"],
    keywords_en: ["labor signs", "contractions timing", "when to go to hospital", "water breaking", "mucous plug", "labor starting"],
    sourceName: "Minist\xE9rio da Sa\xFAde do Brasil",
    document: "Caderneta da Gestante",
    edition: "6\xAA Edi\xE7\xE3o, 2022",
    sectionOrPage: "P\xE1ginas 52-54 (O Trabalho de Parto e a Chegada \xE0 Maternidade)",
    url: "https://www.gov.br/saude/pt-br/assuntos/saude-de-a-a-z/s/saude-da-mulher/caderneta-da-gestante",
    validationStatus: "verified",
    countryJurisdiction: "BR"
  },
  {
    id: "ev-complementary-feeding-10",
    phase: "baby",
    stageRange: "6-24m",
    topic: "nutrition",
    title_pt: "Introdu\xE7\xE3o Alimentar Complementar a partir dos 6 Meses",
    title_en: "Complementary Feeding Introduction Starting at 6 Months",
    summary_pt: "At\xE9 os 6 meses de vida, o aleitamento materno deve ser exclusivo (n\xE3o oferecer \xE1gua, ch\xE1s ou outros leites). Aos 6 meses completos, mantendo o leite materno, inicia-se a alimenta\xE7\xE3o complementar com alimentos in natura (cereais, tub\xE9rculos, leguminosas, legumes, verduras, carnes e frutas). A consist\xEAncia inicial deve ser pastosa e espessa, amassada com garfo \u2014 nunca liquidificada nem passada na peneira, para estimular a mastiga\xE7\xE3o e aceita\xE7\xE3o de texturas. N\xE3o adicionar sal, a\xE7\xFAcar, caldos industrializados ou mel.",
    summary_en: "Exclusive breastfeeding is recommended until 6 completed months (no water, teas, or other milks needed). At 6 months, while continuing breastfeeding, introduce complementary real foods: grains, roots, legumes, vegetables, fruits, and meats. Initial texture should be thick and mashed with a fork \u2014 never blended or strained \u2014 to promote active chewing and sensory development. Do not add salt, sugar, honey (botulism risk under 1 year), or ultra-processed seasonings.",
    conversationalAnswer_pt: "At\xE9 os 6 meses, o leite materno supre tudo o que o beb\xEA precisa \u2014 nem de \xE1gua ele necessita.\n\nA partir dos 6 meses completos, mantendo o peito, come\xE7a a introdu\xE7\xE3o dos primeiros alimentos de verdade: legumes, tub\xE9rculos, feij\xF5es, cereais, carnes e frutinhas frescas.\n\nO segredo da textura \xE9 amassar com o garfo, sem bater no liquidificador nem passar na peneira, para que o beb\xEA sinta os pedacinhos e aprenda a mastigar. Nada de colocar sal, a\xE7\xFAcar ou caldos prontos, e mel \xE9 totalmente contraindicado antes de 1 ano.",
    conversationalAnswer_en: "For the first 6 months, breast milk provides all the nutrition and hydration your baby needs \u2014 not even water is necessary.\n\nStarting at 6 months, while continuing nursing, complementary real foods begin: vegetables, root crops, beans, grains, meats, and fresh fruits.\n\nThe key to texture is simply mashing with a fork \u2014 avoid blenders or strainers so your baby discovers different textures and learns to chew. There is no need for added salt or sugar, and honey should be completely avoided before 1 year of age.",
    keywords_pt: ["introducao alimentar 6 meses", "primeiras papinhas", "garfo comida bebe", "sal acucar bebe", "quando dar comida", "fruta bebe"],
    keywords_en: ["complementary feeding 6 months", "baby solid foods", "mashed food fork", "salt sugar baby", "starting solids", "baby weaning"],
    sourceName: "Minist\xE9rio da Sa\xFAde do Brasil",
    document: "Guia Alimentar para Crian\xE7as Brasileiras Menores de 2 Anos",
    edition: "Edi\xE7\xE3o 2019",
    sectionOrPage: "P\xE1ginas 48-52 (A Alimenta\xE7\xE3o aos 6 Meses de Vida)",
    url: "https://www.gov.br/saude/pt-br/assuntos/saude-de-a-a-z/s/saude-da-crianca/guia-alimentar-criancas-menores-de-2-anos",
    validationStatus: "verified",
    countryJurisdiction: "BR"
  },
  {
    id: "ev-responsive-care-11",
    phase: "baby",
    stageRange: "0-24m",
    topic: "development",
    title_pt: "Cuidados Responsivos e Est\xEDmulos Afetuosos no Desenvolvimento",
    title_en: "Responsive Caregiving and Nurturing Early Interactions",
    summary_pt: 'O c\xE9rebro do beb\xEA constr\xF3i conex\xF5es neurais fundamentais a partir das intera\xE7\xF5es interpessoais cotidianas. O cuidado responsivo ("serve and return") consiste em observar os sinais da crian\xE7a (olhares, balbucios, gestos e choros) e responder prontamente com acolhimento, afeto, contato visual e fala modulada. Conversar, cantar, olhar nos olhos e segurar no colo promovem apego seguro, autorregula\xE7\xE3o emocional e ampliam o vocabul\xE1rio futuro.',
    summary_en: 'The infant brain establishes foundational neural circuitry through everyday reciprocal social interactions. Responsive caregiving ("serve and return") means tuning into the baby cues (gazes, vocalizations, gestures, cries) and responding warmly with eye contact, affection, and vocal soothing. Talking, singing, reading, and holding the child foster secure attachment, emotional self-regulation, and robust cognitive development.',
    conversationalAnswer_pt: "O c\xE9rebro do seu beb\xEA aprende e se desenvolve atrav\xE9s das trocas afetuosas do dia a dia.\n\nQuando o beb\xEA balbucia, aponta ou olha para voc\xEA e voc\xEA responde com um sorriso, conversando ou imitando o som dele, os neur\xF4nios criam conex\xF5es vitais para a linguagem e para o sentimento de seguran\xE7a.\n\nCantar, conversar enquanto troca a fralda, olhar nos olhos e dar colo s\xE3o os est\xEDmulos mais poderosos e comprovados para essa fase da vida.",
    conversationalAnswer_en: "Your baby brain builds its foundational wiring through everyday loving interactions.\n\nWhen your baby coos, points, or looks at you and you respond with a smile, words, or warm gestures, neural circuits light up, strengthening communication and emotional security.\n\nTalking during diaper changes, singing gentle songs, keeping eye contact, and offering affectionate cuddles are the most powerful stimulants in these first years.",
    keywords_pt: ["cuidados responsivos", "desenvolvimento cerebral", "olhar nos olhos", "conversar bebe", "estimulo afetuoso", "v\xEDnculo mae bebe"],
    keywords_en: ["responsive caregiving", "brain development", "eye contact", "talking to baby", "nurturing interactions", "infant bonding"],
    sourceName: "OMS / UNICEF",
    document: "Nurturing Care Framework for Early Childhood Development",
    edition: "Edi\xE7\xE3o Global 2018",
    sectionOrPage: "P\xE1ginas 14-16 (Responsive Caregiving Strategic Component)",
    url: "https://nurturing-care.org/",
    validationStatus: "verified",
    countryJurisdiction: "GLOBAL"
  },
  {
    id: "ev-postpartum-shared-rest-12",
    phase: "baby",
    stageRange: "0-3m",
    topic: "maternal_rest",
    title_pt: "Sono Fragmentado e Repouso Compartilhado no P\xF3s-Parto",
    title_en: "Fragmented Sleep and Shared Rest in the Postpartum Period",
    summary_pt: "No puerp\xE9rio imediato, os ciclos de mamadas a cada 2 a 3 horas e a adapta\xE7\xE3o circadiana do rec\xE9m-nascido resultam em sono materno altamente fragmentado. O Minist\xE9rio da Sa\xFAde recomenda que a rede de apoio familiar assuma integralmente as tarefas dom\xE9sticas, os cuidados com a alimenta\xE7\xE3o da casa e o suporte pr\xE1tico, permitindo que a pu\xE9rpera possa dormir nos mesmos intervalos em que o beb\xEA descansa. O repouso adequado \xE9 indispens\xE1vel para a recupera\xE7\xE3o f\xEDsica do parto e para a preven\xE7\xE3o de sobrecarga emocional.",
    summary_en: "During the early postpartum period, round-the-clock feeding cycles every 2 to 3 hours cause severe maternal sleep fragmentation. Health guidelines strongly urge family and partner support networks to take over domestic chores, cooking, and household responsibilities so the mother can rest whenever the newborn sleeps. Adequate rest is essential for postpartum physical healing and for mitigating exhaustion and emotional distress.",
    conversationalAnswer_pt: "Cuidar de um rec\xE9m-nascido com mamadas a cada duas ou tr\xEAs horas deixa o sono materno muito picado e cansativo.\n\nPara que o corpo se recupere do parto e voc\xEA n\xE3o se sobrecarregue, \xE9 fundamental contar com a rede de apoio: parceiro, familiares ou amigos devem assumir a limpeza, as compras e as refei\xE7\xF5es da casa.\n\nIsso permite que voc\xEA consiga descansar nos mesmos intervalos em que o beb\xEA dorme, sem carregar o peso das tarefas cotidianas sozinha.",
    conversationalAnswer_en: "Caring for a newborn around the clock with feedings every two or three hours inevitably leads to broken, exhausting sleep.\n\nFor your body to heal and to prevent postpartum overwhelm, lean into your support network: partners, relatives, or trusted friends should take charge of household chores, meals, and errands.\n\nThis creates space for you to rest whenever your baby sleeps, rather than carrying the weight of the household alone.",
    keywords_pt: ["sono puerperio", "sono fragmentado mae", "cansaco pos parto", "rede de apoio mae", "descanso puerperio"],
    keywords_en: ["postpartum sleep", "fragmented sleep mother", "postpartum exhaustion", "support network postpartum", "maternal rest"],
    sourceName: "Minist\xE9rio da Sa\xFAde do Brasil",
    document: "Caderneta da Gestante",
    edition: "6\xAA Edi\xE7\xE3o, 2022",
    sectionOrPage: "P\xE1gina 38 (P\xF3s-Parto e Cuidados com a M\xE3e)",
    url: "https://www.gov.br/saude/pt-br/assuntos/saude-de-a-a-z/s/saude-da-mulher/caderneta-da-gestante",
    validationStatus: "verified",
    countryJurisdiction: "BR"
  },
  {
    id: "ev-tummy-time-16",
    phase: "baby",
    stageRange: "0-12m",
    topic: "tummy_time",
    title_pt: "Brincar de Bru\xE7os com Seguran\xE7a (Tummy Time) e Desenvolvimento Motor",
    title_en: "Safe Tummy Time for Infant Motor Development and Prevention",
    summary_pt: "O est\xEDmulo de bru\xE7os (tummy time) enquanto acordado \xE9 essencial para o desenvolvimento motor infantil, promovendo o fortalecimento dos m\xFAsculos do pesco\xE7o, ombros, bra\xE7os e tronco, al\xE9m de prevenir o achatamento craniano postural (plagiocefalia posicional). A Organiza\xE7\xE3o Mundial da Sa\xFAde (OMS, 2019) recomenda acumular pelo menos 30 minutos di\xE1rios em posi\xE7\xE3o prona distribu\xEDdos ao longo do dia quando o lactente que ainda n\xE3o se desloca estiver acordado. Diretrizes da Academia Americana de Pediatria (AAP - Back to Sleep, Tummy to Play): 1) Praticar exclusivamente com o beb\xEA acordado e sob supervis\xE3o atenta e cont\xEDnua de um adulto; 2) Iniciar desde os primeiros dias em sess\xF5es curtas de 2 a 3 minutos, 2 a 3 vezes ao dia, aumentando gradualmente conforme a toler\xE2ncia; 3) Para o sono, o beb\xEA deve ser colocado SEMPRE de barriga para cima (dormir de costas). Se adormecer de bru\xE7os durante o est\xEDmulo, deve ser imediatamente virado de barriga para cima em superf\xEDcie firme.",
    summary_en: "Awake tummy time is essential for early motor development, strengthening neck, shoulder, arm, and core muscles while preventing positional plagiocephaly (flat head syndrome). The World Health Organization (WHO, 2019) recommends at least 30 minutes in prone position spread throughout the day while awake for infants not yet mobile. American Academy of Pediatrics (AAP - Back to Sleep, Tummy to Play) safety guidance: 1) Strictly while awake and under continuous, direct adult supervision; 2) Start early with short, gentle sessions of 2 to 3 minutes, 2 to 3 times daily, building up as tolerated; 3) For sleep, infants must ALWAYS be placed on their back. If an infant falls asleep on their tummy during play, immediately turn them onto their back on a firm, flat surface.",
    conversationalAnswer_pt: 'Estimular o beb\xEA de bru\xE7os (conhecido como tummy time) \xE9 um cuidado muito importante para fortalecer os m\xFAsculos do pesco\xE7o, dos ombros e das costas, al\xE9m de prevenir o achatamento da cabecinha (plagiocefalia posicional).\n\nPara praticar com total seguran\xE7a, siga as recomenda\xE7\xF5es da Organiza\xE7\xE3o Mundial da Sa\xFAde (OMS) e da Academia Americana de Pediatria (AAP):\n\n1. Somente quando acordado e com supervis\xE3o direta: Um adulto deve ficar olhando atenta e continuamente para o beb\xEA. Nunca deixe o beb\xEA sozinho de bru\xE7os.\n\n2. Sess\xF5es curtas e progressivas: Comece aos pouquinhos, com 2 a 3 minutos por vez, 2 a 3 vezes ao dia (no ch\xE3o sobre um tapete firme, ou no peito de um adulto reclinado). Conforme o beb\xEA ganhar for\xE7a e toler\xE2ncia, aumente o tempo gradualmente. A OMS recomenda acumular pelo menos 30 minutos de barriguinha ao longo do dia para beb\xEAs que ainda n\xE3o se movimentam sozinhos.\n\n3. Para dormir, SEMPRE de barriga para cima: A regra de ouro \xE9 "de costas para dormir, de bru\xE7os para brincar" (*Back to Sleep, Tummy to Play*). Dormir de bru\xE7os n\xE3o \xE9 seguro. Se o beb\xEA demonstrar sonol\xEAncia ou adormecer durante o tummy time, vire-o imediatamente de barriga para cima em seu ber\xE7o.',
    conversationalAnswer_en: 'Tummy time is an essential practice to help your baby strengthen neck, shoulder, and trunk muscles, as well as prevent flat spots on the back of the head (positional plagiocephaly).\n\nTo practice safely, follow core guidance from the World Health Organization (WHO) and the American Academy of Pediatrics (AAP):\n\n1. Only while awake and directly supervised: An adult must stay close and actively watch at all times. Never leave a baby unattended on their tummy.\n\n2. Short, progressive sessions: Start gently with 2 to 3 minutes, 2 to 3 times a day (on a clean, firm floor mat or across a caregiver reclining chest). Gradually increase the duration as your baby gains strength and tolerance. The WHO recommends accumulating at least 30 minutes in prone position spread throughout the day while awake for infants not yet mobile.\n\n3. For sleep, ALWAYS on the back: The golden pediatric rule is "Back to Sleep, Tummy to Play". Sleeping on the stomach is unsafe. If your baby gets sleepy or falls asleep during tummy time, immediately turn them onto their back in their crib.',
    keywords_pt: [
      "tummy time",
      "de brucos",
      "brucos",
      "estimular de brucos",
      "estimular o bebe de brucos",
      "estimular bebe de brucos com seguranca",
      "barriga para baixo",
      "barriguinha",
      "fortalecer pescoco",
      "plagiocefalia",
      "cabeca chata",
      "brincar de brucos",
      "posicao prona",
      "desenvolvimento motor"
    ],
    keywords_en: [
      "tummy time",
      "safely do tummy time",
      "how do i safely do tummy time",
      "on tummy",
      "prone",
      "prone position",
      "belly time",
      "neck strength",
      "plagiocephaly",
      "flat head",
      "tummy play",
      "back to sleep tummy to play",
      "motor development"
    ],
    sourceName: "OMS / WHO e Academia Americana de Pediatria (AAP)",
    document: "Diretrizes de Atividade F\xEDsica e Sono (OMS, 2019) / Back to Sleep, Tummy to Play (AAP)",
    edition: "Edi\xE7\xF5es Oficiais 2019 e 2022",
    sectionOrPage: "OMS: pp. 16-21 (Recomenda\xE7\xF5es para Lactentes) / AAP: Diretrizes Cl\xEDnicas de Tummy Time",
    url: "https://www.who.int/news-room/detail/24-04-2019-to-grow-up-healthy-children-need-to-sit-less-and-play-more",
    validationStatus: "verified",
    countryJurisdiction: "GLOBAL"
  },
  {
    id: "ev-milestones-gross-motor-17",
    phase: "baby",
    stageRange: "0-24m",
    topic: "development",
    title_pt: "Marcos Motores Globais e Desenvolvimento da Marcha (0 a 24 Meses)",
    title_en: "Gross Motor Milestones and Walking Development (0 to 24 Months)",
    summary_pt: "Segundo o Estudo de Desenvolvimento Motor da Organiza\xE7\xE3o Mundial da Sa\xFAde (OMS, 2006) e a Caderneta da Crian\xE7a do Minist\xE9rio da Sa\xFAde: 1) Sustentar a cabe\xE7a: 2 a 4 meses; 2) Rolar: 4 a 6 meses; 3) Sentar sem apoio: m\xE9dia aos 6 a 7 meses, com janela normal saud\xE1vel entre 6 e 9 meses; 4) Ficar de p\xE9 com apoio: 8 a 10 meses; 5) Ficar de p\xE9 sozinho: 10 a 12 meses; 6) Primeiros passos e andar de forma independente: a idade m\xE9dia em que o beb\xEA come\xE7a a andar \xE9 aos 12 meses, com intervalo fisiol\xF3gico normal saud\xE1vel entre 9 e 18 meses. Beb\xEAs de 14 meses que ainda n\xE3o andam est\xE3o dentro da faixa esperada se apresentam boa evolu\xE7\xE3o motora geral. Sinal de alerta que exige avalia\xE7\xE3o m\xE9dica presencial: aus\xEAncia de marcha independente ap\xF3s os 18 meses completos.",
    summary_en: "According to the WHO Motor Development Study (2006) and the Brazilian Ministry of Health: 1) Head control: 2 to 4 months; 2) Rolling over: 4 to 6 months; 3) Sitting without support: average at 6 to 7 months, with a healthy normal window of 6 to 9 months; 4) Standing with support: 8 to 10 months; 5) Standing alone: 10 to 12 months; 6) First steps and independent walking: the average age babies start walking is around 12 months, with a normal physiological range between 9 and 18 months. A 14-month-old who has not walked yet is within normal variations if other motor skills progress well. Medical red flag requiring pediatric evaluation: lack of independent walking by 18 months.",
    conversationalAnswer_pt: "Em m\xE9dia, os beb\xEAs come\xE7am a andar por volta dos 12 meses (1 ano de idade). No entanto, existe uma faixa fisiol\xF3gica perfeitamente normal e saud\xE1vel entre os 9 e os 18 meses de vida.\n\nOs principais marcos motores acontecem de forma gradual:\n\u2022 Sustentar a cabecinha: entre 2 e 4 meses.\n\u2022 Rolar: entre 4 e 6 meses.\n\u2022 Sentar sem apoio: entre 6 e 9 meses (m\xE9dia aos 6-7 meses).\n\u2022 Ficar em p\xE9 com apoio: entre 8 e 10 meses.\n\u2022 Primeiros passos e marcha independente: entre 9 e 18 meses.\n\nSe o seu beb\xEA tem 14 meses e ainda n\xE3o anda sozinho, isso \xE9 absolutamente normal e esperado para muitas crian\xE7as, desde que ele continue ativo, fique em p\xE9 com apoio ou engatinhe.\n\nQuando consultar o pediatra: Se a crian\xE7a completar 18 meses sem dar passos independentes, ou se houver regress\xE3o em habilidades j\xE1 conquistadas, uma avalia\xE7\xE3o presencial do pediatra \xE9 fundamental.",
    conversationalAnswer_en: "On average, babies take their first independent steps around 12 months (1 year of age). However, the healthy normal window ranges from 9 to 18 months.\n\nGross motor milestones typically progress in this sequence:\n\u2022 Head control: 2 to 4 months.\n\u2022 Rolling over: 4 to 6 months.\n\u2022 Sitting without support: 6 to 9 months (average around 6-7 months).\n\u2022 Standing with support: 8 to 10 months.\n\u2022 Independent walking: 9 to 18 months.\n\nIf your 14-month-old is not walking yet, this is completely normal and common, provided they are curious, active, and exploring by cruising or crawling.\n\nWhen to speak with your pediatrician: If your child does not walk independently by 18 months, or loses previously acquired milestones, an in-person pediatric evaluation is recommended.",
    keywords_pt: [
      "andar",
      "comeca a andar",
      "idade media andar",
      "quando anda",
      "primeiros passos",
      "passos",
      "marcha",
      "sentar sem apoio",
      "com quantos meses senta",
      "14 meses nao anda",
      "marcos motores",
      "desenvolvimento motor",
      "idade media que o bebe comeca a andar",
      "quando o bebe anda"
    ],
    keywords_en: [
      "walking",
      "start walking",
      "start to walk",
      "average age walking",
      "first steps",
      "steps",
      "independent walking",
      "sitting unsupported",
      "when do babies sit",
      "14 months not walking",
      "motor milestones",
      "gross motor",
      "how old babies start walking",
      "when do babies walk"
    ],
    sourceName: "OMS (Organiza\xE7\xE3o Mundial da Sa\xFAde) e Minist\xE9rio da Sa\xFAde do Brasil",
    document: "WHO Motor Development Study e Caderneta da Crian\xE7a",
    edition: "Revis\xE3o T\xE9cnica Outubro 2026 / WHO Growth Reference Study (2006)",
    sectionOrPage: "Janela de Desenvolvimento Motor para a Marcha Independente (9 a 18 Meses)",
    url: "https://www.who.int/tools/child-growth-standards/standards/motor-development-milestones",
    validationStatus: "pending_review",
    countryJurisdiction: "GLOBAL"
  },
  {
    id: "ev-milestones-language-18",
    phase: "baby",
    stageRange: "0-24m",
    topic: "development",
    title_pt: "Marcos do Desenvolvimento da Linguagem e Primeiras Palavras",
    title_en: "Language Development Milestones and First Words",
    summary_pt: "Diretrizes da Academia Americana de Pediatria (AAP/CDC) e Caderneta da Crian\xE7a (MS): 1) Sorriso social e arrulhos: 2 a 3 meses; 2) Balbucio de s\xEDlabas repetidas (dadada, mamama): 6 a 9 meses; 3) Primeiras palavras com inten\xE7\xE3o comunicativa clara (mam\xE3, pap\xE1, \xE1gua, n\xE3o): m\xE9dia aos 12 meses (janela esperada entre 10 e 14 meses); 4) Vocabul\xE1rio em expans\xE3o e apontar para objetos desejados: 12 a 18 meses. Sinal de alerta para avalia\xE7\xE3o m\xE9dica: aus\xEAncia de balbucio aos 9 meses ou aus\xEAncia de qualquer palavra aos 15 a 18 meses.",
    summary_en: "According to AAP/CDC Milestones and the Brazilian Ministry of Health: 1) Social smile and cooing: 2 to 3 months; 2) Babbling repetitive consonant sounds (ba-ba, da-da): 6 to 9 months; 3) First meaningful words (mama, dada, water): average at 12 months (expected range 10 to 14 months); 4) Vocabulary expansion and pointing: 12 to 18 months. Red flags for pediatric/audiology review: no babbling by 9 months or absence of any single words by 15-18 months.",
    conversationalAnswer_pt: 'As primeiras palavras com significado costumam surgir em m\xE9dia por volta dos 12 meses (1 ano de idade), variando normalmente entre os 10 e os 14 meses.\n\nO desenvolvimento da comunica\xE7\xE3o acontece em etapas:\n\u2022 2 a 3 meses: sorrisos em resposta aos pais e sons de vogais (arrulhos).\n\u2022 6 a 9 meses: balbucio com repeti\xE7\xE3o de s\xEDlabas ("ba-ba-ba", "da-da-da", "ma-ma-ma").\n\u2022 10 a 14 meses: primeiras palavras com inten\xE7\xE3o ("mam\xE3", "pap\xE1", "\xE1gua", "d\xE1").\n\u2022 18 a 24 meses: expans\xE3o r\xE1pida de vocabul\xE1rio e in\xEDcio de frases de duas palavras.\n\nFalar bastante com a crian\xE7a no dia a dia, narrar o que voc\xEA est\xE1 fazendo e responder aos gestos dela estimulam muito a linguagem. Se aos 9 meses o beb\xEA n\xE3o balbuciar ou aos 15-18 meses n\xE3o disser nenhuma palavra, converse com o pediatra para uma avalia\xE7\xE3o.',
    conversationalAnswer_en: 'Babies typically say their first meaningful words around 12 months of age (average range between 10 and 14 months).\n\nCommunication develops in natural milestones:\n\u2022 2 to 3 months: social smiling and gentle cooing.\n\u2022 6 to 9 months: babbling repetitive sounds ("ba-ba", "da-da", "ma-ma").\n\u2022 10 to 14 months: first clear, meaningful words ("mama", "dada", "water", "more").\n\u2022 18 to 24 months: rapid vocabulary expansion and combining two simple words.\n\nTalking, singing, and responding to your baby cues nurture speech every day. If your baby does not babble by 9 months or has no single words by 15-18 months, consult your pediatrician.',
    keywords_pt: [
      "primeiras palavras",
      "comeca a falar",
      "quando fala",
      "falar",
      "balbucio",
      "balbuciar",
      "desenvolvimento da linguagem",
      "comunicacao",
      "idade primeiras palavras",
      "fala do bebe"
    ],
    keywords_en: [
      "first words",
      "start talking",
      "when do babies talk",
      "talking",
      "babbling",
      "babble",
      "language development",
      "speech milestones",
      "how old babies talk",
      "say first words"
    ],
    sourceName: "Minist\xE9rio da Sa\xFAde do Brasil e Academia Americana de Pediatria (AAP/CDC)",
    document: "Caderneta da Crian\xE7a e CDC Developmental Milestones",
    edition: "Revis\xE3o T\xE9cnica Outubro 2026 / CDC Guidelines 2022",
    sectionOrPage: "Marcos de Linguagem e Comunica\xE7\xE3o Infantil (10 a 14 Meses)",
    url: "https://www.cdc.gov/ncbddd/actearly/milestones/index.html",
    validationStatus: "pending_review",
    countryJurisdiction: "GLOBAL"
  },
  {
    id: "ev-water-hydration-infant-19",
    phase: "baby",
    stageRange: "0-12m",
    topic: "nutrition",
    title_pt: "Oferta de \xC1gua e Ch\xE1s na Inf\xE2ncia: Regra dos 6 Meses",
    title_en: "Water and Tea Intake for Infants: The 6-Month Guideline",
    summary_pt: "Recomenda\xE7\xF5es da Organiza\xE7\xE3o Mundial da Sa\xFAde (OMS) e Sociedade Brasileira de Pediatria (SBP): Beb\xEAs menores de 6 meses em aleitamento materno exclusivo ou f\xF3rmula infantil N\xC3O devem receber \xE1gua, ch\xE1s ou sucos. O leite materno \xE9 composto por mais de 85% de \xE1gua e fornece hidrata\xE7\xE3o completa, mesmo em dias de calor intenso. Oferecer \xE1gua antes dos 6 meses pode sobrecarregar os rins imaturos, diluir nutrientes vitais e reduzir as mamadas. A partir dos 6 meses completos, com o in\xEDcio da introdu\xE7\xE3o alimentar complementar, a \xE1gua pot\xE1vel (filtrada ou fervida) deve ser oferecida regularmente ao longo do dia em pequenos goles.",
    summary_en: "World Health Organization (WHO) and Brazilian Society of Pediatrics (SBP) guidelines: Infants under 6 months on exclusive breastfeeding or infant formula must NOT be given water, teas, or juices. Breast milk consists of more than 85% water, providing complete hydration even in hot climates. Giving water before 6 months risks water intoxication, electrolyte imbalances, and reduced breast milk intake. At 6 completed months, when complementary feeding starts, clean drinking water should be offered regularly throughout the day.",
    conversationalAnswer_pt: "Beb\xEAs menores de 6 meses em aleitamento materno exclusivo N\xC3O devem receber \xE1gua nem ch\xE1s. O leite da m\xE3e \xE9 composto por mais de 85% de \xE1gua e sacia plenamente a sede e a fome do beb\xEA, mesmo no ver\xE3o.\n\nDar \xE1gua para um beb\xEA pequeno de 3 meses \xE9 desnecess\xE1rio e prejudicial: pode encher o est\xF4mago pequeno dele de \xE1gua (fazendo com que mame menos leite nutritivo) e sobrecarregar os rins ainda imaturos.\n\nA regra oficial dos pediatras e da OMS \xE9 clara: a \xE1gua pot\xE1vel s\xF3 come\xE7a a ser oferecida a partir dos 6 meses de vida, junto com o in\xEDcio da introdu\xE7\xE3o alimentar.",
    conversationalAnswer_en: "Babies under 6 months on exclusive breastfeeding should NOT be given water or teas. Breast milk is over 85% water and provides all the hydration and nourishment your baby needs, even in hot weather.\n\nGiving water to a 3-month-old infant is unnecessary and carries health risks: it fills their tiny stomach with plain water (causing them to drink less nutrient-rich milk) and strains their immature kidneys.\n\nAccording to the WHO and pediatric societies, clean drinking water should only be introduced at 6 completed months, right alongside complementary solid foods.",
    keywords_pt: [
      "dar agua",
      "agua para bebe",
      "cha para bebe",
      "introduzir agua",
      "agua 3 meses",
      "posso dar agua para o bebe",
      "hidratacao bebe",
      "agua antes dos 6 meses",
      "quando dar agua"
    ],
    keywords_en: [
      "give water",
      "water for baby",
      "tea for baby",
      "introduce water",
      "water 3 months",
      "can i give water to baby",
      "hydration infant",
      "water before 6 months",
      "when to give water"
    ],
    sourceName: "Organiza\xE7\xE3o Mundial da Sa\xFAde (OMS) e Sociedade Brasileira de Pediatria (SBP)",
    document: "Guia Alimentar para Crian\xE7as Brasileiras Menores de 2 Anos",
    edition: "Revis\xE3o T\xE9cnica Outubro 2026 / Guia MS/SBP 2019",
    sectionOrPage: "Cap\xEDtulo 2: Aleitamento Materno e Hidrata\xE7\xE3o (pp. 35-42)",
    url: "https://www.gov.br/saude/pt-br/assuntos/saude-de-a-a-z/s/saude-da-crianca/guia-alimentar-para-criancas-brasileiras-menores-de-2-anos",
    validationStatus: "pending_review",
    countryJurisdiction: "GLOBAL"
  },
  {
    id: "ev-choking-vs-gag-reflex-20",
    phase: "baby",
    stageRange: "6-24m",
    topic: "safety",
    title_pt: "Diferencia\xE7\xE3o entre Reflexo de Gag (\xC2nsia de Prote\xE7\xE3o) e Engasgo Real",
    title_en: "Differentiating Gag Reflex from Actual Choking in Infants",
    summary_pt: "Diretrizes da Sociedade Brasileira de Pediatria (SBP) e Academia Americana de Pediatria (AAP): 1) Reflexo de Gag (\xE2nsia de prote\xE7\xE3o): \xE9 um reflexo fisiol\xF3gico normal e protetor do lactente na introdu\xE7\xE3o alimentar. Acontece quando peda\xE7os de comida tocam a parte anterior ou m\xE9dia da l\xEDngua. Sinais: o beb\xEA faz barulho, tosse, projeta a l\xEDngua para fora, fica com o rosto avermelhado e empurra o alimento. A via a\xE9rea est\xE1 aberta. Conduta: manter a calma, n\xE3o bater nas costas e jamais colocar o dedo \xE0s cegas na boca. 2) Engasgo real: emerg\xEAncia m\xE9dica com obstru\xE7\xE3o das vias a\xE9reas. Sinais: \xE9 silencioso, o beb\xEA n\xE3o consegue tossir, n\xE3o chora, n\xE3o respira e pode apresentar palidez ou l\xE1bios arroxeados (cianose). Conduta imediata: manobras de desengasgo (tapas interescapulares e compress\xF5es tor\xE1cicas) e acionamento do servi\xE7o de urg\xEAncia.",
    summary_en: "SBP and AAP pediatric safety guidance: 1) Gag reflex: a normal, protective physiological reflex during solid feeding. Triggered when food touches the tongue. Signs: loud coughing, retching, tongue thrusting, red face. The airway is completely open. Parents should stay calm, give the baby time to clear it, and never blind-sweep the mouth. 2) Actual choking: a silent, life-threatening airway obstruction. Signs: baby cannot cough, cry, or make sounds, with struggle to breathe and blue/pale lips (cyanosis). Immediate action: back blows and chest thrusts, calling emergency services immediately.",
    conversationalAnswer_pt: "Saber a diferen\xE7a entre o reflexo de gag (\xE2nsia) e o engasgo de verdade traz muita seguran\xE7a para a fam\xEDlia na introdu\xE7\xE3o alimentar:\n\n\u2022 Reflexo de Gag (\xE2nsia normal de prote\xE7\xE3o): O beb\xEA faz barulho, tosse, abre a boca, coloca a l\xEDngua para fora e \xE0s vezes fica vermelhinho. Ele est\xE1 no controle da via a\xE9rea e usando um reflexo natural para empurrar um peda\xE7o grande para a frente. O segredo \xE9 manter a calma, deixar o beb\xEA tossir e NUNCA colocar o dedo \xE0s cegas na boca dele.\n\n\u2022 Engasgo real (emerg\xEAncia): O engasgo \xE9 silencioso. A via a\xE9rea fica trancada, o beb\xEA N\xC3O consegue tossir, n\xE3o emite nenhum som, n\xE3o chora e os l\xE1bios podem come\xE7ar a ficar roxos. Diante de engasgo real, aplique imediatamente as manobras de desengasgo infantil (tapas firmes nas costas e compress\xF5es no peito) e chame o socorro m\xE9dico de urg\xEAncia (192 no Brasil).",
    conversationalAnswer_en: "Understanding the difference between the gag reflex and actual choking gives parents peace of mind during complementary feeding:\n\n\u2022 Gag Reflex (protective and normal): It is loud! Your baby will cough, sputter, thrust their tongue forward, and their face may turn red. Their airway is wide open and they are safely working the food forward. Stay calm, give them space to clear it, and never stick your fingers blindly into their mouth.\n\n\u2022 Actual Choking (medical emergency): Choking is silent. The airway is blocked. Your baby CANNOT cough, cannot cry, makes no sound, and lips or face may turn blue. If your baby is truly choking, immediately begin infant back blows and chest thrusts and call local emergency medical services.",
    keywords_pt: [
      "reflexo de gag",
      "ansia",
      "diferenca engasgo ansia",
      "engasgo real",
      "engasgo vs gag",
      "ansia de engasgo",
      "diferenca entre ansia e engasgo",
      "introducao alimentar engasgo"
    ],
    keywords_en: [
      "gag reflex",
      "gagging",
      "difference choking gagging",
      "actual choking",
      "choking vs gag",
      "difference between gag and choke",
      "solid food choking",
      "gagging versus choking"
    ],
    sourceName: "Academia Americana de Pediatria (AAP) e Sociedade Brasileira de Pediatria (SBP)",
    document: "Manual de Alimenta\xE7\xE3o da Crian\xE7a e Guia de Preven\xE7\xE3o de Acidentes",
    edition: "Revis\xE3o T\xE9cnica Outubro 2026 / SBP/AAP 2021",
    sectionOrPage: "Mecanismos de Prote\xE7\xE3o da Via A\xE9rea na Introdu\xE7\xE3o Alimentar (Gag Reflex vs Choking)",
    url: "https://www.sbp.com.br/departamentos-cientificos/nutrologia/",
    validationStatus: "pending_review",
    countryJurisdiction: "GLOBAL"
  },
  {
    id: "ev-infant-sleep-routine-wake-windows-21",
    phase: "baby",
    stageRange: "0-12m",
    topic: "sleep_duration",
    title_pt: "Janelas de Vig\xEDlia e Sinais de Cansa\xE7o do Beb\xEA",
    title_en: "Infant Wake Windows and Tired Cues",
    summary_pt: "Consensos da Sociedade Brasileira de Pediatria (SBP) e American Academy of Sleep Medicine (AASM): Janela de vig\xEDlia \xE9 o per\xEDodo que o beb\xEA consegue permanecer acordado com conforto entre os per\xEDodos de sono, sem atingir a exaust\xE3o (overtired). Janelas m\xE9dias por idade: 0 a 3 meses: 45 a 90 minutos; 4 a 6 meses: 1,5 a 2,5 horas; 7 a 12 meses: 2,5 a 3,5 horas. Sinais precoces de sono: olhar fixo, bocejo, esfregar os olhos, diminuir a agita\xE7\xE3o motora e buscar o peito. Choro inconsol\xE1vel e irritabilidade intensa costumam indicar que a janela de vig\xEDlia foi ultrapassada.",
    summary_en: "SBP and American Academy of Sleep Medicine (AASM) guidelines: A wake window is the comfortable stretch of time an infant stays awake between sleep periods before becoming overtired. Typical ranges: 0 to 3 months: 45 to 90 minutes; 4 to 6 months: 1.5 to 2.5 hours; 7 to 12 months: 2.5 to 3.5 hours. Early tired cues: staring, yawning, rubbing eyes, slowed movement. Overtiredness leads to high cortisol and crying.",
    conversationalAnswer_pt: 'A "janela de vig\xEDlia" \xE9 o tempo em que o beb\xEA consegue ficar acordado brincando e mamando antes de ficar excessivamente cansado.\n\nAs faixas m\xE9dias esperadas s\xE3o:\n\u2022 De 0 a 3 meses: de 45 a 90 minutos acordado.\n\u2022 De 4 a 6 meses: de 1h30 a 2h30.\n\u2022 De 7 a 12 meses: de 2h30 a 3h30.\n\nFique atenta aos primeiros sinais de sono: olhar parado ou vidrado, esfregar os olhinhos, bocejar ou puxar a orelhinha. Colocar o beb\xEA para dormir logo aos primeiros sinais evita que ele passe do ponto e entre em exaust\xE3o, o que costuma dificultar ainda mais o adormecer.',
    conversationalAnswer_en: 'A "wake window" is the length of time your baby can happily stay awake between naps before becoming overtired.\n\nTypical age ranges:\n\u2022 0 to 3 months: 45 to 90 minutes awake.\n\u2022 4 to 6 months: 1.5 to 2.5 hours.\n\u2022 7 to 12 months: 2.5 to 3.5 hours.\n\nWatch for early tired cues: a glazed stare, rubbing eyes or ears, and gentle yawns. Putting your baby down as soon as these early signs appear prevents cortisol spikes and helps them fall asleep much more smoothly.',
    keywords_pt: [
      "janelas de vigilia",
      "tempo acordado",
      "sinais de cansaco",
      "sinais de sono",
      "rotina de sono",
      "quanto tempo dura o sono",
      "bebe cansado",
      "overtired"
    ],
    keywords_en: [
      "wake windows",
      "awake time",
      "tired cues",
      "sleep cues",
      "sleep routine",
      "how long sleep lasts",
      "overtired baby"
    ],
    sourceName: "Sociedade Brasileira de Pediatria (SBP) e American Academy of Sleep Medicine (AASM)",
    document: "Consenso de Sono Pedi\xE1trico e Higiene do Sono",
    edition: "Revis\xE3o T\xE9cnica Outubro 2026 / AASM Guidelines",
    sectionOrPage: "Intervalos de Vig\xEDlia Confort\xE1vel e Sinais Fisiol\xF3gicos de Sono",
    url: "https://www.sbp.com.br/departamentos-cientificos/medicina-do-sono/",
    validationStatus: "pending_review",
    countryJurisdiction: "GLOBAL"
  },
  {
    id: "ev-car-seat-safety-rear-facing-22",
    phase: "baby",
    stageRange: "0-24m",
    topic: "safety",
    title_pt: "Seguran\xE7a no Transporte Veicular: Cadeirinha e Posi\xE7\xE3o Voltada para Tr\xE1s",
    title_en: "Child Passenger Safety: Rear-Facing Car Seats",
    summary_pt: "Diretrizes do Contran (Resolu\xE7\xE3o n\xBA 277 / Lei da Cadeirinha no Brasil) e da Academia Americana de Pediatria (AAP): O beb\xEA deve viajar no banco traseiro, em dispositivo de reten\xE7\xE3o infantil adequado ao peso e altura (beb\xEA-conforto ou cadeirinha convers\xEDvel). O dispositivo DEVE permanecer voltado para tr\xE1s (de costas para o motorista) pelo menos at\xE9 1 ano de idade (conforme legisla\xE7\xE3o brasileira) e, preferencialmente, at\xE9 os 2 anos ou at\xE9 atingir o limite m\xE1ximo de peso/altura permitido pelo fabricante da cadeirinha (recomenda\xE7\xE3o AAP/SBP). A posi\xE7\xE3o contra o movimento protege a cabe\xE7a, o pesco\xE7o e a coluna cervical fr\xE1gil, absorvendo o impacto e reduzindo drasticamente o risco de les\xF5es graves em colis\xF5es.",
    summary_en: "Contran (Resolution 277) and American Academy of Pediatrics (AAP) guidelines: Infants must ride in the rear seat in an approved child safety restraint. The car seat MUST be installed rear-facing until at least 1 year of age by Brazilian law, and ideally until at least 2 years of age or until reaching the car seat maximum rear-facing height/weight limits (AAP/SBP recommendation). Rear-facing absorbs collision forces, providing crucial support for fragile infant head, neck, and spine.",
    conversationalAnswer_pt: "No Brasil, a lei de tr\xE2nsito exige que os beb\xEAs viajem na cadeirinha (ou beb\xEA-conforto) voltados para tr\xE1s (de costas para o movimento) pelo menos at\xE9 completarem 1 ano de idade.\n\nNo entanto, tanto a Sociedade Brasileira de Pediatria (SBP) quanto a Academia Americana de Pediatria (AAP) recomendam manter a cadeirinha voltada para tr\xE1s pelo maior tempo poss\xEDvel \u2014 at\xE9 pelo menos os 2 anos de idade, ou at\xE9 o limite m\xE1ximo de altura e peso do assento.\n\nO motivo \xE9 puramente anat\xF4mico: em qualquer freada brusca ou batida frontal, a posi\xE7\xE3o voltada para tr\xE1s apoia e protege a cabe\xE7a pesada e o pescocinho fr\xE1gil do beb\xEA, reduzindo em at\xE9 5 vezes o risco de les\xF5es graves na coluna.",
    conversationalAnswer_en: "By law and pediatric guidelines, infants must travel in a rear-facing car seat (or infant carrier) in the back seat.\n\nWhile regulations require rear-facing until at least 1 year of age, both the American Academy of Pediatrics (AAP) and pediatric safety experts strongly recommend keeping children rear-facing for as long as possible \u2014 until at least 2 years old or until reaching the car seat maximum rear-facing height/weight limit.\n\nThe reason is anatomical: rear-facing seats support your baby heavy head and fragile neck during a sudden stop or collision, offering up to 5 times greater protection against severe spinal injury.",
    keywords_pt: [
      "cadeirinha",
      "cadeirinha do carro",
      "virada para tras",
      "bebe conforto",
      "transporte veicular",
      "ate que idade cadeirinha",
      "seguranca veicular",
      "ate que idade a cadeirinha do carro deve ficar virada para tras"
    ],
    keywords_en: [
      "car seat",
      "rear facing",
      "rear-facing car seat",
      "infant car seat",
      "passenger safety",
      "how long rear facing",
      "child vehicle safety",
      "what age rear facing car seat"
    ],
    sourceName: "Contran (Brasil) e Academia Americana de Pediatria (AAP)",
    document: "Resolu\xE7\xE3o Contran n\xBA 277 / AAP Child Passenger Safety Policy Statement",
    edition: "Revis\xE3o T\xE9cnica Outubro 2026 / AAP Guidelines 2023",
    sectionOrPage: "Dispositivos de Reten\xE7\xE3o e Posi\xE7\xE3o Voltada para Tr\xE1s (Rear-Facing)",
    url: "https://www.healthychildren.org/English/safety-prevention/on-the-go/Pages/Car-Safety-Seats-Information-for-Families.aspx",
    validationStatus: "pending_review",
    countryJurisdiction: "GLOBAL"
  },
  {
    id: "ev-postpartum-uterine-cramping-lochia-23",
    phase: "baby",
    stageRange: "0-3m",
    topic: "maternal_rest",
    title_pt: "Involu\xE7\xE3o Uterina, C\xF3licas da Amamenta\xE7\xE3o e L\xF3quios no P\xF3s-Parto",
    title_en: "Postpartum Uterine Cramping, Afterpains and Lochia",
    summary_pt: "Protocolos do Minist\xE9rio da Sa\xFAde do Brasil e do Col\xE9gio Americano de Obstetras e Ginecologistas (ACOG): 1) C\xF3licas uterinas p\xF3s-parto (afterpains): s\xE3o contra\xE7\xF5es normais e fisiol\xF3gicas que ocorrem principalmente nos primeiros dias ap\xF3s o nascimento, especialmente durante as mamadas. A suc\xE7\xE3o do beb\xEA estimula a libera\xE7\xE3o de ocitocina materna, que faz o \xFAtero contrair para voltar ao tamanho normal e prevenir hemorragias. 2) L\xF3quios (sangramento puerperal): sangramento que dura de 4 a 6 semanas, passando de vermelho vivo nos primeiros dias para rosado, amarronzado e esbranqui\xE7ado. Sinais de alerta: sangramento que encharca mais de um absorvente por hora, co\xE1gulos maiores que um ovo, febre ou dor p\xE9lvica aguda intensa.",
    summary_en: "Brazilian Ministry of Health and ACOG Postpartum Guidelines: 1) Postpartum uterine cramping (afterpains): normal physiological contractions occurring in early days postpartum, particularly during breastfeeding. Nursing stimulates maternal oxytocin release, contracting the uterus to prevent hemorrhage and return to pre-pregnancy size. 2) Lochia (postpartum discharge): normal bleeding lasting 4 to 6 weeks, shifting from red to pink, brown, and yellowish-white. Red flags: soaking more than one pad per hour, large clots, fever, or foul-smelling discharge.",
    conversationalAnswer_pt: "Sim, \xE9 perfeitamente normal e esperado sentir c\xF3licas no \xFAtero enquanto voc\xEA amamenta, especialmente nos primeiros dias p\xF3s-parto.\n\nQuando o beb\xEA mama no peito, o seu corpo libera um horm\xF4nio natural chamado ocitocina. Essa ocitocina tem duas fun\xE7\xF5es fundamentais: faz o leite sair e faz o seu \xFAtero se contrair com for\xE7a para voltar ao tamanho original e evitar hemorragias. Essas contra\xE7\xF5es s\xE3o chamadas de c\xF3licas p\xF3s-parto (afterpains) e tendem a diminuir bastante ap\xF3s a primeira semana.\n\nAlerta: Se as c\xF3licas forem insuport\xE1veis, acompanhadas de febre, ou se o sangramento encharcar absorventes muito r\xE1pido (mais de um por hora), procure atendimento m\xE9dico imediatamente.",
    conversationalAnswer_en: "Yes, feeling cramps in your uterus while breastfeeding is completely normal and expected, especially in the first days after birth.\n\nWhen your baby nurses, your body naturally releases oxytocin. This hormone helps let down milk and simultaneously triggers your uterus to contract down to its pre-pregnancy size, preventing heavy bleeding. These contractions are known as afterpains and typically peak in the first few days before fading.\n\nWhen to seek care: If cramping becomes severe and continuous, or is accompanied by fever, foul odor, or soaking through more than one pad an hour, contact your healthcare provider immediately.",
    keywords_pt: [
      "colicas no utero",
      "colica amamentando",
      "involucao uterina",
      "loquios",
      "sangramento pos parto",
      "e normal sentir colicas no utero enquanto estou amamentando",
      "afterpains",
      "dor utero amamentacao"
    ],
    keywords_en: [
      "uterine cramping",
      "cramping while nursing",
      "uterine involution",
      "lochia",
      "postpartum bleeding",
      "is it normal to feel cramps while breastfeeding",
      "afterpains",
      "postpartum uterine cramps"
    ],
    sourceName: "Minist\xE9rio da Sa\xFAde do Brasil e ACOG (American College of Obstetricians and Gynecologists)",
    document: "Manual de Aten\xE7\xE3o ao P\xF3s-Parto e Puerp\xE9rio",
    edition: "Revis\xE3o T\xE9cnica Outubro 2026 / ACOG Postpartum Care 2021",
    sectionOrPage: "Fisiologia Puerperal: Involu\xE7\xE3o Uterina e C\xF3licas da Ocitocina",
    url: "https://www.acog.org/clinical/clinical-guidance/committee-opinion/articles/2018/05/optimizing-postpartum-care",
    validationStatus: "pending_review",
    countryJurisdiction: "GLOBAL"
  },
  {
    id: "ev-postpartum-mental-health-blues-ppd-24",
    phase: "baby",
    stageRange: "0-12m",
    topic: "maternal_rest",
    title_pt: "Sa\xFAde Emocional Materna: Tristeza P\xF3s-Parto (Baby Blues) e Depress\xE3o P\xF3s-Parto",
    title_en: "Maternal Emotional Health: Baby Blues vs Postpartum Depression",
    summary_pt: "Diretrizes do Minist\xE9rio da Sa\xFAde do Brasil e do Col\xE9gio Americano de Obstetras e Ginecologistas (ACOG): 1) Baby Blues (tristeza puerperal): quadro benigno e transit\xF3rio que afeta at\xE9 80% das m\xE3es nos primeiros dias ap\xF3s o parto (pico do 3\xBA ao 5\xBA dia). Caracteriza-se por choro f\xE1cil, oscila\xE7\xE3o de humor, sensibilidade e ansiedade leve, resolvendo-se espontaneamente em at\xE9 10 a 14 dias com rede de apoio e acolhimento. 2) Depress\xE3o P\xF3s-Parto (DPP): quadro cl\xEDnico mais profundo que pode surgir nas primeiras semanas ou meses. Caracteriza-se por tristeza persistente por mais de 2 semanas, desinteresse pelas atividades, incapacidade de sentir prazer ou conex\xE3o com o beb\xEA, sentimentos de culpa excessiva e ins\xF4nia grave. A DPP n\xE3o passa sozinha e exige acompanhamento m\xE9dico e psicol\xF3gico sem julgamentos. Pensamentos de sumir ou ferir o beb\xEA exigem assist\xEAncia profissional urgente.",
    summary_en: "Brazilian Ministry of Health and ACOG Guidelines: 1) Baby Blues: a mild, transient condition affecting up to 80% of mothers in the first days postpartum (peaking days 3-5). Features easy crying, mood swings, and anxiety, resolving spontaneously within 10-14 days with emotional support. 2) Postpartum Depression (PPD): a more persistent condition emerging anytime in the first year. Involves deep sadness for over 2 weeks, disconnection from the baby, extreme guilt, and severe fatigue. PPD requires professional healthcare support. Thoughts of disappearing or harm require immediate emergency intervention.",
    conversationalAnswer_pt: "A diferen\xE7a principal entre a tristeza p\xF3s-parto (*baby blues*) e a depress\xE3o p\xF3s-parto est\xE1 na intensidade, no impacto no dia a dia e no tempo de dura\xE7\xE3o:\n\n\u2022 Baby Blues (tristeza puerperal): Afeta at\xE9 8 em cada 10 m\xE3es nos primeiros dias ap\xF3s o parto. \xC9 uma fase de choro f\xE1cil, oscila\xE7\xF5es de humor e sensibilidade \xE0 flor da pele, provocada pela queda abrupta de horm\xF4nios e pelo cansa\xE7o. Costuma passar naturalmente em at\xE9 10 a 14 dias, com carinho, acolhimento e descanso.\n\n\u2022 Depress\xE3o P\xF3s-Parto (DPP): \xC9 mais profunda e dura mais de 2 semanas. A m\xE3e sente uma tristeza constante, des\xE2nimo, culpa excessiva, dificuldade de sentir conex\xE3o ou alegria com o beb\xEA e sensa\xE7\xE3o de incapacidade. A depress\xE3o p\xF3s-parto n\xE3o melhora sozinha e n\xE3o \xE9 fraqueza: \xE9 uma condi\xE7\xE3o de sa\xFAde real que precisa de acompanhamento m\xE9dico e psicol\xF3gico especializado.\n\nSe voc\xEA sentir que n\xE3o est\xE1 dando conta ou tiver pensamentos de sumir, procure acolhimento na sua unidade de sa\xFAde ou linha de apoio imediatamente.",
    conversationalAnswer_en: "The key differences between the baby blues and postpartum depression (PPD) lie in severity, duration, and emotional impact:\n\n\u2022 Baby Blues: Extremely common, affecting up to 80% of mothers. Begins around day 3-5 postpartum with tearfulness, mood swings, and vulnerability driven by hormonal shifts and sleep loss. It resolves on its own within 10 to 14 days with rest and support.\n\n\u2022 Postpartum Depression (PPD): Deeper and lasts longer than 2 weeks. Symptoms include persistent sadness, numbness, inability to feel bonded with your baby, intense guilt, and feeling overwhelmed. PPD does not resolve on its own and is not your fault \u2014 it requires compassionate medical and psychological care.\n\nIf you ever have thoughts of disappearing or harming yourself or your baby, reach out to a healthcare provider or crisis helpline right away.",
    keywords_pt: [
      "baby blues",
      "tristeza pos parto",
      "depressao pos parto",
      "diferenciar baby blues",
      "saude mental materna",
      "tristeza puerperal",
      "dpp",
      "como diferenciar tristeza pos parto de depressao pos parto"
    ],
    keywords_en: [
      "baby blues",
      "postpartum depression",
      "difference baby blues ppd",
      "maternal mental health",
      "postpartum blues",
      "ppd",
      "maternal mood",
      "how to tell baby blues from postpartum depression"
    ],
    sourceName: "Minist\xE9rio da Sa\xFAde do Brasil e ACOG (American College of Obstetricians and Gynecologists)",
    document: "Diretrizes de Sa\xFAde Mental no Pr\xE9-Natal e Puerp\xE9rio",
    edition: "Revis\xE3o T\xE9cnica Outubro 2026 / ACOG Clinical Guidelines",
    sectionOrPage: "Diferencia\xE7\xE3o Cl\xEDnica entre Tristeza Puerperal (Baby Blues) e Depress\xE3o P\xF3s-Parto",
    url: "https://www.acog.org/clinical/clinical-guidance/clinical-consensus/articles/2023/12/screening-and-diagnosis-of-mental-health-conditions-in-pregnancy-and-postpartum",
    validationStatus: "pending_review",
    countryJurisdiction: "GLOBAL"
  },
  {
    id: "ev-postpartum-incision-care-25",
    phase: "baby",
    stageRange: "0-3m",
    topic: "maternal_rest",
    title_pt: "Cuidados com a Cicatriza\xE7\xE3o P\xF3s-Parto: Ces\xE1rea e Lacera\xE7\xE3o Perineal",
    title_en: "Postpartum Incision and Wound Care: Cesarean and Perineal Healing",
    summary_pt: "Diretrizes do Minist\xE9rio da Sa\xFAde do Brasil e FEBRASGO: Cuidados de cicatriza\xE7\xE3o p\xF3s-parto para incis\xE3o cir\xFArgica (cesariana) ou lacera\xE7\xE3o/episiotomia perineal: 1) Higiene local di\xE1ria: lavar suavemente com \xE1gua e sabonete neutro durante o banho; 2) Secagem cuidadosa: secar com toques suaves de toalha limpa ou gaze, sem esfregar, mantendo a regi\xE3o limpa, arejada e seca; 3) Roupas: calcinhas de algod\xE3o de cintura alta que n\xE3o comprimam o corte; 4) Sinais de infec\xE7\xE3o ou complica\xE7\xE3o que exigem avalia\xE7\xE3o m\xE9dica presencial: vermelhid\xE3o intensa que se expande, calor local, incha\xE7o progressivo, abertura de pontos, sa\xEDda de pus ou secre\xE7\xE3o com odor forte, e febre acima de 37,8\xB0C.",
    summary_en: "Brazilian Ministry of Health and FEBRASGO guidelines for postpartum wound healing (c-section incision or perineal tear): 1) Daily hygiene: wash gently with clean water and mild soap; 2) Keep dry: pat gently with a clean towel without rubbing; keep area clean and aired out; 3) Loose clothing: high-waisted cotton underwear avoiding pressure on incision; 4) Infection signs requiring doctor evaluation: expanding redness, heat, swelling, separated stitches, foul discharge, or fever above 37.8 C.",
    conversationalAnswer_pt: "Os cuidados fundamentais para uma cicatriza\xE7\xE3o tranquila da ces\xE1rea ou do per\xEDneo s\xE3o simples e baseados em manter o local sempre limpo e seco:\n\n\u2022 Durante o banho: Lave a incis\xE3o delicadamente com \xE1gua morna e sabonete neutro. Deixe a espuma escorrer suavemente, sem esfregar com buchas.\n\u2022 Ao sair do banho: Seque com toques suaves de uma toalha bem limpa ou gaze. A umidade atrasa a cicatriza\xE7\xE3o, por isso a regi\xE3o precisa ficar bem sequinha e arejada.\n\u2022 Roupas: Use calcinhas de algod\xE3o confort\xE1veis, de cintura alta, que n\xE3o apertem e n\xE3o fiquem ro\xE7ando na linha dos pontos.\n\nSinais de alerta: Se a cicatriz ficar muito vermelha ao redor, quente ao toque, se houver incha\xE7o aumentado, pontos abertos, sa\xEDda de secre\xE7\xE3o com cheiro forte ou febre, procure avalia\xE7\xE3o m\xE9dica no posto ou maternidade.",
    conversationalAnswer_en: "Caring for your c-section incision or perineal stitches centers on keeping the area clean, dry, and free from friction:\n\n\u2022 In the shower: Wash gently with mild soap and warm water. Let water and lather run softly over the area without scrubbing.\n\u2022 Drying: Pat gently with a clean towel or sterile gauze. Moisture slows down healing, so keeping the skin dry and aired out is essential.\n\u2022 Clothing: Wear high-waisted, breathable cotton underwear that rests above or away from the incision line.\n\nWhen to call your doctor: Contact your healthcare provider if you notice spreading redness, hot skin, increased swelling, separating stitches, pus or foul-smelling fluid, or a fever over 37.8\xB0C (100\xB0F).",
    keywords_pt: [
      "cuidar da cicatriz",
      "cicatriz cesarea",
      "cuidados cesarea",
      "pontos cesarea",
      "cicatriz perineo",
      "cicatrizacao pos parto",
      "higiene cicatriz",
      "como cuidar da cicatriz"
    ],
    keywords_en: [
      "incision care",
      "cesarean scar",
      "c-section care",
      "stitches cesarean",
      "perineal tear healing",
      "postpartum wound care",
      "wound hygiene",
      "how to care for scar"
    ],
    sourceName: "Minist\xE9rio da Sa\xFAde do Brasil e FEBRASGO",
    document: "Protocolos de Aten\xE7\xE3o ao P\xF3s-Operat\xF3rio e Puerp\xE9rio",
    edition: "Revis\xE3o T\xE9cnica Outubro 2026 / FEBRASGO 2022",
    sectionOrPage: "Cuidados com Feridas Cir\xFArgicas e Preven\xE7\xE3o de Infec\xE7\xF5es Puerperais",
    url: "https://www.febrasgo.org.br",
    validationStatus: "pending_review",
    countryJurisdiction: "GLOBAL"
  }
];

// src/services/ragService.ts
var STOP_WORDS = /* @__PURE__ */ new Set([
  "como",
  "para",
  "com",
  "que",
  "uma",
  "um",
  "dos",
  "das",
  "seu",
  "sua",
  "meu",
  "minha",
  "por",
  "mais",
  "tem",
  "ter",
  "fazer",
  "quando",
  "onde",
  "qual",
  "quais",
  "pode",
  "devo",
  "posso",
  "dar",
  "daria",
  "dia",
  "dias",
  "semana",
  "semanas",
  "mes",
  "meses",
  "ano",
  "anos",
  "estou",
  "esta",
  "estao",
  "estar",
  "sobre",
  "muito",
  "muita",
  "algo",
  "tudo",
  "nesse",
  "nessa",
  "bebe",
  "baby",
  "crianca",
  "child",
  "infant",
  "recem",
  "nascido",
  "sem",
  "ate",
  "apos",
  "isso",
  "isto",
  "aquilo",
  "este",
  "esta",
  "esse",
  "essa",
  "aquele",
  "aquela",
  "what",
  "how",
  "when",
  "where",
  "with",
  "from",
  "this",
  "that",
  "should",
  "could",
  "have",
  "can",
  "give",
  "days",
  "weeks",
  "months",
  "years",
  "very",
  "much",
  "about",
  "the",
  "for",
  "and",
  "are",
  "you",
  "your",
  "our",
  "all",
  "any",
  "not",
  "out",
  "who",
  "why",
  "they",
  "them",
  "then",
  "than",
  "into",
  "some",
  "such"
]);
function normalizeText(text) {
  return text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
}
function stemWord(word) {
  const w = word.toLowerCase();
  if (w.length <= 3) return w;
  if (w.length > 5) {
    if (w.endsWith("mente")) return w.slice(0, -5);
    if (w.endsWith("dades")) return w.slice(0, -5);
    if (w.endsWith("acoes") || w.endsWith("icoes")) return w.slice(0, -5);
  }
  if (w.length > 4) {
    if (w.endsWith("ando") || w.endsWith("endo") || w.endsWith("indo")) return w.slice(0, -4);
    if (w.endsWith("aram") || w.endsWith("eram") || w.endsWith("iram")) return w.slice(0, -4);
    if (w.endsWith("avam") || w.endsWith("aria") || w.endsWith("asse") || w.endsWith("esse") || w.endsWith("isse")) return w.slice(0, -4);
    if (w.endsWith("ment")) return w.slice(0, -4);
    if (w.endsWith("ness")) return w.slice(0, -4);
    if (w.endsWith("tion") || w.endsWith("tions")) return w.slice(0, -4);
  }
  if (w.length > 3) {
    if (w.endsWith("ou") || w.endsWith("eu") || w.endsWith("iu") || w.endsWith("ar") || w.endsWith("er") || w.endsWith("ir")) return w.slice(0, -2);
    if (w.endsWith("ava") || w.endsWith("ada") || w.endsWith("ado") || w.endsWith("ida") || w.endsWith("ido")) return w.slice(0, -3);
    if (w.endsWith("ing")) return w.slice(0, -3);
    if (w.endsWith("ed")) return w.slice(0, -2);
    if (w.endsWith("es")) return w.slice(0, -2);
    if (w.endsWith("s") && !w.endsWith("ss")) return w.slice(0, -1);
  }
  return w;
}
function tokenize(text) {
  return normalizeText(text).split(" ").filter((token) => token.length >= 3 && !STOP_WORDS.has(token));
}
var CLINICAL_CONCEPTS = [
  // 1. Marcha e Primeiros Passos (NÃO confundir com apenas ficar de pé ou sentar)
  {
    targetChunkIds: ["ev-milestones-gross-motor-17"],
    patterns: [
      "andar",
      "andando",
      "andou",
      "primeiros passos",
      "passos",
      "marcha",
      "quando anda",
      "comeca a andar",
      "idade media andar",
      "idade media que o bebe comeca a andar",
      "14 meses nao anda",
      "nao anda",
      "walk",
      "walking",
      "walked",
      "first steps",
      "start walking",
      "start to walk",
      "average age walking",
      "14 months not walking",
      "how old babies start walking",
      "when do babies walk"
    ],
    exclusiveBonus: 14
  },
  // 2. Sentar sem apoio (marco motor específico)
  {
    targetChunkIds: ["ev-milestones-gross-motor-17"],
    patterns: [
      "sentar sem apoio",
      "senta sem apoio",
      "com quantos meses senta",
      "sit unsupported",
      "sitting without support",
      "when do babies sit"
    ],
    exclusiveBonus: 12
  },
  // 3. Falar e Primeiras Palavras (NÃO confundir com cuidados responsivos gerais)
  {
    targetChunkIds: ["ev-milestones-language-18"],
    patterns: [
      "primeiras palavras",
      "comeca a falar",
      "quando fala",
      "falar",
      "balbucio",
      "balbuciar",
      "desenvolvimento da linguagem",
      "comunicacao",
      "idade primeiras palavras",
      "fala do bebe",
      "first words",
      "start talking",
      "when do babies talk",
      "talking",
      "babbling",
      "babble",
      "say first words",
      "speech milestones",
      "how old babies talk"
    ],
    exclusiveBonus: 14
  },
  // 4. Oferta de Água e Chás na Infância (Regra dos 6 meses)
  {
    targetChunkIds: ["ev-water-hydration-infant-19"],
    patterns: [
      "dar agua",
      "agua para bebe",
      "cha para bebe",
      "chas para bebe",
      "introduzir agua",
      "agua 3 meses",
      "posso dar agua",
      "agua antes dos 6 meses",
      "quando dar agua",
      "give water",
      "water for baby",
      "tea for baby",
      "introduce water",
      "water 3 months",
      "can i give water",
      "water before 6 months",
      "when to give water"
    ],
    exclusiveBonus: 14
  },
  // 5. Introdução Alimentar de Sólidos aos 6 Meses (NÃO é desmame!)
  {
    targetChunkIds: ["ev-complementary-feeding-10"],
    patterns: [
      "introducao alimentar",
      "alimentos solidos",
      "comida solida",
      "primeiras papinhas",
      "quando comecar a introducao alimentar",
      "quando comecar introducao de alimentos solidos",
      "quando comecar introducao",
      "quando dar comida",
      "starting solids",
      "solid foods",
      "complementary feeding",
      "start solid foods",
      "when to start solid foods",
      "when to start solids"
    ],
    exclusiveBonus: 12
  },
  // 6. Reflexo de Gag (ânsia fisiológica) vs Engasgo Real
  {
    targetChunkIds: ["ev-choking-vs-gag-reflex-20"],
    patterns: [
      "reflexo de gag",
      "gag reflex",
      "ansia",
      "diferenca engasgo ansia",
      "engasgo vs gag",
      "ansia de engasgo",
      "diferenca entre ansia e engasgo",
      "gagging",
      "difference choking gagging",
      "gag versus choke",
      "gagging versus choking"
    ],
    exclusiveBonus: 14
  },
  // 7. Janelas de Vigília e Sinais de Cansaço (Rotina de Sono)
  {
    targetChunkIds: ["ev-infant-sleep-routine-wake-windows-21"],
    patterns: [
      "janelas de vigilia",
      "tempo acordado",
      "sinais de cansaco",
      "sinais de sono",
      "wake windows",
      "tired cues",
      "sleep cues",
      "awake time",
      "overtired"
    ],
    exclusiveBonus: 12
  },
  // 8. Segurança Veicular: Cadeirinha voltada para trás
  {
    targetChunkIds: ["ev-car-seat-safety-rear-facing-22"],
    patterns: [
      "cadeirinha",
      "cadeirinha do carro",
      "virada para tras",
      "bebe conforto",
      "transporte veicular",
      "ate que idade cadeirinha",
      "seguranca veicular",
      "ate que idade a cadeirinha do carro deve ficar virada para tras",
      "car seat",
      "rear facing",
      "rear-facing",
      "infant car seat",
      "what age rear facing car seat",
      "how long rear facing"
    ],
    exclusiveBonus: 14
  },
  // 9. Involução Uterina, Cólicas da Amamentação e Lóquios (Pós-Parto)
  {
    targetChunkIds: ["ev-postpartum-uterine-cramping-lochia-23"],
    patterns: [
      "colicas no utero",
      "colica no utero",
      "colica amamentando",
      "involucao uterina",
      "loquios",
      "sangramento pos parto",
      "e normal sentir colicas no utero enquanto estou amamentando",
      "afterpains",
      "dor utero amamentacao",
      "uterine cramping",
      "cramping while nursing",
      "uterine involution",
      "lochia",
      "is it normal to feel cramps while breastfeeding"
    ],
    exclusiveBonus: 14
  },
  // 10. Baby Blues vs Depressão Pós-Parto
  {
    targetChunkIds: ["ev-postpartum-mental-health-blues-ppd-24"],
    patterns: [
      "baby blues",
      "tristeza pos parto",
      "depressao pos parto",
      "diferenciar baby blues",
      "saude mental materna",
      "tristeza puerperal",
      "dpp",
      "como diferenciar tristeza pos parto de depressao pos parto",
      "postpartum depression",
      "difference baby blues ppd",
      "postpartum blues",
      "how to tell baby blues from postpartum depression"
    ],
    exclusiveBonus: 14
  },
  // 11. Cuidados com a Cicatriz da Cesárea e Períneo
  {
    targetChunkIds: ["ev-postpartum-incision-care-25"],
    patterns: [
      "cuidar da cicatriz",
      "como cuidar da cicatriz",
      "cicatriz cesarea",
      "cuidados cesarea",
      "pontos cesarea",
      "cicatriz perineo",
      "cicatrizacao pos parto",
      "higiene cicatriz",
      "incision care",
      "cesarean scar",
      "c-section care",
      "stitches cesarean",
      "perineal tear healing",
      "how to care for scar"
    ],
    exclusiveBonus: 14
  }
];
function retrieveRelevantEvidence(query, phase, lang = "pt-BR", topK = CONFIG.TOP_K_CHUNKS) {
  const normalizedQuery = normalizeText(query);
  const queryTokens = tokenize(query);
  if (queryTokens.length === 0 || normalizedQuery.length < CONFIG.MIN_QUESTION_LENGTH) {
    return [];
  }
  const queryWordSet = new Set(normalizedQuery.split(" "));
  const queryStems = new Set(queryTokens.map(stemWord));
  const isSleepQuery = normalizedQuery.includes("dormir") || normalizedQuery.includes("sono") || normalizedQuery.includes("sleep") || normalizedQuery.includes("sleeping") || normalizedQuery.includes("berco") || normalizedQuery.includes("crib");
  const hasSafeSleepIntent = normalizedQuery.includes("posicao") || normalizedQuery.includes("barriga para cima") || normalizedQuery.includes("berco") || normalizedQuery.includes("travesseiro") || normalizedQuery.includes("onde dormir") || normalizedQuery.includes("morte subita") || normalizedQuery.includes("smsl") || normalizedQuery.includes("sufocamento") || normalizedQuery.includes("dormir de lado") || normalizedQuery.includes("dormir de brucos") || normalizedQuery.includes("safe sleep") || normalizedQuery.includes("crib") || normalizedQuery.includes("supine") || normalizedQuery.includes("back to sleep");
  const hasSleepDurationIntent = normalizedQuery.includes("horas de sono") || normalizedQuery.includes("quantas horas") || normalizedQuery.includes("duracao do sono") || normalizedQuery.includes("duracao sono") || normalizedQuery.includes("tempo de sono") || normalizedQuery.includes("quanto tempo dorme") || normalizedQuery.includes("hours of sleep") || normalizedQuery.includes("how many hours") || normalizedQuery.includes("sleep duration");
  const hasTummyTimeIntent = normalizedQuery.includes("tummy time") || normalizedQuery.includes("tummy") || normalizedQuery.includes("de brucos") || normalizedQuery.includes("brucos") || normalizedQuery.includes("barriga para baixo") || normalizedQuery.includes("barriguinha") || normalizedQuery.includes("plagiocefalia") || normalizedQuery.includes("cabeca chata") || normalizedQuery.includes("posicao prona") || normalizedQuery.includes("prone") || normalizedQuery.includes("belly time") || normalizedQuery.includes("tummy play");
  const hasColicIntent = normalizedQuery.includes("colica") || normalizedQuery.includes("colicas") || normalizedQuery.includes("aliviar colicas") || normalizedQuery.includes("gases bebe") || normalizedQuery.includes("colic");
  const hasHiccupsIntent = normalizedQuery.includes("soluco") || normalizedQuery.includes("solucos") || normalizedQuery.includes("solucando") || normalizedQuery.includes("hiccup") || normalizedQuery.includes("hiccups");
  const hasCryingIntent = normalizedQuery.includes("chora muito") || normalizedQuery.includes("choro persistente") || normalizedQuery.includes("acalmar o bebe") || normalizedQuery.includes("choro") || normalizedQuery.includes("chora");
  const hasLatchIntent = normalizedQuery.includes("pega") || normalizedQuery.includes("abocanhar") || normalizedQuery.includes("fissura") || normalizedQuery.includes("rachadura") || normalizedQuery.includes("dor ao amamentar") || normalizedQuery.includes("latch");
  const scoredResults = [];
  for (const chunk of EVIDENCE_CATALOG) {
    let phaseMultiplier = 1;
    if (phase && chunk.phase !== "all") {
      if (chunk.phase !== phase) {
        phaseMultiplier = 0.4;
      } else {
        phaseMultiplier = 1.2;
      }
    }
    const titleNorm = normalizeText(lang === "pt-BR" ? chunk.title_pt : chunk.title_en);
    const summaryNorm = normalizeText(lang === "pt-BR" ? chunk.summary_pt : chunk.summary_en);
    const keywords = (lang === "pt-BR" ? chunk.keywords_pt : chunk.keywords_en).map((k) => normalizeText(k));
    const titleTokens = tokenize(titleNorm);
    const summaryTokens = tokenize(summaryNorm);
    const titleWords = new Set(titleTokens);
    const summaryWords = new Set(summaryTokens);
    const titleStems = new Set(titleTokens.map(stemWord));
    let score = 0;
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
    for (const kw of keywords) {
      if (kw.includes(" ")) {
        if (normalizedQuery.includes(kw)) {
          score += 7;
        }
      } else {
        if (queryWordSet.has(kw)) {
          score += 3.5;
        } else if (queryStems.has(stemWord(kw))) {
          score += 2;
        } else if (normalizedQuery.includes(kw) && kw.length >= 4) {
          score += 1.2;
        }
      }
    }
    for (const token of queryTokens) {
      if (titleWords.has(token)) {
        score += 3;
      } else if (titleStems.has(stemWord(token))) {
        score += 1.8;
      }
      if (summaryWords.has(token)) {
        score += 0.8;
      }
    }
    if (chunk.topic === "sleep_duration" && hasSleepDurationIntent) {
      score += 8;
    }
    if (chunk.topic === "safe_sleep" && hasSafeSleepIntent) {
      score += 8;
    }
    if (chunk.id === "ev-infant-hiccups-03" && hasHiccupsIntent) {
      score += 10;
    }
    if (chunk.id === "ev-infant-colic-14" && hasColicIntent) {
      score += 10;
    }
    if (chunk.id === "ev-infant-crying-15" && hasCryingIntent) {
      score += 10;
    }
    if (chunk.topic === "breastfeeding" && hasLatchIntent) {
      score += 8;
    }
    if (chunk.topic === "tummy_time" && hasTummyTimeIntent) {
      score += 10;
    }
    if (isSleepQuery) {
      if (chunk.topic === "safe_sleep") {
        score += 12;
      }
      if (chunk.topic === "tummy_time") {
        score -= 6;
      }
    } else if (hasTummyTimeIntent) {
      if (chunk.topic === "tummy_time") {
        score += 14;
      }
      if (chunk.topic === "safe_sleep") {
        score -= 6;
      }
    }
    if (hasColicIntent) {
      if (chunk.id === "ev-infant-hiccups-03" && !hasHiccupsIntent) {
        score -= 12;
      }
      if (chunk.topic === "breastfeeding" && !hasLatchIntent) {
        score -= 8;
      }
    }
    if (hasHiccupsIntent) {
      if (chunk.id === "ev-infant-colic-14" && !hasColicIntent) {
        score -= 12;
      }
      if (chunk.topic === "breastfeeding" && !hasLatchIntent) {
        score -= 8;
      }
    }
    if (normalizedQuery.includes("quanto tempo dura o sono") || normalizedQuery.includes("tempo dura o sono")) {
      if (phase === "pregnancy" && chunk.id === "ev-pregnancy-sleep-fatigue-07") {
        score += 8;
      } else if (chunk.id === "ev-infant-sleep-duration-13") {
        score += 8;
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
  const topResult = scoredResults[0];
  const filteredResults = [topResult];
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

// src/services/mockEngine.ts
function generateMockAnswer(_question, results, lang = "pt-BR") {
  const isPt = lang === "pt-BR";
  const defaultDisclaimer = isPt ? "Aviso Educativo: Esta resposta foi gerada localmente em modo de demonstra\xE7\xE3o com base nas diretrizes oficiais cadastradas. Ela n\xE3o substitui consulta m\xE9dica presencial ou acompanhamento pedi\xE1trico." : "Educational Notice: This response was generated locally in demonstration mode based on official guidelines. It does not replace in-person medical evaluation or pediatric care.";
  if (results.length === 0) {
    const outOfCatalogMsg = isPt ? "Ainda n\xE3o temos uma orienta\xE7\xE3o espec\xEDfica sobre esse assunto em nossas refer\xEAncias educativas.\n\nPara tirar d\xFAvidas sobre a sa\xFAde, desenvolvimento ou bem-estar do seu beb\xEA ou da sua fam\xEDlia, recomendamos conversar com o pediatra ou com a equipe de sa\xFAde de sua confian\xE7a." : "We do not have specific educational guidance on this topic in our verified references yet.\n\nFor questions about your baby's health, development, or family wellbeing, we recommend speaking with your pediatrician or trusted healthcare provider.";
    return {
      answer: outOfCatalogMsg,
      citations: [],
      status: "out_of_catalog",
      safetyDisclaimer: defaultDisclaimer
    };
  }
  const topResult = results[0];
  const topChunk = topResult.chunk;
  let secondaryChunk = null;
  if (results.length > 1) {
    const candidate = results[1];
    if (candidate.chunk.topic === topChunk.topic && candidate.score >= topResult.score * 0.75) {
      secondaryChunk = candidate.chunk;
    }
  }
  const matchedChunks = secondaryChunk ? [topChunk, secondaryChunk] : [topChunk];
  const citations = matchedChunks.map((c) => ({
    id: c.id,
    sourceName: c.sourceName,
    document: c.document,
    edition: c.edition,
    sectionOrPage: c.sectionOrPage,
    url: c.url,
    validationStatus: c.validationStatus,
    countryJurisdiction: c.countryJurisdiction
  }));
  let answer = "";
  if (isPt) {
    if (topChunk.conversationalAnswer_pt) {
      answer = topChunk.conversationalAnswer_pt;
    } else {
      answer = topChunk.summary_pt;
    }
    if (secondaryChunk && secondaryChunk.conversationalAnswer_pt) {
      answer += `

${secondaryChunk.conversationalAnswer_pt}`;
    }
  } else {
    if (topChunk.conversationalAnswer_en) {
      answer = topChunk.conversationalAnswer_en;
    } else {
      answer = topChunk.summary_en;
    }
    if (secondaryChunk && secondaryChunk.conversationalAnswer_en) {
      answer += `

${secondaryChunk.conversationalAnswer_en}`;
    }
  }
  return {
    answer,
    citations,
    status: "success",
    safetyDisclaimer: defaultDisclaimer
  };
}

// src/services/geminiEngine.ts
function calculateEstimatedCost(usage) {
  if (!usage) return void 0;
  const promptTokens = usage.promptTokens;
  const outputTokens = usage.candidatesTokens + (usage.thoughtsTokens || 0);
  const promptCostUSD = promptTokens / 1e6 * CONFIG.PRICING_PER_1M_INPUT_USD;
  const candidatesCostUSD = outputTokens / 1e6 * CONFIG.PRICING_PER_1M_OUTPUT_USD;
  const totalCostUSD = promptCostUSD + candidatesCostUSD;
  return {
    promptCostUSD,
    candidatesCostUSD,
    totalCostUSD,
    currency: "USD",
    isEstimate: true
  };
}
async function callGeminiFlashLite(apiKey, model = CONFIG.DEFAULT_MODEL, question, retrievedResults, lang = "pt-BR") {
  const isPt = lang === "pt-BR";
  if (retrievedResults.length === 0) {
    return {
      answer: isPt ? "Ainda n\xE3o temos uma orienta\xE7\xE3o espec\xEDfica sobre esse assunto em nossas refer\xEAncias educativas.\n\nPara tirar d\xFAvidas sobre a sa\xFAde, desenvolvimento ou bem-estar do seu beb\xEA ou da sua fam\xEDlia, recomendamos conversar com o pediatra ou com a equipe de sa\xFAde de sua confian\xE7a." : "We do not have specific educational guidance on this topic in our verified references yet.\n\nFor questions about your baby's health, development, or family wellbeing, we recommend speaking with your pediatrician or trusted healthcare provider.",
      citations: [],
      status: "out_of_catalog"
    };
  }
  const citations = retrievedResults.map((r) => ({
    id: r.chunk.id,
    sourceName: r.chunk.sourceName,
    document: r.chunk.document,
    edition: r.chunk.edition,
    sectionOrPage: r.chunk.sectionOrPage,
    url: r.chunk.url,
    validationStatus: r.chunk.validationStatus,
    countryJurisdiction: r.chunk.countryJurisdiction
  }));
  const contextText = retrievedResults.map((r, i) => {
    const c = r.chunk;
    const summary = isPt ? c.summary_pt : c.summary_en;
    const title = isPt ? c.title_pt : c.title_en;
    return `[FONTE ${i + 1}] ID: ${c.id}
T\xEDtulo: ${title}
Documento: ${c.document} (${c.edition}), ${c.sectionOrPage}
Conte\xFAdo Verificado: ${summary}`;
  }).join("\n\n");
  const systemInstruction = isPt ? `Voc\xEA \xE9 o assistente educativo de sa\xFAde materno-infantil "Primeiros 1.000 Dias".
SUAS REGRAS ESTRITAS DE CONDUTA:
1. Priorize respostas objetivas: comece respondendo DIRETAMENTE ao que foi perguntado logo no primeiro par\xE1grafo, trazendo primeiro as orienta\xE7\xF5es pr\xE1ticas e relevantes de cuidado, acolhimento e suporte. Deixe explica\xE7\xF5es contextuais ou causas para os par\xE1grafos seguintes.
2. NUNCA use sauda\xE7\xF5es longas (como "Ol\xE1! Que alegria falar com voc\xEA..."), introdu\xE7\xF5es prolixas ou agradecimentos repetitivos.
3. Responda \xE0 d\xFAvida baseando-se ESTRITAMENTE nos trechos de contexto oficial fornecidos abaixo. NUNCA atribua causas exclusivas ou invente explica\xE7\xF5es que n\xE3o constem comprovadamente do contexto oficial.
4. Mantenha um tom acolhedor, emp\xE1tico, claro e respeitoso para as fam\xEDlias, organizado em par\xE1grafos curtos. Ao listar sugest\xF5es pr\xE1ticas, coloque cada item em sua pr\xF3pria linha iniciando com "\u2022 ".
5. NUNCA fa\xE7a diagn\xF3sticos cl\xEDnicos e NUNCA prescreva rem\xE9dios ou dosagens.
6. NUNCA invente informa\xE7\xF5es. Se o contexto oficial fornecido n\xE3o responder \xE0 pergunta com seguran\xE7a, diga com gentileza que o cat\xE1logo oficial n\xE3o cobre esse detalhe e recomende avalia\xE7\xE3o m\xE9dica presencial.
7. N\xC3O inclua listas de refer\xEAncias bibliogr\xE1ficas, n\xFAmeros de p\xE1gina ou nomes de documentos no corpo do texto (a interface do aplicativo j\xE1 exibe as fontes estruturadas na se\xE7\xE3o recolh\xEDvel "Consultar fontes").
8. Responda em portugu\xEAs brasileiro.` : `You are the "First 1,000 Days" maternal-infant educational assistant.
YOUR STRICT CODE OF CONDUCT:
1. Prioritize objective answers: begin by answering the question DIRECTLY in the first paragraph, presenting practical and relevant comfort and care guidance first. Leave additional background explanations or causes for subsequent paragraphs.
2. NEVER use long greetings, excessive pleasantries, or robotic intros.
3. Base your answer STRICTLY on the official context snippets provided below. NEVER assert exclusive unverified causes not found in the official context.
4. Maintain a warm, empathetic, clear, and reassuring tone with short, readable paragraphs. When listing practical suggestions, place each item on its own separate line starting with "\u2022 ".
5. NEVER provide clinical diagnoses and NEVER prescribe medications or dosages.
6. NEVER fabricate information. If the provided context does not address the question safely, state with transparency that the verified catalog does not contain this specific guidance and recommend in-person healthcare evaluation.
7. DO NOT include bibliographic citations, page numbers, or document lists in the body text (the UI displays sources separately in a collapsible "View sources" section).
8. Respond in English.`;
  const userPrompt = `CONTEXTO OFICIAL RECUPERADO:
${contextText}

PERGUNTA DO USU\xC1RIO:
"${question}"`;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  const payload = {
    contents: [
      {
        role: "user",
        parts: [{ text: `${systemInstruction}

${userPrompt}` }]
      }
    ],
    generationConfig: {
      temperature: 0.2,
      // Baixa temperatura para maximizar fidelidade às fontes
      maxOutputTokens: 600
    }
  };
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 12e3);
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    if (!res.ok) {
      const errText = await res.text();
      return {
        answer: "",
        citations: [],
        status: "error",
        errorMessage: `Google AI Studio API error (${res.status}): ${errText.slice(0, 100)}`
      };
    }
    const data = await res.json();
    const candidateText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!candidateText) {
      return {
        answer: "",
        citations: [],
        status: "error",
        errorMessage: "Resposta vazia retornada pelo modelo de IA."
      };
    }
    const usageMetadata = data?.usageMetadata;
    const promptTokens = usageMetadata?.promptTokenCount || 0;
    const candidatesTokens = usageMetadata?.candidatesTokenCount || 0;
    const thoughtsTokens = usageMetadata?.thoughtsTokenCount || 0;
    const totalTokens = usageMetadata?.totalTokenCount || promptTokens + candidatesTokens + thoughtsTokens;
    const usage = usageMetadata ? {
      promptTokens,
      candidatesTokens,
      totalTokens,
      thoughtsTokens
    } : void 0;
    const estimatedCost = calculateEstimatedCost(usage);
    return {
      answer: candidateText.trim(),
      citations,
      status: "success",
      usage,
      estimatedCost
    };
  } catch (err) {
    clearTimeout(timeoutId);
    return {
      answer: "",
      citations: [],
      status: "error",
      errorMessage: err.name === "AbortError" ? "Timeout ao consultar API do Gemini." : err.message
    };
  }
}

// src/index.ts
function corsHeaders(origin = "*") {
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "86400",
    "Content-Type": "application/json; charset=utf-8"
  };
}
var src_default = {
  async fetch(request, env2) {
    const origin = env2.ALLOWED_ORIGIN || "*";
    const url = new URL(request.url);
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: corsHeaders(origin)
      });
    }
    if (url.pathname === "/" || url.pathname === "/health" || url.pathname === "/api/health") {
      const isMock = env2.MOCK_MODE !== "false" || !env2.GEMINI_API_KEY;
      const quota = getDailyQuotaStatus();
      const maxDaily = Number(env2.DAILY_GLOBAL_QUOTA || CONFIG.DAILY_GLOBAL_QUOTA);
      return new Response(
        JSON.stringify({
          service: "First 1,000 Days Edge Gateway & RAG",
          status: "healthy",
          mode: isMock ? "mock" : "live",
          model: env2.GEMINI_MODEL || CONFIG.DEFAULT_MODEL,
          evidenceChunksCount: EVIDENCE_CATALOG.length,
          dailyRequestsCount: quota.count,
          dailyQuotaLimit: maxDaily,
          quotaRemaining: Math.max(0, maxDaily - quota.count),
          governance: "DPG Standard & UNICEF FemTech 2026 Compatible"
        }, null, 2),
        { status: 200, headers: corsHeaders(origin) }
      );
    }
    if (url.pathname === "/api/ask" && request.method === "POST") {
      const startTime = Date.now();
      const clientIp = request.headers.get("cf-connecting-ip") || request.headers.get("x-forwarded-for")?.split(",")[0].trim() || "127.0.0.1";
      const clientHash = await hashIp(clientIp);
      const maxPerWindow = Number(env2.RATE_LIMIT_PER_WINDOW || CONFIG.RATE_LIMIT_PER_WINDOW);
      const windowSec = Number(env2.RATE_LIMIT_WINDOW_SECONDS || CONFIG.RATE_LIMIT_WINDOW_SECONDS);
      const rateCheck = await checkRateLimit(clientHash, maxPerWindow, windowSec, env2.RATE_LIMIT_KV);
      if (!rateCheck.allowed) {
        const body = {
          status: "rate_limited",
          answer: "Limite de consultas tempor\xE1rias atingido para este dispositivo. Por favor, aguarde alguns minutos antes de fazer nova pergunta.",
          citations: [],
          safetyDisclaimer: "",
          mode: "mock",
          isEmergency: false,
          retrievedCount: 0,
          errorMessage: "Rate limit exceeded (15 req/10min)"
        };
        return new Response(JSON.stringify(body), {
          status: 429,
          headers: corsHeaders(origin)
        });
      }
      const maxDaily = Number(env2.DAILY_GLOBAL_QUOTA || CONFIG.DAILY_GLOBAL_QUOTA);
      const quotaCheck = await checkGlobalDailyQuota(maxDaily, env2.RATE_LIMIT_KV);
      if (!quotaCheck.allowed) {
        const body = {
          status: "rate_limited",
          answer: "A cota global di\xE1ria de consultas do assistente educativo foi atingida para proteger os recursos do projeto. Por favor, consulte a Biblioteca de Cuidados ou tente novamente amanh\xE3.",
          citations: [],
          safetyDisclaimer: "",
          mode: "mock",
          isEmergency: false,
          retrievedCount: 0,
          errorMessage: "Daily global quota reached"
        };
        return new Response(JSON.stringify(body), {
          status: 429,
          headers: corsHeaders(origin)
        });
      }
      let reqBody;
      try {
        reqBody = await request.json();
      } catch {
        return new Response(
          JSON.stringify({ error: "Formato JSON inv\xE1lido." }),
          { status: 400, headers: corsHeaders(origin) }
        );
      }
      const rawQuestion = reqBody.question?.trim() || "";
      const lang = reqBody.lang === "en" ? "en" : "pt-BR";
      const phase = reqBody.phase;
      const maxLength = Number(env2.MAX_QUESTION_LENGTH || CONFIG.MAX_QUESTION_LENGTH);
      if (rawQuestion.length < CONFIG.MIN_QUESTION_LENGTH) {
        return new Response(
          JSON.stringify({
            error: lang === "pt-BR" ? `A pergunta deve conter pelo menos ${CONFIG.MIN_QUESTION_LENGTH} caracteres.` : `Question must contain at least ${CONFIG.MIN_QUESTION_LENGTH} characters.`
          }),
          { status: 400, headers: corsHeaders(origin) }
        );
      }
      if (rawQuestion.length > maxLength) {
        return new Response(
          JSON.stringify({
            error: lang === "pt-BR" ? `A pergunta excede o limite m\xE1ximo de ${maxLength} caracteres.` : `Question exceeds the maximum limit of ${maxLength} characters.`
          }),
          { status: 400, headers: corsHeaders(origin) }
        );
      }
      const { sanitized } = sanitizeUserInput(rawQuestion, lang);
      const emergencyCheck = checkEmergencySafety(sanitized, lang);
      if (emergencyCheck.isEmergency) {
        const emergencyResp = {
          status: "emergency",
          answer: emergencyCheck.message || "",
          citations: [],
          safetyDisclaimer: "AVISO: Situa\xE7\xE3o potencialmente urgente. Assist\xEAncia m\xE9dica presencial imediata necess\xE1ria.",
          mode: "mock",
          isEmergency: true,
          emergencyPhone: emergencyCheck.emergencyPhone,
          retrievedCount: 0,
          remainingDailyQuota: quotaCheck.remaining,
          executionMs: Date.now() - startTime
        };
        return new Response(JSON.stringify(emergencyResp), {
          status: 200,
          headers: corsHeaders(origin)
        });
      }
      const retrieved = retrieveRelevantEvidence(sanitized, phase, lang, CONFIG.TOP_K_CHUNKS);
      const isMock = env2.MOCK_MODE !== "false" || !env2.GEMINI_API_KEY;
      if (isMock) {
        await new Promise((res) => setTimeout(res, CONFIG.MOCK_DELAY_MS));
        const mockResult = generateMockAnswer(sanitized, retrieved, lang);
        const responseBody = {
          status: mockResult.status,
          answer: mockResult.answer,
          citations: mockResult.citations,
          safetyDisclaimer: mockResult.safetyDisclaimer,
          mode: "mock",
          isEmergency: false,
          retrievedCount: retrieved.length,
          remainingDailyQuota: quotaCheck.remaining,
          executionMs: Date.now() - startTime
        };
        return new Response(JSON.stringify(responseBody), {
          status: 200,
          headers: corsHeaders(origin)
        });
      } else {
        const model = env2.GEMINI_MODEL || CONFIG.DEFAULT_MODEL;
        const geminiResult = await callGeminiFlashLite(
          env2.GEMINI_API_KEY,
          model,
          sanitized,
          retrieved,
          lang
        );
        if (geminiResult.status === "error") {
          const isPt2 = lang === "pt-BR";
          const responseBody2 = {
            status: "error",
            answer: isPt2 ? "O servi\xE7o oficial de intelig\xEAncia artificial est\xE1 temporariamente indispon\xEDvel. N\xE3o foi poss\xEDvel consultar o modelo Gemini no momento. Por favor, consulte as diretrizes na Biblioteca de Cuidados ou tente novamente em instantes." : "The official AI service is temporarily unavailable. Could not query the Gemini model at this time. Please refer to the Care Library guidelines or try again shortly.",
            citations: [],
            safetyDisclaimer: isPt2 ? "Aviso \xC9tico: Falha na conex\xE3o com a IA oficial. Nenhuma resposta simulada foi substitu\xEDda." : "Ethical Notice: Official AI connection failure. No simulated response was substituted.",
            mode: "gemini-3.5-flash-lite",
            isEmergency: false,
            retrievedCount: retrieved.length,
            remainingDailyQuota: quotaCheck.remaining,
            executionMs: Date.now() - startTime,
            errorMessage: geminiResult.errorMessage
          };
          return new Response(JSON.stringify(responseBody2), {
            status: 502,
            headers: corsHeaders(origin)
          });
        }
        const isPt = lang === "pt-BR";
        const responseBody = {
          status: geminiResult.status,
          answer: geminiResult.answer,
          citations: geminiResult.citations,
          safetyDisclaimer: isPt ? "Aviso Educativo: Resposta gerada via IA Gemini 3.5 Flash-Lite fundamentada estritamente nos guias oficiais informados. N\xE3o substitui consulta m\xE9dica." : "Educational Notice: Response generated via Gemini 3.5 Flash-Lite grounded strictly in official guidelines. Does not replace clinical evaluation.",
          mode: "gemini-3.5-flash-lite",
          model,
          isEmergency: false,
          retrievedCount: retrieved.length,
          remainingDailyQuota: quotaCheck.remaining,
          executionMs: Date.now() - startTime,
          usage: geminiResult.usage,
          estimatedCost: geminiResult.estimatedCost
        };
        return new Response(JSON.stringify(responseBody), {
          status: 200,
          headers: corsHeaders(origin)
        });
      }
    }
    return new Response(
      JSON.stringify({ error: "Endpoint n\xE3o encontrado.", path: url.pathname }),
      { status: 404, headers: corsHeaders(origin) }
    );
  }
};

// scripts/localGateway.ts
var PORT = 8787;
var HOST = "127.0.0.1";
function parseDevVars(filePath) {
  if (!import_node_fs.default.existsSync(filePath)) return {};
  const content = import_node_fs.default.readFileSync(filePath, "utf-8");
  const vars = {};
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx > 0) {
      const key = trimmed.slice(0, eqIdx).trim();
      const val = trimmed.slice(eqIdx + 1).trim();
      vars[key] = val;
    }
  }
  return vars;
}
var devVarsPath = import_node_path.default.resolve(process.cwd(), "gateway/.dev.vars");
var devVars = parseDevVars(devVarsPath);
var env = {
  MOCK_MODE: devVars.MOCK_MODE ?? "true",
  GEMINI_API_KEY: devVars.GEMINI_API_KEY,
  GEMINI_MODEL: devVars.GEMINI_MODEL ?? CONFIG.DEFAULT_MODEL,
  MAX_QUESTION_LENGTH: Number(devVars.MAX_QUESTION_LENGTH || CONFIG.MAX_QUESTION_LENGTH),
  RATE_LIMIT_PER_WINDOW: Number(devVars.RATE_LIMIT_PER_WINDOW || CONFIG.RATE_LIMIT_PER_WINDOW),
  RATE_LIMIT_WINDOW_SECONDS: Number(devVars.RATE_LIMIT_WINDOW_SECONDS || CONFIG.RATE_LIMIT_WINDOW_SECONDS),
  DAILY_GLOBAL_QUOTA: Number(devVars.DAILY_GLOBAL_QUOTA || CONFIG.DAILY_GLOBAL_QUOTA),
  ALLOWED_ORIGIN: "*"
};
console.log("\u{1F680} ========================================================");
console.log("\u{1F680} First 1,000 Days | Local Edge Gateway Server");
console.log(`\u{1F680} Host: http://${HOST}:${PORT}`);
console.log(`\u{1F680} Mode: ${env.MOCK_MODE === "false" ? "\u{1F534} LIVE (Gemini 3.5 Flash-Lite)" : "\u{1F7E2} MOCK (Simula\xE7\xE3o Local Segura)"}`);
console.log(`\u{1F680} Key Present: ${env.GEMINI_API_KEY ? "Sim (em gateway/.dev.vars protegido)" : "N\xE3o"}`);
console.log(`\u{1F680} Rate Limit: ${env.RATE_LIMIT_PER_WINDOW} req / ${env.RATE_LIMIT_WINDOW_SECONDS}s`);
console.log("\u{1F680} ========================================================\n");
var server = import_node_http.default.createServer((req, res) => {
  const fullUrl = `http://${HOST}:${PORT}${req.url}`;
  const chunks = [];
  req.on("data", (chunk) => chunks.push(chunk));
  req.on("end", async () => {
    try {
      const body = req.method !== "GET" && req.method !== "HEAD" && chunks.length > 0 ? Buffer.concat(chunks) : void 0;
      const headers = new Headers();
      for (const [k, v] of Object.entries(req.headers)) {
        if (v) headers.set(k, Array.isArray(v) ? v.join(", ") : v);
      }
      const webReq = new Request(fullUrl, {
        method: req.method,
        headers,
        body
      });
      const webRes = await src_default.fetch(webReq, env);
      res.statusCode = webRes.status;
      webRes.headers.forEach((val, key) => {
        res.setHeader(key, val);
      });
      const arrayBuffer = await webRes.arrayBuffer();
      res.end(Buffer.from(arrayBuffer));
      const statusColor = webRes.status === 200 ? "\u2705" : webRes.status === 429 ? "\u26A0\uFE0F" : "\u274C";
      console.log(`${statusColor} [${(/* @__PURE__ */ new Date()).toISOString().slice(11, 19)}] ${req.method} ${req.url} -> HTTP ${webRes.status}`);
    } catch (err) {
      console.error("\u274C Erro no gateway local:", err);
      res.statusCode = 500;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ error: "Erro interno no gateway local", details: err?.message }));
    }
  });
});
server.listen(PORT, HOST, () => {
  console.log(`\u2705 Gateway local ouvindo exclusivamente em http://${HOST}:${PORT}`);
  console.log(`   Health check dispon\xEDvel em: http://${HOST}:${PORT}/health
`);
});
