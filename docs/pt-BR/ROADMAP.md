**Idioma:** [English](../../ROADMAP.md) | Português

# Roadmap do MAMAND

> Projeto independente de código aberto, em fase de protótipo, preparado para a candidatura ao UNICEF FemTech Ventures 2026. Situação em novembro de 2026.

## Situação atual

| Etapa | Situação |
|---|---|
| Aplicativo local-first (PWA, sem login, português e inglês) | **Implementado e testado internamente** |
| Hoje, Cuidados, Jornada, Rede de apoio, Lista para a maternidade, Meu nascimento | **Implementado e testado internamente** |
| Exames e triagens: registro feito pela família, sem listas nacionais | **Implementado e testado internamente** |
| Backup e restauração em JSON; resumo em texto com opção de anotações | **Implementado e testado internamente** |
| Funcionamento offline | **Implementado e testado internamente** |
| Arquitetura internacional (países por código ISO, sem regra de código por país) | **Implementado** (estrutura); listas nacionais vazias |
| Assistente educativo (aba Pergunte) | **Fora desta distribuição**, em desenvolvimento privado até as revisões clínica e regulatória; a aba mostra só um aviso e os contatos de emergência |
| Painel "Sinais de alerta" | **Fora desta distribuição** até a revisão profissional dos critérios; contatos de emergência continuam visíveis |
| Textos e ideias práticas de Cuidados | **Fora desta distribuição** até a revisão profissional; a biblioteca mostra temas e fontes |
| Revisão profissional dos conteúdos de saúde | **Pendente**: nenhum conteúdo tem revisão registrada |
| Avaliação jurídica das fontes, privacidade e classificação regulatória | **Pendente** |

## Próximas etapas

1. **Revisão profissional** dos conteúdos educativos, dos critérios de sinais de alerta e das listas de exames e triagens do Brasil e da Noruega, por profissionais de saúde que conheçam cada sistema.
2. **Avaliação jurídica e regulatória:** direitos de uso das fontes, licença dos textos originais, política de privacidade (LGPD e GDPR) e classificação regulatória.
3. **Testes de regressão** das decisões aprovadas.
4. **Demonstração pública** do frontend estático, sem servidor de IA conectado.
5. **Testes de usabilidade** com famílias e profissionais de saúde; auditoria de acessibilidade (WCAG 2.1 AA).
6. **Piloto em atenção primária**, depois das revisões.

## Planejado, sem data

- Listas educativas de exames e triagens por país, só depois de revisão profissional registrada e confirmação dos direitos de uso.
- Expansão para outros países, com profissionais de cada sistema de saúde.
- Assistente educativo com IA para o público, só depois das revisões clínica e regulatória e da conferência dos termos do provedor do modelo. Ao ser liberado, volta a ser publicado como código aberto.
- Consulta sobre medicamentos e amamentação: em estudo, sem funcionalidade.

## Fora do escopo

- Diagnóstico, prescrição, interpretação de resultados ou triagem clínica.
- Sincronização em nuvem e contas de usuário (o projeto é local-first por escolha).
- Integração com prontuários eletrônicos.
