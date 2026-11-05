import { ABI7Grid } from '../../dist/abi7-grid.js';
import TransitionsPlugin from '../../plugins/transitions/transitions.js';
import { makePhotos, photoSrc } from '../shared/photos.js';

const $ = (id) => document.getElementById(id);

const grid = new ABI7Grid('#gallery', {
  layout: 'grid',
  data: makePhotos(16),
  fields: { src: photoSrc },
  layoutOptions: { columns: 4, aspectRatio: 1.2, gap: 10 }
});

// A custom preset is just an object with the core's animation options: enabled, duration, easing.
grid.use(TransitionsPlugin, {
  preset: 'bounce',
  presets: { 'long-ease-out': { duration: 1200, easing: 'cubic-bezier(0.16, 1, 0.3, 1)' } }
});
const transitions = grid.getPlugin('transitions');

// Fill the selector from the plugin instead of hard-coding the names.
$('preset').innerHTML = transitions.list().map((n) => `<option>${n}</option>`).join('');
$('preset').value = transitions.current();
$('preset').onchange = (e) => transitions.use(e.target.value);

const show = (e) => { $('stats').innerHTML = `preset: <b>${e.preset}</b> · duration: <b>${e.duration} ms</b> · easing: <b>${e.easing}</b> · enabled: <b>${e.enabled}</b>`; };
grid.on('transitions:change', show);
show({ preset: transitions.current(), ...grid.getState(), duration: '', easing: '', enabled: '' });

// Rearrangements to try the presets on. The core adds the transition only during these operations.
let n = 500;
$('shuffle').onclick = () => { const it = grid.getItems()[0]; if (it) grid.move(it.id, grid.getCount() - 1); };
$('add').onclick = () => grid.insert(makePhotos(1, { start: n++, seed: 9 }), { at: 'start' });
$('layout').onclick = () => grid.rebuild({ layoutOptions: { columns: grid.getState().layoutInfo.columns === 4 ? 2 : 4 } });
