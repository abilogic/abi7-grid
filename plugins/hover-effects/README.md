# @abi7/hover-effects

Hover effects that use the core geometry (`api.viewport.indexAtClientPoint`) instead of DOM lookups. Effects: `zoom`, `lift`, `dim-others`, `none`.

```js
import { ABI7Grid } from '../../dist/abi7-grid.js';
import Plugin from './hover-effects.js';

const grid = new ABI7Grid('#gallery', { data: photos });
grid.use(Plugin);
const api = grid.getPlugin('hover-effects');
```

CSS (`hover-effects.css`) is connected separately.

## Options

| Option | Default | Description |
|---|---|---|
| `effect` | `'zoom'` | initial effect: `zoom`, `lift`, `dim-others` or `none` |

## Methods (`grid.getPlugin('hover-effects')`)

`setEffect(name)`, `getEffect()`, `getActive()`, `effects()`

## Events

`hover-effects:change` `{ id }`, `hover-effects:effect` `{ effect }`

The plugin never touches the card's own `transform` (the core positions cards with it). Effects are CSS classes applied to the card children.

---

Part of ABI7 Grid Community (free for non-commercial use only). Commercial license: https://abi7.com
