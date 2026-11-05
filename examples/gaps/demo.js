import { ABI7Grid } from '../../dist/abi7-grid.js';
import { makePhotos, photoSrc } from '../shared/photos.js';

const $ = (id) => document.getElementById(id);

const grid = new ABI7Grid('#gallery', {
  layout: 'grid',
  data: makePhotos(36),
  fields: { src: photoSrc },
  // gap applies to both axes; gapX / gapY (when not null) override it for one axis.
  layoutOptions: { columns: 4, aspectRatio: 1.2, gapX: 12, gapY: 12 },
  // Animation makes the change of spacing visible: only rebuilds are animated, never scrolling.
  animation: { enabled: true, duration: 250 }
});

for (const key of ['gapX', 'gapY']) {
  $(key).oninput = (e) => {
    $(key + 'Out').textContent = e.target.value;
    grid.rebuild({ layoutOptions: { [key]: Number(e.target.value) } });
  };
}

grid.on('layout:end', (e) => {
  $('stats').innerHTML = `columns: <b>${e.info.columns}</b> · rows: <b>${e.info.rows}</b> · cell width: <b>${e.info.itemWidth}px</b> · content height: <b>${Math.round(e.contentHeight)}px</b>`;
});
