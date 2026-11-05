#!/usr/bin/env node
/**
 * Building ABI7 Grid: node tools/build.js
 *
 *   src/abi7-grid.js → dist/abi7-grid.js (readable copy, no changes)
 *                     → dist/abi7-grid.min.js + abi7-grid.min.js.map  (esbuild, minify)
 *   src/abi7-grid.css → dist/abi7-grid.css (readable copy)
 *                     → dist/abi7-grid.min.css (esbuild, minify)
 *
 * Then dist/, plugins/ and examples/ are mirrored to public/ - Vite copies public/
 * into the final assembly of the documentation site, so the examples also work as standalone pages
 * (any static server is sufficient). The --no-site flag disables mirroring.
 *
 * esbuild is a build tool only. It does not get into the runtime code of the library.
 */
import { build } from 'esbuild';
import { copyFileSync, cpSync, existsSync, mkdirSync, readFileSync, rmSync, statSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const at = (...p) => join(root, ...p);
const dist = at('dist');
mkdirSync(dist, { recursive: true });

// 1. Readable versions are byte-by-byte copies of the source code (the code is written immediately in its final form, there is no transpilation).
copyFileSync(at('src/abi7-grid.js'), join(dist, 'abi7-grid.js'));
copyFileSync(at('src/abi7-grid.css'), join(dist, 'abi7-grid.css'));

// 2. Minification. legalComments:'inline' saves /* blocks! ... */ (authorship and license).
await build({
  entryPoints: [at('src/abi7-grid.js')],
  outfile: join(dist, 'abi7-grid.min.js'),
  format: 'esm',
  target: 'es2022',
  minify: true,
  sourcemap: 'external',
  legalComments: 'inline',
  bundle: false,
  logLevel: 'warning'
});
await build({
  entryPoints: [at('src/abi7-grid.css')],
  outfile: join(dist, 'abi7-grid.min.css'),
  minify: true,
  legalComments: 'inline',
  bundle: false,
  logLevel: 'warning'
});

// 3. Size report.
const kb = (n) => (n / 1024).toFixed(1) + ' KB';
console.log('ABI7 Grid build:');
for (const f of ['abi7-grid.js', 'abi7-grid.min.js', 'abi7-grid.min.js.map', 'abi7-grid.css', 'abi7-grid.min.css']) {
  const p = join(dist, f);
  const size = statSync(p).size;
  const gz = f.endsWith('.map') ? '' : `  (gzip ${kb(gzipSync(readFileSync(p)).length)})`;
  console.log(`  dist/${f.padEnd(22)} ${kb(size).padStart(9)}${gz}`);
}

// 4. Mirroring for the site.
if (!process.argv.includes('--no-site')) {
  for (const dir of ['dist', 'plugins', 'examples']) {
    const target = at('public', dir);
    rmSync(target, { recursive: true, force: true });
    if (existsSync(at(dir))) cpSync(at(dir), target, { recursive: true });
  }
  // Vite clears dist/ when building the site, and copies the contents of public/ back to the root dist/.
  // Therefore, the library files are additionally placed in the public/ root: after `npm run build`
  // in the final dist/ folder next to index.html there are abi7-grid.js, .min.js(.map), .css, .min.css.
  for (const f of ['abi7-grid.js', 'abi7-grid.min.js', 'abi7-grid.min.js.map', 'abi7-grid.css', 'abi7-grid.min.css']) {
    copyFileSync(join(dist, f), at('public', f));
  }
  console.log('  mirrored dist/, plugins/, examples/ → public/ (for documentation site)');
}
