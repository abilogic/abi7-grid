// Import Core. The core itself does not contain plugin code,
// Therefore, we connect only those extensions that are really needed.
import { ABI7Grid } from '../../dist/abi7-grid.js';

// Independent highlighting plugin. It does not require modification of the Core source code
// and communicates with the grid only through the public Plugin API.
import SelectionPlugin from '../../plugins/selection/selection.js';

import { makePhotos, photoSrc } from '../shared/photos.js';

const $ = (id) => document.getElementById(id);

const grid = new ABI7Grid('#gallery', {
  layout: 'grid',
  data: makePhotos(80),
  fields: { src: photoSrc },
  layoutOptions: { columns: 0, minWidth: 120, gap: 10, aspectRatio: 1 }
});

// We enable the selection functionality. Core doesn't know exactly how it works —
// all the selection logic is inside the plugin.
// multiple: true allows multiple selected cards (Ctrl/Cmd and Shift).
grid.use(SelectionPlugin, { multiple: true });

// getPlugin(name) returns the public interface that the plugin registered via
// api.features.register('selection', ...). This is a regular object with methods.
const selection = grid.getPlugin('selection');

$('all').onclick = () => selection.selectAll();
$('clear').onclick = () => selection.clear();
$('list').onclick = () => {
  const titles = selection.getSelectedItems().map((p) => p.title);
  $('out').textContent = titles.length ? `Selected (${titles.length}): ${titles.join(', ')}` : 'Nothing is highlighted.';
};

// The plugin generates its own selection:change event. The "selection:" prefix is required:
// The plugin can only generate events with its own name as the namespace.
grid.on('selection:change', (e) => {
  $('out').textContent =
    `selection:change (source: ${e.source})\n` +
    `added: [${e.added.join(', ')}] removed: [${e.removed.join(', ')}]\n` +
    `total allocated: ${e.selected.length}`;
});
