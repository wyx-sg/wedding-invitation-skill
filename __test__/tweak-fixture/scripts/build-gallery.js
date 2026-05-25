// Build a local gallery page (and per-design detail pages if multi-design)
// for the user's wedding invitation project.
//
//   node scripts/build-gallery.js
//
// Inputs:
//   data/wedding.json   — couple, language, etc.
//   data/designs.json   — design entries (with optional meta block)
//   dist/<id>.html      — rendered invitations (must be built first via build.js)
//   dist/png/social/*   — social PNGs (created by render.js)
//   dist/png/print/*    — print PNGs   (created by render.js)
//
// Outputs (single-design case, designs.length == 1):
//   dist/index.html     — the detail page (iframe + meta + download buttons)
//
// Outputs (multi-design case, designs.length > 1):
//   dist/index.html     — gallery grid (cards with thumbnails)
//   dist/<id>-page.html — detail page per design (with prev/next/back)
//
// Open dist/index.html in a browser to view + download.

import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const DATA_DIR = path.join(ROOT, 'data');
const DIST_DIR = path.join(ROOT, 'dist');
const DIST_PHOTOS_DIR = path.join(DIST_DIR, 'photos');

const wedding = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'wedding.json'), 'utf8'));
const designs = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'designs.json'), 'utf8'));

// Scan dist/photos for available images. The detail page renders a thumb
// strip so the user can preview the same design with different photos
// without rebuilding. Sorted lexically so p01..p20 render in order.
const PHOTO_RE = /\.(jpe?g|png)$/i;
const availablePhotos = (fs.existsSync(DIST_PHOTOS_DIR)
  ? fs.readdirSync(DIST_PHOTOS_DIR).filter(f => PHOTO_RE.test(f))
  : []
).sort();

if (!Array.isArray(designs) || designs.length === 0) {
  console.error('[gallery] designs.json must be a non-empty array');
  process.exit(1);
}

// Warn if rendered invitations or PNGs are missing — gallery will still write
// but the iframes / images will 404 in the browser.
const missing = { html: [], social: [], print: [] };
for (const d of designs) {
  if (!fs.existsSync(path.join(DIST_DIR, `${d.id}.html`))) missing.html.push(d.id);
  if (!fs.existsSync(path.join(DIST_DIR, 'png', 'social', `${d.id}.png`))) missing.social.push(d.id);
  if (!fs.existsSync(path.join(DIST_DIR, 'png', 'print', `${d.id}.png`))) missing.print.push(d.id);
}
if (missing.html.length || missing.social.length || missing.print.length) {
  console.warn('[gallery] Some source files are missing. The gallery will still build,');
  console.warn('[gallery] but iframes / images may 404 until you run:');
  console.warn('[gallery]   npm run build    # produces dist/<id>.html');
  console.warn('[gallery]   npm run render   # produces dist/png/{social,print}/<id>.png\n');
  if (missing.html.length)   console.warn(`[gallery]   missing dist/<id>.html:           ${missing.html.join(', ')}`);
  if (missing.social.length) console.warn(`[gallery]   missing dist/png/social/<id>.png: ${missing.social.join(', ')}`);
  if (missing.print.length)  console.warn(`[gallery]   missing dist/png/print/<id>.png:  ${missing.print.join(', ')}`);
}

// Font names land in inline style="font-family:'…'" — strip any characters that
// could break out of the quoted string or inject CSS. Allows ASCII alphanumerics,
// whitespace, hyphen, dot, underscore, and any non-ASCII character (covering
// CJK font names like "Noto Serif SC", "ZCOOL XiaoWei", "Source Han Serif").
function safeFontName(s) {
  return String(s ?? '').replace(/[^\w\s\-. \xa0-￿]/g, '');
}

// HTML-escape arbitrary user strings (names, meta text, ids) before interpolating
// into the generated gallery markup. A wedding could have couples like "Tom & Jerry"
// or design ids with characters that would break the HTML otherwise.
function esc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// --- localization ---
// Use first language in wedding.json as primary; fall back to English.
const langs = Array.isArray(wedding.languages) ? wedding.languages : ['en'];
const lang = langs[0] === 'zh' ? 'zh' : 'en';
const COPY = {
  en: {
    brand: 'Wedding Invitation',
    pageTitle: 'My Wedding Invitation',
    paletteLabel: 'Palette',
    fontsLabel: 'Typography',
    motifsLabel: 'Decorative Motifs',
    downloadGroupLabel: 'Download',
    downloadSocialLabel: 'Social',
    downloadSocialHint: '1080 × 1440 · messaging, email',
    downloadPrintLabel: 'Print',
    downloadPrintHint: '2160 × 2880 · 300 DPI for printing',
    backToGallery: 'All Designs',
    prevLabel: 'Previous',
    nextLabel: 'Next',
    photoSwitcherLabel: 'Photo',
    photoSwitcherAria: id => `Switch to photo ${id}`,
    zoomOutLabel: 'Zoom out',
    zoomInLabel: 'Zoom in',
    zoomResetLabel: 'Fit to screen',
    multiTagline: 'Generated alternatives — pick a favorite and download.',
    tweakColorLabel: 'Color',
    tweakFontLabel: 'Typography',
    tweakFrameLabel: 'Photo frame',
    tweakComponentsLabel: 'Show / hide',
    tweakResetLabel: 'Reset',
    tweakHeadlineSub: 'Headline',
    tweakBodySub: 'Body',
    poweredByLabel: 'Made with',
    poweredBySuffix: '',
  },
  zh: {
    brand: '婚礼请帖',
    pageTitle: '我的婚礼请帖',
    paletteLabel: '配色',
    fontsLabel: '字体',
    motifsLabel: '装饰元素',
    downloadGroupLabel: '下载',
    downloadSocialLabel: '社交版',
    downloadSocialHint: '1080 × 1440 · 微信 / 邮件',
    downloadPrintLabel: '印刷版',
    downloadPrintHint: '2160 × 2880 · 300 DPI 印刷',
    backToGallery: '所有设计',
    prevLabel: '上一个',
    nextLabel: '下一个',
    photoSwitcherLabel: '换照片',
    photoSwitcherAria: id => `切换到照片 ${id}`,
    zoomOutLabel: '缩小',
    zoomInLabel: '放大',
    zoomResetLabel: '适应屏幕',
    multiTagline: '生成的几个备选方案 — 挑一个你最喜欢的下载。',
    tweakColorLabel: '配色',
    tweakFontLabel: '字体',
    tweakFrameLabel: '照片框',
    tweakComponentsLabel: '显示 / 隐藏',
    tweakResetLabel: '重置',
    tweakHeadlineSub: '标题字体',
    tweakBodySub: '正文字体',
    poweredByLabel: '由',
    poweredBySuffix: ' 设计制作',
  }
}[lang];

