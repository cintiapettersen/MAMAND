// Convite discreto para perfis sem país de acompanhamento. Pode ser adiado ("Agora não",
// volta depois de 30 dias) ou dispensado de vez. Fica só neste aparelho.

const STORAGE_KEY = 'mamand_care_country_prompt_v1';
const SNOOZE_DAYS = 30;

interface PromptState {
  dismissed?: boolean;
  snoozedUntil?: string;
}

function read(): PromptState {
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
    const parsed = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function write(state: PromptState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Sem armazenamento: o convite só volta a aparecer, sem outro efeito
  }
}

export const careCountryPrompt = {
  shouldShow(hasCareCountry: boolean, now = new Date()): boolean {
    if (hasCareCountry) return false;
    const state = read();
    if (state.dismissed) return false;
    if (state.snoozedUntil && new Date(state.snoozedUntil).getTime() > now.getTime()) return false;
    return true;
  },
  snooze(now = new Date()): void {
    const until = new Date(now.getTime() + SNOOZE_DAYS * 86400000);
    write({ snoozedUntil: until.toISOString() });
  },
  dismiss(): void {
    write({ dismissed: true });
  }
};
