# Plugins

Core is intentionally small. Everything that everyone does not need - selection, viewer, transfer between grids, additional layout - lives in **plugins**: separate files that are connected only when necessary and do not require changes to Core.

## Plugin architecture

- **Plugin object** — ordinary object: `name`, `version`, `apiVersion`, `install(api, options)`.
- **Plugin API** (`api`) - the only point of communication with the core: nine interfaces `events`, `layouts`, `features`, `data`, `geometry`, `viewport`, `renderer`, `options`, `lifecycle`. It is frozen, does not expose internal core arrays, and "closes" after the plugin is disabled.
- **Instance Isolation** — the plugin state lives in a closure `install()`. The same plugin on two grids - two independent copies.
- **Automatic cleaning** — subscriptions, features, layout and pins made through `api`, are removed when `unuse()` and `destroy()` without the participation of the plugin author.

```text
grid.use(plugin, options)
   ├─ contract verification (name, version, apiVersion, install)
   ├─ apiVersion compatibility check ↔ core API version
   ├─ checking dependencies and reconnecting
   ├─ creating an isolated api
   ├─ plugin.install(api, mergedOptions) ← plugin registers subscriptions, methods, layout
   └─ plugin:install event
```

## Installation and disabling

```js
import SelectionPlugin from './plugins/selection/selection.js';

grid.use(SelectionPlugin, { multiple: true });     // installation (can be chained)
grid.hasPlugin('selection');                        // true
grid.getPlugin('selection').select('photo-1');      // public interface of the plugin
grid.getPlugins();                                  // [{ name, version, apiVersion, options }]
grid.unuse('selection');                            // shutdown: cleanup → unsubscribe → event
```

Plugins can also be passed to the constructor: `plugins: [SelectionPlugin, [LightboxPlugin, { loop: true }]]`. Several plugins work simultaneously; at `destroy()` they are all released in the reverse order of installation.

## Ready plugins

| Package | Files | What does |
|---|---|---|
| `@abi7/selection` | `plugins/selection/selection.js`, `selection.css` | Click, Ctrl/Cmd, Shift-range, `selectAll`, `clear`, events |
| `@abi7/lightbox` | `plugins/lightbox/lightbox.js`, `lightbox.css` | View on top of the grid: keyboard, swipe, animation |
| `@abi7/layout-horizontal` | `plugins/layout-horizontal/horizontal.js` | Layout "horizontal ribbon" |
| `@abi7/connected-grids` | `plugins/connected-grids/connected-grids.js`, `connected-grids.css` | Transferring cards between grids |

### Selection

:::demo selection

### Lightbox

:::demo lightbox

### Connected Grids

:::demo connected-grids

## Layout plugins

Third-party layout is connected in the same way as a regular plugin:

```js
import HorizontalLayout from './plugins/layout-horizontal/horizontal.js';

const grid = new ABI7Grid('#strip', { layout: 'horizontal', data });
grid.use(HorizontalLayout);
// or globally:
ABI7Grid.registerLayout('horizontal', HorizontalLayout);
```

Inside the plugin does `api.layouts.register('horizontal', definition)`. Grid, whose `layout` not registered yet, waiting for it (status `pending`) and starts automatically. Layout contract - in [Layout API](#/api-plugin/layout-api).

## Interaction of plugins with Core

| What does the plugin need? | How it's done |
|---|---|
| React to events | `api.events.on('item:click', fn)` |
| Report your events | `api.events.emit('pluginname:event', payload)` |
| Give the user methods | `api.features.register(name, object)` → `grid.getPlugin(name)` |
| Read/change data | `api.data.*` |
| Know the position of the cards | `api.geometry.get(id)`, `api.geometry.hitTest(x, y)` |
| Scroll, pin | `api.viewport.*` |
| Influence the type of card | `api.renderer.toggleClass(id, cls)`, events `item:mount` / `item:unmount` |
| Change grid settings | `api.options.set(path, value)` |
| Free up resources | `return () => {...}`, `api.lifecycle.addDisposable(fn)` |

Plugins can depend on each other: field `dependencies: ['selection']` is checked during installation, and you cannot disable a plugin that is needed by someone else (`PLUGIN_REQUIRED`). Plugin A can use the public interface of plugin B: `api.features.get('selection')`.

## Plugin life cycle

1. `grid.use()` → checks → `install(api, options)`.
2. Working phase: events, feature calls.
3. `grid.unuse(name)` or `grid.destroy()`:
   1. the function returned is called `install()`;
   2. are called `api.lifecycle.onDestroy` / `addDisposable` — in reverse order of registration;
   3. subscriptions are removed `api.events`, feature and layout;
   4. API "closes": any call will fail `PLUGIN_INACTIVE`;
   5. event comes `plugin:uninstall`.

## Error Handling

| Situation | What's going on |
|---|---|
| None `name`, `version`, `apiVersion` or `install` | `grid.use()` throws `PluginError` (`PLUGIN_INVALID`) |
| `apiVersion` does not fit the core | `PLUGIN_INCOMPATIBLE`, nothing is installed |
| The plugin is already installed | `PLUGIN_DUPLICATE` |
| Dependency not installed | `PLUGIN_DEPENDENCY` |
| Exception in `install()` | Rollback of all registrations, `PLUGIN_INSTALL_FAILED`, the exception is thrown from `use()` |
| `install()` returned Promise | `PLUGIN_INVALID` — synchronous installation |
| Exception in plugin event handler | Does not break the grid or other subscribers; event comes `error` with `source: 'plugin:name'` |
| Exception in cleanup function | The remaining cleaning steps are completed; event `error` (`phase: 'cleanup'`) |
| Feature name conflict | `PLUGIN_FEATURE_CONFLICT` |
| `emit()` events not with their own prefix | `PLUGIN_EVENT_NAMESPACE` |

```js
try {
  grid.use(SomePlugin);
} catch (e) {
  if (e.code === 'PLUGIN_INCOMPATIBLE') showWarning('Update the plugin');
}
grid.on('error', (e) => { if (e.source.startsWith('plugin:')) console.warn(e.source, e.message); });
```

How to write your own plugin from scratch - in [Creating a plugin](#/plugin-development).
