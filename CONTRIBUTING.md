# Contributing to ABI7 Grid Community

**Need ABI7 Grid for commercial projects? Get a commercial license at https://abi7.com**

Thank you for helping. By contributing you agree to the terms in this file.

## Contribution license

Contributions are accepted under section 10.4 of the [Community License](licenses/LICENSE-COMMUNITY.md): you confirm that you have the right to submit the work, and you grant the Licensor (Alexander Momot) a perpetual, worldwide, irrevocable, royalty-free license to use, modify, distribute and sublicense it as part of ABI7 Grid, including in Commercial Editions. Do not submit code that you copied from another project or that you do not have the right to license this way.

## Rules for the core

- The core is **exactly two files**: `src/abi7-grid.js` and `src/abi7-grid.css`. Do not split it.
- No runtime dependencies, no build step required for users, ES modules only.
- Keep the architecture: one component = one responsibility; only `DOMRenderer` touches card DOM.
- Comments explain *why*, not *what*.
- New features go into plugins when the Plugin API allows it.
- Do not add dependencies without discussion. Do not add a license file or a license identifier that conflicts with `licenses/`.

## Workflow

```bash
npm install
npm run build:lib   # regenerates dist/ — commit the result with your change to src/
npm run validate    # build:lib + check + test
```

`npm run check` fails if `dist/*.min.*` are out of date, versions disagree, a file lacks the license header, documentation links are broken, or a stray permissive-license file appears.

## Documentation

Every public method, option and event must be described in `docs/pages/api-*.md`; tests enforce this. Examples live in `examples/<name>/` (`index.html` + `demo.js`) and must be registered in `docs/viewer.js`.

## Pull requests

Describe what changed and why, link the issue, and tick the checklist in the PR template.
