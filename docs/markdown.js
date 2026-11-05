// Mini Markdown renderer for documentation pages.
// Supports: headings, paragraphs, lists, tables, code blocks, inset quotes, links, **bold**, `code`
// and special directives:
//   :::demo <id> - live example + code viewer
//   :::method <signature> - method card (see parseCard)
//   :::event <name> - event card
// Raw HTML is NOT allowed in Markdown: all text is escaped.

import { esc, highlight } from './highlight.js';

export const slug = (s) => String(s).toLowerCase().replace(/<[^>]+>/g, '').replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-+|-+$/g, '');

export function inline(text) {
  const codes = [];
  let s = String(text).replace(/`([^`]+)`/g, (_, c) => `\u0000${codes.push(`<code>${esc(c)}</code>`) - 1}\u0000`);
  s = esc(s)
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, t, u) => {
      const safe = /^(#|https?:|\.\/|\.\.\/|[\w./-]+$)/.test(u) ? u : '#';
      return `<a href="${safe}"${/^https?:/.test(safe) ? ' target="_blank" rel="noopener"' : ''}>${t}</a>`;
    });
  // bare URLs (not already inside a markdown link) become links
  s = s.replace(/(^|[\s(])(https?:\/\/[^\s<)]+?)(?=[.,;:!?]*(?:\s|$|\)|<))/g, (_, pre, u) => `${pre}<a href="${u}" target="_blank" rel="noopener">${u}</a>`);
  return s.replace(/\u0000(\d+)\u0000/g, (_, i) => codes[i]);
}

export function codeBlock(code, lang = '') {
  const id = 'cb' + Math.random().toString(36).slice(2, 9);
  return (
    `<div class="codeblock" data-lang="${esc(lang)}"><div class="codeblock-bar"><span>${esc(lang || 'text')}</span>` +
    `<button type="button" class="copy-btn" data-copy="${id}">Copy</button></div>` +
    `<pre id="${id}"><code>${highlight(code.replace(/\n$/, ''), lang)}</code></pre></div>`
  );
}

function table(lines) {
  const cells = (l) => l.trim().replace(/^\||\|$/g, '').split(/(?<!\\)\|/).map((c) => c.trim().replace(/\\\|/g, '|'));
  const head = cells(lines[0]);
  const rows = lines.slice(2).map(cells);
  return `<div class="table-wrap"><table><thead><tr>${head.map((h) => `<th>${inline(h)}</th>`).join('')}</tr></thead><tbody>` +
    rows.map((r) => `<tr>${r.map((c) => `<td>${inline(c)}</td>`).join('')}</tr>`).join('') + `</tbody></table></div>`;
}

/** Parsing "card" (method/event): strings "key: value", multi-line values ​​continue until the next key. */
function parseCard(lines, keys) {
  const out = {};
  let cur = null;
  const re = new RegExp(`^(${keys.join('|')}):\\s?(.*)$`);
  for (const line of lines) {
    const m = re.exec(line);
    if (m) { cur = m[1]; out[cur] = m[2] ? [m[2]] : []; }
    else if (cur) out[cur].push(line);
  }
  for (const k of Object.keys(out)) out[k] = out[k].join('\n').replace(/^\n+|\n+$/g, '');
  return out;
}

const field = (label, html) => (html ? `<div class="card-field"><div class="card-label">${label}</div>${html}</div>` : '');
const para = (t) => (t ? t.split(/\n{2,}/).map((p) => `<p>${inline(p.replace(/\n/g, ' '))}</p>`).join('') : '');
const rowsTable = (head, text) => {
  const rows = text.split('\n').filter((l) => l.trim() && l.trim() !== '—').map((l) => l.split(/(?<!\\)\|/).map((c) => c.trim().replace(/\\\|/g, '|')));
  return rows.length ? `<div class="table-wrap"><table><thead><tr>${head.map((h) => `<th>${h}</th>`).join('')}</tr></thead><tbody>${rows.map((r) => `<tr>${head.map((_, i) => `<td>${inline(r[i] || '')}</td>`).join('')}</tr>`).join('')}</tbody></table></div>` : '';
};

function methodCard(title, lines) {
  const c = parseCard(lines, ['purpose', 'syntax', 'params', 'returns', 'inside', 'use', 'limits', 'errors', 'example', 'related']);
  const id = slug(title);
  return (
    `<section class="card" id="${id}"><h3><a class="anchor" href="#/api-methods/${id}">#</a><code>${esc(title)}</code></h3>` +
    field('Purpose', para(c.purpose)) +
    field('Syntax', c.syntax ? codeBlock(c.syntax, 'js') : '') +
    field('Options', c.params && c.params.trim() !== '—' ? rowsTable(['Parameter', 'Type', 'Default', 'Description'], c.params) : '<p class="muted">The method takes no arguments.</p>') +
    field('Returns', para(c.returns)) +
    field('What\'s going on inside', para(c.inside)) +
    field('When to use', para(c.use)) +
    field('Limitations', para(c.limits)) +
    field('Possible errors', para(c.errors)) +
    field('Example', c.example ? codeBlock(c.example, 'js') : '') +
    field('Related Methods and Events', para(c.related)) +
    `</section>`
  );
}

