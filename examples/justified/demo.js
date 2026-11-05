import { ABI7Grid } from '../../dist/abi7-grid.js';
import { makePhotos, photoSrc } from '../shared/photos.js';

const $ = (id) => document.getElementById(id);

const grid = new ABI7Grid('#gallery', {
  // 'justified' builds rows of equal height: width of each card = row height × its aspect ratio,
  // and the height of the row is selected so that the row evenly fills the width of the container.
  layout: 'justified',

  // Posts have width and height - the core takes the aspect ratio from them. Pictures do not need to be uploaded.
  data: makePhotos(200),
  fields: { src: photoSrc },

  layoutOptions: {
    targetRowHeight: 200, // desired row height
    minRowHeight: 120, // the row will not become lower if it can be avoided
    maxRowHeight: 300, // and above
    gap: 8,
    lastRow: 'left' // what to do with the incomplete last line: left | center | right | justify
  }
});

// All sliders work the same: we read the value, update the signature and transmit
// changed key in rebuild(). Layout will recalculate the rows starting from the first.
for (const key of ['targetRowHeight', 'minRowHeight', 'maxRowHeight', 'gap', 'lastRow']) {
  $(key).addEventListener('input', (e) => {
    const value = key === 'lastRow' ? e.target.value : Number(e.target.value);
    if ($(key + 'Out')) $(key + 'Out').textContent = e.target.value;
    grid.rebuild({ layoutOptions: { [key]: value } });
  });
}

function showStats() {
  // The real heights of the rows are visible from the geometry: all cards in the same row have the same rect.height.
  const heights = [...new Set(grid.getVisibleItems().map((i) => i.rect.height))].sort((a, b) => a - b);
  const s = grid.getState();
  $('stats').innerHTML =
    `rows: <b>${s.layoutInfo.rows}</b> · content height: <b>${Math.round(s.contentHeight)}px</b> · ` +
    `heights of visible rows: <b>${heights.join(', ')}</b>`;
}

// Statistics are updated after each layout and after scrolling is stopped
// (when scrolling, the set of visible rows changes, but the geometry is not recalculated).
grid.on('layout:end', showStats);
grid.on('scroll:stop', showStats);
