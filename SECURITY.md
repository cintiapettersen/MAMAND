# Política de Segurança e Divulgação Responsável

## Escopo e arquitetura

O **MAMAND** é uma Progressive Web App (PWA) *local-first* e estática:

- Os dados inseridos pela pessoa usuária permanecem exclusivamente no dispositivo (`IndexedDB` e `localStorage`), sem contas ou servidor central de aplicação.
- O módulo `gateway/` é desacoplado e está **inativo e sem deploy** na operação pública atual.
- Conteúdos clínicos sem revisão profissional e assistente de IA permanecem bloqueados no aplicativo público.

## Como reportar uma vulnerabilidade

Se você identificar uma falha de segurança, exposição indevida de dados ou risco clínico/técnico no código público do MAMAND:

1. **Não** abra uma issue pública com detalhes exploráveis.
2. Envie o relato de forma privada por um dos canais abaixo:
   - **GitHub Private Vulnerability Reporting** (aba *Security → Advisories* do repositório), quando disponível; ou
   - **E-mail:** `hello@mamand.app` (assunto sugerido: `[SECURITY] Descrição breve`).
3. Inclua, sempre que possível:
   - Passos para reproduzir ou arquivo/linha afetada;
   - Impacto potencial (ex.: XSS, vazamento no Service Worker, exposição de dados locais ou regressão de contenção clínica P0);
   - Versão ou commit analisado.

## Compromisso de resposta

- Confirmaremos o recebimento do relato em até **5 dias úteis**.
- Avaliaremos a severidade e trabalharemos em correção antes da divulgação pública coordenada.
- Este canal destina-se exclusivamente a segurança técnica e proteção de dados — **não** realiza atendimento médico ou suporte clínico.
