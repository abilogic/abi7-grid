import { ABI7Grid } from '../../dist/abi7-grid.js';
import SelectionPlugin from '../../plugins/selection/selection.js';
import HoverEffectsPlugin from '../../plugins/hover-effects/hover-effects.js';
import RevealPlugin from '../../plugins/reveal/reveal.js';
import { makePhotos, photoSrc } from '../shared/photos.js';

const $ = (id) => document.getElementById(id);

const grid = new ABI7Grid('#gallery', {
  layout: 'masonry',
  data: makePhotos(40),
  fields: { src: photoSrc },
  layoutOptions: { minWidth: 150, gap: 10 }
});

// Several plugins on one grid. Each receives only its own options and its own `api` object.
// Install order matters only when a plugin declares `dependencies`.
grid.use(RevealPlugin, { stagger: 30 });
grid.use(HoverEffectsPlugin, { effect: 'lift' });
grid.use(SelectionPlugin, { multiple: true, className: 'abi7-selected' });

const log = (t) => { const d = document.createElement('div'); d.textContent = t; $('log').prepend(d); };

// Plugin events are namespaced with the plugin name: "selection:change", "hover-effects:change", ...
grid.on('selection:change', (e) => log(`selection:change -> ${grid.getPlugin('selection').count()} selected`));

$('info').onclick = () => log('plugins: ' + grid.getPlugins().map((p) => `${p.name}@${p.version}`).join(', '));
$('clear').onclick = () => { const s = grid.getPlugin('selection'); if (s) s.clear(); };
