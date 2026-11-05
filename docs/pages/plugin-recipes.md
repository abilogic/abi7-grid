# Plugin Examples

Four plugins in `plugins/` show different ways to extend the core. They were written against the real Plugin API and need no changes to the core. Where the core has no hook for something, the plugin says so instead of pretending.

## What plugins can and cannot do

| Plugins can | Plugins cannot |
|---|---|
| Subscribe to any core event, cancel clicks | Replace the core's animation engine (it is CSS-driven and has no hooks) |
| Add classes per record (`api.renderer.toggleClass`) | Touch card elements directly in a way that survives reuse |
| Read geometry and hit-test (`api.geometry`, `api.viewport`) | Use the card's own `transform`, `width`, `height` (the core writes them) |
| Change options (`api.options.set`) | Access the core's internal arrays |
| Register layouts, public features and events | Emit events without their own namespace |

## Hover Effects

Uses the core geometry (`api.viewport.indexAtClientPoint`) to find the hovered record, marks it with `toggleClass`, and drives effects with CSS on the card's children. It never modifies the card's `transform`.

:::demo plugin-hover

## Reveal Effects

Listens to `item:mount` and adds a "pre" class by record id for two frames, so the browser can transition the card's children to their normal state. Because DOM nodes are reused, `once: true` remembers revealed ids.

:::demo plugin-reveal

## Animation and Custom Transitions

The core animates only rearrangements (insert, remove, move, resize, layout change) with CSS transitions controlled by `animation.enabled`, `duration` and `easing`. The Transitions plugin does not invent another engine: it switches these options via `api.options.set` using named presets, and lets you define your own.

:::demo plugin-transitions

## Multiple plugins and configuration

Every plugin has its own options and state. Install them with `grid.use()` or the `plugins` option; read back with `getPlugins()`.

:::demo plugin-multiple

## A custom plugin from scratch

See [Building Your First Plugin](#/first-plugin) and the larger `CounterPlugin` in the [Plugin Development Guide](#/plugin-development).

## Source of the plugins

:::file plugins/hover-effects/hover-effects.js

:::file plugins/reveal/reveal.js

:::file plugins/transitions/transitions.js