function eventCard(title, lines) {
  const c = parseCard(lines, ['purpose', 'when', 'order', 'payload', 'cancel', 'example', 'related']);
  const id = 'event-' + slug(title);
  return (
    `<section class="card" id="${id}"><h3><a class="anchor" href="#/api-events/${id}">#</a><code>${esc(title)}</code></h3>` +
    field('Purpose', para(c.purpose)) +
    field('The moment of challenge', para(c.when)) +
    field('Call order', para(c.order)) +
    field('callback arguments', c.payload && c.payload.trim() !== '—' ? rowsTable(['Field', 'Type', 'Description'], c.payload) : '<p class="muted">The event object contains only the <code>type</code> field.</p>') +
    field('Cancel action', para(c.cancel || 'The event is not cancelable.')) +
    field('Subscribe and unsubscribe', codeBlock(c.example || `const handler = (event) => console.log(event);\ngrid.on('${title}', handler);\n\n// unsubscribe\ngrid.off('${title}', handler);`, 'js')) +
    field('Related events', para(c.related)) +
    `</section>`
  );
}

function heroHtml() {
  return `<section class="hero"><div class="hero-badge">Community Edition · v1.0.0 · free for non-commercial use</div>` +
    `<h1>ABI7 Grid</h1><p class="hero-lead">A dependency-free JavaScript library for <b>masonry</b>, <b>grid</b> and <b>justified</b> layouts with virtualization, drag &amp; drop and a plugin system. Two source files: one JS, one CSS.</p>` +
    `<div class="hero-actions"><a class="btn primary" href="#/getting-started">Get started</a><a class="btn" href="#/examples">Live examples</a>` +
    `<a class="btn" href="https://github.com/abilogic/abi7-grid" target="_blank" rel="noopener">GitHub</a></div>` +
    `<div class="hero-cards"><div><b>Community</b><span>Free</span><small>Personal, non-commercial use. Learning, testing, experiments.</small></div>` +
    `<div><b>Single Developer</b><span>$29</span><small>One developer. Commercial and client projects. <a href="https://abi7.com" target="_blank" rel="noopener">abi7.com</a></small></div>` +
    `<div><b>Unlimited Developers</b><span>$199</span><small>One organization, any number of developers. <a href="https://abi7.com" target="_blank" rel="noopener">abi7.com</a></small></div></div></section>`;
}

