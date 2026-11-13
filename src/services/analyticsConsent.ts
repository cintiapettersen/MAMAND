import type { BeforeSend, BeforeSendEvent } from '@vercel/analytics/react';

export type AnalyticsConsentState = 'pending' | 'granted' | 'denied';

export const ANALYTICS_CONSENT_STORAGE_KEY = 'mamand_analytics_consent_v1';

const PRODUCTION_ANALYTICS_HOSTS = new Set(['mamand.app', 'www.mamand.app']);

/**
 * Lê o estado atual de consentimento de estatísticas no localStorage.
 * Por padrão retorna 'pending' (analytics desativado até consentimento afirmativo).
 */
export function getAnalyticsConsent(): AnalyticsConsentState {
  if (typeof window === 'undefined') return 'pending';
  try {
    const raw = window.localStorage.getItem(ANALYTICS_CONSENT_STORAGE_KEY);
    if (raw === 'granted' || raw === 'denied') {
      return raw;
    }
    return 'pending';
  } catch {
    return 'pending';
  }
}

/**
 * Persiste a escolha da usuária ('granted' ou 'denied') e desativa o runtime imediatamente se recusado.
 */
export function setAnalyticsConsent(decision: 'granted' | 'denied'): AnalyticsConsentState {
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(ANALYTICS_CONSENT_STORAGE_KEY, decision);
    } catch {
      // Ignora erro de storage indisponível
    }
  }
  if (decision === 'denied') {
    disableAnalyticsRuntime();
  }
  return decision;
}

/**
 * Remove a preferência salva (usado na exclusão total de dados locais) e interrompe o runtime.
 */
export function clearAnalyticsConsent(): void {
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.removeItem(ANALYTICS_CONSENT_STORAGE_KEY);
    } catch {
      // Ignora erro de storage indisponível
    }
  }
  disableAnalyticsRuntime();
}

/**
 * Garante que apenas o domínio oficial de produção dispare coleta,
 * evitando coleta involuntária em ambientes de Preview (*.vercel.app) ou localhost.
 */
export function isProductionAnalyticsHost(hostname?: string): boolean {
  const host =
    hostname ?? (typeof window !== 'undefined' ? window.location.hostname : '');
  return PRODUCTION_ANALYTICS_HOSTS.has(host.toLowerCase());
}

/**
 * Condição única de ativação do Vercel Web Analytics:
 * consentimento afirmativo + host oficial de produção + navegador online.
 */
export function shouldEnableVercelAnalytics(
  consent: AnalyticsConsentState,
  options?: { hostname?: string; online?: boolean }
): boolean {
  if (consent !== 'granted') return false;
  if (!isProductionAnalyticsHost(options?.hostname)) return false;
  const isOnline =
    options?.online ??
    (typeof navigator !== 'undefined' ? navigator.onLine !== false : true);
  return isOnline;
}

/**
 * Remove query strings e fragmentos de URL para impedir que parâmetros acidentais
 * ou rotas internas sejam enviados nas visualizações agregadas.
 */
export function sanitizeAnalyticsUrl(rawUrl: string): string {
  try {
    const parsed = new URL(rawUrl, 'https://mamand.app');
    return `${parsed.origin}${parsed.pathname}`;
  } catch {
    return '/';
  }
}

/**
 * Interrompe novos envios e remove o script injetado caso a usuária revogue o consentimento.
 */
export function disableAnalyticsRuntime(): void {
  if (typeof window === 'undefined') return;
  try {
    if (typeof window.va === 'function') {
      window.va('beforeSend', () => null);
    }
    window.vaq = [];
    if (typeof document !== 'undefined') {
      const scripts = document.head.querySelectorAll(
        'script[src*="/_vercel/insights/script"], script[src*="va.vercel-scripts.com"]'
      );
      scripts.forEach((el) => el.remove());
    }
  } catch {
    // Falha silenciosa para preservar estabilidade da UI
  }
}

/**
 * Filtro beforeSend aplicado a todo evento do Vercel Web Analytics:
 * bloqueia envios sem consentimento ou fora de produção e sanitiza a URL.
 */
export function createAnalyticsBeforeSend(
  getConsent: () => AnalyticsConsentState = getAnalyticsConsent,
  getHostname?: () => string,
  getOnline?: () => boolean
): BeforeSend {
  return (event: BeforeSendEvent): BeforeSendEvent | null => {
    const allowed = shouldEnableVercelAnalytics(getConsent(), {
      hostname: getHostname?.(),
      online: getOnline?.()
    });
    if (!allowed) {
      return null;
    }
    return {
      ...event,
      url: sanitizeAnalyticsUrl(event.url)
    };
  };
}
