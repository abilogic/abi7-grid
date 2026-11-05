# Core Concepts

This page explains the model behind ABI7 Grid. The code references are to `src/abi7-grid.js`; the full walk-through is in [Internal Architecture](#/internals).

## Grid container

The element you pass to the constructor becomes the **root**: it receives the class `abi7-grid` and acts as the scroll container (`overflow: auto`), so it needs a height. The core adds one child, `div.abi7-container` (`role="list"`), which has the total content size; cards are absolutely positioned inside it. The original `class`, `style`, `tabindex`, `role` and `aria-label` attributes are saved and restored by `destroy()`. An element can have only one live instance (`ALREADY_INITIALIZED`).

## Grid items

An item is a **record** (a plain object) in the data store. The core never mutates your objects. `fields` tells it where to find `id`, `width`, `height`, `aspectRatio`, `src`, `title` and `alt`; each field can be a property name or a getter function. A card is a DOM element created only while its record is mounted.

## Layout calculation

A layout is an object with `compute(ctx)`. For every index from `ctx.from` to `ctx.count - 1` it calls `ctx.set(i, x, y, width, height)`, and returns the content size. The core stores the rectangles in typed arrays (`Float64Array`) and builds a spatial index along the scroll axis. The layout does not touch the DOM.

## Column management

Masonry and Grid choose the number of columns like this (Masonry, from the source):

1. if `columns > 0`, use it; otherwise `floor((W + gapX) / (minWidth + gapX))`, where `W` is the available width;
2. apply `maxColumns` if it is greater than zero; use at least one column;
3. column width is `floor((W − gapX × (columns − 1)) / columns)`, capped by `maxWidth` if set;
4. the block of columns is centered (`align: 'center'`) or left-aligned (`'start'`).

Masonry puts each card into the currently shortest column. Grid puts cards into rows of equal height. Justified builds rows whose height is chosen so the row fills the width.

## Item measurement

Heights follow one policy (`resolveHeight`): measured height (`virtualization.measure`) → fixed `itemHeight` → `aspectRatio` option → the record's aspect ratio → the record's `height` → `virtualization.estimatedHeight`. By default **nothing is measured from the DOM**: sizes come from your data. With `measure: true`, a `ResizeObserver` measures mounted cards and caches the heights (Dynamic Size Cache).

## Positioning

Each mounted card gets `transform: translate3d(x, y, 0)`, `width` and `height` in pixels (height is left empty in measure mode). The DOM Renderer writes these only when the card's `epoch` differs from the geometry epoch, which increases after each layout pass. Plugins and your CSS must therefore not use the card's own `transform`.

## Resize handling

With `autoResize: true`, a `ResizeObserver` watches the root. `onResize()` compares the new `clientWidth` and `clientHeight` with the stored viewport and, for layouts with `responsive: 'width'` (all built-in layouts except the horizontal plugin), schedules a layout from index 0. A burst guard stops infinite loops (for example a flickering scrollbar): more than 10 resize-triggered layouts in 500 ms are ignored. See [Responsive Behavior](#/responsive).

## Dynamic content

`insert`, `remove`, `update`, `move`, `setData`, `load` and `reload` change data; each marks the geometry dirty from an index (`invalidate(from, reason)`). Several changes in one frame are merged and cost one layout pass. See [Dynamic Content](#/dynamic-content).

## DOM synchronization

After a layout pass, the Virtualization Engine decides which indexes should be mounted (window + overscan + pinned). The DOM Renderer then mounts and unmounts cards: unmounted elements go to the DOM Pool and are reused for other records. A card's content is written when it is **bound** (mount, `update()`, `reload()`), not on every frame. Consequently, anything you change directly in a card (for example with the browser's DOM inspector) is not observed; see the [DOM inspector example](#/examples-advanced).
