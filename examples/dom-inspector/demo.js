import { ABI7Grid } from '../../dist/abi7-grid.js';
import { makePhotos, photoSrc } from '../shared/photos.js';

const $ = (id) => document.getElementById(id);

const grid = new ABI7Grid('#gallery', {
  layout: 'grid',
  data: makePhotos(12),
  fields: { src: photoSrc },
  layoutOptions: { columns: 4, aspectRatio: 1.2, gap: 10 },
  animation: { enabled: false }
});

const log = (t) => { const d = document.createElement('div'); d.textContent = t; $('log').prepend(d); };
const firstCard = () => document.querySelector('#gallery .abi7-item');

// The core has no MutationObserver. Whatever you change on a card element (in DevTools or from your own script)
// is not noticed. What happens next depends on which part you changed:
//  - position and size (style.transform / width / height) are written again on the next layout pass;
//  - content (children, text) is written again when the card is re-bound: reload(), update(id), or when the
//    element is reused for another record after it left the viewport.
$('edit').onclick = () => {
  const el = firstCard();
  if (!el) return;
  el.style.outline = '3px solid #e5484d';
  el.style.transform = 'translate3d(40px, 40px, 0)';
  const cap = el.querySelector('.abi7-caption');
  if (cap) cap.textContent = 'Edited in DevTools';
  log('edited: outline, transform and caption text changed directly in the DOM');
};

// A layout pass re-positions mounted cards: transform is restored, outline and caption are left alone.
$('layout').onclick = () => { grid.refresh(); log('refresh(): transform restored; the outline and the caption edit remain'); };

// reload() re-binds all mounted cards from the data: the caption is restored (the outline is a style the core never owned).
$('rebind').onclick = () => { grid.reload(); log('reload(): card content rebuilt from data'); };