const SHARED_CSS = `
  :root {
    --bg: #0a0907;
    --bg-card: #14110d;
    --bg-elevated: #1c1812;
    --text: #d4c4a8;
    --text-dim: #8a7a5e;
    --text-muted: #5a4a36;
    --accent: #d4b896;
    --accent-warm: #b8956a;
    --border: #2a2218;
    --border-soft: #1f1a14;
  }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    background: var(--bg);
    color: var(--text);
    font-family: 'Inter', -apple-system, "Noto Serif SC", "PingFang SC", sans-serif;
    line-height: 1.6;
    min-height: 100vh;
  }
  a { color: inherit; }
  .nav-bar {
    border-bottom: 1px solid var(--border-soft);
    background: rgba(10, 9, 7, 0.92);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    position: sticky; top: 0; z-index: 50;
  }
  .nav-bar .inner {
    max-width: 1400px;
    margin: 0 auto;
    padding: 16px 32px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 24px;
  }
  .nav-brand {
    font-family: 'Cormorant Garamond', serif;
    font-style: italic;
    font-size: 18px;
    letter-spacing: 3px;
    color: var(--accent);
    text-decoration: none;
    text-transform: uppercase;
  }
  .nav-back {
    font-size: 12px;
    letter-spacing: 3px;
    text-transform: uppercase;
    color: var(--text-dim);
    text-decoration: none;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    transition: color 0.2s;
  }
  .nav-back:hover { color: var(--accent); }
`;

const GALLERY_CSS = `
  ${SHARED_CSS}
  header.hero {
    max-width: 1280px;
    margin: 0 auto;
    padding: 28px 32px 16px;
    text-align: center;
  }
  h1 {
    font-family: 'Cormorant Garamond', serif;
    font-weight: 300;
    font-size: 36px;
    letter-spacing: 4px;
    margin: 0 0 8px;
    color: var(--accent);
    text-transform: uppercase;
  }
  .tagline {
    font-family: 'Cormorant Garamond', 'Noto Serif SC', serif;
    font-style: italic;
    font-size: 14px;
    color: #a89878;
    margin: 0 auto 8px;
    max-width: 540px;
    line-height: 1.5;
  }
  main {
    max-width: 1680px;
    margin: 0 auto;
    padding: 32px 40px 64px;
  }
  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, 280px);
    gap: 28px;
    justify-content: center;
  }
  .card {
    background: var(--bg-card);
    border-radius: 6px;
    overflow: hidden;
    text-decoration: none;
    color: inherit;
    transition: transform 0.25s, box-shadow 0.25s, border-color 0.2s;
    display: block;
    border: 1px solid transparent;
  }
  .card:hover {
    transform: translateY(-6px);
    box-shadow: 0 24px 40px rgba(0, 0, 0, 0.7);
    border-color: var(--accent-warm);
  }
  .thumb { aspect-ratio: 3 / 4; overflow: hidden; background: #000; }
  .thumb img { width: 100%; height: 100%; object-fit: cover; display: block; }
  .meta { padding: 16px 20px 20px; }
  .name {
    font-family: 'Cormorant Garamond', serif;
    font-style: italic;
    font-size: 19px;
    color: var(--accent);
    letter-spacing: 1px;
  }
  .desc {
    font-size: 12px;
    color: var(--text-dim);
    margin-top: 3px;
    letter-spacing: 0.5px;
  }
  @media (max-width: 600px) {
    h1 { font-size: 28px; letter-spacing: 3px; }
    .grid { grid-template-columns: 1fr; max-width: 360px; gap: 18px; }
    main { padding: 20px 16px 40px; }
  }
  .powered-by {
    text-align: center;
    padding: 24px 16px;
    font-size: 10px;
    letter-spacing: 1.5px;
    color: var(--text-muted);
    opacity: 0.7;
    font-family: 'Inter', sans-serif;
  }
  .powered-by a {
    color: var(--text-dim);
    text-decoration: none;
    border-bottom: 1px dotted var(--border-soft);
    transition: color 0.18s, border-color 0.18s;
  }
  .powered-by a:hover {
    color: var(--accent);
    border-bottom-color: var(--accent);
  }
`;

