// CounterPlugin is a plugin from scratch: it counts clicks on cards.
// The file does not import Core and does not know anything about its internal structure:
// all interaction goes through the object `api`, which the core passes to install().

const CounterPlugin = {
  // The unique name of the plugin within the grid. They work on it grid.unuse('counter'),
  // grid.getPlugin('counter') and reconnection protection.
  name: 'counter',

  // The version of the plugin itself (semver). Shown in grid.getPlugins() and plugin:install events.
  version: '1.0.0',

  // The range of core API versions that the plugin is compatible with. If the core is not suitable,
  // grid.use() will throw PluginError (PLUGIN_INCOMPATIBLE) and will not install anything.
  apiVersion: '^1.0.0',

  // Default values. The core will combine them with the options from grid.use(plugin, options)
  // and will pass it to install() as the second argument (the object is frozen - it cannot be changed).
  defaults: {
    step: 1, // how much to increase the counter per click
    badges: true, // show an icon with the number of clicks on the card
    filter: null // (record) => boolean — which cards to count; null - all
  },

  // install is called once during grid.use(). The return function is "cleanup".
  install(api, options) {
    // ---- Condition ----
    // Variables are declared INSIDE install(), so each grid has its own copy:
    // two grids with one CounterPlugin count clicks independently of each other.
    let total = 0;
    const perItem = new Map(); // post id → number of clicks

    // ---- Working with the DOM ----
    // DOM elements in ABI7 Grid are reused (DOM Pool): the same <div> in different
    // moments shows different records. Therefore, an icon cannot be “sticked” to an element once —
    // it must be set again every time an element is attached to an entry (item:mount).
    const paintBadge = (el, id) => {
      const old = el.querySelector('.counter-badge');
      const count = perItem.get(id) || 0;
      if (!options.badges || count === 0) {
        if (old) old.remove();
        return;
      }
      const badge = old || el.appendChild(Object.assign(document.createElement('span'), { className: 'counter-badge' }));
      badge.textContent = String(count); // textContent: number cannot contain HTML
    };

    // ---- Core Event Subscriptions ----
    // api.events.on returns an unsubscribe function, but it is not necessary to call it manually:
    // The core itself will remove all plugin subscriptions during unuse() and destroy().
    api.events.on('item:click', (event) => {
      if (event.defaultPrevented) return; // another handler canceled the click
      if (typeof options.filter === 'function' && !options.filter(event.item)) return;

      total += options.step;
      const count = (perItem.get(event.id) || 0) + options.step;
      perItem.set(event.id, count);

      const el = api.renderer.getElement(event.id); // null if the element is not currently in the DOM
      if (el) paintBadge(el, event.id);

      // Plugin's own event. The name must start with “counter:” —
      // The core prohibits plugins from generating other people's events (item:click, etc.).
      api.events.emit('counter:change', { id: event.id, count, total });
    });

    api.events.on('item:mount', (e) => paintBadge(e.element, e.id));
    api.events.on('item:unmount', (e) => e.element.querySelector('.counter-badge')?.remove());

    // If the data has been replaced entirely, the old ids no longer exist, we reset the counters.
    api.events.on('data:load-end', () => feature.reset());

    // ---- Public interface ----
    // Whatever register() returns will be the result of grid.getPlugin('counter').
    const feature = {
      getTotal: () => total,
      getCount: (id) => perItem.get(id) || 0,
      /** Most clicked posts: [{ id, count }, ...] */
      top: (n = 3) => [...perItem].map(([id, count]) => ({ id, count })).sort((a, b) => b.count - a.count).slice(0, n),
      reset() {
        if (total === 0 && perItem.size === 0) return; // there is nothing to reset - the event is not needed
        const previousTotal = total;
        const ids = [...perItem.keys()];
        total = 0;
        perItem.clear();
        for (const id of ids) {
          const el = api.renderer.getElement(id);
          if (el) paintBadge(el, id);
        }
        api.events.emit('counter:reset', { previousTotal });
      }
    };
    api.features.register('counter', feature);

    // ---- Cleaning ----
    // The core will remove subscriptions and features itself. Here we remove only what the plugin
    // made outside the API: icons in the DOM.
    return () => {
      for (const id of perItem.keys()) {
        const el = api.renderer.getElement(id);
        if (el) el.querySelector('.counter-badge')?.remove();
      }
      perItem.clear();
    };
  }
};

export default CounterPlugin;
