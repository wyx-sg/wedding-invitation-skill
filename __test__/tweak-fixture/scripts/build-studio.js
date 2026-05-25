// Stage 4 build: writes the preview + tweak surface.
//
//   node scripts/build-studio.js
//   npm run studio
//
// Outputs:
//   dist/preview.html       — navigation gallery (live iframe previews, lazy-loaded; click → studio)
//   dist/<id>-studio.html   — per-design tweak studio (color/font/frame/component swaps)
//
// Run this WHEN the user is designing / tweaking. Pair with `npm run build`
// to refresh the raw <id>.html that the iframes embed. The final Stage-5
// deliverable (PNG downloads + final gallery + detail pages) comes from
// `npm run deliver` (= render + gallery) and writes to dist/index.html.
//
// Two separate files (preview.html vs index.html) so Stage 4 and Stage 5
// can co-exist on disk without overwriting each other — agent points the
// user at the right URL for the current phase.
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

fs.writeFileSync(path.join(DIST_DIR, 'preview.html'), navGalleryHtml());
console.log(`[studio] → dist/preview.html (nav gallery, ${designs.length} design${designs.length > 1 ? 's' : ''})`);
console.log('[studio] Done. Open dist/preview.html in a browser.');
