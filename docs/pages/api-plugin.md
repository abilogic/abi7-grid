# API Reference: Plugin API & Layout API

The plugin receives an object `api` — the only point of interaction with the core. He **frozen**, each method checks that the plugin is still installed (after `unuse()` challenges `PluginError` with code `PLUGIN_INACTIVE`), and everything that the plugin has registered is tracked and removed automatically.

Object Root: `api.name` (plugin name), `api.apiVersion` (Plugin API version, `'1.0.0'`), `api.coreVersion` (core version).

## Plugin contract

| Field | Type | Mandatory | Description |
|---|---|---|---|
| `name` | `string` | yes | Unique name (`/^[a-z][a-z0-9._:-]*$/i`). Plugin event namespace. |
| `version` | `string` | yes | Plugin version (semver). |
| `apiVersion` | `string` | yes | Range of compatible API versions: `^1.0.0`, `~1.0.0`, `>=1.0.0 <2`, `1.x`, `a \|\| b`. |
| `install(api, options)` | `function` | yes | Synchronous. `this` — plugin object. Can return a cleanup function (or an object with `destroy()`). |
| `defaults` | `object` | no | Default option values. |
| `dependencies` | `string[]` | no | Names of plugins that should be installed first. |
| `layout` | `object` | no | Definition of layout (for layout plugins; read `ABI7Grid.registerLayout(name, plugin)`). |

## api.events

The event bus of this grid. Subscriptions via `api.events` are marked with the name of the plugin (errors in them go to the event `error` with `source: 'plugin:name'`) and are removed automatically.

| Method | Returns | Description |
|---|---|---|
| `on(event, handler)` | `function` unsubscribes | Subscription. Supports `'*'`. |
| `once(event, handler)` | `function` unsubscribes | One operation. |
| `off(event, handler)` | `boolean` | Unsubscribe. |
| `emit(event, payload?)` | `undefined` | Plugin event. **The name must start with `pluginName:`**, otherwise `PLUGIN_EVENT_NAMESPACE`. K `payload` is added `type`. |
| `emitCancelable(event, payload?)` | `boolean` | How `emit`, but handlers can call `event.preventDefault()`. Returns `false`, if the event is cancelled. |

Recommendations: subscribe only to the events you need; don't save `event.element` (node is reused); To cancel the click, check `event.defaultPrevented`.

```js
api.events.on('item:click', (e) => {
  if (e.defaultPrevented) return;
  api.events.emit('my-plugin:clicked', { id: e.id });
});
```

## api.features

Registry of public plugin interfaces. Result `grid.getPlugin(name)`.

| Method | Returns | Description |
|---|---|---|
| `register(name, impl)` | `undefined` | Registers an object or function. Taken name — `PLUGIN_FEATURE_CONFLICT`. Removes automatically. |
| `unregister(name)` | `undefined` | Removes own feature ahead of schedule. |
| `get(name)` | `object` or `null` | Feature (including another plugin). |
| `has(name)` | `boolean` | Does feature. |

## api.layouts

Registration layout **only for this grid**. Global registration — `ABI7Grid.registerLayout()`.

| Method | Returns | Description |
|---|---|---|
| `register(name, definition)` | `undefined` | Registers layout. If the grid was waiting for this layout, the launch will continue. Removes automatically. |
| `unregister(name)` | `undefined` | Withdraw early. |
| `has(name)` | `boolean` | Is there a layout (local, global or built-in). |
| `list()` | `string[]` | Available names. |

## api.data

Working with data through the same methods as the public API (with all events). Internal core arrays are not expanded: read methods return copies.

| Method | Returns | Description |
|---|---|---|
| `get()` | `object[]` | A copy of the records array. |
| `getById(id)` / `getByIndex(i)` | `object` or `undefined` | Record. |
| `ids()` | `Array<string\|number>` | A copy of the id array in the current order. |
| `count()` | `number` | Number of records. |
| `indexOf(id)` | `number` | Index or `-1`. |
| `has(id)` | `boolean` | Is there a recording? |
| `set(list)` | `void` | How `grid.setData`. |
| `insert(items, { at })` | `id[]` | How `grid.insert`. |
| `remove(idOrIds)` | `number` | How `grid.remove`. |
| `update(id, patch)` | `boolean` | How `grid.update`. |
| `move(id, toIndex)` | `boolean` | How `grid.move`. |

## api.geometry

Geometry (coordinates in content pixels). Each method performs a lazy layout first if necessary, so the data doesn't become stale.

| Method | Returns | Description |
|---|---|---|
| `get(id)` | `Rect` or `null` | `{ id, index, x, y, width, height, right, bottom }`. |
| `getByIndex(i)` | `Rect` or `null` | The same goes for the index. |
| `size()` | `{ width, height }` | Content size. |
| `hitTest(x, y)` | `number` | Card index at content coordinate point or `-1`. |
| `invalidate(fromIndex = 0)` | `void` | Mark geometry obsolete from the index (recalculation in the next frame, reason `plugin`). |

## api.viewport

View window and navigation.

| Method | Returns | Description |
|---|---|---|
| `state()` | `object` | `{ scrollLeft, scrollTop, width, height, axis, overscan }`. |
| `range()` | `{ first, last, count }` | Visible indexes (without overscan). |
| `isVisible(id)` | `boolean` | Does the card cross the window? |
| `scrollTo(x, y, behavior?)` | `void` | Scroll to point. |
| `scrollToIndex(i, options?)`, `scrollToItem(id, options?)` | `boolean` | Just like the public API. |
| `pin(id)` / `unpin(id)` | `void` | Pin the card to the DOM, even if it is outside the window. Plugin pins are removed automatically. They count against the counter. |
| `clientToContent(clientX, clientY)` | `{ x, y }` | Screen coordinates → content coordinates. |
| `indexAtClientPoint(clientX, clientY, { nearest }?)` | `number` | Card index under the dot; with `nearest: true` — nearest visible; `-1`if not. |

