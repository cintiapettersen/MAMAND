import assert from 'node:assert';
import test from 'node:test';
import fs from 'node:fs';
import path from 'node:path';
import {
  PRIVACY_POLICY_PT,
  PRIVACY_POLICY_EN
} from '../src/data/privacyPolicyData.ts';

test('1. Identificação Institucional do Controlador e Ausência de Contatos Fictícios ou Provisórios', () => {
  // Verifica dados em PT-BR
  assert.strictEqual(PRIVACY_POLICY_PT.controller.corporateName, 'CREATIVE DESIGN PETTERSEN LTDA');
  assert.strictEqual(PRIVACY_POLICY_PT.controller.cnpj, '24.325.181/0001-94');
  assert.strictEqual(PRIVACY_POLICY_PT.controller.country, 'Brasil');
  assert.match(
    PRIVACY_POLICY_PT.controller.governanceNotice,
    /local-first/i,
    'Governança deve ressaltar a autonomia local da usuária'
  );
  assert.match(
    PRIVACY_POLICY_PT.controller.governanceNotice,
    /privacidade@mamand\.app/i,
    'Governança deve referenciar o canal direto privacidade@mamand.app'
  );

  // Verifica que MAMAND é identificado como iniciativa independente da CREATIVE DESIGN PETTERSEN LTDA
  assert.match(
    PRIVACY_POLICY_PT.controller.initiativeContextNotice,
    /iniciativa independente/i,
    'Deve esclarecer que MAMAND é iniciativa independente'
  );
  assert.match(
    PRIVACY_POLICY_EN.controller.initiativeContextNotice,
    /independent initiative/i,
    'Deve esclarecer em inglês como independent initiative'
  );

  const fullPtText = JSON.stringify(PRIVACY_POLICY_PT);
  const fullEnText = JSON.stringify(PRIVACY_POLICY_EN);

  // Garante que não restaram referências à Open Child Health Booklet Initiative
  assert.ok(!fullPtText.includes('Open Child Health Booklet'), 'Não deve conter referência à Open Child Health Booklet Initiative');
  assert.ok(!fullEnText.includes('Open Child Health Booklet'), 'Não deve conter referência à Open Child Health Booklet Initiative');

  // Verifica dados em EN
  assert.strictEqual(PRIVACY_POLICY_EN.controller.corporateName, 'CREATIVE DESIGN PETTERSEN LTDA');
  assert.strictEqual(PRIVACY_POLICY_EN.controller.cnpj, '24.325.181/0001-94');
  assert.strictEqual(PRIVACY_POLICY_EN.controller.country, 'Brazil');
  assert.match(
    PRIVACY_POLICY_EN.controller.governanceNotice,
    /privacidade@mamand\.app/i,
    'Governança em inglês deve referenciar o canal direto privacidade@mamand.app'
  );

  // Contatos oficiais confirmados e operacionais (InMotion Hosting / DNS Vercel)
  assert.strictEqual(PRIVACY_POLICY_PT.controller.privacyEmail, 'privacidade@mamand.app');
  assert.strictEqual(PRIVACY_POLICY_PT.controller.generalEmail, 'hello@mamand.app');
  assert.strictEqual(PRIVACY_POLICY_EN.controller.privacyEmail, 'privacidade@mamand.app');
  assert.strictEqual(PRIVACY_POLICY_EN.controller.generalEmail, 'hello@mamand.app');

  // Garante que não foram publicados campos provisórios entre colchetes nem e-mails fictícios
  assert.ok(!fullPtText.includes('[Endereço'), 'Não deve publicar campos provisórios de endereço');
  assert.ok(!fullPtText.includes('[Canal'), 'Não deve publicar campos provisórios de canal de contato');
  assert.ok(!fullPtText.includes('exemplo@') && !fullPtText.includes('contato@ficticio'));
  assert.ok(!fullEnText.includes('example@') && !fullEnText.includes('contact@fictitious'));

  // Não apresenta o e-mail de privacidade como DPO formalmente nomeado
  const sec1Pt = PRIVACY_POLICY_PT.sections.find((s) => s.id === 'identificacao')!.content.join(' ');
  const sec1En = PRIVACY_POLICY_EN.sections.find((s) => s.id === 'identificacao')!.content.join(' ');
  assert.match(sec1Pt, /não representando a nomeação de um Encarregado de Proteção de Dados\/DPO formal/i);
  assert.match(sec1En, /does not constitute a formally appointed statutory DPO/i);

  // Não deve conter referência genérica a busca em cadastros societários públicos externos
  assert.ok(!fullPtText.includes('registros societários oficiais'), 'Não deve remeter a cadastros societários externos');
  assert.ok(!fullPtText.includes('órgãos públicos de registro empresarial'), 'Não deve remeter a órgãos de registro empresarial');
  assert.ok(!fullEnText.includes('corporate registration records'), 'Não deve remeter a corporate registration records');
});

