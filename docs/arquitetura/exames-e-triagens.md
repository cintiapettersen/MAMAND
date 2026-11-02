# Exames e triagens

**Situação:** etapas 1 (modelo, regras e testes) e 2 (interface e armazenamento local) implementadas. Sem catálogos nacionais e sem mudança no gateway.
**Data:** 30/10/2026
**Relacionado:** `docs/arquitetura/jurisdicao-das-evidencias.md` (arquitetura internacional)

## Objetivo

O módulo ajuda famílias de qualquer país a organizar os exames e as triagens da gestação e do bebê que fizeram ou conversaram com profissionais de saúde. Ele **não** prescreve exames, **não** interpreta resultados e **não** faz triagem clínica automática.

## Arquivos

| Arquivo | Conteúdo |
|---|---|
| `src/data/isoCountries.ts` | Os 249 códigos ISO 3166-1 alfa-2 oficiais (dado) |
| `src/domain/countries.ts` | Normalização e validação de códigos de país |
| `src/domain/contentScope.ts` | Abrangência (internacional ou país), metadados (fontes, versão, revisão, direitos, idiomas), regra única `isUsable`, seleção sem substituição e leitura do campo antigo `countryJurisdiction` |
| `src/domain/healthChecks.ts` | Registro de exame ou triagem, validação estrita, criação manual ou a partir de catálogo, etapas e leitura do backup 1.1 |
| `src/domain/profileCountries.ts` | Os três países do perfil, com leitura do campo antigo `country` |
| `src/types/index.ts` | Campos opcionais `residenceCountry`, `careCountry` e `emergencyCountry` no perfil (sem tela) |
| `test/internationalStructure.test.ts` | 14 testes estruturais, de regra e de migração |

Nenhum arquivo de lógica compara com um país específico. Um teste percorre `src/domain`, `src/services`, `src/views`, `src/components`, `src/config`, `src/utils`, `src/context` e `gateway/src/services` e falha se encontrar um código de país fixo. A única exceção é o tipo antigo de `countryJurisdiction`, que será substituído na etapa de integração.

## Modelo do registro

```ts
interface HealthCheckRecord {
  schemaVersion: 1;
  id: string;
  subject: 'pregnant_person' | 'baby';
  phase: 'pregnancy' | 'postpartum' | 'newborn' | 'infant' | 'toddler';
  gestationalWeek?: number;   // só para a gestante
  babyAgeDays?: number;       // só para o bebê
  kind: 'prenatal_test' | 'ultrasound' | 'newborn_screening' | 'child_test' | 'other';
  name: string;               // texto livre, até 120 caracteres
  milestones: {
    discussed?: { on?: string };       // conversado com profissional
    scheduled?: { on?: string };       // marcado
    performed?: { on?: string };       // exame realizado
    resultReceived?: { on?: string };  // resultado recebido
    resultDiscussed?: { on?: string }; // resultado conversado com profissional
  };
  personalNote?: string;      // anotação livre, até 2.000 caracteres
  careCountry?: string;       // país de acompanhamento quando o registro foi feito
  origin:
    | { kind: 'manual' }
    | { kind: 'catalog'; catalogId; catalogVersion; country; entryId; labelAtCopy; langAtCopy };
  createdAt: string;
  updatedAt: string;
}
```

**Decisões de projeto**

- **Gestante e bebê no mesmo modelo.** A combinação de quem fez o exame com a fase é validada: a gestante fica em gestação ou pós-parto; o bebê, em recém-nascido, lactente ou 1 a 2 anos.
- **Etapas independentes.** "Realizado", "resultado recebido" e "resultado conversado com profissional" são registros separados. Marcar uma etapa nunca preenche outra, e não há status calculado.
- **Sem campo de resultado.** Não existem valor, faixa de referência nem "normal" ou "alterado". A validação recusa qualquer campo desconhecido, inclusive em backups importados.
- **Nenhuma lista obrigatória.** Os tipos cobrem exames do pré-natal, ultrassonografias, triagens neonatais e exames infantis; a pessoa escreve o nome.
- **Catálogo copiado, não referenciado.** Quem cria o registro a partir de um catálogo nacional guarda o texto, a versão, o país e o idioma daquele momento. Se o catálogo mudar ou sair, o registro continua igual.
- **Mudança de país.** Cada registro guarda o país de acompanhamento da época. Quando o perfil muda de país, os registros antigos não são alterados nem reclassificados, e os novos usam o novo país.

