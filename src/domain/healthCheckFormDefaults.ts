import type { UserProfile } from '../types/index.ts';
import { calculateDaysOfLife } from '../utils/dateUtils.ts';
import type { HealthCheckKind, HealthCheckPhase, HealthCheckSubject } from './healthChecks.ts';

// Sugestões iniciais do formulário de "Exames e triagens", só para poupar cliques; a família
// pode trocar tudo. Nenhuma delas diz quando um exame deve ser feito.

// Período do bebê pela idade: data de nascimento quando houver, senão a faixa do perfil
export const defaultPhase = (
  subject: HealthCheckSubject,
  profile: Pick<UserProfile, 'phase' | 'stageValue' | 'birthDate'>,
  today = new Date()
): HealthCheckPhase => {
  if (subject === 'pregnant_person') return profile.phase === 'pregnancy' ? 'pregnancy' : 'postpartum';
  if (profile.phase !== 'baby') return 'newborn';
  if (profile.birthDate) {
    const days = calculateDaysOfLife(profile.birthDate, today);
    return days <= 28 ? 'newborn' : days < 365 ? 'infant' : 'toddler';
  }
  if (profile.stageValue === 0) return 'newborn';
  return profile.stageValue <= 12 ? 'infant' : 'toddler';
};

// "Triagem neonatal" é, por definição, do primeiro mês de vida: enquanto a família não
// escolhe o período, ele acompanha esse tipo
export const phaseForKind = (kind: HealthCheckKind, fallback: HealthCheckPhase): HealthCheckPhase =>
  kind === 'newborn_screening' ? 'newborn' : fallback;

// Tipo sugerido: triagem neonatal no primeiro mês; depois, exame do bebê
export const defaultKind = (subject: HealthCheckSubject, phase: HealthCheckPhase): HealthCheckKind =>
  subject === 'pregnant_person' ? 'prenatal_test' : phase === 'newborn' ? 'newborn_screening' : 'child_test';
