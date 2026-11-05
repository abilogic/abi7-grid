// Import Core. The core is one file and does not contain plugin code:
// Everything you need for a basic grid is here.
import { ABI7Grid } from '../../dist/abi7-grid.js';

// Auxiliary test data generator (see section “Examples → general photos.js file”).
import { makePhotos, photoSrc } from '../shared/photos.js';

// Data is a regular array of objects. The kernel needs id and dimensions (width/height):
// Layout calculates the geometry using them, without waiting for the images to load.
const photos = makePhotos(40);

// Let's create an instance. The first argument is the selector or container element.
const grid = new ABI7Grid('#gallery', {
  // layout selects the geometry calculation algorithm: 'masonry' | 'grid' | 'justified' (+ plugins).
  layout: 'masonry',

  data: photos,

  // fields.src - function: the kernel does not need to know where the URL of the image is.
  // It is called only for cards that are in the DOM, and not for all entries.
  fields: { src: photoSrc },

  // Layout algorithm settings. minWidth + maxColumns determine the number of columns automatically.
  layoutOptions: { gap: 12, minWidth: 160, maxColumns: 5 }
});

const out = document.querySelector('#out');

// Subscribe to a click event. The kernel assigns ONE listener per container (delegation),
// and not one listener for each card - that’s why clicks are cheap even with 50,000 records.
grid.on('item:click', (event) => {
  out.textContent = `Click: ${event.item.title}, index ${event.index}, id ${event.id}`;
});

// ready fires once - after the first successful layout (when the container has a size).
grid.on('ready', (event) => {
  out.textContent = `Done: ${event.count} cards. Click on any of them.`;
});