## Catálogos nacionais (estrutura apenas)

Os tipos são `HealthCheckCatalog` e `HealthCheckCatalogEntry`. Cada catálogo tem:

- metadados (`ContentMeta`): país, fontes com datas e licença, versão, status de revisão, direitos de uso e idiomas;
- itens, cada um com indicação: `routine`, `by_indication` ou `regional`.

Um catálogo só aparece se `isUsable` permitir, o que exige três condições:

- status elegível, sem suspensão;
- direitos de uso confirmados;
- país igual ao país de acompanhamento.

**Nenhum catálogo existe ainda.** Os rascunhos de Brasil e Noruega ficam fora do repositório público e só viram dados depois da revisão clínica e da confirmação de direitos (C11 e J4).

## Plano de armazenamento local (para a etapa da interface)

- **IndexedDB:** `first_1000_days_db` passa da versão 1 para a 2. O `onupgradeneeded` só **cria** a store `health_checks` (chave `id`; índices `by_subject` e `by_updatedAt`). A store `journey_records` não é tocada.
- **Backup:**
  - o formato passa para `schemaVersion: '1.1'`, com a lista opcional `healthChecks`;
  - `parseHealthChecksFromBackup` já aceita arquivos 1.0 (sem exames) e 1.1, e recusa o arquivo inteiro se um registro for inválido ou estiver repetido;
  - o importador atual da Jornada (`validateBackupJson`) continua aceitando arquivos 1.0, como os testes conferem. Ele passará a aceitar 1.1 na mesma etapa.
- **Privacidade:** os dados ficam só no aparelho. O aviso do backup deve dizer que o arquivo contém dados de saúde (J5).

## Testes (sem rede)

| Grupo | O que garante |
|---|---|
| Países | 249 códigos, sem repetição, com nome em pt e en via `Intl.DisplayNames`; recusa códigos fora da lista |
| Sem regra por país | Nenhum código de país fixo na lógica |
| Regra de uso | Internacional vale sem país; conteúdo de país só para o país de acompanhamento; status, suspensão, direitos, avaliação individual e idioma bloqueiam; códigos fictícios XA e XB comprovam que a regra é genérica |
| Sem substituição | Se o mais relevante é de outro país, nada é usado |
| Campo antigo | `countryJurisdiction` é lido como abrangência, sem alterar o catálogo |
| Registro manual | Funciona com países sem catálogo (KE, JP) e sem país |
| Etapas | São independentes; datas inválidas são recusadas |
| Sem interpretação | Campos de resultado, normalidade ou etapas extras são recusados |
| Catálogos | Só os elegíveis aparecem; países sem catálogo veem lista vazia |
| Cópia do catálogo | Texto e versão ficam guardados; mudança no catálogo não altera o registro |
| Mudança de país | Registros históricos preservados |
| Perfil | O campo antigo vira só país de emergência; o idioma não define país |
| Backup | 1.0 válido, 1.1 validado, erros recusam o arquivo |

## Próxima etapa: interface (proposta, não implementada)

1. **Perfil:**
   - pergunta "Em que país você faz o acompanhamento de saúde?", com "Prefiro não informar";
   - países de residência e de emergência preenchidos com essa resposta, mas visíveis e editáveis;
   - perfis antigos recebem um convite discreto para responder, sem bloquear nada.
2. **"Exames e triagens"** (dentro da Jornada ou em Cuidados):
   - **lista por pessoa:** gestante e bebê, em ordem de data;
   - **"Adicionar":** nome livre, tipo, quem fez o exame e as etapas que a pessoa quiser marcar, cada uma com data opcional;
   - **cartão de cada exame:** mostra as etapas marcadas com as palavras exatas ("Resultado recebido"), sem cores de alerta nem ícones de "ok";
   - **campo de anotação:** com o lembrete "O MAMAND não interpreta resultados. Converse com a equipe que acompanha você";
   - **ao marcar "realizado":** opção de criar um registro na Jornada.
3. **Armazenamento e backup:** IndexedDB versão 2 e backup 1.1, como no plano acima, com testes de atualização a partir de bancos da versão 1.
4. **Catálogos:** continuam ocultos. A tela fica preparada para mostrar "Exames que costumam ser oferecidos em [país], segundo [fonte, data]" quando houver catálogo elegível, com os exames por indicação separados.
5. **Fora desta etapa:** gateway, aba Pergunte (continua suspensa em produção) e qualquer envio de dados.

