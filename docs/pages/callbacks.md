# Callbacks

ABI7 Grid has **no `onXxx` options** such as `onReady`: lifecycle and interaction notifications use the event bus ([Events](#/api-events)). The functions below are the callbacks that the implementation actually calls.

| Callback | Where you set it | Called when | Arguments | Return value |
|---|---|---|---|---|
| `data` function | option `data`, `grid.load()` | initial load, `load()`, `reload()`, `rebuild({ data })` | `{ signal, source }` | array, or a Promise of an array |
| `fields.<name>` getters | option `fields` | whenever the core reads a field (id, width, height, aspectRatio, src, title, alt) | `(record)` | the field value |
| `renderItem` | option `renderItem` | every time a card element is bound to a record: mount, `update()`, `reload()` | `(record, element, { id, index })` | nothing, a `Node` (replaces content), or a string (text, or HTML when `allowHTML`) |
| `releaseItem` | option `releaseItem` | when an element is unbound from a record (unmount, destroy, reset) | `(record, element, { id, index })` | ignored |
| Event listeners | `grid.on()`, `once()` | see [Events](#/api-events) | the event object | `item:*` click events can be cancelled with `event.preventDefault()` |
| Plugin `install` | `grid.use()` | once per `use()` | `(api, options)` | optional cleanup function (or an object with `destroy()`) |
| `api.lifecycle.onDestroy`, `addDisposable` | inside a plugin | `unuse()` / `destroy()` | none | ignored |
| Layout `create` / `compute` | `registerLayout()`, `api.layouts.register()` | when the layout is selected / on every layout pass | `(options)` / `(ctx)` | `{ compute }` / `{ width, height, info? }` |
| `done` argument | the deprecated legacy methods (see Methods → Deprecated) | after the operation the legacy method waited for | — | ignored |

## Error handling

An exception thrown by a listener, `renderItem`, `releaseItem`, a data function or a plugin does **not** break the grid. It is reported as the `error` event with `source` (`'listener'`, `'plugin:name'`, `'data'`, `'layout'`, `'renderItem'`, `'releaseItem'`, `'plugins'`). If nobody listens to `error`, the core writes it to `console.error`.

## `renderItem` example

```js
const grid = new ABI7Grid('#gallery', {
  data: users,
  fields: { id: 'uid', height: () => 120 },
  renderItem(record, element) {
    // Called for every bind: update in place. The element is reused for other records.
    element.textContent = record.name;
  },
  releaseItem(record, element) {
    // Release anything attached in renderItem (timers, listeners) here.
  }
});
```

## `data` function example

```js
const grid = new ABI7Grid('#gallery', {
  data: async ({ signal }) => {
    const res = await fetch('/api/photos', { signal });
    return res.json();
  }
});
```

If a newer load starts, `signal` is aborted and a late response from the older request is ignored.

## Converting old option objects

`ABI7Grid.fromLegacyOptions()` lists legacy `events.onXxx` callbacks in `unmapped`: they have no equivalent option; subscribe with `grid.on()` instead.
