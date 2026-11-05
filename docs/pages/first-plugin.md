# Building Your First ABI7 Grid Plugin

In this tutorial you build **Flash**: a plugin that highlights a card for a moment after it is clicked. You will use every part of the plugin lifecycle: declaration, options, events, DOM changes, a public interface and cleanup. The finished plugin is a real file that runs below.

> A plugin you write yourself is your own work. Running it together with ABI7 Grid is still governed by the [license](#/license): the Community License allows non-commercial use only. Need ABI7 Grid for commercial projects? Get a commercial license at https://abi7.com

## 0. What a plugin is

A plugin is a plain object with `name`, `version`, `apiVersion` and an `install(api, options)` function. It is passed to `grid.use()`. The plugin never imports the core. The core gives it a frozen `api` object, tracks everything the plugin registers and removes it on `unuse()` or `destroy()`.

## 1. Declare the plugin

```js
const FlashPlugin = {
  name: 'flash',            // unique per grid; event namespace
  version: '1.0.0',         // semver
  apiVersion: '^1.0.0',     // Plugin API versions you support
  defaults: { className: 'flash-on', duration: 600 },
  install(api, options) { /* ... */ }
};
export default FlashPlugin;
```

If `apiVersion` does not match the core, `grid.use()` throws `PluginError` with code `PLUGIN_INCOMPATIBLE` and installs nothing.

## 2. Keep state inside `install`

Variables declared inside `install()` are created per grid. Two grids using the same plugin object have separate state; this is how independent plugins avoid conflicts.

## 3. Subscribe to events

```js
api.events.on('item:click', (event) => {
  if (event.defaultPrevented) return;
  // ...
});
```

Subscriptions made through `api.events` are removed automatically. Errors inside the handler become the `error` event with `source: 'plugin:flash'`.

## 4. Change the DOM through the API

```js
api.renderer.toggleClass(event.id, options.className, true);
```

Card elements are reused by virtualization, so never store `event.element` for later and never add a class directly. `toggleClass()` is keyed by **record id**; the core re-applies it whenever the record is bound to an element.

## 5. Emit your own events

```js
api.events.emit('flash:fired', { id: event.id });
```

The event name must start with `flash:` (the plugin name); otherwise the core throws `PLUGIN_EVENT_NAMESPACE`.

## 6. Register a public interface

```js
api.features.register('flash', { active: () => timers.size });
// later:  grid.getPlugin('flash').active()
```

## 7. Clean up what the core cannot track

Return a function from `install()`. Use it for your timers, observers and global listeners. The core cleans up its own subscriptions, features and layouts.

## 8. Add CSS

Put visuals in a separate stylesheet and use only properties the core does not manage. Never set `transform`, `width`, `height` or `position` on `.abi7-item`.

## The complete plugin

:::file examples/first-plugin/flash-plugin.js

## Run it

:::demo first-plugin

## 9. Use it

```js
import FlashPlugin from './flash-plugin.js';

grid.use(FlashPlugin, { duration: 900 });
grid.getPlugin('flash').active();
grid.unuse('flash');           // cleanup runs
```

You can also pass `plugins: [[FlashPlugin, { duration: 900 }]]` in the constructor.

## 10. Checklist

- State lives inside `install()`.
- Every listener is registered through `api.events` (or removed in the cleanup function).
- Timers and observers are cleaned up.
- Event names start with `<name>:`.
- DOM changes go through `api.renderer`.
- `apiVersion` is declared.

Next: [Plugin Development Guide](#/plugin-development), [Plugin API](#/api-plugin) and [Plugin Examples](#/plugin-recipes).
