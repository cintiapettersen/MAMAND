import { APP_CONFIG } from '../constants/appConfig.ts';
import { indexedDbService } from './indexedDbService.ts';

/**
 * Lista explícita de todas as chaves de localStorage pertencentes ao MAMAND.
 * Nunca utiliza localStorage.clear() para não afetar dados de outras aplicações
 * que eventualmente compartilhem a mesma origem.
 */
export const MAMAND_LOCAL_STORAGE_KEYS = [
  APP_CONFIG.STORAGE_KEYS.DEMO_PROFILE, // p1000_demo_profile_v1
  'first1000days_birth_record',         // Ficha de nascimento do bebê
  'first1000days_support_requests',     // Lista da rede de apoio
  'first1000days_maternity_checklist',  // Mala da maternidade
  'first1000days_rest_timer',           // Temporizador de descanso / autocuidado
  'first1000days_daily_card',           // Estado de visualização do card diário
  'p1000_viewed_content_ids_v1',        // Conteúdos educativos visualizados
  'p1000_journey_records_v1',           // Armazenamento legado de jornada
  'first_1000_days_lang',               // Preferência de idioma
  'mamand_analytics_consent_v1'         // Preferência de consentimento de estatísticas
] as const;

export interface WipeLocalDataResult {
  removedKeys: string[];
  indexedDbCleared: boolean;
  errors: string[];
}

/**
 * Apaga todos os dados pessoais e estados locais do MAMAND neste aparelho,
 * preservando chaves de outras aplicações no localStorage e os caches estáticos
 * do Service Worker necessários para o funcionamento offline.
 */
export async function wipeAllMamandLocalData(
  storage: Pick<Storage, 'removeItem' | 'getItem'> | undefined =
    typeof localStorage !== 'undefined' ? localStorage : undefined,
  clearIndexedDb: () => Promise<void> = () => indexedDbService.clearAllRecords()
): Promise<WipeLocalDataResult> {
  const removedKeys: string[] = [];
  const errors: string[] = [];
  let indexedDbCleared = false;

  if (storage) {
    for (const key of MAMAND_LOCAL_STORAGE_KEYS) {
      try {
        const existed = storage.getItem(key) !== null;
        storage.removeItem(key);
        if (existed) {
          removedKeys.push(key);
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        errors.push(`Erro ao remover chave "${key}": ${msg}`);
      }
    }
  }

  try {
    await clearIndexedDb();
    indexedDbCleared = true;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    errors.push(`Erro ao limpar IndexedDB: ${msg}`);
  }

  return {
    removedKeys,
    indexedDbCleared,
    errors
  };
}
