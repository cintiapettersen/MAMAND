import type { SupportedLang } from '../serverTypes.ts';

export interface CreditLicenseEntry {
  name: string;
  version?: string;
  license: string;
  holder: string;
  noticePath: string;
}

export interface CreditsDocument {
  lang: SupportedLang;
  badge: string;
  title: string;
  subtitle: string;
  backLabel: string;
  privacyLinkLabel: string;
  copyBtnLabel: string;
  copiedBtnLabel: string;
  overviewTitle: string;
  overviewParagraphs: string[];
  governanceTitle: string;
  governanceItems: { label: string; value: string }[];
  softwareLicenseTitle: string;
  softwareLicenseParagraphs: string[];
  proposedContentTitle: string;
  proposedStatusBadge: string;
  proposedStatusNotice: string;
  proposedScopeIntro: string;
  proposedFiles: { path: string; description: string }[];
  uiTextsNote: string;
  declarationTitle: string;
  declarationFields: { label: string; value: string }[];
  reuseClarification: string;
  attributionExampleLabel: string;
  attributionExamplePt: string;
  attributionExampleEn: string;
  exclusionsTitle: string;
  exclusionsIntro: string;
  exclusionsList: { category: string; detail: string }[];
  thirdPartyTitle: string;
  thirdPartyIntro: string;
  thirdPartyLibraries: CreditLicenseEntry[];
  thirdPartyFonts: CreditLicenseEntry[];
  sourcesNoteTitle: string;
  sourcesNoteText: string;
}

const ATTRIBUTION_EXAMPLE_PT =
  'Conteúdo original de MAMAND, por Cintia Pettersen (https://mamand.app/credits). Licença proposta: CC BY 4.0 (https://creativecommons.org/licenses/by/4.0/). Alterações: [descrever modificações, se houver].';

const ATTRIBUTION_EXAMPLE_EN =
  'Original content from MAMAND, by Cintia Pettersen (https://mamand.app/credits). Proposed license: CC BY 4.0 (https://creativecommons.org/licenses/by/4.0/). Changes: [describe modifications, if any].';

const THIRD_PARTY_LIBRARIES: CreditLicenseEntry[] = [
  {
    name: 'React',
    version: '18.3.1',
    license: 'MIT',
    holder: 'Facebook, Inc. and its affiliates (Meta)',
    noticePath: '/licenses/react.txt'
  },
  {
    name: 'React DOM',
    version: '18.3.1',
    license: 'MIT',
    holder: 'Facebook, Inc. and its affiliates (Meta)',
    noticePath: '/licenses/react-dom.txt'
  },
  {
    name: 'scheduler',
    version: '0.23.2',
    license: 'MIT',
    holder: 'Facebook, Inc. and its affiliates (Meta)',
    noticePath: '/licenses/scheduler.txt'
  },
  {
    name: 'Lucide (lucide-react)',
    version: '0.460.0',
    license: 'ISC (Feather icons: MIT)',
    holder: 'Lucide Contributors; Cole Bemis',
    noticePath: '/licenses/lucide-react.txt'
  },
  {
    name: '@vercel/analytics',
    version: '2.0.1',
    license: 'MIT',
    holder: 'Vercel, Inc.',
    noticePath: '/licenses/vercel-analytics.txt'
  }
];

const THIRD_PARTY_FONTS: CreditLicenseEntry[] = [
  {
    name: 'Nunito (@fontsource/nunito)',
    version: '5.3.0',
    license: 'SIL Open Font License 1.1',
    holder: 'The Nunito Project Authors',
    noticePath: '/licenses/font-nunito.txt'
  },
  {
    name: 'Plus Jakarta Sans (@fontsource/plus-jakarta-sans)',
    version: '5.3.0',
    license: 'SIL Open Font License 1.1',
    holder: 'The Plus Jakarta Sans Project Authors',
    noticePath: '/licenses/font-plus-jakarta-sans.txt'
  },
  {
    name: 'Fraunces (@fontsource-variable/fraunces)',
    version: '5.3.0',
    license: 'SIL Open Font License 1.1',
    holder: 'The Fraunces Project Authors',
    noticePath: '/licenses/font-fraunces.txt'
  }
];

