# Proposta: arquitetura internacional de conteúdos de saúde

> **Nota da versão pública (novembro de 2026).** As partes deste documento sobre a aba Pergunte, o gateway e o catálogo de evidências referem-se ao assistente experimental, que não faz parte desta distribuição. A estrutura de países e a regra de uso valem para Exames e triagens.

**Situação:** proposta para decisão da titular. Nada foi implementado.
**Data:** 30/10/2026 (segunda versão, substitui a primeira)

O MAMAND deve funcionar em qualquer país. Conteúdos nacionais são camadas opcionais por cima de um aplicativo que já é útil sem eles. Brasil e Noruega são os primeiros países com pesquisa de conteúdo, mas nenhuma regra de código menciona um país.

## 1. Princípios

1. **Qualquer país.** Países são identificados por código ISO 3166-1 alfa-2 (`BR`, `NO`, `KE`, `JP`…). O código nunca compara com um país específico; só verifica se o código do conteúdo bate com o código do perfil.
2. **Quatro dados independentes:**
   - idioma;
   - país de residência;
   - país de acompanhamento de saúde;
   - país dos contatos de emergência.

   Nenhum é deduzido de outro. Uma família pode usar o app em português, morar na Suécia, fazer o pré-natal na Noruega e querer o número de emergência da Noruega.
3. **Universal por padrão.** Jornada, registros, cartão de nascimento, checklist, rede de apoio e "Meus exames" funcionam sem nenhum conteúdo nacional.
4. **Conteúdo nacional só para o país de acompanhamento,** e só se for elegível (status, como na C10, e abrangência).
5. **Sem substituição.** Se falta o protocolo do país de acompanhamento, não se mostra o de outro país. Conteúdo internacional geral continua disponível quando for adequado e elegível.
6. **Nenhum dado novo sai do aparelho** nesta proposta. O gateway não muda.

## 2. Perfil

### Situação atual

`UserProfile.country` (opcional) serve só para o número de emergência. A sugestão inicial vem da região do idioma do aparelho; a pessoa confirma.

### Proposta

```ts
type IsoCountry = string; // ISO 3166-1 alfa-2, validado contra uma lista fixa de códigos

interface UserProfile {
  // … campos atuais …
  preferredLanguage?: SupportedLanguage; // idioma (já existe)
  residenceCountry?: IsoCountry;         // onde mora; informativo, não muda conteúdo
  careCountry?: IsoCountry;              // onde faz o acompanhamento de saúde; define conteúdos nacionais
  emergencyCountry?: IsoCountry;         // números de emergência (hoje: `country`)
}
```

- **Migração, sem perguntar nada e sem perder dados:** `country` passa a ser lido como `emergencyCountry`. `residenceCountry` e `careCountry` ficam vazios até a pessoa responder. Não copiar `country` para `careCountry` automaticamente: ele foi escolhido para outro fim.
- **Cadastro e edição:**
  - uma pergunta principal: "Em que país você faz o acompanhamento de saúde?", com a opção "Prefiro não informar";
  - os outros dois países aparecem preenchidos com essa resposta, mas visíveis e editáveis.
- **Lista de países:** todos os códigos ISO, com nomes no idioma do app via `Intl.DisplayNames`, sem traduzir à mão.
- **Números de emergência:** a tabela de 16 países continua. Para um país fora dela, o app mostra "o número de emergência do seu país", como já faz hoje sem país.
- **Sem país de acompanhamento:** tudo funciona; só não aparecem conteúdos nacionais.

## 3. Conteúdos: classificação e conjuntos nacionais

### Metadados de cada item (evidência, conteúdo da Biblioteca ou lista educativa)

```ts
type ContentScope =
  | { kind: 'international' }
  | { kind: 'country'; countries: IsoCountry[] };

interface SourceRef {
  publisher: string;           // "Ministério da Saúde", "Helsedirektoratet", "WHO"
  title: string;
  edition?: string;
  pages?: string;              // páginas impressas
  url?: string;
  publishedOn?: string;        // AAAA-MM-DD ou AAAA
  sourceUpdatedOn?: string;    // "última atualização" informada pela fonte
  accessedOn: string;          // quando o MAMAND conferiu
  license?: string;            // "CC BY-NC-SA 4.0", "NLOD", "a confirmar"
}

interface ClinicalReview {
  status: ContentReviewStatus; // já existe: pending_review, source_based, clinically_reviewed…
  reviewedOn?: string;
  reviewerRef?: string;        // referência do registro da revisão, sem dados pessoais no código
  notes?: string;
}

interface ContentMeta {
  scope: ContentScope;
  individualAssessment: 'none' | 'partial' | 'required';
  sources: SourceRef[];
  version: string;             // muda quando o texto muda
  review: ClinicalReview;
  suspendedReason?: string;    // já existe
}
```

