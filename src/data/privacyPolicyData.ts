export interface PrivacyPolicySection {
  id: string;
  title: string;
  content: string[];
  warningBox?: string;
  bulletPoints?: string[];
}

export interface SimplePrivacyPillar {
  title: string;
  description: string;
  icon: 'device' | 'no-account' | 'assistant' | 'control' | 'no-ads';
}

export interface PrivacyPolicyDocument {
  version: string;
  lastUpdated: string;
  productName: string;
  controller: {
    corporateName: string;
    cnpj: string;
    country: string;
    privacyEmail: string;
    generalEmail: string;
    initiativeContextNotice: string;
    governanceNotice: string;
  };
  summary: {
    title: string;
    subtitle: string;
    pillars: SimplePrivacyPillar[];
  };
  disclaimerNotice: string;
  sections: PrivacyPolicySection[];
}

export const PRIVACY_POLICY_PT: PrivacyPolicyDocument = {
  version: '1.0.0',
  lastUpdated: '13 de novembro de 2026',
  productName: 'MAMAND',
  controller: {
    corporateName: 'CREATIVE DESIGN PETTERSEN LTDA',
    cnpj: '24.325.181/0001-94',
    country: 'Brasil',
    privacyEmail: 'privacidade@mamand.app',
    generalEmail: 'hello@mamand.app',
    initiativeContextNotice: 'O MAMAND é uma iniciativa independente concebida e desenvolvida por iniciativa pessoal de Cintia Pettersen, titular dos direitos patrimoniais do projeto (sem cessão à pessoa jurídica). A CREATIVE DESIGN PETTERSEN LTDA mantém vínculo institucional com o projeto e atua como entidade controladora indicada para o tratamento de dados nos termos da legislação aplicável.',
    governanceNotice: 'Como o MAMAND opera sob o modelo local-first sem criação de contas de usuário ou armazenamento central em nuvem, a gestão e a proteção dos dados pessoais são exercidas diretamente pela titular em seu próprio dispositivo. Para solicitações sobre privacidade, proteção de dados e exercício de direitos, a CREATIVE DESIGN PETTERSEN LTDA disponibiliza o canal direto privacidade@mamand.app. Para dúvidas institucionais e contato geral, utilize hello@mamand.app.'
  },
  disclaimerNotice: 'Esta Política de Privacidade reflete com exatidão o código-fonte auditado e o funcionamento operacional atual do MAMAND. O aplicativo não declara possuir certificação governamental formal, selos de conformidade jurídica definitiva ou garantias de segurança absoluta, sendo seu modelo fundamentado no princípio do armazenamento local (local-first) e na minimização estrita de dados.',
  summary: {
    title: 'Resumo de Privacidade em Linguagem Simples',
    subtitle: 'Nosso compromisso transparente com você, seu bebê e sua família:',
    pillars: [
      {
        icon: 'device',
        title: 'Seus dados ficam no seu aparelho',
        description: 'Diário da Jornada, ficha de nascimento, marcos de desenvolvimento e memórias ficam gravados diretamente no navegador do seu celular ou computador. Não enviamos seus registros familiares para servidores centrais.'
      },
      {
        icon: 'no-account',
        title: 'Sem cadastro, login ou senhas',
        description: 'Você não precisa fornecer seu e-mail, criar conta ou inventar senhas para cuidar da sua rotina. O aplicativo funciona imediatamente ao ser aberto.'
      },
      {
        icon: 'assistant',
        title: 'Assistente educativo em revisão profissional',
        description: 'Nesta distribuição pública, a aba Pergunte exibe apenas o aviso de pausa para revisão com profissionais de saúde e os contatos locais de emergência, sem envio de perguntas a servidores externos ou geração de respostas clínicas automáticas. Caso o gateway opcional seja reativado após revisão, apenas quatro campos estritamente delimitados serão transmitidos.'
      },
      {
        icon: 'control',
        title: 'Controle total nas suas mãos',
        description: 'Você pode exportar seus registros em arquivo JSON (incluindo Jornada, Ficha de Nascimento e Exames/Triagens de saúde) ou resumo para impressão a qualquer momento, ou apagar todos os dados locais deste aparelho com um único toque.'
      },
      {
        icon: 'no-ads',
        title: 'Sem anúncios, sem venda de dados e métricas opcionais',
        description: 'Não comercializamos dados pessoais, não criamos perfis para publicidade e não utilizamos rastreadores de marketing. Estatísticas agregadas de alcance (Vercel Web Analytics) permanecem desativadas por padrão e só funcionam se você aceitar explicitamente.'
      }
    ]
  },
  sections: [
    {
      id: 'identificacao',
      title: '1. Identificação Institucional e Controlador',
      content: [
        'O MAMAND é um aplicativo web progressivo (PWA) de apoio e acompanhamento parental nos primeiros 1.000 dias de vida (da gestação aos dois anos de idade).',
        'A controladora do tratamento de dados pessoais no âmbito do MAMAND é a sociedade empresária CREATIVE DESIGN PETTERSEN LTDA, inscrita no CNPJ sob o nº 24.325.181/0001-94, sediada no Brasil.',
        'Origem, titularidade e vínculo institucional: O MAMAND é uma iniciativa independente concebida, desenvolvida e custeada pessoalmente por Cintia Pettersen, que detém a titularidade patrimonial do software (licenciado sob Apache License 2.0), sem cessão de direitos à pessoa jurídica. A CREATIVE DESIGN PETTERSEN LTDA mantém vínculo institucional com o projeto (incluindo a candidatura ao UNICEF FemTech Ventures 2026) e atua como entidade jurídica brasileira indicada como controladora de dados responsável pelos deveres de conformidade e privacidade.',
        'Governança e canais oficiais de comunicação: Por operar sob a arquitetura "local-first", o aplicativo não mantém contas de usuário, login ou repositórios centrais de dados em nuvem. A gestão dos dados é realizada de forma autônoma pela própria usuária em seu dispositivo. Para solicitações sobre privacidade, proteção de dados pessoais e direitos dos titulares, o canal oficial direto de atendimento é privacidade@mamand.app (este endereço constitui o canal oficial de comunicação para assuntos de proteção de dados, não representando a nomeação de um Encarregado de Proteção de Dados/DPO formal). Para questões gerais, parcerias e contato institucional, o canal oficial é hello@mamand.app.'
      ]
    },
    {
      id: 'armazenamento-local',
      title: '2. Arquitetura Local-First e Armazenamento no Dispositivo',
      content: [
        'O MAMAND foi concebido sob o modelo "local-first" (prioridade local). Isso significa que as informações que você insere ao longo da rotina com seu bebê são gravadas diretamente no próprio navegador web do seu celular ou computador, e não em servidores centrais operados por nós.',
        'Linha do tempo, consultas e exames de saúde: O aplicativo utiliza o mecanismo de armazenamento local do navegador (IndexedDB) para guardar com segurança as anotações diárias da Jornada, consultas de saúde agendadas ou realizadas, registros de amamentação, sono, trocas de fraldas, marcos do desenvolvimento e o acompanhamento de exames e triagens neonatais.',
        'Preferências e módulos de apoio familiar: O armazenamento local do navegador (localStorage) guarda de maneira reservada as informações de apoio do dia a dia: dados do perfil de acompanhamento, informações da ficha de nascimento do bebê, contatos de confiança da sua rede de apoio, lista da mala da maternidade, temporizador de descanso materno, cartões diários lidos e preferência de idioma.'
      ]
    },
    {
      id: 'categorias-dados',
      title: '3. Categorias de Dados Pessoais e de Saúde Tratados',
      content: [
        'De acordo com as funcionalidades ativadas pelo usuário, as seguintes categorias de dados podem ser armazenadas localmente no seu dispositivo:',
        'a) Dados cadastrais e de personalização: Nome ou apelido de exibição da mãe ou cuidadora (opcional), país onde se encontra (utilizado exclusivamente para exibir telefones de emergência locais adequados ao país, como SAMU 192 no Brasil) e necessidade prioritária de apoio.',
        'b) Dados sobre o bebê e ciclo gestacional: Nome ou apelido do bebê (opcional), ciclo atual (gestação ou puerpério/primeira infância), semanas de gestação ou data de nascimento/data prevista do parto (DPP) para cálculo de dias de vida e calibragem de marcos do desenvolvimento.',
        'c) Dados de saúde e ficha de nascimento do bebê: Peso ao nascer (em gramas), comprimento ao nascer (em centímetros), perímetro cefálico (em centímetros), horário do nascimento, nome da maternidade ou hospital, cidade e país de nascimento, tipo de parto (vaginal, cesárea, assistido), tipo sanguíneo, alergias declaradas e condições de saúde observadas.',
        'd) Registros diários da Jornada e memórias familiares: Anotações livres sobre a rotina, registros de aleitamento/alimentação, sono, trocas de fraldas, marcos motores e cognitivos, observação de sintomas leves e fotografias de memórias familiares salvas localmente.',
        'e) Rede de apoio e organização familiar: Nomes de contatos de confiança, vínculos de parentesco e telefones cadastrados pela própria usuária para facilitação de pedidos de ajuda via SMS/WhatsApp a partir de seu próprio aparelho, além da lista de itens da mala de maternidade.',
        'f) Exames, triagens e consultas de saúde: Registros de consultas de pré-natal e puericultura (datas, especialidade/profissional, local, orientações e anotações de cuidado), bem como o histórico de exames laboratoriais, ultrassonografias e triagens neonatais recomendadas por país (ex.: teste do pezinho, triagem auditiva, visual, cardíaca), contendo datas de realização, resultados observados e próximos passos.'
      ]
    },
    {
      id: 'ausencia-banco-central',
      title: '4. Ausência de Banco Central de Perfis Familiares',
      content: [
        'O MAMAND NÃO possui nem opera um banco central de perfis familiares ou servidores centrais de sincronização de prontuários na nuvem.',
        'A CREATIVE DESIGN PETTERSEN LTDA não mantém repositório com as fotos, nomes de bebês, fichas de nascimento ou diários criados pelos usuários. Não temos acesso visual nem realizamos cópias ocultas dos registros que residem no armazenamento do seu navegador.'
      ]
    },
    {
      id: 'assistente-gateway-ia',
      title: '5. Assistente Educativo, Gateway Edge e Processamento por Inteligência Artificial',
      content: [
        'O módulo "Pergunte ao MAMAND" fornece esclarecimentos educativos fundamentados em evidências oficiais de saúde pública. Para viabilizar as respostas, o assistente conecta-se a um Gateway Edge operado em nuvem.',
        'Minimização estrita dos quatro campos transmitidos ao Gateway: Ao formular uma dúvida no assistente educativo, a aplicação cliente envia exclusivamente uma carga técnica composta por quatro campos delimitados: 1) o texto da pergunta digitada (submetido previamente à rotina cliente de sanitização), 2) a fase declarada (gestação ou bebê), 3) o estágio numérico correspondente (semanas de gestação ou meses de vida) e 4) o idioma selecionado (português ou inglês). Nenhuma outra informação pessoal — como diário da Jornada, Ficha de Nascimento, fotografias, contatos da rede de apoio ou nome da mãe/cuidadora — é transmitida ao Gateway.',
        'Filtros automáticos de privacidade (PII Scrubber) e limitações inerentes: Tanto na aplicação cliente quanto no Gateway, o texto da pergunta passa por expressões regulares projetadas para detectar e mascarar números de CPF, telefones, e-mails e frases comuns de apresentação pessoal (ex: "meu nome é...", "meu bebê se chama..."). Contudo, filtros automatizados baseados em regras possuem limitações técnicas estruturais e NÃO garantem a desidentificação completa ou a anonimização absoluta do texto digitado.',
        'Processamento pelo Google Gemini quando ativado: O Gateway utiliza uma arquitetura RAG (Recuperação Aumentada por Geração) que consulta trechos de manuais clínicos oficiais verificados (Ministério da Saúde do Brasil, OMS e UNICEF). No modo conectado com IA ativa, o prompt transmitido à API do Google Gemini (modelo Gemini 3.5 Flash-Lite) é composto pelas instruções de sistema, pelos trechos oficiais recuperados do contexto clínico e pelo texto da pergunta com o filtro de privacidade aplicado. A aplicação não anexa identificadores de conta, cadastros de perfil ou metadados de dispositivo ao prompt; contudo, não havendo garantia de remoção completa de identificadores pelos filtros automáticos, quaisquer dados pessoais ou informações identificáveis inseridas pela própria usuária no texto da pergunta que não sejam interceptadas pelas expressões regulares serão enviadas e processadas pela API do Google Gemini para a elaboração da resposta. Quando o modo simulado (Mock) está ativo, as respostas são sintetizadas localmente sem qualquer chamada a serviços externos de IA.',
        'Pontos de revisão jurídica sobre o assistente e trânsito de dados: O módulo assistente fornece orientações puramente educativas sobre saúde pública, não prestando assistência médica, diagnóstico ou procedimento clínico. Caso a usuária voluntariamente insira informações sobre saúde na pergunta, o eventual processamento dessas informações, a transferência internacional de dados e o trânsito técnico em infraestrutura global em nuvem (Cloudflare Edge e API de inteligência artificial quando ativada) constituem pontos sob revisão jurídica externa contínua, para determinação formal das hipóteses legais definitivas perante a LGPD e o GDPR e para auditoria de garantias contratuais de fornecedores. A CREATIVE DESIGN PETTERSEN LTDA não declara antecipadamente a confirmação definitiva dessas bases nem presume consentimentos tácitos ou dispensas automáticas.'
      ],
      warningBox: 'Aviso sobre limitações dos filtros de privacidade: Expressões regulares automáticas não asseguram anonimização total e não são capazes de identificar nomes incomuns, apelidos afetivos, locais ou contextos narrativos indiretos. Qualquer dado pessoal digitado no texto da pergunta que escape aos filtros automatizados integrará o prompt transmitido ao Google Gemini. Recomendamos enfaticamente que a usuária nunca digite nomes completos de pessoas, números de documentos, endereços residenciais, contatos ou informações confidenciais no campo de dúvidas do assistente.'
    },
    {
      id: 'logs-infraestrutura',
      title: '6. Logs Técnicos e Serviços de Infraestrutura Identificados',
      content: [
        'Para manter o aplicativo acessível e protegido contra ameaças digitais, serviços de infraestrutura de tecnologia são empregados:',
        'a) Cloudflare Workers (Gateway Edge): Processa as requisições de consulta do assistente. Em conformidade com as operações normais de redes, o Cloudflare recebe metadados transitórios de conexão (endereço IP, porta de conexão, cabeçalhos HTTP e navegador). Para proteção contra sobrecarga e abuso (rate limiting), o sistema calcula um hash criptográfico efêmero (SHA-256) combinando o IP com a data do dia e um sal rotativo diário, descartando o endereço IP original da lógica do aplicativo.',
        'b) Plataforma de Hospedagem Estática (CDN): Distribui os arquivos HTML, scripts JavaScript, fontes e folhas de estilo do aplicativo, registrando logs padrão de servidores web estritamente necessários para a entrega de arquivos e proteção de infraestrutura.',
        'c) Google Gemini API: Processa as consultas de linguagem natural quando o assistente online está ativado, em conformidade com as políticas comerciais de API do provedor (onde requisições de API não são utilizadas para treinar modelos fundacionais públicos da Google).',
        'd) Estatísticas agregadas de alcance (Vercel Web Analytics — somente após consentimento): Quando você aceita expressamente no aviso inicial ou nas preferências, o aplicativo carrega o Vercel Web Analytics exclusivamente para medir visualizações agregadas de páginas, visitantes estimados (calculados via hash criptográfico efêmero de 24 horas) e origem geral do tráfego (referrer e país aproximado). O serviço não utiliza cookies de rastreamento, não grava identificadores persistentes no aparelho e não lê nem recebe nenhum dado do perfil, da Jornada, da Ficha de Nascimento, de consultas, exames ou perguntas ao assistente — todos os registros familiares permanecem integralmente no seu próprio dispositivo.'
      ]
    },
    {
      id: 'exportacao-restauracao',
      title: '7. Exportação, Restauração e Escopo dos Backups',
      content: [
        'O MAMAND oferece ferramentas de soberania dos dados para que você possa retirar suas informações do aplicativo quando desejar:',
        'a) Exportação em formato aberto JSON: Gera um arquivo estruturado padronizado (schemaVersion 1.1) contendo os registros históricos da Jornada (records), a Ficha de Nascimento do bebê (birthRecord, quando preenchida pela usuária) E os Exames e Triagens de saúde acompanhados (healthChecks).',
        'b) Resumo para leitura TXT: Gera um relatório textual simples e legível de suas anotações para impressão ou envio a profissionais de saúde.',
        'c) Restauração de backup JSON: Permite importar um arquivo previamente exportado (suportando tanto o formato atual schemaVersion 1.1 quanto arquivos anteriores no formato schemaVersion 1.0), oferecendo os modos de mesclagem (adiciona registros novos preservando os atuais) ou substituição completa (apaga os registros locais e carrega os do arquivo). Ao restaurar, a Ficha de Nascimento e os Exames/Triagens presentes no backup também são restabelecidos.',
        'IMPORTANTE — Escopo do backup JSON atual: O arquivo de backup JSON schema 1.1 contempla a linha do tempo da Jornada, consultas de saúde, a Ficha de Nascimento e os Exames/Triagens de saúde, mas NÃO inclui as preferências gerais de perfil da mãe (nome de exibição, país, foco inicial), os contatos da rede de apoio, os itens marcados na mala de maternidade, o temporizador de descanso ou o histórico de leitura de conteúdos educativos, que permanecem exclusivamente no armazenamento local do navegador.'
      ]
    },
    {
      id: 'exclusao-dados',
      title: '8. Exclusão de Dados Locais, Preservação de Backups e Dados de Terceiros',
      content: [
        'Você pode a qualquer momento apagar integralmente todas as informações salvas no MAMAND através do botão "Apagar todos os meus dados deste aparelho", localizado na tela de edição de perfil.',
        'Ao confirmar a exclusão: O banco de dados local IndexedDB é completamente esvaziado e todos os dados do MAMAND no armazenamento local são removidos de forma irreversível do navegador.',
        'Preservação de arquivos já exportados pelo usuário: Arquivos JSON ou relatórios TXT que você já tenha baixado anteriormente para a pasta de downloads ou arquivos do seu computador, tablet ou celular estão fora do ambiente do navegador e NÃO são apagados pela função de exclusão local. O gerenciamento e descarte desses arquivos externos é de inteira responsabilidade da usuária.',
        'Limitações perante fornecedores de infraestrutura: A rotina de exclusão local atua estritamente na sandbox do seu navegador web. Ela NÃO apaga nem interfere em registros técnicos transitórios de rede mantidos temporariamente por provedores terceiros de infraestrutura (como Cloudflare ou provedores de CDN) para segurança da informação e prevenção de ataques cibernéticos, os quais operam sob suas próprias políticas e prazos legais de retenção.',
        'Preservação do shell offline: Os arquivos estáticos de código do aplicativo e fontes mantidos em cache pelo Service Worker não são considerados dados pessoais e permanecem disponíveis para que você possa usar o aplicativo novamente quando desejar.'
      ]
    },
    {
      id: 'seguranca-criptografia',
      title: '9. Segurança da Informação e Ausência de Criptografia em Nível de Aplicação',
      content: [
        'Os dados armazenados localmente no IndexedDB e no localStorage encontram-se em formato estruturado sem camada adicional de criptografia aplicada pelo código do MAMAND.',
        'A proteção das informações repousa diretamente sobre os mecanismos de segurança do próprio sistema operacional e do dispositivo físico utilizado (código de bloqueio de tela, biometria/TouchID/FaceID, criptografia integral de disco como FileVault no macOS, BitLocker no Windows, ou criptografia nativa no Android e iOS).',
        'Recomendações de segurança: Em dispositivos compartilhados por várias pessoas ou sem senha de proteção de tela, qualquer pessoa com acesso físico ao navegador poderá visualizar as informações gravadas localmente. Recomendamos o uso de dispositivos individuais protegidos por senha.'
      ],
      warningBox: 'Declaração de ausência de segurança absoluta: Nenhuma tecnologia de transmissão de dados pela internet ou método de armazenamento eletrônico é 100% seguro ou inviolável. O MAMAND adota práticas de ponta em minimização de dados e eliminação de servidores centrais, mas não declara nem assegura segurança absoluta contra invasões físicas ao aparelho ou vulnerabilidades gerais de sistemas operacionais.'
    },
    {
      id: 'direitos-titulares',
      title: '10. Direitos dos Titulares (LGPD e GDPR) e Canais de Contato',
      content: [
        'O MAMAND assegura o respeito integral aos direitos dos titulares de dados pessoais previstos na legislação brasileira (Lei Geral de Proteção de Dados Pessoais - LGPD, Lei nº 13.709/2018) e, quando aplicável a residentes na União Europeia ou Espaço Econômico Europeu, no Regulamento Geral de Proteção de Dados da UE (GDPR, Regulamento 2016/679).',
        'Exercício direto e autônomo de direitos:',
        '• Confirmação e Acesso aos dados (Art. 18, I e II da LGPD; Art. 15 do GDPR): Todos os dados sob posse do MAMAND encontram-se visíveis e acessíveis diretamente nas telas do aplicativo.',
        '• Correção de dados incompletos ou inexatos (Art. 18, III da LGPD; Art. 16 do GDPR): A usuária pode alterar seu nome, país, datas e registros da jornada diretamente no aplicativo a qualquer momento.',
        '• Eliminação dos dados (Art. 18, VI da LGPD; Art. 17 do GDPR): Pode ser executada de forma autônoma a qualquer instante pela funcionalidade "Apagar todos os meus dados deste aparelho".',
        '• Portabilidade (Art. 18, V da LGPD; Art. 20 do GDPR): Garantida através da função de exportação em JSON estruturado e resumo TXT.',
        '• Informação sobre compartilhamento: Descrita com total transparência nesta política (eventual processamento transitório pelo Cloudflare e Google Gemini caso o assistente online venha a ser ativado em consultas voluntárias).',
        'Canal direto e funcional de privacidade: As funcionalidades do aplicativo conferem total autonomia para que o titular exerça a maior parte de seus direitos diretamente em seu próprio aparelho. Para esclarecimentos adicionais, requisições formais de direitos ou dúvidas sobre o tratamento de dados pessoais pela controladora, os titulares podem entrar em contato diretamente pelo e-mail privacidade@mamand.app. Mensagens institucionais gerais ou dúvidas sobre o projeto podem ser direcionadas a hello@mamand.app. Os canais são operados diretamente pela equipe responsável da CREATIVE DESIGN PETTERSEN LTDA.'
      ]
    },
    {
      id: 'transparencia-consentimento',
      title: '11. Transparência, Bases Legais e Ausência de Aceite Compulsório',
      content: [
        'O MAMAND rejeita o uso de caixas genéricas e forçadas de "Li e aceito todos os termos" como artifício para justificar qualquer tratamento de dados.',
        'A utilização das funções de registro local (Jornada, ficha de nascimento, checklist) apoia-se na execução direta da funcionalidade pessoal solicitada pela usuária (local-first), na qual os dados permanecem sob o exclusivo controle da própria titular em seu aparelho. A CREATIVE DESIGN PETTERSEN LTDA esclarece que a natureza local do aplicativo não é invocada como dispensa automática de obrigações corporativas da controladora perante a LGPD ou o GDPR.',
        'O envio de perguntas ao assistente educativo constitui solicitação voluntária do usuário. Avisos contextuais de privacidade são exibidos para assegurar a ciência informada da usuária, não se considerando o simples clique de envio como consentimento explícito e destacado automaticamente válido.',
        'Consentimento para estatísticas de alcance (LGPD, GDPR e Noruega/EEE): A medição via Vercel Web Analytics inicia desativada por padrão. A ausência de cookies não dispensa automaticamente o consentimento prévio, especialmente sob a Diretiva ePrivacy, o GDPR e a legislação norueguesa (ekomloven § 3-15), que exigem escolha ativa e bloqueio prévio de scripts de medição não estritamente necessários no dispositivo. Você pode aceitar ou recusar com o mesmo destaque no aviso inicial e alterar ou revogar sua escolha a qualquer momento em "Editar Perfil" ou nesta Política de Privacidade; ao recusar ou revogar, o script não é carregado e novos envios são interrompidos imediatamente.',
        'Revisão contínua de enquadramento legal e ausência de definitividade: A CREATIVE DESIGN PETTERSEN LTDA submete todo o enquadramento de privacidade à auditoria e validação jurídica independente. A menção a cenários regulatórios destina-se estritamente à transparência e governança interna pré-publicação, sem emitir declarações de conformidade jurídica definitiva, sem emitir atestados de segurança absoluta e sem presumir imunidade legal.'
      ]
    },
    {
      id: 'alteracoes-disclaimers',
      title: '12. Alterações desta Política e Disclaimers Finais',
      content: [
        'Esta política poderá ser atualizada periodicamente para refletir o lançamento de novas funcionalidades, aprimoramentos técnicos ou formalizações cadastrais da controladora.',
        'Sempre que ocorrerem atualizações relevantes, a data da última revisão no topo deste documento será atualizada.',
        'O MAMAND não declara possuir certificação formal de conformidade com agências governamentais ou entidades de acreditação internacional. A garantia oferecida aos usuários é de transparência integral, ausência de banco de dados centralizado e alinhamento do código com as melhores práticas de privacidade por padrão (Privacy by Design).'
      ]
    }
  ]
};

