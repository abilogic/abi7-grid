# @abi7/layout-horizontal

Horizontal strip: cards of the same height and different widths (`width = height × aspect ratio`), horizontal scrolling, virtualization from Core.

```js
import { ABI7Grid } from '../../dist/abi7-grid.js';
import HorizontalLayout from './horizontal.js';

const grid = new ABI7Grid('#strip', {
  layout: 'horizontal',           // the name can be specified before connecting the plugin:
  data: photos,                   // the grid will wait for the layout to be registered
  layoutOptions: { height: 220, gap: 12 }
});
grid.use(HorizontalLayout);

// Or globally, for all page grids:
// ABI7Grid.registerLayout('horizontal', HorizontalLayout);
```

Layout does not require a CSS file.

## layoutOptions

| Option | Default | Description |
|---|---|---|
| `height` | `0` | ribbon height, px; `0` — container height |
| `gap` | `12` | distance between cards |
| `itemWidth` | `0` | fixed width; `0` — by aspect ratio |
| `defaultAspect` | `1.5` | aspect ratio for posts without dimensions |
| `align` | `'start'` | `'center'` centers the tape vertically if it is below the container |

`scrollToIndex()` works on the horizontal axis automatically: Core knows the axis from `axis: 'x'`.

---

Part of ABI7 Grid Community (free for non-commercial use only). Commercial license: https://abi7.com