`countryJurisdiction` (BR, GLOBAL ou WHO) é substituído por `scope`. A fonte não define a abrangência: um texto do Ministério da Saúde pode descrever um fato fisiológico (`international`), e um da OMS pode ser só um modelo de serviço.

### Conjuntos nacionais (dados, não código)

```
src/content/
  international/          evidências e conteúdos de abrangência internacional
  countries/
    BR/                   primeiro conjunto (pesquisa iniciada)
    NO/                   segundo conjunto (pesquisa iniciada)
    <ISO>/                qualquer país, quando houver conteúdo
  registry.ts             só junta os arquivos; não tem regra por país
```

Cada conjunto tem um manifesto:

```ts
interface CountryPack {
  country: IsoCountry;
  version: string;
  updatedOn: string;
  languages: SupportedLanguage[];   // idiomas com texto disponível
  evidence: EvidenceChunk[];        // com scope { kind: 'country', countries: [country] }
  lists: NationalList[];            // listas educativas (seção 5)
}
```

Adicionar um país é adicionar uma pasta de dados. Um teste garante que nenhum arquivo de lógica (`src/services`, `gateway/src/services`, componentes) compara com um código de país literal.

### Regra única de uso

```ts
isUsable(item, { careCountry }) =
  isStatusEligible(item)                           // C10: source_based ou clinically_reviewed, não suspenso
  && (item.scope.kind === 'international'
      || (careCountry !== undefined && item.scope.countries.includes(careCountry)))
  && item.individualAssessment !== 'required'      // nesses, só encaminhamento ou indisponibilidade
```

- **Na busca (versão B da C10):** se o item mais relevante para a pergunta não for utilizável, porque é de outro país ou não elegível, a resposta é indisponibilidade. Variante para país: "Ainda não temos uma referência educativa revisada para o seu país sobre esse assunto". Nunca se responde com o vizinho.
- **Idioma:** se o item existir só em um idioma, o app mostra a indisponibilidade em vez de trocar de país ou traduzir automaticamente.

## 4. Integração com o que já existe

| Parte do app | Hoje | Com a proposta |
|---|---|---|
| Perfil | `country` só para emergência | Três países independentes; migração sem perda |
| Números de emergência | Por país, 16 países | Usa `emergencyCountry`; fora da tabela, texto genérico |
| Jornada | Universal; registros no aparelho (IndexedDB) | Continua universal; nada depende do país. Um exame concluído pode gerar um registro na Jornada, com vínculo ao exame |
| Biblioteca de Cuidados | Conteúdos sem país; 9 citam a Caderneta | Cada conteúdo recebe `scope`. Os que citam serviços ou documentos nacionais viram `country` ou são reescritos de forma neutra, depois da revisão |
| Checklist da maternidade | Já é neutro ("registro ou caderneta do pré-natal") | Sem mudança |
| Sugestões da aba Pergunte | Vinculadas a evidências elegíveis | Passam a usar `isUsable` com o país de acompanhamento |
| Aba Pergunte, modo local (desenvolvimento) | Busca no navegador | Aplica `isUsable` no próprio aparelho, sem enviar o país |
| Aba Pergunte, gateway | Recebe pergunta, fase, idade e idioma | **Não muda agora.** Enviar o país exigirá decisão própria e atualização da política de privacidade (J5) |
| Produção | Aba Pergunte suspensa | Continua suspensa |
| Backup | `schemaVersion` 1.0, só registros da Jornada | Versão 1.1 com os registros de "Meus exames"; arquivos 1.0 continuam aceitos |

## 5. "Meus exames"

Uma lista pessoal e manual, que funciona em qualquer país. Listas nacionais só ajudam a preencher.

### Registro pessoal (no aparelho, IndexedDB, nova store)

