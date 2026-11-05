import { ABI7Grid } from '../../dist/abi7-grid.js';
// Layout plugin. Core knows nothing about horizontal layout: plugin registers
// algorithm called 'horizontal' via api.layouts.register().
import HorizontalLayout from '../../plugins/layout-horizontal/horizontal.js';
import { makePhotos, photoSrc } from '../shared/photos.js';

const $ = (id) => document.getElementById(id);
const strip = $('strip');

// layout: 'horizontal' can be specified BEFORE connecting the plugin:
// The grid will wait for the layout to be registered and only then execute the first layout.
const grid = new ABI7Grid(strip, {
  layout: 'horizontal',
  data: makePhotos(3000), // 3000 cards of different widths
  fields: { src: photoSrc },
  layoutOptions: { height: 200, gap: 12 }
});

grid.use(HorizontalLayout);

// Virtualization is the same as for vertical layouts - it works according to ready-made geometry
// and does not know whether it is horizontal or vertical. The layout scroll axis is reported by itself (axis: 'x').
const showStats = () => {
  const s = grid.getState();
  $('stats').innerHTML =
    `axis: <b>${s.axis}</b> · records: <b>${s.count}</b> · in DOM: <b>${strip.querySelectorAll('.abi7-item').length}</b> · ` +
    `total width: <b>${Math.round(s.contentWidth).toLocaleString('en-US')} px</b> · scrollLeft: <b>${Math.round(strip.scrollLeft)}</b>`;
};
grid.on('viewport:update', showStats);
grid.on('scroll:stop', showStats);

// We change layoutOptions via rebuild(): layout will recalculate the width of each card.
for (const key of ['height', 'gap']) {
  $(key).oninput = (e) => {
    $(key + 'Out').textContent = e.target.value;
    grid.rebuild({ layoutOptions: { [key]: Number(e.target.value) } });
  };
}

// scrollToIndex selects the axis itself: for a horizontal layout scrolls scrollLeft.
$('go').onclick = () => grid.scrollToIndex(Number($('index').value), { align: 'center' });