test('2. Cobertura Técnica Obrigatória e Fatos do Código (PT-BR e EN)', () => {
  const docs = [
    { lang: 'PT-BR', doc: PRIVACY_POLICY_PT },
    { lang: 'EN', doc: PRIVACY_POLICY_EN }
  ];

  for (const { lang, doc } of docs) {
    const sectionIds = doc.sections.map((s) => s.id);

    // 1. Identificação
    assert.ok(sectionIds.includes('identificacao'), `[${lang}] Deve conter seção identificacao`);
    // 2. Armazenamento Local
    assert.ok(sectionIds.includes('armazenamento-local'), `[${lang}] Deve conter seção armazenamento-local`);
    // 3. Categorias de Dados
    assert.ok(sectionIds.includes('categorias-dados'), `[${lang}] Deve conter seção categorias-dados`);
    // 4. Ausência de Banco Central
    assert.ok(sectionIds.includes('ausencia-banco-central'), `[${lang}] Deve conter seção ausencia-banco-central`);
    // 5. Assistente, Gateway e IA
    assert.ok(sectionIds.includes('assistente-gateway-ia'), `[${lang}] Deve conter seção assistente-gateway-ia`);
    // 6. Logs Técnicos e Infraestrutura
    assert.ok(sectionIds.includes('logs-infraestrutura'), `[${lang}] Deve conter seção logs-infraestrutura`);
    // 7. Exportação, Restauração e Omissões de Backup
    assert.ok(sectionIds.includes('exportacao-restauracao'), `[${lang}] Deve conter seção exportacao-restauracao`);
    // 8. Exclusão Local e Preservação de Downloads
    assert.ok(sectionIds.includes('exclusao-dados'), `[${lang}] Deve conter seção exclusao-dados`);
    // 9. Segurança e Ausência de Criptografia em App
    assert.ok(sectionIds.includes('seguranca-criptografia'), `[${lang}] Deve conter seção seguranca-criptografia`);
    // 10. Direitos dos Titulares (LGPD e GDPR)
    assert.ok(sectionIds.includes('direitos-titulares'), `[${lang}] Deve conter seção direitos-titulares`);
    // 11. Transparência e Consentimento
    assert.ok(sectionIds.includes('transparencia-consentimento'), `[${lang}] Deve conter seção transparencia-consentimento`);
    // 12. Alterações e Disclaimers
    assert.ok(sectionIds.includes('alteracoes-disclaimers'), `[${lang}] Deve conter seção alteracoes-disclaimers`);

    // Detalhes técnicos verificados no texto
    const textCorpus = doc.sections.map((s) => s.content.join(' ') + ' ' + (s.warningBox || '')).join(' ');

    // Armazenamento local IndexedDB e localStorage
    assert.match(textCorpus, /IndexedDB/i, `[${lang}] Deve referenciar IndexedDB`);
    assert.match(textCorpus, /localStorage/i, `[${lang}] Deve referenciar localStorage`);
    assert.match(textCorpus, /Cloudflare/i, `[${lang}] Deve referenciar Cloudflare Workers`);
    assert.match(textCorpus, /Gemini/i, `[${lang}] Deve referenciar Gemini`);
    assert.match(textCorpus, /LGPD/i, `[${lang}] Deve referenciar LGPD`);
    assert.match(textCorpus, /GDPR/i, `[${lang}] Deve referenciar GDPR`);

    // NÃO deve declarar campos inexistentes como Apgar
    assert.ok(!textCorpus.toLowerCase().includes('apgar'), `[${lang}] Ficha de nascimento não deve citar campos Apgar`);

    // Backup JSON inclui registros e ficha de nascimento, e exclui configurações de perfil
    const backupSec = doc.sections.find((s) => s.id === 'exportacao-restauracao');
    assert.match(backupSec!.content.join(' '), /birthRecord/i, `[${lang}] Deve confirmar que birthRecord está no JSON`);
    assert.match(backupSec!.content.join(' '), /(?:NÃO|NOT)/i, `[${lang}] Deve listar explicitamente o que não está no backup`);

    // Simplificação da Seção 2 para famílias: remoção de nomes internos de chaves
    const storageSec = doc.sections.find((s) => s.id === 'armazenamento-local');
    const storageText = storageSec!.content.join(' ');
    assert.ok(!storageText.includes('p1000_demo_profile_v1'), `[${lang}] Seção 2 não deve expor chave interna p1000_demo_profile_v1`);
    assert.ok(!storageText.includes('first1000days_maternity_checklist'), `[${lang}] Seção 2 não deve expor chave interna first1000days_maternity_checklist`);
    assert.ok(!storageText.includes('first1000days_support_requests'), `[${lang}] Seção 2 não deve expor chave interna first1000days_support_requests`);
    assert.ok(!storageText.includes('first_1000_days_db'), `[${lang}] Seção 2 não deve expor o identificador interno first_1000_days_db`);
    assert.match(storageText, /IndexedDB/i, `[${lang}] Seção 2 referencia armazenamento local no IndexedDB`);

    // Limitações explícitas de filtros automáticos e processamento no Gemini
    const assistantSec = doc.sections.find((s) => s.id === 'assistente-gateway-ia');
    assert.ok(assistantSec?.warningBox, `[${lang}] Assistente deve possuir caixa de aviso sobre limitações de filtros`);
    assert.match(
      assistantSec!.warningBox,
      /(?:Google Gemini|Gemini)/,
      `[${lang}] Caixa de aviso deve alertar que dados não capturados integram o prompt enviado ao Gemini`
    );
    assert.match(
      assistantSec!.content.join(' '),
      /(?:quatro campos|four bounded fields)/i,
      `[${lang}] Seção do assistente deve explicar os quatro campos enviados ao gateway`
    );
    assert.match(
      assistantSec!.content.join(' '),
      /(?:NÃO garantem a desidentificação completa|DO NOT guarantee complete de-identification)/i,
      `[${lang}] Seção do assistente deve esclarecer que filtros não garantem desidentificação completa`
    );
    assert.match(
      assistantSec!.content.join(' '),
      /(?:revisão jurídica|legal review)/i,
      `[${lang}] Seção do assistente deve mapear bases legais para revisão jurídica`
    );
    assert.match(
      assistantSec!.content.join(' '),
      /(?:transferência internacional|international data transfers)/i,
      `[${lang}] Seção do assistente deve mapear transferência internacional de dados`
    );

    // Seção 11 não promete imunidade jurídica definitiva
    const consentSec = doc.sections.find((s) => s.id === 'transparencia-consentimento');
    assert.match(
      consentSec!.content.join(' '),
      /(?:sem emitir atestados de segurança absoluta|without providing absolute security claims)/i,
      `[${lang}] Seção 11 não deve declarar conformidade definitiva ou imunidade`
    );

    // Resumo em linguagem simples deve cobrir os 4 campos no pilar do assistente
    assert.strictEqual(doc.summary.pillars.length, 5, `[${lang}] Deve possuir 5 pilares no resumo`);
    const assistantPillar = doc.summary.pillars.find((p) => p.icon === 'assistant');
    assert.ok(assistantPillar, `[${lang}] Deve existir pilar do assistente`);
    assert.match(
      assistantPillar!.description,
      /(?:quatro campos|four bounded fields)/i,
      `[${lang}] Pilar do assistente deve ressaltar os quatro campos estritamente delimitados`
    );
  }
});

