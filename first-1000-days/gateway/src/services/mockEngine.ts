import type { Citation, RetrievalResult, SupportedLang } from '../types.ts';

export interface MockAnswerResult {
  answer: string;
  citations: Citation[];
  status: 'success' | 'out_of_catalog';
  safetyDisclaimer: string;
}

export function generateMockAnswer(
  _question: string,
  results: RetrievalResult[],
  lang: SupportedLang = 'pt-BR',
  options?: { includePendingReview?: boolean }
): MockAnswerResult {
  const isPt = lang === 'pt-BR';

  const defaultDisclaimer = isPt
    ? 'Aviso Educativo: Esta resposta foi gerada localmente em modo de demonstração com base nas diretrizes oficiais cadastradas. Ela não substitui consulta médica presencial ou acompanhamento pediátrico.'
    : 'Educational Notice: This response was generated locally in demonstration mode based on official guidelines. It does not replace in-person medical evaluation or pediatric care.';

  // Filtro Fail-Safe estrito na entrada de mock: rejeita chunks não verificados (a menos que em auditoria interna)
  const safeResults = options?.includePendingReview
    ? results
    : results.filter(
        r => r.chunk.validationStatus === 'verified' && r.chunk.publicationAllowed !== false
      );

  if (safeResults.length === 0) {
    const outOfCatalogMsg = isPt
      ? 'Ainda não temos uma orientação específica sobre esse assunto em nossas referências educativas.\n\nPara tirar dúvidas sobre a saúde, desenvolvimento ou bem-estar do seu bebê ou da sua família, recomendamos conversar com o pediatra ou com a equipe de saúde de sua confiança.'
      : 'We do not have specific educational guidance on this topic in our verified references yet.\n\nFor questions about your baby\'s health, development, or family wellbeing, we recommend speaking with your pediatrician or trusted healthcare provider.';

    return {
      answer: outOfCatalogMsg,
      citations: [],
      status: 'out_of_catalog',
      safetyDisclaimer: defaultDisclaimer
    };
  }

  // Trecho principal com maior pontuação de relevância
  const topResult = safeResults[0];
  const topChunk = topResult.chunk;

  // Filtrar trecho secundário: SOMENTE incluir se for do mesmo tema e tiver pontuação alta
  // Isso impede misturar sono materno com sono do bebê, por exemplo
  let secondaryChunk = null;
  if (safeResults.length > 1) {
    const candidate = safeResults[1];
    if (candidate.chunk.topic === topChunk.topic && candidate.score >= topResult.score * 0.75) {
      secondaryChunk = candidate.chunk;
    }
  }

  // Montar lista de citações precisas para a seção recolhível
  const matchedChunks = secondaryChunk ? [topChunk, secondaryChunk] : [topChunk];
  const citations: Citation[] = matchedChunks.map(c => ({
    id: c.id,
    sourceName: c.sourceName,
    document: c.document,
    edition: c.edition,
    sectionOrPage: c.sectionOrPage,
    url: c.url,
    validationStatus: c.validationStatus,
    countryJurisdiction: c.countryJurisdiction
  }));

  // Resposta conversacional, acolhedora e direta (sem introduções robóticas e sem repetir páginas no corpo)
  let answer = '';

  if (isPt) {
    if (topChunk.conversationalAnswer_pt) {
      answer = topChunk.conversationalAnswer_pt;
    } else {
      answer = topChunk.summary_pt;
    }

    if (secondaryChunk && secondaryChunk.conversationalAnswer_pt) {
      answer += `\n\n${secondaryChunk.conversationalAnswer_pt}`;
    }
  } else {
    if (topChunk.conversationalAnswer_en) {
      answer = topChunk.conversationalAnswer_en;
    } else {
      answer = topChunk.summary_en;
    }

    if (secondaryChunk && secondaryChunk.conversationalAnswer_en) {
      answer += `\n\n${secondaryChunk.conversationalAnswer_en}`;
    }
  }

  return {
    answer,
    citations,
    status: 'success',
    safetyDisclaimer: defaultDisclaimer
  };
}