export const CREDITS_DOC_PT: CreditsDocument = {
  lang: 'pt-BR',
  badge: 'Transparência e Licenças',
  title: 'Créditos e Licenciamento',
  subtitle:
    'Estrutura pública de autoria, governança, licenças de software, proposta de licenciamento de conteúdos originais e avisos de terceiros do MAMAND.',
  backLabel: 'Voltar ao aplicativo',
  privacyLinkLabel: 'Política de Privacidade',
  copyBtnLabel: 'Copiar exemplo',
  copiedBtnLabel: 'Copiado',
  overviewTitle: '1. O projeto MAMAND',
  overviewParagraphs: [
    'O MAMAND é um projeto de software aberto educativo e de registro pessoal de apoio à maternidade e aos primeiros 1.000 dias (da gestação aos dois anos de vida), desenhado para funcionar offline-first e sem necessidade de conta.',
    'O aplicativo público não realiza diagnóstico, prescrição ou triagem clínica e mantém conteúdos clínicos sem revisão profissional bloqueados na interface pública.'
  ],
  governanceTitle: '2. Autoria, titularidade e vínculo institucional',
  governanceItems: [
    {
      label: 'Criadora e titular dos direitos autorais originais',
      value:
        'Cintia Pettersen (pessoa física, residente na Noruega). O projeto foi concebido, desenvolvido e custeado por iniciativa pessoal da fundadora, que detém os direitos autorais originais (Copyright 2026 Cintia Pettersen), sem cessão formal de propriedade intelectual.'
    },
    {
      label: 'Entidade institucional vinculada',
      value:
        'CREATIVE DESIGN PETTERSEN LTDA (CNPJ 24.325.181/0001-94). Mantém vínculo institucional com o projeto e figura como entidade proponente da candidatura ao UNICEF FemTech Ventures 2026, sem deter a titularidade de propriedade intelectual do aplicativo.'
    },
    {
      label: 'Alinhamento documental',
      value:
        'As informações desta página seguem README.md, NOTICE, CONTENT.md, TRADEMARKS.md e THIRD_PARTY_NOTICES.md do repositório.'
    }
  ],
  softwareLicenseTitle: '3. Licença do código-fonte (Apache License 2.0)',
  softwareLicenseParagraphs: [
    'O código-fonte original do MAMAND é distribuído sob a Apache License 2.0 (arquivo LICENSE), preservando a atribuição histórica em NOTICE referente aos arquivos iniciais de documentação (commit dac145c, outubro de 2026, publicados originalmente sob licença MIT).',
    'Os textos gerais de interface do aplicativo (src/locales/pt-BR.ts e src/locales/en.ts) permanecem sob a Apache License 2.0 nesta etapa.'
  ],
  proposedContentTitle: '4. Proposta de licenciamento para conteúdos originais (CC BY 4.0)',
  proposedStatusBadge: 'Licença proposta — ainda não vigente',
  proposedStatusNotice:
    'A licença Creative Commons Atribuição 4.0 Internacional (CC BY 4.0) apresentada abaixo é apenas uma proposta em preparação para aprovação expressa da titular (pendências internas J3 e T1). Ela NÃO está ativa nesta etapa, não substitui os avisos de copyright vigentes (Copyright 2026 Cintia Pettersen) e não concede novos direitos ao público até confirmação formal.',
  proposedScopeIntro:
    'Caso aprovada formalmente pela titular, a CC BY 4.0 se aplicará exclusivamente aos conteúdos originais não clínicos dos quatro arquivos abaixo:',
  proposedFiles: [
    {
      path: 'src/data/dailyCards.ts',
      description: 'Cartas diárias de acolhimento, autocuidado e perspectiva.'
    },
    {
      path: 'src/data/supportCatalog.ts',
      description: 'Lista de apoio prático da rede de apoio e modelo de carta.'
    },
    {
      path: 'src/data/maternityChecklist.ts',
      description: 'Lista internacional de itens da mala da maternidade.'
    },
    {
      path: 'src/data/checkins.ts',
      description: 'Perguntas e retornos de check-in emocional diário.'
    }
  ],
  uiTextsNote:
    'Nota: os textos gerais da interface (src/locales/pt-BR.ts e src/locales/en.ts) não fazem parte desta proposta e continuam regidos pela Apache License 2.0.',
  declarationTitle: 'Declaração proposta para eventual adoção de CC BY 4.0',
  declarationFields: [
    { label: 'Autora e titular', value: 'Cintia Pettersen' },
    { label: 'Projeto de origem', value: 'MAMAND' },
    { label: 'Endereço de origem', value: 'https://mamand.app/credits' },
    {
      label: 'Licença proposta',
      value: 'Creative Commons Attribution 4.0 International (CC BY 4.0)'
    },
    {
      label: 'Obrigações previstas',
      value:
        'Atribuir o crédito à autora, preservar as informações de origem e o link para a licença quando razoavelmente possível, e indicar claramente quaisquer modificações realizadas.'
    }
  ],
  reuseClarification:
    'Uma vez ativada pela titular, a licença CC BY 4.0 permitirá reutilização e adaptação, inclusive para fins comerciais, sem obrigar terceiros a promover, divulgar ou recomendar o MAMAND e sem sugerir endosso da autora às adaptações.',
  attributionExampleLabel: 'Exemplo de atribuição (para uso após eventual ativação):',
  attributionExamplePt: ATTRIBUTION_EXAMPLE_PT,
  attributionExampleEn: ATTRIBUTION_EXAMPLE_EN,
  exclusionsTitle: '5. Distinção e exclusões (fora da proposta CC BY 4.0)',
  exclusionsIntro:
    'Para proteção jurídica, clínica e de marca, os elementos abaixo NÃO integram a proposta CC BY 4.0:',
  exclusionsList: [
    {
      category: 'Marca, nome e símbolos identificadores (TRADEMARKS.md)',
      detail:
        'O nome MAMAND, o logotipo, os ícones em public/ e o desenho vetorial da tela de abertura (SplashScreen.tsx). A marca ainda não possui registro formal (pendências J1/J2) e nenhuma licença aberta concede direitos sobre ela.'
    },
    {
      category: 'Política de Privacidade',
      detail:
        'Os textos jurídicos e operacionais em src/data/privacyPolicyData.ts e public/privacy.html permanecem vinculados exclusivamente à operação do aplicativo.'
    },
    {
      category: 'Conteúdos clínicos em revisão e diretrizes externas (pendência J4)',
      detail:
        'Metadados de src/data/contents.ts e rascunhos clínicos experimentais (anteriormente em src/data/evidenceCatalog.ts, gateway/src/data/evidenceCatalog.ts e research/clinical-knowledge/), migrados para repositório privado de pesquisa, bloqueados no aplicativo público e sujeitos à análise jurídica J4 sobre diretrizes externas.'
    },
    {
      category: 'Componentes, fontes e materiais de terceiros',
      detail:
        'Bibliotecas, fontes tipográficas auto-hospedadas e publicações de instituições externas citadas apenas como referência bibliográfica.'
    }
  ],
  thirdPartyTitle: '6. Créditos e licenças de terceiros',
  thirdPartyIntro:
    'Todos os componentes e fontes abaixo são empacotados localmente no aplicativo, sem requisições a servidores externos de fontes (zero Google Fonts). Os textos completos das licenças ficam disponíveis em public/licenses/:',
  thirdPartyLibraries: THIRD_PARTY_LIBRARIES,
  thirdPartyFonts: THIRD_PARTY_FONTS,
  sourcesNoteTitle: 'Fontes institucionais citadas',
  sourcesNoteText:
    'Referências bibliográficas a instituições como Ministério da Saúde do Brasil, OMS/WHO, OPAS/PAHO, UNICEF, SBP, FEBRASGO, AAP, ACOG, AASM, CDC, NHS, Cruz Vermelha, ERC, Cartão de Cor das Fezes e Contran aparecem apenas para identificar a origem informativa de temas em análise e não indicam parceria, validação clínica ou endosso.'
};

