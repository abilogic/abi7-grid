# Publishing checklist (for the maintainer)

This file is for **future** use. Nothing has been published: no npm package, no tag, no GitHub release.

## Before any publication

1. **Legal review.** Have a lawyer review everything in `licenses/` and complete the `[bracketed]` fields (legal name, address, governing law, contacts). Resolve the provenance questions in `licenses/COPYRIGHT.md`.
2. **Decide the open points** marked **[CONFIRM]** in the commercial licenses (payment model, update period, term, refund policy).
3. `npm run validate` must pass.

## GitHub repository and Pages

1. Create https://github.com/abilogic/abi7-grid and push the `main` branch.
2. In *Settings → Pages*, set the source to **GitHub Actions**. The `pages` workflow builds the documentation with `npm run build` and deploys `dist/`.
3. The site address will be `https://abilogic.github.io/abi7-grid/` (check it after the first run and fix the README if it differs).
4. Tag a release: `git tag v1.0.0 && git push --tags` (the CDN examples in the docs assume this tag).

## npm (optional, later)

The package name is `abi7-grid`; its `license` field is `SEE LICENSE IN licenses/LICENSE-COMMUNITY.md` and `licenseNotice` repeats that the package is not open source. npm has no standard identifier for a non-commercial license, so the README and the license files travel in the package (`files`).

```bash
npm run validate
npm pack --dry-run          # inspect the file list: dist/, plugins/, licenses/, LICENSE, README.md, CHANGELOG.md
npm login                   # you, interactively, with 2FA
npm publish                 # only after the checklist above
```

Rules: publish only from a clean tag; never publish with a token stored in the repository; do not rename the license field to a standard open-source identifier; keep the versions in `package.json`, `src/abi7-grid.js` (`VERSION`) and `CHANGELOG.md` equal (`npm run check` verifies this).