export const PRIVACY_POLICY_EN: PrivacyPolicyDocument = {
  version: '1.0.0',
  lastUpdated: 'November 13, 2026',
  productName: 'MAMAND',
  controller: {
    corporateName: 'CREATIVE DESIGN PETTERSEN LTDA',
    cnpj: '24.325.181/0001-94',
    country: 'Brazil',
    privacyEmail: 'privacidade@mamand.app',
    generalEmail: 'hello@mamand.app',
    initiativeContextNotice: 'MAMAND is an independent initiative conceived and developed as a personal initiative by Cintia Pettersen, who retains copyright ownership of the project (with no assignment to a legal entity). CREATIVE DESIGN PETTERSEN LTDA maintains an institutional affiliation with the project and serves as the designated data controller under applicable privacy laws.',
    governanceNotice: 'Because MAMAND operates on a local-first model without cloud user accounts or central databases, personal data governance is exercised directly by the user on their own device. For privacy inquiries, personal data protection, and user rights, CREATIVE DESIGN PETTERSEN LTDA provides the direct channel privacidade@mamand.app. For general inquiries and institutional communications, contact hello@mamand.app.'
  },
  disclaimerNotice: 'This Privacy Policy strictly reflects the audited source code and current operational reality of MAMAND. The application does not claim official government certification, definitive legal compliance seals, or absolute security guarantees. Its model is founded on local-first storage and strict data minimization.',
  summary: {
    title: 'Privacy Summary at a Glance',
    subtitle: 'Our transparent commitment to you, your baby, and your family:',
    pillars: [
      {
        icon: 'device',
        title: 'Your data lives on your device',
        description: 'Your Journey diary, birth record, developmental milestones, and memories are saved directly inside your browser on your phone or computer. We do not transmit your family records to central servers.'
      },
      {
        icon: 'no-account',
        title: 'No account, login, or passwords required',
        description: 'You do not need to provide your email address, register an account, or create passwords to use MAMAND. The application works immediately upon opening.'
      },
      {
        icon: 'assistant',
        title: 'Educational assistant under professional review',
        description: 'In this public distribution, the Ask tab displays only the review-pause notice and local emergency contacts, without sending questions to external servers or generating automated clinical answers. Should the optional gateway be re-enabled after review, only four bounded fields would be transmitted.'
      },
      {
        icon: 'control',
        title: 'Full control in your hands',
        description: 'You can export your records as an open JSON file (including Journey entries, Birth Record, and Health Checks/Screenings) or readable text summary at any time, or erase all local data from this device with a single click.'
      },
      {
        icon: 'no-ads',
        title: 'No advertising, no data selling, and optional metrics',
        description: 'We do not sell personal data, build advertising profiles, or run marketing trackers. Aggregate reach statistics (Vercel Web Analytics) remain disabled by default and only run if you explicitly opt in.'
      }
    ]
  },
  sections: [
    {
      id: 'identificacao',
      title: '1. Institutional Identification & Data Controller',
      content: [
        'MAMAND is a Progressive Web App (PWA) designed to support and accompany parents throughout the first 1,000 days of life (from pregnancy up to two years of age).',
        'The legal data controller responsible for MAMAND under applicable personal data protection laws is CREATIVE DESIGN PETTERSEN LTDA, registered in Brazil under CNPJ nº 24.325.181/0001-94.',
        'Independent origin, ownership, and institutional affiliation: MAMAND is an independent initiative conceived, developed, and funded personally by Cintia Pettersen, who retains copyright ownership of the software (licensed under Apache License 2.0), with no assignment of rights to a legal entity. CREATIVE DESIGN PETTERSEN LTDA maintains an institutional affiliation with the project (including the UNICEF FemTech Ventures 2026 application) and serves as the Brazilian legal entity designated as the data controller for privacy compliance.',
        'Governance and official communication channels: Operating under a "local-first" paradigm, the app maintains no user accounts, logins, or cloud database repositories. Data governance is handled directly and autonomously by the user on their own device. For requests regarding privacy, personal data protection, and user rights, the official direct communication channel is privacidade@mamand.app (this serves as the designated official privacy communication channel and does not constitute a formally appointed statutory DPO). For general inquiries, partnerships, and institutional matters, contact hello@mamand.app.'
      ]
    },
    {
      id: 'armazenamento-local',
      title: '2. Local-First Architecture & Device Storage',
      content: [
        'MAMAND is built on a "local-first" architecture. This means that the information you record during your daily routine with your baby is saved directly inside your phone or computer web browser, rather than in central cloud servers managed by us.',
        'Journey timeline, health appointments, and screenings: The application uses the browser local storage mechanism (IndexedDB) to securely persist chronological journal entries, prenatal and well-child visit logs, feeding logs, sleep patterns, diaper changes, developmental milestones, and lab/newborn screening records.',
        'Family settings and support tools: Your browser local storage (localStorage) securely retains day-to-day organizational data: caregiver profile preferences, baby birth record details, trusted support network contacts, hospital bag checklist items, maternal rest timer states, read educational cards, and language selection.'
      ]
    },
    {
      id: 'categorias-dados',
      title: '3. Categories of Personal & Health Data Processed',
      content: [
        'Depending on the features you choose to use, the following categories of data may be stored locally on your device:',
        'a) Profile and personalization: Optional display name for the mother/caregiver, country of residence (used solely to display accurate local emergency phone numbers, such as 911, 112, or 192), and primary care focus.',
        'b) Baby and gestational cycle: Optional baby\'s name, current phase (pregnancy or baby), gestational age in weeks or birth date / estimated due date (EDD) to compute exact age in days and align developmental guidance.',
        'c) Health and baby birth record: Birth weight (in grams), birth length (in centimeters), head circumference (in centimeters), birth time, hospital or maternity clinic name, city and country of birth, delivery type (vaginal, cesarean, assisted), blood type, declared allergies, and observed health conditions.',
        'd) Daily Journey diary and family memories: Open text notes, feeding/nursing logs, sleep tracking, diaper changes, motor and cognitive milestones, mild symptoms observed, and locally stored family photo memories.',
        'e) Support network and hospital bag: Names, relationships, and phone numbers of trusted contacts entered locally by you to facilitate sending SMS or WhatsApp messages from your own device, and packed hospital bag checklist items.',
        'f) Health checks, screenings, and medical appointments: Records of prenatal and pediatric visits (dates, healthcare providers/locations, care notes), as well as clinical tests, ultrasounds, and newborn screenings recommended by country (e.g., heel prick, hearing, eye, cardiac screening), including completion dates, observed findings, and next steps.'
      ]
    },
    {
      id: 'ausencia-banco-central',
      title: '4. Current Absence of a Central Family Database',
      content: [
        'MAMAND DOES NOT operate a central cloud database of family profiles, cloud user accounts, or centralized medical records.',
        'CREATIVE DESIGN PETTERSEN LTDA does not maintain cloud repositories storing your photos, baby names, birth certificates, or journal entries. We have no visual access to and make no covert copies of the data residing inside your browser storage.'
      ]
    },
    {
      id: 'assistente-gateway-ia',
      title: '5. Educational Assistant, Edge Gateway & AI Processing',
      content: [
        'The "Ask MAMAND" assistant provides educational guidance based on official public health references. To process questions, it connects to a decoupled Edge Gateway deployed on cloud infrastructure.',
        'Strict data minimization across the four fields transmitted to the Gateway: When submitting a question to the educational assistant, the client application transmits strictly four bounded fields: 1) the typed question text (previously submitted to client-side sanitization), 2) declared phase (pregnancy or baby), 3) numerical stage (gestational weeks or age in months), and 4) selected language (Portuguese or English). No other information — such as Journey diary entries, Birth Record, family photos, support network contacts, or caregiver names — is ever transmitted to the Gateway.',
        'Automated privacy filter (PII Scrubber) and inherent limitations: On both client and server sides, the question text is passed through regular expressions designed to detect and mask national identity numbers (e.g., CPF), phone numbers, email addresses, and typical name introduction phrases (e.g., "my name is...", "my baby\'s name is..."). However, pattern-based automated filters have inherent technical limitations and DO NOT guarantee complete de-identification or absolute anonymization of user-entered text.',
        'Google Gemini processing when active: The Gateway applies a Retrieval-Augmented Generation (RAG) pipeline to fetch matching verified guidance from official public health manuals (WHO, UNICEF, Brazil Ministry of Health). In connected mode with AI active, the prompt sent to the Google Gemini API (model Gemini 3.5 Flash-Lite) consists of system instructions, retrieved official health excerpts, and the question text with privacy filters applied. While the application does not attach account identifiers, profile databases, or device metadata to the prompt, automated filters cannot guarantee complete removal of personal details; consequently, any identifying information or personal context typed directly by the user that is not caught by the regular expressions will be transmitted to and processed by the Google Gemini API to generate the response. When simulated (Mock) mode is active, responses are synthesized locally with zero external API calls.',
        'Points of legal review regarding the assistant and data transit: The assistant module provides strictly educational public health guidance and does not provide medical care, clinical procedures, or healthcare services. If a user voluntarily enters health-related details into a question, the transient processing of such information, international data transfers, and technical transit across global cloud infrastructure (Cloudflare Edge and AI API when active) are treated as open points of ongoing external legal review to formally define definitive legal grounds under LGPD and GDPR and to audit vendor contractual safeguards. CREATIVE DESIGN PETTERSEN LTDA makes no definitive prior claim regarding these bases, nor does it assume automatic exemptions or unverified contractual assurances.'
      ],
      warningBox: 'Notice regarding privacy filter limitations: Automated regular expressions cannot ensure absolute anonymization and cannot reliably recognize uncommon names, affectionate nicknames, specific locations, or subtle narrative contexts. Any identifying information typed into the question box that is not caught by the automated filters will be included in the prompt sent to Google Gemini. Users are therefore strongly urged never to type real full names, identity documents, home addresses, contact details, or confidential information into the assistant question box.'
    },
    {
      id: 'logs-infraestrutura',
      title: '6. Technical Logs & Identified Infrastructure Services',
      content: [
        'To keep the application accessible, resilient, and protected against abuse, technology infrastructure services are utilized:',
        'a) Cloudflare Workers (Edge Gateway): Processes assistant question requests. As part of standard internet edge routing and DDoS mitigation, Cloudflare receives transient connection metadata (IP address, port, HTTP headers, User-Agent). For rate limiting, the gateway computes an ephemeral daily SHA-256 hash combining the IP with the date and a rotating salt, discarding raw IP addresses from application logic.',
        'b) Static Hosting Platform (CDN): Delivers static HTML, JavaScript bundles, self-hosted fonts, and stylesheets, maintaining standard web server access logs strictly for content delivery and infrastructure protection.',
        'c) Google Gemini API: Processes natural language queries when online AI is enabled, under commercial enterprise API terms (which stipulate that customer API queries are not used to train Google\'s foundational models).',
        'd) Aggregate reach statistics (Vercel Web Analytics — opt-in only): Only after you explicitly accept in the initial notice or preferences, the app loads Vercel Web Analytics strictly to measure aggregate page views, estimated visitors (computed via an ephemeral 24-hour cryptographic hash), and general traffic sources (referrer and approximate country). It uses no tracking cookies, stores no persistent tracking IDs on your device, and never accesses or transmits profile details, Journey entries, Birth Record data, Health Checks, or assistant questions — all family records remain exclusively on your own device.'
      ]
    },
    {
      id: 'exportacao-restauracao',
      title: '7. Export, Restore & Scope of Backups',
      content: [
        'MAMAND provides data portability tools so you can export your data at any time:',
        'a) Structured JSON Export: Produces an open, machine-readable JSON file (schemaVersion 1.1) containing your Journey history (records), the baby\'s Birth Record (birthRecord, when filled by the user), AND tracked Health Checks & Screenings (healthChecks).',
        'b) Readable TXT Summary: Generates a clear, human-readable text document suitable for printing or sharing with your pediatrician or family.',
        'c) Backup Restoration: Allows re-importing a valid JSON backup (supporting both current schemaVersion 1.1 and legacy schemaVersion 1.0 files), offering either Merge mode (adds new records while keeping existing ones) or Replace mode (replaces current local records with the backup). When restoring, the Birth Record and Health Checks present in the backup file are also reinstated.',
        'IMPORTANT — Scope of the current JSON backup: The JSON schema 1.1 backup file preserves Journey timeline entries, health appointments, the baby\'s Birth Record, and Health Checks/Screenings, but DOES NOT include general caregiver profile preferences (display name, country, primary focus), support network contacts, hospital bag checklist items, rest timer, or viewed educational articles, which remain stored strictly in your local browser storage.'
      ]
    },
    {
      id: 'exclusao-dados',
      title: '8. Local Data Erasure, Preservation of Backups & Third-Party Logs',
      content: [
        'You can permanently delete all information stored in MAMAND at any time using the "Erase all my data from this device" action inside Profile Settings.',
        'Upon confirming erasure: The local IndexedDB database is completely wiped and all MAMAND entries in local browser storage are irreversibly removed.',
        'Preservation of downloaded files: JSON backups or TXT reports previously downloaded to your computer or phone filesystem are outside the browser sandbox and ARE NOT deleted by this action. Managing and deleting downloaded external files is the user\'s sole responsibility.',
        'Limitations regarding infrastructure providers: Local erasure operates strictly within your web browser sandbox. It DOES NOT erase or modify transient technical network logs maintained temporarily by third-party infrastructure providers (such as Cloudflare or hosting CDNs) for network security and DDoS mitigation, which operate under their own applicable data retention policies and statutory requirements.',
        'Preservation of offline app shell: Static code assets, self-hosted fonts, and cached icons in the Service Worker cache do not constitute personal data and are preserved so that the application remains functional offline if you choose to start anew.'
      ]
    },
    {
      id: 'seguranca-criptografia',
      title: '9. Information Security & Device-Level Reliance',
      content: [
        'Data stored locally in IndexedDB and localStorage is kept in structured plaintext without an additional application-level symmetric encryption layer.',
        'Information security relies directly on the operating system and hardware controls of your personal device (passcode locks, biometric authentication such as FaceID/TouchID, and disk encryption like FileVault on macOS, BitLocker on Windows, or iOS/Android native storage sandboxing).',
        'Security recommendations: On shared devices or devices without passcode protection, anyone with physical access to your browser can view locally stored entries. We recommend using private devices protected by screen lock passcodes.'
      ],
      warningBox: 'Disclaimer regarding absolute security: No internet transmission or electronic storage method is 100% impenetrable. While MAMAND applies state-of-the-art data minimization and eliminates central cloud databases, it makes no claim of absolute invulnerability against physical device intrusion or host operating system compromises.'
    },
    {
      id: 'direitos-titulares',
      title: '10. User Rights (LGPD & GDPR) & Contact Channels',
      content: [
        'MAMAND respects user rights under Brazilian General Data Protection Law (LGPD, Law nº 13.709/2018) and, where applicable to residents of the EU or EEA, the European Union General Data Protection Regulation (GDPR, Regulation 2016/679).',
        'Direct and autonomous exercise of rights:',
        '• Confirmation and Access (Art. 18, I & II LGPD; Art. 15 GDPR): All personal and health data stored by MAMAND is directly visible inside the app interface.',
        '• Rectification (Art. 18, III LGPD; Art. 16 GDPR): You can edit names, country, dates, and journal entries directly in the app at any time.',
        '• Erasure (Art. 18, VI LGPD; Art. 17 GDPR): Can be executed autonomously anytime via the "Erase all my data from this device" button.',
        '• Portability (Art. 18, V LGPD; Art. 20 GDPR): Provided via open JSON export and TXT summaries.',
        '• Information on data sharing: Fully and transparently detailed in this policy (eventual ephemeral processing by Cloudflare and Google Gemini if online assistant mode is enabled during voluntary queries).',
        'Direct and functional privacy channel: The application features provide full autonomy for users to exercise most of their rights directly on their device (access, rectification, export portability, and local wipe). For additional clarifications, formal rights requests, or questions regarding personal data processing, data subjects can contact us directly at privacidade@mamand.app. General corporate correspondence and project questions can be addressed to hello@mamand.app. Both channels are operated directly by the responsible team at CREATIVE DESIGN PETTERSEN LTDA.'
      ]
    },
    {
      id: 'transparencia-consentimento',
      title: '11. Transparency, Legal Grounds & No Forced Consent',
      content: [
        'MAMAND rejects blanket, coercive "I agree to all terms" checkboxes as a pretext for broad data processing.',
        'Local family logging features (Journey, birth record, checklist) rely on the direct execution of the personal service requested by the user under a local-first paradigm, where data remains under the user\'s exclusive control. CREATIVE DESIGN PETTERSEN LTDA clarifies that this local architecture is not invoked as an automatic exemption from corporate controller obligations under privacy law.',
        'Asking questions to the educational assistant constitutes a voluntary user request. Contextual privacy notices are displayed to ensure informed user awareness, without treating a simple submit click as automatically valid explicit consent.',
        'Consent for reach statistics (LGPD, GDPR, and Norway/EEA): Measurement via Vercel Web Analytics is disabled by default. The absence of cookies does not automatically waive prior consent, particularly under the ePrivacy Directive, GDPR, and Norwegian law (ekomloven § 3-15), which require active choice and prior blocking of non-essential measurement scripts on the user\'s device. You may accept or decline with equal prominence in the initial notice and change or withdraw your preference at any time in "Edit Profile" or within this Privacy Policy; upon declining or withdrawing, the script is not loaded and any further transmissions stop immediately.',
        'Ongoing legal review and absence of definitive certification: CREATIVE DESIGN PETTERSEN LTDA submits this entire privacy framework to independent legal review. Discussion of regulatory scenarios serves internal governance and transparency, without asserting definitive legal compliance, without providing absolute security claims, and without assuming statutory immunity.'
      ]
    },
    {
      id: 'alteracoes-disclaimers',
      title: '12. Policy Revisions & Concluding Disclaimers',
      content: [
        'This policy may be updated periodically to reflect new features, technical enhancements, or formalized corporate records.',
        'Whenever material changes occur, the revision date at the top of this document will be updated.',
        'MAMAND makes no claim of formal accreditation by government agencies or international auditing boards. Our commitment to users is complete transparency, zero central databases, and strict Privacy by Design alignment.'
      ]
    }
  ]
};