## Etapa 2: interface e armazenamento (implementada em 30/10/2026)

**Onde fica**

- **Jornada:** cartão "Exames e triagens", que abre uma página própria. Como nas outras subpáginas, a barra inferior some ali, e "Voltar para a Jornada" retorna.
- **Hoje:** atalho discreto, em forma de link, logo abaixo do check-in do dia.

**O que faz**

- **Listas separadas:** gestação e bebê, sem misturar. A página abre na fase do perfil.
- **Inclusão, edição e exclusão:** a exclusão pede confirmação.
- **Campos:** nome livre, tipo (conforme a pessoa: gestante ou bebê), fase, semana da gestação (só na fase de gestação) e anotação.
- **Etapas:** cinco, independentes, cada uma com data opcional.
- **Edição:** mantém o identificador, a data de criação, a origem e o país de acompanhamento da época.
- **Sem interpretação:** o app não interpreta resultados, não usa cores de normal ou alterado nem ícones de "ok", e não sugere exames.
- **Sem listas nacionais:** a tela não importa nenhuma função de catálogo.

**Armazenamento (IndexedDB versão 2)**

- **Atualização:** a passagem da versão 1 para a 2 só cria a store `health_checks`.
- **Validação:** cada gravação é validada antes de entrar no banco.
- **Outras abas:** o app libera a conexão quando outra aba, com versão mais nova, pede atualização (`onversionchange`).

**Backup 1.1**

- **Exportação:** traz Jornada, cartão de nascimento e exames. Se a leitura dos exames falhar, nada é exportado.
- **Arquivo 1.1:** a prévia mostra quantos exames há. Mesclar e substituir gravam Jornada e exames numa só transação: tudo ou nada.
- **Arquivo 1.0:** a prévia avisa que ele não traz exames. Substituir troca só a Jornada e avisa que os exames do aparelho serão mantidos.
- **Exames inválidos ou repetidos:** o arquivo inteiro é recusado.

**Perfil**

- **Novo campo opcional:** "País do acompanhamento de saúde", com os 249 países em nomes do idioma do app, no cadastro e na edição.
- **País de emergência:** o campo existente (`country`) continua igual.
- **Perfis sem país de acompanhamento:** veem um convite na página de exames. Ele oferece "Informar", "Agora não" (volta em 30 dias) e "Não perguntar de novo". O convite grava só o país de acompanhamento.

### Testes da etapa 2

- **`test/healthChecksStorage.test.ts`** (11 testes, sem rede): exportação e importação 1.1; aceitação de 1.0; recusa de arquivos inválidos; mesclar e substituir; arquivo 1.0 que não apaga exames; tudo ou nada com falha simulada; gravação, edição e exclusão; convite; ausência de interpretação, cores de alerta e catálogos; independência entre país de acompanhamento e de emergência.
- **Navegador (Chrome headless, servidor local, dados fictícios), 46 verificações:**
  - migração de um banco versão 1 real com 3 registros;
  - convite adiado que persiste após recarregar;
  - inclusão, edição e exclusão;
  - separação entre gestação e bebê;
  - convite que grava só o país de acompanhamento;
  - exportação e importação pela tela (1.1 mesclar, 1.0 substituir);
  - inglês e português em 320 px e 390 px, sem rolagem horizontal;
  - nenhum erro no console.

### Limitações conhecidas

- **Resumo em texto da Jornada** ("levar ao pediatra"): inclui os exames desde 30/10/2026 (veja "Resumo em texto" no fim deste documento).
- **"Apagar registros" da Jornada:** não apaga os exames, por ser intencional.
- **Formato do campo de data:** segue o navegador. No teste, o Chrome mostrou "dd/mm/aaaa" também em inglês.
- **Abas abertas com a versão antiga do app:** não liberam a conexão. A atualização para a versão 2 espera essas abas fecharem, e o app fica em "Carregando" até lá.
- **Versões antigas do app:** não importam backups 1.1.
- **Ainda sem tela:** país de residência e idade do bebê em dias; os campos existem no modelo.
- **Navegadores:** a migração foi testada só no Chrome, não em Safari e Firefox.

## Etapa 3: nova experiência de uso (implementada em 30/10/2026)

