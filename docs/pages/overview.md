# Overview

## What is ABI7 Grid?

**ABI7 Grid** is a dependency-free JavaScript library for tiled grids and photo galleries: Masonry, Grid and Justified layouts, virtualization for tens of thousands of cards, Drag & Drop and a plugin system. It is written in plain ES2022 and needs no framework.

ABI7 Grid is a JavaScript grid library based on the original Abi7Grid code created by Alexander Momot.

> The core consists of exactly **two** source files: `src/abi7-grid.js` and `src/abi7-grid.css` (plus the minified `dist/*.min.*` generated from them). Everything else is a plugin that you load only when you need it.

## Key features

- **Three built-in layouts** — Masonry, Grid, Justified. Custom algorithms are added by a plugin without changing the core.
- **Layout-independent virtualization** — only visible cards are in the DOM; the DOM Pool reuses nodes; adaptive overscan; Scroll Anchoring; `scrollToIndex`.
- **Partial recalculation** — inserting or removing a record recalculates geometry from the changed index, not from the start.
- **Plugins** — isolated Plugin API, automatic cleanup, compatibility and dependency checks.
- **Drag & Drop** — mouse and touch (Pointer Events), auto-scroll, works with virtualization and any layout.
- **Safe by default** — the standard card is built with the DOM API and URLs are filtered, so HTML in data is not executed.
- **Correct `destroy()`** — removes listeners, observers, timers and plugins and restores the container.

## Architecture overview

Each component does one thing and talks to the others through a narrow interface.

| Component | Responsible for | Does not know about |
|---|---|---|
| Layout Engine | geometry: where each card is and how large | the DOM, virtualization |
| Virtualization Engine | which cards must be in the DOM | the concrete layout |
| DOM Renderer | creating, binding and reusing card elements | layout algorithms |
| Plugin Manager | installing plugins and their frozen `api` | the core's internal arrays |
| Interaction Manager | clicks and Drag & Drop | the concrete layout |

Details: [Architecture Overview](#/architecture) and [Internal Architecture](#/internals).

## Browser compatibility

The code is plain ES2022 (private class fields, `WeakRef`, `AbortController`, `queueMicrotask`) and the minified build targets `es2022`. Current evergreen browsers are the intended targets.

- `ResizeObserver` is used for container size changes (`autoResize`) and for `virtualization.measure`. If it is missing, call `refresh()` yourself.
- `IntersectionObserver` is optional; it only feeds the `visibility:change` event and a size check when the grid becomes visible.
- Pointer Events are used for clicks and Drag & Drop.
- **Not verified:** the automated tests run in jsdom, not in real browsers. Visual behavior (animation, touch, scrollbars) has not been tested on devices. Test in the browsers you support.

## Performance philosophy

1. **Compute geometry from data, not from the DOM.** Sizes come from `width`/`height` or `aspectRatio` in the records, so no layout thrashing and no waiting for images.
2. **Touch the DOM in one place.** Only the DOM Renderer creates or changes card elements, and it writes `transform`, `width` and `height` only when the geometry epoch changed.
3. **Do as little as possible per frame.** Work is batched into one `requestAnimationFrame`; repeated requests in a frame are merged.
4. **Mount only what is needed.** Virtualization limits DOM size, independent of layout.
5. **Recalculate from the changed position.** Layouts support partial recalculation.

See [Performance](#/performance).

## Community vs Commercial license

| Capability | Community | Single Developer | Unlimited Developers |
|---|---|---|---|
| Personal non-commercial use | Yes | Yes | Yes |
| Learning and testing | Yes | Yes | Yes |
| Commercial projects | No | Yes | Yes |
| Client projects | No | Yes | Yes |
| Commercial websites | No | Yes | Yes |
| One developer | Yes, non-commercially | Yes | Yes |
| Unlimited developers | No | No | Yes |
| Price | Free | $29 | $199 |
| Where to get it | GitHub | https://abi7.com | https://abi7.com |

**ABI7 Grid Community is free for non-commercial use only.** Commercial use requires a paid license, sold only at https://abi7.com. The binding terms are in the license documents; see the [License Overview](#/license).

## Known limitations

- ES modules only. There is no UMD/IIFE build and no classic `<script src>` form; ES modules do not load from `file://` pages.
- The scroll container is the grid element itself. Scrolling `window` or an external container is not supported.
- With `virtualization.measure`, dynamic heights are refined only for cards that have been inside the window.
- A change near the start of the list recalculates the geometry below it (O(n)).
