# How to create your own ABI7 Grid plugin

After this tutorial you will be able to write a plugin, **without reading the Core source code**. All you need is a public Plugin API.

## Step by step

### 1. Create a directory

```text
plugins/
└── my-plugin/
    ├── my-plugin.js # plugin code (ES module, export default)
    ├── my-plugin.css # styles - only if needed
    ├── README.md
    └── package.json
```

One plugin - one directory. The user connects only what he uses.

### 2. Create a JS file and declare the plugin

```js
// my-plugin.js
export default {
  name: 'my-plugin',          // unique name; event namespace
  version: '1.0.0',           // version of the plugin itself (semver)
  apiVersion: '^1.0.0',       // what versions of the core API is the plugin compatible with?
  defaults: { enabled: true },// default option values

  install(api, options) {
    // ...all logic
    return () => { /* cleaning */ };
  }
};
```

Plugin **does not import Core**: it communicates with the grid only through `api`.

### 3. Create package.json

```json
{
  "name": "@your-scope/abi7-my-plugin",
  "version": "1.0.0",
  "type": "module",
  "main": "my-plugin.js",
  "style": "my-plugin.css",
  "files": ["my-plugin.js", "my-plugin.css", "README.md"],
  "peerDependencies": { "abi7-grid": "^1.0.0" },
  "license": "<YOUR-PLUGIN-LICENSE>"
}
```

The core is specified as `peerDependency`, not `dependency`: the plugin should not pull its own copy.

### 4. Connect to Core

```js
import { ABI7Grid } from './dist/abi7-grid.js';
import MyPlugin from './plugins/my-plugin/my-plugin.js';

const grid = new ABI7Grid('#gallery', { data });
grid.use(MyPlugin, { enabled: true });
```

### 5. Use the Plugin API

