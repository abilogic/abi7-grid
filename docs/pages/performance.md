# Performance

## How the layout engine works

1. Changes call `invalidate(from, reason)`. The lowest `from` wins; the pass runs in one `requestAnimationFrame`.
2. The layout computes rectangles **only from index `from`**. Masonry keeps a snapshot of column heights every 128 cards (`LAYOUT_CHECKPOINT`) so it can resume without recomputing from the start.
3. Rectangles go into typed arrays, and a spatial index (buckets of 512 px along the scroll axis) makes window queries cost O(k) in the number of visible cards.
4. The Virtualization Engine selects indexes for the window plus overscan, and the DOM Renderer mounts and unmounts the difference.

## Measuring performance

- `layout:end` reports `duration` (ms), `from`, `count` and `animated`.
- `grid.getState().virtualization` reports `mounted`, `pooled`, `created` and `reused`. A healthy long scroll shows `created` flat and `reused` growing.
- Use the browser's Performance panel for paint and style costs; the core does not collect frame statistics.

## Optimizing the DOM

- Keep cards small. The default card is one `<img>` and one caption.
- `renderItem` runs every time a node is bound to a record: update in place, do not create new subtrees every time, and clean up in `releaseItem`.
- Keep `virtualization.enabled: true` for more than a few hundred records.
- Give records `width`/`height`; avoid `measure: true` unless heights depend on content (each mounted card is observed).

## Minimizing reflow and repaint

- Cards move with `transform` (compositor-friendly) and have `contain: layout paint` in the stylesheet.
- Geometry is computed from data, so the core does not read layout from the DOM for every card.
- Animation is applied only during rearrangements (the root gets `abi7-animating` for the duration) and never during scrolling.
- Batch data changes: several `insert()` calls in one tick cost one layout pass. Prefer one `insert(array)` over a loop of single inserts.

## Large numbers of cards

The test suite runs 50,000 records. Only the visible window is in the DOM, and `scrollToIndex(25000)` does not create DOM for the cards in between. Remaining costs are O(n): changes near the start of the list recalculate geometry below them, and memory for the records and typed arrays. Return image URLs from `fields.src` as a getter so they are computed only for mounted cards.

:::demo virtualization

## Browser limits

Very tall content hits the browser's maximum element height (this differs between browsers). Not tested at that scale. Images decode and load according to the browser (`loading="lazy"`).

## Recommendations

1. Always provide record dimensions.
2. Keep `overscan` moderate; raise `poolSize` only if `created` keeps growing.
3. Disable animation for very large rearrangements (`animation: { enabled: false }` or `duration: 0`).
4. Batch updates; call `flush()` only when you need layout right now.
5. Remove plugins you do not use; each subscribes to events.