```ts
interface ExamRecord {
  id: string;
  title: string;                       // texto livre da pessoa
  category?: 'blood' | 'urine' | 'imaging' | 'other';
  status: 'planned' | 'done';
  plannedFor?: string;                 // data escolhida pela pessoa
  doneOn?: string;
  personalNote?: string;               // anotação livre; o app não interpreta resultados
  origin:
    | { kind: 'manual' }
    | { kind: 'national_list'; country: IsoCountry; listId: string; entryId: string; listVersion: string };
  journeyRecordId?: string;            // vínculo opcional com a Jornada
  createdAt: string;
  updatedAt: string;
}
```

- **Funciona sem nenhuma lista nacional:** a pessoa digita o exame, marca como feito e anota.
- **Sem interpretação:** o app não lê nem interpreta resultados, não diz se um valor é normal e não sugere condutas.
- **Lista nacional atualizada:** os registros já criados não mudam. Eles guardam a versão da lista de origem.
- **Privacidade:** os dados ficam só no aparelho e entram no backup. O aviso do backup deve dizer que o arquivo contém dados de saúde.

### Listas educativas nacionais

```ts
interface NationalList {
  id: string;                          // 'prenatal-exams'
  kind: 'prenatal_exams' | 'child_checkups' | 'vaccines';
  country: IsoCountry;
  version: string;
  meta: ContentMeta;                   // fontes, datas, revisão, licença
  entries: Array<{
    id: string;
    label: Record<SupportedLanguage, string>;
    window?: { fromWeek?: number; toWeek?: number; fromMonth?: number; toMonth?: number };
    indication: 'routine' | 'by_indication' | 'regional';
  }>;
}
```

- **Quando aparece:** só se `isUsable` permitir, ou seja, o país é o de acompanhamento e a lista está elegível.
- **Como aparece:** como "exames que costumam ser oferecidos no seu país, segundo [fonte, data]". A pessoa escolhe quais copiar para a lista pessoal.
- **Exames por indicação** (`by_indication` e `regional`): aparecem separados, com "a equipe de saúde avalia se é o seu caso", e nunca como obrigação.
- **Sem lista para o país, ou lista ainda não elegível:** "Meus exames" continua funcionando só de forma manual, sem mensagem de erro.
- **Primeiros conjuntos:** Brasil e Noruega (rascunhos `pending_review`, fora do repositório público) seriam os primeiros dados. Ficam ocultos até a revisão.

## 6. Etapas sugeridas (cada uma com aprovação própria)

1. **Modelo de dados e regra `isUsable`.** Tipos, função central e testes, inclusive com um país fictício sem conteúdo, para provar que tudo funciona sem dados nacionais. Classificação provisória do catálogo: o que hoje é BR vira `country: ['BR']`, e o que é GLOBAL é revisado item a item. Sem mudança visível.
2. **Perfil.** Três países, migração e telas de cadastro e edição.
3. **"Meus exames" manual.** Universal, com backup 1.1.
4. **Listas nacionais.** Formato, primeiros conjuntos BR e NO, ocultos até a revisão.
5. **Aba Pergunte.** Junto com a C10, aplicar `isUsable` e a regra de não substituição no modo local. Gateway só depois, com decisão de privacidade.

## 7. Impacto e riscos

- **Família com país de acompanhamento sem conteúdo:** usa todas as funções universais e os conteúdos internacionais elegíveis. A aba Pergunte responde menos, e a indisponibilidade é honesta.
- **Classificação do catálogo:** até a revisão, quase toda evidência `source_based` está marcada BR. Fora do Brasil, a aba Pergunte teria cerca de 3 evidências internacionais; com a revisão dos itens fisiológicos, cerca de 11.
- **Mensagens de bloqueio e cautela:** citam "o Ministério da Saúde do Brasil" para qualquer país. Precisam de texto neutro, ou de fonte por país, na revisão das mensagens (M1 e M2).
- **Exemplos de texto na Jornada** ("vacinas dos 2 meses"): seguem o calendário brasileiro e devem ficar neutros.
- **Dados de saúde no aparelho:** "Meus exames" aumenta a sensibilidade do backup; isso entra na política de privacidade (J5).
- **Licenças:** cada conjunto nacional registra a licença de cada fonte; a análise continua na J4.
