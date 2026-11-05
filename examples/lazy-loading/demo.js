import { ABI7Grid } from '../../dist/abi7-grid.js';
import { makePhotos, photoSrc } from '../shared/photos.js';

const $ = (id) => document.getElementById(id);

const PAGE = 20;
const MAX_PAGES = 8;
let page = 1;
let busy = false;

const grid = new ABI7Grid('#gallery', {
  layout: 'masonry',
  data: makePhotos(PAGE),
  fields: { src: photoSrc },
  layoutOptions: { minWidth: 150, gap: 10 },
  // reach:end fires when the viewport is within endThreshold px of the end of the content.
  virtualization: { endThreshold: 200 }
});

const show = () => {
  if (!$('stats')) return; // the page may already be gone when a late response arrives
  const s = grid.getState();
  $('stats').innerHTML = `pages: <b>${page}/${MAX_PAGES}</b> · records: <b>${s.count}</b> · cards in DOM: <b>${s.virtualization.mounted}</b> (only the visible ones plus overscan)`;
};

grid.on('reach:end', async () => {
  if (busy || page >= MAX_PAGES) return;
  busy = true; // reach:end can fire again while we are still waiting for the "server"
  await new Promise((r) => setTimeout(r, 300));
  grid.insert(makePhotos(PAGE, { start: page * PAGE + 1, seed: 20 + page }), { at: 'end' });
  page++;
  busy = false;
  show();
});
grid.on('layout:end', show);
grid.on('scroll', show);
