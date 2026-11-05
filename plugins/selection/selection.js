/*!
 * @abi7/selection v1.0.0 - element selection plugin for ABI7 Grid.
 * (c) 2023-2026 Alexander Momot. All rights reserved.
 * ABI7 Grid Community Edition: free for NON-COMMERCIAL use only. Commercial use requires a paid license.
 * Licensed under the ABI7 Grid Community License (licenses/LICENSE-COMMUNITY.md). Purchase: https://abi7.com
 *
 * The plugin does NOT import Core: it communicates with the grid only through the Plugin API (`api`).
 * Connection: grid.use(SelectionPlugin, { multiple: true });
 * Access: grid.getPlugin('selection').select('photo-1');
 */

export default {
  name: 'selection',
  version: '1.0.0',
  apiVersion: '^1.0.0',

  // Default values. The core will combine them with the options passed to grid.use().
  defaults: {
    multiple: true, // allow multiple selections
    className: 'abi7-selected', // CSS class of the selected element
    toggleOnClick: false, // a regular click on the only selected element deselects the selection
    keyboard: true // Ctrl/Cmd+A - select all, Escape - deselect
  },

  install(api, options) {
    // The state lives in the install() closure: each grid has its own instance of the plugin.
    const selected = new Set(); // Set stores the order of addition
    let anchorId = null; // a range is built from this element by Shift+click

    // The class is assigned via api.renderer: the core will remember it by id and return it to the element,
    // even if the DOM node will be reused for another entry (DOM Pool).
    const paint = (id, on) => api.renderer.toggleClass(id, options.className, on);

    const emitChange = (added, removed, source) => {
      if (!added.length && !removed.length) return;
      // A plugin's own events must begin with "selection:" (plugin name + colon).
      api.events.emit('selection:change', { selected: [...selected], added, removed, source });
    };

    const applyDiff = (next, source) => {
      const added = [], removed = [];
      for (const id of [...selected]) if (!next.has(id)) { selected.delete(id); paint(id, false); removed.push(id); }
      for (const id of next) if (!selected.has(id)) { selected.add(id); paint(id, true); added.push(id); }
      emitChange(added, removed, source);
    };

    const feature = {
      select(id, source = 'api') {
        if (!api.data.has(id)) return false;
        const next = options.multiple ? new Set(selected) : new Set();
        next.add(id);
        anchorId = id;
        applyDiff(next, source);
        return true;
      },
      deselect(id, source = 'api') {
        if (!selected.has(id)) return false;
        const next = new Set(selected);
        next.delete(id);
        applyDiff(next, source);
        return true;
      },
      toggle(id, source = 'api') {
        // Returns the final state: true - the element is selected.
        if (selected.has(id)) {
          feature.deselect(id, source);
          return false;
        }
        return feature.select(id, source);
      },
      clear(source = 'api') {
        applyDiff(new Set(), source);
      },
      selectAll(source = 'api') {
        if (!options.multiple) return [];
        applyDiff(new Set(api.data.ids()), source);
        return [...selected];
      },
      isSelected: (id) => selected.has(id),
      getSelected: () => [...selected],
      getSelectedItems: () => [...selected].map((id) => api.data.getById(id)),
      count: () => selected.size
    };

    // --- Click response ---
    const onClick = (e) => {
      if (e.defaultPrevented) return; // another handler “took” the click
      const ev = e.originalEvent || {};
      const multiKey = ev.ctrlKey || ev.metaKey;
      const id = e.id;
      if (!options.multiple) {
        if (selected.has(id)) feature.deselect(id, 'click');
        else feature.select(id, 'click');
        return;
      }
      if (ev.shiftKey && anchorId !== null && api.data.has(anchorId)) {
        // The range in data order between the anchor and the clicked element.
        const a = api.data.indexOf(anchorId), b = api.data.indexOf(id);
        const ids = api.data.ids().slice(Math.min(a, b), Math.max(a, b) + 1);
        applyDiff(new Set(ids), 'click');
      } else if (multiKey) {
        if (selected.has(id)) feature.deselect(id, 'click');
        else feature.select(id, 'click');
      } else if (options.toggleOnClick && selected.size === 1 && selected.has(id)) {
        feature.clear('click');
      } else {
        const next = new Set([id]);
        anchorId = id;
        applyDiff(next, 'click');
      }
    };
    api.events.on('item:click', onClick);

    // --- Sync with data ---
    // Deleted entries should not remain in the selection.
    api.events.on('item:remove', (e) => {
      const next = new Set(selected);
      for (const it of e.items) next.delete(it.id);
      applyDiff(next, 'data');
    });
    // setData/reload replace the entire set - the selection is reset so as not to store “dead” ids.
    api.events.on('data:load-end', () => {
      if (selected.size) applyDiff(new Set(), 'data');
      anchorId = null;
    });

    // --- Keyboard (optional) ---
    if (options.keyboard) {
      const root = api.renderer.root();
      const onKey = (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'a' && options.multiple) {
          e.preventDefault();
          feature.selectAll('keyboard');
        } else if (e.key === 'Escape') feature.clear('keyboard');
      };
      root.addEventListener('keydown', onKey);
      api.lifecycle.addDisposable(() => root.removeEventListener('keydown', onKey));
    }

    // Public interface: grid.getPlugin('selection') will return exactly this object.
    api.features.register('selection', feature);

    // Unwind function: The core will call this on grid.unuse('selection') and on grid.destroy().
    // Subscriptions api.events.on and api.features.register are removed automatically,
    // Here you only need to remove what the plugin itself changed - the CSS classes of the elements.
    return () => {
      for (const id of selected) paint(id, false);
      selected.clear();
    };
  }
};
