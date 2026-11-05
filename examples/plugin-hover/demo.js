import { ABI7Grid } from '../../dist/abi7-grid.js';
import HoverEffectsPlugin from '../../plugins/hover-effects/hover-effects.js';
import { makePhotos, photoSrc } from '../shared/photos.js';

const $ = (id) => document.getElementById(id);

const grid = new ABI7Grid('#gallery', {
  layout: 'masonry',
  data: makePhotos(36),
  fields: { src: photoSrc },
  layoutOptions: { minWidth: 160, gap: 12 }
});

// Plugin options are the second argument of use(); they are merged with the plugin's `defaults`.
grid.use(HoverEffectsPlugin, { effect: 'zoom' });

// The plugin's public interface is available through getPlugin(name).
const status = (text) => { $('stats').textContent = text; };
grid.on('hover-effects:change', (e) => status(e.id === null ? 'No card hovered' : 'Hovered: ' + e.id));

$('effect').onchange = (e) => {
  const hover = grid.getPlugin('hover-effects');
  if (hover) hover.setEffect(e.target.value);
};

// unuse() runs the plugin cleanup: listeners, classes and registered features are removed.
$('off').onclick = () => { if (grid.hasPlugin('hover-effects')) { grid.unuse('hover-effects'); status('Plugin removed: ' + JSON.stringify(grid.getPlugins().map((p) => p.name))); } };
$('on').onclick = () => { if (!grid.hasPlugin('hover-effects')) { grid.use(HoverEffectsPlugin, { effect: $('effect').value }); status('Plugin installed again'); } };