**Ordem da página**

1. Aviso curto ("O MAMAND não indica exames e não interpreta resultados") e escolha entre Gestação e Bebê.
2. **Meus registros**, com o botão "Adicionar exame":
   - cartões compactos com nome, tipo, período e a última etapa marcada (a mais adiante na sequência, com data se houver);
   - ao tocar, o cartão mostra todas as etapas com datas, a anotação, a origem, o país de acompanhamento, "Editar" e "Excluir";
   - lista vazia: uma linha só (cerca de 43 px).
3. **Informações sobre exames**:
   - **sem país:** explica para que serve o país de acompanhamento, com "Informar país" e "Agora não" (passa a uma linha compacta);
   - **com país:** mostra o nome e "Mudar". Sem lista aprovada, diz que ainda não há lista revisada e lembra que qualquer exame pode ser registrado.

**Folha do formulário** (`HealthCheckSheet`)

- **Abertura:** de baixo para cima no celular; janela centralizada a partir de 640 px.
- **Campos sempre visíveis:** nome, tipo e período, mais a semana na gestação.
- **Etapas e anotações:** começam recolhidas. Na edição, abrem quando já têm conteúdo, e o rótulo diz quantas etapas estão marcadas.
- **Descarte:** fechar com alterações não salvas (✕, Cancelar, tocar fora ou Esc) pede confirmação, com "Descartar" ou "Continuar editando".
- **Ao abrir e ao salvar:** a página de trás não rola, e o foco vai para o nome. Depois de salvar, a folha fecha e o novo cartão fica destacado com um contorno neutro.

**Listas nacionais** (`HealthCheckInfoSection` e `catalogEntriesFor`)

- **Regra mais estrita que a das evidências:** só aparece lista com aprovação clínica registrada (`clinically_reviewed`), direitos confirmados e o país de acompanhamento. `source_based` não basta.
- **Registro oficial vazio:** `src/data/healthCheckCatalogs.ts`. Nenhum rascunho entra nele.
- **Itens:** cartões compactos com nome e período. Ao tocar, mostram a explicação e as referências.
- **Itens por indicação:** num grupo recolhido.
- **Item já adicionado:** aparece "Já está nos seus registros", só como texto e sem ícone.
- **"Registrar nos meus exames":** abre a folha já preenchida. O registro é criado sem nenhuma etapa marcada.

### Testes da etapa 3

- **Sem rede:** 137 testes no total, com novos casos para a lista do país:
  - separação entre itens de rotina e por indicação, por pessoa e por idioma;
  - "já registrado" vale para qualquer versão do mesmo item;
  - registro manual com o mesmo nome não conta como já registrado;
  - nada aparece sem aprovação clínica, direitos, país correspondente ou país informado;
  - o registro oficial está vazio;
  - não há cores nem ícones de "ok", nem palavras como "normal", "obrigatório" ou "pendente".
- **Navegador, 53 verificações:**
  - ordem da página, estado vazio compacto e informações visíveis sem rolar;
  - folha encostada embaixo no celular e centralizada no computador;
  - confirmação de descarte, edição com etapas e anotações abertas;
  - pt e en em 320 e 390 px, migração do banco e backup 1.1;
  - montagem isolada da tela com um catálogo **fictício**, passado só no teste, que não existe no app.

## Resumo em texto (implementado em 30/10/2026)

- `src/domain/journeySummary.ts` monta o resumo (função pura, testada em `test/journeySummary.test.ts`); `indexedDbService.downloadTextFile` só baixa o arquivo, no aparelho, sem rede.
- Abre e fecha dizendo que são registros informados pela família, sem interpretação clínica, e que não é prontuário.
- Diário da Jornada e, depois, exames e triagens em duas seções separadas (gestação e bebê). Cada exame mostra nome, tipo, período (semana da gestação ou dias de vida, se houver), país de acompanhamento, origem de lista educativa e só as etapas marcadas, cada uma com a própria data ou "sem data informada". Nenhuma etapa é deduzida de outra.
- Anotações livres (da Jornada e dos exames) ficam fora por padrão; a família marca "Incluir anotações livres no resumo" no menu de exportação.
- Registros que não passam na validação ficam fora do resumo e são contados numa linha final.
- O backup JSON (1.1) não mudou: já trazia exames e triagens; importar o mesmo arquivo duas vezes não duplica nada.

