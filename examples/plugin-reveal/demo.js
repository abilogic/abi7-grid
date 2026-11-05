import { ABI7Grid } from '../../dist/abi7-grid.js';
import RevealPlugin from '../../plugins/reveal/reveal.js';
import { makePhotos, photoSrc } from '../shared/photos.js';

const $ = (id) => document.getElementById(id);

const create = (stagger) => {
  const g = new ABI7Grid('#gallery', {
    layout: 'masonry',
    data: makePhotos(120),
    fields: { src: photoSrc },
    layoutOptions: { minWidth: 150, gap: 10 },
    // Plugins can also be listed in the constructor: [plugin, options] pairs are installed on start.
    plugins: [[RevealPlugin, { stagger, distance: 24, duration: 500 }]]
  });
  g.on('scroll', () => show(g));
  g.on('layout:end', () => show(g));
  return g;
};
const show = (g) => {
  const r = g.getPlugin('reveal');
  $('stats').innerHTML = `revealed so far: <b>${r ? r.revealedCount() : 0}</b> of ${g.getCount()} · cards in DOM: <b>${g.getState().virtualization.mounted}</b>`;
};

let grid = create(40);

// Because virtualization recycles DOM nodes, "once: true" (default) remembers record ids:
// scrolling back does not replay the animation. reset() forgets them.
$('replay').onclick = () => {
  const r = grid.getPlugin('reveal');
  if (r) r.reset();
  grid.reload();
};

// The stagger value is a plugin option: recreate the grid so the plugin is installed with the new options.
$('stagger').oninput = (e) => {
  $('staggerOut').textContent = e.target.value;
  grid.destroy(); // returns the container to its original state ...
  grid = create(Number(e.target.value)); // ... so a new instance can be created on it
};
