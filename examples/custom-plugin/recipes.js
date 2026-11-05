// Three plugins of varying complexity - “recipes” from the plugin creation guide.
// Each only uses the Plugin API and does not import Core.
// The code is checked by automatic tests (tests/docs.test.js).

/* ------------------------------------------------------------------ *
 * 1. LoggerPlugin - minimal plugin: subscription to all events.
 *    Shows: name/version/apiVersion, defaults, subscription '*', cleanup.
 * ------------------------------------------------------------------ */
export const LoggerPlugin = {
  name: 'logger',
  version: '1.0.0',
  apiVersion: '^1.0.0',
  defaults: { prefix: '[grid]', ignore: ['scroll', 'viewport:update', 'drag:move'] },

  install(api, options) {
    const lines = [];

    // '*' — subscription to all events. Unsubscription will occur automatically when unuse()/destroy().
    api.events.on('*', (event, name) => {
      if (options.ignore.includes(name)) return;
      lines.push(`${options.prefix} ${name}`);
      console.log(options.prefix, name, event);
    });

    api.features.register('logger', { getLines: () => lines.slice(), clear: () => (lines.length = 0) });
  }
};

/* ------------------------------------------------------------------ *
 * 2. TooltipPlugin - working with DOM of reused elements.
 *    Shows: item:mount / item:unmount, why you can’t “stick” an attribute once.
 * ------------------------------------------------------------------ */
export const TooltipPlugin = {
  name: 'tooltip',
  version: '1.0.0',
  apiVersion: '^1.0.0',
  defaults: { text: (record) => record.title || '' },

  install(api, options) {
    // The DOM node shows different entries at different times, so the attribute is set on EVERY binding.
    api.events.on('item:mount', ({ element, item }) => {
      const text = options.text(item);
      if (text) element.setAttribute('title', text);
      else element.removeAttribute('title');
    });
    api.events.on('item:unmount', ({ element }) => element.removeAttribute('title'));

    // We update nodes that are already in the DOM at the time of installation through a public method.
    api.renderer.refresh();

    return () => api.renderer.refresh(); // after disconnecting, we bind the cards again - without prompts
  }
};

/* ------------------------------------------------------------------ *
 * 3. KeyboardNavPlugin - keyboard navigation with arrows for any layout.
 *    Shows: api.geometry.hitTest, api.viewport.scrollToItem, api.renderer.toggleClass,
 *    native events and feature, addDisposable for DOM listener.
 * ------------------------------------------------------------------ */
export const KeyboardNavPlugin = {
  name: 'keyboard-nav',
  version: '1.0.0',
  apiVersion: '^1.0.0',
  defaults: { className: 'abi7-kb-focus' },

  install(api, options) {
    const root = api.renderer.root(); // grid root element: it has tabindex="0", it receives keys
    let current = null;

    const focus = (id) => {
      if (current !== null) api.renderer.toggleClass(current, options.className, false);
      current = id;
      if (id === null) return;
      api.renderer.toggleClass(id, options.className, true);
      api.viewport.scrollToItem(id, { align: 'nearest' });
      api.events.emit('keyboard-nav:focus', { id });
    };

    // We are looking for a neighbor in the direction of the arrow: we “feel” the geometry with points at a distance of 4, 8, 12... px
    // from the border of the current card. This works for Masonry, Grid, Justified and any other layouts.
    const neighbour = (id, dx, dy) => {
      const r = api.geometry.get(id);
      if (!r) return null;
      for (let d = 4; d <= 64; d += 4) {
        const x = dx > 0 ? r.right + d : dx < 0 ? r.x - d : r.x + r.width / 2;
        const y = dy > 0 ? r.bottom + d : dy < 0 ? r.y - d : r.y + r.height / 2;
        const i = api.geometry.hitTest(x, y);
        if (i >= 0) return api.data.ids()[i];
      }
      return null;
    };

    const directions = { ArrowRight: [1, 0], ArrowLeft: [-1, 0], ArrowDown: [0, 1], ArrowUp: [0, -1] };

    const onKey = (e) => {
      if (e.key === 'Enter' && current !== null) {
        api.events.emit('keyboard-nav:activate', { id: current });
        return;
      }
      const dir = directions[e.key];
      if (!dir) return;
      e.preventDefault();
      if (current === null || !api.data.has(current)) {
        const ids = api.data.ids();
        const first = api.viewport.range().first;
        if (ids.length) focus(ids[Math.max(0, first)]);
        return;
      }
      const next = neighbour(current, dir[0], dir[1]);
      if (next !== null && next !== undefined) focus(next);
    };

    root.addEventListener('keydown', onKey);
    // The listener installs the plugin HIMSELF (outside the API), so he is also obliged to remove it.
    api.lifecycle.addDisposable(() => root.removeEventListener('keydown', onKey));

    api.features.register('keyboard-nav', { focus, current: () => current });

    return () => {
      if (current !== null) api.renderer.toggleClass(current, options.className, false);
      current = null;
    };
  }
};
