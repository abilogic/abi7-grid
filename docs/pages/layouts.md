# Layouts

Layout is an algorithm that, based on the entries and width of the container, calculates the position and size of each card. Selectable by option `layout`, customizable `layoutOptions`, switches on the fly: `grid.rebuild({ layout: 'justified' })`.

All layouts return geometry in the same format:

```js
{ id: 'photo-123', index: 0, x: 0, y: 0, width: 240, height: 180, right: 240, bottom: 180 }
```

You can get it like this: `grid.getItem('photo-123').rect`.

## Masonry

Cards of the same width are stacked in columns; each new card goes to **the shortest column**. The height is determined by the data (aspect ratio / height of the record), so the picture is not needed to calculate the layout.

**Algorithm.**

1. Number of columns: `columns`, otherwise `floor((W + gap) / (minWidth + gap))`, limited `maxColumns`.
2. Width: `floor((W − gap·(cols−1)) / cols)`, but no more `maxWidth`; the column block is centered (`align`).
3. For each card from `from`: select the column with the minimum height, write `x/y`, increase the column height.
4. Every 128 cards, a snapshot of the column heights is saved. Partial recalculation starts from the nearest snapshot, and not from the beginning.

```js
new ABI7Grid('#g', { layout: 'masonry', data,
  layoutOptions: { gap: 12, minWidth: 180, maxColumns: 5 } });
```

:::demo masonry

## Grid

Classic grid: cells are the same width, rows are aligned in height. Columns — `columns` (fixed), `width` (fixed cell width) or automatically by `minWidth`. Height — `aspectRatio` (default `1`), `itemHeight`, or `aspectRatio: 0` — then it is taken from the records (the row is aligned to the highest). The cell position is calculated arithmetically, so the recalculation is very fast; For partial recalculation, the upper boundaries of the rows are stored.

```js
new ABI7Grid('#g', { layout: 'grid', data,
  layoutOptions: { columns: 4, gap: 12, aspectRatio: 1.5 } });
```

:::demo grid

## Justified

Photo gallery with rows of cards of the same height and different widths (like Flickr / Google Photos).

**Algorithm.** Cards are added to the row until the row, scaled to the width of the container, is lower `targetRowHeight`. Then the best option is selected: **with** last card or **without** her - the one whose height is closer to the goal, taking into account the boundaries `minRowHeight` / `maxRowHeight`. The height of the row is selected so that the row **exactly** filled the width: `h = (W − gap·(n−1)) / Σ aspect`. The widths are rounded cumulatively, and the right border of the last card in the row is equal to `W` — there are no overlaps or cracks.

The last (incomplete) line is not stretched: it gets `targetRowHeight` and aligned to `lastRow` (`left`, `center`, `right`) or stretched (`justify`, but not higher `maxRowHeight`). Additional data loading (`insert` to the end) recalculates only the last row and new ones.

```js
new ABI7Grid('#g', { layout: 'justified', data,
  layoutOptions: { targetRowHeight: 240, minRowHeight: 150, maxRowHeight: 320, gap: 10, lastRow: 'left' } });
```

:::demo justified

## Horizontal (plugin)

Horizontal strip: cards of the same height and different widths (`width = height × aspect`), scroll horizontally. Connected by plugin `@abi7/layout-horizontal` — Core knows nothing about him; this is an example of a third-party layout.

```js
import HorizontalLayout from './plugins/layout-horizontal/horizontal.js';

const grid = new ABI7Grid('#strip', { layout: 'horizontal', data,
  layoutOptions: { height: 200, gap: 12 } });
grid.use(HorizontalLayout);              // or ABI7Grid.registerLayout('horizontal', HorizontalLayout)
```

The layout name can be specified before connecting the plugin: the grid will go into the state `pending` and will continue to run as soon as the layout appears. If the plugin is disabled (`grid.unuse('layout-horizontal')`), the grid will return to `masonry` and will report this event `error` (`LAYOUT_REMOVED`).

:::demo horizontal

## Changing sizes and aspect ratio

- Changing the container size (ResizeObserver) causes a complete recalculation — `layout:end` with `reason: 'resize'`.
- Changing aspect ratio / recording sizes: `grid.update(id, { width, height })` — recalculation begins with this entry.
- Layout, depending only on the width (`responsive: 'width'`), are not recalculated when the container height changes.

## Your layout

Layout - an object with a method `compute(ctx)`. The full contract and example are in the [Layout API] section](#/api-plugin/layout-api).