export function renderMarkdown(src, { demo, file } = {}) {
  const lines = src.replace(/\r\n/g, '\n').split('\n');
  const html = [];
  const toc = [];
  let i = 0;
  const isBlockStart = (l) => /^(#{1,4}\s|```|:::|>\s?|\s*[-*]\s|\s*\d+\.\s|\|)/.test(l) || l.trim() === '---';
  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) { i++; continue; }
    let m;
    if ((m = /^```(\w*)\s*$/.exec(line))) {
      const buf = [];
      i++;
      while (i < lines.length && !/^```\s*$/.test(lines[i])) buf.push(lines[i++]);
      i++;
      if (m[1] === 'mermaid') {
        // Diagrams are drawn in the browser (see app.js renderMermaid); the source stays available below.
        html.push(`<div class="mermaid-wrap"><div class="mermaid" data-src="${esc(buf.join('\n'))}">Loading diagram…</div>` +
          `<details class="mermaid-src"><summary>Diagram source (Mermaid)</summary>${codeBlock(buf.join('\n'), 'mermaid')}</details></div>`);
      } else html.push(codeBlock(buf.join('\n'), m[1]));
    } else if ((m = /^:::(\w+)\s*(.*)$/.exec(line))) {
      const [, name, arg] = m;
      i++;
      if (name === 'hero') { html.push(heroHtml()); continue; }
      if (name === 'demo') { html.push(demo ? demo(arg.trim()) : ''); continue; }
      // :::file path - inserts the actual project file as a block of code (without copying the text into the documentation)
      if (name === 'file') { html.push(file ? file(arg.trim()) : ''); continue; }
      const buf = [];
      while (i < lines.length && lines[i].trim() !== ':::') buf.push(lines[i++]);
      i++;
      if (name === 'method' || name === 'event') {
        const card = name === 'method' ? methodCard(arg, buf) : eventCard(arg, buf);
        html.push(card);
        // cards go to the page table of contents (level 3)
        toc.push({ level: 3, id: /^<section class="card" id="([^"]+)"/.exec(card)[1], text: arg.replace(/\(.*$/, '') });
      }
      else if (name === 'note') html.push(`<div class="callout">${para(buf.join('\n'))}</div>`);
    } else if ((m = /^(#{1,4})\s+(.*)$/.exec(line))) {
      const level = m[1].length, text = m[2].trim(), id = slug(text);
      if (level === 2 || level === 3) toc.push({ level, id, text: text.replace(/`/g, '') });
      html.push(`<h${level} id="${id}">${level > 1 ? `<a class="anchor" href="#" data-anchor="${id}">#</a>` : ''}${inline(text)}</h${level}>`);
      i++;
    } else if (/^\|/.test(line) && /^\|?\s*:?-{2,}/.test(lines[i + 1] || '')) {
      const buf = [];
      while (i < lines.length && /^\|/.test(lines[i])) buf.push(lines[i++]);
      html.push(table(buf));
    } else if (/^>\s?/.test(line)) {
      const buf = [];
      while (i < lines.length && /^>\s?/.test(lines[i])) buf.push(lines[i++].replace(/^>\s?/, ''));
      html.push(`<div class="callout">${para(buf.join('\n'))}</div>`);
    } else if (/^\s*([-*]|\d+\.)\s/.test(line)) {
      const ordered = /^\s*\d+\./.test(line);
      const items = [];
      while (i < lines.length && /^\s*([-*]|\d+\.)\s/.test(lines[i])) {
        let t = lines[i++].replace(/^\s*([-*]|\d+\.)\s/, '');
        while (i < lines.length && /^\s{2,}\S/.test(lines[i]) && !/^\s*([-*]|\d+\.)\s/.test(lines[i])) t += ' ' + lines[i++].trim();
        items.push(`<li>${inline(t)}</li>`);
      }
      html.push(`<${ordered ? 'ol' : 'ul'}>${items.join('')}</${ordered ? 'ol' : 'ul'}>`);
    } else if (line.trim() === '---') {
      html.push('<hr>');
      i++;
    } else {
      const buf = [];
      while (i < lines.length && lines[i].trim() && !isBlockStart(lines[i])) buf.push(lines[i++]);
      if (!buf.length) { buf.push(lines[i++]); }
      html.push(`<p>${inline(buf.join(' '))}</p>`);
    }
  }
  return { html: html.join('\n'), toc };
}
