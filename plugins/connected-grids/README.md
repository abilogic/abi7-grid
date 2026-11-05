# @abi7/connected-grids

Transfer cards between ABI7 Grid instances using drag and drop (mouse and touch). The plugin uses Drag & Drop cores and public data methods `remove` / `insert`.

```js
import ConnectedGrids from './connected-grids.js';

todo.use(ConnectedGrids, { group: 'board', name: 'todo' });
done.use(ConnectedGrids, { group: 'board', name: 'done' });

// programmatically:
todo.getPlugin('connected-grids').transfer('card-1', 'done');
```

CSS (`connected-grids.css`) is connected separately.

## Options

| Option | Default | Description |
|---|---|---|
| `group` | `'default'` | grids with the same value are linked |
| `name` | `''` | group member name (for `transfer()`) |
| `copy` | `false` | copy instead of transfer |
| `accept` | `null` | `(record, { from, to }) => boolean` |
| `overClass` | `'abi7-connected-over'` | receiver grid backlight class |

## Compatibility check

When `use()` the plugin checks that the major version of the core and the field match in the group `fields.id`, and `name` unique. Otherwise, the installation is rejected with an error and nothing is logged.

## Events

On the source grid: `connected-grids:before-transfer` (cancelable), `connected-grids:transfer`. On the receiving grid: `connected-grids:receive`. Data from both grids is updated via `remove`/`insert`, so the usual ones work `item:remove`/`item:insert` and recalculation of geometry. If `id` busy in the receiver, the entry receives a new one (`id-2`).

---

Part of ABI7 Grid Community (free for non-commercial use only). Commercial license: https://abi7.com
