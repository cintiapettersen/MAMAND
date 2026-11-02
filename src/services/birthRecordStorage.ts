import type { BirthRecord, UserProfile } from '../types/index.ts';
import { profileStorage } from './profileStorage.ts';

const STORAGE_KEY = 'first1000days_birth_record';

export const birthRecordStorage = {
  getBirthRecord(currentProfile?: UserProfile | null): BirthRecord {
    try {
      const data = typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
      if (data) {
        const parsed: BirthRecord = JSON.parse(data);
        // Se o perfil tiver nome ou data de nascimento e a ficha ainda não tiver, reaproveita
        if (currentProfile) {
          if (!parsed.babyName && currentProfile.babyName) {
            parsed.babyName = currentProfile.babyName;
          }
          if (!parsed.birthDate && currentProfile.birthDate) {
            parsed.birthDate = currentProfile.birthDate;
          }
        }
        return parsed;
      }
    } catch (err) {
      console.warn('Erro ao ler ficha de nascimento do localStorage:', err);
    }

    // Inicialização com valores do perfil se disponíveis
    return {
      babyName: currentProfile?.babyName || '',
      birthDate: currentProfile?.birthDate || '',
      birthTime: '',
      weightGrams: '',
      lengthCm: '',
      headCircumferenceCm: '',
      hospitalName: '',
      city: '',
      country: '',
      deliveryType: '',
      bloodType: '',
      allergies: '',
      healthConditions: '',
      updatedAt: undefined
    };
  },

  hasSavedRecord(): boolean {
    try {
      if (typeof localStorage === 'undefined') return false;
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) return false;
      const parsed: BirthRecord = JSON.parse(data);
      // Considera salvo se tiver pelo menos algum campo preenchido além dos defaults vazios
      return Boolean(
        parsed.babyName ||
        parsed.birthDate ||
        parsed.birthTime ||
        parsed.weightGrams ||
        parsed.lengthCm ||
        parsed.hospitalName ||
        parsed.city ||
        parsed.bloodType ||
        parsed.allergies ||
        parsed.healthConditions
      );
    } catch {
      return false;
    }
  },

  saveBirthRecord(record: BirthRecord, syncWithProfile: boolean = true): void {
    try {
      const recordToSave: BirthRecord = {
        ...record,
        updatedAt: new Date().toISOString()
      };
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(recordToSave));
      }

      // Sincronização automática com UserProfile para manter Home e cálculos de idade alinhados
      if (syncWithProfile) {
        const profile = profileStorage.getProfile();
        if (profile) {
          let hasChanges = false;
          if (record.babyName && record.babyName !== profile.babyName) {
            profile.babyName = record.babyName;
            hasChanges = true;
          }
          if (record.birthDate && record.birthDate !== profile.birthDate) {
            profile.birthDate = record.birthDate;
            hasChanges = true;
          }
          if (hasChanges) {
            profile.updatedAt = new Date().toISOString();
            profileStorage.saveProfile(profile);
          }
        }
      }
    } catch (err) {
      console.error('Erro ao salvar ficha de nascimento:', err);
    }
  },

  clearBirthRecord(): void {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch (err) {
      console.error('Erro ao limpar ficha de nascimento:', err);
    }
  }
};
