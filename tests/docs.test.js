// Tests “documentation ↔ real code”: the site should not show a non-existent API,
// and examples - crash on startup.
import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { setupDom, makeContainer, scrollTo, photos, loadLib, makeGrid, tick, ROOT } from './helpers.js';

const win = setupDom();
const read = (f) => readFileSync(join(ROOT, f), 'utf8');
const walk = (dir) => readdirSync(join(ROOT, dir)).flatMap((n) => {
  const p = join(dir, n);
  return statSync(join(ROOT, p)).isDirectory() ? walk(p) : [p];
});
const pages = walk('docs/pages').filter((f) => f.endsWith('.md'));
const exampleFiles = walk('examples').filter((f) => /\.(js|html)$/.test(f));
const pluginFiles = walk('plugins').filter((f) => f.endsWith('.js'));

describe('the documentation matches the real API', () => {
  let lib, Proto, Static, coreSrc;
  before(async () => {
    lib = await loadLib('src');
    Proto = new Set(Object.getOwnPropertyNames(lib.ABI7Grid.prototype));
    Static = new Set(Object.getOwnPropertyNames(lib.ABI7Grid));
    coreSrc = read('src/abi7-grid.js');
  });

  it('all grid.xxx() calls in documentation and examples exist', () => {
    const missing = [];
    for (const f of [...pages, ...exampleFiles, ...pluginFiles, 'README.md']) {
      const text = read(f);
      for (const m of text.matchAll(/\b(?:grid|left|right|gridA|gridB|todo|done)\.([A-Za-z]+)\(/g)) {
        if (!Proto.has(m[1])) missing.push(`${f}: grid.${m[1]}()`);
      }
      for (const m of text.matchAll(/\bABI7Grid\.([A-Za-z]+)\b/g)) {
        if (!Static.has(m[1])) missing.push(`${f}: ABI7Grid.${m[1]}`);
      }
    }
    assert.deepEqual([...new Set(missing)], []);
  });

  it('each public method is described by a card in api-methods.md', () => {
    const doc = read('docs/pages/api-methods.md');
    const undocumented = [...Proto].filter((n) => n !== 'constructor' && !new RegExp(`:::method grid\\.${n}\\(`).test(doc));
    assert.deepEqual(undocumented, []);
    for (const n of Static) if (['registerLayout', 'unregisterLayout', 'getLayouts', 'fromLegacyOptions'].includes(n)) assert.match(doc, new RegExp(`:::method ABI7Grid\\.${n}\\(`));
  });

  it('every core event from the code is described in api-events.md, and vice versa', () => {
    const emitted = new Set();
    for (const m of coreSrc.matchAll(/emit(?:Cancelable)?\('([a-z:-]+)'/g)) emitted.add(m[1]);
    for (const m of coreSrc.matchAll(/\['(click|dblclick|contextmenu)', '(item:[a-z]+)'\]/g)) emitted.add(m[2]);
    const doc = read('docs/pages/api-events.md');
    const documented = new Set([...doc.matchAll(/^:::event ([a-z:-]+)$/gm)].map((m) => m[1]));
    assert.deepEqual([...emitted].filter((e) => !documented.has(e)), [], 'not documented');
    assert.deepEqual([...documented].filter((e) => !emitted.has(e)), [], 'documented but does not exist');
  });

  it('all events in grid.on/once in documentation and examples exist', () => {
    const known = new Set([...coreSrc.matchAll(/emit(?:Cancelable)?\('([a-z:-]+)'/g)].map((m) => m[1]).concat(['item:click', 'item:dblclick', 'item:contextmenu', '*']));
    const pluginNs = /^(selection|lightbox|connected-grids|counter|my-plugin|keyboard-nav|hover-effects|reveal|transitions|flash):/;
    const bad = [];
    for (const f of [...pages, ...exampleFiles, 'README.md']) {
      for (const m of read(f).matchAll(/\.(?:on|once)\('([^']+)'/g)) {
        if (!known.has(m[1]) && !pluginNs.test(m[1])) bad.push(`${f}: ${m[1]}`);
      }
    }
    assert.deepEqual(bad, []);
  });

  it('each option from ABI7Grid.defaults is described in api-options.md', () => {
    const doc = read('docs/pages/api-options.md');
    const missing = [];
    const walkOpt = (obj, prefix) => {
      for (const [k, v] of Object.entries(obj)) {
        if (!doc.includes('`' + k + '`') && !doc.includes('`' + prefix + k + '`') && !doc.includes('`' + k + '.')) missing.push(prefix + k);
        if (v && typeof v === 'object' && !Array.isArray(v) && ['virtualization', 'animation', 'interaction', 'drag', 'fields'].includes(k)) walkOpt(v, k + '.');
      }
    };
    walkOpt(lib.ABI7Grid.defaults, '');
    assert.deepEqual(missing, []);
  });

  it('all layout options are described in the documentation', () => {
    const doc = read('docs/pages/api-options.md');
    for (const key of ['gap', 'gapX', 'columns', 'minWidth', 'maxWidth', 'maxColumns', 'itemHeight', 'aspectRatio', 'align', 'width', 'targetRowHeight', 'minRowHeight', 'maxRowHeight', 'lastRow', 'defaultAspect', 'itemWidth']) {
      assert.ok(doc.includes('`' + key), key);
    }
  });

  it('pages and examples: :::demo directives link to existing files, imports and links are allowed', () => {
    const demos = new Set();
    for (const f of pages) for (const m of read(f).matchAll(/^:::demo ([\w-]+)$/gm)) demos.add(m[1]);
    assert.ok(demos.size >= 10);
    for (const id of demos) {
      assert.ok(existsSync(join(ROOT, 'examples', id, 'index.html')), id + '/index.html');
      assert.ok(existsSync(join(ROOT, 'examples', id, 'demo.js')), id + '/demo.js');
    }
    for (const f of exampleFiles) {
      const text = read(f);
      const refs = f.endsWith('.html') ? [...text.matchAll(/(?:href|src)="(\.[^"]+)"/g)] : [...text.matchAll(/from '(\.[^']+)'/g)];
      for (const m of refs) {
        const target = resolve(ROOT, dirname(f), m[1]);
        assert.ok(existsSync(target) || existsSync(target.replace(/^(.*)\/dist\//, '$1/dist/')), `${f} → ${m[1]}`);
      }
    }
    for (const f of pages) {
      for (const m of read(f).matchAll(/^:::file (\S+)$/gm)) assert.ok(existsSync(join(ROOT, m[1])), m[1]);
    }
  });

  it('#/page links between pages lead to existing pages', () => {
    const names = new Set(pages.map((p) => p.split('/').pop().replace('.md', '')));
    const bad = [];
    for (const f of pages) for (const m of read(f).matchAll(/\(#\/([\w-]+)(?:\/[^)]*)?\)/g)) if (!names.has(m[1])) bad.push(`${f}: ${m[1]}`);
    assert.deepEqual(bad, []);
  });

  it('structure: Core - exactly one JS and one CSS in src/, plugins in separate directories', () => {
    assert.deepEqual(readdirSync(join(ROOT, 'src')).filter((f) => /abi7-grid\./.test(f)).sort(), ['abi7-grid.css', 'abi7-grid.js']);
    for (const [dir, file] of [['selection', 'selection.js'], ['lightbox', 'lightbox.js'], ['layout-horizontal', 'horizontal.js'], ['connected-grids', 'connected-grids.js']]) {
      assert.ok(existsSync(join(ROOT, 'plugins', dir, file)), dir);
      assert.ok(existsSync(join(ROOT, 'plugins', dir, 'README.md')), dir + ' README');
    }
    for (const f of pluginFiles) assert.equal(/^\s*import\s/m.test(read(f)), false, f + ' should not import Core');
    assert.equal(/Selection|Lightbox|connected-grids/.test(coreSrc.replace(/\/\*[\s\S]*?\*\//g, '')), false, 'plugin code is not in Core');
  });
});

/* --------- Recipes and CounterPlugin work --------- */

describe('the plugins from the manual work', () => {
  let lib, recipes, Counter;
  before(async () => {
    lib = await loadLib('src');
    recipes = await import(pathToFileURL(join(ROOT, 'examples/custom-plugin/recipes.js')).href);
    Counter = (await import(pathToFileURL(join(ROOT, 'examples/custom-plugin/counter-plugin.js')).href)).default;
  });

  it('CounterPlugin: grid counters are independent, icons, events, reset, unuse', async () => {
    const a = await makeGrid(lib, { data: photos(300) });
    const b = await makeGrid(lib, { data: photos(10) });
    a.grid.use(Counter);
    b.grid.use(Counter, { step: 5 });
    const events = [];
    a.grid.on('counter:change', (e) => events.push(e.total));
    const click = (g, id) => g.el.querySelector(`[data-id="${id}"]`).dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
    click(a, 'p1'); click(a, 'p1'); click(a, 'p2'); click(b, 'p1');
    assert.equal(a.grid.getPlugin('counter').getTotal(), 3);
    assert.equal(b.grid.getPlugin('counter').getTotal(), 5);
    assert.deepEqual(events, [1, 2, 3]);
    assert.equal(a.el.querySelector('[data-id="p1"] .counter-badge').textContent, '2');
    assert.deepEqual(a.grid.getPlugin('counter').top(1), [{ id: 'p1', count: 2 }]);
    // after rebinding DOM nodes there are no foreign icons
    scrollTo(a.el, 30000); a.grid.flush();
    assert.equal(a.el.querySelectorAll('.counter-badge').length, 0);
    scrollTo(a.el, 0); a.grid.flush();
    assert.equal(a.el.querySelector('[data-id="p1"] .counter-badge').textContent, '2');
    let resets = 0;
    a.grid.on('counter:reset', () => resets++);
    a.grid.getPlugin('counter').reset();
    assert.equal(resets, 1);
    assert.equal(a.el.querySelectorAll('.counter-badge').length, 0);
    click(a, 'p3');
    a.grid.unuse('counter');
    assert.equal(a.el.querySelectorAll('.counter-badge').length, 0);
    assert.equal(a.grid.getPlugin('counter'), null);
    click(a, 'p3');
    assert.equal(b.grid.getPlugin('counter').getTotal(), 5, 'the second grid is not affected');
    a.grid.destroy(); b.grid.destroy();
  });

  it('LoggerPlugin and TooltipPlugin', async () => {
    const { grid, el } = await makeGrid(lib, { data: photos(5) });
    const orig = console.log; console.log = () => {};
    grid.use(recipes.LoggerPlugin, { prefix: '[t]', ignore: [] });
    grid.use(recipes.TooltipPlugin);
    grid.insert({ id: 'x', title: 'Hello' });
    grid.flush();
    console.log = orig;
    assert.ok(grid.getPlugin('logger').getLines().some((l) => l === '[t] item:insert'));
    assert.equal(el.querySelector('[data-id="x"]').getAttribute('title'), 'Hello');
    assert.equal(el.querySelector('[data-id="p1"]').getAttribute('title'), 'Photo 1');
    grid.unuse('tooltip');
    assert.equal(el.querySelector('[data-id="x"]').getAttribute('title'), 'Hello', 'after unuse the card is redrawn as standard');
    grid.destroy();
  });

  it('KeyboardNavPlugin: arrows move focus on geometry, Enter, clear', async () => {
    const { grid, el } = await makeGrid(lib, { data: photos(12), layout: 'grid', layoutOptions: { columns: 3, gap: 10, aspectRatio: 1 } });
    grid.use(recipes.KeyboardNavPlugin);
    const nav = grid.getPlugin('keyboard-nav');
    const key = (k) => el.dispatchEvent(new window.KeyboardEvent('keydown', { key: k, bubbles: true }));
    const log = [];
    grid.on('keyboard-nav:focus', (e) => log.push(e.id));
    grid.on('keyboard-nav:activate', (e) => log.push('enter:' + e.id));
    key('ArrowRight');
    assert.equal(nav.current(), 'p0');
    key('ArrowRight'); key('ArrowDown');
    assert.equal(nav.current(), 'p4');
    key('ArrowLeft'); key('ArrowUp');
    assert.equal(nav.current(), 'p0');
    key('ArrowUp');
    assert.equal(nav.current(), 'p0', 'at the edge stays in place');
    key('Enter');
    assert.equal(log.at(-1), 'enter:p0');
    assert.ok(el.querySelector('[data-id="p0"]').classList.contains('abi7-kb-focus'));
    grid.unuse('keyboard-nav');
    assert.equal(el.querySelectorAll('.abi7-kb-focus').length, 0);
    key('ArrowRight');
    assert.equal(el.querySelectorAll('.abi7-kb-focus').length, 0, 'listener removed');
    grid.destroy();
  });
});

/* --------- Examples run --------- */

describe('all demo pages run without errors on real Core', () => {
  const ids = readdirSync(join(ROOT, 'examples')).filter((d) => d !== 'shared');
  const scrollStore = new WeakMap();

  before(async () => {
    await import(pathToFileURL(join(ROOT, 'dist/abi7-grid.js')).href); // dist must exist
    const proto = win.HTMLElement.prototype;
    Object.defineProperty(proto, 'clientWidth', { get: () => 800, configurable: true });
    Object.defineProperty(proto, 'clientHeight', { get: () => 400, configurable: true });
    for (const k of ['scrollTop', 'scrollLeft']) {
      Object.defineProperty(proto, k, { get() { return (scrollStore.get(this) || {})[k] || 0; }, set(v) { scrollStore.set(this, { ...(scrollStore.get(this) || {}), [k]: v }); }, configurable: true });
    }
  });

  for (const id of ids) {
    it(`examples/${id}`, async () => {
      const html = read(`examples/${id}/index.html`);
      document.body.innerHTML = html.match(/<body>([\s\S]*)<\/body>/)[1].replace(/<script[\s\S]*?<\/script>/g, '');
      const errors = [];
      const origErr = console.error;
      console.error = (...a) => errors.push(a.join(' '));
      const onErr = (e) => errors.push(String(e.error || e.message));
      win.addEventListener('error', onErr);
      try {
        await import(pathToFileURL(join(ROOT, `examples/${id}/demo.js`)).href + '?run=' + id);
        await tick(40);
        for (const el of document.querySelectorAll('select, input')) {
          if (el.type === 'checkbox') { el.checked = !el.checked; el.dispatchEvent(new win.Event('change', { bubbles: true })); }
          else { if (el.tagName === 'SELECT' && el.options.length > 1) el.selectedIndex = el.options.length - 1; el.dispatchEvent(new win.Event('input', { bubbles: true })); el.dispatchEvent(new win.Event('change', { bubbles: true })); }
        }
        for (const btn of document.querySelectorAll('button')) btn.click();
        await tick(60);
        const cards = document.querySelectorAll('.abi7-item');
        assert.ok(cards.length > 0, 'cards are drawn');
        for (const c of [...cards].slice(0, 3)) c.dispatchEvent(new win.MouseEvent('click', { bubbles: true }));
        await tick(30);
      } finally {
        console.error = origErr;
        win.removeEventListener('error', onErr);
      }
      assert.deepEqual(errors, []);
      document.querySelectorAll('.abi7-lb').forEach((n) => n.remove());
    });
  }
});
