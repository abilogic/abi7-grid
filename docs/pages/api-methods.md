# API Reference: Methods

All public methods of the class `ABI7Grid`. Unless otherwise stated, methods are thrown `ABI7Error` with `code: 'DESTROYED'`, when called on a destroyed instance. List of sections: [Constructor](#/api-methods/constructor), [Lifecycle](#/api-methods/lifecycle), [Data](#/api-methods/data), [Items](#/api-methods/items), [Navigation](#/api-methods/navigation), [Plugins](#/api-methods/plugins), [Events](#/api-methods/events), [State](#/api-methods/state), [Static](#/api-methods/static), [Deprecated](#/api-methods/deprecated).

> Types in tables: `id` — `string` or `number` (strict comparison: `'1'` and `1` — different id); `Item` — element description object `{ id, index, data, rect, element, visible }`; `Rect` — `{ id, index, x, y, width, height, right, bottom }`.

## Constructor

:::method new ABI7Grid(target, options)
purpose: Creates a grid instance on a container. This is the library's only entry point.
syntax:
const grid = new ABI7Grid('#gallery', { layout: 'masonry', data: photos });
params:
target | `string` or `HTMLElement` | mandatory | CSS selector or element. The element must be empty and have a height (aka a scroll container).
options | `object` | `{}` | Settings, see [Options](#/api-options). Merge with default values.
returns: Instance `ABI7Grid`.
inside: The constructor checks the options, adds a class to the container `abi7-grid`, creates an inner layer `.abi7-container`, remembers the original container attributes (`class`, `style`, `tabindex`, `role`, `aria-label`) and creates all internal components. The first layout is executed asynchronously (in microtask), so that after the constructor you can synchronously call `use()` and subscribe to events. If `layout` has not yet been registered (layout plugin), the grid is waiting for its registration.
use: Once per container. To get the moment of readiness, use the event `ready` or `whenReady()`.
limits: There cannot be two live instances on one element. The container must have a limited height. Container children are not imported as cards (unlike the old version).
errors: `INVALID_ELEMENT` — element not found. `INVALID_OPTION` — invalid option value. `ALREADY_INITIALIZED` — the element already has a grid.
example:
const grid = new ABI7Grid('#gallery', {
  layout: 'masonry',
  data: photos,
  layoutOptions: { gap: 12, minWidth: 180 }
});
grid.on('ready', () => console.log('ready'));
related: `whenReady()`, `destroy()`, event `ready`.
:::

## Lifecycle

:::method grid.render([done])
purpose: Starts the grid if `autoRender: false`; on a running grid is equivalent to `refresh()`.
syntax:
grid.render();
grid.render((grid) => console.log('ready'));
params:
done | `function` | — | Deprecated callback in the style of the old version; called after an event `ready`. Preferably `whenReady()`.
returns: `this` (for chains).
inside: Connects scroll listeners, ResizeObserver and IntersectionObserver, installs plugins from `options.plugins`, creates a layout engine and starts loading data from `options.data`.
use: Only when `autoRender: false`, when you need to delay the launch (for example, until the CSS is loaded).
limits: A repeated call does not recreate the grid - it only rebuilds the geometry.
errors: `DESTROYED`.
example:
const grid = new ABI7Grid('#gallery', { data: photos, autoRender: false });
grid.use(SelectionPlugin);
grid.render();
related: `refresh()`, `whenReady()`, event `ready`.
:::

:::method grid.refresh([done])
purpose: Remeasures the container and recalculates the geometry of all elements.
syntax:
grid.refresh();
params:
done | `function` | — | Deprecated callback; called immediately after recalculation.
returns: `this`.
inside: Reads `clientWidth/clientHeight` container, marks all geometry obsolete (reason `refresh`), synchronously performs recalculation, updates the set of mounted elements and calls `layout:start` → `viewport:update` → `layout:end`.
use: If the container has changed size and `autoResize: false`; after changing CSS that affects dimensions; after showing the hidden container.
limits: Full recalculation is O(n) based on the number of records. When `autoResize: true` there is usually no need to call it manually. Before `render()` doesn't do anything.
errors: `DESTROYED`.
example:
// The container was hidden (display: none) and shown manually:
panel.hidden = false;
grid.refresh();
related: `rebuild()`, `flush()`, `autoResize`, events `layout:start`, `layout:end`.
:::

:::method grid.rebuild([options], [done])
purpose: Applies new settings to the running grid.
syntax:
grid.rebuild({ layout: 'justified', layoutOptions: { targetRowHeight: 200 } });
params:
options | `object` | `{}` | Partial set of options. Nested objects (`layoutOptions`, `virtualization`, `animation`, `interaction`) are merged with the current ones. If specified `data`, the data is downloaded again.
done | `function` | — | Deprecated callback; called after recalculation.
returns: `this`.
inside: Combines options and rechecks them. If they have changed `layout` / `layoutOptions` — creates a new layout engine; changes `renderItem`, `itemTag`, `fields`, `virtualization` etc. reset the DOM pool and recreate the elements. The geometry is recalculated entirely. For layout changes, animation is enabled and the scroll anchor is saved.
use: Changing layout, changing gap/minWidth/columns, virtualization settings, enabling Drag & Drop.
limits: The key cannot be “removed” by a union—set a new value. The data remains the same (unless transferred `data`).
errors: `INVALID_OPTION`; `DESTROYED`.
example:
slider.oninput = () => grid.rebuild({ layoutOptions: { gap: Number(slider.value) } });
related: `refresh()`, [Options](#/api-options), events `layout:end`.
:::

:::method grid.reload()
purpose: Reloads data (if `data` — function) or resets scrolling and redraws cards.
syntax:
await grid.reload();
params: —
returns: `Promise<ABI7Grid>`. Not rejected: bootloader errors come to event `error`.
inside: If `options.data` — function, it is called again (with `AbortSignal`), the previous incomplete download is cancelled. Otherwise: scrolling is reset to the beginning, cards are re-linked, geometry is recalculated.
use: “Update” button for lists with server loading.
limits: The response of the legacy load (launched earlier) is ignored - there are no races.
errors: `DESTROYED`.
example:
const grid = new ABI7Grid('#gallery', { data: ({ signal }) => fetch('/api/photos', { signal }).then(r => r.json()) });
refreshBtn.onclick = () => grid.reload();
related: `load()`, `setData()`, events `data:load-start`, `data:load-end`.
:::

:::method grid.destroy()
purpose: Completely destroys the instance and returns the container to its original state.
syntax:
grid.destroy();
params: —
returns: `undefined`. Recalling is safe.
inside: Order: event `destroy` → clearing all plugins (in reverse installation order) → canceling drag → canceling current loading → disabling ResizeObserver/IntersectionObserver → deleting DOM elements and pool → `AbortController.abort()` for all listeners → cancel timers and `requestAnimationFrame` → removing a layer `.abi7-container` → restoration of the original container attributes → cleaning of subscribers. Waiting `whenReady()` are rejected.
use: When deleting a page/component (SPA), before re-creating the grid on the same element.
limits: After `destroy()` changing methods throw `DESTROYED`; `getState()`, `isDestroyed()`, `off()` continue to work.
errors: Doesn't quit.
example:
window.addEventListener('pagehide', () => grid.destroy());
related: `isDestroyed()`, `unuse()`, event `destroy`.
:::

:::method grid.flush()
purpose: Synchronously performs deferred layout and window updating.
syntax:
grid.insert(item);
grid.flush();
params: —
returns: `this`.
inside: Data changes mark the geometry as obsolete and schedule recalculation for the next frame (`requestAnimationFrame`), combining multiple changes into one pass. `flush()` executes this pass immediately.
use: When immediately after changing the data you need the current DOM (tests, measurements). Methods for reading geometry (`getItem`, `scrollToIndex`, Plugin API `geometry.*`) cause the layout themselves.
limits: Not needed in normal application code.
errors: —
example:
grid.insert(photo);
grid.flush();
console.log(grid.getState().virtualization.mounted);
related: `refresh()`, event `layout:end`.
:::

:::method grid.whenReady()
purpose: Returns a Promise that is executed after the first layout.
syntax:
await grid.whenReady();
params: —
returns: `Promise<ABI7Grid>`. If the grid is destroyed before it is ready, it is rejected `ABI7Error('DESTROYED')`.
inside: While the grid is not ready, calls are queued; upon event `ready` the queue is running.
use: When you need to execute the code after the first geometry appears.
limits: If the container is hidden (width 0) or the layout is not registered, the Promise waits until this changes.
errors: `DESTROYED` (rejection).
example:
const grid = new ABI7Grid('#gallery', { data: photos });
await grid.whenReady();
grid.scrollToIndex(100);
related: event `ready`, `getState().ready`.
:::

## Data

:::method grid.data([list])
purpose: Without arguments, returns a copy of an array of records; with an array, it replaces the data (the same as `setData`).
syntax:
const records = grid.data();
grid.data(newList);
params:
list | `object[]` | — | New set of records. Without an argument, the method acts as a getter.
returns: Getter: `object[]` (a copy of the array; the objects themselves are the same). Setter: `this`.
inside: Records are stored in `DataStore` in parallel with the id array; getter gives `slice()`.
use: To read the current order of entries, for example after Drag & Drop.
limits: Records without a field `id` get the internal id of the view `abi7-1`; it is not stored in the objects themselves (read `getItems()[i].id`).
errors: `INVALID_DATA`, `DUPLICATE_ID`.
example:
grid.on('drag:end', () => localStorage.setItem('order', JSON.stringify(grid.data().map(p => p.id))));
related: `setData()`, `getItems()`.
:::

:::method grid.setData(list)
purpose: Completely replaces the data set.
syntax:
grid.setData(photos);
params:
list | `object[]` | mandatory | New entries. The array is copied (`slice`), but objects are not cloned or modified.
returns: `this`.
inside: Checks entries and id uniqueness, cancels current asynchronous loading, resets size cache and element classes, sets scrolling reset, renames mounted elements to new entries (DOM is reused) and schedules a full recalculation. Events: `data:load-start` → `data:load-end` → `layout:start` → `layout:end`.
use: Changing the data set, filtering, searching.
limits: The Selection plugin selection is reset (id may have disappeared). For async source use `load()`.
errors: `INVALID_DATA` (not an array / not an object in an array), `DUPLICATE_ID`, `INVALID_ID`. If there is an error, the data does not change, but `data:load-end` contains a field `error`.
example:
searchInput.oninput = () => grid.setData(all.filter(p => p.title.includes(searchInput.value)));
related: `load()`, `insert()`, events `data:load-start`, `data:load-end`.
:::

:::method grid.load(source)
purpose: Asynchronous data loading: function, Promise or array.
syntax:
await grid.load(({ signal }) => fetch('/api/photos', { signal }).then(r => r.json()));
params:
source | `function` or `Promise` or `object[]` | mandatory | The function gets `{ signal: AbortSignal, source: string }` and returns an array or Promise of an array.
returns: `Promise<ABI7Grid>`; never deviates.
inside: Each call increments the internal load token and aborts `AbortController` previous one. The result is applied only if the token is valid and the grid is not destroyed - this is protection against races. The error (exception, reject, invalid format) turns into `data:load-end` with field `error` and event `error`.
use: Data from the server, pagination “with replacement”.
limits: For additional loading “at the end” use `insert()`.
errors: `DESTROYED`. Bootloader errors - only via event `error`.
example:
grid.on('error', (e) => console.warn(e.source, e.message));
await grid.load(async ({ signal }) => (await fetch('/api/photos', { signal })).json());
related: `reload()`, `setData()`, events `data:load-start`, `data:load-end`, `error`.
:::

:::method grid.insert(items, [options])
purpose: Inserts one or more records.
syntax:
grid.insert(photo);
grid.insert([a, b], { at: 'start' });
params:
items | `object` or `object[]` | mandatory | A record or array of records.
options.at | `number` or `'start'` or `'end'` | `'end'` | Insertion position.
returns: `Array<string|number>` — id of the inserted records (an empty array for an empty list).
inside: Fixes the scroll anchor, inserts records, reindexes mounted elements, marks geometry obsolete starting from the insertion position (partial recalculation) and calls once `item:insert`.
use: Loading data pages (`at: 'end'`), adding a new card.
limits: If the window is scrolled down, inserting above the window does not shift the visible content (Scroll Anchoring). When `scrollTop = 0` the new card is visible immediately.
errors: `DUPLICATE_ID`, `INVALID_DATA`, `INVALID_ARGUMENT` (incorrect `at`).
example:
grid.on('reach:end', async () => grid.insert(await fetchNextPage()));
related: `remove()`, `move()`, event `item:insert`, event `reach:end`.
:::

:::method grid.remove(idOrIds)
purpose: Deletes a record or several records by id.
syntax:
grid.remove('photo-1');
grid.remove(['a', 'b']);
params:
idOrIds | `id` or `id[]` | mandatory | IDs of records to be deleted. Non-existent ones are ignored.
returns: `number` — how many records were deleted.
inside: Removes entries from storage, resets associated caches and pins, unmounts the DOM, schedules a partial recalculation from the position of the first removed entry, and calls once `item:remove`.
use: Removing a card, recycle bin, transferring to another grid.
limits: The event is not raised if nothing is deleted.
errors: `DESTROYED`.
example:
const removed = grid.remove(selection.getSelected());
related: `insert()`, event `item:remove`.
:::

:::method grid.update(id, patch)
purpose: Updates the fields of a record.
syntax:
grid.update('photo-1', { title: 'New', height: 500 });
params:
id | `id` | mandatory | Record ID.
patch | `object` | mandatory | Changeable fields. The record object itself is not mutated—a copy of it is created with the same prototype.
returns: `boolean` — `false`, if there is no record.
inside: If the fields that affect the size have changed (`width`, `height`, `aspectRatio` according to `fields`), the geometry is recalculated from this record; in any case, the card is redrawn and called `item:update`.
use: Change signature, sizes, any user data.
limits: Change `id` it is impossible.
errors: `INVALID_ID` (attempt to change id), `INVALID_DATA`.
example:
grid.update('photo-3', { title: 'Sunset', width: 1200, height: 800 });
related: event `item:update`, option `fields`.
:::

:::method grid.move(id, toIndex)
purpose: Moves a record to a new position.
syntax:
grid.move('photo-5', 0);
params:
id | `id` | mandatory | Identifier.
toIndex | `number` | mandatory | New index (limited by range).
returns: `boolean` — `false`, if the record is not found or the position has not changed.
inside: Rearrangement in storage, DOM reindexing, partial recalculation with `min(from, to)`, animation, event `item:move` (`source: 'api'`). Drag & Drop works the same way.
use: Sorting, “lift to the top.”
limits: The new order is stored only in the grid; save it yourself (`data()`).
errors: `DESTROYED`.
example:
grid.move('photo-9', 0);
related: event `item:move`, Drag & Drop.
:::

:::method grid.getCount()
purpose: Number of records.
syntax:
const n = grid.getCount();
params: —
returns: `number`.
inside: Length of the internal record array.
use: Statistics, checks.
limits: Does not depend on virtualization (this is the number of all records, not DOM elements).
errors: —
example:
counter.textContent = grid.getCount();
related: `getState()`.
:::

## Items

:::method grid.getItem(id)
purpose: Returns a description of the element.
syntax:
const item = grid.getItem('photo-1');
params:
id | `id` | mandatory | Identifier.
returns: `Item` or `null`. Fields: `id`, `index`, `data` (record), `rect` (`Rect`), `element` (`HTMLElement` or `null`, if the card is not currently in the DOM), `visible` (`boolean`whether the card crosses the window without overscan).
inside: If the geometry is out of date, deferred nesting is performed first.
use: Find out the coordinates, size and current state of the card.
limits: Copies of coordinates are returned (`rect` — photo). `element` changes when the DOM is reused - don't store it.
errors: —
example:
const { rect, visible } = grid.getItem('photo-7');
related: `getItems()`, `getVisibleItems()`.
:::

:::method grid.getItems()
purpose: Descriptions of all elements in order of data.
syntax:
const all = grid.getItems();
params: —
returns: `Item[]` (see `getItem`).
inside: For each record, a description object is created - an O(n) operation.
use: Debugging, small sets, order export.
limits: For tens of thousands of records, call rarely; use `getVisibleItems()` or `data()`.
errors: —
example:
const order = grid.getItems().map(i => i.id);
related: `getItem()`, `data()`.
:::

:::method grid.getVisibleItems()
purpose: Elements located in the visible area (without overscan).
syntax:
const visible = grid.getVisibleItems();
params: —
returns: `Item[]`, everyone `visible: true` and `element` (DOM node).
inside: The query to the spatial index of the geometry is O(k), k is the number of visible ones.
use: Highlighting, impression analytics, lazy actions.
limits: Takes into account the current scroll position; after programmatic scrolling, the result is immediately relevant.
errors: —
example:
const ids = grid.getVisibleItems().map(i => i.id);
related: events `item:visible`, `item:hidden`.
:::

## Navigation

:::method grid.scrollToIndex(index, [options])
purpose: Scrolls so that the element at the given index is in the window.
syntax:
grid.scrollToIndex(500);
grid.scrollToIndex(500, { align: 'center', behavior: 'smooth' });
params:
index | `number` | mandatory | Record index.
options.align | `'start'`, `'center'`, `'end'`, `'nearest'` | `'start'` | Aligning an element in a window.
options.offset | `number` | `0` | Additional offset, px.
options.behavior | `'auto'`, `'smooth'` | `'auto'` | Scroll mode.
returns: `boolean` — `false`, if the index is out of range.
inside: The coordinates are taken from the finished geometry; no DOM is created for intermediate elements. The scroll axis is determined by the layout (vertical or horizontal). The value is limited by the size of the content.
use: “Go to card”, position restoration, search.
limits: For layout with measured height (`virtualization.measure`) coordinates are specified after measurement.
errors: `DESTROYED`.
example:
grid.scrollToIndex(1200, { align: 'center' });
related: `scrollToItem()`, `getVisibleItems()`.
:::

:::method grid.scrollToItem(id, [options])
purpose: Same as `scrollToIndex`, but by id.
syntax:
grid.scrollToItem('photo-500', { align: 'nearest' });
params:
id | `id` | mandatory | Identifier.
options | `object` | `{}` | See `scrollToIndex`.
returns: `boolean` — `false`, if id is not found.
inside: Translates id into index and calls `scrollToIndex`.
use: When the id is known, not the position.
limits: —
errors: `DESTROYED`.
example:
grid.scrollToItem(selection.getSelected()[0]);
related: `scrollToIndex()`.
:::

## Plugins

:::method grid.use(plugin, [options])
purpose: Installs the plugin.
syntax:
grid.use(SelectionPlugin, { multiple: true });
params:
plugin | `object` | mandatory | Plugin object: `name`, `version`, `apiVersion`, `install(api, options)`.
options | `object` | `{}` | Plugin options; unite with `plugin.defaults`.
returns: `this`.
inside: Checks contract and compatibility `apiVersion` with the core API version, presence of dependencies and duplicate, creates an isolated Plugin API, calls `install()`. Everything that the plugin has registered via the API is tracked. If there is an error in `install()` a rollback is performed (subscriptions, features, layout), the exception is thrown. After success - event `plugin:install`.
use: Connecting functionality and layout plugins.
limits: `install()` must be synchronous. You cannot install two plugins with the same name.
errors: `PluginError` with codes `PLUGIN_INVALID`, `PLUGIN_INCOMPATIBLE`, `PLUGIN_DUPLICATE`, `PLUGIN_DEPENDENCY`, `PLUGIN_INSTALL_FAILED`, `PLUGIN_FEATURE_CONFLICT`.
example:
try { grid.use(LightboxPlugin, { loop: true }); }
catch (e) { console.error(e.code, e.message); }
related: `unuse()`, `getPlugin()`, [Plugin API](#/api-plugin), event `plugin:install`.
:::

:::method grid.unuse(name)
purpose: Disables the plugin.
syntax:
grid.unuse('selection');
params:
name | `string` | mandatory | Plugin name.
returns: `boolean` — `false`, if the plugin is not installed.
inside: The cleanup function returned is called `install()`; then all subscriptions, features, layout and disposables are removed in reverse order. In progress `plugin:uninstall` with `reason: 'unuse'`. If the active layout belonged to the plugin, the grid switches to `masonry` and sends `error` with code `LAYOUT_REMOVED`.
use: Dynamically disabling features.
limits: You cannot disable a plugin that another one depends on (`PLUGIN_REQUIRED`).
errors: `PluginError` `PLUGIN_REQUIRED`.
example:
grid.unuse('lightbox');
related: `use()`, event `plugin:uninstall`.
:::

:::method grid.getPlugin(name)
purpose: Returns the public interface of the plugin.
syntax:
const selection = grid.getPlugin('selection');
params:
name | `string` | mandatory | Feature name (usually the same as the plugin name).
returns: Object registered via `api.features.register(name, impl)`, or `null`.
inside: Search the features registry for a given instance.
use: Call plugin methods.
limits: A plugin that has not registered a feature returns `null` — check `hasPlugin()`.
errors: —
example:
grid.getPlugin('selection')?.selectAll();
related: `hasPlugin()`, `getPlugins()`.
:::

:::method grid.hasPlugin(name)
purpose: Checks if the plugin is installed.
syntax:
if (grid.hasPlugin('lightbox')) { /* ... */ }
params:
name | `string` | mandatory | Plugin name.
returns: `boolean`.
inside: Search the registry of installed plugins.
use: Conditional logic.
limits: —
errors: —
example:
if (!grid.hasPlugin('selection')) grid.use(SelectionPlugin);
related: `getPlugins()`.
:::

:::method grid.getPlugins()
purpose: List of installed plugins.
syntax:
console.table(grid.getPlugins());
params: —
returns: `Array<{ name, version, apiVersion, options }>` in order of installation.
inside: Registry snapshot.
use: Debugging.
limits: `options` — frozen object.
errors: —
example:
grid.getPlugins().map(p => p.name);
related: `use()`, `unuse()`.
:::

## Events

:::method grid.on(eventName, callback)
purpose: Subscribe to the event.
syntax:
const off = grid.on('item:click', (event) => console.log(event.id));
params:
eventName | `string` | mandatory | Event name or `'*'` (all events; callback gets `(event, name)`).
callback | `function` | mandatory | Handler `(event, name) => void`.
returns: `function` — call her to unsubscribe.
inside: Handlers are called in order of subscription. The exception in the handler is caught and turned into an event `error` (`source: 'listener'`), the remaining handlers are executed.
use: Reaction to any grid and plugin events.
limits: The handler should not be asynchronous "long" - events are called synchronously. Subscribers are cleared when `destroy()`.
errors: `TypeError` — invalid name or not a function.
example:
const off = grid.on('layout:end', e => console.log(e.info));
off();
related: `off()`, `once()`, [Events](#/api-events).
:::

:::method grid.once(eventName, callback)
purpose: Subscription for one trigger.
syntax:
grid.once('ready', () => console.log('first layout'));
params:
eventName | `string` | mandatory | Event name.
callback | `function` | mandatory | Handler.
returns: `function` — unsubscribe before triggering.
inside: The handler is removed before being called.
use: One-time actions.
limits: —
errors: `TypeError`.
example:
grid.once('layout:end', () => grid.scrollToIndex(10));
related: `on()`, `off()`.
:::

:::method grid.off(eventName, callback)
purpose: Processor unsubscribe.
syntax:
grid.off('item:click', handler);
params:
eventName | `string` | mandatory | Event name.
callback | `function` | mandatory | The same function that was passed to `on()`.
returns: `boolean` — whether the handler was found.
inside: One (last signed) instance of the function is deleted.
use: Unsubscribe using a link to a function.
limits: Anonymous functions cannot be unsubscribed in this way - save the return value `on()`.
errors: —
example:
const handler = (e) => {};
grid.on('scroll', handler);
grid.off('scroll', handler);
related: `on()`, `once()`.
:::

## State

:::method grid.getState()
purpose: Snapshot of the grid state.
syntax:
const state = grid.getState();
params: —
returns: Object: `phase` (`'new'`, `'loading'`, `'pending'`, `'ready'`, `'destroyed'`), `ready`, `destroyed`, `loading`, `hidden`, `visible`, `layout`, `pendingLayout`, `axis`, `count`, `contentWidth`, `contentHeight`, `layoutInfo` (what the layout returned), `viewport` (`scrollLeft`, `scrollTop`, `width`, `height`, `axis`, `overscan`), `virtualization` (`enabled`, `mounted`, `pooled`, `created`, `reused`, `pinned`, `velocity`, `overscan`), `plugins` (names).
inside: It is assembled from internal counters without DOM traversal.
use: Debugging, statistics panels, tests.
limits: This is a copy: changing the result does not affect the grid.
errors: —
example:
const { mounted, pooled, created, reused } = grid.getState().virtualization;
related: `isDestroyed()`.
:::

:::method grid.isDestroyed()
purpose: Checking that the instance has been destroyed.
syntax:
if (!grid.isDestroyed()) grid.refresh();
params: —
returns: `boolean`.
inside: Reads the lifecycle flag.
use: Asynchronous code that could survive the grid.
limits: —
errors: —
example:
fetchPhotos().then(list => { if (!grid.isDestroyed()) grid.setData(list); });
related: `destroy()`.
:::

## Static

:::method ABI7Grid.registerLayout(name, definition, [options])
purpose: Globally registers a layout that is available to all grids on the page.
syntax:
ABI7Grid.registerLayout('horizontal', HorizontalLayout);
params:
name | `string` | mandatory | Name for `options.layout`.
definition | `object` | mandatory | Definition of layout (`create()` or `compute()`) or a plugin object with a field `layout`.
options.override | `boolean` | `false` | Allow replacement of existing layout.
returns: `undefined`.
inside: The definition is normalized (`axis`, `responsive`, `defaults`), placed in the global registry; The grid waiting for this layout automatically continues to run.
use: Several grids need the Layout plugin.
limits: Built-in layouts can only be replaced with `override: true`.
errors: `INVALID_LAYOUT`, `LAYOUT_EXISTS`.
example:
ABI7Grid.registerLayout('stack', { compute(ctx) { /* ... */ } });
related: `unregisterLayout()`, `getLayouts()`, [Layout API](#/api-plugin/layout-api).
:::

:::method ABI7Grid.unregisterLayout(name)
purpose: Deletes a globally registered layout.
syntax:
ABI7Grid.unregisterLayout('horizontal');
params:
name | `string` | mandatory | Name layout.
returns: `boolean`.
inside: Removal from the global registry. Already running grids retain the created engine.
use: Tests, dynamic extensions.
limits: Built-in layouts are not deleted.
errors: `LAYOUT_BUILTIN`.
example:
ABI7Grid.unregisterLayout('stack');
related: `registerLayout()`.
:::

:::method ABI7Grid.getLayouts()
purpose: Names of globally registered layouts.
syntax:
ABI7Grid.getLayouts(); // ['masonry', 'grid', 'justified']
params: —
returns: `string[]`.
inside: Global registry keys.
use: Layout selection drop-down list.
limits: Layout registered by the plugin on one grid (`api.layouts.register`), are not included here.
errors: —
example:
select.innerHTML = ABI7Grid.getLayouts().map(n => `<option>${n}</option>`).join('');
related: `registerLayout()`.
:::

:::method ABI7Grid.fromLegacyOptions(legacy)
purpose: Converts an options object written for the previous ABI7 Grid (`abi7_grid`) into options of this version. The helper exists in the current source; this repository does not provide a migration guide or a compatibility layer.
syntax:
const { options, unmapped } = ABI7Grid.fromLegacyOptions(oldConfig);
params:
legacy | `object` | `{}` | Options object in the previous option format.
returns: `{ options, unmapped }` — the converted options and a list of settings that have no equivalent and must be handled manually (event callbacks, `funcItemLoad` etc.).
inside: Maps `items.minWidth/maxWidth`, `maxColumns`, `space`, `items.aspectRatio/height`, `padding`, `animation`, `items.sortable`, `grid.height`, `data`.
use: Only if you already have an option object in the previous format. New projects should use the options described in [Options](#/api-options).
limits: Loading functions and event callbacks are not converted automatically.
errors: —
example:
const { options, unmapped } = ABI7Grid.fromLegacyOptions(oldConfig);
const grid = new ABI7Grid('#gallery', options);
related: [Options](#/api-options).
:::

Static properties: `ABI7Grid.version` (`'1.0.0'`), `ABI7Grid.apiVersion` (Plugin API version, `'1.0.0'`), `ABI7Grid.defaults` (copy of default settings).

## Deprecated

:::method grid.itemInsert(data, [done])
purpose: Compatible with old API: insertion at the beginning.
syntax:
grid.itemInsert(photo);
params:
data | `object` | mandatory | Record.
done | `function` | — | Called after `layout:end`.
returns: id of the inserted record.
inside: `insert(data, { at: 'start' })`.
use: Only in the old code.
limits: Outdated.
errors: Like `insert()`.
example:
grid.itemInsert({ id: 'x', width: 1, height: 1 });
related: `insert()`.
:::

:::method grid.items()
purpose: Compatible with old API.
syntax:
const list = grid.items();
params: —
returns: Same as `getItems()` (the format has changed: instead of internal objects - descriptions `Item`).
inside: Challenge `getItems()`.
use: Only in the old code.
limits: Outdated.
errors: —
example:
grid.items().length;
related: `getItems()`.
:::
