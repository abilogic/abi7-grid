// Tests for the plugins added in the Community repository (hover-effects, reveal, transitions, flash)
// and for the behaviour described on the "DOM inspector" documentation page.
import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
import { join } from 'node:path';
import { setupDom, photos, loadLib, makeGrid, pointer, tick, ROOT } from './helpers.js';

setupDom();
const load = (p) => import(pathToFileURL(join(ROOT, p)).href).then((m) => m.default);

for (const kind of ['src', 'min']) {
  describe(`Community plugins [${kind}]`, () => {
    let lib, Hover, Reveal, Transitions, Flash;
    before(async () => {
      lib = await loadLib(kind);
      [Hover, Reveal, Transitions, Flash] = await Promise.all([
        load('plugins/hover-effects/hover-effects.js'), load('plugins/reveal/reveal.js'),
        load('plugins/transitions/transitions.js'), load('examples/first-plugin/flash-plugin.js')
      ]);
    });

    it('hover-effects: marks the hovered record, switches effects, cleans up on unuse', async () => {
      const { grid, el } = await makeGrid(lib, { layout: 'grid', data: photos(12), layoutOptions: { columns: 3, aspectRatio: 1, gap: 0 } });
      grid.use(Hover, { effect: 'zoom' });
      const hover = grid.getPlugin('hover-effects');
      assert.ok(el.classList.contains('abi7-hover-zoom'));
      const seen = [];
      grid.on('hover-effects:change', (e) => seen.push(e.id));
      pointer('pointermove', el, { clientX: 10, clientY: 10 });
      await tick(50);
      assert.equal(hover.getActive(), 'p0');
      assert.ok(el.querySelector('.abi7-item[data-id="p0"]').classList.contains('abi7-hover'));
      hover.setEffect('lift');
      assert.ok(el.classList.contains('abi7-hover-lift') && !el.classList.contains('abi7-hover-zoom'));
      assert.throws(() => hover.setEffect('nope'), /unknown effect/);
      el.dispatchEvent(new window.Event('pointerleave'));
      assert.equal(hover.getActive(), null);
      assert.deepEqual(seen, ['p0', null]);
      grid.unuse('hover-effects');
      assert.equal([...el.classList].some((c) => c.startsWith('abi7-hover')), false);
      grid.destroy();
    });

    it('reveal: adds the pre-class on mount, removes it after two frames, respects once', async () => {
      const { grid, el } = await makeGrid(lib, { data: photos(6) });
      grid.use(Reveal, { stagger: 10 });
      assert.ok(el.classList.contains('abi7-reveal-enabled'));
      grid.insert({ id: 'new1', width: 400, height: 300 }, { at: 'start' });
      grid.flush();
      const card = () => el.querySelector('.abi7-item[data-id="new1"]');
      assert.ok(card().classList.contains('abi7-reveal-pre'), 'hidden state is painted first');
      await tick(80);
      assert.equal(card().classList.contains('abi7-reveal-pre'), false, 'then it is revealed');
      grid.reload(); // re-binds all mounted cards; cards mounted before the plugin was installed count as "first time"
      await tick(40);
      const before = grid.getPlugin('reveal').revealedCount();
      assert.equal(before, 7);
      grid.reload();
      await tick(40);
      assert.equal(grid.getPlugin('reveal').revealedCount(), before, 'once: nothing is revealed twice');
      grid.getPlugin('reveal').reset();
      assert.equal(grid.getPlugin('reveal').revealedCount(), 0);
      grid.unuse('reveal');
      assert.equal(el.classList.contains('abi7-reveal-enabled'), false);
      grid.destroy();
    });

    it('transitions: applies presets through the animation options and restores them', async () => {
      const { grid, el } = await makeGrid(lib, { data: photos(4), animation: { enabled: true, duration: 123, easing: 'linear' } });
      grid.use(Transitions, { preset: 'snappy', presets: { custom: { duration: 777, easing: 'ease-in' } } });
      const t = grid.getPlugin('transitions');
      assert.equal(t.current(), 'snappy');
      assert.equal(el.style.getPropertyValue('--abi7-duration'), '160ms');
      t.use('custom');
      assert.equal(el.style.getPropertyValue('--abi7-duration'), '777ms');
      assert.equal(el.style.getPropertyValue('--abi7-easing'), 'ease-in');
      t.use('none');
      assert.equal(grid.getPlugin('transitions').current(), 'none');
      assert.throws(() => t.use('missing'), /unknown preset/);
      grid.unuse('transitions');
      assert.equal(el.style.getPropertyValue('--abi7-duration'), '123ms');
      assert.equal(el.style.getPropertyValue('--abi7-easing'), 'linear');
      grid.destroy();
    });

    it('flash (tutorial plugin): class on click, own event, timers cleared on unuse', async () => {
      const { grid, el } = await makeGrid(lib, { data: photos(5) });
      grid.use(Flash, { duration: 30 });
      const fired = [];
      grid.on('flash:fired', (e) => fired.push(e.id));
      el.querySelector('.abi7-item').dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
      const first = fired[0];
      assert.ok(first);
      assert.ok(el.querySelector(`.abi7-item[data-id="${first}"]`).classList.contains('flash-on'));
      assert.equal(grid.getPlugin('flash').active(), 1);
      await tick(60);
      assert.equal(el.querySelector(`.abi7-item[data-id="${first}"]`).classList.contains('flash-on'), false);
      el.querySelector('.abi7-item').dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
      grid.unuse('flash');
      await tick(60); // the cleared timer must not call a removed plugin
      assert.equal(grid.hasPlugin('flash'), false);
      grid.destroy();
    });

    it('DOM inspector page: layout pass restores position, reload() restores content, foreign styles stay', async () => {
      const { grid, el } = await makeGrid(lib, { layout: 'grid', data: photos(6), layoutOptions: { columns: 3, aspectRatio: 1, gap: 0 } });
      const card = el.querySelector('.abi7-item');
      const caption = card.querySelector('.abi7-caption');
      const original = card.style.transform;
      card.style.transform = 'translate3d(40px, 40px, 0)';
      card.style.outline = '3px solid red';
      caption.textContent = 'Edited in DevTools';
      await tick(30);
      assert.equal(card.style.transform, 'translate3d(40px, 40px, 0)', 'nothing is observed');
      grid.refresh();
      assert.equal(card.style.transform, original, 'refresh() writes the position again');
      assert.equal(card.style.outline, '3px solid red');
      assert.equal(caption.textContent, 'Edited in DevTools');
      grid.reload();
      assert.equal(caption.textContent, 'Photo 0', 'reload() re-binds the content');
      assert.equal(card.style.outline, '3px solid red');
      grid.destroy();
    });
  });
}
