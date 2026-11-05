# Third-Party Notices

> Draft for legal review. This file records what was found in the repository when it was prepared. It does not give legal conclusions about rights in third-party components, and it must be re-checked before every release.

## Software (what you receive)

**No third-party source code is bundled in the Software.** The runtime files `src/abi7-grid.js`, `src/abi7-grid.css`, `dist/*` and `plugins/*` contain no copied third-party code and have no runtime dependencies. This was checked by reading the import statements (none in the core and none in the plugins) and by the repository tests, which assert that plugins do not import the core.

The demonstration "photos" in `examples/shared/photos.js` are SVG gradients generated in code. No photographs, fonts or icon sets are included.

## Development and build tools (not distributed)

These are used to build and test the repository. They are installed from npm, are not copied into `dist/`, and keep their own licenses, which you can read in their packages.

| Tool | Used for |
|---|---|
| esbuild | `tools/build.js` — minification of `dist/*.min.*` |
| jsdom | the automated tests in `tests/` |
| Vite, `vite-plugin-singlefile`, TypeScript, Tailwind CSS plugins and their dependencies | building the documentation site (`npm run build`); the site does not use React or Tailwind at runtime |

The complete dependency list with exact versions is in `package-lock.json`.

## Documentation site — runtime resources

- **Mermaid** is loaded by the visitor's browser from the jsDelivr CDN only on pages that contain diagrams (`https://cdn.jsdelivr.net/npm/mermaid@11/`). It is not stored in this repository and is under its own license. If the CDN is unreachable, the page shows the diagram source instead.
- The site makes no other third-party requests and loads no web fonts.

## GitHub Actions (CI only)

The workflows in `.github/workflows/` use `actions/checkout`, `actions/setup-node`, `actions/upload-pages-artifact` and `actions/deploy-pages`. They run on GitHub's infrastructure and are not part of the Software.

## What the Licensor must still verify

1. That no code, text or artwork written by someone else is contained in the repository (see `COPYRIGHT.md`, "Provenance notes").
2. That the license terms of every development tool listed above permit its use in your build process. They are not redistributed here.
3. That the CDN-loaded diagram library is acceptable for your privacy policy (the visitor's browser contacts jsDelivr).
