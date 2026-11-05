# API Reference: Options

The settings are passed as the second argument to the constructor and are changed on the fly via `grid.rebuild(patch)`. Nested objects (`layoutOptions`, `virtualization`, `animation`, `interaction`, `fields`) **unite** with default values, so it is enough to specify only the mutable keys. An incorrect value results in `ABI7Error` with `code: 'INVALID_OPTION'`.

The full set of default values is available in the code: `ABI7Grid.defaults`.

```js
const grid = new ABI7Grid('#gallery', {
  layout: 'masonry',
  data: photos,
  layoutOptions: { gap: 12, minWidth: 180, maxColumns: 5 },
  virtualization: { enabled: true, overscan: 500 },
  animation: { enabled: true, duration: 300 }
});
```

## Core Options

| Name | Type | Default | Description |
|---|---|---|---|
| `layout` | `string` | `'masonry'` | Layout algorithm name: `'masonry'`, `'grid'`, `'justified'` or the name of the layout plugin. If the layout has not yet been registered, the grid is waiting for registration (state `pending`). |
| `layoutOptions` | `object` | `{}` | For settings of the selected layout, see below. Team up with `defaults` layout. |
| `data` | `object[]`, `function`, `Promise` | `null` | Data. The function gets `{ signal, source }` and returns an array or Promise (race-proof loading). `null` — empty grid, data is added via `insert()` / `setData()`. |
| `fields` | `object` | see "Data Options" | Where to get the id, dimensions and card details. |
| `padding` | `number` or `{ top, right, bottom, left }` | `0` | Content padding, px. Affect the width available to the layout. |
| `height` | `number`, `string`, `null` | `null` | Container height (`number` → px, string - any CSS value). `null` — height from CSS (default `100%`). Writes to a CSS variable `--abi7-height`. |
| `className` | `string` | `''` | Additional root element classes. |
| `itemClassName` | `string` | `''` | Additional classes for each card. |
| `itemTag` | `string` | `'div'` | Card elements tag. |
| `autoRender` | `boolean` | `true` | `false` — do not start the grid automatically; manual launch via `render()`. |
| `autoResize` | `boolean` | `true` | Monitor the container size using ResizeObserver. When `false` call `refresh()` yourself. |
| `scrollAnchoring` | `boolean` | `true` | Maintain the position of the viewed content when inserting above the window, resizing and changing the layout. |
| `allowHTML` | `boolean` | `false` | The string returned from `renderItem`, by default inserted as **text**. `true` — like HTML (security is your responsibility). |
| `renderItem` | `function` | `null` | `(record, element, { id, index }) => void`, `Node` or `string`. Replaces the standard card. Called whenever an element is bound to a post - update the content in-place. |
| `releaseItem` | `function` | `null` | `(record, element, { id, index }) => void` — called when the element is unbound (release timers, videos, etc.). |
| `plugins` | `Array<plugin or [plugin, options]>` | `[]` | Plugins installed at startup. |

## Layout Options

Options are passed to `layoutOptions`. For all layouts, except where specifically noted, `gapX` / `gapY` (if not `null`) override `gap` along the axes.

### Masonry (`layout: 'masonry'`)

| Name | Type | Default | Description |
|---|---|---|---|
| `gap`, `gapX`, `gapY` | `number` | `12`, `null`, `null` | Spaces between cards. |
| `columns` | `number` | `0` | Fixed number of columns; `0` — automatically. |
| `minWidth` | `number` | `180` | Minimum column width for auto-fit. The smaller, the more columns. |
| `maxWidth` | `number` | `0` | Maximum card width; `0` — without limitation. If the cards hit the limit, the column block is centered (`align`). |
| `maxColumns` | `number` | `0` | Upper limit of columns; `0` — without limit. |
| `itemHeight` | `number` | `0` | Fixed height of all cards, px. |
| `aspectRatio` | `number` | `0` | Fixed width to height ratio for all cards. |
| `align` | `'center'`, `'start'` | `'center'` | Horizontal alignment of a column block. |

