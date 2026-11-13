import type { SupportRequest } from '../types/index.ts';

const STORAGE_KEY = 'first1000days_support_requests';

export const supportNetworkStorage = {
  getRequests(): SupportRequest[] {
    try {
      const data = typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
      if (data) {
        const parsed = JSON.parse(data);
        return Array.isArray(parsed) ? parsed : [];
      }
    } catch (err) {
      console.warn('Erro ao ler a rede de apoio do localStorage:', err);
    }
    return [];
  },

  saveRequests(requests: SupportRequest[]): void {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(requests));
      }
    } catch (err) {
      console.error('Erro ao salvar a rede de apoio:', err);
    }
  }
};
