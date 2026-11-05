# ABI7 Grid plugins

Plugins extend the core through the **Plugin API**. They never import the core: the core passes an `api` object to `install()` and removes everything the plugin registered when the plugin is removed or the grid is destroyed.

**Need ABI7 Grid for commercial projects? Get a commercial license at https://abi7.com**

All plugins in this directory are part of the Software and are licensed under the ABI7 Grid Community License (free for non-commercial use only). See [`../licenses/LICENSE-COMMUNITY.md`](../licenses/LICENSE-COMMUNITY.md).

| Plugin | Directory | Purpose |
|---|---|---|
| `@abi7/selection` | `selection/` | Selection: click, Ctrl/Cmd, Shift range, select all |
| `@abi7/lightbox` | `lightbox/` | Full-screen viewer over the grid: keyboard, swipe |
| `@abi7/layout-horizontal` | `layout-horizontal/` | Horizontal strip layout |
| `@abi7/connected-grids` | `connected-grids/` | Drag cards between grids |
| `@abi7/hover-effects` | `hover-effects/` | Hover effects driven by core geometry (zoom, lift, dim others) |
| `@abi7/reveal` | `reveal/` | Fade-in when cards are first mounted, with stagger |
| `@abi7/transitions` | `transitions/` | Named presets for the core `animation` options |

Every plugin directory contains its source (`*.js`, optionally `*.css`), a `README.md` and a `package.json`. The `package.json` files are marked `private`: they describe the plugin and are **not** published to npm.

## Usage

```js
import { ABI7Grid } from '../dist/abi7-grid.js';
import RevealPlugin from './reveal/reveal.js';

const grid = new ABI7Grid('#gallery', { data });
grid.use(RevealPlugin, { stagger: 40 });
grid.getPlugin('reveal').reset();
grid.unuse('reveal');
```

Plugin CSS is a separate file: `<link rel="stylesheet" href="plugins/reveal/reveal.css">`.

## Writing your own plugin

See the documentation: *Building Your First Plugin*, *Plugin Development Guide* and *Plugin API* (in `docs/pages/`, and on the documentation site). A plugin you write yourself is independent of this repository; running it together with ABI7 Grid is still governed by the Community License (non-commercial) or by a commercial license.
