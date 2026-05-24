// Build pipeline for the wedding-invitation skill.
//
// Inputs:
//   data/wedding.json   — couple, date, venue, copy
//   data/designs.json   — array of designs (id, template, primary_photo, ...)
//   templates/*.html    — design templates (use {{path.to.value}} placeholders)
//   photos/*.{jpg,jpeg,png}  — user-provided photos
//
// Outputs:
//   dist/<design-id>.html  — one rendered HTML per design
//   dist/photos/*          — copied photo assets
//
// To produce PNGs + gallery, run `npm run render && npm run gallery` after
// building (or `npm run all` to do derive + build + render + gallery).

import fs from 'node:fs';
import path from 'node:path';
import { render } from './template-engine.js';

const ROOT = path.resolve(import.meta.dirname, '..');
const DATA_DIR = path.join(ROOT, 'data');
const TEMPLATES_DIR = path.join(ROOT, 'templates');
const PHOTOS_DIR = path.join(ROOT, 'photos');
const DIST_DIR = path.join(ROOT, 'dist');

function loadJson(file) {
  return JSON.parse(fs.readFileSync(path.join(DATA_DIR, file), 'utf8'));
}

const wedding = loadJson('wedding.json');
const designs = loadJson('designs.json');

if (!Array.isArray(designs) || designs.length === 0) {
  console.error('[build] designs.json must be a non-empty array');
  process.exit(1);
}

fs.mkdirSync(DIST_DIR, { recursive: true });
fs.mkdirSync(path.join(DIST_DIR, 'photos'), { recursive: true });

// Copy photos to dist so file:// preview can resolve /photos/<id>.{jpg,jpeg,png}
for (const f of fs.readdirSync(PHOTOS_DIR)) {
  if (/\.(jpg|jpeg|png)$/i.test(f)) {
    fs.copyFileSync(path.join(PHOTOS_DIR, f), path.join(DIST_DIR, 'photos', f));
  }
}

console.log(`[build] Rendering ${designs.length} design(s)…`);

for (const d of designs) {
  if (!d.primary_photo) {
    console.error(`[build] designs.json entry "${d.id}" missing primary_photo`);
    process.exit(1);
  }
  // Accept .jpg, .jpeg, .png — same as the copy filter above.
  const PHOTO_EXTS = ['.jpg', '.jpeg', '.png'];
  let photoExt = null;
  for (const ext of PHOTO_EXTS) {
    if (fs.existsSync(path.join(PHOTOS_DIR, `${d.primary_photo}${ext}`))) {
      photoExt = ext;
      break;
    }
  }
  if (!photoExt) {
    console.error(`[build] Photo not found: photos/${d.primary_photo}.{jpg,jpeg,png}`);
    console.error(`[build]   Referenced by designs.json entry "${d.id}".`);
    console.error(`[build]   Put the photo in photos/ named exactly "${d.primary_photo}" with one of: ${PHOTO_EXTS.join(', ')}.`);
    process.exit(1);
  }
  const tplPath = path.join(TEMPLATES_DIR, d.template);
  if (!fs.existsSync(tplPath)) {
    console.error(`[build] Template not found: ${tplPath}`);
    process.exit(1);
  }
  const tpl = fs.readFileSync(tplPath, 'utf8');

  // Build the design context that templates expect. Use a *relative* photo
  // path (no leading slash) so file:// preview can find photos/ next to the
  // HTML file — leading slash would resolve to the filesystem root.
  const designCtx = {
    id: d.id,
    name_zh: d.name_zh || '',
    name_en: d.name_en || '',
    primary_photo: d.primary_photo,
    primary_photo_url: `photos/${d.primary_photo}${photoExt}`,
    width: d.width || 420,
    height: d.height || 560
  };

  const ctx = { ...wedding, design: designCtx };
  const html = render(tpl, ctx);

  // Inject a frame that behaves differently for preview vs screenshot:
  //   - Browser preview (viewport ≥ 421 px wide): center the card on dark bg
  //   - Screenshot (Chrome --window-size=420,560): no centering, card sits
  //     at 0,0 so the PNG is the card exactly with zero bleed
  //
  // Also inject a tiny postMessage listener so the gallery's photo-switcher
  // can swap #main-photo without reloading the iframe. Templates that follow
  // design-principles.md will have <img id="main-photo">; if a template
  // doesn't, the listener is a no-op.
  const frameCss = `<style>
    html,body{margin:0;padding:0}
    body{background:transparent}
    body>.card,body .card{margin:0}
    @media (min-width: 421px){
      body{background:#222;display:flex;align-items:center;justify-content:center;min-height:100vh}
    }
  </style>
  <script>
    (function () {
      window.addEventListener('message', function (e) {
        var d = e && e.data;
        if (!d || d.type !== 'set-photo' || !d.url) return;
        var img = document.getElementById('main-photo');
        if (img) img.setAttribute('src', d.url);
      });
      // Tell the parent we're ready; parent may apply the user's last
      // selection immediately (so refreshing the detail page preserves it).
      try { parent.postMessage({ type: 'photo-iframe-ready', id: ${JSON.stringify(d.id)} }, '*'); } catch (_) {}
    })();
  </script></head>`;
  const framed = html.replace(/<\/head>/, frameCss);

  const outPath = path.join(DIST_DIR, `${d.id}.html`);
  fs.writeFileSync(outPath, framed);
  console.log(`[build]   ✓ dist/${d.id}.html`);
}

console.log('[build] Done. Open dist/<id>.html in a browser to preview.');
console.log('[build] Next: `npm run render` (PNGs) + `npm run gallery` (index.html).');
