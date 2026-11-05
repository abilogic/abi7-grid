# @abi7/lightbox

Viewing an image on top of the grid: click on the card, arrows, Escape, Home/End, swipe on the phone, close by clicking on the background.

```js
import LightboxPlugin from './lightbox.js';

grid.use(LightboxPlugin, { loop: true, animation: 250 });
grid.getPlugin('lightbox').open('photo-3');
```

CSS (`lightbox.css`) is connected separately.

## Options

| Option | Default | Description |
|---|---|---|
| `loop` | `false` | jump to the end of the list |
| `closeOnBackdrop` | `true` | close by clicking on the background |
| `keyboard` | `true` | Escape, ←, →, Home, End |
| `counter` | `true` | counter "3 / 120" |
| `animation` | `220` | animation duration, ms (`0` — no animation) |
| `swipe` | `true` | swipe for touch screens |
| `getSrc` | `null` | `(record) => url` full size image (default `fields.src`) |
| `getCaption` | `null` | `(record) => string` (default `fields.title`) |

## Methods

`open(id)`, `close()`, `next()`, `prev()`, `isOpen()`, `current()`.

## Events

`lightbox:before-open` (cancelable), `lightbox:open`, `lightbox:change`, `lightbox:close`.

All open viewer handlers are bound to one `AbortController`; when closing, `unuse()` and `destroy()` they are removed at once. URLs are checked for secure schemes, signatures are output via `textContent`.

---

Part of ABI7 Grid Community (free for non-commercial use only). Commercial license: https://abi7.com
