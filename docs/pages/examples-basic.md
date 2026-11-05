# Basic Examples

Every example runs the real library in an iframe, from the same files that you see in the tabs. Each lists the core features it uses.

## Basic Grid

Features: constructor, `data`, `fields.src`, `layoutOptions`, `item:click`.

:::demo basic

## Two, three and four columns

Features: `layoutOptions.columns`, `rebuild()`, `layout` switch, `layout:end` info.

:::demo columns

## Different item heights and layouts

Masonry uses each record's own aspect ratio, so heights differ. Features: Masonry, `minWidth`, `maxColumns`, `insert()`, `remove()`, `refresh()`, `rebuild()`.

:::demo masonry

## Fixed aspect ratio (Grid layout)

Features: `grid` layout, `columns`, `aspectRatio`, `gap`.

:::demo grid

## Different gaps

Features: `gapX`, `gapY`, animation on rebuild.

:::demo gaps

## Custom container width

Features: `autoResize` (`ResizeObserver`), `minWidth`, `resize` event.

:::demo container-width

## Responsive grid

Features: `minWidth`, `maxColumns`, container resize, `getState().viewport`.

:::demo responsive

## Justified rows

Features: `justified` layout, `targetRowHeight`, `lastRow`.

:::demo justified
