import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');

test('1. Catálogos experimentais mantêm aviso de contenção clínica e pendência J4', () => {
  for (const rel of ['src/data/evidenceCatalog.ts', 'gateway/src/data/evidenceCatalog.ts']) {
    const content = fs.readFileSync(path.join(ROOT, rel), 'utf8');
    assert.match(content, /AVISO DE CONTENÇÃO CLÍNICA E PENDÊNCIA J4/);
    assert.match(content, /NÃO estão licenciados sob CC BY 4\.0/);
  }
});

test('2. Arquivos de pesquisa preservam release_status draft_not_for_production e license_notice', () => {
  const careArchive = JSON.parse(
    fs.readFileSync(path.join(ROOT, 'research/clinical-knowledge/care_contents_unreviewed_v0_1.json'), 'utf8')
  );
  assert.equal(careArchive.release_status, 'draft_not_for_production');
  assert.match(careArchive.license_notice, /J4/);

  const bib = JSON.parse(
    fs.readFileSync(path.join(ROOT, 'research/clinical-knowledge/mamand_biblioteca_v0_1.json'), 'utf8')
  );
  assert.equal(bib.release_status, 'draft_not_for_production');
  assert.ok(typeof bib.license_notice === 'string' && bib.license_notice.length > 0);
});

test('3. gateway/README.md não declara catálogo oficial verificado e documenta pendência J4', () => {
  const gwReadme = fs.readFileSync(path.join(ROOT, 'gateway/README.md'), 'utf8');
  assert.doesNotMatch(gwReadme, /Catálogo oficial verificado/);
  assert.match(gwReadme, /Status atual \(P0 \/ J4\)/);
  assert.match(gwReadme, /inativo e sem deploy/);
});

test('4. Documento de inventário J4 existe e não declara análise jurídica concluída', () => {
  const j4Doc = fs.readFileSync(
    path.join(ROOT, 'docs/governanca/j4-inventario-conteudos-clinicos.md'),
    'utf8'
  );
  assert.match(j4Doc, /Pendência jurídica \*\*J4 aberta\*\*/);
  assert.match(j4Doc, /Nenhuma análise jurídica foi concluída aqui/);
  assert.match(j4Doc, /CC BY-NC-SA 3\.0 IGO/);
});
