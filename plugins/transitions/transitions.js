/*!
 * @abi7/transitions v1.0.0 - rearrangement transition presets for ABI7 Grid.
 * (c) 2023-2026 Alexander Momot. All rights reserved.
 * ABI7 Grid Community Edition: free for NON-COMMERCIAL use only. Commercial use requires a paid license.
 * Licensed under the ABI7 Grid Community License (licenses/LICENSE-COMMUNITY.md). Purchase: https://abi7.com
 *
 * The core animates rearrangements (insert, remove, move, resize, layout change) with CSS transitions driven by
 * the `animation` options: enabled, duration, easing. This plugin does not add a new animation engine -
 * it manages those options through the Plugin API (`api.options.set`) and offers named presets.
 * Connection: grid.use(TransitionsPlugin, { preset: 'bounce' });
 * Access:     grid.getPlugin('transitions').use('snappy');
 */

const BUILTIN = {
  smooth: { enabled: true, duration: 350, easing: 'ease' },
  snappy: { enabled: true, duration: 160, easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)' },
  bounce: { enabled: true, duration: 600, easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)' },
  slow: { enabled: true, duration: 900, easing: 'ease-in-out' },
  none: { enabled: false, duration: 0, easing: 'linear' }
};

export default {
  name: 'transitions',
  version: '1.0.0',
  apiVersion: '^1.0.0',
  defaults: {
    preset: 'smooth',
    presets: {} // your own presets: { name: { enabled, duration, easing } }
  },

  install(api, options) {
    const table = { ...BUILTIN, ...options.presets };
    const original = api.options.get('animation'); // restored by the cleanup function
    let current = null;

    const use = (name) => {
      const p = table[name];
      if (!p) throw new Error(`transitions: unknown preset "${name}". Available: ${Object.keys(table).join(', ')}`);
      // Each set() applies the option immediately (like rebuild()); the --abi7-duration / --abi7-easing CSS
      // variables on the root element are updated by the core.
      api.options.set('animation.enabled', p.enabled !== false);
      api.options.set('animation.duration', p.duration);
      api.options.set('animation.easing', p.easing);
      current = name;
      api.events.emit('transitions:change', { preset: name, ...p });
    };

    use(options.preset);

    api.features.register('transitions', {
      use,
      current: () => current,
      list: () => Object.keys(table),
      define: (name, preset) => { table[name] = { enabled: true, duration: 300, easing: 'ease', ...preset }; }
    });

    return () => {
      try {
        api.options.set('animation.enabled', original.enabled);
        api.options.set('animation.duration', original.duration);
        api.options.set('animation.easing', original.easing);
      } catch (_) { /* grid is being destroyed */ }
    };
  }
};
