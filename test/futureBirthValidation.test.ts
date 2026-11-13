import assert from 'node:assert';
import test from 'node:test';
import {
  calculateDaysOfLife,
  calculateAgeInMonths,
  formatBabyAgeDetailed,
  validateBirthDate,
  validateDueDate,
  formatDueDate,
  birthDateBounds,
  dueDateBounds
} from '../src/utils/dateUtils.ts';

test('Nascimento hoje: idade exata 0 dias e rótulo "Nasceu hoje" / "Born today"', () => {
  const ref = new Date(2026, 10, 13, 14, 0, 0); // 13 de novembro de 2026
  const birthStr = '2026-11-13';

  assert.strictEqual(validateBirthDate(birthStr, ref), null);
  assert.strictEqual(calculateDaysOfLife(birthStr, ref), 0);
  assert.strictEqual(calculateAgeInMonths(birthStr, ref), 0);
  assert.strictEqual(formatBabyAgeDetailed(birthStr, 'pt-BR', ref), 'Nasceu hoje');
  assert.strictEqual(formatBabyAgeDetailed(birthStr, 'en', ref), 'Born today');
});

test('Nascimento ontem: idade exata 1 dia e rótulo "1 dia de vida" / "1 day old"', () => {
  const ref = new Date(2026, 10, 13, 10, 0, 0);
  const birthStr = '2026-11-12';

  assert.strictEqual(validateBirthDate(birthStr, ref), null);
  assert.strictEqual(calculateDaysOfLife(birthStr, ref), 1);
  assert.strictEqual(formatBabyAgeDetailed(birthStr, 'pt-BR', ref), '1 dia de vida');
  assert.strictEqual(formatBabyAgeDetailed(birthStr, 'en', ref), '1 day old');
});

test('Data futura (ex: 30/04/2027 em 13/11/2026): NUNCA converte em 0 dias ou "Nasceu hoje"', () => {
  const ref = new Date(2026, 10, 13, 12, 0, 0); // 13 de novembro de 2026
  const futureDate = '2027-04-30';

  // Validação estrita
  assert.strictEqual(validateBirthDate(futureDate, ref), 'future');

  // Dias de vida devem ser -1 (inválido/futuro), NUNCA 0
  assert.strictEqual(calculateDaysOfLife(futureDate, ref), -1);

  // formatBabyAgeDetailed DEVE retornar vazio '', NUNCA "Nasceu hoje" nem "Born today"
  assert.strictEqual(formatBabyAgeDetailed(futureDate, 'pt-BR', ref), '');
  assert.strictEqual(formatBabyAgeDetailed(futureDate, 'en', ref), '');
});

test('Data de nascimento inválida ou malformada: retorna erro e string vazia', () => {
  const ref = new Date(2026, 10, 13);
  assert.strictEqual(validateBirthDate('2026-02-31', ref), 'invalid');
  assert.strictEqual(validateBirthDate('texto-invalido', ref), 'invalid');
  assert.strictEqual(validateBirthDate('0202-05-10', ref), 'tooOld');

  assert.strictEqual(calculateDaysOfLife('2026-02-31', ref), -1);
  assert.strictEqual(formatBabyAgeDetailed('2026-02-31', 'pt-BR', ref), '');
  assert.strictEqual(formatBabyAgeDetailed('', 'pt-BR', ref), '');
});

test('Virada de ano: cálculo correto de dias entre 31/12 e 01/01', () => {
  const ref = new Date(2027, 0, 1, 9, 0, 0); // 01 de janeiro de 2027
  const birthStr = '2026-12-31';

  assert.strictEqual(validateBirthDate(birthStr, ref), null);
  assert.strictEqual(calculateDaysOfLife(birthStr, ref), 1);
  assert.strictEqual(formatBabyAgeDetailed(birthStr, 'pt-BR', ref), '1 dia de vida');
});

test('Modo Gestação: preserva possibilidade de DPP futura', () => {
  const ref = new Date(2026, 10, 13); // 13/11/2026
  const validFutureDue = '2027-04-30'; // ~5 meses à frente

  // DPP futura deve ser válida (não é erro!)
  assert.strictEqual(validateDueDate(validFutureDue, ref), null);

  const formatted = formatDueDate(validFutureDue, 'pt-BR', ref);
  assert.ok(formatted.includes('DPP:'), `Deveria formatar DPP: ${formatted}`);

  // DPP a mais de 10 meses deve ser rejeitada como 'tooFar'
  assert.strictEqual(validateDueDate('2028-05-01', ref), 'tooFar');
});

test('Limites de data: nascimento no fuso local limita até hoje', () => {
  const ref = new Date(2026, 10, 13);
  const bounds = birthDateBounds(ref);
  assert.strictEqual(bounds.max, '2026-11-13');
  assert.strictEqual(bounds.min, '2021-11-13');
});
