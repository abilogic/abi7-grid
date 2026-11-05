# Responsive Behavior

ABI7 Grid is responsive to its **container**, not to media queries. The grid recalculates when the size of the root element changes.

## Container size changes

With `autoResize: true` (default) the core creates one `ResizeObserver` for the root element when it starts. When the observer fires, the core compares the new `clientWidth`/`clientHeight` with the last known values. If they differ, it updates the viewport, emits `resize` with `{ width, height }`, and schedules a layout.

| Layout `responsive` | Recalculates when |
|---|---|
| `'width'` (Masonry, Grid, Justified) | the width changes |
| `'height'` | the height changes |
| `'both'` | either changes |

A height-only change still re-evaluates which cards must be mounted, but does not rebuild the geometry for width-driven layouts.

## Changing the number of columns

Columns are derived from `layoutOptions.minWidth`, `gap`/`gapX` and `maxColumns` (see [Core Concepts](#/concepts)). A wider container gives more columns; a narrower one gives fewer, down to one. A fixed `columns` value disables auto-fit. The `layout:end` event reports the result in `event.info` (`columns`, `itemWidth`, …).

:::demo responsive

## `ResizeObserver`

- It observes the root element only when `autoResize` is `true`.
- If `ResizeObserver` does not exist in the environment, nothing is observed. Call `grid.refresh()` after you resize the container.
- With `autoResize: false` you are responsible for calling `grid.refresh()`.
- Resize bursts are limited: more than 10 resize-triggered layouts within 500 ms are dropped.

## Viewport (window) changes

The grid does not listen to `window.resize`. A window resize matters only if it changes the size of the grid element (for example `width: 100%`); the `ResizeObserver` then reports it.

## Content changes

Changing data (`insert`, `remove`, `update`…) triggers a layout without any resize. Changing the DOM of a card by hand does not trigger anything. See [Dynamic Content](#/dynamic-content).

## Hidden containers

If the root has no width (for example inside `display: none`), the grid waits (`hidden` state in `getState()`). When the container becomes visible, the `ResizeObserver` (and the `IntersectionObserver` when it exists) trigger the layout.

## Recalculation details

- `refresh()` re-reads the container size and relayouts everything synchronously (`flush()`).
- `rebuild(patch)` applies new options; layout changes are animated and keep the scroll anchor.
- Scroll Anchoring keeps the content under the user's eyes when geometry above the window changes.

:::demo container-width
