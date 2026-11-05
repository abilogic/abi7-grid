/*!
 * @abi7/layout-horizontal v1.0.0 - horizontal ribbon for ABI7 Grid.
 * (c) 2023-2026 Alexander Momot. All rights reserved.
 * ABI7 Grid Community Edition: free for NON-COMMERCIAL use only. Commercial use requires a paid license.
 * Licensed under the ABI7 Grid Community License (licenses/LICENSE-COMMUNITY.md). Purchase: https://abi7.com
 *
 * Layout plugin: adds 'horizontal' layout algorithm. He is responsible ONLY for geometry:
 * virtualization, DOM and horizontal scrolling are done by Core.
 *
 *   ABI7Grid.registerLayout('horizontal', HorizontalLayout);   // globally
 *   grid.use(HorizontalLayout);                                // or for one grid
 */

// The definition of layout is the Layout API contract.
const horizontal = {
  name: 'horizontal',
  axis: 'x', // the main scroll axis is horizontal
  responsive: 'height', // rebuild when the HEIGHT of the container changes, the width of the layout is not interesting

  // Default values for grid options.layoutOptions.
  defaults: {
    height: 0, // ribbon height in px; 0 - according to the height of the container
    gap: 12, // distance between cards
    itemWidth: 0, // fixed card width; 0 — width = height × aspect ratio of the entry
    defaultAspect: 1.5, // if the entry has no dimensions
    align: 'start' // 'start' | 'center' - vertical alignment when height is less than container
  },

  create() {
    return {
      compute(ctx) {
        const o = ctx.options;
        const H = Math.max(1, Math.round(o.height > 0 ? o.height : ctx.height));
        const gap = o.gap > 0 ? o.gap : 0;
        const y = o.align === 'center' ? Math.max(0, Math.round((ctx.height - H) / 2)) : 0;

        // Partial recalculation: Core reports the index from which the geometry is obsolete (ctx.from).
        // Everything to the left remains the same - we continue from the right border of the previous card.
        let x = ctx.from > 0 ? ctx.rect(ctx.from - 1).right + gap : 0;
        for (let i = ctx.from; i < ctx.count; i++) {
          const aspect = ctx.aspect(i) || o.defaultAspect;
          const w = o.itemWidth > 0 ? Math.round(o.itemWidth) : Math.max(1, Math.round(H * aspect));
          ctx.set(i, x, y, w, H);
          x += w + gap;
        }
        return { width: ctx.count ? x - gap : 0, height: H, info: { itemHeight: H } };
      }
    };
  }
};

export default {
  name: 'layout-horizontal',
  version: '1.0.0',
  apiVersion: '^1.0.0',
  layout: horizontal, // the same field reads ABI7Grid.registerLayout(name, plugin)

  install(api) {
    // Registration at the level of one grid. Removed automatically upon unuse()/destroy().
    api.layouts.register('horizontal', horizontal);
  }
};
