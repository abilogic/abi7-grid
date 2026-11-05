import { ABI7Grid } from '../../dist/abi7-grid.js';
import { makePhotos, photoSrc } from '../shared/photos.js';

const $ = (id) => document.getElementById(id);

const grid = new ABI7Grid('#gallery', {
  layout: 'masonry',
  data: makePhotos(24),
  fields: { src: photoSrc },
  layoutOptions: { minWidth: 150, gap: 10 },
  animation: { enabled: true, duration: 350 }
});

let next = 100; // ids must be unique inside one grid
let edits = 0;
const log = (text) => {
  const line = document.createElement('div');
  line.textContent = text;
  $('log').prepend(line);
  while ($('log').childElementCount > 40) $('log').lastChild.remove();
};

// Every data method fires its own event; the log shows what the core reports.
grid.on('item:insert', (e) => log(`item:insert  ${e.count} item(s) at index ${e.index}`));
grid.on('item:remove', (e) => log(`item:remove  ${e.id} (was at ${e.index})`));
grid.on('item:update', (e) => log(`item:update  ${e.id}, changed: ${e.changed.join(', ')}`));
grid.on('item:move', (e) => log(`item:move    ${e.id}: ${e.from} -> ${e.to}`));
grid.on('layout:end', (e) => log(`layout:end   recalculated from index ${e.from} (${e.reason}, ${e.duration.toFixed(1)} ms)`));

// insert(items, { at }) - at: 'start' | 'end' | integer. Returns the ids of the inserted records.
$('addStart').onclick = () => grid.insert(makePhotos(1, { start: next++, seed: 5 }), { at: 'start' });
$('addEnd').onclick = () => grid.insert(makePhotos(1, { start: next++, seed: 6 }), { at: 'end' });

// remove(idOrIds) returns how many records were removed.
$('removeFirst').onclick = () => { const it = grid.getItems()[0]; if (it) grid.remove(it.id); };
$('removeLast').onclick = () => { const all = grid.getItems(); if (all.length) grid.remove(all[all.length - 1].id); };

// update(id, patch): a changed height invalidates the geometry from this item; a changed title only rebinds the card.
$('update').onclick = () => {
  const it = grid.getItems()[0];
  if (it) grid.update(it.id, { title: 'Edited #' + ++edits, height: it.height > 500 ? 300 : 700 });
};

// move(id, toIndex) reorders the data without recreating the cards.
$('move').onclick = () => { const it = grid.getItems()[0]; if (it) grid.move(it.id, grid.getCount() - 1); };
