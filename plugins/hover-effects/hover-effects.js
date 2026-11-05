/*!
 * @abi7/hover-effects v1.0.0 - hover effects plugin for ABI7 Grid.
 * (c) 2023-2026 Alexander Momot. All rights reserved.
 * ABI7 Grid Community Edition: free for NON-COMMERCIAL use only. Commercial use requires a paid license.
 * Licensed under the ABI7 Grid Community License (licenses/LICENSE-COMMUNITY.md). Purchase: https://abi7.com
 *
 * The plugin does NOT import Core: it only uses the Plugin API (`api`).
 * Connection: grid.use(HoverEffectsPlugin, { effect: 'zoom' });
 * Access:     grid.getPlugin('hover-effects').setEffect('lift');
 */

const EFFECTS = ['zoom', 'lift', 'dim-others', 'none'];

export default {
  name: 'hover-effects',
  version: '1.0.0',
  apiVersion: '^1.0.0',
  defaults: { effect: 'zoom' }, // one of EFFECTS

  install(api, options) {
    const root = api.renderer.root();
    let effect = null;
    let active = null; // id of the hovered card, or null
    let frame = 0; // pending requestAnimationFrame id
    let last = null; // last pointer position, processed once per frame

    // Cards are positioned by the core with `transform`, so the effects NEVER touch the card's own transform.
    // They are driven by CSS classes: `abi7-hover` on the card (set through the Plugin API so that it survives
    // DOM reuse) and `abi7-hover-<effect>` on the root element. See hover-effects.css.
    const idOf = (record) => {
      const f = api.options.get('fields.id');
      return typeof f === 'function' ? f(record) : record[f];
    };

    const setActive = (id) => {
      if (id === active) return;
      if (active !== null) api.renderer.toggleClass(active, 'abi7-hover', false);
      active = id;
      if (active !== null) api.renderer.toggleClass(active, 'abi7-hover', true);
      root.classList.toggle('abi7-hover-active', active !== null);
      api.events.emit('hover-effects:change', { id: active });
    };

    // Hit-testing goes through the core geometry (indexAtClientPoint), not through DOM lookups,
    // so it also works for cards that are being re-bound by virtualization.
    const onMove = (e) => {
      last = e;
      if (frame) return; // process at most one pointer position per frame
      frame = requestAnimationFrame(() => {
        frame = 0;
        const i = api.viewport.indexAtClientPoint(last.clientX, last.clientY);
        const rec = i >= 0 ? api.data.getByIndex(i) : undefined;
        setActive(rec ? idOf(rec) : null);
      });
    };
    const onLeave = () => setActive(null);

    const setEffect = (name) => {
      if (!EFFECTS.includes(name)) throw new Error(`hover-effects: unknown effect "${name}". Use one of: ${EFFECTS.join(', ')}`);
      if (effect) root.classList.remove('abi7-hover-' + effect);
      effect = name;
      root.classList.add('abi7-hover-' + effect);
      api.events.emit('hover-effects:effect', { effect });
    };

    root.addEventListener('pointermove', onMove, { passive: true });
    root.addEventListener('pointerleave', onLeave);
    setEffect(options.effect);

    // Public interface of the plugin: grid.getPlugin('hover-effects')
    api.features.register('hover-effects', {
      setEffect,
      getEffect: () => effect,
      getActive: () => active,
      effects: () => EFFECTS.slice()
    });

    // Cleanup runs on grid.unuse('hover-effects') and on grid.destroy().
    return () => {
      root.removeEventListener('pointermove', onMove);
      root.removeEventListener('pointerleave', onLeave);
      if (frame) cancelAnimationFrame(frame);
      try { setActive(null); } catch (_) { /* grid may already be torn down */ }
      root.classList.remove('abi7-hover-active', 'abi7-hover-' + effect);
    };
  }
};
