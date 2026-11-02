import assert from 'node:assert';
import test from 'node:test';
import { build } from 'esbuild';
import { calculateAgeInMonths, formatBabyAgeDetailed } from '../src/utils/dateUtils.ts';
import type { UserProfile } from '../src/types/index.ts';

// Rótulo de idade do cabeçalho e da Biblioteca de Cuidados (perfis fictícios)

// locales/index.ts usa imports sem extensão: empacotado em memória
const out = await build({
  entryPoints: ['src/locales/index.ts'],
  bundle: true,
  write: false,
  format: 'esm',
  platform: 'neutral',
  logLevel: 'silent'
});
const { getLocalizedStageLabel } = (await import(
  'data:text/javascript;base64,' + Buffer.from(out.outputFiles[0].text).toString('base64')
)) as typeof import('../src/locales/index.ts');

const baby = (stageValue: number) => ({ phase: 'baby', stageValue } as unknown as UserProfile);

test('Faixas do cadastro: o rótulo mostra a faixa inteira em pt e en', () => {
  const cases: Array<[number, string, string, string, string]> = [
    // valor, pt no cabeçalho, pt dentro de frase, en no cabeçalho, en dentro de frase
    [0, 'Recém-nascido (primeiro mês)', 'Recém-nascido (primeiro mês)', 'Newborn (first month)', 'Newborn (first month)'],
    [2, '2 a 3 meses', 'Bebê de 2 a 3 meses', '2 to 3 months old', 'a baby aged 2 to 3 months'],
    [6, '4 a 6 meses', 'Bebê de 4 a 6 meses', '4 to 6 months old', 'a baby aged 4 to 6 months'],
    [12, '7 a 12 meses', 'Bebê de 7 a 12 meses', '7 to 12 months old', 'a baby aged 7 to 12 months'],
    [24, 'Criança de 1 a 2 anos', 'Criança de 1 a 2 anos', 'Toddler (1 to 2 years)', 'Toddler (1 to 2 years)']
  ];
  for (const [value, ptCompact, pt, enCompact, en] of cases) {
    assert.strictEqual(getLocalizedStageLabel(baby(value), 'pt-BR', true), ptCompact);
    assert.strictEqual(getLocalizedStageLabel(baby(value), 'pt-BR'), pt);
    assert.strictEqual(getLocalizedStageLabel(baby(value), 'en', true), enCompact);
    assert.strictEqual(getLocalizedStageLabel(baby(value), 'en'), en);
  }
});

test('Valores fora das faixas: número exato, no singular ou no plural', () => {
  assert.strictEqual(getLocalizedStageLabel(baby(1), 'pt-BR', true), 'Bebê de 1 mês');
  assert.strictEqual(getLocalizedStageLabel(baby(5), 'pt-BR', true), 'Bebê de 5 meses');
  assert.strictEqual(getLocalizedStageLabel(baby(1), 'en', true), '1-month-old baby');
  assert.strictEqual(getLocalizedStageLabel(baby(1), 'en'), 'a 1-month-old baby');
  assert.strictEqual(getLocalizedStageLabel(baby(9), 'en'), 'a 9-month-old baby');
  for (let v = 0; v <= 24; v++) {
    for (const lang of ['pt-BR', 'en'] as const) {
      const label = getLocalizedStageLabel(baby(v), lang, true);
      assert.ok(!/\b1 meses\b|\b1 months\b/.test(label), `${v} ${lang}: ${label}`);
    }
  }
});

test('Gestação: rótulos sem mudança', () => {
  const pregnancy = (stageValue: number) => ({ phase: 'pregnancy', stageValue } as unknown as UserProfile);
  assert.strictEqual(getLocalizedStageLabel(pregnancy(12), 'pt-BR', true), 'Início da gestação');
  assert.strictEqual(getLocalizedStageLabel(pregnancy(24), 'en'), 'Mid-pregnancy (14 to 27 weeks)');
});

test('Com data de nascimento: idade exata em dias e meses, singular e plural', () => {
  const ref = new Date(2026, 9, 30); // 30/10/2026
  const cases: Array<[string, string, string]> = [
    ['2026-10-30', 'Nasceu hoje', 'Born today'],
    ['2026-10-29', '1 dia de vida', '1 day old'],
    ['2026-10-15', '15 dias de vida', '15 days old'],
    ['2026-09-15', '45 dias de vida (1 mês)', '45 days old (1 month)'],
    ['2026-08-21', '70 dias de vida (2 meses)', '70 days old (2 months)']
  ];
  for (const [birth, pt, en] of cases) {
    assert.strictEqual(formatBabyAgeDetailed(birth, 'pt-BR', ref), pt);
    assert.strictEqual(formatBabyAgeDetailed(birth, 'en', ref), en);
  }
});

test('Com data de nascimento: acima de 24 meses, a idade exibida não fica presa em 24', () => {
  const ref = new Date(2026, 9, 30);
  assert.strictEqual(formatBabyAgeDetailed('2024-08-21', 'pt-BR', ref), '800 dias de vida (26 meses)');
  // O motor de recomendações continua usando o limite de 24 meses
  assert.strictEqual(calculateAgeInMonths('2024-08-21', ref), 24);
});
