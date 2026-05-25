// Stage 4 build: writes the preview + tweak surface.
//
//   node scripts/build-studio.js
//   npm run studio
//
// Outputs:
//   dist/index.html         — navigation gallery (live iframe previews, lazy-loaded; click → studio)
//   dist/<id>-studio.html   — per-design tweak studio (color/font/frame/component swaps)
//
// Run this WHEN the user is designing / tweaking. Pair with `npm run build`
// to refresh the raw <id>.html that the iframes embed. The final Stage-5
// deliverable (PNG downloads + final gallery + detail pages) comes from
// `npm run deliver` (= render + gallery).
//
// This file is intentionally thin — all the page builders live in
// build-gallery.js so the two scripts share helpers, CSS, COPY, etc.

import fs from 'node:fs';
import path from 'node:path';

import {
  designs,
  DIST_DIR,
  studioHtml,
  navGalleryHtml,
} from './build-gallery.js';

designs.forEach((d, i) => {
  fs.writeFileSync(path.join(DIST_DIR, `${d.id}-studio.html`), studioHtml(d, i));
  console.log(`[studio] → dist/${d.id}-studio.html`);
});

fs.writeFileSync(path.join(DIST_DIR, 'index.html'), navGalleryHtml());
console.log(`[studio] → dist/index.html (nav gallery, ${designs.length} design${designs.length > 1 ? 's' : ''})`);
console.log('[studio] Done. Open dist/index.html in a browser.');
