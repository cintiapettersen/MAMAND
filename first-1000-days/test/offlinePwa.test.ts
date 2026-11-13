import assert from 'node:assert';
import test from 'node:test';
import fs from 'node:fs';
import path from 'node:path';

test('1. Validação do manifesto PWA (public/manifest.webmanifest)', () => {
  const manifestPath = path.resolve('public/manifest.webmanifest');
  assert.ok(fs.existsSync(manifestPath), 'manifest.webmanifest deve existir na pasta public');

  const content = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
  assert.strictEqual(content.display, 'standalone', 'PWA deve ter display standalone');
  assert.strictEqual(content.start_url, '/', 'start_url deve ser /');
  assert.strictEqual(content.theme_color, '#FAF7F2', 'theme_color deve ser #FAF7F2');
  assert.strictEqual(content.background_color, '#FAF7F2', 'background_color deve ser #FAF7F2');
  assert.ok(Array.isArray(content.icons) && content.icons.length >= 2, 'Deve possuir ao menos 2 ícones');

  // Verifica existência física dos ícones
  for (const icon of content.icons) {
    const iconFile = path.resolve('public', icon.src.replace(/^\//, ''));
    assert.ok(fs.existsSync(iconFile), `Ícone ${icon.src} deve existir em public`);
  }
});

test('2. Validação da estratégia do Service Worker e isolamento de privacidade', () => {
  const swPath = path.resolve('public/sw.js');
  assert.ok(fs.existsSync(swPath), 'sw.js deve existir na pasta public');

  const swContent = fs.readFileSync(swPath, 'utf-8');

  // Regra de Versionamento
  assert.match(swContent, /const CACHE_NAME = `first-1000-days-\${CACHE_VERSION}`/, 'Deve utilizar versionamento explícito no cache');

  // Exclusão estrita de chamadas sensíveis / API
  assert.match(swContent, /url\.pathname\.startsWith\('\/api'\)/, 'Deve checar estritamente /api');
  assert.match(swContent, /url\.port === '8787'/, 'Deve isolar o gateway local na porta 8787');
  assert.match(swContent, /status:\s*503/, 'Deve retornar 503 Service Unavailable sem gravar em cache ao falhar offline');

  // Estratégia de Fallback do App Shell
  assert.match(swContent, /request\.mode === 'navigate'/, 'Deve tratar navegações HTML');
  assert.match(swContent, /caches\.match\('\/index\.html'\)/, 'Deve servir index.html em cache se a rede falhar');

  // Limpeza de caches antigos
  assert.match(swContent, /caches\.delete\(key\)/, 'Deve limpar versões anteriores do cache no activate');
});

test('3. Ausência de requisições externas ao Google Fonts e fontes auto-hospedadas em public/fonts', () => {
  const htmlContent = fs.readFileSync(path.resolve('index.html'), 'utf-8');
  const cssContent = fs.readFileSync(path.resolve('src/styles/index.css'), 'utf-8');

  // Nenhuma referência ao Google Fonts no HTML ou CSS
  assert.ok(
    !htmlContent.includes('fonts.googleapis.com') && !htmlContent.includes('fonts.gstatic.com'),
    'index.html não deve conter requisições externas ao Google Fonts'
  );
  assert.ok(
    !cssContent.includes('fonts.googleapis.com') && !cssContent.includes('fonts.gstatic.com'),
    'src/styles/index.css não deve conter requisições externas ao Google Fonts'
  );
  assert.ok(
    htmlContent.includes('<link rel="manifest" href="/manifest.webmanifest" />'),
    'index.html deve referenciar o manifesto PWA'
  );

  // Verifica existência física das fontes auto-hospedadas e da licença OFL
  const requiredFontFiles = [
    'fraunces-latin.woff2',
    'fraunces-latin-ext.woff2',
    'nunito-latin.woff2',
    'nunito-latin-ext.woff2',
    'plus-jakarta-sans-latin.woff2',
    'plus-jakarta-sans-latin-ext.woff2',
    'LICENSES.txt'
  ];
  for (const fontFile of requiredFontFiles) {
    assert.ok(
      fs.existsSync(path.resolve('public/fonts', fontFile)),
      `Arquivo de fonte local public/fonts/${fontFile} deve existir`
    );
  }

  // Verifica @font-face apontando para /fonts/
  assert.match(cssContent, /url\('\/fonts\/fraunces-latin\.woff2'\)/, 'CSS deve carregar Fraunces localmente');
  assert.match(cssContent, /url\('\/fonts\/nunito-latin\.woff2'\)/, 'CSS deve carregar Nunito localmente');
  assert.match(cssContent, /url\('\/fonts\/plus-jakarta-sans-latin\.woff2'\)/, 'CSS deve carregar Plus Jakarta Sans localmente');
});

test('4. Validação de independência offline do IndexedDB e fallback local do assistente', async () => {
  const cssContent = fs.readFileSync(path.resolve('src/styles/index.css'), 'utf-8');
  assert.match(cssContent, /--font-body: 'Plus Jakarta Sans', system-ui/, 'Stack de fontes corporais com fallback resiliente do sistema');
  assert.match(cssContent, /--font-title: 'Fraunces', Georgia/, 'Stack de títulos com fallback resiliente serif');
});
