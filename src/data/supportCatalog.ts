import type { SupportCategory, SupportedLanguage } from '../types/index.ts';

export const SUPPORT_CATEGORIES_PT: SupportCategory[] = [
  {
    id: 'food',
    title: 'Alimentação',
    items: [
      { id: 'food-cook', label: 'Preparar uma refeição' },
      { id: 'food-ready', label: 'Trazer comida pronta' },
      { id: 'food-groceries', label: 'Fazer compras no mercado' },
      { id: 'food-snacks', label: 'Preparar lanches' }
    ]
  },
  {
    id: 'home',
    title: 'Casa',
    items: [
      { id: 'home-dishes', label: 'Lavar a louça' },
      { id: 'home-laundry', label: 'Cuidar das roupas' },
      { id: 'home-tidy', label: 'Organizar a casa' },
      { id: 'home-trash', label: 'Retirar o lixo' },
      { id: 'home-pets', label: 'Cuidar dos animais de estimação' }
    ]
  },
  {
    id: 'practical',
    title: 'Apoio prático',
    items: [
      { id: 'practical-pharmacy', label: 'Buscar algo na farmácia' },
      { id: 'practical-ride', label: 'Oferecer transporte' },
      { id: 'practical-appointment', label: 'Acompanhar em uma consulta' },
      { id: 'practical-errand', label: 'Resolver uma tarefa externa' }
    ]
  },
  {
    id: 'family',
    title: 'Família e bebê',
    items: [
      { id: 'family-siblings', label: 'Ajudar com os filhos mais velhos' },
      { id: 'family-school', label: 'Levar ou buscar uma criança na escola' },
      { id: 'family-baby-items', label: 'Ajudar a organizar os itens do bebê' },
      { id: 'family-rest', label: 'Cuidar de alguma tarefa enquanto a mãe descansa' }
    ]
  },
  {
    id: 'care',
    title: 'Acolhimento',
    items: [
      { id: 'care-company', label: 'Fazer companhia' },
      { id: 'care-talk', label: 'Conversar um pouco' },
      { id: 'care-emotional', label: 'Oferecer apoio emocional' },
      { id: 'care-visits', label: 'Ajudar a organizar visitas' }
    ]
  }
];

export const SUPPORT_CATEGORIES_EN: SupportCategory[] = [
  {
    id: 'food',
    title: 'Meals',
    items: [
      { id: 'food-cook', label: 'Cook a meal' },
      { id: 'food-ready', label: 'Bring a ready-made meal' },
      { id: 'food-groceries', label: 'Do the grocery shopping' },
      { id: 'food-snacks', label: 'Prepare snacks' }
    ]
  },
  {
    id: 'home',
    title: 'Home',
    items: [
      { id: 'home-dishes', label: 'Wash the dishes' },
      { id: 'home-laundry', label: 'Take care of the laundry' },
      { id: 'home-tidy', label: 'Tidy up the house' },
      { id: 'home-trash', label: 'Take out the trash' },
      { id: 'home-pets', label: 'Look after the pets' }
    ]
  },
  {
    id: 'practical',
    title: 'Practical help',
    items: [
      { id: 'practical-pharmacy', label: 'Pick something up at the pharmacy' },
      { id: 'practical-ride', label: 'Offer a ride' },
      { id: 'practical-appointment', label: 'Come along to an appointment' },
      { id: 'practical-errand', label: 'Run an errand' }
    ]
  },
  {
    id: 'family',
    title: 'Family & baby',
    items: [
      { id: 'family-siblings', label: 'Help with the older children' },
      { id: 'family-school', label: 'Take or pick up a child from school' },
      { id: 'family-baby-items', label: "Help organize the baby's things" },
      { id: 'family-rest', label: 'Handle a task while mom rests' }
    ]
  },
  {
    id: 'care',
    title: 'Comfort & company',
    items: [
      { id: 'care-company', label: 'Keep me company' },
      { id: 'care-talk', label: 'Have a little chat' },
      { id: 'care-emotional', label: 'Offer emotional support' },
      { id: 'care-visits', label: 'Help organize visits' }
    ]
  }
];

export const getSupportCategories = (lang: SupportedLanguage = 'pt-BR'): SupportCategory[] => {
  return lang === 'en' ? SUPPORT_CATEGORIES_EN : SUPPORT_CATEGORIES_PT;
};
