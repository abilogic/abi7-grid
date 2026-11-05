import { ABI7Grid } from '../../dist/abi7-grid.js';
import { makePhotos, photoSrc } from '../shared/photos.js';

const $ = (id) => document.getElementById(id);

// autoResize (default true) observes the container with a ResizeObserver and relayouts when its size changes.
// minWidth decides how many columns fit: narrower container -> fewer columns.
const grid = new ABI7Grid('#gallery', {
  layout: 'masonry',
  data: makePhotos(40),
  fields: { src: photoSrc },
  layoutOptions: { minWidth: 120, gap: 8 }
});

const setWidth = (css) => { $('wrap').style.width = css; };
$('width').oninput = (e) => { $('widthOut').textContent = e.target.value + '%'; setWidth(e.target.value + '%'); };
$('px320').onclick = () => setWidth('320px');
$('px600').onclick = () => setWidth('600px');

// The core emits `resize` with the new container size, then recalculates the layout in the next frame.
grid.on('resize', (e) => { $('stats').dataset.size = `${e.width}×${e.height}`; });
grid.on('layout:end', (e) => {
  $('stats').innerHTML = `container: <b>${$('stats').dataset.size || 'initial'}</b> · columns: <b>${e.info.columns}</b> · reason: <b>${e.reason}</b>`;
});
// If you disable autoResize, call grid.refresh() yourself after changing the container size.
