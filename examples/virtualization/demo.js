import { ABI7Grid } from '../../dist/abi7-grid.js';
import { makePhotos, photoSrc } from '../shared/photos.js';

const $ = (id) => document.getElementById(id);
const gallery = $('gallery');

const grid = new ABI7Grid(gallery, {
  layout: 'masonry',
  data: makePhotos(10000),
  fields: { src: photoSrc },
  layoutOptions: { gap: 8, minWidth: 140 },

  virtualization: {
    enabled: true, // false - mount ALL elements (for comparison)
    overscan: 400, // margin in px outside the visible area: the larger, the less often the “blinking” when scrolling quickly
    adaptiveOverscan: true, // with fast scrolling, the stock increases in the direction of movement (up to maxOverscan)
    maxOverscan: 1600,
    poolSize: 256 // how many DOM elements that fall out of the window should be stored for reuse?
  },
  animation: { enabled: false } // For clarity, we disable the animation of changes
});

// The only place where the numbers for the panel are counted. We count from real sources:
//  - getState().virtualization - internal DOM Pool counters (created / reused / pooled);
//  - gallery.querySelectorAll - how many nodes are actually in the document right now.
function render() {
  const s = grid.getState();
  const v = s.virtualization;
  const inDom = gallery.querySelectorAll('.abi7-item').length;
  $('stats').innerHTML =
    `total entries: <b>${s.count.toLocaleString('en-US')}</b>\n` +
    `DOM elements in the document: <b>${inDom}</b> (mounted by the core: ${v.mounted})\n` +
    `in DOM Pool (awaiting reuse): <b>${v.pooled}</b>\n` +
    `created during all time: <b>${v.created}</b> · reused: <b>${v.reused}</b>\n` +
    `overscan before/after: <b>${Math.round(v.overscan.before)} / ${Math.round(v.overscan.after)} px</b> · ` +
    `content height: <b>${Math.round(s.contentHeight).toLocaleString('en-US')} px</b>`;
}

// viewport:update comes when the set of mounted elements has changed
// (scroll, resize, insert). This is the most suitable event for such a panel.
grid.on('viewport:update', render);
grid.on('scroll:stop', render);

// Changing the array size: setData() replaces the entire data. New entries are created
// quickly, but the DOM remains the same - elements from the pool are simply bound to the new data.
for (const btn of document.querySelectorAll('[data-size]')) {
  btn.onclick = () => grid.setData(makePhotos(Number(btn.dataset.size)));
}

// Virtualization settings are changed on the fly via rebuild().
$('overscan').oninput = (e) => {
  $('overscanOut').textContent = e.target.value;
  grid.rebuild({ virtualization: { overscan: Number(e.target.value) } });
};
$('adaptive').onchange = (e) => grid.rebuild({ virtualization: { adaptiveOverscan: e.target.checked } });

// scrollToIndex uses ready-made geometry - no DOM is created for intermediate elements.
$('go').onclick = () => grid.scrollToIndex(Number($('index').value), { align: 'start' });
$('top').onclick = () => grid.scrollToIndex(0);
