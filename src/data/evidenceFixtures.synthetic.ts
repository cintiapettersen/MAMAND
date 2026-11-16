// Fixtures sintéticas para testes arquiteturais do motor RAG sem dependência de textos
// clínicos reais ou de publicações de terceiros (isolamento J4).
// Todos os itens têm status 'pending_review' e 'publicationAllowed: false'.
import type { EvidenceChunk } from '../serverTypes.ts';

export const SYNTHETIC_EVIDENCE_FIXTURES: EvidenceChunk[] = [
  {
    id: 'fixture-synthetic-routine-01',
    phase: 'baby',
    stageRange: '0-12m',
    topic: 'synthetic_routine',
    title_pt: 'Fixture sintética: organização de rotina e descanso',
    title_en: 'Synthetic fixture: routine organization and rest',
    summary_pt:
      'Registro sintético de teste para validar recuperação lexical, filtros de fase e bloqueio padrão de itens sem revisão profissional.',
    summary_en:
      'Synthetic test entry used to verify lexical retrieval, phase filtering, and default blocking of unreviewed items.',
    conversationalAnswer_pt:
      'Esta é uma resposta sintética de teste técnico sem conteúdo clínico real ou referência a diretrizes externas.',
    conversationalAnswer_en:
      'This is a synthetic technical test response containing no real clinical guidance or external guideline text.',
    keywords_pt: ['rotina sintetica', 'descanso fixture', 'teste rag'],
    keywords_en: ['synthetic routine', 'fixture rest', 'rag test'],
    sourceName: 'Fixture Sintética Interna (MAMAND)',
    document: 'Sem fonte clínica externa (fixture técnica)',
    edition: 'v1.0-synthetic',
    sectionOrPage: 'N/A',
    validationStatus: 'pending_review',
    publicationAllowed: false,
    countryJurisdiction: 'GLOBAL'
  },
  {
    id: 'fixture-synthetic-pregnancy-02',
    phase: 'pregnancy',
    stageRange: 'all',
    topic: 'synthetic_preparation',
    title_pt: 'Fixture sintética: preparação do ambiente na gestação',
    title_en: 'Synthetic fixture: environment preparation in pregnancy',
    summary_pt:
      'Registro sintético de teste para validar filtragem da fase de gestação sem expor rascunhos clínicos.',
    summary_en:
      'Synthetic test entry used to verify pregnancy phase filtering without exposing clinical drafts.',
    conversationalAnswer_pt:
      'Resposta sintética exclusiva para validação técnica do motor de busca na fase de gestação.',
    conversationalAnswer_en:
      'Synthetic response strictly for technical validation of the retrieval engine in pregnancy phase.',
    keywords_pt: ['preparacao sintetica', 'gestacao fixture', 'ambiente teste'],
    keywords_en: ['synthetic preparation', 'pregnancy fixture', 'environment test'],
    sourceName: 'Fixture Sintética Interna (MAMAND)',
    document: 'Sem fonte clínica externa (fixture técnica)',
    edition: 'v1.0-synthetic',
    sectionOrPage: 'N/A',
    validationStatus: 'pending_review',
    publicationAllowed: false,
    countryJurisdiction: 'GLOBAL'
  }
];
