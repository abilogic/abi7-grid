import { ABI7Grid } from '../../dist/abi7-grid.js';
import { makePhotos, photoSrc } from '../shared/photos.js';

const $ = (id) => document.getElementById(id);

// The current layout settings are stored separately so that the sliders and the Rebuild button
// always passed a complete and consistent set of values to the grid.
const layoutOptions = { gap: 12, minWidth: 180, maxColumns: 5 };

// Counter for id of new cards: id must be unique within the grid.
let nextNumber = 61;

const grid = new ABI7Grid('#gallery', {
  layout: 'masonry',
  data: makePhotos(60),
  fields: { src: photoSrc },
  layoutOptions,
  // Animation is turned on only during rebuilds (insertion, deletion, changing settings).
  // Scrolling is never animated - otherwise the cards would “fly” when scrolling.
  animation: { enabled: true, duration: 350 }
});

// --- Event log ---------------------------------------------------------
const log = (text) => {
  const line = document.createElement('div');
  line.textContent = text; // textContent, not innerHTML - safe for any data
  $('log').prepend(line);
  while ($('log').childElementCount > 30) $('log').lastChild.remove();
};

// layout:end comes after EVERY geometry recalculation. In event.info layout it gives
// your data - for Masonry this is the number of columns and the width of the card.
grid.on('layout:end', (e) => {
  const s = grid.getState();
  $('stats').innerHTML =
    `layout: <b>${s.layout}</b> · columns: <b>${e.info.columns}</b> · card width: <b>${e.info.itemWidth}px</b> · ` +
    `entries: <b>${s.count}</b> · content height: <b>${Math.round(e.contentHeight)}px</b> · ` +
    `conversion from index <b>${e.from}</b> (reason: ${e.reason}, ${e.duration.toFixed(1)} ms)`;
});
grid.on('item:insert', (e) => log(`item:insert ${e.id} per position ${e.index}`));
grid.on('item:remove', (e) => log(`item:remove ${e.id} (there was a position ${e.index})`));
grid.on('item:click', (e) => log(`item:click ${e.id}`));

// --- Add / Remove -----------------------------------------------------------
// insert() inserts a record and rebuilds the geometry PARTIALLY - only starting from that position.
$('add').onclick = () => {
  const [photo] = makePhotos(1, { start: nextNumber++, seed: 99 });
  grid.insert(photo, { at: 'start' });
};

// remove() accepts an id (or an array of ids). Below, the first card from the list is removed.
$('remove').onclick = () => {
  const first = grid.getItems()[0];
  if (first) grid.remove(first.id);
};

// refresh() re-sizes the container and recalculates ALL geometry. Needed if you
// The container dimensions have been changed, and automatic tracking (autoResize) is disabled.
$('refresh').onclick = () => grid.refresh();

// rebuild(options) applies new settings: recreates the layout engine, resets the DOM pool
// and rearranges everything. The data and scroll position are preserved.
$('rebuild').onclick = () => grid.rebuild({ layoutOptions });

// --- Settings sliders --------------------------------------------------------
for (const key of ['gap', 'minWidth', 'maxColumns']) {
  $(key).oninput = (e) => {
    layoutOptions[key] = Number(e.target.value);
    $(key + 'Out').textContent = e.target.value;
    grid.rebuild({ layoutOptions: { [key]: layoutOptions[key] } });
  };
}