Card height is determined by priority: measured (`virtualization.measure`) → `itemHeight` → `aspectRatio` → aspect ratio of the record → height of the record → `virtualization.estimatedHeight`. Each subsequent source is used if the previous one is not specified.

### Grid (`layout: 'grid'`)

| Name | Type | Default | Description |
|---|---|---|---|
| `gap`, `gapX`, `gapY` | `number` | `12`, `null`, `null` | Indents. |
| `columns` | `number` | `0` | Fixed number of columns; `0` — automatically. |
| `minWidth` | `number` | `160` | Minimum cell width for auto-fit. |
| `width` | `number` | `0` | Fixed cell width (the number of columns is calculated from it). |
| `maxColumns` | `number` | `0` | Upper limit of columns for auto-selection. |
| `itemHeight` | `number` | `0` | Fixed cell height. |
| `aspectRatio` | `number` | `1` | The ratio of the width to the height of a cell. `0` — the height is taken from the records (the row is aligned to the highest). |
| `align` | `'start'`, `'center'` | `'start'` | Aligns the grid horizontally if the cells do not occupy the entire width. |

### Justified (`layout: 'justified'`)

| Name | Type | Default | Description |
|---|---|---|---|
| `targetRowHeight` | `number` | `240` | Desired row height. |
| `minRowHeight` | `number` | `150` | The row will not be lower if it can be avoided. |
| `maxRowHeight` | `number` | `320` | The row will not be higher if it can be avoided. |
| `gap`, `gapX`, `gapY` | `number` | `10`, `null`, `null` | Indents. |
| `lastRow` | `'left'`, `'center'`, `'right'`, `'justify'` | `'left'` | Incomplete last row: row height `targetRowHeight` with alignment, or `'justify'` — stretch to the full width (no higher `maxRowHeight`). |
| `defaultAspect` | `number` | `1.5` | Aspect ratio for posts without dimensions. |

### Horizontal (plugin `@abi7/layout-horizontal`)

| Name | Type | Default | Description |
|---|---|---|---|
| `height` | `number` | `0` | Ribbon height, px; `0` — according to the height of the container. |
| `gap` | `number` | `12` | Distance between cards. |
| `itemWidth` | `number` | `0` | Fixed card width; `0` — `height × aspect`. |
| `defaultAspect` | `number` | `1.5` | Aspect ratio for posts without dimensions. |
| `align` | `'start'`, `'center'` | `'start'` | Vertical tape alignment. |

## Virtualization Options

Options `virtualization`.

| Name | Type | Default | Description | Performance Impact |
|---|---|---|---|---|
| `enabled` | `boolean` | `true` | Mount only visible cards into the DOM + overscan. | `false` creates DOM for **each** entries - only for small sets. |
| `overscan` | `number` | `400` | Margin in px around the window. | More - less “empty spaces” during fast scrolling, but more DOM elements. |
| `adaptiveOverscan` | `boolean` | `true` | Increase the margin in the direction of movement in proportion to the speed. | Small DOM savings at rest and protection during fast scrolling. |
| `maxOverscan` | `number` | `1600` | Limit of adaptive reserve. No less `overscan`. | — |
| `poolSize` | `number` | `256` | How many unused elements to store in the DOM Pool. | More means less node creation, but more memory. |
| `measure` | `boolean` | `false` | The height of the cards is determined by the content: the core measures them through ResizeObserver and caches them (Dynamic Size Cache). Masonry and Grid supported `aspectRatio: 0`. | Each visible element is observed by ResizeObserver; clarification of heights causes partial recalculations. |
| `estimatedHeight` | `number` | `200` | The height estimate is still unknown. | The more accurate the estimate, the less measurement bias there is. |
| `endThreshold` | `number` | `300` | How many px before the end does it fire? `reach:end`. | — |

## Animation Options

Options `animation`. Only rearrangements are animated (insertion, deletion, rearrangement, resize, change of settings), but not scrolling.

