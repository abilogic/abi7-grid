import { ABI7Grid } from '../../dist/abi7-grid.js';
import LightboxPlugin from '../../plugins/lightbox/lightbox.js';
import { makePhotos, photoSrc } from '../shared/photos.js';

const $ = (id) => document.getElementById(id);

const grid = new ABI7Grid('#gallery', {
  layout: 'justified',
  data: makePhotos(60),
  fields: { src: photoSrc },
  layoutOptions: { targetRowHeight: 150, minRowHeight: 100, maxRowHeight: 220, gap: 8 }
});

// Plugin settings are passed as the second argument to use().
// getSrc allows you to show another (full-size) image in the viewer,
// different from the thumbnail in the grid. Here, for clarity, we increase the size of the SVG.
grid.use(LightboxPlugin, {
  loop: true, // after the last photo - the first one again
  animation: 250, // ms; 0 disables animation
  closeOnBackdrop: true, // close by clicking on the dark background
  keyboard: true, // Esc, arrows, Home/End
  getSrc: (photo) => photoSrc({ ...photo, width: 1600, height: Math.round(1600 * (photo.height / photo.width)) }),
  getCaption: (photo) => `${photo.title} · ${photo.width}×${photo.height}`
});

// Each time we take the public interface again via getPlugin(): after unuse()/use() it’s already
// another instance of the plugin, and the link to the old one is “closed” (the call will be made by PLUGIN_INACTIVE).
$('open5').onclick = () => grid.getPlugin('lightbox').open('photo-5');

// loop — plugin option; to change it on the fly, reinstall the plugin:
// unuse() calls the cleanup function (closes the window, removes all subscriptions).
$('loop').onchange = (e) => {
  grid.unuse('lightbox');
  grid.use(LightboxPlugin, { loop: e.target.checked, animation: 250 });
};

// Plugin events are regular grid events with the prefix “lightbox:”.
const log = (text) => {
  const line = document.createElement('div');
  line.textContent = text;
  $('log').prepend(line);
};
grid.on('lightbox:open', (e) => log(`lightbox:open id=${e.id} index=${e.index}`));
grid.on('lightbox:change', (e) => log(`lightbox:change ${e.previousId} → ${e.id}`));
grid.on('lightbox:close', (e) => log(`lightbox:close id=${e.id}`));
