# Getting Started

## What you will need

- Files `dist/abi7-grid.js` and `dist/abi7-grid.css` (or `*.min.*`).
- Modern Browser (ES2022, `ResizeObserver`; `IntersectionObserver` — optional).
- **Static HTTP server.** ES modules are not loaded from pages `file://`. Anyone will do: `npx serve .`, `python3 -m http.server`, `npm run dev`.

## File structure

```text
dist/
├── abi7-grid.js # Core, readable
├── abi7-grid.min.js # Core, minified (+ .map)
├── abi7-grid.css # Core styles
└── abi7-grid.min.css
plugins/
└── selection/selection.js selection.css # each plugin separately
```

Rebuild minified files from `src/` one team: `node tools/build.js`.

## 1. HTML container

A container is also a scrolling container, so it **need height** (CSS or option `height`). It should be empty.

```html
<link rel="stylesheet" href="./dist/abi7-grid.css">

<div id="gallery" style="height: 600px"></div>
```

## 2. Initialization and data

Data is an array of objects. The core needs `id` and sizes (`width` + `height` or `aspectRatio`): geometry is calculated using them, without waiting for the images to load. For a standard card, fields are used `src` and `title`.

```html
<script type="module">
  // Connecting Core. Plugin code is not included.
  import { ABI7Grid } from './dist/abi7-grid.js';

  const photos = [
    { id: 'p1', src: 'img/1.jpg', width: 1200, height: 800, title: 'Mountains' },
    { id: 'p2', src: 'img/2.jpg', width: 800,  height: 1200, title: 'Forest' }
  ];

  const grid = new ABI7Grid('#gallery', {
    layout: 'masonry',
    data: photos,
    layoutOptions: { gap: 12, minWidth: 180, maxColumns: 5 }
  });

  grid.on('ready', () => console.log('first layout completed'));
</script>
```

If the pictures don't have dimensions, use `layoutOptions.aspectRatio` (all cards are of the same proportion) or `virtualization.measure` (height determined by content), see [Options](#/api-options).

## 3. Your type of card

```js
const grid = new ABI7Grid('#cards', {
  data: users,                               // [{ id, name, bio }]
  layoutOptions: { aspectRatio: 0 },         // the height will be determined by the contents...
  virtualization: { measure: true, estimatedHeight: 140 },
  renderItem(user, el) {
    // Element is reused: update content in-place.
    el.replaceChildren();
    const h = document.createElement('h4');
    h.textContent = user.name;               // textContent is safe
    el.append(h);
  }
});
```

## 4. Connecting plugins

```html
<link rel="stylesheet" href="./plugins/selection/selection.css">
<script type="module">
  import SelectionPlugin from './plugins/selection/selection.js';
  grid.use(SelectionPlugin, { multiple: true });
  grid.getPlugin('selection').selectAll();
</script>
```

Plugin styles are connected separately and only if the plugin is used.

## 5. Destruction

```js
grid.destroy();   // listeners, observers, timers, plugins, DOM - everything is cleared
```

After `destroy()` you can create a new grid on the same container.

## Connection: ES modules and script tags

| Method | Support |
|---|---|
| ES modules: `import { ABI7Grid } from './dist/abi7-grid.js'` inside `<script type="module">` | ✅ supported |
| Minified version: `./dist/abi7-grid.min.js` (same ES module format) | ✅ supported, tests run on both versions |
| Classic `<script src="abi7-grid.js">` without `type="module"` and global variable | ❌ **not supported**: UMD/IIFE assembly not implemented |

If you need a classic `<script>`, wrap the call in `<script type="module">` and, if necessary, assign `window.ABI7Grid = ABI7Grid`. Plugins are exported via `export default`, that is, they are also ES modules.

## First grid

:::demo basic

## What's next

Layout algorithms - on the [Layouts] page](#/layouts); performance on large arrays - [Virtualization](#/virtualization); extensions - [Plugins](#/plugins).
