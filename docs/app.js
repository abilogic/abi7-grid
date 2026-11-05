// ABI7 Grid documentation site: router by hash (#/page/anchor), navigation, theme, code viewer.
// Pure JavaScript without frameworks. Pages are Markdown files from docs/pages.

import { renderMarkdown, codeBlock, slug } from './markdown.js';
import { demoHtml, mountDemos, restartDemo, postTheme } from './viewer.js';
import { getSource } from './vfs.js';

const pages = import.meta.glob('./pages/*.md', { query: '?raw', import: 'default', eager: true });
const pageSource = (name) => pages[`./pages/${name}.md`];

const NAV = [
  { group: 'Introduction', items: [['home', 'Home'], ['overview', 'Overview'], ['architecture', 'Architecture Overview']] },
  { group: 'Getting Started', items: [['installation', 'Installation'], ['getting-started', 'Quick Start']] },
  { group: 'Core Concepts', items: [['concepts', 'Core Concepts'], ['layouts', 'Layouts'], ['virtualization', 'Virtualization'], ['responsive', 'Responsive Behavior'], ['dynamic-content', 'Dynamic Content'], ['performance', 'Performance'], ['troubleshooting', 'Troubleshooting']] },
  { group: 'API Reference', items: [['api-options', 'Options'], ['api-methods', 'Methods'], ['api-events', 'Events'], ['callbacks', 'Callbacks'], ['api-plugin', 'Plugin API & Layout API']] },
  { group: 'Plugins', items: [['plugins', 'Bundled Plugins'], ['first-plugin', 'Building Your First Plugin'], ['plugin-development', 'Plugin Development Guide'], ['plugin-recipes', 'Plugin Examples']] },
  { group: 'Internals', items: [['internals', 'Internal Architecture']] },
  { group: 'Examples', items: [['examples', 'Core & Plugin Examples'], ['examples-basic', 'Basic Examples'], ['examples-advanced', 'Advanced Examples']] },
  { group: 'License', items: [['license', 'License Overview'], ['license-community', 'Community License'], ['license-single', 'Single Developer License'], ['license-unlimited', 'Unlimited Developers License'], ['license-faq', 'License FAQ'], ['license-third-party', 'Third-Party Notices'], ['license-copyright', 'Copyright'], ['license-trademark', 'Trademark']] }
];
const ORDER = NAV.flatMap((g) => g.items);
const TITLES = Object.fromEntries(ORDER);

const $ = (sel, root = document) => root.querySelector(sel);

let cleanup = null;
let currentPage = null;

const getTheme = () => document.documentElement.dataset.theme || 'light';
function setTheme(t) {
  document.documentElement.dataset.theme = t;
  try { localStorage.setItem('abi7-docs-theme', t); } catch (_) { /* private mode */ }
  postTheme(document, t);
}

function shell(root) {
  root.innerHTML =
    `<header class="topbar"><button id="menu" class="icon-btn" aria-label="Menu">☰</button>` +
    `<a class="brand" href="#/home">ABI7 <b>Grid</b></a><span class="ver">v1.0.0 Community</span>` +
    `<div class="search"><input id="search" type="search" placeholder="Search docs  ( / )" aria-label="Search documentation" autocomplete="off"><div id="search-results" class="search-results" hidden></div></div>` +
    `<span class="spacer"></span>` +
    `<a class="top-link" href="#/examples">Examples</a><a class="top-link" href="#/api-methods">API</a><a class="top-link" href="#/license">License</a>` +
    `<a class="top-link" href="https://github.com/abilogic/abi7-grid" target="_blank" rel="noopener">GitHub</a>` +
    `<a class="top-link buy" href="https://abi7.com" target="_blank" rel="noopener">Commercial license</a>` +
    `<button id="theme" class="icon-btn" aria-label="Toggle theme" title="Light / dark theme">◐</button></header>` +
    `<div class="layout"><nav id="nav" class="sidebar" aria-label="Sections"></nav>` +
    `<main id="content" class="content"></main><aside id="toc" class="toc" aria-label="On this page"></aside></div>`;
  $('#nav', root).innerHTML = NAV.map((g) => `<div class="nav-group"><div class="nav-title">${g.group}</div>${g.items.map(([id, t]) => `<a href="#/${id}" data-page="${id}">${t}</a>`).join('')}</div>`).join('') +
    `<div class="nav-promo">Need ABI7 Grid for commercial projects? <a href="https://abi7.com" target="_blank" rel="noopener">Get a commercial license at abi7.com</a></div>`;
}

