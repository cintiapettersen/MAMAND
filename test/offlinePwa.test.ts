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

test('3. Eliminação de dependência de rede para fontes em index.html', () => {
  const htmlContent = fs.readFileSync(path.resolve('index.html'), 'utf-8');
  const mainContent = fs.readFileSync(path.resolve('src/main.tsx'), 'utf-8');

  // Fontes hospedadas no próprio app: nada de Google Fonts (privacidade e uso offline)
  assert.ok(
    !/fonts\.googleapis\.com|fonts\.gstatic\.com/.test(htmlContent),
    'index.html não deve carregar fontes de servidores externos'
  );
  for (const pkg of ['@fontsource/nunito/', '@fontsource/plus-jakarta-sans/', '@fontsource-variable/fraunces/']) {
    assert.ok(mainContent.includes(`import '${pkg}`), `main.tsx deve importar a fonte local ${pkg}`);
  }
  assert.ok(
    htmlContent.includes('<link rel="manifest" href="/manifest.webmanifest" />'),
    'index.html deve referenciar o manifesto PWA'
  );
});

test('4. Fontes com alternativas do sistema para uso offline', async () => {
  const cssContent = fs.readFileSync(path.resolve('src/styles/index.css'), 'utf-8');
  assert.match(cssContent, /--font-body: 'Plus Jakarta Sans', system-ui/, 'Stack de fontes corporais com fallback resiliente do sistema');
  assert.match(cssContent, /--font-title: 'Fraunces Variable', 'Fraunces', Georgia/, 'Stack de títulos com fallback resiliente serif');
});
