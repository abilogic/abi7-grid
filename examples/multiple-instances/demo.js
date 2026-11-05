import { ABI7Grid } from '../../dist/abi7-grid.js';
import { makePhotos, photoSrc } from '../shared/photos.js';

const $ = (id) => document.getElementById(id);

// Two independent instances on two different elements. Nothing is shared between them:
// each has its own DataStore, geometry, DOM pool and event bus.
const left = new ABI7Grid('#left', {
  layout: 'masonry',
  data: makePhotos(30, { seed: 1 }),
  fields: { src: photoSrc },
  layoutOptions: { minWidth: 120, gap: 8 }
});
const right = new ABI7Grid('#right', {
  layout: 'justified',
  data: makePhotos(30, { seed: 2, prefix: 'r' }),
  fields: { src: photoSrc },
  layoutOptions: { targetRowHeight: 110, minRowHeight: 80, maxRowHeight: 150, gap: 6 }
});

const log = (t) => { const d = document.createElement('div'); d.textContent = t; $('log').prepend(d); };
left.on('item:click', (e) => log('left  clicked ' + e.id));
right.on('item:click', (e) => log('right clicked ' + e.id));

let n = 200;
$('both').onclick = () => {
  left.insert(makePhotos(1, { start: n, seed: 3 }), { at: 'start' });
  right.insert(makePhotos(1, { start: n++, seed: 4, prefix: 'r' }), { at: 'start' });
};

// Changing options on one instance does not affect the other.
$('swap').onclick = () => {
  const next = right.getState().layout === 'justified' ? 'grid' : 'justified';
  right.rebuild({ layout: next, layoutOptions: next === 'grid' ? { columns: 3, gap: 6, aspectRatio: 1 } : {} });
  $('swap').textContent = `Switch right grid to ${next === 'grid' ? 'justified' : 'grid'} layout`;
};

// Only one instance can own an element: new ABI7Grid('#left') again would throw ALREADY_INITIALIZED until left.destroy().
