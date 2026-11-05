# Virtualization

Virtualization allows you to display tens of thousands of cards while holding only a few dozen in the DOM. She **does not depend on layout**: receives the finished geometry and decides which indexes need to be mounted.

:::demo virtualization

## How it works

1. Layout recorded the coordinates of all cards in `GeometryStore`; a spatial index was constructed from them.
2. View window = `[scrollTop − overscan, scrollTop + height + overscan]` (along the main axis of the layout) and similarly along the transverse one.
3. The index returns cards that cross the window without traversing all records and without `getBoundingClientRect()`.
4. Renderer compares the result with the DOM: extra nodes are removed into **DOM Pool**, the missing ones are taken from the pool or created.
5. Scrolling is handled by a passive listener and **once per frame** (`requestAnimationFrame`) - heavy calculations for each event `scroll` no.

Check: `grid.getState().virtualization` shows the actual number of mounted elements, pool size and counters `created` / `reused`. In the example above, all numbers are read from this state and from the DOM, rather than being preset.

## Large massifs

For 50,000 cards, the layout is calculated in units of milliseconds, leaving about 30–60 nodes in the DOM. A test in the repository loops through 50,000 entries into 30 positions and checks that `created` remains small and `reused` growing.

```js
const grid = new ABI7Grid('#g', { data: fiftyThousand, virtualization: { overscan: 400 } });
console.log(grid.getState().virtualization.mounted);   // tens, not 50,000
```

## Overscan and Adaptive Overscan

`overscan` — margin in pixels outside the window. More headroom means fewer empty spaces during fast scrolling, but more DOM nodes.

`adaptiveOverscan: true` (default): the core considers the smoothed scroll speed and adds to the headroom in the direction of movement `speed (px/ms) × 300 мс`, but no more `maxOverscan`. At rest the stock returns to `overscan` (event `scroll:stop`). Current values: `getState().virtualization.overscan` → `{ before, after }`.

## DOM Pool

The card has left the window - its node is not destroyed: it is removed from the document and put into the pool (until `poolSize` pieces). When a new entry enters the window, a node is taken from the pool and **gets attached** to her (`renderItem` or standard card updates `<img>` and signature). Unmounting is done before mounting, so when scrolling, almost all nodes are reused. Counters `created` and `reused` in `getState()` show the efficiency of the pool.

Implications for your code:

- Don't store links to `event.element`, `getItem().element` — the node may show a different entry.
- Place any additional markings inside the card on the event `item:mount` and put it away `item:unmount`.
- Classes assigned via `api.renderer.toggleClass(id, cls)`, are bound to the post id and are returned to the element automatically.

## Scroll Anchoring

If the geometry changes above the window (inserting records, resizing, changing settings), the content under the eyes should not “jump”. Before changing, the core remembers **the first visible card and its offset** from the top edge of the window, and after recalculation returns it to the same place. Native `overflow-anchor` disabled so that the browser does not compete with the core. When `scrollTop = 0` the anchor is not applied - the new card is visible immediately. Disabled by option `scrollAnchoring: false`.

## scrollToIndex

```js
grid.scrollToIndex(25000, { align: 'center' });
```

The coordinates are taken from the geometry: no DOM is created for 25,000 intermediate cards. The axis (vertical or horizontal) defines the layout.

## Pinned Items

A pinned card remains in the DOM even outside the window. The core uses this when dragging (otherwise autoscroll would destroy the dragged node), and plugins use it via `api.viewport.pin(id)`.

## Dynamic Size Cache

If the height of the cards is determined by the content (`renderItem` with text), turn on `virtualization.measure: true`. The core observes visible cards through ResizeObserver, stores the measured heights in a cache by id and rebuilds the geometry from the changed card (partial recalculation + Scroll Anchoring). Used before measurement `estimatedHeight`. The measurements converge in one or two passes: as long as the measured height matches the geometry, there is no recalculation, so there are no endless loops.

```js
new ABI7Grid('#g', {
  data: posts,
  layoutOptions: { aspectRatio: 0 },
  virtualization: { measure: true, estimatedHeight: 160 },
  renderItem(post, el) { el.textContent = post.text; }
});
```

## Shutdown

`virtualization: { enabled: false }` mounts **everything** cards - acceptable for small sets (up to a couple of hundred), convenient for printing and tests.

## What causes recalculation and what doesn’t

| Action | Geometry recalculation | Updating the DOM |
|---|---|---|
| Scrolling | no | yes (by index) |
| Changing container height | no (except horizontal layout) | yes |
| Changing the container width | full | yes |
| `insert` / `remove` / `move` | partial (from position) | yes |
| `update` with resizing | partial | yes |
| `update` other fields | no | only this card |
