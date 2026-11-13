import assert from 'node:assert';
import test from 'node:test';
import fs from 'node:fs';
import path from 'node:path';
import {
  PRIVACY_POLICY_PT,
  PRIVACY_POLICY_EN
} from '../src/data/privacyPolicyData.ts';

test('1. Identificação Institucional do Controlador e Ausência de Contatos Fictícios', () => {
  // Verifica dados em PT-BR
  assert.strictEqual(PRIVACY_POLICY_PT.controller.corporateName, 'CREATIVE DESIGN PETTERSEN LTDA');
  assert.strictEqual(PRIVACY_POLICY_PT.controller.cnpj, '24.325.181/0001-94');
  assert.strictEqual(PRIVACY_POLICY_PT.controller.country, 'Brasil');
  assert.match(
    PRIVACY_POLICY_PT.controller.addressPendingNotice,
    /homologação interna/,
    'Endereço deve constar expressamente como pendência interna'
  );
  assert.match(
    PRIVACY_POLICY_PT.controller.dpoPendingNotice,
    /homologação interna/,
    'Contato de privacidade/DPO deve constar expressamente como pendência interna'
  );

  // Verifica que Open Child Health Booklet Initiative NÃO é tratada como a razão social
  assert.notStrictEqual(PRIVACY_POLICY_PT.controller.corporateName, 'Open Child Health Booklet Initiative');
  assert.match(
    PRIVACY_POLICY_PT.controller.initiativeContextNotice,
    /Open Child Health Booklet Initiative/,
    'Deve esclarecer a relação de linhagem com a iniciativa aberta'
  );

  // Verifica dados em EN
  assert.strictEqual(PRIVACY_POLICY_EN.controller.corporateName, 'CREATIVE DESIGN PETTERSEN LTDA');
  assert.strictEqual(PRIVACY_POLICY_EN.controller.cnpj, '24.325.181/0001-94');
  assert.strictEqual(PRIVACY_POLICY_EN.controller.country, 'Brazil');
  assert.match(PRIVACY_POLICY_EN.controller.addressPendingNotice, /pending internal confirmation/);
  assert.match(PRIVACY_POLICY_EN.controller.dpoPendingNotice, /pending internal confirmation/);

  // Garante que não foram inventados emails fictícios (ex: contato@, dpo@, privacidade@)
  const fullPtText = JSON.stringify(PRIVACY_POLICY_PT);
  const fullEnText = JSON.stringify(PRIVACY_POLICY_EN);
  assert.ok(!fullPtText.includes('@mamand.app') && !fullPtText.includes('@creativedesign.com'));
  assert.ok(!fullEnText.includes('@mamand.app') && !fullEnText.includes('@creativedesign.com'));
});

test('2. Cobertura Técnica Obrigatória das Seções da Política (PT-BR e EN)', () => {
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

    assert.match(textCorpus, /IndexedDB/i, `[${lang}] Deve referenciar IndexedDB`);
    assert.match(textCorpus, /localStorage/i, `[${lang}] Deve referenciar localStorage`);
    assert.match(textCorpus, /Cloudflare/i, `[${lang}] Deve referenciar Cloudflare Workers`);
    assert.match(textCorpus, /Gemini/i, `[${lang}] Deve referenciar Gemini`);
    assert.match(textCorpus, /LGPD/i, `[${lang}] Deve referenciar LGPD`);
    assert.match(textCorpus, /GDPR/i, `[${lang}] Deve referenciar GDPR`);

    // Limitações explícitas de filtros automáticos
    const assistantSec = doc.sections.find((s) => s.id === 'assistente-gateway-ia');
    assert.ok(assistantSec?.warningBox, `[${lang}] Assistente deve possuir caixa de aviso sobre limitações de filtros`);

    // Omissões do backup JSON
    const backupSec = doc.sections.find((s) => s.id === 'exportacao-restauracao');
    assert.match(backupSec!.content.join(' '), /(?:NÃO|NOT)/i, `[${lang}] Deve listar explicitamente o que não está no backup`);

    // Ausência de segurança absoluta
    const secBox = doc.sections.find((s) => s.id === 'seguranca-criptografia');
    assert.match(secBox!.warningBox || '', /100%/i, `[${lang}] Deve recusar garantia de 100% de segurança absoluta`);

    // Resumo em linguagem simples
    assert.strictEqual(doc.summary.pillars.length, 5, `[${lang}] Deve possuir 5 pilares no resumo`);
  }
});

test('3. Página Estática de Privacidade (public/privacy.html) e Service Worker', () => {
  const htmlPath = path.resolve('public/privacy.html');
  assert.ok(fs.existsSync(htmlPath), 'public/privacy.html deve existir');

  const htmlContent = fs.readFileSync(htmlPath, 'utf-8');

  // Verifica elementos essenciais
  assert.match(htmlContent, /CREATIVE DESIGN PETTERSEN LTDA/, 'HTML deve conter a razão social');
  assert.match(htmlContent, /24\.325\.181\/0001-94/, 'HTML deve conter o CNPJ');
  assert.match(htmlContent, /data-lang="pt-BR"/, 'HTML deve conter versão PT-BR');
  assert.match(htmlContent, /data-lang="en"/, 'HTML deve conter versão EN');
  assert.match(htmlContent, /setLanguage/, 'HTML deve possuir alternador de idioma offline via JS puro');

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
