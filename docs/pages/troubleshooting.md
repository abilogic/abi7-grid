# Troubleshooting

Each entry lists the symptom, the likely cause and what to check. Errors thrown by the core are `ABI7Error` with a stable `code`; errors inside listeners and plugins arrive as the `error` event.

## The grid does not initialize

- **Nothing is drawn and the console shows a module error.** ES modules do not load from `file://`; use an HTTP server. Check that the import path is correct.
- **`ABI7Error: ... (code: ALREADY_INITIALIZED)`.** The element already has an instance. Call `destroy()` first.
- **No cards, no error.** The container has no height (it is the scroll container) or no width; `getState().hidden` is `true`. Give it a height in CSS or with `height`.
- **Container not found.** The selector matched nothing at construction time; create the grid after the DOM is ready.
- **Cards are empty.** Records need `id`; and `fields.src` must point to your URL property. `javascript:` URLs are filtered out.

## Cards overlap

Usually one of: records have no size information (all get `estimatedHeight`), image ratio differs from the record's `width`/`height`, or your CSS overrides `.abi7-item` (`position`, `transform`, `width`, `height`). Do not style these properties. Update the record with real sizes.

## Cards go outside the container

- A site-wide CSS rule such as `* { box-sizing: ... }` or `img { max-width: ... }` interacting with `.abi7-item`; the core uses `box-sizing: border-box`.
- `padding` option versus your own CSS padding on the root: use the `padding` option so it is part of the width calculation.
- The container's width changed without notification (`autoResize: false`): call `refresh()`.

## Content does not trigger recalculation

- Direct DOM changes are not observed. Use `update()` or `refresh()`.
- Changing an option on a plain object you passed in has no effect; use `rebuild(patch)`.
- Image `load` events are not observed; update the record's size yourself.

## Wrong height

- With `measure: true`, heights are measured only for cards that have been mounted; the total height is an estimate until then.
- Layout options priority: measured → `itemHeight` → `aspectRatio` → record aspect → record height → `estimatedHeight`. A fixed `itemHeight` wins over the record's height.
- `aspectRatio: 0` in Grid takes row height from the records.

## Errors when adding dynamically

- `INVALID_ARGUMENT`: `insert()` got an invalid `at`.
- `DUPLICATE_ID`: ids must be unique within the grid.
- `DESTROYED`: calling a method after `destroy()`. Check `isDestroyed()`.
- Listen to `error` to see problems inside handlers: `grid.on('error', (e) => console.warn(e.source, e.message))`.

## CSS conflicts

All selectors start with `.abi7-`; there are no global resets. A conflict is almost always your CSS targeting `.abi7-item` or `.abi7-media`. Theme with the CSS variables on `.abi7-grid` (for example `--abi7-item-bg`, `--abi7-item-radius`) instead.

## Image problems

- Blank cards: check the URL and CORS; the card sets `loading="lazy"`.
- Layout jumps after images load: records have wrong ratios.
- Broken images from `data:` URLs: only `data:image/*` URLs are allowed.

## Still stuck?

Open an issue at https://github.com/abilogic/abi7-grid/issues with a minimal reproduction. For commercial support questions see https://abi7.com.