test('3. Paridade Substantiva entre privacy.html e privacyPolicyData.ts (Fonte Única)', () => {
  const htmlPath = path.resolve('public/privacy.html');
  assert.ok(fs.existsSync(htmlPath), 'public/privacy.html deve existir');

  const htmlContent = fs.readFileSync(htmlPath, 'utf-8');

  // Verifica elementos essenciais gerados da fonte única
  assert.match(htmlContent, /CREATIVE DESIGN PETTERSEN LTDA/, 'HTML deve conter a razão social');
  assert.match(htmlContent, /24\.325\.181\/0001-94/, 'HTML deve conter o CNPJ');
  assert.ok(!htmlContent.includes('first_1000_days_db'), 'HTML não deve conter o identificador interno first_1000_days_db');
  assert.match(htmlContent, /IndexedDB/i, 'HTML deve referenciar armazenamento no IndexedDB');
  assert.match(htmlContent, /data-lang="pt-BR"/, 'HTML deve conter versão PT-BR');
  assert.match(htmlContent, /data-lang="en"/, 'HTML deve conter versão EN');
  assert.match(htmlContent, /setLanguage/, 'HTML deve possuir alternador de idioma offline via JS puro');

  // Links mailto funcionais e clicáveis
  assert.match(htmlContent, /href="mailto:privacidade@mamand\.app"/, 'HTML deve conter link mailto para o canal de privacidade');
  assert.match(htmlContent, /href="mailto:hello@mamand\.app"/, 'HTML deve conter link mailto para o canal geral');

  // Não deve conter requisições externas para Google Fonts nem rastreadores
  assert.ok(!htmlContent.includes('fonts.googleapis.com'), 'Não deve carregar fontes externas');
  assert.ok(!htmlContent.includes('google-analytics.com'), 'Não deve conter Google Analytics');
  assert.ok(!htmlContent.includes('googletagmanager.com'), 'Não deve conter Google Tag Manager');
  assert.ok(!htmlContent.includes('hotjar.com'), 'Não deve conter Hotjar');
  assert.ok(!htmlContent.includes('connect.facebook.net'), 'Não deve conter Facebook Pixel');

  // Verifica cache no Service Worker
  const swPath = path.resolve('public/sw.js');
  const swContent = fs.readFileSync(swPath, 'utf-8');
  assert.match(swContent, /'\/privacy\.html'/, 'Service Worker deve incluir /privacy.html no CORE_ASSETS');
});

