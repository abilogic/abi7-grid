import { ABI7Grid } from '../../dist/abi7-grid.js';
import ConnectedGrids from '../../plugins/connected-grids/connected-grids.js';
import { makePhotos, photoSrc } from '../shared/photos.js';

const $ = (id) => document.getElementById(id);

// Two INDEPENDENT instances: each has its own data, its own DOM Pool, its own geometry.
// The same options are included in the function so as not to duplicate the code.
const make = (selector, data) =>
  new ABI7Grid(selector, {
    layout: 'grid',
    data,
    fields: { src: photoSrc },
    layoutOptions: { columns: 2, gap: 8, aspectRatio: 1.2 },
    // Drag & Drop inside the grid (changing the order) is a core function; the plugin will enable it itself,
    // but here we indicate this explicitly for clarity.
    interaction: { drag: { enabled: true } }
  });

const left = make('#left', makePhotos(10, { prefix: 'a', seed: 3 }));
const right = make('#right', makePhotos(4, { prefix: 'b', seed: 5 }));

// We connect the plugin to EVERY grid with the same group. name is needed for software transfer.
// When connected, the plugin checks compatibility: one major version of the core and one id field.
left.use(ConnectedGrids, { group: 'board', name: 'left' });
right.use(ConnectedGrids, { group: 'board', name: 'right' });

// We take counters from the grid data - they are updated with any changes (transfer, insertion, deletion).
const counts = () => {
  $('leftCount').textContent = left.getCount() + ' pcs.';
  $('rightCount').textContent = right.getCount() + ' pcs.';
};
for (const g of [left, right]) {
  g.on('item:insert', counts);
  g.on('item:remove', counts);
}
counts();

// Transfer events are the plugin's own events (prefix "connected-grids:").
const log = (text) => {
  const line = document.createElement('div');
  line.textContent = text;
  $('log').prepend(line);
};
left.on('connected-grids:transfer', (e) => log(`left → ${e.to}: ${e.id}${e.newId !== e.id ? ` (id busy, new id: ${e.newId})` : ''}, position ${e.index}`));
right.on('connected-grids:transfer', (e) => log(`right → ${e.to}: ${e.id}, position ${e.index}`));
left.on('connected-grids:receive', (e) => log(`left received ${e.id} from ${e.from}`));
right.on('connected-grids:receive', (e) => log(`right received ${e.id} from ${e.from}`));

// Software transfer via the plugin's public interface (feature).
$('move').onclick = () => {
  const first = left.getItems()[0];
  if (first) left.getPlugin('connected-grids').transfer(first.id, 'right', { at: 0 });
};
