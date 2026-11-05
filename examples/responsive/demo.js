import { ABI7Grid } from '../../dist/abi7-grid.js';
import { makePhotos, photoSrc } from '../shared/photos.js';

const $ = (id) => document.getElementById(id);

// Responsive behaviour comes from three things working together:
//  1. minWidth    - the smallest acceptable column width;
//  2. maxColumns  - an upper limit for wide screens;
//  3. autoResize  - a ResizeObserver on the container (also reacts to window resizes that change the container).
const grid = new ABI7Grid('#gallery', {
  layout: 'masonry',
  data: makePhotos(40),
  fields: { src: photoSrc },
  layoutOptions: { minWidth: 160, maxColumns: 6, gap: 10 }
});

// Emulating device widths by resizing the wrapper (the page itself is inside an iframe here).
const setWidth = (px) => { $('wrap').style.width = px + 'px'; };
$('phone').onclick = () => setWidth(360);
$('tablet').onclick = () => setWidth(768);
$('desktop').onclick = () => setWidth(1100);

$('max').oninput = (e) => {
  $('maxOut').textContent = e.target.value;
  grid.rebuild({ layoutOptions: { maxColumns: Number(e.target.value) } });
};

grid.on('layout:end', (e) => {
  const vp = grid.getState().viewport;
  $('stats').innerHTML = `viewport: <b>${vp ? vp.width : '?'}px</b> · columns: <b>${e.info.columns}</b> · item width: <b>${e.info.itemWidth}px</b> · reason: ${e.reason}`;
});
