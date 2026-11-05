import { ABI7Grid } from '../../dist/abi7-grid.js';
import { makePhotos, photoSrc } from '../shared/photos.js';

const $ = (id) => document.getElementById(id);
const sleep = (ms, signal) => new Promise((resolve, reject) => {
  const t = setTimeout(resolve, ms);
  // The core aborts the signal when a newer load replaces this one - stop waiting and free the timer.
  signal && signal.addEventListener('abort', () => { clearTimeout(t); reject(new DOMException('aborted', 'AbortError')); });
});

let requests = 0;

// `data` may be a function that returns a Promise. It receives { signal, source }.
// A response from an outdated request is ignored by the core (no race conditions).
const grid = new ABI7Grid('#gallery', {
  layout: 'masonry',
  layoutOptions: { minWidth: 160, gap: 10 },
  fields: { src: photoSrc },
  data: async ({ signal }) => {
    const id = ++requests;
    // The first load is instant (as if cached); reloads pretend to be a slower network request.
    await sleep(id === 1 ? 30 : 700, signal);
    return makePhotos(36, { seed: id });
  }
});

const log = (t) => {
  if (!$('log')) return; // the page may already be gone when a late response arrives
  const d = document.createElement('div'); d.textContent = t; $('log').prepend(d);
};
const show = () => {
  if (!$('stats')) return;
  const s = grid.getState();
  $('stats').innerHTML = `phase: <b>${s.phase}</b> · loading: <b>${s.loading}</b> · records: <b>${s.count}</b> · cards in DOM: <b>${s.virtualization.mounted}</b>`;
};

grid.on('data:load-start', (e) => { log(`data:load-start (${e.source})`); show(); });
grid.on('data:load-end', (e) => { log(`data:load-end (${e.source}) count=${e.count}${e.error ? ' error' : ''}`); show(); });
grid.on('layout:end', show);
grid.on('error', (e) => { if (e.error && e.error.name !== 'AbortError') log('error: ' + e.message); });

// whenReady() resolves after the first layout.
grid.whenReady().then(() => log('ready: first layout done'));

// reload() calls the data function again (for array data it just re-binds and re-lays out).
$('reload').onclick = () => grid.reload();
// Two quick reloads: the first request is aborted through its signal and only the last response is applied.
$('reloadFast').onclick = () => { grid.reload(); setTimeout(() => grid.reload(), 100); };
