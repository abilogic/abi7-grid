/*!
 * @abi7/connected-grids v1.0.0 - transfer cards between several grids.
 * (c) 2023-2026 Alexander Momot. All rights reserved.
 * ABI7 Grid Community Edition: free for NON-COMMERCIAL use only. Commercial use requires a paid license.
 * Licensed under the ABI7 Grid Community License (licenses/LICENSE-COMMUNITY.md). Purchase: https://abi7.com
 *
 * The plugin connects to EVERY linked grid with the same option `group`.
 * It uses the built-in Drag & Drop Core (drag:move / drag:end events) and public
 * data methods (api.data.remove / api.data.insert) - does not affect internal Core structures.
 *
 *   gridA.use(ConnectedGrids, { group: 'board', name: 'todo' });
 *   gridB.use(ConnectedGrids, { group: 'board', name: 'done' });
 */

// The group registry is common to all page grids. This is the only shared state of the plugin:
// it is through it that the specimens “find” each other. The entry is deleted in the cleanup function.
const GROUPS = new Map(); // group → Set<member>

export default {
  name: 'connected-grids',
  version: '1.0.0',
  apiVersion: '^1.0.0',

  defaults: {
    group: 'default', // Grids with the same group are connected
    name: '', // participant name (unique in the group) - needed for feature.transfer()
    copy: false, // true - copy, not transfer
    accept: null, // (record, { from, to }) => boolean — filter for received records
    overClass: 'abi7-connected-over' // target grid backlight class
  },

  install(api, options) {
    const idField = api.options.get('fields').id;

    // --- Checking Instance Compatibility ---
    const members = GROUPS.get(options.group) || new Set();
    for (const m of members) {
      if (m.coreMajor !== String(api.coreVersion).split('.')[0]) {
        throw new Error(`connected-grids: grid in group "${options.group}" uses an incompatible core version (${m.coreVersion} vs ${api.coreVersion})`);
      }
      if (typeof m.idField === 'string' && typeof idField === 'string' && m.idField !== idField) {
        throw new Error(`connected-grids: all grids in group "${options.group}" must use the same fields.id ("${m.idField}" vs "${idField}")`);
      }
      if (options.name && m.name === options.name) {
        throw new Error(`connected-grids: name "${options.name}" is already used in group "${options.group}"`);
      }
    }

    const root = api.renderer.root();
    const member = { api, root, idField, name: options.name, coreVersion: api.coreVersion, coreMajor: String(api.coreVersion).split('.')[0], over: false };
    members.add(member);
    GROUPS.set(options.group, members);

    // The transfer works on top of the Drag & Drop core - we turn it on, remembering the previous value.
    const dragWasEnabled = api.options.get('interaction.drag.enabled');
    if (!dragWasEnabled) api.options.set('interaction.drag.enabled', true);

    const others = () => [...members].filter((m) => m !== member);
    const targetAt = (x, y) =>
      others().find((m) => {
        const r = m.root.getBoundingClientRect();
        return x >= r.left && x <= r.right && y >= r.top && y <= r.bottom;
      });
    const highlight = (m, on) => {
      if (m && m.over !== on) {
        m.over = on;
        m.root.classList.toggle(options.overClass, on);
      }
    };
    const clearHighlights = () => others().forEach((m) => highlight(m, false));

    // If the id is already occupied in the target grid, we select a free one so as not to lose the entry.
    const freeId = (target, id) => {
      if (!target.api.data.has(id)) return id;
      let n = 2;
      while (target.api.data.has(`${id}-${n}`)) n++;
      return `${id}-${n}`;
    };

    /** Transfers the entry `id` from this grid to `target` (group member). */
    function transferTo(target, id, at) {
      if (!api.data.has(id)) return false;
      const record = api.data.getById(id);
      const ctx = { from: member.name || options.group, to: target.name || options.group };
      if (typeof options.accept === 'function' && !options.accept(record, ctx)) return false;
      const ok = api.events.emitCancelable('connected-grids:before-transfer', { id, record, ...ctx });
      if (!ok) return false;
      const newId = freeId(target, id);
      const copy = typeof idField === 'string' && newId !== id ? { ...record, [idField]: newId } : record;
      const where = Number.isInteger(at) ? at : target.api.data.count();
      if (!options.copy) api.data.remove(id);
      target.api.data.insert(copy, { at: where });
      api.events.emit('connected-grids:transfer', { id, newId, record, copy: !!options.copy, index: where, ...ctx });
      target.api.events.emit('connected-grids:receive', { id: newId, from: ctx.from, record: copy, index: where });
      return true;
    }

    api.events.on('drag:move', (e) => {
      const t = e.outside ? targetAt(e.clientX, e.clientY) : null;
      others().forEach((m) => highlight(m, m === t));
    });

    api.events.on('drag:end', (e) => {
      clearHighlights();
      if (e.cancelled || !e.outside) return;
      const target = targetAt(e.clientX, e.clientY);
      if (!target) return;
      // Insertion position: element under the cursor in the target grid or end of the list.
      const idx = target.api.viewport.indexAtClientPoint(e.clientX, e.clientY, { nearest: true });
      transferTo(target, e.id, idx >= 0 ? idx : undefined);
    });

    api.features.register('connected-grids', {
      group: options.group,
      name: options.name,
      members: () => [...members].map((m) => m.name || '(unnamed)'),
      /** Programmatic transfer: grid.getPlugin('connected-grids').transfer('card-1', 'done') */
      transfer(id, targetName, opts = {}) {
        const target = others().find((m) => m.name === targetName);
        if (!target) throw new Error(`connected-grids: no grid named "${targetName}" in group "${options.group}"`);
        return transferTo(target, id, opts.at);
      }
    });

    return () => {
      clearHighlights();
      members.delete(member);
      if (!members.size) GROUPS.delete(options.group);
      root.classList.remove(options.overClass);
      if (!dragWasEnabled) {
        try { api.options.set('interaction.drag.enabled', false); } catch (_) { /* the grid is already being destroyed */ }
      }
    };
  }
};