test('4. Integração Visual no Aplicativo (Onboarding, Perfil e Jornada)', () => {
  const onboardingContent = fs.readFileSync(path.resolve('src/views/Onboarding.tsx'), 'utf-8');
  const profileModalContent = fs.readFileSync(path.resolve('src/components/ProfileEditModal.tsx'), 'utf-8');
  const journeyContent = fs.readFileSync(path.resolve('src/views/JourneyView.tsx'), 'utf-8');
  const appContent = fs.readFileSync(path.resolve('src/App.tsx'), 'utf-8');

  // Onboarding
  assert.match(onboardingContent, /onOpenPrivacy/, 'Onboarding deve aceitar callback de privacidade');
  assert.match(onboardingContent, /t\.privacy\.onboardingBadge/, 'Onboarding deve exibir badge acolhedor');
  assert.match(onboardingContent, /t\.privacy\.policyLink/, 'Onboarding deve exibir link para política');
  // Garante que não foi introduzida caixa de "Li e concordo com os termos"
  assert.ok(!onboardingContent.includes('Li e aceito'), 'Onboarding não deve ter checkbox genérico de aceite');
  assert.ok(!onboardingContent.includes('Concordo com os termos'), 'Onboarding não deve ter termos forçados');

  // ProfileEditModal
  assert.match(profileModalContent, /onOpenPrivacy/, 'ProfileEditModal deve aceitar callback de privacidade');
  assert.match(profileModalContent, /t\.privacy\.policyLink/, 'ProfileEditModal deve ter link para política');

  // JourneyView
  assert.match(journeyContent, /onOpenPrivacy/, 'JourneyView deve aceitar callback de privacidade');
  assert.match(journeyContent, /t\.privacy\.journeyLinkText/, 'JourneyView deve ter botão de privacidade no header');

  // App.tsx roteamento direto
  assert.match(appContent, /PrivacyPolicyView/, 'App deve importar PrivacyPolicyView');
  assert.match(appContent, /\/privacy/, 'App deve reconhecer rota /privacy');
  assert.match(appContent, /\/privacidade/, 'App deve reconhecer rota /privacidade');
});

test('5. Ausência de Analytics, Rastreamento Comercial e Coleta de Leads', () => {
  const indexHtml = fs.readFileSync(path.resolve('index.html'), 'utf-8');
  const packageJson = JSON.parse(fs.readFileSync(path.resolve('package.json'), 'utf-8'));

  // HTML principal
  assert.ok(!indexHtml.includes('google-analytics.com'));
  assert.ok(!indexHtml.includes('googletagmanager.com'));
  assert.ok(!indexHtml.includes('facebook.net'));
  assert.ok(!indexHtml.includes('hotjar'));

  // Dependências de npm
  const allDeps = {
    ...packageJson.dependencies,
    ...packageJson.devDependencies
  };

  assert.strictEqual(allDeps['analytics'], undefined);
  assert.strictEqual(allDeps['mixpanel'], undefined);
  assert.strictEqual(allDeps['posthog-js'], undefined);
  assert.strictEqual(allDeps['@amplitude/analytics-browser'], undefined);
});

