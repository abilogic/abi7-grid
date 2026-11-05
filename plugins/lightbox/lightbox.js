/*!
 * @abi7/lightbox v1.0.0 - viewing an image on top of a grid.
 * (c) 2023-2026 Alexander Momot. All rights reserved.
 * ABI7 Grid Community Edition: free for NON-COMMERCIAL use only. Commercial use requires a paid license.
 * Licensed under the ABI7 Grid Community License (licenses/LICENSE-COMMUNITY.md). Purchase: https://abi7.com
 *
 * The plugin is completely independent of Core: only Plugin API and standard DOM.
 * All HTML is collected through createElement/textContent - post data does not end up in innerHTML.
 *
 *   grid.use(LightboxPlugin, { loop: true });
 *   grid.getPlugin('lightbox').open('photo-3');
 */

// Allow only safe URL schemes (copy of core logic: plugin does not depend on Core).
function safeUrl(value) {
  if (value == null) return '';
  const s = String(value).trim();
  const probe = s.replace(/[\u0000-\u0020\u007f]/g, '');
  if (!probe) return '';
  if (/^(https?:|blob:)/i.test(probe)) return s;
  if (/^data:image\/(png|jpe?g|gif|webp|avif|bmp|svg\+xml)[;,]/i.test(probe)) return s;
  if (/^[a-z][a-z0-9+.-]*:/i.test(probe)) return '';
  return s;
}

const read = (rec, f) => (typeof f === 'function' ? f(rec) : rec == null ? undefined : rec[f]);

