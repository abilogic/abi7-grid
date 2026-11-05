# @abi7/transitions

Named presets for the core `animation` options (`enabled`, `duration`, `easing`). It does not add an animation engine: it drives `api.options.set()`.

```js
import { ABI7Grid } from '../../dist/abi7-grid.js';
import Plugin from './transitions.js';

const grid = new ABI7Grid('#gallery', { data: photos });
grid.use(Plugin);
const api = grid.getPlugin('transitions');
```

## Options

| Option | Default | Description |
|---|---|---|
| `preset` | `'smooth'` | initial preset: `smooth`, `snappy`, `bounce`, `slow`, `none` |
| `presets` | `{}` | your own presets `{ name: { enabled, duration, easing } }` |

## Methods (`grid.getPlugin('transitions')`)

`use(name)`, `current()`, `list()`, `define(name, preset)`

## Events

`transitions:change` `{ preset, enabled, duration, easing }`

The original `animation` options are restored when the plugin is removed. Only rearrangements are animated by the core, never scrolling.

---

Part of ABI7 Grid Community (free for non-commercial use only). Commercial license: https://abi7.com
