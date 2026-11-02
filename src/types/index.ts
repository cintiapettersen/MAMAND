export type UserPhase = 'pregnancy' | 'baby';

export type MainNeed = 
  | 'understand_baby'
  | 'self_care'
  | 'feeding'
  | 'development'
  | 'all';

export type SupportedLanguage = 'pt-BR' | 'en';

export type BloodType = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-' | 'unknown' | '';
export type DeliveryType = 'vaginal' | 'cesarean' | 'forceps' | 'other' | '';

export interface BirthRecord {
  babyName?: string;
  birthDate?: string; // YYYY-MM-DD
  birthTime?: string; // HH:mm
  weightGrams?: number | string; // e.g. 3420 ou 3.420
  lengthCm?: number | string; // e.g. 51
  headCircumferenceCm?: number | string; // e.g. 35
  hospitalName?: string;
  city?: string;
  country?: string;
  deliveryType?: DeliveryType;
  bloodType?: BloodType;
  allergies?: string;
  healthConditions?: string;
  updatedAt?: string;
}

export interface BirthCardSettings {
  showTime: boolean;
  showWeight: boolean;
  showLength: boolean;
  showLocation: boolean;
  showHospital: boolean;
}

export interface UserProfile {
  phase: UserPhase;
  stageValue: number;
  stageLabel: string;
  mainNeed: MainNeed;
  preferredLanguage?: SupportedLanguage;
  displayName?: string;
  // País (ISO 3166-1 alfa-2) escolhido pela usuária, usado só para números de emergência.
  // Campo antigo: lido como país de emergência por src/domain/profileCountries.ts
  country?: string;
  // Arquitetura internacional (etapa 1): países independentes entre si e do idioma.
  // Ainda sem tela; nenhum é deduzido de outro.
  residenceCountry?: string;
  careCountry?: string;
  emergencyCountry?: string;
  babyName?: string;
  birthDate?: string;
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
}

export type RecordSubject = 'baby' | 'mom' | 'memory';

export interface JourneyRecord {
  id: string;
  subject: RecordSubject;
  tags: string[];
  note?: string;
  sourceActivityTitle?: string;
  contentId?: string; // Evita registros duplicados de atividades de Cuidados
  timestamp: string; // ISO string do momento em que o registro foi criado
  eventDate: string; // Data real do acontecimento (permite datas anteriores: YYYY-MM-DD)
  dateLabel: string;
}

export type ActiveTab = 'today' | 'ask' | 'journey' | 'care';

// Tipos para o Catálogo de Conteúdos e Motor de Regras
export type ContentCategory = 
  | 'baby_care'
  | 'mom_care'
  | 'feeding'
  | 'development'
  | 'wellbeing'
  | 'safety_prevention';

// Situação de revisão de um conteúdo de saúde (veja CONTENT.md).
// Citar uma instituição não é revisão clínica: 'clinically_reviewed' exige registro documentado.
export type ContentReviewStatus = 'clinically_reviewed' | 'source_based' | 'pending_review' | 'demonstrative';

export interface ClinicalReviewRecord {
  reviewer: string;
  credential: string;
  date: string;
  reference: string;
}

export interface ContentItem {
  id: string;
  title: string;
  category: ContentCategory;
  categoryLabel: string;
  audience: 'mom' | 'baby' | 'both';
  phase: 'pregnancy' | 'baby' | 'both';
  minStageMonths?: number;
  maxStageMonths?: number;
  theme: string;
  educationalText: string;
  practicalAction?: string;
  tagLabel?: string;
  source: string;
  // Veja ContentReviewStatus: 'source_based' cita publicação identificável e libera só o selo
  // "Baseado em fontes oficiais"; não indica revisão clínica.
  validationStatus: ContentReviewStatus;
  clinicalReview?: ClinicalReviewRecord;
  // Observação interna para a revisão clínica (não aparece na interface)
  reviewNote?: string;
  // Preenchido quando o conteúdo foi retirado da interface até revisão profissional
  suspendedReason?: string;
}

// Tipos para Perguntas Rápidas de Check-in na Home
export type CheckInMood = 'good' | 'neutral' | 'tired' | 'struggling';

export interface CheckInOption {
  id: string;
  label: string;
  feedback: string;
  mood: CheckInMood;
}

export interface CheckInQuestion {
  id: string;
  phase: 'pregnancy' | 'baby' | 'both';
  question: string;
  subtitle: string;
  options: CheckInOption[];
}

// Tipos para Minha Rede de Apoio (pedidos de ajuda compartilháveis)
export type SupportRequestStatus = 'pending' | 'done';

export interface SupportRequest {
  id: string;
  catalogId?: string;
  title: string;
  date?: string;
  time?: string;
  notes?: string;
  status: SupportRequestStatus;
  createdAt: string;
}

export interface SupportCatalogItem {
  id: string;
  label: string;
}

export interface SupportCategory {
  id: string;
  title: string;
  items: SupportCatalogItem[];
}

// Tipos para a Mala da Maternidade (checklist da gestação)
export type MaternityChecklistCategoryId = 'baby' | 'mom' | 'documents' | 'companion';

export interface MaternityChecklistItem {
  id: string;
  label: string;
}

export interface MaternityChecklistCategory {
  id: MaternityChecklistCategoryId;
  title: string;
  items: MaternityChecklistItem[];
}

export interface MaternityChecklistCustomItem {
  id: string;
  category: MaternityChecklistCategoryId;
  label: string;
}

export interface MaternityChecklistState {
  checked: string[];
  custom: MaternityChecklistCustomItem[];
}
