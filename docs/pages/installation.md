# Installation

ABI7 Grid has no runtime dependencies and needs no bundler. You load one JavaScript module and one stylesheet.

## Files

| File | Purpose |
|---|---|
| `dist/abi7-grid.js` | Core, readable (a byte-for-byte copy of `src/abi7-grid.js`) |
| `dist/abi7-grid.min.js` + `.map` | Core, minified with source map |
| `dist/abi7-grid.css` | Core styles (all selectors start with `.abi7-`) |
| `dist/abi7-grid.min.css` | Core styles, minified |
| `plugins/<name>/<name>.js` (+ `.css`) | Optional plugins, one directory each |

## Local installation

1. Download or clone https://github.com/abilogic/abi7-grid.
2. Copy `dist/abi7-grid.min.js` and `dist/abi7-grid.min.css` (and the plugins you need) into your project.
3. Serve the project over HTTP. ES modules do not load from `file://`; any static server works: `npx serve .` or `python3 -m http.server`.

## CDN installation

ABI7 Grid is not published to a package registry or an official CDN. Once the repository is public and a release tag exists, GitHub-backed CDNs such as jsDelivr can serve the files directly from the repository. The URL pattern is shown below; it will work only after the repository is public and the tag `v1.0.0` exists, and it has not been tested.

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/abilogic/abi7-grid@v1.0.0/dist/abi7-grid.min.css">
<script type="module">
  import { ABI7Grid } from 'https://cdn.jsdelivr.net/gh/abilogic/abi7-grid@v1.0.0/dist/abi7-grid.min.js';
</script>
```

> Using a CDN does not change the license. The Community License covers non-commercial use only. Need ABI7 Grid for commercial projects? Get a commercial license at https://abi7.com

## npm

`package.json` is prepared for a future npm release but the package is **not published**. See `docs/publishing.md` in the repository for the publishing checklist. The `license` field is `SEE LICENSE IN licenses/LICENSE-COMMUNITY.md` because the Community License is not an open-source license.

## Basic HTML setup

```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="stylesheet" href="./dist/abi7-grid.min.css">
  <style>#gallery { height: 600px; }</style>
</head>
<body>
  <div id="gallery"></div>
  <script type="module">
    import { ABI7Grid } from './dist/abi7-grid.min.js';

    const data = Array.from({ length: 30 }, (_, i) => ({
      id: 'p' + i, title: 'Item ' + i, width: 600, height: 400 + (i % 5) * 80
    }));

    const grid = new ABI7Grid('#gallery', { data });
  </script>
</body>
</html>
```

The container must be **empty** and must have a **height**: it is the scroll container.

## First grid instance

`new ABI7Grid(target, options)` takes a selector or an element. With `autoRender: true` (default) it starts in a microtask. Use `await grid.whenReady()` to wait for the first layout, and `grid.destroy()` to remove everything the grid added.

## Basic configuration

```js
const grid = new ABI7Grid('#gallery', {
  layout: 'masonry',                                  // 'masonry' | 'grid' | 'justified' | plugin layout
  data,                                               // array, function or Promise
  fields: { src: 'url' },                             // map your property names
  layoutOptions: { gap: 12, minWidth: 180, maxColumns: 5 },
  virtualization: { enabled: true, overscan: 400 },
  animation: { enabled: true, duration: 300 }
});
```

Every option is documented in [Options](#/api-options). Next: [Quick Start](#/getting-started).
