# Arquitetura do MAMAND

> **Situação (novembro de 2026).** Esta distribuição pública contém só o aplicativo local-first. A aba Pergunte exibe apenas o aviso de pausa para revisão profissional e os contatos oficiais de emergência por país (`EmergencyStrip`), sem formulário de perguntas nem importação de catálogos clínicos, `ragService`, `mockEngine` ou `askService` no bundle público. Os rascunhos clínicos experimentais (textos completos de Cuidados e catálogos de evidências não revisados) foram transferidos para repositório privado de pesquisa (`cintiapettersen/mamand-clinical-research`), permanecendo no código público apenas fixtures sintéticas para testes técnicos do motor RAG. Nenhum conteúdo de saúde tem revisão profissional registrada. Os dados ficam só no aparelho, **sem criptografia própria**.

## 1. Visão geral

O **MAMAND** (antes "Primeiros 1.000 Dias" / Open Child Health Booklet) é uma Progressive Web App (PWA) estática, em **React 18**, **TypeScript** e **Vite**. Toda a lógica e todos os registros ficam no aparelho; o app não tem servidor próprio nem faz requisições de rede além de carregar os próprios arquivos.

```
┌──────────────────────────────────────────────────────────────┐
│                    DISPOSITIVO DA USUÁRIA                    │
│                                                              │
│  Interface (React / PWA, pt-BR e en)                         │
│  - Hoje: check-in, cartas do dia, contatos de emergência     │
│  - Pergunte: aviso de suspensão e contatos de emergência     │
│  - Jornada: diário, Exames e triagens, backup e resumo       │
│  - Cuidados: biblioteca de temas (título, tema e fonte)      │
│  - Service worker para uso offline                           │
│                                                              │
│  Armazenamento local                                         │
│  - IndexedDB: Jornada e Exames e triagens                    │
│  - localStorage: perfil, listas e preferências               │
│  - Exportação e importação em JSON; resumo em TXT            │
└──────────────────────────────────────────────────────────────┘
```

## 2. Modelo de Dados Local (IndexedDB)

Os registros residem na base `first_1000_days_db` (ObjectStore `journey_records`):

```typescript
export interface JourneyRecord {
  id: string;                         // Identificador único do registro (ex: "rec-1730000000")
  subject: 'baby' | 'mom' | 'memory'; // Classificação do sujeito do cuidado
  tags: string[];                     // Marcações de contexto selecionadas
  note?: string;                      // Anotação textual contextualizada
  sourceActivityTitle?: string;       // Título da orientação prática vinculada
  contentId?: string;                 // ID da atividade (prevenção contra duplicatas diárias)
  timestamp: string;                  // Data/hora de gravação (ISO 8601)
  eventDate: string;                  // Data efetiva do acontecimento (YYYY-MM-DD, suporta retroatividade)
  dateLabel: string;                  // Rótulo amigável exibido na linha do tempo
}
```

---

## 3. Arquitetura PWA e Resiliência Offline

O aplicativo implementa padrões modernos de PWA para garantir funcionamento autônomo em regiões de baixa conectividade ou áreas rurais:

1. **Manifesto PWA (`public/manifest.webmanifest`)**:
   - `display: "standalone"`, permitindo instalação na tela de início de smartphones Android e iOS.
   - Cores temáticas `#FAF7F2` consistentes com a identidade acolhedora do projeto.
   - Ícones vetoriais SVG em resoluções 192x192 e 512x512.
2. **Service Worker (`public/sw.js`)**:
   - **Assets Estáticos**: Estratégia *Cache-First* combinada com *Stale-While-Revalidate* para o bundle JS/CSS e imagens.
   - **Navegação SPA**: Estratégia *Network-First* com fallback para o `index.html` em cache, viabilizando recargas de tela e navegação profunda sem internet.
   - **Isolamento Estrito de Privacidade**: O Service Worker intercepta requisições para `/api/*` e chamadas ao Edge Gateway local (porta 8787). Essas rotas **nunca são armazenadas no CacheStorage**. Em caso de falha de rede, o Service Worker devolve uma resposta HTTP 503 sintética sem persistir consultas ou respostas médicas.
3. **Fontes 100% locais e offline (zero Google Fonts):**
   - Todas as fontes tipográficas (`Fraunces`, `Nunito`, `Plus Jakarta Sans`) são auto-hospedadas em WOFF2 (`@fontsource` e `public/fonts/`), sem requisições a servidores externos.
   - O CSS define fallbacks nativos (`system-ui, -apple-system, sans-serif` e `Georgia, serif`), assegurando que a interface seja pintada imediatamente mesmo com a conexão desligada.

---

## 4. Restauração Atômica e Soberania de Dados

Para assegurar soberania completa dos dados sem depender de nuvem, o aplicativo implementa importação estruturada com transações atômicas nativas do IndexedDB:

1. **Validador de Esquema (`validateBackupJson`)**:
   - Verifica integridade JSON, versão do esquema (`1.0`), presença dos campos obrigatórios (`id`, `subject`, `eventDate`) e sintaxe de datas.
   - Desduplica IDs repetidos internamente no arquivo, preservando a primeira ocorrência.
   - Gera prévia detalhada com contagem por sujeito e amplitude de datas antes de qualquer gravação.
2. **Modo Mesclar (`restoreBackupMerge`)**:
   - Consulta as chaves existentes via `store.getAllKeys()`.
   - Adiciona apenas registros cujos IDs não constem na base local, preservando anotações prévias e evitando duplicações.
3. **Modo Substituição Integral (`restoreBackupReplace`)**:
   - Executa `store.clear()` e a re-inserção de todos os registros dentro de uma única transação `readwrite`.
   - Se ocorrer qualquer exceção durante a inserção, o método aciona `tx.abort()`, fazendo com que a API nativa do IndexedDB desfaça todas as alterações e restaure o estado anterior sem perda parcial.
   - Exige confirmação explícita por checkbox antes de habilitar o botão de ação.

---

## 5. Assistente experimental (fora desta distribuição)

O projeto mantém, em desenvolvimento privado, um assistente experimental de perguntas livres (busca em evidências, respostas simuladas e integração opcional com um modelo de IA). Ele foi retirado desta distribuição porque testes internos encontraram respostas tranquilizadoras a relatos preocupantes, e o conteúdo e os critérios de sinais de alerta ainda não têm revisão profissional.

- **A separação é temporária.** Os módulos de IA podem voltar a ser abertos depois das revisões clínica e regulatória, em especial se fizerem parte de uma solução financiada com compromisso de código aberto.
- **Versões anteriores** deste repositório (até o commit `7d43d3f`, outubro de 2026) incluem uma versão antiga do assistente e do gateway, com a aba ativa. Elas continuam no histórico, sob Apache 2.0, e **não devem ser usadas** para orientar gestantes ou famílias.

## 6. Implantação por outras organizações

- `npm run build` gera a pasta `dist/`, que pode ser servida em qualquer hospedagem estática com HTTPS (obrigatório para o service worker).
- O app não precisa de variáveis de ambiente nem de servidor.
- Quem distribuir uma versão modificada responde pelo próprio conteúdo de saúde e pelas proteções que mantiver ou retirar (veja `CONTENT.md` e `TRADEMARKS.md`).
