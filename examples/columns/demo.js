import { ABI7Grid } from '../../dist/abi7-grid.js';
import { makePhotos, photoSrc } from '../shared/photos.js';

const $ = (id) => document.getElementById(id);

// layoutOptions.columns fixes the number of columns. With columns: 0 (default) the layout would pick
// the count automatically from minWidth (see the "Responsive" example).
const grid = new ABI7Grid('#gallery', {
  layout: 'masonry',
  data: makePhotos(48),
  fields: { src: photoSrc },
  layoutOptions: { columns: 3, gap: 10 }
});

// rebuild(patch) merges the patch into the current options and re-runs the layout.
// Nested objects are merged, so { layoutOptions: { columns: 2 } } keeps gap: 10.
for (const n of [2, 3, 4]) $('c' + n).onclick = () => grid.rebuild({ layoutOptions: { columns: n } });

// Switching the layout algorithm uses the same method. Both layouts understand `columns`.
$('layout').onchange = (e) => grid.rebuild({ layout: e.target.value });

// layout:end fires after every geometry recalculation; event.info is filled in by the layout.
grid.on('layout:end', (e) => {
  $('stats').innerHTML = `layout: <b>${grid.getState().layout}</b> · columns: <b>${e.info.columns}</b> · item width: <b>${e.info.itemWidth}px</b> · content height: <b>${Math.round(e.contentHeight)}px</b>`;
});
