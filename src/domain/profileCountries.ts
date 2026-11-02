import type { UserProfile } from '../types/index.ts';
import { toIsoCountry, type IsoCountry } from './countries.ts';

// Os quatro dados independentes do perfil: idioma (preferredLanguage) e três países.
// Perfis antigos têm só `country`, escolhido para os números de emergência: ele vira
// o país de emergência e não é copiado para residência nem acompanhamento.

export interface ProfileCountries {
  residence?: IsoCountry;
  care?: IsoCountry;
  emergency?: IsoCountry;
}

export function getProfileCountries(
  profile: Pick<UserProfile, 'country' | 'residenceCountry' | 'careCountry' | 'emergencyCountry'>
): ProfileCountries {
  const countries: ProfileCountries = {};
  const residence = toIsoCountry(profile.residenceCountry);
  const care = toIsoCountry(profile.careCountry);
  const emergency = toIsoCountry(profile.emergencyCountry) ?? toIsoCountry(profile.country);
  if (residence) countries.residence = residence;
  if (care) countries.care = care;
  if (emergency) countries.emergency = emergency;
  return countries;
}
