// Sync `__test__/tweak-fixture/scripts/` with `skeleton/scripts/`.
//
//   node scripts/sync-fixture.js
//
// Run this whenever you modify skeleton/scripts/*.js, before running the
// fixture's build to verify the change end-to-end. Without syncing, the
// fixture will use stale copies and tests may pass against old code.

import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const SRC = path.join(ROOT, 'skeleton', 'scripts');
const DESTS = [
  path.join(ROOT, '__test__', 'tweak-fixture', 'scripts'),
  path.join(ROOT, '__test__', 'tweak-fixture-single', 'scripts'),
];

let copied = 0;
for (const DST of DESTS) {
  if (!fs.existsSync(DST)) {
    console.warn(`[sync-fixture] Skipping missing dest: ${DST}`);
    continue;
  }
  for (const f of fs.readdirSync(SRC)) {
    if (!f.endsWith('.js')) continue;
    const a = path.join(SRC, f);
    const b = path.join(DST, f);
    fs.copyFileSync(a, b);
    copied++;
    console.log(`[sync-fixture] → ${path.relative(ROOT, b)}`);
  }
}
console.log(`[sync-fixture] Done. ${copied} script(s) copied.`);