## api.renderer

The only safe way to influence the DOM of cards.

| Method | Returns | Description |
|---|---|---|
| `root()` | `HTMLElement` | The root element of the grid (for keyboard listeners, backlight listeners, etc.). |
| `getElement(id)` | `HTMLElement` or `null` | The card element, if it is currently in the DOM. |
| `toggleClass(id, className, force?)` | `boolean` | Assigns or removes a class based on **post id**. The core remembers the class and returns it when the DOM node is reused for another entry and bound back to this one. Returns the final state. |
| `hasClass(id, className)` | `boolean` | Is the class assigned via `toggleClass`. |
| `refresh(id?)` | `void` | Redraw the contents of one card or all mounted ones. |

> Any “manual” markings inside the card (icons, signatures) must be placed during the event `item:mount` and clean up when `item:unmount`: the same DOM element shows different entries.

## api.options

| Method | Returns | Description |
|---|---|---|
| `get(path?)` | `any` | Copy of options (without `data`) or values along the way: `get('layoutOptions.gap')`. |
| `set(path, value)` | `void` | Changes the option and applies it (as `rebuild`): `set('interaction.drag.enabled', true)`. |
| `plugin()` | `object` | Frozen options of the plugin itself (same object as 2nd argument `install`). |

## api.lifecycle

| Method | Returns | Description |
|---|---|---|
| `isDestroyed()` | `boolean` | Is the grid destroyed? |
| `state()` | `string` | `'new'`, `'loading'`, `'pending'`, `'ready'`, `'destroyed'`. |
| `onDestroy(fn)` | `function` | Call `fn` at `destroy()` / `unuse()`. Returns a function that unregisters. |
| `addDisposable(fn)` | `function` | Register the cleanup function (will be called in the reverse order of registration). Ideal for `removeEventListener`, `clearTimeout`, `observer.disconnect()`. |
| `refresh()` | `void` | How `grid.refresh()`. |
| `whenReady()` | `Promise` | How `grid.whenReady()`. |

**Cleaning procedure** at `unuse()` and `destroy()`: function returned `install()` → `onDestroy` / `addDisposable` (in reverse order) → unsubscribing events, removing features and layout. Cleanup errors do not interrupt other steps and are reported as an event `error`.

## Layout API

Layout is an object that is registered as `ABI7Grid.registerLayout(name, def)` or `api.layouts.register(name, def)`.

```js
const MyLayout = {
  name: 'my-layout',
  axis: 'y',                 // main scroll axis: 'y' (vertical) or 'x'
  responsive: 'width',       // what causes recalculation during resize: 'width', 'height' or 'both'
  defaults: { gap: 8 },      // default values for options.layoutOptions
  create(options) {          // created when choosing layout and rebuild()
    return {
      compute(ctx) {         // called every time recalculation
        // ... ctx.set(i, x, y, width, height) for i from ctx.from to ctx.count - 1
        return { width: ctx.width, height: totalHeight, info: { /* any data */ } };
      }
    };
  }
};
```

Let's say a short version: `{ compute(ctx) {...} }` without `create` (without own state).

### Context `ctx`

| Field/method | Description |
|---|---|
| `count` | Number of records. |
| `width`, `height` | Available content sizes (container minus `padding`), px. |
| `from` | The index from which the geometry is obsolete. Everything to the left/above has already been calculated correctly - layout must recalculate the elements `from … count - 1` (partial recalculation). Layout can start earlier `from`. |
| `options` | `defaults` layout combined with `layoutOptions` user. |
| `aspect(i)` | Aspect ratio of record (`width / height`) or `0`, if unknown. |
| `resolveHeight(i, width, { height, aspectRatio })` | Unified height policy: measured → fixed → aspect ratio → record height → estimatedHeight. Returns an integer ≥ 1. |
| `itemId(i)`, `itemData(i)` | Identifier and record (read only). |
| `rect(i)` | `{ x, y, width, height, right, bottom }` already calculated element (in layout coordinates, without `padding`). |
| `set(i, x, y, width, height)` | Records geometry. Values must be finite numbers, `width`/`height` ≥ 0, otherwise `LAYOUT_INVALID`. |

### What returns `compute`

`{ width, height, info? }` — content sizes (without `padding`, the core will add it itself). `info` falls into `layout:end` and `getState().layoutInfo`.

### Rules

- Layout answers **only for geometry**. It does not gain access to the DOM, virtualization, or internal core arrays.
- Virtualization works with any layout without additional settings: the core builds a spatial index according to `axis`.
- The result must be deterministic: same input → same geometry. Then partial and full recalculation give the same result (checked by tests for built-in layouts).
- Error in `compute` does not break the grid: it comes to the event `error` (`source: 'layout'`).
- If the active layout is disabled (`unuse()` plugin), the grid switches to `masonry`.

### Example: “ladder” layout in 12 lines

```js
ABI7Grid.registerLayout('stairs', {
  defaults: { step: 40, itemHeight: 120 },
  compute(ctx) {
    const { step, itemHeight } = ctx.options;
    for (let i = ctx.from; i < ctx.count; i++) {
      ctx.set(i, (i * step) % Math.max(1, ctx.width - 200), i * (itemHeight + 8), 200, itemHeight);
    }
    return { width: ctx.width, height: ctx.count * (itemHeight + 8) };
  }
});
```