Nine interfaces (`events`, `layouts`, `features`, `data`, `geometry`, `viewport`, `renderer`, `options`, `lifecycle`) are described in [Plugin API](#/api-plugin). Selection Rule: **event** — to react **feature** — to give methods, **renderer** — to change the view **geometry/viewport** — to know "where".

### 6. Register Methods

```js
api.features.register('my-plugin', { doSomething() {}, getValue: () => value });
// user: grid.getPlugin('my-plugin').doSomething();
```

### 7. Work with events

```js
api.events.on('item:click', (e) => { if (!e.defaultPrevented) { /* ... */ } });
```

Subscriptions via `api.events` are removed automatically.

### 8. Create your own events

```js
api.events.emit('my-plugin:changed', { value });                 // notice
const ok = api.events.emitCancelable('my-plugin:before-save', {}); // can be canceled
```

The event name must begin with `my-plugin:` — the core prevents the plugin from generating other people's events.

### 9. Work with settings

`options` — frozen object: `plugin.defaults`, combined with what the user submitted. Don't change it; For changeable values, create local variables.

### 10. Include CSS

The plugin CSS file is connected separately by the user (`<link>`). Start all classes with the plugin prefix (`.abi7-lb-*`, `.abi7-selected`), without global selectors.

### 11. Handle errors

Throw the usual ones `Error` in `install()` if the configuration is incorrect, the core will roll back the installation and wrap the error in `PluginError`. In event handlers, exceptions are safe for the grid (they will go to the event `error`), but it's better to handle expected situations yourself.

### 12. Clean up resources

Everything the plugin created **outside** API — `addEventListener`, `setTimeout`, `observer`, elements in `document.body` — he must clean it himself. Two ways:

```js
// method 1: cleaning function
return () => { clearInterval(timer); overlay.remove(); };

// method 2: register next to creation
root.addEventListener('keydown', onKey);
api.lifecycle.addDisposable(() => root.removeEventListener('keydown', onKey));
```

One is convenient for a group of listeners `AbortController`: `addEventListener(..., { signal })`, and in cleaning `controller.abort()` (that's how Lightbox is made).

### 13. Testing

The plugin is checked on the real grid: install, call methods, disable and make sure that nothing is left. Template (Node + jsdom, as in `tests/`):

```js
grid.use(MyPlugin);
// ...actions
grid.unuse('my-plugin');
assert.equal(document.querySelectorAll('.my-plugin-node').length, 0);   // DOM removed
assert.equal(grid.getPlugin('my-plugin'), null);                         // feature removed
grid.destroy();
```

Check: connection and disconnection, repeated `use()`, two copies with independent state, `destroy()` no errors.

### 14. Publication

1. Fill in `README.md`: options, feature methods, events, CSS connection.
2. Please indicate correct `apiVersion`: API range on which the plugin is tested.
3. `npm publish` from the plugin directory. Name - according to the scheme `@scope/abi7-name`.

## Recipes: three plugins of varying complexity

Below are the actual project files (`examples/custom-plugin/recipes.js`); they are verified by tests.

:::file examples/custom-plugin/recipes.js

- **LoggerPlugin** — minimum: subscription to `'*'`,feature,options.
- **TooltipPlugin** — working with reused DOM nodes: the attribute is placed on **everyone** `item:mount`.
- **KeyboardNavPlugin** — navigation by arrows for any layout via `api.geometry.hitTest`, scroll through `api.viewport`, custom events, clearing the DOM listener.

## Full example: CounterPlugin from scratch

The plugin counts clicks on cards, stores counters separately for each grid, registers methods, generates its own events, and can be reset and disabled correctly. It is launched below; the code is the same file that is executed in the iframe.

:::demo custom-plugin

### Point by point analysis

1. **Plugin object** — ordinary object `CounterPlugin = { name, version, apiVersion, defaults, install }`. The core does not require class or inheritance.
2. **`name`** — plugin identifier within the grid: they work on it `unuse('counter')`, reinstallation protection and event namespace (`counter:*`).
3. **`version`** — plugin version (semver); visible in `getPlugins()` and in the event `plugin:install`.
4. **`apiVersion`** — core API version range (`^1.0.0`). If the core is not suitable, `use()` throws `PLUGIN_INCOMPATIBLE` and does not install anything - the plugin will not silently break on an incompatible core.
5. **`install(api, options)`** — called once when `use()`, synchronously. `this` — the plugin object itself. The return function is cleanup.
6. **`api`** — frozen object with nine interfaces; the only way to interact with the core.
7. **Subscribe to events** — `api.events.on('item:click', handler)`. There is no need to unsubscribe manually.
8. **Public method** — `api.features.register('counter', { getTotal, reset, top })`.
9. **Calling a Method** — `grid.getPlugin('counter').getTotal()`.
10. **Own event** — `api.events.emit('counter:change', { id, count, total })`; prefix `counter:` required. Subscription: `grid.on('counter:change', ...)`.
11. **Settings** — second argument `install` (`step`, `badges`, `filter`): default values from `defaults` + what was transferred to `grid.use(CounterPlugin, { step: 2 })`.
12. **Shutdown** — `grid.unuse('counter')`: the cleaning function removes icons, then subscriptions and features are removed; `getPlugin('counter')` will return `null`.
13. **`destroy()`** — for each plugin the same cleanup is called, then comes `plugin:uninstall` with `reason: 'destroy'`.
14. **Memory leaks** — all subscriptions go through `api.events` (removed automatically); `Map` counters are cleared in the clear function; no references to DOM nodes after `unuse()`; own `addEventListener` must be removed for cleaning (see recipes).
15. **State separately for each instance** — `total` and `perItem` announced **inside** `install()`: each call creates a new closure. Module-level variables would be common to all grids.
16. **Working with the DOM** — nodes are reused (DOM Pool), so an icon is placed on each `item:mount` and cleans up `item:unmount`; the element is taken through `api.renderer.getElement(id)` (maybe `null`, if the card is not in the DOM); text - only `textContent`.
17. **Error Handling** — the exception in the handler does not break the grid (it comes in the event `error` with `source: 'plugin:counter'`); exception in `install()` rolls back the installation; check `event.defaultPrevented` allows you to respect the “cancellation” of the click by other handlers.

### How to connect and make sure everything works

```js
import CounterPlugin from './counter-plugin.js';

grid.use(CounterPlugin, { step: 1 });
grid.on('counter:change', (e) => console.log(e.total));
grid.getPlugin('counter').top(3);     // most clicked cards
grid.unuse('counter');                // icons disappeared, getPlugin('counter') === null
```