const DETAIL_CSS = `
  ${SHARED_CSS}
  html, body { height: auto; }
  body {
    display: flex;
    flex-direction: column;
    min-height: 100vh;
    overflow-x: hidden;
    background: radial-gradient(ellipse at top, #110d08 0%, var(--bg) 60%);
  }
  .nav-bar { flex: 0 0 auto; }

  main.detail {
    flex: 0 0 auto;
    min-height: calc(100vh - 56px);
    width: 100%;
    margin: 0 auto;
    padding: 24px 40px 32px;
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 56px;
    box-sizing: border-box;
  }
  .preview {
    flex: 0 0 auto;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 16px;
    position: relative;
  }
  .photo-switcher {
    display: flex;
    align-items: center;
    gap: 12px;
    width: calc(var(--tpl-w) * var(--iframe-scale));
    max-width: 100%;
  }
  .photo-switcher-label {
    font-size: 9px;
    letter-spacing: 3px;
    text-transform: uppercase;
    color: var(--text-muted);
    flex-shrink: 0;
  }
  .photo-switcher-thumbs {
    display: flex;
    gap: 8px;
    flex: 1;
    overflow-x: auto;
    scroll-behavior: smooth;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: thin;
    scrollbar-color: rgba(212,184,150,0.35) transparent;
    padding: 2px 1px;
  }
  .photo-switcher-thumbs::-webkit-scrollbar { height: 3px; }
  .photo-switcher-thumbs::-webkit-scrollbar-thumb { background: rgba(212,184,150,0.35); border-radius: 2px; }
  .photo-switcher-thumbs::-webkit-scrollbar-track { background: transparent; }
  .photo-switcher-thumbs button {
    width: 38px;
    height: 38px;
    flex: 0 0 auto;
    padding: 0;
    border: 1.5px solid transparent;
    border-radius: 3px;
    background: var(--bg-elevated);
    cursor: pointer;
    overflow: hidden;
    transition: border-color 0.18s, transform 0.15s;
  }
  .photo-switcher-thumbs button:hover { transform: translateY(-1px); }
  .photo-switcher-thumbs button.active { border-color: var(--accent); }
  .photo-switcher-thumbs button img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: center 22%;
    display: block;
    pointer-events: none;
  }
  /* Zoom controls (PC only).
     The hover-zone is the bottom strip of the card itself (last ~64px),
     positioned inside .frame so it's always accessible regardless of
     viewport size. Hovering the top/middle of the card does NOT show
     controls; only when the cursor enters the bottom strip near where
     they render. Semi-transparent when shown so the design behind
     isn't obscured; direct hover bumps opacity higher. */
  .zoom-zone {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 64px;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10;
  }
  .zoom-controls {
    display: flex;
    gap: 2px;
    padding: 4px;
    background: rgba(14, 11, 7, 0.72);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    border: 1px solid rgba(42, 34, 24, 0.6);
    border-radius: 999px;
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.2s;
  }
  .zoom-zone:hover .zoom-controls,
  .zoom-controls:focus-within {
    opacity: 0.55;
    pointer-events: auto;
  }
  .zoom-controls:hover {
    opacity: 0.95;
  }
  .zoom-btn {
    width: 30px;
    height: 30px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 0;
    background: transparent;
    color: var(--accent);
    font-family: 'Inter', system-ui, sans-serif;
    font-size: 18px;
    line-height: 1;
    cursor: pointer;
    border-radius: 5px;
    transition: background 0.15s, color 0.15s;
    padding: 0;
  }
  .zoom-btn:hover { background: rgba(212, 184, 150, 0.12); color: #f0d8b0; }
  .zoom-btn:active { background: rgba(212, 184, 150, 0.2); }
  .zoom-btn.reset { font-size: 14px; }
  .zoom-level {
    display: flex;
    align-items: center;
    padding: 0 8px;
    font-family: 'Inter', system-ui, sans-serif;
    font-size: 11px;
    color: var(--text-dim);
    letter-spacing: 1px;
    min-width: 42px;
    justify-content: center;
  }
  @media (max-width: 960px) {
    .zoom-zone { display: none; }
  }
  .preview .frame {
    width: calc(var(--tpl-w) * var(--iframe-scale));
    height: calc(var(--tpl-h) * var(--iframe-scale));
    overflow: hidden;
    border-radius: 3px;
    background: #fff;
    box-shadow: 0 40px 90px -20px rgba(0,0,0,0.85), 0 0 0 1px rgba(212,184,150,0.08);
  }
  .preview .frame iframe {
    width: var(--tpl-w);
    height: var(--tpl-h);
    transform: scale(var(--iframe-scale));
    transform-origin: top left;
    border: 0;
    display: block;
  }

  .detail-info {
    flex: 0 0 480px;
    max-width: 480px;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 22px;
  }

  .style-name {
    font-family: 'Cormorant Garamond', serif;
    font-weight: 300;
    font-size: 44px;
    letter-spacing: 1px;
    color: var(--accent);
    line-height: 1;
    margin: 0 0 8px;
  }
  .style-short {
    font-family: 'Cormorant Garamond', 'Noto Serif SC', serif;
    font-style: italic;
    font-size: 16px;
    color: #b9a47f;
  }
  .style-long {
    font-family: 'Cormorant Garamond', 'Noto Serif SC', serif;
    font-size: 15px;
    line-height: 1.75;
    color: var(--text);
    font-style: italic;
    text-wrap: balance;
    overflow-wrap: anywhere;
    margin: 0;
  }
  @media (max-width: 960px) {
    main.detail {
      flex-direction: column;
      align-items: center;
      padding: 20px 16px 48px;
      gap: 28px;
      min-height: auto;
    }
    .preview { width: 100%; }
    .detail-info { flex: 0 0 auto; max-width: 560px; width: 100%; gap: 20px; }
    .style-name { font-size: 32px; letter-spacing: 1px; }
  }
  .tweak-panel {
    display: flex;
    flex-direction: column;
    gap: 18px;
    padding: 18px 0;
  }
  .tweak-group { display: flex; flex-direction: column; gap: 8px; }
  .tweak-group-label {
    font-size: 9.5px;
    letter-spacing: 3.5px;
    text-transform: uppercase;
    color: var(--text-muted);
  }
  .tweak-row {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    align-items: center;
  }
  .tweak-swatch {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 4px 10px 4px 4px;
    background: var(--bg-elevated);
    border: 1.5px solid transparent;
    border-radius: 999px;
    cursor: pointer;
    transition: border-color 0.18s, transform 0.12s;
    font-family: 'Inter', sans-serif;
    font-size: 11px;
    color: var(--text-dim);
    letter-spacing: 0.5px;
  }
  .tweak-swatch:hover { transform: translateY(-1px); }
  .tweak-swatch.active { border-color: var(--accent); color: var(--text); }
  .tweak-swatch .dot-stack {
    display: inline-flex;
    gap: 2px;
  }
  .tweak-swatch .dot {
    width: 14px; height: 14px; border-radius: 50%;
    border: 1px solid rgba(0,0,0,0.12);
  }
  .tweak-font-btn,
  .tweak-frame-btn,
  .tweak-reset-btn {
    padding: 6px 12px;
    background: var(--bg-elevated);
    border: 1.5px solid transparent;
    border-radius: 4px;
    cursor: pointer;
    font-size: 12px;
    color: var(--text-dim);
    transition: border-color 0.18s, color 0.18s, transform 0.12s;
    letter-spacing: 0.5px;
  }
  .tweak-font-btn:hover,
  .tweak-frame-btn:hover { transform: translateY(-1px); color: var(--text); }
  .tweak-font-btn.active,
  .tweak-frame-btn.active { border-color: var(--accent); color: var(--accent); }
  .tweak-checkbox {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 6px 10px;
    background: var(--bg-elevated);
    border: 1.5px solid transparent;
    border-radius: 4px;
    cursor: pointer;
    font-size: 12px;
    color: var(--text-dim);
    transition: border-color 0.18s, color 0.18s;
  }
  .tweak-checkbox:hover { color: var(--text); }
  .tweak-checkbox input {
    margin: 0;
    accent-color: var(--accent);
  }
  .tweak-checkbox.checked { color: var(--text); border-color: rgba(212,184,150,0.3); }
  .tweak-font-sub {
    font-size: 9px;
    letter-spacing: 2.5px;
    text-transform: uppercase;
    color: var(--text-muted);
    flex-basis: 100%;
    margin-bottom: -2px;
  }
  .tweak-reset {
    align-self: flex-end;
    margin-top: -4px;
  }
  .tweak-reset-btn {
    color: var(--text-muted);
    font-size: 11px;
    letter-spacing: 1px;
  }
  .tweak-reset-btn:hover {
    color: var(--accent);
    border-color: var(--border);
  }
  .powered-by {
    text-align: center;
    padding: 24px 16px;
    font-size: 10px;
    letter-spacing: 1.5px;
    color: var(--text-muted);
    opacity: 0.7;
    font-family: 'Inter', sans-serif;
  }
  .powered-by a {
    color: var(--text-dim);
    text-decoration: none;
    border-bottom: 1px dotted var(--border-soft);
    transition: color 0.18s, border-color 0.18s;
  }
  .powered-by a:hover {
    color: var(--accent);
    border-bottom-color: var(--accent);
  }
`;

