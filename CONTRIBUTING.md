**Language:** English | [Português](docs/pt-BR/CONTRIBUTING.md)

# Contributing to MAMAND

Thank you for wanting to help!

## Contribution Licensing

- **Code and repository texts:** all accepted contributions to this repository are licensed under the **Apache License 2.0** (Section 5 of the license). Any future adoption of CC BY 4.0 for specific original educational texts remains solely a pending proposal in [CONTENT.md](CONTENT.md) and is not currently in force.
- **Copyright:** you retain the copyright to your contributions. We do not require copyright assignment.

## Developer Certificate of Origin (DCO)

We use the [Developer Certificate of Origin 1.1](https://developercertificate.org/).
By signing off a commit, you certify that you have the right to submit that contribution under the project's license.

Sign commits with `-s`:

```bash
git commit -s -m "Describe your change"
```

This appends a line with your real name and email address:

```text
Signed-off-by: Your Name <your@email>
```

Pull requests containing commits without a `Signed-off-by` line will not be accepted.

## Health Content

- Any clinical content contribution must specify the official source, including publication, edition, and page or section.
- New content always enters as `validationStatus: 'pending_review'`.
- Do not copy verbatim passages or images from third-party publications. Write an original summary and cite the source.
- Only the project's clinical review process may change an item to `clinically_reviewed`, always with a `clinicalReview` record (reviewer name, credential, date, and reference). Citing an institution is not clinical review: in that case, the status is `source_based`.

## AI Tools

Contributions created with the assistance of AI tools are accepted. Whoever signs the DCO remains responsible for reviewing the output and ensuring they have the right to submit it. Disclose AI assistance in the pull request description.

## Trademark

Contributing does not grant the right to use the MAMAND name or logo. See [TRADEMARKS.md](TRADEMARKS.md).

## Before Opening a Pull Request

```bash
npm ci
npm run typecheck
npm test
npm run build
```
