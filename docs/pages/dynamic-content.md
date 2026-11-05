# Dynamic Content

All data changes go through the public API, so the core always knows about them. Direct DOM edits are not observed.

## Adding cards

`grid.insert(items, { at })` — `at` is `'start'`, `'end'` (default) or an integer index. It returns the new ids. The geometry is recalculated **from the insertion index**; the core emits `item:insert` and then `layout:start` / `layout:end`. If the insertion happens above the viewport, Scroll Anchoring keeps the visible content in place (option `scrollAnchoring`).

## Removing cards

`grid.remove(idOrIds)` returns the number of removed records and emits `item:remove`. Removing from the start recalculates everything below it.

## Changing content

`grid.update(id, patch)` merges the patch into the record, re-binds the card (so `renderItem` or the standard card is applied again) and emits `item:update` with `previous` and `changed`. If the patch changes the width, height or aspect ratio fields, the geometry is invalidated from that index and the cached measured height is dropped.

## Changing sizes

- Item size: change `width`/`height`/`aspectRatio` in the record with `update()`.
- Layout size options: `rebuild({ layoutOptions })`.
- Container size: automatic with `autoResize`, otherwise `refresh()`.

## Recalculating positions

All changes call `invalidate(from, reason)`. Repeated invalidations in the same frame keep the lowest `from` and are executed by a single layout pass in the next animation frame. `grid.flush()` runs the pending pass immediately.

## DOM updates

Only the DOM Renderer writes card elements. It re-applies `transform`, `width` and `height` when the geometry epoch changed, and re-writes content when a card is bound.

## Images

The standard card creates `<img class="abi7-media" loading="lazy" decoding="async">`. **The core does not listen to image `load` events**; geometry comes from the record. Provide `width` and `height` (or `aspectRatio`) for every record. If the real image has another ratio, update the record when you know it:

```js
img.addEventListener('load', () => grid.update(id, { width: img.naturalWidth, height: img.naturalHeight }));
```

:::demo image-loading

## Asynchronous content

`data` can be a function returning a Promise. It receives `{ signal, source }`. A newer load aborts the signal of the older one, and a late response from an outdated request is ignored. Use `grid.whenReady()` to wait for the first layout and `reach:end` for infinite scrolling.

:::demo lazy-loading

## Editing elements in the browser's DOM inspector

The core has no `MutationObserver`. What happens after you edit a card in DevTools:

| You changed | What happens |
|---|---|
| `transform`, `width`, `height` of a card | Rewritten on the next layout pass (for example `refresh()`, a resize, or any data change that causes layout) |
| Text or children inside a card | Kept until the card is re-bound: `reload()`, `update(id)`, or reuse of the element for another record |
| Classes you added by hand | Removed when the card is re-bound (the core rewrites `className`); use `api.renderer.toggleClass()` or `itemClassName` instead |
| Inline styles the core does not manage (for example `outline`) | Kept on that element, but the element may be reused for another record while scrolling |

For persistent per-record changes use `api.renderer.toggleClass()` in a plugin or `renderItem`.

:::demo dom-inspector

## Complete dynamic example

:::demo dynamic
