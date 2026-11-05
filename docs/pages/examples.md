# Examples

Each example — **real ABI7 Grid** (same `dist/abi7-grid.js`) launched in an iframe. The code in the tabs are the same files that are executed in the demo: there can be no discrepancies. The files are in `examples/<name>/` and work as independent pages (via any static server: `examples/basic/index.html`).

Shared file `examples/shared/photos.js` creates test data and SVG “photos” (there are no external images, everything works offline) - it is shown in the tab `photos.js` each example.

List: [Basic](#/examples/basic), [Masonry](#/examples/masonry), [Grid](#/examples/grid), [Justified](#/examples/justified), [Virtualization](#/examples/virtualization), [Selection](#/examples/selection), [Lightbox](#/examples/lightbox), [Horizontal](#/examples/horizontal), [Connected Grids](#/examples/connected-grids), [Custom Plugin](#/examples/custom-plugin).

## Basic

**Problem:** create a grid in several lines and respond to clicks.

:::demo basic

- **Methods:** designer, `on()`.
- **Settings:** `layout`, `data`, `fields.src` (function), `layoutOptions.gap/minWidth/maxColumns`.
- **Events:** `item:click` (delegation, one listener per container), `ready` (after the first layout).
- **What to change:** replace `layout` on `'grid'` or `'justified'`; pass on the real ones `src` instead of a function `photoSrc`; add `layoutOptions.maxWidth`.

## Masonry

**Problem:** dynamic list - adding, deleting, recalculating and changing layout settings.

:::demo masonry

- **Methods:** `insert(item, { at: 'start' })`, `remove(id)`, `refresh()`, `rebuild({ layoutOptions })`, `getItems()`, `getState()`.
- **Settings:** `layoutOptions.gap`, `minWidth`, `maxColumns`; `animation.duration`.
- **Events:** `layout:end` (number of columns, duration, `from` — from which index it was recalculated), `item:insert`, `item:remove`, `item:click`.
- **What to watch:** when added to the beginning `from` = 0, when the last card is removed - large `from` (partial recalculation).
- **What to change:** insert at the end (`at: 'end'`); `layoutOptions.columns: 3`; `animation.enabled: false`.

## Grid

**Problem:** classic grid with customizable columns, proportions and page indents.

:::demo grid

- **Methods:** `rebuild({ layoutOptions })` — the only way to apply the new settings.
- **Settings:** `columns` (0 - automatically by `minWidth`), `aspectRatio`, `gap`, `minWidth`.
- **Events:** `layout:end` with `info.columns`, `info.rows`, `info.itemWidth`.
- **What to change:** `layoutOptions.width: 200` (fixed cell width), `align: 'center'`, `gapX` / `gapY` separately.

## Justified

**Problem:** rows of the same height and different widths, as in photo hosting sites.

:::demo justified

- **Methods:** `rebuild()`, `getVisibleItems()`, `getState().layoutInfo`.
- **Settings:** `targetRowHeight`, `minRowHeight`, `maxRowHeight`, `gap`, `lastRow` (`left` / `center` / `right` / `justify`).
- **Events:** `layout:end`, `scroll:stop`.
- **What to watch:** cards in visible rows match `rect.height`; the total width of the row is equal to the width of the container, except for the last row.
- **What to change:** a min/max range that is too narrow will cause the layout to sacrifice height accuracy but not width padding.

## Virtualization

**Problem:** show 1,000 – 50,000 cards and see how many DOM nodes are actually created.

:::demo virtualization

- **Methods:** `setData()`, `rebuild({ virtualization })`, `scrollToIndex()`, `getState().virtualization`.
- **Settings:** `virtualization.overscan`, `adaptiveOverscan`, `maxOverscan`, `poolSize`.
- **Events:** `viewport:update`, `scroll:stop`.
- **What to watch:** for any size of the array, dozens of nodes remain “in the document”; `created` does not grow when scrolling for a long time, but `reused` — growing; when scrolling quickly `overscan` after/before increases (adaptive).
- **What to change:** `virtualization.enabled: false` on 1,000 cards (all in DOM) for comparison.

## Selection

**Problem:** selecting cards by clicking, with modifiers and programmatically.

:::demo selection

- **Connection:** `grid.use(SelectionPlugin, { multiple: true })`, access — `grid.getPlugin('selection')`.
- **Plugin Methods:** `select`, `deselect`, `toggle`, `clear`, `selectAll`, `getSelected`, `getSelectedItems`, `isSelected`, `count`.
- **Events:** `selection:change` (`selected`, `added`, `removed`, `source`).
- **What to watch:** the selection remains on the card when scrolling and returning - the class is bound to the id, not to the DOM node.
- **What to change:** `{ multiple: false }`; `{ toggleOnClick: true }`; your class name via `className`.

## Lightbox

**Problem:** open the photo on top of the grid, scroll through, close.

:::demo lightbox

- **Connection:** `grid.use(LightboxPlugin, { loop, animation, getSrc, getCaption })`.
- **Plugin Methods:** `open(id)`, `close()`, `next()`, `prev()`, `isOpen()`, `current()`.
- **Events:** `lightbox:before-open` (cancelable), `lightbox:open`, `lightbox:change`, `lightbox:close`.
- **Keyboard:** Escape, ←, →, Home, End. Mobile: swipe left/right. Closing: cross, background, Escape.
- **What to change:** `animation: 0`; `closeOnBackdrop: false`; in `getSrc` — real URL of the original.

## Horizontal

**Problem:** horizontal strip of 3,000 cards of varying widths.

:::demo horizontal

- **Connection:** `grid.use(HorizontalLayout)` (layout plugin); `layout: 'horizontal'` specified before connection - the grid is waiting for registration.
- **Methods:** `rebuild({ layoutOptions })`, `scrollToIndex(i, { align: 'center' })`, `getState().contentWidth`.
- **Settings:** `layoutOptions.height`, `gap`, `itemWidth`.
- **What to watch:** the total width is millions of pixels, and there are dozens of cards in the DOM; `scrollLeft` changes, `scrollTop` — no.
- **What to change:** `itemWidth: 160` (same width), `align: 'center'`.

## Connected Grids

**Problem:** transfer of cards between two independent grids.

:::demo connected-grids

- **Connection:** `use(ConnectedGrids, { group, name })` on **everyone** grid groups; the plugin checks compatibility (major core version, `fields.id`, uniqueness `name`).
- **Plugin Methods:** `transfer(id, targetName, { at })`, `members()`.
- **Events:** `connected-grids:before-transfer` (cancelable), `connected-grids:transfer`, `connected-grids:receive`; core: `drag:start`, `drag:move`, `drag:end`, `item:insert`, `item:remove`.
- **What happens during the transfer:** `drag:end` with `outside: true` → the plugin finds the grid under the pointer → `remove` in the source and `insert` in the receiver (both are recalculated) → events.
- **What to change:** `copy: true`; `accept: (record) => record.title !== 'Photo 3'`.

## Custom Plugin

**Problem:** write a plugin from scratch — `CounterPlugin`, which counts clicks on cards. A detailed analysis of 17 points is in the section [Creating a plugin](#/plugin-development/point-by-point-analysis).

:::demo custom-plugin

- **Connection:** `grid.use(CounterPlugin, { step: 1, badges: true })`, `grid.unuse('counter')`.
- **Plugin Methods:** `getTotal()`, `getCount(id)`, `top(n)`, `reset()`.
- **Plugin Events:** `counter:change`, `counter:reset`.
- **What to change:** `{ step: 5 }`, `{ badges: false }`, `filter: (record) => record.title !== 'Photo 1'`.
