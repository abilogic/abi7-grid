# @abi7/reveal

Fade-in animation when a card is mounted into the DOM for the first time (initial render and scrolling).

```js
import { ABI7Grid } from '../../dist/abi7-grid.js';
import Plugin from './reveal.js';

const grid = new ABI7Grid('#gallery', { data: photos });
grid.use(Plugin);
const api = grid.getPlugin('reveal');
```

CSS (`reveal.css`) is connected separately.

## Options

| Option | Default | Description |
|---|---|---|
| `once` | `true` | animate each record only the first time it is mounted |
| `stagger` | `40` | ms between cards mounted in the same batch |
| `maxStagger` | `12` | cap for the stagger multiplier |
| `distance` | `18` | px of upward travel |
| `duration` | `450` | ms |

## Methods (`grid.getPlugin('reveal')`)

`reset()`, `revealedCount()`

## Events

—

Uses `item:mount` and `api.renderer.toggleClass()` so the class survives DOM node reuse. Honors `prefers-reduced-motion`.

---

Part of ABI7 Grid Community (free for non-commercial use only). Commercial license: https://abi7.com
