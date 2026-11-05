import { ABI7Grid } from '../../dist/abi7-grid.js';
// We connect our plugin from the adjacent file (see the counter-plugin.js tab).
import CounterPlugin from './counter-plugin.js';
import { makePhotos, photoSrc } from '../shared/photos.js';

const $ = (id) => document.getElementById(id);

const grid = new ABI7Grid('#gallery', {
  layout: 'masonry',
  data: makePhotos(50),
  fields: { src: photoSrc },
  layoutOptions: { gap: 10, minWidth: 140 }
});

// use() calls CounterPlugin.install(api, options). Options are combined with plugin defaults.
grid.use(CounterPlugin, { step: 1, badges: true });

// The public interface is what the plugin has registered via api.features.register('counter', ...).
const counter = grid.getPlugin('counter');

const log = (text) => {
  const line = document.createElement('div');
  line.textContent = text;
  $('log').prepend(line);
};

// We subscribe to the plugin's OWN events in the same way as to core events.
grid.on('counter:change', (e) => {
  $('total').textContent = `Total clicks: ${e.total}`;
  log(`counter:change ${e.id} → ${e.count} (total ${e.total})`);
});
grid.on('counter:reset', (e) => {
  $('total').textContent = 'Total clicks: 0';
  log(`counter:reset (was ${e.previousTotal})`);
});

// Calling plugin methods.
$('reset').onclick = () => counter.reset();
$('top').onclick = () => log('top(3): ' + JSON.stringify(counter.top(3)));

// Disconnect and reconnect. unuse() calls the cleanup function, removes icons,
// unsubscribes and deletes the feature: after this getPlugin('counter') will return null.
let installed = true;
$('toggle').onclick = () => {
  if (installed) {
    grid.unuse('counter');
    $('toggle').textContent = "use(CounterPlugin)";
    log('plugin is disabled, getPlugin("counter") = ' + grid.getPlugin('counter'));
  } else {
    grid.use(CounterPlugin);
    $('toggle').textContent = "unuse('counter')";
    log('plugin reconnected, counters started from scratch');
  }
  installed = !installed;
};
