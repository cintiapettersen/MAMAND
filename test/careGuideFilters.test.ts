import assert from 'node:assert';
import test from 'node:test';
import { getContentCatalog } from '../src/data/contents.ts';
import { canShowCareInstructions, CARE_FULL_TEXT_ENABLED } from '../src/config/careContentAvailability.ts';
import { ptBR } from '../src/locales/pt-BR.ts';
import { en } from '../src/locales/en.ts';
import type { ContentItem } from '../src/types/index.ts';

const matchesCategory = (item: ContentItem, category: string) => {
  if (category === 'all') return true;
  if (category === 'mom' || category === 'wellbeing') {
    return item.audience === 'mom' || item.category === 'wellbeing' || item.category === 'mom_care';
  }
  if (category === 'baby') {
    return item.audience === 'baby' || item.category === 'baby_care' || item.category === 'development';
  }
  return item.category === category;
};

test('Nomenclatura: Guia de cuidados (PT) e Care Guide (EN)', () => {
  assert.strictEqual(ptBR.care.titleUnderReview, 'Guia de cuidados');
  assert.ok(ptBR.care.subtitle.startsWith('Guia de cuidados para o momento de vocês'));

  assert.strictEqual(en.care.titleUnderReview, 'Care Guide');
  assert.ok(en.care.subtitle.startsWith('Care guide for your current stage'));
});

test('Filtro "Tudo" na Gestação: representa a união exata dos filtros individuais', () => {
  const catalog = getContentCatalog('pt-BR');
  const pregnancyArticles = catalog.filter((item) => item.phase === 'both' || item.phase === 'pregnancy');

  const allArticles = pregnancyArticles.filter((item) => matchesCategory(item, 'all'));
  assert.ok(allArticles.length > 0, 'Deve haver orientações na gestação');

  // Filtros individuais de gestação: mom, baby, safety_prevention
  const categories = ['mom', 'baby', 'safety_prevention'];
  const unionSet = new Set<string>();

  for (const cat of categories) {
    const matching = pregnancyArticles.filter((item) => matchesCategory(item, cat));
    for (const art of matching) {
      unionSet.add(art.id);
    }
  }

  // Cada artigo de "all" deve estar presente em ao menos um filtro individual
  for (const art of allArticles) {
    assert.ok(
      unionSet.has(art.id),
      `Artigo ${art.id} (${art.title}) no filtro "Tudo" da Gestação deveria pertencer a pelo menos um filtro individual`
    );
  }

  // O tamanho da união deve ser exatamente igual ao tamanho de "Tudo"
  assert.strictEqual(unionSet.size, allArticles.length);
});

test('Filtro "Tudo" no Pós-Parto: representa a união exata dos filtros individuais em todas as etapas', () => {
  const catalog = getContentCatalog('pt-BR');
  const stageValues = [0, 2, 6, 12, 24];
  const postpartumCategories = ['mom', 'baby', 'safety_prevention', 'feeding', 'development'];

  for (const stage of stageValues) {
    const phaseArticles = catalog.filter((item) => {
      if (item.phase !== 'both' && item.phase !== 'baby') return false;
      const min = item.minStageMonths ?? 0;
      const max = item.maxStageMonths ?? 24;
      return stage >= min && stage <= max;
    });

    const allArticles = phaseArticles.filter((item) => matchesCategory(item, 'all'));
    assert.ok(allArticles.length > 0, `Deve haver orientações na etapa de ${stage} meses`);

    const unionSet = new Set<string>();
    for (const cat of postpartumCategories) {
      const matching = phaseArticles.filter((item) => matchesCategory(item, cat));
      for (const art of matching) {
        unionSet.add(art.id);
      }
    }

    for (const art of allArticles) {
      assert.ok(
        unionSet.has(art.id),
        `Artigo ${art.id} na etapa ${stage}m deveria pertencer a pelo menos um filtro individual`
      );
    }

    assert.strictEqual(
      unionSet.size,
      allArticles.length,
      `União dos filtros na etapa ${stage}m (${unionSet.size}) deve ser igual a "Tudo" (${allArticles.length})`
    );
  }
});

test('Salvaguarda clínica: canShowCareInstructions bloqueia instruções sem revisão profissional', () => {
  // Na demonstração pública, CARE_FULL_TEXT_ENABLED deve ser false por padrão
  assert.strictEqual(CARE_FULL_TEXT_ENABLED, false);

  const catalog = getContentCatalog('pt-BR');
  for (const art of catalog) {
    // Sem revisão clínica documentada, instruções não devem ser exibidas
    if (art.validationStatus !== 'clinically_reviewed' || !art.clinicalReview) {
      assert.strictEqual(
        canShowCareInstructions(art),
        false,
        `Instruções do artigo ${art.id} não podem ser exibidas sem revisão profissional comprovada`
      );
    }
  }
});
