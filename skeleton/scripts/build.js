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

  // Inject a frame that behaves differently for preview vs screenshot. The
  // signal is an explicit URL hash (#render), set by scripts/render.js when
  // capturing PNGs — NOT a viewport media query (those are unreliable at
  // high force-device-scale-factor, where Chrome's effective CSS viewport
  // can drift past 420 px and bake a centered-on-dark-bg layout into the
  // print PNG).
  //
  // Modes (decided synchronously in <head> before body paints):
  //   - Standalone preview in a browser tab (no hash, self === top):
  //       .preview-mode added → dark page bg, card centered.
  //   - Embedded in the gallery's <iframe> (self !== top):
  //       .preview-mode skipped → transparent body; the gallery's own
  //       .frame element handles framing.
  //   - PNG screenshot via render.js (hash === '#render'):
  //       .preview-mode skipped → transparent body, card at 0,0, zero bleed.
  //
  // Also inject the tweak-protocol postMessage listener. It handles:
  //   - set-photo       — swap #main-photo src (used by the photo switcher)
  //   - set-css-vars    — apply :root CSS variable overrides
  //   - set-font        — convenience alias of set-css-vars for one font var
  //   - toggle-component — show/hide elements by class (e.g. .lunar-date)
  //   - set-frame       — set --photo-radius and --photo-aspect
  //   - reset           — clear all overrides and unhide .hidden elements
  // Templates that follow design-principles.md use CSS variables for tweakable
  // properties and class hooks (.lunar-date, .tagline, ...) for optional
  // components. If a template doesn't declare any of these, the matching
  // messages are no-ops.
  const frameCss = `<script>
    (function () {
      // Add the dark "preview" frame only when this page is the top-level
      // tab being viewed standalone. Skip it for:
      //   - PNG screenshots (render.js loads the URL with #render)
      //   - Gallery iframe embeds (window.self !== window.top — the gallery's
      //     own frame styling does the centering)
      if (location.hash !== '#render' && window.self === window.top) {
        document.documentElement.classList.add('preview-mode');
      }
      var SAFE_ID = /^[a-zA-Z][a-zA-Z0-9-]*$/;
      window.addEventListener('message', function (e) {
        var d = e && e.data;
        if (!d || typeof d.type !== 'string') return;
        var root = document.documentElement;
        switch (d.type) {
          case 'set-photo': {
            if (!d.url) return;
            var img = document.getElementById('main-photo');
            if (img) img.setAttribute('src', d.url);
            return;
          }
          case 'set-css-vars': {
            if (!d.vars || typeof d.vars !== 'object') return;
            for (var k in d.vars) {
              if (!Object.prototype.hasOwnProperty.call(d.vars, k)) continue;
              if (k.indexOf('--') !== 0) continue;
              root.style.setProperty(k, String(d.vars[k]));
            }
            return;
          }
          case 'set-font': {
            if (typeof d.var !== 'string' || d.var.indexOf('--') !== 0) return;
            root.style.setProperty(d.var, String(d.value ?? ''));
            return;
          }
          case 'toggle-component': {
            if (!SAFE_ID.test(String(d.id || ''))) return;
            var els = document.querySelectorAll('.' + d.id);
            for (var i = 0; i < els.length; i++) {
              els[i].classList.toggle('hidden', d.visible === false);
            }
            return;
          }
          case 'set-frame': {
            if (typeof d.radius === 'string') root.style.setProperty('--photo-radius', d.radius);
            if (typeof d.aspect === 'string') root.style.setProperty('--photo-aspect', d.aspect);
            return;
          }
          case 'reset': {
            var s = root.style;
            for (var j = s.length - 1; j >= 0; j--) {
              var prop = s[j];
              if (prop && prop.indexOf('--') === 0) s.removeProperty(prop);
            }
            var hidden = document.querySelectorAll('.hidden');
            for (var h = 0; h < hidden.length; h++) hidden[h].classList.remove('hidden');
            return;
          }
        }
      });
      try { parent.postMessage({ type: 'photo-iframe-ready', id: ${JSON.stringify(d.id)} }, '*'); } catch (_) {}
    })();
  </script>
  <style>
    html,body{margin:0;padding:0}
    body{background:transparent}
    body>.card,body .card{margin:0}
    html.preview-mode body{
      background:#222;
      display:flex;
      align-items:center;
      justify-content:center;
      min-height:100vh;
    }
  </style></head>`;
  const framed = html.replace(/<\/head>/, frameCss);

  const outPath = path.join(DIST_DIR, `${d.id}.html`);
  fs.writeFileSync(outPath, framed);
  console.log(`[build]   ✓ dist/${d.id}.html`);
}

console.log('[build] Done. Open dist/<id>.html in a browser to preview.');
console.log('[build] Next: `npm run render` (PNGs) + `npm run gallery` (index.html).');
