# API Reference: Events

All events are called **synchronously** in order of subscription. Each event object contains a field `type` (event name). An exception in a handler does not interrupt the others: it turns into an event [`error`](#/api-events/event-error) with `source: 'listener'` (or `'plugin:name'`, if the subscriber is a plugin).

Subscription `grid.on('*', (event, name) => ...)` receives **everything** events - convenient for debugging.

## Order of events in typical scenarios

| Scenario | Sequence |
|---|---|
| First launch | `data:load-start` → `data:load-end` → `layout:start` → `viewport:update` → `layout:end` → `ready` |
| `setData(list)` | `data:load-start` → `data:load-end` → `layout:start` → `viewport:update` → `layout:end` |
| `insert()` / `remove()` | `item:insert` (or `item:remove`) → (next frame) `layout:start` → `viewport:update` → `layout:end` |
| Resizing a container | `resize` → `layout:start` → `viewport:update` → `layout:end` |
| Scrolling | `scroll` (once per frame, when changing position), `viewport:update` — if the set of mounted elements has changed; after 140 ms of silence `scroll:stop` |
| Drag & Drop | `drag:start` → `drag:move`… (+ `item:move` with each permutation) → `drag:end` |
| `use()` / `unuse()` | `plugin:install` / `plugin:uninstall` |
| `destroy()` | `destroy` → `plugin:uninstall` (for each plugin, `reason: 'destroy'`) |

The layout pass is always paired: for each `layout:start` exactly one comes `layout:end`. Several changes in one frame are combined into one pass (field `reasons` contains all the reasons).

## Life cycle

:::event ready
purpose: The grid has completed the first layout and is ready to go.
when: Once during the lifetime of the instance - after the first `layout:end`. If the container is hidden (width 0), the event is delayed until the size appears.
order: After `layout:end` first pass.
payload:
type | `string` | `'ready'`
count | `number` | Number of records.
cancel: Not cancelable.
example:
grid.once('ready', (e) => console.log('cards:', e.count));
related: `layout:end`, `whenReady()`.
:::

:::event destroy
purpose: Grid began destruction.
when: At the beginning `destroy()`, while the plugins and DOM have not yet been freed.
order: First event `destroy()`; then — `plugin:uninstall` for each plugin.
payload: —
cancel: Not cancelable.
example:
grid.on('destroy', () => console.log('clean up your resources'));
related: `plugin:uninstall`.
:::

:::event error
purpose: A single channel for errors that occur within the core or plugins asynchronously / without calling code.
when: Exception in event handler; data loader error; exception in `renderItem` / `releaseItem`; layout error; plugin cleanup error; deleting the active layout.
order: Not tied to other events. If subscribers to `error` no, the error is written in `console.error`.
payload:
type | `string` | `'error'`
source | `string` | `'listener'`, `'plugin:name'`, `'data'`, `'layout'`, `'renderItem'`, `'releaseItem'`, `'plugins'`
message | `string` | Error text.
error | `Error` | Original exception.
event | `string` | For `listener` / `plugin:*` — the name of the event in whose handler an error occurred.
phase | `string` | For plugins: `'cleanup'` if there is an error in the cleanup function.
id, index | `string` or `number` | For `renderItem` / `releaseItem` — the record where the error occurred.
cancel: Not cancelable. Exception inside a handler `error` does not cause recursion - it is written in `console.error`.
example:
grid.on('error', ({ source, message }) => reportToServer(source, message));
related: `data:load-end` (field `error`), `plugin:install`.
:::

## Data

:::event data:load-start
purpose: Start of data set replacement.
when: First boot, `setData()`, `load()`, `reload()` for the loader function, `rebuild({ data })`.
order: Before `data:load-end`.
payload:
type | `string` | `'data:load-start'`
source | `string` | `'initial'`, `'setData'`, `'load'`, `'reload'`, `'rebuild'`
cancel: Not cancelable.
example:
grid.on('data:load-start', () => spinner.hidden = false);
related: `data:load-end`.
:::

:::event data:load-end
purpose: Data received (or download failed).
when: After applying the data; an obsolete (preempted by a new load) response does not trigger the event.
order: After `data:load-start`, before `layout:start`. If there is an error, it comes after `error`.
payload:
type | `string` | `'data:load-end'`
source | `string` | Source as in `data:load-start`.
count | `number` | Number of records after loading.
error | `Error` | Only in case of error; the data is not changed.
cancel: Not cancelable.
example:
grid.on('data:load-end', (e) => { spinner.hidden = true; if (e.error) showToast(e.error.message); });
related: `data:load-start`, `layout:end`, `error`.
:::

:::event item:insert
purpose: Records are inserted into the grid.
when: After `insert()` (one event per call, regardless of the number of records).
order: Before recalculating the geometry (`layout:start` will come in the next frame).
payload:
type | `string` | `'item:insert'`
items | `Array<{ id, index, item }>` | All inserted records.
id, index, item | — | Fields of the first inserted record (convenient when only one record is inserted).
count | `number` | How many records are inserted.
cancel: Not cancelable.
example:
grid.on('item:insert', (e) => console.log('inserted', e.count, 'from position', e.index));
related: `item:remove`, `layout:start`.
:::

:::event item:remove
purpose: Entries have been deleted.
when: After `remove()` (if something is actually deleted).
order: Before `layout:start`.
payload:
type | `string` | `'item:remove'`
items | `Array<{ id, index, item }>` | Deleted entries; `index` — position before deletion.
id, index, item | — | First deleted entry.
count | `number` | How many records were deleted.
cancel: Not cancelable.
example:
grid.on('item:remove', (e) => api.delete(e.items.map(i => i.id)));
related: `item:insert`.
:::

:::event item:update
purpose: Entry modified via `update()`.
when: After `update()` existing entry.
order: Until a possible recalculation of the geometry.
payload:
type | `string` | `'item:update'`
id, index | `string` or `number`, `number` | Record and its position.
item | `object` | New entry.
previous | `object` | Previous entry.
changed | `string[]` | Names of the modified fields.
cancel: Not cancelable.
example:
grid.on('item:update', (e) => console.log(e.changed));
related: `update()`.
:::

:::event item:move
purpose: The entry has been moved to another position.
when: `move()` or dragging (for each real permutation).
order: In Drag & Drop - between `drag:start` and `drag:end`.
payload:
type | `string` | `'item:move'`
id | `string` or `number` | Record.
from, to, index | `number` | Previous and new positions (`index === to`).
item | `object` | Record.
source | `string` | `'api'`, `'drag'`, `'drag-cancel'` (rollback on Escape).
cancel: Not cancelable.
example:
grid.on('item:move', (e) => e.source === 'drag' && saveOrder(grid.data()));
related: `drag:end`, `move()`.
:::

## Layout and window

:::event layout:start
purpose: Start of geometry recalculation.
when: Before each layout pass.
order: Paired with `layout:end`.
payload:
type | `string` | `'layout:start'`
reason | `string` | First reason: `'data'`, `'insert'`, `'remove'`, `'move'`, `'update'`, `'resize'`, `'refresh'`, `'layout'`, `'rebuild'`, `'reload'`, `'measure'`, `'plugin'`.
reasons | `string[]` | All the reasons combined in this passage.
from | `number` | The index from which the geometry is recalculated (partial recalculation).
count | `number` | Number of records.
cancel: Not cancelable.
example:
grid.on('layout:start', (e) => console.time('layout:' + e.reason));
related: `layout:end`.
:::

:::event layout:end
purpose: The geometry is calculated, the DOM is updated.
when: After each layout pass (after updating mounted elements).
order: After `viewport:update`; in the first pass - before `ready`.
payload:
type | `string` | `'layout:end'`
reason, reasons, from, count | — | As in `layout:start`.
contentWidth, contentHeight | `number` | Content size, px.
duration | `number` | Calculation duration, ms.
animated | `boolean` | Is lane change animation enabled?
info | `object` | Layout data: Masonry — `columns`, `itemWidth`, `gapX`, `gapY`; Grid - the same + `rows`; Justified — `rows`; Horizontal — `itemHeight`.
cancel: Not cancelable.
example:
grid.on('layout:end', (e) => console.log(e.info.columns, e.contentHeight));
related: `layout:start`, `viewport:update`.
:::

:::event viewport:update
purpose: The set of mounted DOM elements has changed.
when: Scrolling, resizing, inserting/deleting, changing settings; after each layout pass.
order: Inside the layout pass - after calculation, before `layout:end`.
payload:
type | `string` | `'viewport:update'`
mounted | `number` | How many elements are currently in the DOM.
pooled | `number` | How many elements are in the DOM Pool.
total | `number` | Total entries.
created, reused | `number` | How many DOM elements have been created and how many times have they been reused over time?
overscan | `{ before, after }` | Current overscan, px (including adaptive).
first, last | `number` | Indexes of the first and last mounted element (`-1`, if empty).
cancel: Not cancelable.
example:
grid.on('viewport:update', (e) => stats.textContent = `${e.mounted} / ${e.total}`);
related: `scroll`, `item:mount`.
:::

:::event scroll
purpose: The scroll position has changed.
when: No more than once per frame, after updating the window.
order: After `viewport:update` the same frame.
payload:
type | `string` | `'scroll'`
scrollTop, scrollLeft | `number` | Position, px.
direction | `string` | `'forward'` or `'backward'`.
velocity | `number` | Smoothed velocity along the main axis, px/ms.
cancel: Not cancelable.
example:
grid.on('scroll', (e) => progress.value = e.scrollTop);
related: `scroll:stop`.
:::

:::event scroll:stop
purpose: The scrolling has stopped.
when: 140ms after the last scroll event.
order: After the last `scroll`.
payload:
type | `string` | `'scroll:stop'`
scrollTop, scrollLeft | `number` | Position, px.
cancel: Not cancelable.
example:
grid.on('scroll:stop', (e) => sessionStorage.setItem('y', e.scrollTop));
related: `scroll`.
:::

:::event resize
purpose: The container size has changed.
when: Via ResizeObserver (if `autoResize: true`) or when `refresh()`.
order: Before `layout:start` (if size affects layout).
payload:
type | `string` | `'resize'`
width, height | `number` | New container dimensions, px.
cancel: Not cancelable.
example:
grid.on('resize', (e) => console.log(e.width));
related: `layout:start`.
:::

:::event visibility:change
purpose: The container entered or left the page's visibility area.
when: Via IntersectionObserver (if available in the browser).
order: Regardless of other events.
payload:
type | `string` | `'visibility:change'`
visible | `boolean` | Is the container visible?
cancel: Not cancelable.
example:
grid.on('visibility:change', (e) => e.visible ? video.play() : video.pause());
related: `getState().visible`.
:::

:::event reach:end
purpose: The window has moved towards the end of the content.
when: When there's no more left to go `virtualization.endThreshold` px. Triggers once; again - only after the content has grown (for example, after `insert`) or the user has moved away.
order: At the end of the window update.
payload:
type | `string` | `'reach:end'`
remaining | `number` | How many px are left until the end.
count | `number` | Number of records.
cancel: Not cancelable.
example:
grid.on('reach:end', async () => grid.insert(await loadNextPage()));
related: `insert()`, option `virtualization.endThreshold`.
:::

## DOM elements

:::event item:mount
purpose: The DOM element is bound to an entry (created or taken from the pool).
when: When an entry appears in the window after the content has been rendered.
order: Before `viewport:update`.
payload:
type | `string` | `'item:mount'`
id, index | `string` or `number`, `number` | Record.
item | `object` | Data recording.
element | `HTMLElement` | Knot. It will be reused - do not save the link.
cancel: Not cancelable. The event is created only if there are subscribers.
example:
grid.on('item:mount', ({ element, item }) => element.title = item.title);
related: `item:unmount`.
:::

:::event item:unmount
purpose: The DOM element is unlinked from the entry and sent to the pool.
when: When a record leaves the window (taking into account overscan), it is deleted or the grid is rebuilt.
order: Before `item:mount` for the reused node.
payload:
type | `string` | `'item:unmount'`
id, index | `string` or `number`, `number` | Record.
element | `HTMLElement` | The node that will now be removed from the DOM.
cancel: Not cancelable.
example:
grid.on('item:unmount', ({ element }) => element.querySelector('video')?.pause());
related: `item:mount`.
:::

:::event item:visible
purpose: The recording entered the visible area (without overscan).
when: After updating the window; the event is created only if there are subscribers to `item:visible` or `item:hidden`.
order: After `viewport:update`-processing, until `scroll`.
payload:
type | `string` | `'item:visible'`
id, index | `string` or `number`, `number` | Record.
item | `object` | Data recording.
element | `HTMLElement` | Knot.
cancel: Not cancelable.
example:
grid.on('item:visible', (e) => analytics.impression(e.id));
related: `item:hidden`, `getVisibleItems()`.
:::

:::event item:hidden
purpose: The recording has left the visible area.
when: Paired event to `item:visible`.
order: Together with `item:visible` in one update (first `visible`, then `hidden`).
payload:
type | `string` | `'item:hidden'`
id | `string` or `number` | Record.
index | `number` | Index or `-1`, if the entry is deleted.
cancel: Not cancelable.
example:
grid.on('item:hidden', (e) => analytics.leave(e.id));
related: `item:visible`.
:::

## Interaction

:::event item:click
purpose: Click on the card.
when: Native `click` inside the card. Not called if dragging has ended immediately before, and when `interaction.click: false`.
order: Handlers are called in order of subscription; plugins (such as Selection and Lightbox) are also common subscribers.
payload:
type | `string` | `'item:click'`
id, index | `string` or `number`, `number` | Card.
item | `object` | Data recording.
element | `HTMLElement` | DOM node of the card.
originalEvent | `MouseEvent` | Initial event (`ctrlKey`, `shiftKey`, …).
defaultPrevented | `boolean` | `true`if someone called `preventDefault()`.
preventDefault | `function` | Marks the click as processed.
cancel: Cancellable: `event.preventDefault()` tells plugins (Selection, Lightbox, Counter) that the click has been processed. The browser's native behavior is not overridden.
example:
grid.on('item:click', (e) => { if (e.item.locked) e.preventDefault(); });
related: `item:dblclick`, `item:contextmenu`.
:::

:::event item:dblclick
purpose: Double click on the card.
when: Native `dblclick`.
order: After two `item:click`.
payload:
type | `string` | `'item:dblclick'`
id, index, item, element, originalEvent, defaultPrevented, preventDefault | — | Like `item:click`.
cancel: Cancellable (flag for other subscribers).
example:
grid.on('item:dblclick', (e) => openEditor(e.item));
related: `item:click`.
:::

:::event item:contextmenu
purpose: Context menu on the card.
when: Native `contextmenu`.
order: Regardless.
payload:
type | `string` | `'item:contextmenu'`
id, index, item, element, originalEvent, defaultPrevented, preventDefault | — | Like `item:click`.
cancel: Cancellable: `event.preventDefault()` suppresses the browser's native context menu.
example:
grid.on('item:contextmenu', (e) => { e.preventDefault(); showMenu(e.originalEvent.clientX, e.originalEvent.clientY, e.id); });
related: `item:click`.
:::

:::event drag:start
purpose: Start dragging the card.
when: Mouse - after moving to `interaction.drag.threshold` px; touch - after a long press `delay` ms. Only when `interaction.drag.enabled: true`.
order: The first event of the drag session.
payload:
type | `string` | `'drag:start'`
id, index, item, element | — | Dragging card.
clientX, clientY | `number` | Pointer position.
pointerType | `string` | `'mouse'`, `'touch'`, `'pen'`.
originalEvent | `PointerEvent` | Event `pointerdown`.
cancel: Cancellable: `preventDefault()` cancels dragging.
example:
grid.on('drag:start', (e) => { if (e.item.pinned) e.preventDefault(); });
related: `drag:move`, `drag:end`.
:::

:::event drag:move
purpose: The pointer moved while you were dragging.
when: At every `pointermove` and when autoscrolling.
order: Between `drag:start` and `drag:end`.
payload:
type | `string` | `'drag:move'`
id | `string` or `number` | Card.
index, fromIndex | `number` | Current and starting positions.
overIndex | `number` | Card index under the index or `-1`.
clientX, clientY | `number` | Pointer position.
outside | `boolean` | Pointer outside the container (using Connected Grids).
pointerType | `string` | Pointer type.
cancel: Not cancelable.
example:
grid.on('drag:move', (e) => hint.hidden = !e.outside);
related: `item:move`.
:::

:::event drag:end
purpose: The drag and drop is completed or cancelled.
when: `pointerup`, `pointercancel`, Escape, window loses focus.
order: Last event of the drag session. When canceling (Escape, etc.) the order is rolled back — `item:move` with `source: 'drag-cancel'` — happens before `drag:end`.
payload:
type | `string` | `'drag:end'`
id | `string` or `number` | Card.
fromIndex, toIndex | `number` | Positions before and after (if canceled are equal).
moved | `boolean` | Has the order changed?
cancelled | `boolean` | Cancel (Escape, `pointercancel`, blur).
outside | `boolean` | Completed outside the container.
clientX, clientY, pointerType | — | Pointer data.
cancel: Not cancelable.
example:
grid.on('drag:end', (e) => { if (e.moved) saveOrder(grid.data().map(p => p.id)); });
related: `drag:start`, `item:move`.
:::

## Plugins

:::event plugin:install
purpose: The plugin is installed.
when: Immediately after a successful `install()`.
order: After all plugin registrations.
payload:
type | `string` | `'plugin:install'`
name | `string` | Plugin name.
version | `string` | Plugin version.
cancel: Not cancelable.
example:
grid.on('plugin:install', (e) => console.log(e.name, e.version));
related: `plugin:uninstall`.
:::

:::event plugin:uninstall
purpose: The plugin is disabled.
when: After the function of cleaning the plugin and removing all its subscriptions.
order: When `destroy()` comes for each plugin (in reverse order of installation).
payload:
type | `string` | `'plugin:uninstall'`
name, version | `string` | Plugin.
reason | `string` | `'unuse'` or `'destroy'`.
cancel: Not cancelable.
example:
grid.on('plugin:uninstall', (e) => console.log(e.name, e.reason));
related: `plugin:install`.
:::

## Built-in plugin events

| Event | Plugin | Arguments | Cancel |
|---|---|---|---|
| `selection:change` | selection | `selected`, `added`, `removed`, `source` | no |
| `lightbox:before-open` | lightbox | `id` | yes |
| `lightbox:open` | lightbox | `id`, `index` | no |
| `lightbox:change` | lightbox | `id`, `index`, `previousId` | no |
| `lightbox:close` | lightbox | `id` | no |
| `connected-grids:before-transfer` | connected-grids | `id`, `record`, `from`, `to` | yes |
| `connected-grids:transfer` | connected-grids | `id`, `newId`, `record`, `copy`, `index`, `from`, `to` | no |
| `connected-grids:receive` | connected-grids | `id`, `from`, `record`, `index` | no |