// --- detail page ---

function detailHtml(design, index, isMulti) {
  const meta = design.meta || {};
  // Hex color is a controlled value; light-validate to avoid CSS injection.
  const safeColor = c => /^#?[0-9a-fA-F]{3,8}$/.test(String(c).replace('#', '')) ? c : '#888';
  const tplH = design.height || 560;
  const tplW = design.width || 420;

  // Photo switcher: render only when there are 2+ photos to switch between.
  // Single-photo projects don't need the strip.
  const primaryPhotoName = design.primary_photo;
  const photoThumbs = availablePhotos.map(file => {
    const photoId = file.replace(PHOTO_RE, '');
    const isActive = photoId === primaryPhotoName;
    const cls = isActive ? ' class="active"' : '';
    return `<button type="button"${cls} data-photo-url="photos/${esc(file)}" data-photo-id="${esc(photoId)}" aria-label="${esc(COPY.photoSwitcherAria(photoId))}"><img src="photos/${esc(file)}" alt="" loading="lazy"></button>`;
  }).join('');
  const switcherHtml = availablePhotos.length >= 2 ? `
    <div class="photo-switcher">
      <span class="photo-switcher-label">${esc(COPY.photoSwitcherLabel)}</span>
      <div class="photo-switcher-thumbs" id="photo-switcher-thumbs">${photoThumbs}</div>
    </div>` : '';

  const designName = (lang === 'zh' ? design.name_zh : design.name_en) || design.id;

  // Tweak panel — render only when design declares tweak_options.
  // Each section is omitted if the design didn't declare it.
  const tweak = design.tweak_options || null;
  const longHtml = meta.long ? `<p class="style-long">${esc(meta.long)}</p>` : '';
  let tweakHtml = '';
  let tweakConfigJson = 'null';
  if (tweak) {
    const sections = [];

    // Colors
    if (Array.isArray(tweak.color_schemes) && tweak.color_schemes.length) {
      const swatches = tweak.color_schemes.map((cs, i) => {
        const name = (lang === 'zh' ? cs.name_zh : cs.name_en) || cs.name || `#${i + 1}`;
        const dots = Object.values(cs.vars || {}).slice(0, 4)
          .map(v => `<span class="dot" style="background:${safeColor(v)}"></span>`).join('');
        const activeClass = i === 0 ? ' active' : '';
        return `<button type="button" class="tweak-swatch${activeClass}" data-tweak-color="${i}">
          <span class="dot-stack">${dots}</span>
          <span>${esc(name)}</span>
        </button>`;
      }).join('');

      sections.push(`<div class="tweak-group" data-section="color">
        <div class="tweak-group-label">${esc(COPY.tweakColorLabel)}</div>
        <div class="tweak-row">${swatches}</div>
      </div>`);
    }

    // Fonts (one row per font variable)
    if (tweak.fonts && typeof tweak.fonts === 'object') {
      const fontRows = Object.entries(tweak.fonts).map(([cssVar, options]) => {
        const subLabel = cssVar === '--font-headline' ? COPY.tweakHeadlineSub
                       : cssVar === '--font-body'     ? COPY.tweakBodySub
                       : cssVar;
        const buttons = (Array.isArray(options) ? options : []).map((font, i) => {
          const activeClass = i === 0 ? ' active' : '';
          return `<button type="button" class="tweak-font-btn${activeClass}" data-tweak-font-var="${esc(cssVar)}" data-tweak-font-value="${esc(font)}" style="font-family:'${safeFontName(font)}',sans-serif">${esc(font)}</button>`;
        }).join('');
        return `<div class="tweak-row">
          <div class="tweak-font-sub">${esc(subLabel)}</div>
          ${buttons}
        </div>`;
      }).join('');

      sections.push(`<div class="tweak-group" data-section="fonts">
        <div class="tweak-group-label">${esc(COPY.tweakFontLabel)}</div>
        ${fontRows}
      </div>`);
    }

    // Frames
    if (Array.isArray(tweak.frames) && tweak.frames.length) {
      const frameButtons = tweak.frames.map((f, i) => {
        const activeClass = i === 0 ? ' active' : '';
        return `<button type="button" class="tweak-frame-btn${activeClass}" data-tweak-frame="${i}">${esc(f.name || `#${i+1}`)}</button>`;
      }).join('');

      sections.push(`<div class="tweak-group" data-section="frame">
        <div class="tweak-group-label">${esc(COPY.tweakFrameLabel)}</div>
        <div class="tweak-row">${frameButtons}</div>
      </div>`);
    }

    // Components
    if (Array.isArray(tweak.components) && tweak.components.length) {
      const checkboxes = tweak.components.map(c => {
        const label = (lang === 'zh' ? c.label_zh : c.label_en) || c.label || c.id;
        const stateAttr = c.default ? ' checked' : '';
        return `<label class="tweak-checkbox${stateAttr}" data-tweak-component="${esc(c.id)}">
          <input type="checkbox"${stateAttr}>
          <span>${esc(label)}</span>
        </label>`;
      }).join('');
      sections.push(`<div class="tweak-group" data-section="components">
        <div class="tweak-group-label">${esc(COPY.tweakComponentsLabel)}</div>
        <div class="tweak-row">${checkboxes}</div>
      </div>`);
    }

    // Save / Export / Reset — only rendered when at least one section exists
    if (sections.length > 0) {
      sections.push(`<div class="tweak-row tweak-reset">
        <button type="button" class="tweak-reset-btn" id="tweak-reset">↻ ${esc(COPY.tweakResetLabel)}</button>
      </div>`);
      tweakHtml = `<div class="tweak-panel" id="tweak-panel" data-design-id="${esc(design.id)}">${sections.join('')}</div>`;
      const tweakConfigShape = {
        tweak: tweak,
        design: {
          id: design.id,
          template: design.template || (design.id + '.html'),
          primary_photo: design.primary_photo,
          width: design.width || 420,
          height: design.height || 560
        }
      };
      tweakConfigJson = JSON.stringify(tweakConfigShape)
        .replace(/</g, '\\u003c')
        .replace(/>/g, '\\u003e')
        .replace(/&/g, '\\u0026');
    }
  }

  return `<!DOCTYPE html>
<html lang="${lang === 'zh' ? 'zh-CN' : 'en'}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${esc(designName)}</title>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300&family=Inter:wght@300;400;500&family=Noto+Serif+SC:wght@400;500&display=swap">
  <style>
    :root {
      --tpl-w: ${tplW}px;
      --tpl-h: ${tplH}px;
      --iframe-scale-auto: 1;
      --iframe-scale-default: 1;
      --iframe-scale: var(--iframe-scale-override, var(--iframe-scale-default));
    }
  </style>
  <script>
    (function () {
      const TPL_H = ${tplH};
      const TPL_W = ${tplW};
      function compute() {
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        let auto, def;
        if (matchMedia('(max-width: 960px)').matches) {
          auto = Math.min(1, (vw - 48) / TPL_W);
          def = auto;
        } else {
          const byW = (vw - 616) / TPL_W;
          const byH = (vh - 108) / TPL_H;
          auto = Math.max(0.9, Math.min(byW, byH, 2.5));
          def = auto * 0.87;
        }
        const r = document.documentElement;
        r.style.setProperty('--iframe-scale-auto', String(auto));
        r.style.setProperty('--iframe-scale-default', String(def));
      }
      compute();
      window.addEventListener('resize', compute);
    })();
  </script>
  <style>${DETAIL_CSS}</style>
  <script>window.__TWEAK_CONFIG__ = ${tweakConfigJson};</script>
</head>
<body>
  <main class="detail">
    <div class="preview">
      <div class="frame">
        <iframe id="design-iframe" src="${esc(design.id)}.html" frameborder="0" scrolling="no" title="${esc(designName)}"></iframe>
        <div class="zoom-zone">
          <div class="zoom-controls" role="toolbar" aria-label="Zoom invitation">
            <button class="zoom-btn" data-zoom="out" aria-label="${esc(COPY.zoomOutLabel)}" title="${esc(COPY.zoomOutLabel)}">−</button>
            <span class="zoom-level" id="zoom-level">100%</span>
            <button class="zoom-btn" data-zoom="in" aria-label="${esc(COPY.zoomInLabel)}" title="${esc(COPY.zoomInLabel)}">+</button>
            <button class="zoom-btn reset" data-zoom="reset" aria-label="${esc(COPY.zoomResetLabel)}" title="${esc(COPY.zoomResetLabel)}">⤢</button>
          </div>
        </div>
      </div>
      ${switcherHtml}
    </div>

    <div class="detail-info">
      <div>
        <h1 class="style-name">${esc(designName)}</h1>
        ${meta.short ? `<div class="style-short">${esc(meta.short)}</div>` : ''}
      </div>
      ${longHtml}
      ${tweakHtml}
    </div>
  </main>
  <footer class="powered-by">
    ${esc(COPY.poweredByLabel)} <a href="https://github.com/wyx-sg/wedding-invitation-skill" target="_blank" rel="noopener">wedding-invitation-skill</a>${esc(COPY.poweredBySuffix)}
  </footer>
  <script>
    (function () {
      var thumbs = document.getElementById('photo-switcher-thumbs');
      var iframe = document.getElementById('design-iframe');
      if (!thumbs || !iframe) return;

      var current = null;
      var defaultUrl = null;
      var initial = thumbs.querySelector('button.active');
      if (initial) {
        current = initial.getAttribute('data-photo-url');
        defaultUrl = current;
      }

      function send(url) {
        if (!iframe.contentWindow) return;
        try { iframe.contentWindow.postMessage({ type: 'set-photo', url: url }, '*'); } catch (_) {}
      }

      // If the iframe is already loaded by the time this script runs and a
      // non-default photo was picked, we need to push it. Otherwise wait for
      // the iframe's ready message (sent by build.js's injected listener).
      window.addEventListener('message', function (e) {
        var d = e && e.data;
        if (!d || d.type !== 'photo-iframe-ready') return;
        if (current && current !== defaultUrl) send(current);
      });

      thumbs.addEventListener('click', function (e) {
        var btn = e.target.closest('button[data-photo-url]');
        if (!btn) return;
        var url = btn.getAttribute('data-photo-url');
        if (!url || url === current) return;
        current = url;
        thumbs.querySelectorAll('button').forEach(function (b) {
          b.classList.toggle('active', b === btn);
        });
        send(url);
      });
    })();
  </script>
  <script>
    (function () {
      var cfg = window.__TWEAK_CONFIG__;
      var panel = document.getElementById('tweak-panel');
      var iframe = document.getElementById('design-iframe');
      if (!cfg || !cfg.tweak || !panel || !iframe) return;

      var TWEAK = cfg.tweak;
      var DESIGN = cfg.design || {};
      var DESIGN_ID = DESIGN.id || panel.getAttribute('data-design-id') || 'design';

      function send(msg) {
        if (!iframe.contentWindow) return;
        try { iframe.contentWindow.postMessage(msg, '*'); } catch (_) {}
      }
      var STORAGE_KEY = 'wis-tweak-' + DESIGN_ID;

      function collectState() {
        var state = { vars: {}, components: {}, frame: null };

        // Active color preset
        var activeColor = panel.querySelector('.tweak-swatch.active');
        if (activeColor) {
          var idx = +activeColor.getAttribute('data-tweak-color');
          var cs = (TWEAK.color_schemes || [])[idx];
          if (cs && cs.vars) Object.assign(state.vars, cs.vars);
        }
        // Active font preset
        panel.querySelectorAll('.tweak-font-btn.active').forEach(function (b) {
          state.vars[b.getAttribute('data-tweak-font-var')] = b.getAttribute('data-tweak-font-value');
        });
        // Active frame preset
        var activeFrame = panel.querySelector('.tweak-frame-btn.active');
        if (activeFrame) {
          var fi = +activeFrame.getAttribute('data-tweak-frame');
          var fr = (TWEAK.frames || [])[fi];
          if (fr) state.frame = { radius: fr.radius, aspect: fr.aspect };
        }
        // Components
        panel.querySelectorAll('.tweak-checkbox').forEach(function (cb) {
          var id = cb.getAttribute('data-tweak-component');
          var input = cb.querySelector('input');
          if (id) state.components[id] = input ? input.checked : true;
        });
        return state;
      }

      function applyState(state) {
        if (!state) return;
        if (state.vars && Object.keys(state.vars).length) {
          send({ type: 'set-css-vars', vars: state.vars });
        }
        if (state.frame) {
          send({ type: 'set-frame', radius: state.frame.radius || '', aspect: state.frame.aspect || '' });
        }
        if (state.components) {
          Object.keys(state.components).forEach(function (id) {
            send({ type: 'toggle-component', id: id, visible: !!state.components[id] });
          });
        }
      }

      function autoSave() {
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(collectState())); } catch (_) {}
      }

      // Auto-save state to localStorage on any control change
      ['click', 'change', 'input'].forEach(function (ev) {
        panel.addEventListener(ev, function () { setTimeout(autoSave, 50); });
      });

      function applyDefaults() {
        if (Array.isArray(TWEAK.components)) {
          TWEAK.components.forEach(function (c) {
            if (c && c.id && c.default === false) {
              send({ type: 'toggle-component', id: c.id, visible: false });
            }
          });
        }
      }

      // Apply defaults once the iframe announces ready, then restore saved state.
      window.addEventListener('message', function (e) {
        var d = e && e.data;
        if (d && d.type === 'photo-iframe-ready') {
          applyDefaults();
          try {
            var raw = localStorage.getItem(STORAGE_KEY);
            if (raw) applyState(JSON.parse(raw));
          } catch (_) {}
        }
      });

      panel.addEventListener('click', function (e) {
        var t = e.target.closest('[data-tweak-color],[data-tweak-font-var],[data-tweak-frame],#tweak-reset');
        if (!t) return;

        if (t.id === 'tweak-reset') {
          send({ type: 'reset' });
          applyDefaults();
          panel.querySelectorAll('.tweak-swatch.active,.tweak-font-btn.active,.tweak-frame-btn.active').forEach(function (b) {
            b.classList.remove('active');
          });
          // Re-mark the first preset of each section as active (matches the template's :root defaults)
          var firstSwatch = panel.querySelector('.tweak-swatch');
          if (firstSwatch) firstSwatch.classList.add('active');
          // Group font buttons by their data-tweak-font-var and mark first per group
          var seenFontVars = {};
          panel.querySelectorAll('.tweak-font-btn').forEach(function (b) {
            var v = b.getAttribute('data-tweak-font-var');
            if (!seenFontVars[v]) {
              b.classList.add('active');
              seenFontVars[v] = true;
            }
          });
          var firstFrame = panel.querySelector('.tweak-frame-btn');
          if (firstFrame) firstFrame.classList.add('active');
          panel.querySelectorAll('.tweak-checkbox').forEach(function (cb) {
            var id = cb.getAttribute('data-tweak-component');
            var def = (TWEAK.components || []).find(function (c) { return c.id === id; });
            var on = def ? !!def.default : true;
            cb.classList.toggle('checked', on);
            var input = cb.querySelector('input');
            if (input) input.checked = on;
          });
          return;
        }

        if (t.hasAttribute('data-tweak-color')) {
          var idx = +t.getAttribute('data-tweak-color');
          var cs = (TWEAK.color_schemes || [])[idx];
          if (!cs) return;
          send({ type: 'set-css-vars', vars: cs.vars || {} });
          panel.querySelectorAll('[data-tweak-color]').forEach(function (b) {
            b.classList.toggle('active', b === t);
          });
          return;
        }

        if (t.hasAttribute('data-tweak-font-var')) {
          var cssVar = t.getAttribute('data-tweak-font-var');
          var value = t.getAttribute('data-tweak-font-value');
          var vars = {}; vars[cssVar] = value;
          send({ type: 'set-css-vars', vars: vars });
          // Use an in-memory grouping instead of an attribute selector to avoid
          // any escaping concerns with user-controlled CSS-var names.
          var allFontBtns = panel.querySelectorAll('.tweak-font-btn');
          for (var fb = 0; fb < allFontBtns.length; fb++) {
            var btn = allFontBtns[fb];
            if (btn.getAttribute('data-tweak-font-var') === cssVar) {
              btn.classList.toggle('active', btn === t);
            }
          }
          return;
        }

        if (t.hasAttribute('data-tweak-frame')) {
          var fi = +t.getAttribute('data-tweak-frame');
          var fr = (TWEAK.frames || [])[fi];
          if (!fr) return;
          send({ type: 'set-frame', radius: fr.radius || '', aspect: fr.aspect || '' });
          panel.querySelectorAll('[data-tweak-frame]').forEach(function (b) {
            b.classList.toggle('active', b === t);
          });
          return;
        }
      });

      panel.addEventListener('change', function (e) {
        var input = e.target;
        if (input.tagName !== 'INPUT') return;
        var label = input.closest('.tweak-checkbox');
        if (!label) return;
        var id = label.getAttribute('data-tweak-component');
        if (!id) return;
        label.classList.toggle('checked', input.checked);
        send({ type: 'toggle-component', id: id, visible: input.checked });
      });

    })();
  </script>
  <script>
    // Zoom controls — operate on the same --iframe-scale custom property used
    // by the preview frame's calc() sizing. Persist per-tab via sessionStorage.
    (function () {
      var ZOOM_KEY = 'wis-gallery-zoom';
      var root = document.documentElement;
      var levelEl = document.getElementById('zoom-level');
      if (!levelEl) return;
      function currentDefault() {
        var v = getComputedStyle(root).getPropertyValue('--iframe-scale-default').trim();
        return parseFloat(v) || 1;
      }
      function currentScale() {
        var v = getComputedStyle(root).getPropertyValue('--iframe-scale').trim();
        return parseFloat(v) || 1;
      }
      function fmtPct(s) { return Math.round((s / currentDefault()) * 100) + '%'; }
      function applyZoom(level) {
        if (level === null) {
          root.style.removeProperty('--iframe-scale-override');
          sessionStorage.removeItem(ZOOM_KEY);
        } else {
          level = Math.max(0.4, Math.min(level, 4.0));
          root.style.setProperty('--iframe-scale-override', String(level));
          sessionStorage.setItem(ZOOM_KEY, String(level));
        }
        levelEl.textContent = fmtPct(currentScale());
      }
      document.querySelectorAll('.zoom-btn').forEach(function (b) {
        b.addEventListener('click', function () {
          var op = b.dataset.zoom;
          if (op === 'reset') { applyZoom(null); return; }
          var cur = currentScale();
          applyZoom(op === 'in' ? cur * 1.15 : cur * 0.87);
        });
      });
      document.addEventListener('keydown', function (e) {
        if (e.target.matches('input, textarea')) return;
        if (e.key === '+' || e.key === '=') { applyZoom(currentScale() * 1.15); e.preventDefault(); }
        else if (e.key === '-' || e.key === '_') { applyZoom(currentScale() * 0.87); e.preventDefault(); }
        else if (e.key === '0') { applyZoom(null); e.preventDefault(); }
      });
      var restored = parseFloat(sessionStorage.getItem(ZOOM_KEY));
      if (restored && !isNaN(restored)) applyZoom(restored);
      else levelEl.textContent = '100%';
      window.addEventListener('resize', function () {
        levelEl.textContent = fmtPct(currentScale());
      });
    })();
  </script>
</body>
</html>
`;
}