export default {
  name: 'lightbox',
  version: '1.0.0',
  apiVersion: '^1.0.0',

  defaults: {
    loop: false, // jump to the end of the list
    closeOnBackdrop: true, // close by clicking on the background
    keyboard: true, // Escape, arrows, Home/End
    counter: true, // «3 / 120»
    animation: 220, // duration of appearance/closing, ms (0 - no animation)
    swipe: true, // swipe left/right on touch screens
    getSrc: null, // (record) => url of full-size image; default fields.src
    getCaption: null // (record) => signature line; default fields.title
  },

  install(api, options) {
    const doc = api.renderer.root().ownerDocument;
    const fields = api.options.get('fields');
    const srcOf = (rec) => safeUrl(options.getSrc ? options.getSrc(rec) : read(rec, fields.src));
    const captionOf = (rec) => {
      const c = options.getCaption ? options.getCaption(rec) : read(rec, fields.title);
      return c == null ? '' : String(c);
    };

    let ui = null; // { overlay, img, caption, counter, prev, next, close, ctl }
    let currentId = null;
    let closeTimer = 0;
    let previousFocus = null;

    const index = () => api.data.indexOf(currentId);

    const el = (tag, cls, text) => {
      const n = doc.createElement(tag);
      if (cls) n.className = cls;
      if (text != null) n.textContent = text;
      return n;
    };

    function build() {
      const overlay = el('div', 'abi7-lb');
      overlay.setAttribute('role', 'dialog');
      overlay.setAttribute('aria-modal', 'true');
      overlay.setAttribute('aria-label', 'Image viewer');
      overlay.style.setProperty('--abi7-lb-duration', options.animation + 'ms');
      const stage = el('div', 'abi7-lb-stage');
      const img = el('img', 'abi7-lb-img');
      img.draggable = false;
      img.alt = '';
      const caption = el('div', 'abi7-lb-caption');
      const counter = el('div', 'abi7-lb-counter');
      const mkBtn = (cls, label, glyph) => {
        const b = el('button', 'abi7-lb-btn ' + cls, glyph);
        b.type = 'button';
        b.setAttribute('aria-label', label);
        return b;
      };
      const prev = mkBtn('abi7-lb-prev', 'Previous', '\u2039');
      const next = mkBtn('abi7-lb-next', 'Next', '\u203A');
      const close = mkBtn('abi7-lb-close', 'Close', '\u00D7');
      stage.append(img, caption);
      overlay.append(stage, prev, next, close, counter);
      return { overlay, stage, img, caption, counter, prev, next, close, ctl: new AbortController() };
    }

    function show(id) {
      const rec = api.data.getById(id);
      const src = rec ? srcOf(rec) : '';
      if (!rec || !src) return false;
      const prevId = currentId;
      currentId = id;
      ui.overlay.classList.add('abi7-lb-loading');
      ui.overlay.classList.remove('abi7-lb-error');
      ui.img.onload = () => ui.overlay.classList.remove('abi7-lb-loading');
      ui.img.onerror = () => {
        ui.overlay.classList.remove('abi7-lb-loading');
        ui.overlay.classList.add('abi7-lb-error');
      };
      ui.img.src = src;
      ui.img.alt = captionOf(rec);
      ui.caption.textContent = captionOf(rec);
      ui.caption.hidden = !ui.caption.textContent;
      const i = index(), n = api.data.count();
      ui.counter.textContent = options.counter ? `${i + 1} / ${n}` : '';
      ui.prev.hidden = !options.loop && i <= 0;
      ui.next.hidden = !options.loop && i >= n - 1;
      if (prevId !== null && prevId !== id) api.events.emit('lightbox:change', { id, index: i, previousId: prevId });
      return true;
    }

    // Adjacent entry that has an image (entries without src are skipped).
    function neighbour(step) {
      const ids = api.data.ids();
      let i = index();
      for (let k = 0; k < ids.length; k++) {
        i += step;
        if (i < 0 || i >= ids.length) {
          if (!options.loop) return null;
          i = (i + ids.length) % ids.length;
        }
        const rec = api.data.getByIndex(i);
        if (rec && srcOf(rec)) return ids[i];
      }
      return null;
    }

    function go(step) {
      if (!ui) return false;
      const id = neighbour(step);
      return id !== null && id !== currentId ? show(id) : false;
    }

    function onKey(e) {
      if (!options.keyboard || !ui) return;
      const k = e.key;
      if (k === 'Escape') feature.close();
      else if (k === 'ArrowRight') go(1);
      else if (k === 'ArrowLeft') go(-1);
      else if (k === 'Home') { const ids = api.data.ids(); if (ids.length) show(ids[0]); }
      else if (k === 'End') { const ids = api.data.ids(); if (ids.length) show(ids[ids.length - 1]); }
      else if (k === 'Tab') { e.preventDefault(); ui.close.focus(); } // focus does not go under the overlay
      else return;
      if (k !== 'Tab') e.preventDefault();
    }

    const feature = {
      open(id) {
        if (!api.data.has(id)) return false;
        const rec = api.data.getById(id);
        if (!srcOf(rec)) return false;
        const ok = api.events.emitCancelable('lightbox:before-open', { id });
        if (!ok) return false;
        clearTimeout(closeTimer);
        if (!ui) {
          ui = build();
          const { signal } = ui.ctl;
          previousFocus = doc.activeElement;
          doc.body.appendChild(ui.overlay);
          doc.documentElement.classList.add('abi7-lb-lock');
          ui.close.addEventListener('click', () => feature.close(), { signal });
          ui.prev.addEventListener('click', () => go(-1), { signal });
          ui.next.addEventListener('click', () => go(1), { signal });
          ui.overlay.addEventListener('click', (e) => {
            if (options.closeOnBackdrop && (e.target === ui.overlay || e.target === ui.stage)) feature.close();
          }, { signal });
          doc.addEventListener('keydown', onKey, { signal });
          if (options.swipe) {
            let x0 = null;
            ui.stage.addEventListener('pointerdown', (e) => { if (e.pointerType !== 'mouse') x0 = e.clientX; }, { signal });
            ui.stage.addEventListener('pointerup', (e) => {
              if (x0 === null) return;
              const dx = e.clientX - x0;
              x0 = null;
              if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1);
            }, { signal });
            ui.stage.addEventListener('pointercancel', () => (x0 = null), { signal });
          }
          // The -open class is added on the next frame to trigger the CSS transition.
          (doc.defaultView || window).requestAnimationFrame(() => ui && ui.overlay.classList.add('abi7-lb-open'));
          ui.close.focus();
        }
        show(id);
        api.events.emit('lightbox:open', { id, index: index() });
        return true;
      },

      close(immediate = false) {
        if (!ui) return false;
        const closing = ui, id = currentId;
        ui = null;
        currentId = null;
        closing.ctl.abort(); // removes ALL handlers added when opening
        closing.overlay.classList.remove('abi7-lb-open');
        const finish = () => {
          closing.overlay.remove();
          doc.documentElement.classList.remove('abi7-lb-lock');
        };
        if (immediate || !options.animation) finish();
        else closeTimer = setTimeout(finish, options.animation + 30);
        if (previousFocus && previousFocus.focus) previousFocus.focus({ preventScroll: true });
        // We return the last viewed card to view.
        if (!immediate && id !== null && api.data.has(id)) api.viewport.scrollToItem(id, { align: 'nearest' });
        if (!immediate) api.events.emit('lightbox:close', { id });
        return true;
      },

      next: () => go(1),
      prev: () => go(-1),
      isOpen: () => !!ui,
      current: () => currentId
    };

    // Clicking on a card opens the view (unless another handler has canceled the click).
    api.events.on('item:click', (e) => {
      if (!e.defaultPrevented) feature.open(e.id);
    });
    // The data has changed - the view is no longer relevant.
    api.events.on('data:load-end', () => feature.close(true));
    api.events.on('item:remove', (e) => {
      if (currentId !== null && e.items.some((it) => it.id === currentId)) feature.close();
      else if (ui) show(currentId);
    });

    api.features.register('lightbox', feature);

    return () => {
      clearTimeout(closeTimer);
      feature.close(true);
    };
  }
};
