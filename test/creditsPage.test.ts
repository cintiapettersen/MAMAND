import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { CREDITS_DOC_PT, CREDITS_DOC_EN } from '../src/data/creditsData.ts';

const ROOT = path.resolve(import.meta.dirname, '..');

test('1. Paridade PT/EN e governança em creditsData', () => {
  for (const doc of [CREDITS_DOC_PT, CREDITS_DOC_EN]) {
    assert.ok(doc.title.length > 0);
    assert.ok(doc.subtitle.length > 0);

    const govText = doc.governanceItems.map((i) => `${i.label} ${i.value}`).join(' ');
    assert.match(govText, /Cintia Pettersen/);
    assert.match(govText, /CREATIVE DESIGN PETTERSEN LTDA/);
    assert.match(govText, /UNICEF FemTech Ventures 2026/);

    const swText = doc.softwareLicenseParagraphs.join(' ');
    assert.match(swText, /Apache License 2\.0/);
    assert.match(swText, /src\/locales\/pt-BR\.ts/);
    assert.match(swText, /src\/locales\/en\.ts/);
  }
});

test('2. Proposta CC BY 4.0 marcada como proposta não vigente e restrita aos 4 arquivos elegíveis', () => {
  const expectedFiles = [
    'src/data/dailyCards.ts',
    'src/data/supportCatalog.ts',
    'src/data/maternityChecklist.ts',
    'src/data/checkins.ts'
  ];

  for (const doc of [CREDITS_DOC_PT, CREDITS_DOC_EN]) {
    assert.deepEqual(
      doc.proposedFiles.map((f) => f.path),
      expectedFiles
    );
    assert.match(doc.proposedStatusBadge, /proposta|Proposed/i);
    assert.match(doc.proposedStatusNotice, /NÃO está ativa|NOT active/i);
    assert.match(doc.proposedStatusNotice, /J3|T1/);
    assert.match(doc.uiTextsNote, /Apache License 2\.0/);

    const declText = doc.declarationFields.map((f) => `${f.label} ${f.value}`).join(' ');
    assert.match(declText, /Cintia Pettersen/);
    assert.match(declText, /MAMAND/);
    assert.match(declText, /https:\/\/mamand\.app\/credits/);
    assert.match(declText, /Creative Commons Attribution 4\.0 International \(CC BY 4\.0\)/);
    assert.match(doc.reuseClarification, /comercia|commercial/i);
    assert.match(doc.attributionExamplePt, /https:\/\/mamand\.app\/credits/);
    assert.match(doc.attributionExampleEn, /https:\/\/mamand\.app\/credits/);
  }
});

test('3. Exclusões obrigatórias e créditos de terceiros completos', () => {
  for (const doc of [CREDITS_DOC_PT, CREDITS_DOC_EN]) {
    const exclusionsText = doc.exclusionsList.map((e) => `${e.category} ${e.detail}`).join(' ');
    assert.match(exclusionsText, /TRADEMARKS\.md/);
    assert.match(exclusionsText, /privacyPolicyData\.ts/);
    assert.match(exclusionsText, /evidenceCatalog\.ts/);
    assert.match(exclusionsText, /research\/clinical-knowledge\//);
    assert.match(exclusionsText, /J4/);

    const libNames = doc.thirdPartyLibraries.map((l) => l.name);
    assert.ok(libNames.includes('React'));
    assert.ok(libNames.includes('React DOM'));
    assert.ok(libNames.includes('scheduler'));
    assert.ok(libNames.includes('Lucide (lucide-react)'));
    assert.ok(libNames.includes('@vercel/analytics'));
    assert.equal(doc.thirdPartyFonts.length, 3);
  }
});

test('4. Integração de rota /credits sem login e acesso institucional discreto', () => {
  const appSrc = fs.readFileSync(path.join(ROOT, 'src/App.tsx'), 'utf8');
  const modalSrc = fs.readFileSync(path.join(ROOT, 'src/components/ProfileEditModal.tsx'), 'utf8');
  const creditsViewSrc = fs.readFileSync(path.join(ROOT, 'src/views/CreditsView.tsx'), 'utf8');

  assert.match(appSrc, /path === '\/credits'/);
  assert.match(appSrc, /CreditsView/);
  assert.match(appSrc, /handleOpenCredits/);
  assert.match(modalSrc, /onOpenCredits/);
  assert.match(creditsViewSrc, /CREDITS_DOC_PT/);
  assert.match(creditsViewSrc, /CREDITS_DOC_EN/);

  const vercelConfig = JSON.parse(fs.readFileSync(path.join(ROOT, 'vercel.json'), 'utf8'));
  assert.ok(Array.isArray(vercelConfig.rewrites), 'vercel.json deve definir rewrites SPA');
  assert.ok(
    vercelConfig.rewrites.some((r: { source: string; destination: string }) => r.source === '/credits' && r.destination === '/'),
    'vercel.json deve reescrever /credits para / quando cleanUrls está ativo'
  );
  assert.ok(
    !vercelConfig.rewrites.some((r: { destination: string }) => r.destination === '/index.html'),
    'vercel.json com cleanUrls: true não deve usar /index.html como destino de rewrite'
  );
  assert.ok(
    !vercelConfig.rewrites.some((r: { source: string }) => r.source === '/(.*)'),
    'vercel.json não deve usar rewrite genérico /(.*) que casa com /index.html'
  );
});