// --- gallery (multi only) ---

function galleryHtml() {
  const cards = designs.map(d => {
    const name = (lang === 'zh' ? d.name_zh : d.name_en) || d.id;
    const short = d.meta?.short || '';
    return `<a class="card" href="${esc(d.id)}-page.html">
      <div class="thumb"><img src="png/social/${esc(d.id)}.png" alt="${esc(name)}" loading="lazy"></div>
      <div class="meta">
        <div class="name">${esc(name)}</div>
        ${short ? `<div class="desc">${esc(short)}</div>` : ''}
      </div>
    </a>`;
  }).join('\n');

  return `<!DOCTYPE html>
<html lang="${lang === 'zh' ? 'zh-CN' : 'en'}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${esc(COPY.pageTitle)}</title>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300&family=Inter:wght@300;400;500&family=Noto+Serif+SC:wght@400;500&display=swap">
  <style>${GALLERY_CSS}</style>
</head>
<body>
  <nav class="nav-bar">
    <div class="inner">
      <span></span>
      <a class="nav-brand" href="index.html">${esc(COPY.brand)}</a>
      <span></span>
    </div>
  </nav>
  <header class="hero">
    <h1>${esc(COPY.pageTitle)}</h1>
    <p class="tagline">${esc(COPY.multiTagline)}</p>
  </header>
  <main>
    <div class="grid">
      ${cards}
    </div>
  </main>
  <footer class="powered-by">
    ${esc(COPY.poweredByLabel)} <a href="https://github.com/wyx-sg/wedding-invitation-skill" target="_blank" rel="noopener">wedding-invitation-skill</a>${esc(COPY.poweredBySuffix)}
  </footer>
</body>
</html>
`;
}

// --- main ---

const isMulti = designs.length > 1;

if (isMulti) {
  // Multi mode: gallery + per-design detail pages
  designs.forEach((d, i) => {
    fs.writeFileSync(path.join(DIST_DIR, `${d.id}-page.html`), detailHtml(d, i, true));
    console.log(`[gallery] → dist/${d.id}-page.html`);
  });
  fs.writeFileSync(path.join(DIST_DIR, 'index.html'), galleryHtml());
  console.log(`[gallery] → dist/index.html (gallery, ${designs.length} designs)`);
} else {
  // Single mode: index.html IS the detail page (no gallery wrapper)
  fs.writeFileSync(path.join(DIST_DIR, 'index.html'), detailHtml(designs[0], 0, false));
  console.log(`[gallery] → dist/index.html (single design)`);
}

console.log('[gallery] Done. Open dist/index.html in a browser.');
