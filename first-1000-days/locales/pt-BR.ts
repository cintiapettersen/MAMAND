import type { TranslationDictionary } from './types.ts';

export const ptBR: TranslationDictionary = {
  app: {
    name: 'Primeiros 1.000 Dias',
    tagline: 'Seu companheiro de cuidado, apoio e orientação',
    subtitle: 'Da gestação aos dois anos de vida'
  },
  nav: {
    today: 'Hoje',
    ask: 'Pergunte',
    journey: 'Jornada',
    care: 'Cuidados'
  },
  header: {
    changePhaseTitle: 'Editar perfil ou alterar fase',
    changePhaseAria: 'Editar perfil',
    editBtn: 'Editar'
  },
  onboarding: {
    welcomeBadge: 'Boas-vindas',
    stageBadge: 'Etapa',
    focusBadge: 'Foco inicial',
    step1Title: 'Em qual momento você está agora?',
    step1Subtitle: 'Queremos oferecer orientações no momento certo, sem complicar o seu dia.',
    phasePregnancyTitle: 'Estou grávida',
    phasePregnancyDesc: 'Acompanhamento trimestre a trimestre, autocuidado e preparação.',
    phaseBabyTitle: 'Meu bebê já nasceu',
    phaseBabyDesc: 'Cuidados diários, desenvolvimento, amamentação e rotina nos primeiros anos.',
    step2Title: 'Em qual semana ou mês vocês estão?',
    step2Subtitle: 'Isso nos ajuda a calibrar o conteúdo de acordo com cada fase de desenvolvimento.',
    pregnancyStages: [
      { value: 12, label: 'Início da gestação (até 13 semanas)' },
      { value: 24, label: 'Meio da gestação (14 a 27 semanas)' },
      { value: 36, label: 'Reta final (28 a 40 semanas ou mais)' }
    ],
    babyStages: [
      { value: 0, label: 'Recém-nascido (primeiro mês)' },
      { value: 2, label: 'Bebê de 2 a 3 meses' },
      { value: 6, label: 'Bebê de 4 a 6 meses' },
      { value: 12, label: 'Bebê de 7 a 12 meses' },
      { value: 24, label: 'Criança de 1 a 2 anos' }
    ],
    optionalBabyNameLabel: 'Nome do bebê (opcional)',
    optionalBabyNamePlaceholder: 'Como podemos chamar o bebê?',
    optionalBirthDateLabel: 'Data de nascimento (opcional)',
    optionalDueDateLabel: 'Data prevista do parto (DPP, opcional)',
    optionalExactAgeHint: 'Calcula automaticamente a idade exata e os dias de vida',
    step3Title: 'O que mais precisa de atenção hoje?',
    step3Subtitle: 'Você pode mudar isso a qualquer momento. Suas orientações diárias serão personalizadas com base nesta escolha.',
    needs: {
      understand_baby: {
        title: 'Entender o bebê',
        subtitle: 'Choro, sono, sinais e rotinas do dia a dia'
      },
      self_care: {
        title: 'Cuidar de mim',
        subtitle: 'Descanso, emoções, autocuidado e apoio materno'
      },
      feeding: {
        title: 'Amamentação e Alimentação',
        subtitle: 'Pega, livre demanda, introdução alimentar e nutrição'
      },
      development: {
        title: 'Acompanhar o desenvolvimento',
        subtitle: 'Estímulos, marcos motores e conquistas de cada fase'
      },
      all: {
        title: 'Um pouco de tudo',
        subtitle: 'Orientações equilibradas para cada momento'
      }
    },
    nextBtn: 'Continuar',
    backBtn: 'Voltar',
    startBtn: 'Começar com calma'
  },
  today: {
    badge: 'Hoje com você',
    greetingPregnancy: 'Como você está hoje?',
    greetingBaby: 'Um dia de cada vez',
    phasePrefix: 'Fase',
    focusPrefix: 'Foco',
    checkinBadge: 'Check-in do dia',
    changeAnswerBtn: 'Mudar resposta',
    skipCheckinBtn: 'Pular por hoje',
    rhythmTitle: 'Seu Ritmo Semanal',
    rhythmSubtitle: 'Últimos 7 dias de registros locais',
    rhythmMom: 'cuidados da mãe',
    rhythmBaby: 'marcos do bebê',
    rhythmActivities: 'atividades praticadas',
    rhythmEmpty: 'Nenhum registro ainda nos últimos 7 dias. Responda ao check-in ou registre uma memória na Jornada!',
    guideTitle: 'Orientações para o Seu Dia',
    guideSubtitle: 'Baseadas na sua fase e no que você compartilhou conosco hoje.',
    viewAllCareBtn: 'Explorar todos os cuidados',
    verifiedBadge: 'Referência Oficial (MS / OMS)',
    demonstrativeBadge: 'Demonstrativo',
    activityCompletedToast: 'Atividade salva na sua Jornada!',
    doActivityBtn: 'Fiz essa orientação hoje',
    alreadyDoneBadge: 'Feito hoje',
    completeModalTitle: 'Registrar Atividade',
    completeModalDesc: 'Deseja adicionar alguma anotação sobre como foi colocar essa orientação em prática?',
    completeModalPlaceholder: 'Ex: O bebê ficou calmo e foi um momento leve...',
    completeModalSaveBtn: 'Salvar na Jornada',
    completeModalCancelBtn: 'Cancelar',
    hubSectionTitle: 'Como podemos ajudar hoje?',
    hubSectionSubtitle: 'Acessos diretos para o momento atual de vocês',
    hubPregWellbeingTitle: 'Meu bem-estar',
    hubPregWellbeingDesc: 'Descanso, emoções, autocuidado e apoio na gestação',
    hubPregAlertsTitle: 'Sinais de alerta',
    hubPregAlertsDesc: 'Sintomas e sinais que exigem avaliação médica imediata',
    hubPregJourneyTitle: 'Minha gestação',
    hubPregJourneyDesc: 'Orientações oficiais de preparo e desenvolvimento',
    hubBabyRecoveryTitle: 'Sua recuperação',
    hubBabyRecoveryDesc: 'Puerpério, cicatrização, descanso e saúde materna',
    hubBabyAlertsTitle: 'Sinais de alerta',
    hubBabyAlertsDesc: 'Sinais em recém-nascidos e mães que pedem atendimento',
    hubBabyCareTitle: 'Cuidados do bebê',
    hubBabyCareDesc: 'Amamentação, sono, banho e marcos do desenvolvimento',
    hubAskTitle: 'Tire suas dúvidas',
    hubAskDesc: 'Perguntas livres com base nas diretrizes do MS e OMS',
    alertsModalTitle: 'Sinais de Alerta e Atenção Médica',
    alertsModalSubtitle: 'Orientações educativas oficiais sobre quando buscar avaliação profissional imediata',
    alertsEmergencyCall: 'Ligue 192 (SAMU) em caso de urgência',
    alertsDisqueSaude: 'Disque 136 (SUS) para orientações em saúde',
    alertsCloseBtn: 'Entendido, fechar',
    alertsViewCareBtn: 'Ver orientações de segurança em Cuidados'
  },
  care: {
    badge: 'Biblioteca de Cuidados',
    title: 'Orientações Práticas',
    subtitle: 'Ações recomendadas para o momento de vocês. Ao concluir, você pode salvá-las na sua Jornada.',
    catAll: 'Tudo',
    catMom: 'Mãe & Bem-estar',
    catDevelopment: 'Bebê & Estímulos',
    catFeeding: 'Nutrição & Amamentação',
    catMonitoring: 'Acompanhamento',
    catSafety: 'Segurança & Prevenção',
    doActivityBtn: 'Fiz essa atividade hoje',
    activityDoneBadge: 'Concluído hoje',
    sourceLabel: 'Fonte',
    modalTitle: 'Registrar Cuidado Praticado',
    modalDesc: 'Ao confirmar, essa atividade será salva na sua Linha do Tempo da Jornada.',
    modalPlaceholder: 'Como foi praticar esse cuidado? (opcional)',
    modalConfirmBtn: 'Confirmar e Salvar',
    modalCancelBtn: 'Cancelar',
    catBaby: 'Bebê',
    expandBtn: 'Ler orientação completa',
    collapseBtn: 'Recolher'
  },
  journey: {
    badge: 'Linha do Tempo Local',
    title: 'Sua Jornada',
    subtitle: 'Registros diários, conquistas e memórias guardados com segurança apenas no seu aparelho.',
    searchPlaceholder: 'Buscar anotações, sintomas, memórias...',
    clearSearchBtn: 'Limpar busca',
    allFilter: 'Todos',
    babyFilter: '👶 Bebê',
    momFilter: '♡ Mãe',
    memoryFilter: '📷 Memórias',
    countSingle: 'momento exibido',
    countPlural: 'momentos exibidos',
    monthOf: 'de',
    prevMonthAria: 'Ver mês anterior',
    nextMonthAria: 'Ver próximo mês',
    emptyMonthTitle: 'Nenhum registro neste mês',
    emptyMonthSubtitle: 'Use o botão "+ Novo registro" para guardar o primeiro momento deste período.',
    emptySearchTitle: 'Nenhum registro encontrado',
    emptySearchSubtitle: 'Tente outros termos de busca ou selecione outro mês.',
    newRecordBtn: 'Novo registro',
    closeBtn: 'Fechar',
    exportMenuBtn: 'Opções de Backup e Exportação',
    newRecordTitle: 'Novo Registro',
    dateSectionTitle: 'Quando aconteceu?',
    dateToday: 'Hoje',
    dateYesterday: 'Ontem',
    dateOther: 'Outra data...',
    subjectSectionTitle: 'Sobre quem vamos registrar?',
    subjectOptions: {
      baby: 'Bebê',
      mom: 'Mãe',
      memory: 'Memória'
    },
    babyPromptTitle: 'Como foi o dia do bebê?',
    momPromptTitle: 'O que aconteceu na sua jornada hoje?',
    memoryPromptTitle: 'Guardar um momento que merece ser lembrado',
    optionsSubtitle: 'Escolha uma ou mais opções e conte um pouco mais.',
    memorySuggestionsSubtitle: 'Sugestões inspiradoras para o seu relato:',
    memorySuggestions: [
      {
        id: 'first_achievement',
        label: 'Primeira conquista',
        prompt: 'O que seu bebê fez pela primeira vez?'
      },
      {
        id: 'special_moment',
        label: 'Momento especial',
        prompt: 'O que tornou esse momento especial hoje?'
      },
      {
        id: 'outing',
        label: 'Passeio',
        prompt: 'Onde vocês foram e o que descobriram juntos?'
      },
      {
        id: 'sounds_laughter',
        label: 'Som ou risada',
        prompt: 'Qual balbucio, som novo ou risada chamou sua atenção?'
      },
      {
        id: 'sweet_gesture',
        label: 'Gesto de carinho',
        prompt: 'Que abraço, olhar ou conexão aqueceu seu coração?'
      }
    ],
    babyTags: [
      {
        tag: 'Dormiu bem',
        question: 'Como foram as sonecas ou o sono da noite?',
        placeholder: 'Ex: Conseguiu dormir 2h direto sem despertar assustado...'
      },
      {
        tag: 'Mamou ou se alimentou normalmente',
        question: 'Observou algo especial na mamada ou refeição?',
        placeholder: 'Ex: Mamou com calma e sem engasgos...'
      },
      {
        tag: 'Estava mais irritado',
        question: 'Percebeu algum motivo provável para a irritação?',
        placeholder: 'Ex: Parecia incomodado com cólica ou salto de desenvolvimento...'
      },
      {
        tag: 'Teve alguma descoberta ou marco',
        question: 'Que gesto, som ou novidade você reparou?',
        placeholder: 'Ex: Tentou segurar o brinquedo com as duas mãozinhas...'
      },
      {
        tag: 'Apresentou algum sintoma',
        question: 'Qual sintoma você notou com atenção?',
        placeholder: 'Ex: Febre baixa após vacina, nariz com secreção transparente...',
        isRequired: true
      }
    ],
    momTags: [
      {
        tag: 'Tive uma conquista pessoal hoje',
        question: 'Qual vitória sua merece ser celebrada?',
        placeholder: 'Ex: Consegui almoçar sentada e com calma...'
      },
      {
        tag: 'Enfrentei uma dificuldade importante',
        question: 'O que tornou o dia difícil para você?',
        placeholder: 'Ex: Me senti muito sobrecarregada com as demandas...',
        isRequired: true
      },
      {
        tag: 'Consegui um tempo só para mim',
        question: 'O que você pôde fazer nesse momento seu?',
        placeholder: 'Ex: Tomei um banho relaxante de 20 minutos...'
      },
      {
        tag: 'Tive uma conversa ou troca significativa',
        question: 'Com quem foi e o que fez bem para você?',
        placeholder: 'Ex: Conversei com uma amiga que também tem bebê...'
      },
      {
        tag: 'Recebi apoio prático que fez a diferença',
        question: 'Qual ajuda recebida aliviou o seu dia?',
        placeholder: 'Ex: Minha mãe trouxe o almoço pronto...'
      },
      {
        tag: 'Observação sobre meu corpo ou recuperação',
        question: 'Como seu corpo tem respondido aos cuidados?',
        placeholder: 'Ex: Sinto menos dores nas costas hoje...'
      }
    ],
    noteLabel: 'Seu relato:',
    noteGeneralPlaceholder: 'Escreva um breve relato sobre esse momento...',
    saveRecordBtn: 'Salvar Registro',
    savingRecordBtn: 'Salvando...',
    savedSuccessMsg: 'Registro salvo com sucesso!',
    validationChooseOption: 'Selecione ao menos uma opção antes de salvar.',
    validationDescribeBriefly: (tagName: string) =>
      `Para acontecimentos como "${tagName}", escreva ao menos uma breve descrição para contextualizar.`,
    exportModalTitle: 'Cópia e segurança dos seus dados',
    exportModalDesc: 'Seus registros estão guardados apenas no seu aparelho. Você tem total controle para salvar uma cópia ou transferir suas anotações quando quiser.',
    exportJsonTitle: 'Fazer backup dos meus registros (JSON)',
    exportJsonDesc: 'Gera um arquivo de segurança com todo o histórico da Jornada para guardar ou transferir de aparelho.',
    exportTxtTitle: 'Baixar versão para leitura (TXT)',
    exportTxtDesc: 'Gera um resumo em texto legível, ideal para ler com calma, imprimir ou levar à consulta médica.',
    restoreBtnTitle: 'Restaurar backup anterior (JSON)',
    restoreBtnDesc: 'Importa e recupera seus registros a partir de um arquivo de backup salvo anteriormente.',
    backupScopeNotice: 'O backup resguarda todos os registros, tags e anotações da Jornada. Não inclui dados cadastrais do perfil (mantidos localmente no navegador) nem seleções não salvas dos Momentos da Semana.',
    restoreModalTitle: 'Restaurar Backup Anterior',
    restoreModalDesc: 'Selecione um arquivo de backup (.json) exportado anteriormente pelo aplicativo.',
    restorePrivacyWarning: 'Atenção à Privacidade: O arquivo de backup contém registros pessoais e de saúde. Mantenha seus arquivos salvos em locais seguros e confiáveis.',
    restoreSelectFileBtn: 'Selecionar arquivo de backup (.JSON)',
    restorePreviewTitle: 'Prévia dos Registros Encontrados',
    restoreTotalRecords: (n: number) => `${n} ${n === 1 ? 'registro válido identificado' : 'registros válidos identificados'}`,
    restoreDateRange: (min: string, max: string) => `Período: de ${min} até ${max}`,
    restoreCounts: (baby: number, mom: number, memory: number) => `Distribuição: ${baby} bebê · ${mom} mãe · ${memory} memórias`,
    restoreModeTitle: 'Escolha o modo de restauração:',
    restoreModeMerge: 'Adicionar e mesclar (preserva os registros atuais e pula duplicados)',
    restoreModeReplace: 'Substituir todo o histórico atual (apaga os dados atuais e grava o backup)',
    restoreConfirmReplaceWarning: 'Atenção: A substituição apagará permanentemente todos os registros atuais antes de gravar o backup.',
    restoreConfirmReplaceCheckbox: 'Estou ciente e confirmo a substituição completa de todo o histórico atual.',
    restoreExecuteBtn: 'Executar Restauração',
    restoreCancelBtn: 'Cancelar',
    restoreSuccessMsg: (imported: number, skipped: number) =>
      `Restauração concluída! ${imported} registros gravados com sucesso${skipped > 0 ? ` (${skipped} duplicados foram ignorados)` : ''}.`,
    restoreErrorTitle: 'Falha na validação do arquivo:',
    clearAllDataBtn: 'Apagar todos os registros deste aparelho...',
    clearModalTitle: 'Confirmação de Exclusão',
    clearModalQuestion: 'Tem certeza de que deseja apagar todos os registros do IndexedDB deste aparelho?',
    clearModalWarning: 'Atenção: Como os dados ficam salvos apenas no seu dispositivo, essa exclusão é irreversível se você não tiver feito um backup em JSON antes.',
    clearModalCancelBtn: 'Cancelar',
    clearModalConfirmBtn: 'Sim, apagar tudo',
    months: [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ],
    dateTodayPrefix: 'Hoje',
    dateYesterdayPrefix: 'Ontem',
    showMoreRecordsBtn: (count: number) => `Ver mais registros (+${count})`,
    showLessRecordsBtn: 'Mostrar menos',
    showingRecordsCount: (visible: number, total: number) => `Exibindo ${visible} de ${total} registros`,
    discardConfirmTitle: 'Descartar anotações?',
    discardConfirmMessage: 'Você começou a preencher um novo registro. Se fechar agora, as informações digitadas serão perdidas.',
    discardConfirmKeepBtn: 'Continuar anotando',
    discardConfirmDiscardBtn: 'Descartar e fechar'
  },
  ask: {
    badge: 'Assistente Educativo',
    title: 'O que você gostaria de saber?',
    subtitle: 'Pergunte sobre cuidados, desenvolvimento ou bem-estar materno.',
    disclaimerTitle: 'Informação educativa',
    disclaimerText: 'As respostas não substituem avaliação profissional. Não inclua informações pessoais. Em uma emergência, procure atendimento imediato.',
    commonQuestionsTitle: 'Não sabe por onde começar?',
    sampleQuestionsPregnancy: [
      'Como posso cuidar do meu bem-estar e descanso na gestação?',
      'Quais sinais de alerta exigem avaliação médica imediata?',
      'Como praticar respiração e relaxamento pélvico?'
    ],
    sampleQuestionsBaby: [
      'Como posso cuidar da minha recuperação?',
      'Como reconhecer sinais de atenção no bebê?',
      'O que esperar desta fase de desenvolvimento?'
    ],
    inputTitle: 'Sua pergunta',
    inputPlaceholder: 'Escreva sua dúvida aqui...',
    sourcesNotice: 'Fontes: MS / OMS',
    consultBtn: 'Consultar',
    consultingBtn: 'Consultando evidências...',
    statusNoticeTitle: 'Etapa 4A (Ativa):',
    statusNoticeDesc: 'Edge Gateway desacoplado ativo em Modo Mock (custo zero). Respostas fundamentadas com citações oficiais de fontes verificadas.',
    alertComingSoon: 'Estrutura de interface pronta! A conexão com a IA educativa e citação de fontes está ativa na Etapa 4A.',
    inputLimitHint: (cur: number, max: number) => `${cur}/${max} caracteres`,
    piiNotice: 'Por segurança e privacidade, não digite nomes completos, documentos ou telefones. A filtragem automática não garante 100% de anonimização.',
    emergencyAlertTitle: 'Atenção Médica Urgente',
    emergencyPhoneLabel: 'Contato de Emergência Imediato:',
    outOfCatalogTitle: 'Orientação Responsável (Fora do Catálogo Oficial)',
    citationsTitle: 'Diretrizes Oficiais Verificadas Consultadas:',
    modeMockBadge: 'Modo Demonstração (Simulação Local)',
    modeLiveBadge: 'Gemini 3.5 Flash-Lite (Oficial)',
    mockNoticeText: 'Esta resposta educativa foi simulada localmente com base nos guias oficiais. Nenhuma chamada externa a modelos de IA pagos foi executada.',
    errorCardTitle: 'Serviço Temporariamente Indisponível',
    newConsultationBtn: 'Fazer outra pergunta',
    verifiedGuidelineBadge: 'Diretriz Oficial Verificada',
    pendingReviewBadge: 'Em Revisão Clínica',
    viewSourcesBtn: 'Consultar fontes',
    hideSourcesBtn: 'Ocultar fontes',
    sourcesCount: (n: number) => `(${n} fonte${n > 1 ? 's' : ''})`,
    jurisdictionBR: 'Diretriz Nacional de Referência: Brasil (Ministério da Saúde do Brasil)',
    jurisdictionGlobal: 'Diretriz Global: Organização Mundial da Saúde (OMS / UNICEF)',
    officialLinkText: 'Acessar publicação oficial',
    emergencyCallSAMU: 'Ligar para o SAMU 192',
    emergencyIntlNotice: 'Orientação com base no protocolo de emergência brasileiro (SAMU 192). Se estiver fora do Brasil, acione imediatamente o número local de emergência.',
    offlineNotice: 'Você está offline. O assistente requer conexão para consultar o gateway, mas a Biblioteca de Cuidados está 100% disponível no seu aparelho.'
  },
  birthRecord: {
    homeCardTitle: 'Meu Nascimento',
    homeCardEmptySubtitle: 'Registre os primeiros detalhes da chegada do bebê e crie uma lembrança afetiva.',
    homeCardEmptyCta: 'Preencher ficha de nascimento',
    homeCardFilledCta: 'Ver ficha e cartão comemorativo',
    homeCardBadge: 'Memória Afetiva',
    viewTitle: 'Meu Nascimento',
    viewSubtitle: 'Ficha comemorativa e registro afetivo dos primeiros momentos',
    backBtn: 'Voltar',
    tabDetails: 'Ficha de Nascimento',
    tabCard: 'Cartão Comemorativo',
    privacyBanner: 'Dados protegidos e mantidos 100% no seu aparelho (Local-First). Nenhuma informação de nascimento é transmitida para a nuvem.',
    saveBtn: 'Salvar Ficha',
    savedSuccess: 'Ficha de nascimento salva com sucesso!',
    exportPngBtn: 'Salvar Imagem (PNG)',
    shareBtn: 'Compartilhar',
    generatingImage: 'Gerando imagem...',
    shareUnavailableNotice: 'Compartilhamento nativo indisponível neste navegador. O arquivo foi salvo na sua pasta de downloads.',
    sectionGeneral: 'Dados Principais',
    sectionMeasurements: 'Medidas ao Nascer',
    sectionClinical: 'Informações de Saúde e Parto (Privadas)',
    clinicalPrivacyNotice: 'Estas informações médicas permanecem estritamente privadas e NUNCA são exibidas no cartão comemorativo compartilhável.',
    babyNameLabel: 'Nome do bebê',
    babyNamePlaceholder: 'Nome completo ou como você chama',
    birthDateLabel: 'Data de nascimento',
    birthTimeLabel: 'Horário de nascimento',
    birthTimePlaceholder: 'Ex: 08:42',
    weightLabel: 'Peso ao nascer (gramas)',
    weightPlaceholder: 'Ex: 3420 ou 3.420 g',
    lengthLabel: 'Comprimento (cm)',
    lengthPlaceholder: 'Ex: 51 cm',
    headCircumferenceLabel: 'Perímetro cefálico (cm)',
    headCircumferencePlaceholder: 'Ex: 35 cm',
    hospitalLabel: 'Hospital / Maternidade',
    hospitalPlaceholder: 'Ex: Hospital Universitário de Oslo',
    cityLabel: 'Cidade',
    cityPlaceholder: 'Ex: São Paulo, Oslo, etc.',
    countryLabel: 'País',
    countryPlaceholder: 'Ex: Brasil, Noruega',
    deliveryTypeLabel: 'Tipo de parto',
    deliveryOptions: {
      none: 'Não informado',
      vaginal: 'Parto normal / vaginal',
      cesarean: 'Cesariana',
      forceps: 'Parto instrumental / fórceps',
      other: 'Outro'
    },
    bloodTypeLabel: 'Tipo sanguíneo',
    bloodTypeOptions: {
      none: 'Não informado',
      unknown: 'Desconhecido'
    },
    allergiesLabel: 'Alergias conhecidas',
    allergiesPlaceholder: 'Ex: nenhuma identificada até o momento',
    allergiesDisclaimer: 'Atenção: A ausência de registros neste campo não significa ausência de alergias ou sensibilidades na criança. Sempre consulte o pediatra.',
    healthConditionsLabel: 'Condições de saúde relevantes',
    healthConditionsPlaceholder: 'Observações neonatais, triagens ou recomendações médicas',
    cardOverline: 'MEU PRIMEIRO CAPÍTULO',
    cardTitle: 'Bem-vindo ao mundo!',
    cardSubtitle: 'Uma história que começou com amor',
    labelTime: 'Horário',
    labelWeight: 'Peso',
    labelLength: 'Comprimento',
    labelCity: 'Cidade',
    labelHospital: 'Hospital de nascimento',
    customizeTitle: 'Personalizar Cartão',
    customizeDesc: 'Selecione quais dados comemorativos deseja exibir na imagem:',
    toggleTime: 'Horário de nascimento',
    toggleWeight: 'Peso ao nascer',
    toggleLength: 'Comprimento',
    toggleLocation: 'Cidade e país',
    toggleHospital: 'Hospital / Maternidade',
    emptyPreviewNotice: 'Preencha os dados na ficha para ver o cartão personalizado.'
  },
  common: {
    loading: 'Carregando dados locais...',
    dbErrorTitle: 'Armazenamento Local Restrito',
    dbErrorDesc: 'O IndexedDB não pôde ser inicializado neste navegador. Novos registros não serão salvos.',
    saveError: 'Não foi possível gravar no armazenamento do aparelho.',
    clearError: 'Erro ao apagar registros locais.',
    confirmPhaseReset: 'Deseja alterar a fase ou reiniciar a introdução rápida?'
  }
};