export const CREDITS_DOC_EN: CreditsDocument = {
  lang: 'en',
  badge: 'Transparency & Licensing',
  title: 'Credits & Licensing',
  subtitle:
    'Public authorship, governance, software licensing, proposed original-content licensing, and third-party notices for MAMAND.',
  backLabel: 'Back to app',
  privacyLinkLabel: 'Privacy Policy',
  copyBtnLabel: 'Copy example',
  copiedBtnLabel: 'Copied',
  overviewTitle: '1. About the MAMAND project',
  overviewParagraphs: [
    'MAMAND is an open-source educational and personal record-keeping web application supporting maternity and the first 1,000 days (from pregnancy to age two), designed to work offline-first with no account required.',
    'The public application does not provide medical diagnosis, prescriptions, or clinical triage, and keeps unreviewed clinical guidance locked out of the public interface.'
  ],
  governanceTitle: '2. Authorship, ownership, and institutional affiliation',
  governanceItems: [
    {
      label: 'Creator and original copyright holder',
      value:
        'Cintia Pettersen (natural person, resident in Norway). MAMAND was conceived, developed, and funded as a personal initiative by the founder, who holds the original copyright (Copyright 2026 Cintia Pettersen) with no formal assignment of intellectual property.'
    },
    {
      label: 'Institutionally affiliated entity',
      value:
        'CREATIVE DESIGN PETTERSEN LTDA (CNPJ 24.325.181/0001-94). Maintains an institutional affiliation with the project and serves as the applicant entity for UNICEF FemTech Ventures 2026, without holding intellectual property ownership of the application.'
    },
    {
      label: 'Documentary consistency',
      value:
        'This page is aligned with README.md, NOTICE, CONTENT.md, TRADEMARKS.md, and THIRD_PARTY_NOTICES.md in the repository.'
    }
  ],
  softwareLicenseTitle: '3. Source code license (Apache License 2.0)',
  softwareLicenseParagraphs: [
    'MAMAND original source code is licensed under the Apache License 2.0 (LICENSE), preserving historical attribution in NOTICE for the initial documentation files (commit dac145c, October 2026, originally published under the MIT License).',
    'General user interface strings (src/locales/pt-BR.ts and src/locales/en.ts) remain under the Apache License 2.0 at this stage.'
  ],
  proposedContentTitle: '4. Proposed original-content license (CC BY 4.0)',
  proposedStatusBadge: 'Proposed license — not yet in force',
  proposedStatusNotice:
    'The Creative Commons Attribution 4.0 International (CC BY 4.0) license described below is a proposal prepared for express approval by the rights holder (internal pending items J3 and T1). It is NOT active at this stage, does not replace current copyright notices (Copyright 2026 Cintia Pettersen), and grants no new public rights until formal confirmation.',
  proposedScopeIntro:
    'If formally approved by the rights holder, CC BY 4.0 would apply exclusively to the non-clinical original texts in the four files below:',
  proposedFiles: [
    {
      path: 'src/data/dailyCards.ts',
      description: 'Daily supportive, self-care, humor, and perspective cards.'
    },
    {
      path: 'src/data/supportCatalog.ts',
      description: 'Practical support-network items and support letter template.'
    },
    {
      path: 'src/data/maternityChecklist.ts',
      description: 'International maternity bag checklist.'
    },
    {
      path: 'src/data/checkins.ts',
      description: 'Daily emotional check-in prompts and feedback.'
    }
  ],
  uiTextsNote:
    'Note: general interface strings (src/locales/pt-BR.ts and src/locales/en.ts) are excluded from this proposal and remain governed by the Apache License 2.0.',
  declarationTitle: 'Proposed declaration for eventual CC BY 4.0 adoption',
  declarationFields: [
    { label: 'Author and rights holder', value: 'Cintia Pettersen' },
    { label: 'Source project', value: 'MAMAND' },
    { label: 'Source URL', value: 'https://mamand.app/credits' },
    {
      label: 'Proposed license',
      value: 'Creative Commons Attribution 4.0 International (CC BY 4.0)'
    },
    {
      label: 'Planned obligations',
      value:
        'Give appropriate credit to the author, preserve source information and a link to the license when reasonably possible, and indicate if changes were made.'
    }
  ],
  reuseClarification:
    'Once activated by the rights holder, CC BY 4.0 will allow reuse and adaptation, including for commercial purposes, without obligating third parties to promote or recommend MAMAND and without implying author endorsement.',
  attributionExampleLabel: 'Attribution example (for use after eventual activation):',
  attributionExamplePt: ATTRIBUTION_EXAMPLE_PT,
  attributionExampleEn: ATTRIBUTION_EXAMPLE_EN,
  exclusionsTitle: '5. Distinction and exclusions (outside the CC BY 4.0 proposal)',
  exclusionsIntro:
    'For legal, clinical, and trademark protection, the following materials are NOT part of the CC BY 4.0 proposal:',
  exclusionsList: [
    {
      category: 'Trademarks, name, and brand symbols (TRADEMARKS.md)',
      detail:
        'The MAMAND name, wordmark, app icons in public/, and the splash screen vector (SplashScreen.tsx). The trademark is not yet formally registered (J1/J2), and no open license grants trademark rights.'
    },
    {
      category: 'Privacy Policy',
      detail:
        'Legal and operational texts in src/data/privacyPolicyData.ts and public/privacy.html remain specific to operating the app.'
    },
    {
      category: 'Clinical content under review & external guidelines (pending J4)',
      detail:
        'Metadata in src/data/contents.ts and experimental clinical drafts (formerly in src/data/evidenceCatalog.ts, gateway/src/data/evidenceCatalog.ts, and research/clinical-knowledge/), migrated to a private research repository, blocked from the public app, and subject to legal review J4 regarding external guidelines.'
    },
    {
      category: 'Third-party components, fonts, and protected materials',
      detail:
        'Third-party libraries, self-hosted typefaces, and external institutional publications cited solely as bibliographic references.'
    }
  ],
  thirdPartyTitle: '6. Third-party credits and licenses',
  thirdPartyIntro:
    'All components and fonts below are bundled or self-hosted locally in the app with zero external font requests (no Google Fonts). Full license texts are published under public/licenses/:',
  thirdPartyLibraries: THIRD_PARTY_LIBRARIES,
  thirdPartyFonts: THIRD_PARTY_FONTS,
  sourcesNoteTitle: 'Cited external institutions',
  sourcesNoteText:
    'Bibliographic references to institutions such as the Brazilian Ministry of Health, WHO/OMS, PAHO/OPAS, UNICEF, SBP, FEBRASGO, AAP, ACOG, AASM, CDC, NHS, Red Cross, ERC, Infant Stool Colour Card, and Contran serve solely to identify informational origins under review and do not imply partnership, clinical validation, or endorsement.'
};