// ---- Search: a small in-memory index built from the page sources (headings + text lines) ----
let searchIndex = null;
function buildIndex() {
  const out = [];
  for (const [id, title] of ORDER) {
    let src = pageSource(id) || '';
    src = src.replace(/^:::markdown (\S+)$/gm, (_, p) => getSource(p));
    let heading = title, anchor = '', inCode = false;
    out.push({ page: id, title, heading: title, anchor: '', text: '', weight: 6 });
    for (const line of src.split('\n')) {
      if (/^```/.test(line)) { inCode = !inCode; continue; }
      if (inCode) continue;
      const h = /^#{1,4}\s+(.*)$/.exec(line) || /^:::(?:method|event)\s+(.*)$/.exec(line);
      if (h) { heading = h[1].replace(/`/g, '').trim(); anchor = slug(heading); out.push({ page: id, title, heading, anchor, text: '', weight: 4 }); continue; }
      const t = line.replace(/[`*|>#:]/g, ' ').replace(/\s+/g, ' ').trim();
      if (t.length > 12) out.push({ page: id, title, heading, anchor, text: t, weight: 1 });
    }
  }
  return out;
}
function search(q) {
  const tokens = q.toLowerCase().split(/\s+/).filter(Boolean);
  if (!tokens.length) return [];
  searchIndex = searchIndex || buildIndex();
  const seen = new Map();
  for (const e of searchIndex) {
    const hay = (e.title + ' ' + e.heading + ' ' + e.text).toLowerCase();
    if (!tokens.every((t) => hay.includes(t))) continue;
    const key = e.page + '#' + e.anchor;
    const score = e.weight + (e.heading.toLowerCase().includes(tokens[0]) ? 3 : 0);
    const prev = seen.get(key);
    if (!prev || score > prev.score) seen.set(key, { ...e, score });
  }
  return [...seen.values()].sort((a, b) => b.score - a.score).slice(0, 10);
}
function renderResults(q) {
  const box = $('#search-results');
  const res = q.trim() ? search(q) : [];
  box.hidden = !q.trim();
  box.innerHTML = res.length
    ? res.map((r) => `<a href="#/${r.page}${r.anchor ? '/' + r.anchor : ''}"><b>${r.heading}</b><span>${r.title}${r.text ? ' — ' + r.text.slice(0, 90) : ''}</span></a>`).join('')
    : q.trim() ? '<div class="no-results">No results</div>' : '';
}

/** Diagrams are drawn by Mermaid, loaded from a CDN on demand. Offline, the diagram source stays visible. */
async function renderMermaid(root) {
  const nodes = root.querySelectorAll('.mermaid[data-src]');
  if (!nodes.length) return;
  try {
    const mod = await import(/* @vite-ignore */ 'https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs');
    const mermaid = mod.default;
    mermaid.initialize({ startOnLoad: false, theme: getTheme() === 'dark' ? 'dark' : 'default', securityLevel: 'strict' });
    let n = 0;
    for (const el of nodes) {
      try {
        const { svg } = await mermaid.render('mmd' + Date.now() + '-' + n++, el.dataset.src);
        el.innerHTML = svg;
        el.classList.add('rendered');
      } catch (_) { el.textContent = 'This diagram could not be rendered. See the source below.'; el.parentElement.querySelector('details').open = true; }
    }
  } catch (_) {
    nodes.forEach((el) => { el.textContent = 'The diagram renderer could not be loaded (offline?). The diagram source is shown below.'; el.parentElement.querySelector('details').open = true; });
  }
}

function parseHash() {
  const [, page, anchor] = location.hash.split('/');
  return { page: pageSource(page) !== undefined ? page : 'home', anchor: anchor ? decodeURIComponent(anchor) : '' };
}

function scrollToAnchor(anchor) {
  if (!anchor) return window.scrollTo(0, 0);
  const el = document.getElementById(anchor);
  if (el) el.scrollIntoView({ block: 'start' });
}

function route() {
  const { page, anchor } = parseHash();
  if (page === currentPage) return scrollToAnchor(anchor);
  currentPage = page;
  if (cleanup) cleanup();
  const content = $('#content');
  const raw = pageSource(page).replace(/^:::markdown (\S+)$/gm, (_, p) => getSource(p));
  const { html, toc } = renderMarkdown(raw, {
    demo: demoHtml,
    file: (path) => codeBlock(getSource(path), path.split('.').pop())
  });
  const idx = ORDER.findIndex(([id]) => id === page);
  const prev = ORDER[idx - 1], next = ORDER[idx + 1];
  const promo = page === 'home' ? '' : `<div class="promo">Need ABI7 Grid for commercial projects? <a href="https://abi7.com" target="_blank" rel="noopener">Get a commercial license at https://abi7.com</a></div>`;
  content.innerHTML = promo + html + promo.replace('class="promo"', 'class="promo bottom"') +
    `<nav class="pager">${prev ? `<a href="#/${prev[0]}">← ${prev[1]}</a>` : '<span></span>'}${next ? `<a href="#/${next[0]}">${next[1]} →</a>` : ''}</nav>`;
  document.title = `${TITLES[page]} — ABI7 Grid`;
  document.querySelectorAll('#nav a').forEach((a) => a.classList.toggle('active', a.dataset.page === page));
  $('#toc').innerHTML = toc.length ? `<div class="toc-title">On this page</div>` + toc.map((t) => `<a class="l${t.level}" href="#/${page}/${t.id}" data-id="${t.id}">${t.text}</a>`).join('') : '';
  document.body.classList.remove('nav-open');
  // nested sub-sections of the active page in the sidebar
  document.querySelectorAll('#nav .nav-sub').forEach((n) => n.remove());
  const active = $(`#nav a[data-page="${page}"]`);
  const subs = toc.filter((t) => t.level === 2).slice(0, 14);
  if (active && subs.length) active.insertAdjacentHTML('afterend', `<div class="nav-sub">${subs.map((t) => `<a href="#/${page}/${t.id}">${t.text}</a>`).join('')}</div>`);
  renderMermaid(content);
  const stop = mountDemos(content, getTheme);
  const spy = tocSpy();
  cleanup = () => { if (stop) stop(); if (spy) spy(); };
  scrollToAnchor(anchor);
}

function tocSpy() {
  if (!('IntersectionObserver' in window)) return null;
  const links = new Map([...document.querySelectorAll('#toc a')].map((a) => [a.dataset.id, a]));
  if (!links.size) return null;
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (e.isIntersecting) {
        links.forEach((a) => a.classList.remove('active'));
        const a = links.get(e.target.id);
        if (a) a.classList.add('active');
      }
    }
  }, { rootMargin: '-70px 0px -75% 0px' });
  links.forEach((_, id) => { const el = document.getElementById(id); if (el) io.observe(el); });
  return () => io.disconnect();
}

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
  } catch (_) {
    const ta = Object.assign(document.createElement('textarea'), { value: text });
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    ta.remove();
  }
}

