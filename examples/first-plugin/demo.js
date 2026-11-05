import { ABI7Grid } from '../../dist/abi7-grid.js';
import FlashPlugin from './flash-plugin.js';
import { makePhotos, photoSrc } from '../shared/photos.js';

const $ = (id) => document.getElementById(id);

const grid = new ABI7Grid('#gallery', {
  layout: 'masonry',
  data: makePhotos(30),
  fields: { src: photoSrc },
  layoutOptions: { minWidth: 150, gap: 10 }
});

// Install with custom options. They are merged over the plugin's `defaults`.
grid.use(FlashPlugin, { duration: 900 });

const say = (text) => { $('stats').textContent = text; };
grid.on('flash:fired', (e) => say(`flash:fired for ${e.id}; active flashes: ${grid.getPlugin('flash').active()}`));

$('remove').onclick = () => {
  if (grid.hasPlugin('flash')) { grid.unuse('flash'); say('Plugin removed. Plugins: ' + grid.getPlugins().length); }
};
$('install').onclick = () => {
  if (!grid.hasPlugin('flash')) { grid.use(FlashPlugin, { duration: 900 }); say('Plugin installed again.'); }
};
