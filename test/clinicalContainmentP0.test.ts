import assert from 'node:assert';
import test from 'node:test';
import fs from 'node:fs';
import path from 'node:path';
import { build } from 'esbuild';
import {
  canShowCareInstructions,
  isContentAuthorizedForPublication
} from '../src/config/careContentAvailability.ts';
import { getDailyCards } from '../src/data/dailyCards.ts';
import { getCheckinQuestions } from '../src/data/checkins.ts';
import { HEALTH_CHECK_CATALOGS } from '../src/data/healthCheckCatalogs.ts';
import { getContentCatalog } from '../src/data/contents.ts';

// Bundle em memória para emergencyContacts (usa imports sem extensão)
const ecBundle = await build({
  entryPoints: ['src/data/emergencyContacts.ts'],
  bundle: true,
  write: false,
  format: 'esm',
  platform: 'node'
});
const { getEmergencyContact } = await import(
  'data:text/javascript;base64,' + Buffer.from(ecBundle.outputFiles[0].text).toString('base64')
);

test('P0-1. Aba Pergunte isolada: sem importação de respostas clínicas não aprovadas no frontend público', () => {
  const askViewSrc = fs.readFileSync('src/views/AskView.tsx', 'utf8');
  assert.ok(!/askService|ragService|mockEngine|evidenceCatalog|safetyService/.test(askViewSrc));
  assert.match(askViewSrc, /data-testid="ask-suspended-notice"/);
  assert.match(askViewSrc, /<EmergencyStrip\s+country=\{profile\.country\}\s*\/>/);
  assert.ok(!/<textarea/.test(askViewSrc), 'Formulário de perguntas não deve existir na distribuição pública');

  const navSrc = fs.readFileSync('src/components/Navigation.tsx', 'utf8');
  assert.match(navSrc, /id:\s*'ask'/);
});

test('P0-2. Bundle de produção (dist/) não contém textos clínicos bloqueados nem evidenceCatalog', () => {
  const assetsDir = path.resolve('dist/assets');
  assert.ok(fs.existsSync(assetsDir), 'dist/assets deve existir após npm run build');

  const jsFiles = fs.readdirSync(assetsDir).filter((f) => f.endsWith('.js'));
  assert.ok(jsFiles.length > 0, 'Deve existir ao menos um bundle JS em dist/assets');

  const forbiddenStrings = [
    'O ritmo de sono no início do puerpério acompanha as necessidades frequentes',
    'Posição e Ambiente Seguro para o Sono do Bebê',
    'A pega adequada é essencial para a extração eficaz do leite',
    'mamand_biblioteca_v0_1'
  ];

  for (const file of jsFiles) {
    const content = fs.readFileSync(path.join(assetsDir, file), 'utf8');
    for (const forbidden of forbiddenStrings) {
      assert.ok(
        !content.includes(forbidden),
        `Texto clínico bloqueado encontrado no bundle ${file}: "${forbidden}"`
      );
    }
  }
});

test('P0-3. Separação de estados de validação e bloqueio obrigatório de suspendedReason', () => {
  assert.strictEqual(
    isContentAuthorizedForPublication({
      validationStatus: 'verified',
      educationalText: 'Texto'
    }),
    false,
    'verified nunca autoriza publicação'
  );
  assert.strictEqual(
    isContentAuthorizedForPublication({
      validationStatus: 'source_based',
      educationalText: 'Texto'
    }),
    false,
    'source_based nunca autoriza publicação'
  );
  assert.strictEqual(
    isContentAuthorizedForPublication({
      validationStatus: 'clinically_reviewed',
      clinicalReview: { reviewer: 'Dra. Teste', credential: 'CRM 1', date: '2026-11-14', reference: 'Ref' },
      publicationAllowed: false,
      educationalText: 'Texto'
    }),
    false,
    'clinically_reviewed sem publicationAllowed: true não autoriza'
  );
  assert.strictEqual(
    canShowCareInstructions(
      {
        validationStatus: 'clinically_reviewed',
        clinicalReview: { reviewer: 'Dra. Teste', credential: 'CRM 1', date: '2026-11-14', reference: 'Ref' },
        publicationAllowed: true,
        suspendedReason: 'Em reavaliação',
        educationalText: 'Texto'
      },
      true
    ),
    false,
    'suspendedReason deve bloquear mesmo em modo DEV e com revisão'
  );
  assert.strictEqual(
    isContentAuthorizedForPublication({
      validationStatus: 'clinically_reviewed',
      clinicalReview: { reviewer: 'Dra. Teste', credential: 'CRM 1', date: '2026-11-14', reference: 'Ref' },
      publicationAllowed: true,
      educationalText: 'Texto revisado'
    }),
    true
  );
});

test('P0-4. Preservação dos conteúdos originais em pesquisa e módulos não clínicos', () => {
  const archivePath = path.resolve('research/clinical-knowledge/care_contents_unreviewed_v0_1.json');
  assert.ok(fs.existsSync(archivePath), 'Arquivo de pesquisa deve existir');
  const archive = JSON.parse(fs.readFileSync(archivePath, 'utf8'));
  assert.strictEqual(archive.pt.length, 30);
  assert.strictEqual(archive.en.length, 30);
  assert.ok(archive.pt.every((i: any) => typeof i.educationalText === 'string' && i.educationalText.length > 0));

  assert.ok(getDailyCards('pt-BR').length > 0);
  assert.ok(getDailyCards('en').length > 0);
  assert.ok(getCheckinQuestions('pt-BR').length > 0);
  assert.strictEqual(HEALTH_CHECK_CATALOGS.length, 0);
  assert.strictEqual(getContentCatalog('pt-BR', { includeDevPending: false }).length, 30);
});

test('P0-5. Contatos de emergência operacionais e sem número inventado sem país', () => {
  assert.strictEqual(getEmergencyContact('BR')?.emergency.number, '192');
  assert.strictEqual(getEmergencyContact('NO')?.emergency.number, '113');
  assert.strictEqual(getEmergencyContact('PT')?.emergency.number, '112');
  assert.strictEqual(getEmergencyContact(undefined), null);
});