function onClick(e) {
  const t = e.target.closest('button, a');
  if (!t) return;
  if (t.matches('.copy-btn')) {
    const pre = t.hasAttribute('data-copy-viewer') ? $('.viewer-panel.active pre', t.closest('.viewer')) : document.getElementById(t.dataset.copy);
    if (pre) copyText(pre.textContent).then(() => { t.textContent = 'Copied ✓'; setTimeout(() => (t.textContent = 'Copy'), 1400); });
  } else if (t.matches('.tab-btn')) {
    const v = t.closest('.viewer');
    v.querySelectorAll('.tab-btn').forEach((b) => b.classList.toggle('active', b === t));
    v.querySelectorAll('.viewer-panel').forEach((p) => p.classList.toggle('active', p.id === t.dataset.tab));
    $('.viewer-meta', v).textContent = document.getElementById(t.dataset.tab).dataset.lines + ' lines';
  } else if (t.matches('.expand-btn')) {
    const v = t.closest('.viewer');
    const collapsed = v.dataset.collapsed === 'true';
    v.dataset.collapsed = String(!collapsed);
    t.textContent = collapsed ? 'Collapse' : 'Expand';
  } else if (t.matches('.restart-btn')) restartDemo(t.dataset.demo, document);
  else if (t.matches('a.anchor[data-anchor]')) {
    e.preventDefault();
    location.hash = `#/${currentPage}/${t.dataset.anchor}`;
  }
}

export function bootDocs(root = document.getElementById('docs-root')) {
  let saved = null;
  try { saved = localStorage.getItem('abi7-docs-theme'); } catch (_) { /* ignore */ }
  document.documentElement.dataset.theme = saved || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  shell(root);
  $('#theme').onclick = () => setTheme(getTheme() === 'dark' ? 'light' : 'dark');
  $('#menu').onclick = () => document.body.classList.toggle('nav-open');
  const box = $('#search');
  box.addEventListener('input', () => renderResults(box.value));
  box.addEventListener('keydown', (e) => { if (e.key === 'Escape') { box.value = ''; renderResults(''); box.blur(); } });
  $('#search-results').addEventListener('click', () => { box.value = ''; renderResults(''); });
  document.addEventListener('keydown', (e) => { if (e.key === '/' && !/^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName)) { e.preventDefault(); box.focus(); } });
  document.addEventListener('click', onClick);
  window.addEventListener('hashchange', route);
  route();
}

export { getSource };
