import assert from 'node:assert';
import test from 'node:test';
import fs from 'node:fs';
import path from 'node:path';
import {
  ANALYTICS_CONSENT_STORAGE_KEY,
  clearAnalyticsConsent,
  createAnalyticsBeforeSend,
  getAnalyticsConsent,
  isProductionAnalyticsHost,
  sanitizeAnalyticsUrl,
  setAnalyticsConsent,
  shouldEnableVercelAnalytics
} from '../src/services/analyticsConsent.ts';

function createMockWindow(hostname = 'mamand.app', online = true) {
  const store = new Map<string, string>();
  const removedScripts: string[] = [];
  const vaCalls: Array<[string, unknown?]> = [];
  const mockScripts = [
    {
      src: '/_vercel/insights/script.js',
      remove: () => removedScripts.push('/_vercel/insights/script.js')
    }
  ];

  (globalThis as any).window = {
    localStorage: {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => store.set(k, v),
      removeItem: (k: string) => store.delete(k)
    },
    location: { hostname },
    va: (event: string, payload?: unknown) => {
      vaCalls.push([event, payload]);
    },
    vaq: [['pageview', {}]]
  };

  (globalThis as any).document = {
    head: {
      querySelectorAll: () => mockScripts
    }
  };

  Object.defineProperty(globalThis, 'navigator', {
    value: { onLine: online },
    configurable: true
  });

  return { store, removedScripts, vaCalls };
}

function cleanupMockWindow() {
  delete (globalThis as any).window;
  delete (globalThis as any).document;
}

test('1. Desativado por padrão e recusar bloqueia coleta', () => {
  createMockWindow('mamand.app', true);
  try {
    assert.strictEqual(getAnalyticsConsent(), 'pending');
    assert.strictEqual(shouldEnableVercelAnalytics('pending', { hostname: 'mamand.app', online: true }), false);

    setAnalyticsConsent('denied');
    assert.strictEqual(getAnalyticsConsent(), 'denied');
    assert.strictEqual(shouldEnableVercelAnalytics('denied', { hostname: 'mamand.app', online: true }), false);

    const beforeSend = createAnalyticsBeforeSend(getAnalyticsConsent, () => 'mamand.app', () => true);
    assert.strictEqual(beforeSend({ type: 'pageview', url: 'https://mamand.app/' }), null);
  } finally {
    cleanupMockWindow();
  }
});

test('2. Aceitar habilita apenas em produção online e sanitiza URL', () => {
  createMockWindow('mamand.app', true);
  try {
    setAnalyticsConsent('granted');
    assert.strictEqual(getAnalyticsConsent(), 'granted');
    assert.strictEqual(shouldEnableVercelAnalytics('granted', { hostname: 'mamand.app', online: true }), true);
    assert.strictEqual(shouldEnableVercelAnalytics('granted', { hostname: 'www.mamand.app', online: true }), true);

    const beforeSend = createAnalyticsBeforeSend(getAnalyticsConsent, () => 'mamand.app', () => true);
    const result = beforeSend({
      type: 'pageview',
      url: 'https://mamand.app/privacy?nome=Maria&bebe=123#secao'
    });
    assert.deepStrictEqual(result, {
      type: 'pageview',
      url: 'https://mamand.app/privacy'
    });
    assert.strictEqual(sanitizeAnalyticsUrl('https://mamand.app/?token=abc'), 'https://mamand.app/');
  } finally {
    cleanupMockWindow();
  }
});

test('3. Revogar interrompe novos envios e limpa script em runtime', () => {
  const { removedScripts, vaCalls, store } = createMockWindow('mamand.app', true);
  try {
    setAnalyticsConsent('granted');
    const beforeSend = createAnalyticsBeforeSend(getAnalyticsConsent, () => 'mamand.app', () => true);
    assert.ok(beforeSend({ type: 'pageview', url: 'https://mamand.app/' }) !== null);

    // Revogação posterior
    setAnalyticsConsent('denied');
    assert.strictEqual(store.get(ANALYTICS_CONSENT_STORAGE_KEY), 'denied');
    assert.strictEqual(beforeSend({ type: 'pageview', url: 'https://mamand.app/' }), null);
    assert.ok(removedScripts.includes('/_vercel/insights/script.js'));
    assert.ok(vaCalls.some(([evt]) => evt === 'beforeSend'));

    // Limpeza total de dados locais volta para pending
    clearAnalyticsConsent();
    assert.strictEqual(getAnalyticsConsent(), 'pending');
  } finally {
    cleanupMockWindow();
  }
});

test('4. Não ocorre coleta involuntária no Preview, localhost ou offline', () => {
  assert.strictEqual(isProductionAnalyticsHost('mamand.app'), true);
  assert.strictEqual(isProductionAnalyticsHost('www.mamand.app'), true);
  assert.strictEqual(isProductionAnalyticsHost('amazing-einstein-git-feat-analytics-fase-3a.vercel.app'), false);
  assert.strictEqual(isProductionAnalyticsHost('localhost'), false);

  assert.strictEqual(
    shouldEnableVercelAnalytics('granted', {
      hostname: 'amazing-einstein-git-feat-analytics-fase-3a.vercel.app',
      online: true
    }),
    false
  );
  assert.strictEqual(
    shouldEnableVercelAnalytics('granted', {
      hostname: 'mamand.app',
      online: false
    }),
    false
  );
});

test('5. Integridade da integração: sem eventos customizados, sem cache de /_vercel no sw.js e botões equivalentes', () => {
  const appSrc = fs.readFileSync(path.resolve('src/App.tsx'), 'utf-8');
  const gateSrc = fs.readFileSync(path.resolve('src/components/VercelAnalyticsGate.tsx'), 'utf-8');
  const bannerSrc = fs.readFileSync(path.resolve('src/components/AnalyticsConsentBanner.tsx'), 'utf-8');
  const swSrc = fs.readFileSync(path.resolve('public/sw.js'), 'utf-8');

  assert.ok(!appSrc.includes('track('), 'App.tsx não deve disparar eventos customizados nesta etapa');
  assert.match(gateSrc, /shouldEnableVercelAnalytics/, 'VercelAnalyticsGate deve exigir verificação de consentimento e host');
  assert.match(gateSrc, /if \(!enabled\)\s*\{\s*return null;/, 'Não deve renderizar <Analytics /> antes do consentimento');
  assert.match(bannerSrc, /analytics-consent-decline/, 'Banner deve possuir botão Recusar');
  assert.match(bannerSrc, /analytics-consent-accept/, 'Banner deve possuir botão Aceitar');
  assert.match(swSrc, /\/_vercel/, 'Service Worker deve excluir /_vercel do cache offline');
});
