# Core Architecture

Core - one file `abi7-grid.js`, organized into logical sections. Inside there are classes and functions, outside there is one class `ABI7Grid`.

## File Sections

| № | Section | Purpose |
|---|---|---|
| 1 | Utilities | auxiliary functions, `ABI7Error`, `PluginError`, `mergeOptions`, `safeUrl`, semver |
| 2 | EventEmitter | event bus; handler errors do not interrupt others |
| 3 | OptionsManager | defaults, concatenation, validation |
| 4 | DataStore | records, id array, `Map id → index` |
| 5 | GeometryStore | coordinates in `Float64Array`, spatial index |
| 6 | Layout Engine | `LayoutRegistry`, `LayoutManager`, Masonry, Grid, Justified |
| 7 | VirtualizationEngine | which indexes to show |
| 8 | DOMRenderer | DOM elements and DOM Pool |
| 9 | AnimationManager | CSS transition during rebuild |
| 10 | PluginManager | installing plugins, Plugin API |
| 11 | InteractionManager | Clicks and Drag & Drop |
| 12 | LifecycleManager | `AbortController`, timers, `requestAnimationFrame` |
| 13 | GridInstance | internal “engine” - connects all components |
| 14 | Public API | class `ABI7Grid` (thin façade) |

## Data flow

```text
data (DataStore)
   │  insert / remove / update / move / setData
   ▼
invalidate(from, reason) ──► requestAnimationFrame ──► runLayout()
                                                         │
          LayoutManager.compute(from) ◄──────────────────┘
                   │  ctx.set(i, x, y, w, h)
                   ▼
          GeometryStore (+ spatial index)
                   │
                   ▼
          VirtualizationEngine.select() ──► window indexes + overscan + pinned
                   │
                   ▼
          DOMRenderer.sync()  ──► mount / unmount / DOM Pool ──► DOM
```

1. Any data change causes `invalidate(from, reason)` — geometry starting from index `from` marked obsolete. Multiple calls per frame are combined.
2. In the nearest frame `runLayout()` calls layout with `ctx.from`. Layout records coordinates via `ctx.set()`. For Masonry, control points for column heights are used every 128 elements, for Grid - the upper boundaries of rows, for Justified - a list of already formed rows: recalculation begins from the point of change.
3. The spatial index (baskets along the main axis) is reconstructed from the geometry.
4. The Virtualization Engine queries the index for elements crossing the window + overscan and adds the pinned ones.
5. DOM Renderer compares this set with the already mounted one: the excess goes into the pool, the missing is taken from the pool (or created) and bound to the record.

## Limits of responsibility

- **Layout Engine ↔ everything else.** Layout gets `ctx` (dimensions, `aspect()`, `resolveHeight()`, `rect()`, `set()`) and returns the size of the content. DOM, virtualization and core arrays are not available to it.
- **Virtualization ↔ Layout.** Virtualization only sees rectangles in `GeometryStore` and the scroll axis. Therefore, it works equally for Masonry, Grid, Justified, horizontal ribbon and any custom layout.
- **Renderer ↔ plugins.** The plugin does not receive DOM cards directly: it works through `api.renderer` (`toggleClass`, `getElement`, events `item:mount` / `item:unmount`).
- **Plugin Manager ↔ core.** Plugin sees frozen `api` of nine interfaces; arrays `DataStore` and `GeometryStore` it doesn't have any - only copies and methods.

## Life cycle

```text
new ABI7Grid()  ──►  microtask: _start()  ──►  data:load-start/end  ──►  layout  ──►  ready
      │                    │                                                     │
   use(plugin) listeners, observers working state
                                                                                  │
                                                          destroy(): events → plugins → drag → observers
                                                                     → DOM → AbortController → container
```

States `phase`: `new` → `loading` → (`pending`, if the layout has not yet been registered) → `ready` → `destroyed`. If the container is hidden (width 0), the first layout waits for the size to appear.

## Solutions you should know about

| Solution | Reason |
|---|---|
| One `click`-listener on container | The original put 5-7 listeners on each card. |
| Geometry in `Float64Array` | Compact and fast for tens of thousands of elements, no allocations per element. |
| Spatial index of the "basket along the axis" | Window request - O(k), does not depend on layout, does not require `getBoundingClientRect()` for each scroll (as in the original). |
| DOM Pool | Creating nodes is expensive; When scrolling, nodes of dropped cards immediately receive new data. |
| Animation only during lane changes | Otherwise, reused nodes would “fly” across the screen when scrolling. |
| `scrollbar-gutter: stable` | The appearance of a scrollbar does not change the width of the content, so there is no cycle resize → layout → resize; Additionally, there is a fuse (no more than 10 resize recalculations per 500 ms). |
| Reusable nodes + `renderer.toggleClass` | Plugin classes are bound to **post id**, and not to the node - the selection does not “jump” to another card. |
| Plugins don't import Core | The plugin depends only on the contract (`api`), so it doesn't break when Core is recycled. |

## Public API at a glance

```js
// Lifecycle:  render() refresh() rebuild(options) reload() destroy() flush() whenReady()
// Data:       data() setData(list) load(source) insert(items, {at}) remove(id) update(id, patch) move(id, to) getCount()
// Items:      getItem(id) getItems() getVisibleItems()
// Navigation: scrollToIndex(i, opts) scrollToItem(id, opts)
// Plugins:    use(plugin, opts) unuse(name) getPlugin(name) hasPlugin(name) getPlugins()
// Events:     on(name, fn) once(name, fn) off(name, fn)
// State:      getState() isDestroyed()
// Static:     ABI7Grid.registerLayout() unregisterLayout() getLayouts() fromLegacyOptions()
```

More details in [API Reference](#/api-methods).

## Limitations of the current version

- The scroll container is always the grid element itself (scroll `window` and external containers like `grid.scrollbox` in the original, not supported).
- One layout pass processes all the entries below `from` whole: for 50,000 records it's a few milliseconds, but it's O(n) per change at the beginning of the list.
- Dynamic height (`virtualization.measure`) is specified only for cards that have been in the window; heights of cards not yet shown - estimate (`estimatedHeight`).
- Drag & Drop changes the order of entries in the grid itself; maintaining order is the task of the application.
- Classic `<script>`-tags and UMD assembly are not implemented (only ES modules).
