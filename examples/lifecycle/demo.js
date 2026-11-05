import { ABI7Grid } from '../../dist/abi7-grid.js';
import { makePhotos, photoSrc } from '../shared/photos.js';

const $ = (id) => document.getElementById(id);

let grid = null;
let generation = 0;

const create = () => {
  generation++;
  grid = new ABI7Grid('#gallery', {
    layout: 'masonry',
    data: makePhotos(30, { seed: generation }),
    fields: { src: photoSrc },
    layoutOptions: { minWidth: 150, gap: 10 }
  });
  // destroy() emits `destroy` first; plugins and listeners are cleaned up right after it.
  grid.on('destroy', () => status('destroy event received'));
  grid.on('layout:end', () => status());
};

const alive = () => grid && !grid.isDestroyed();
const status = (note = '') => {
  const s = alive() ? grid.getState() : null;
  $('stats').innerHTML = s
    ? `instance #${generation} · phase: <b>${s.phase}</b> · layout: <b>${s.layout}</b> · records: <b>${s.count}</b> ${note}`
    : `instance #${generation} is <b>destroyed</b> (isDestroyed() = ${grid ? grid.isDestroyed() : 'n/a'}). ${note}`;
};

// Methods of a destroyed instance throw ABI7Error(code: 'DESTROYED'), so always check isDestroyed() first.
$('rebuild').onclick = () => { if (alive()) grid.rebuild({ layout: grid.getState().layout === 'masonry' ? 'grid' : 'masonry' }); };
$('reload').onclick = () => { if (alive()) grid.reload(); };
$('destroy').onclick = () => { if (alive()) grid.destroy(); status(); };

// A second ABI7Grid on the same element would throw ALREADY_INITIALIZED, so only create after destroy().
$('create').onclick = () => { if (!alive()) { create(); status('created on the same element'); } };

create();
