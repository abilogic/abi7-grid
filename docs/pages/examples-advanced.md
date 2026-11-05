# Advanced Examples

## Dynamic item addition, removal, update and move

Features: `insert()`, `remove()`, `update()`, `move()`, `getItems()`, `getCount()`, `item:*` events, partial recalculation.

:::demo dynamic

## Image loading and asynchronous data

Features: `data` function with `{ signal }`, race-free reloads, `reload()`, `whenReady()`, `data:load-start` / `data:load-end`.

:::demo image-loading

## Lazy loading and infinite scroll

Features: virtualization (only visible cards are mounted), `reach:end`, `virtualization.endThreshold`, `insert({ at: 'end' })`.

:::demo lazy-loading

## Large number of items

50,000 records, DOM Pool, overscan and `scrollToIndex`. Features: `virtualization.*`, `getState().virtualization`, `scrollToIndex()`.

:::demo virtualization

## Multiple grid instances

Features: independent instances, per-instance `rebuild()`, `ALREADY_INITIALIZED` protection.

:::demo multiple-instances

## Reinitialization and destruction

Features: `destroy()`, `isDestroyed()`, `reload()`, creating a new instance on the same element.

:::demo lifecycle

## Changes made in the DOM inspector

Features: geometry epoch, re-binding with `reload()`. Edit a card, then trigger a layout pass or a re-bind to see what the core overwrites.

:::demo dom-inspector

## Container resize and window resize

See [Custom container width](#/examples-basic) and [Responsive grid](#/examples-basic). The grid reacts to its container through `ResizeObserver`; it does not listen to `window.resize` directly. Details: [Responsive Behavior](#/responsive).

## Custom item content

Features: `renderItem`, `releaseItem`, `allowHTML`. See [Callbacks](#/callbacks). The `custom-plugin` example below customizes cards through a plugin.

:::demo custom-plugin
