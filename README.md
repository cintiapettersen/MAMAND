# MAMAND

**Aplicativo educativo e de registros para gestantes e famílias, da gestação aos dois anos da criança.**
*An educational and record-keeping app for pregnant people and families, from pregnancy to the child's second birthday.*

[![License](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](LICENSE)
[![Status](https://img.shields.io/badge/Status-protótipo_em_revisão-lightgrey.svg)](ROADMAP.md)
[![Language](https://img.shields.io/badge/Language-pt--BR%20%7C%20en-orange.svg)](LOCALIZATION.md)

> **Transparência.** Projeto independente de código aberto, em fase de protótipo, preparado para a candidatura ao **UNICEF FemTech Ventures 2026**. Não há parceria formal, financiamento nem aprovação de nenhuma instituição. **Nenhum conteúdo de saúde tem revisão profissional registrada**, e o aplicativo não foi validado clinicamente. Ele não faz diagnóstico, não indica exames, não interpreta resultados e não substitui a equipe de saúde.
>
> *Independent open-source prototype prepared for the UNICEF FemTech Ventures 2026 application. No formal partnership, funding or institutional approval. **No health content has a recorded professional review**, and the app has not been clinically validated. It does not diagnose, recommend tests, interpret results or replace the care team.*

---

## 1. O que o MAMAND faz hoje

| Situação | O que inclui |
|---|---|
| **Implementado** | Aplicativo web instalável (PWA) em português e inglês, sem login. Telas Hoje, Cuidados (biblioteca de temas com fonte), Jornada (diário da gestação e do bebê), Exames e triagens (registro feito pela família, sem interpretação de resultados), Rede de apoio, Lista para a maternidade, Meu nascimento e contatos de emergência por país. Backup e restauração em JSON e resumo em texto para levar à consulta. Funciona sem internet. |
| **Testado internamente** | Testes automatizados (`npm test`) de armazenamento, backup e restauração, modo offline, resumo exportado, estrutura internacional, contatos de emergência e conteúdo desta distribuição. Testes não são validação clínica. |
| **Pendente de validação** | Revisão profissional de todos os conteúdos de saúde; revisão dos critérios de sinais de alerta; avaliação jurídica dos direitos de uso das fontes; política de privacidade; classificação regulatória. |
| **Planejado** | Listas educativas de exames por país (só depois de revisão profissional e confirmação de direitos); assistente com IA para o público (só depois das revisões clínica e regulatória); piloto com serviços de atenção primária. |

### O que esta distribuição pública não contém

Para reduzir o risco de uso de componentes clínicos ainda não revisados, esta versão **não inclui**:

- o **assistente experimental** de perguntas livres (busca em evidências, respostas simuladas, integração opcional com IA, detector de sinais e catálogo de evidências). A aba Pergunte mostra só um aviso de suspensão e os contatos de emergência;
- o **painel de critérios de sinais de alerta**. A tela Hoje mostra só os contatos de emergência do país informado, conferidos em fontes oficiais (`src/data/emergencyContacts.ts`);
- os **textos completos e as ideias práticas de Cuidados**. A biblioteca mostra título, tema, situação da revisão e fonte de cada tema.

**A separação é temporária.** Esses módulos continuam em desenvolvimento privado e podem voltar a ser abertos depois das revisões clínica e regulatória, em especial se fizerem parte de uma solução financiada com compromisso de código aberto.

**Versões anteriores** deste repositório (até o commit `7d43d3f`, outubro de 2026) incluem uma versão antiga do assistente, com a aba ativa. Elas continuam no histórico, sob Apache 2.0, e **não devem ser usadas** para orientar gestantes ou famílias.

---

## 2. Privacidade e armazenamento

- **Sem conta e sem servidor:** não há cadastro, e-mail, senha nem sincronização com nuvem.
- **Dados só no aparelho:** registros no IndexedDB do navegador; perfil e listas no `localStorage`. **O app não tem criptografia própria**; a proteção é a do navegador e do aparelho.
- **Apagar o navegador apaga os dados.** Faça backup em JSON antes de limpar os dados do navegador ou trocar de aparelho.
- **Arquivos exportados são texto aberto.** Guarde-os em lugar de confiança. No resumo em texto, as anotações livres ficam fora, a menos que a família escolha incluí-las.
- **Offline:** service worker e fontes locais; o app abre, grava, exporta e importa sem internet.

---

## 3. Como executar localmente

Requisitos: Node.js 20 ou superior e npm.

```bash
git clone https://github.com/cintiapettersen/open-child-health-booklet.git
cd open-child-health-booklet
npm install
npm run dev        # desenvolvimento em http://localhost:3000
npm test           # testes automatizados (sem rede)
npm run build      # build de produção em dist/
npm run preview    # serve o build de produção localmente
```

O app não precisa de servidor, variáveis de ambiente nem chaves de API.

---

## 4. Estrutura do repositório

```
├── src/          # Aplicativo React + TypeScript
│   ├── config/   # Regra de exibição da biblioteca de Cuidados
│   ├── data/     # Biblioteca de temas, contatos de emergência, países
│   ├── domain/   # Regras de exames e triagens, países, resumo exportado
│   ├── services/ # IndexedDB, backup e restauração, armazenamento local
│   └── views/    # Hoje, Pergunte, Jornada, Cuidados, cadastro
├── public/       # Manifesto PWA, service worker, ícones e licenças de terceiros
├── test/         # Testes automatizados do aplicativo
└── docs/arquitetura/  # Arquitetura internacional e de exames e triagens
```

Documentos: [ARCHITECTURE.md](ARCHITECTURE.md), [LOCALIZATION.md](LOCALIZATION.md), [CONTENT.md](CONTENT.md), [ROADMAP.md](ROADMAP.md), [CONTRIBUTING.md](CONTRIBUTING.md).

---

## 5. Licenciamento

| Material | Licença | Detalhes |
|---|---|---|
| Código-fonte | [Apache License 2.0](LICENSE) | [NOTICE](NOTICE) |
| Textos originais listados em [CONTENT.md](CONTENT.md) | CC BY 4.0, ainda pendente de confirmação da titular | [CONTENT.md](CONTENT.md) |
| Publicações de saúde citadas | Termos de cada instituição | [CONTENT.md](CONTENT.md) |
| Dependências e fontes tipográficas | Licenças próprias (MIT, ISC, OFL 1.1) | [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) |
| Nome e identidade MAMAND | Não licenciados pelas licenças acima | [TRADEMARKS.md](TRADEMARKS.md) |

- **Titularidade:** Copyright 2026 Cintia Pettersen.
- **Atribuição histórica:** os primeiros arquivos de documentação (commit `dac145c`, outubro de 2026) foram publicados sob a licença MIT; veja [NOTICE](NOTICE).
- **Nome anterior:** o projeto se chamava "Primeiros 1.000 Dias" (*First 1,000 Days*); alguns identificadores internos ainda usam esse nome.
