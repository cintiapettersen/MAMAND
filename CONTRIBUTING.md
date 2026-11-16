# Como contribuir com o MAMAND

Obrigada por querer ajudar!

## Licença das contribuições

- **Código e textos do repositório:** todas as contribuições aceitas neste repositório entram sob a **Apache License 2.0** (seção 5 da licença). Eventual adoção futura de CC BY 4.0 para textos educativos originais específicos permanece apenas como proposta pendente em `CONTENT.md` e não está vigente.
- **Copyright:** você mantém o copyright do que escreveu. Não pedimos cessão
  de direitos.

## Certificado de Origem do Desenvolvedor (DCO)

Usamos o [Developer Certificate of Origin 1.1](https://developercertificate.org/).
Ao assinar um commit, você declara que tem o direito de enviar aquela
contribuição sob a licença do projeto.

Para assinar, faça o commit com `-s`:

```
git commit -s -m "Descrição da mudança"
```

Isso adiciona ao commit uma linha com seu nome e e-mail reais:

```
Signed-off-by: Seu Nome <seu@email>
```

Pull requests com commits sem essa linha não são aceitos.

## Conteúdo de saúde

- Toda contribuição de conteúdo clínico precisa indicar a fonte oficial, com
  publicação, edição e página ou seção.
- Conteúdo novo entra sempre como `validationStatus: 'pending_review'`.
- Não copie trechos literais nem imagens de publicações de terceiros. Escreva
  um resumo próprio e cite a fonte.
- Só a revisão clínica do projeto pode mudar um item para
  `clinically_reviewed`, sempre com o registro em `clinicalReview` (quem
  revisou, credencial, data e referência). Citar uma instituição não é revisão
  clínica: nesse caso o status é `source_based`.

## Ferramentas de IA

Contribuições feitas com ajuda de ferramentas de IA são aceitas. Quem assina
o DCO continua responsável por revisar o resultado e garantir que pode
enviá-lo. Indique o uso de IA na descrição do pull request.

## Marca

Contribuir não concede o direito de usar o nome ou o logotipo MAMAND. Veja
`TRADEMARKS.md`.

## Antes de abrir um pull request

```
npm ci
npm run typecheck
npm test
npm run build
```
