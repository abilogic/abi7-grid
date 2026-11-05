import { ABI7Grid } from '../../dist/abi7-grid.js';
import { makePhotos, photoSrc } from '../shared/photos.js';

const $ = (id) => document.getElementById(id);

const grid = new ABI7Grid('#gallery', {
  // 'grid' - classic grid: all cards in a row are the same height.
  layout: 'grid',
  data: makePhotos(120),
  fields: { src: photoSrc },
  layoutOptions: {
    columns: 4, // fixed number of columns; 0 — select automatically by minWidth
    minWidth: 140, // only used when columns = 0
    gap: 12, // indentation both horizontally and vertically (can be set separately: gapX / gapY)
    aspectRatio: 1.5 // cell width/height. If you specify 0, the height is taken from the record data
  }
});

// Settings are updated using ONE method - rebuild(). Only changed ones need to be transferred
// keys: layoutOptions are combined with the current ones, rather than replacing them entirely.
const apply = () => grid.rebuild({
  layoutOptions: {
    columns: Number($('columns').value),
    aspectRatio: Number($('aspect').value),
    gap: Number($('gap').value),
    minWidth: Number($('minWidth').value)
  }
});

for (const id of ['columns', 'aspect', 'gap', 'minWidth']) {
  $(id).addEventListener('input', () => {
    if ($(id + 'Out')) $(id + 'Out').textContent = $(id).value;
    apply();
  });
}

// layout:end is a suitable place to show the result of the calculation. info.columns - real number
// columns (with columns = 0 it depends on the width of the container and changes when resizing).
grid.on('layout:end', (e) => {
  $('stats').innerHTML =
    `columns: <b>${e.info.columns}</b> · rows: <b>${e.info.rows}</b> · cell width: <b>${e.info.itemWidth}px</b> · ` +
    `content height: <b>${Math.round(e.contentHeight)}px</b>`;
});