test('6. Consistência entre a Política de Privacidade e o Formato Real do Backup (schemaVersion 1.1)', () => {
  // 1. Validação em PT-BR
  const sec7Pt = PRIVACY_POLICY_PT.sections.find((s) => s.id === 'exportacao-restauracao')!;
  const ptContent = sec7Pt.content.join(' ');
  assert.match(ptContent, /schemaVersion 1\.1/, 'PT-BR deve referenciar schemaVersion 1.1 na exportação');
  assert.match(ptContent, /healthChecks|Exames e Triagens/i, 'PT-BR deve mencionar exames e triagens no backup');
  assert.match(ptContent, /schemaVersion 1\.0/, 'PT-BR deve citar compatibilidade com restauração de arquivos 1.0');

  const sec3Pt = PRIVACY_POLICY_PT.sections.find((s) => s.id === 'categorias-dados')!;
  const ptCatContent = sec3Pt.content.join(' ');
  assert.match(ptCatContent, /Exames, triagens e consultas de saúde/i, 'PT-BR deve incluir categoria de exames e triagens');

  // 2. Validação em EN
  const sec7En = PRIVACY_POLICY_EN.sections.find((s) => s.id === 'exportacao-restauracao')!;
  const enContent = sec7En.content.join(' ');
  assert.match(enContent, /schemaVersion 1\.1/, 'EN deve referenciar schemaVersion 1.1 na exportação');
  assert.match(enContent, /healthChecks|Health Checks/i, 'EN deve mencionar health checks no backup');
  assert.match(enContent, /schemaVersion 1\.0/, 'EN deve citar compatibilidade com restauração de arquivos 1.0');

  const sec3En = PRIVACY_POLICY_EN.sections.find((s) => s.id === 'categorias-dados')!;
  const enCatContent = sec3En.content.join(' ');
  assert.match(enCatContent, /Health checks, screenings, and medical appointments/i, 'EN deve incluir categoria de health checks');

  // 3. Validação no HTML estático gerado
  const htmlPath = path.resolve('public/privacy.html');
  const htmlContent = fs.readFileSync(htmlPath, 'utf-8');
  assert.match(htmlContent, /schemaVersion 1\.1/, 'privacy.html deve conter schemaVersion 1.1');
  assert.match(htmlContent, /healthChecks/i, 'privacy.html deve citar healthChecks');

  // 4. Validação cruzada com a implementação do exportador no código-fonte
  const idbSrc = fs.readFileSync(path.resolve('src/services/indexedDbService.ts'), 'utf-8');
  assert.match(idbSrc, /schemaVersion:\s*'1\.1'/, 'indexedDbService deve exportar schemaVersion 1.1');
  assert.match(idbSrc, /healthChecks/, 'indexedDbService deve incluir healthChecks na carga JSON');
  assert.match(idbSrc, /records/, 'indexedDbService deve incluir records na carga JSON');
  assert.match(idbSrc, /birthRecord/, 'indexedDbService deve incluir birthRecord na carga JSON');
});

test('7. Separação entre titularidade patrimonial (Cintia Pettersen) e controladora de dados (CREATIVE DESIGN PETTERSEN LTDA)', () => {
  const pkg = JSON.parse(fs.readFileSync(path.resolve('package.json'), 'utf-8'));
  assert.strictEqual(pkg.author, 'Cintia Pettersen');
  assert.strictEqual(pkg.license, 'Apache-2.0');

  const ptContext = PRIVACY_POLICY_PT.controller.initiativeContextNotice;
  const enContext = PRIVACY_POLICY_EN.controller.initiativeContextNotice;
  assert.match(ptContext, /Cintia Pettersen/);
  assert.match(enContext, /Cintia Pettersen/);
  assert.ok(!/titular do projeto|criada e desenvolvida pela CREATIVE DESIGN/i.test(ptContext));
  assert.ok(!/created and developed by CREATIVE DESIGN/i.test(enContext));

  const viewSrc = fs.readFileSync(path.resolve('src/views/PrivacyPolicyView.tsx'), 'utf-8');
  assert.ok(!/Todos os direitos reservados|All rights reserved/i.test(viewSrc));
  assert.match(viewSrc, /Copyright © 2026 Cintia Pettersen/);

  const htmlContent = fs.readFileSync(path.resolve('public/privacy.html'), 'utf-8');
  assert.ok(!/Todos os direitos reservados|All rights reserved/i.test(htmlContent));
  assert.match(htmlContent, /Copyright © 2026 Cintia Pettersen/);
  assert.match(htmlContent, /Apache 2\.0/);
});
