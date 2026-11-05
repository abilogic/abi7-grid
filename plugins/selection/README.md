# @abi7/selection

Selecting ABI7 Grid elements: click, Ctrl/Cmd+click, Shift+click (range), select all, deselect.

```js
import { ABI7Grid } from '../../dist/abi7-grid.js';
import SelectionPlugin from './selection.js';

const grid = new ABI7Grid('#gallery', { data: photos });
grid.use(SelectionPlugin, { multiple: true });

const selection = grid.getPlugin('selection');
selection.select('photo-1');
selection.getSelected(); // ['photo-1']
```

CSS (`selection.css`) is connected separately.

## Options

| Option | Default | Description |
|---|---|---|
| `multiple` | `true` | several selected elements |
| `className` | `'abi7-selected'` | selected element class |
| `toggleOnClick` | `false` | a regular click on the only selected item deselects the selection |
| `keyboard` | `true` | Ctrl/Cmd+A and Escape on the root element |

## Methods (`grid.getPlugin('selection')`)

`select(id)`, `deselect(id)`, `toggle(id)`, `clear()`, `selectAll()`, `isSelected(id)`, `getSelected()`, `getSelectedItems()`, `count()`.

## Events

`selection:change` — `{ selected: id[], added: id[], removed: id[], source: 'click'|'api'|'keyboard'|'data' }`.

The selection is reset when `data:load-end` (data set replacement) and is reduced when `item:remove`.

---

Part of ABI7 Grid Community (free for non-commercial use only). Commercial license: https://abi7.com
