import type { MaternityChecklistState } from '../types/index.ts';

const STORAGE_KEY = 'first1000days_maternity_checklist';

export const maternityChecklistStorage = {
  getState(): MaternityChecklistState {
    try {
      const data = typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
      if (data) {
        const parsed = JSON.parse(data);
        return {
          checked: Array.isArray(parsed.checked) ? parsed.checked : [],
          custom: Array.isArray(parsed.custom) ? parsed.custom : []
        };
      }
    } catch (err) {
      console.warn('Erro ao ler a mala da maternidade do localStorage:', err);
    }
    return { checked: [], custom: [] };
  },

  saveState(state: MaternityChecklistState): void {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      }
    } catch (err) {
      console.error('Erro ao salvar a mala da maternidade:', err);
    }
  }
};
