/*!
 * @abi7/reveal v1.0.0 - reveal animation plugin for ABI7 Grid.
 * (c) 2023-2026 Alexander Momot. All rights reserved.
 * ABI7 Grid Community Edition: free for NON-COMMERCIAL use only. Commercial use requires a paid license.
 * Licensed under the ABI7 Grid Community License (licenses/LICENSE-COMMUNITY.md). Purchase: https://abi7.com
 *
 * Fades cards in when they are mounted into the DOM for the first time (initial render and scrolling).
 * The plugin does NOT import Core: it only uses the Plugin API (`api`).
 * Connection: grid.use(RevealPlugin, { stagger: 40, distance: 18 });
 */

export default {
  name: 'reveal',
  version: '1.0.0',
  apiVersion: '^1.0.0',
  defaults: {
    once: true, // reveal each record only the first time it is mounted
    stagger: 40, // ms between cards that are mounted in the same batch
    maxStagger: 12, // the delay stops growing after this many cards in one batch
    distance: 18, // px of upward travel
    duration: 450 // ms
  },

  install(api, options) {
    const root = api.renderer.root();
    const seen = new Set(); // ids that were already revealed (used when options.once is true)
    let disposed = false;
    let batch = 0; // position of the card inside the current mount batch
    let batchTimer = 0;
    const frames = new Set();

    // Settings are published as CSS custom properties so all visuals stay in reveal.css.
    root.classList.add('abi7-reveal-enabled');
    root.style.setProperty('--abi7-reveal-duration', options.duration + 'ms');
    root.style.setProperty('--abi7-reveal-distance', options.distance + 'px');

    // WHY mount and not "visible": a DOM element is reused for different records (DOM Pool). item:mount fires every
    // time an element is bound to a record, which is the right moment to decide whether to animate it.
    api.events.on('item:mount', (e) => {
      if (options.once && seen.has(e.id)) return;
      seen.add(e.id);
      e.element.style.setProperty('--abi7-reveal-delay', Math.min(batch++, options.maxStagger) * options.stagger + 'ms');
      // The class is registered by record id, so the core re-applies it if the node is re-bound before it is removed.
      api.renderer.toggleClass(e.id, 'abi7-reveal-pre', true);
      // Two frames: the hidden state must be painted once, otherwise the browser has nothing to transition from.
      const f1 = requestAnimationFrame(() => {
        const f2 = requestAnimationFrame(() => {
          frames.delete(f2);
          if (!disposed) api.renderer.toggleClass(e.id, 'abi7-reveal-pre', false);
        });
        frames.add(f2);
        frames.delete(f1);
      });
      frames.add(f1);
      if (!batchTimer) batchTimer = setTimeout(() => { batch = 0; batchTimer = 0; }, 60);
    });

    api.features.register('reveal', {
      reset: () => seen.clear(), // animate everything again the next time it is mounted
      revealedCount: () => seen.size
    });

    return () => {
      disposed = true;
      clearTimeout(batchTimer);
      frames.forEach((f) => cancelAnimationFrame(f));
      root.classList.remove('abi7-reveal-enabled');
      root.style.removeProperty('--abi7-reveal-duration');
      root.style.removeProperty('--abi7-reveal-distance');
    };
  }
};
