import { MaternityChecklistCategory, SupportedLanguage } from '../types';

// Lista compacta e internacional: sem documentos ou serviços específicos de um país
export const MATERNITY_CHECKLIST_PT: MaternityChecklistCategory[] = [
  {
    id: 'baby',
    title: 'Para o bebê',
    items: [
      { id: 'baby-outfits', label: 'Roupinhas para 2 ou 3 dias (bodies, macacões, calças)' },
      { id: 'baby-hat-socks', label: 'Touca e meias' },
      { id: 'baby-mittens', label: 'Luvinhas, se fizer frio' },
      { id: 'baby-going-home', label: 'Roupa para a saída da maternidade' },
      { id: 'baby-blanket', label: 'Manta ou cobertor leve' },
      { id: 'baby-diapers', label: 'Fraldas tamanho recém-nascido' },
      { id: 'baby-wipes', label: 'Lenços umedecidos ou algodão' },
      { id: 'baby-cream', label: 'Pomada para assaduras' },
      { id: 'baby-burp-cloths', label: 'Paninhos de boca' },
      { id: 'baby-car-seat', label: 'Cadeirinha para o carro, se for voltar de carro' }
    ]
  },
  {
    id: 'mom',
    title: 'Para você',
    items: [
      { id: 'mom-nightgowns', label: 'Camisolas ou pijamas com abertura na frente' },
      { id: 'mom-underwear', label: 'Calcinhas confortáveis' },
      { id: 'mom-nursing-bras', label: 'Sutiãs de amamentação' },
      { id: 'mom-pads', label: 'Absorventes pós-parto' },
      { id: 'mom-breast-pads', label: 'Absorventes para os seios' },
      { id: 'mom-robe-slippers', label: 'Roupão e chinelo antiderrapante' },
      { id: 'mom-toiletries', label: 'Itens de higiene pessoal' },
      { id: 'mom-going-home', label: 'Roupa confortável para a saída' },
      { id: 'mom-charger', label: 'Carregador de celular com cabo longo' },
      { id: 'mom-snacks', label: 'Lanchinhos e garrafa de água' }
    ]
  },
  {
    id: 'documents',
    title: 'Documentos',
    items: [
      { id: 'doc-id', label: 'Documento de identidade com foto' },
      { id: 'doc-insurance', label: 'Cartão do plano ou do sistema de saúde' },
      { id: 'doc-prenatal', label: 'Registro ou caderneta do pré-natal' },
      { id: 'doc-exams', label: 'Exames e ultrassons recentes' },
      { id: 'doc-birth-plan', label: 'Plano de parto, se você tiver' },
      { id: 'doc-hospital', label: 'Documentos que a maternidade pedir' }
    ]
  },
  {
    id: 'companion',
    title: 'Para quem vai te acompanhar',
    items: [
      { id: 'comp-clothes', label: 'Muda de roupa' },
      { id: 'comp-toiletries', label: 'Itens de higiene pessoal' },
      { id: 'comp-charger', label: 'Carregador de celular' },
      { id: 'comp-snacks', label: 'Lanches e água' },
      { id: 'comp-sweater', label: 'Um agasalho leve' }
    ]
  }
];

export const MATERNITY_CHECKLIST_EN: MaternityChecklistCategory[] = [
  {
    id: 'baby',
    title: 'For the baby',
    items: [
      { id: 'baby-outfits', label: 'Outfits for 2 or 3 days (bodysuits, sleepsuits, pants)' },
      { id: 'baby-hat-socks', label: 'Hat and socks' },
      { id: 'baby-mittens', label: 'Mittens, if it is cold' },
      { id: 'baby-going-home', label: 'Going-home outfit' },
      { id: 'baby-blanket', label: 'Swaddle or light blanket' },
      { id: 'baby-diapers', label: 'Newborn diapers' },
      { id: 'baby-wipes', label: 'Wipes or cotton pads' },
      { id: 'baby-cream', label: 'Diaper rash cream' },
      { id: 'baby-burp-cloths', label: 'Burp cloths' },
      { id: 'baby-car-seat', label: 'Infant car seat, if going home by car' }
    ]
  },
  {
    id: 'mom',
    title: 'For you',
    items: [
      { id: 'mom-nightgowns', label: 'Front-opening nightgowns or pajamas' },
      { id: 'mom-underwear', label: 'Comfortable underwear' },
      { id: 'mom-nursing-bras', label: 'Nursing bras' },
      { id: 'mom-pads', label: 'Postpartum pads' },
      { id: 'mom-breast-pads', label: 'Breast pads' },
      { id: 'mom-robe-slippers', label: 'Robe and non-slip slippers' },
      { id: 'mom-toiletries', label: 'Toiletries' },
      { id: 'mom-going-home', label: 'Comfortable going-home outfit' },
      { id: 'mom-charger', label: 'Phone charger with a long cable' },
      { id: 'mom-snacks', label: 'Snacks and a water bottle' }
    ]
  },
  {
    id: 'documents',
    title: 'Documents',
    items: [
      { id: 'doc-id', label: 'Photo ID' },
      { id: 'doc-insurance', label: 'Health insurance or health system card' },
      { id: 'doc-prenatal', label: 'Prenatal record or booklet' },
      { id: 'doc-exams', label: 'Recent tests and ultrasounds' },
      { id: 'doc-birth-plan', label: 'Birth plan, if you have one' },
      { id: 'doc-hospital', label: 'Any documents your hospital requires' }
    ]
  },
  {
    id: 'companion',
    title: 'For your birth partner',
    items: [
      { id: 'comp-clothes', label: 'Change of clothes' },
      { id: 'comp-toiletries', label: 'Toiletries' },
      { id: 'comp-charger', label: 'Phone charger' },
      { id: 'comp-snacks', label: 'Snacks and water' },
      { id: 'comp-sweater', label: 'A light sweater' }
    ]
  }
];

export const getMaternityChecklist = (lang: SupportedLanguage = 'pt-BR'): MaternityChecklistCategory[] => {
  return lang === 'en' ? MATERNITY_CHECKLIST_EN : MATERNITY_CHECKLIST_PT;
};