| Name | Type | Default | Description |
|---|---|---|---|
| `enabled` | `boolean` | `true` | Enable animation of lane changes. |
| `duration` | `number` | `300` | Duration, ms. `0` disables animation. |
| `easing` | `string` | `'ease'` | CSS timing-function. |
| `respectReducedMotion` | `boolean` | `true` | Disable animation when `prefers-reduced-motion: reduce`. |

Values are published as CSS variables `--abi7-duration` and `--abi7-easing` on the root element.

## Interaction Options

Options `interaction`.

| Name | Type | Default | Description |
|---|---|---|---|
| `click` | `boolean` | `true` | Generate `item:click`, `item:dblclick`, `item:contextmenu`. |
| `drag.enabled` | `boolean` | `false` | Enable drag and drop to change order. |
| `drag.handle` | `string`, `null` | `null` | CSS handle selector; dragging begins only with it. |
| `drag.threshold` | `number` | `5` | Mouse/pen offset (px) before dragging begins. |
| `drag.delay` | `number` | `220` | Long press for touches, ms. Before this, touch = normal scrolling. |
| `drag.autoScroll` | `boolean` | `true` | Autoscroll at the edge of the container. |
| `drag.edge` | `number` | `64` | Autoscroll area width, px. |
| `drag.maxSpeed` | `number` | `22` | Maximum autoscroll speed, px/frame. |

`drag.enabled` can be turned on on the fly: `grid.rebuild({ interaction: { drag: { enabled: true } } })`.

## Data Options

| Name | Type | Default | Description |
|---|---|---|---|
| `data` | see Core | `null` | Source of records. |
| `fields.id` | `string` or `function` | `'id'` | Identifier field (`string` / `number`). No value - the core assigns internal `abi7-N`. |
| `fields.width`, `fields.height` | `string` or `function` | `'width'`, `'height'` | Record sizes; if both are specified, the aspect ratio is calculated from them. Only `height` — used as height in px. |
| `fields.aspectRatio` | `string` or `function` | `'aspectRatio'` | Ready width to height ratio (priority `width`/`height`). |
| `fields.src`, `fields.title`, `fields.alt` | `string` or `function` | `'src'`, `'title'`, `'alt'` | Standard card details. URL filtered: allowed `http(s):`, `blob:`, `data:image/*` and relative addresses. |

The field may be **function** `(record) => value` — so the values are calculated lazily and are not stored in memory for all entries.

## Plugin Options

Plugin options are passed to `grid.use(plugin, options)` or in an array `plugins: [[plugin, options]]`. The core combines them with `plugin.defaults` and transmits to `install(api, options)` frozen object.

| Plugin | Options |
|---|---|
| `selection` | `multiple` (`true`), `className` (`'abi7-selected'`), `toggleOnClick` (`false`), `keyboard` (`true`) |
| `lightbox` | `loop` (`false`), `closeOnBackdrop` (`true`), `keyboard` (`true`), `counter` (`true`), `animation` (`220`), `swipe` (`true`), `getSrc`, `getCaption` |
| `layout-horizontal` | no (settings in `layoutOptions`) |
| `connected-grids` | `group` (`'default'`), `name` (`''`), `copy` (`false`), `accept`, `overClass` (`'abi7-connected-over'`) |

## Root Element CSS Variables

| Variable | Default | Description |
|---|---|---|
| `--abi7-height` | `100%` | Container height (set by option `height`). |
| `--abi7-item-bg` | `#e5e7eb` | Card background before image upload. |
| `--abi7-item-radius` | `6px` | Card rounding. |
| `--abi7-caption-color` | `#fff` | Signature color. |
| `--abi7-focus` | `#4c8bf5` | Focus stroke color. |
| `--abi7-drag-shadow` | `0 12px 28px rgba(0,0,0,.28)` | Shadow of the card being dragged. |
| `--abi7-duration`, `--abi7-easing` | `300ms`, `ease` | Animation (set by the core). |
