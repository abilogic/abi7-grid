// "Flash" - the plugin built step by step in the tutorial "Building Your First ABI7 Grid Plugin".
// It highlights a card for a short time after it was clicked.
//
// The file does not import the core. Everything the plugin needs comes from the `api` object
// that the core passes to install().

const FlashPlugin = {
  // 1. Identity. `name` must be unique per grid and becomes the event namespace ("flash:...").
  name: 'flash',
  version: '1.0.0',
  // The range of Plugin API versions this plugin works with. grid.use() throws PluginError (PLUGIN_INCOMPATIBLE) otherwise.
  apiVersion: '^1.0.0',

  // 2. Default options. The core merges them with the options passed to grid.use() and freezes the result.
  defaults: {
    className: 'flash-on', // class added to the clicked card
    duration: 600 // ms
  },

  // 3. install() runs once per grid.use(). Keep ALL state inside it, so every grid gets its own copy.
  install(api, options) {
    const timers = new Map(); // record id -> timeout id

    // 4. Subscribe through api.events: the core removes these subscriptions automatically on unuse()/destroy().
    api.events.on('item:click', (event) => {
      if (event.defaultPrevented) return; // another handler cancelled the click

      // 5. Change the DOM only through api.renderer. toggleClass() is keyed by the record id, not by the element:
      // cards are reused by virtualization, and the core re-applies the class if the same record is bound again.
      api.renderer.toggleClass(event.id, options.className, true);

      clearTimeout(timers.get(event.id)); // click again -> restart the timer
      timers.set(event.id, setTimeout(() => {
        timers.delete(event.id);
        // The plugin may have been removed in the meantime: toggleClass() would throw PLUGIN_INACTIVE.
        try { api.renderer.toggleClass(event.id, options.className, false); } catch (_) { /* removed */ }
      }, options.duration));

      // 6. Plugin events must start with "<plugin name>:".
      api.events.emit('flash:fired', { id: event.id });
    });

    // 7. Public interface: grid.getPlugin('flash').active()
    api.features.register('flash', { active: () => timers.size });

    // 8. Cleanup: runs on grid.unuse('flash') and on grid.destroy(). Timers are not tracked by the core.
    return () => {
      for (const t of timers.values()) clearTimeout(t);
      timers.clear();
    };
  }
};

export default FlashPlugin;
