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
    multiTagline: 'Generated alternatives — pick a favorite and download.'
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
    multiTagline: '生成的几个备选方案 — 挑一个你最喜欢的下载。'
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
  .specs {
    display: grid;
    grid-template-columns: 88px 1fr;
    column-gap: 24px;
    row-gap: 14px;
    align-items: baseline;
    padding: 18px 0;
    border-top: 1px solid var(--border-soft);
    border-bottom: 1px solid var(--border-soft);
  }
  .spec-label {
    font-size: 9.5px;
    letter-spacing: 3.5px;
    text-transform: uppercase;
    color: var(--text-muted);
  }
  .spec-value {
    font-size: 13px;
    color: var(--text);
    line-height: 1.5;
    overflow-wrap: anywhere;
  }
  .palette-row { display: flex; gap: 8px; align-items: center; }
  .swatch {
    width: 22px; height: 22px;
    border-radius: 50%;
    border: 1px solid rgba(212,184,150,0.18);
  }
  .fonts-row { font-family: 'Cormorant Garamond', serif; font-style: italic; }

  .download-group { display: flex; flex-direction: column; gap: 8px; }
  .download-group-label {
    font-size: 9.5px;
    letter-spacing: 3.5px;
    text-transform: uppercase;
    color: var(--text-muted);
  }
  .download-row { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
  .download-cta {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 12px 14px;
    background: linear-gradient(135deg, rgba(212,184,150,0.10), rgba(184,149,106,0.04));
    border: 1px solid var(--border);
    border-radius: 8px;
    color: var(--accent);
    text-decoration: none;
    transition: all 0.2s;
    min-width: 0;
  }
  .download-cta:hover {
    background: linear-gradient(135deg, rgba(212,184,150,0.20), rgba(184,149,106,0.10));
    border-color: var(--accent-warm);
    transform: translateY(-1px);
  }
  .download-cta .download-icon {
    width: 28px; height: 28px;
    border-radius: 50%;
    background: rgba(212,184,150,0.15);
    border: 1px solid rgba(212,184,150,0.3);
    flex-shrink: 0;
    display: flex; align-items: center; justify-content: center;
    font-size: 12px;
  }
  .download-cta .download-text { flex: 1; min-width: 0; overflow: hidden; }
  .download-cta .download-label {
    font-family: 'Cormorant Garamond', serif;
    font-style: italic;
    font-size: 15px;
    letter-spacing: 0.5px;
  }
  .download-cta .download-hint {
    font-family: 'Inter', sans-serif;
    font-size: 9px;
    letter-spacing: 1px;
    color: var(--text-muted);
    margin-top: 3px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .pager {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 24px;
    margin-top: 4px;
  }
  .pager .step {
    display: flex;
    align-items: center;
    gap: 14px;
    text-decoration: none;
    color: inherit;
    padding: 6px 0;
    transition: opacity 0.2s, transform 0.2s;
    min-width: 0;
  }
  .pager .step:hover { transform: translateX(2px); }
  .pager .step.next:hover { transform: translateX(-2px); }
  .pager .step.next { flex-direction: row-reverse; text-align: right; }
  .pager .step-info { flex: 1; min-width: 0; overflow: hidden; }
  .pager .step-label {
    font-size: 9px;
    letter-spacing: 3px;
    text-transform: uppercase;
    color: var(--text-muted);
    margin-bottom: 2px;
  }
  .pager .step-name {
    font-family: 'Cormorant Garamond', serif;
    font-style: italic;
    font-size: 15px;
    color: var(--accent);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
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
  @media (max-width: 600px) {
    .download-row { grid-template-columns: 1fr; }
    .pager { grid-template-columns: 1fr; }
    .pager .step.next { flex-direction: row; text-align: left; }
  }
`;

// --- detail page ---

function detailHtml(design, index, isMulti) {
  const meta = design.meta || {};
  // Hex color is a controlled value; light-validate to avoid CSS injection.
  const safeColor = c => /^#?[0-9a-fA-F]{3,8}$/.test(String(c).replace('#', '')) ? c : '#888';
  const palette = (meta.palette || [])
    .map(c => `<span class="swatch" style="background:${safeColor(c)}" title="${esc(c)}"></span>`)
    .join('');
  const fonts = (meta.fonts || []).map(esc).join(' · ');
  const tplH = design.height || 560;
  const tplW = design.width || 420;

  const prev = isMulti ? designs[(index - 1 + designs.length) % designs.length] : null;
  const next = isMulti ? designs[(index + 1) % designs.length] : null;

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

  const navBack = isMulti
    ? `<a class="nav-back" href="index.html"><span>←</span><span>${esc(COPY.backToGallery)}</span></a>`
    : '<span></span>';

  const designName = (lang === 'zh' ? design.name_zh : design.name_en) || design.id;

  const specsBlocks = [];
  if (palette) specsBlocks.push(`<div class="spec-label">${esc(COPY.paletteLabel)}</div><div class="spec-value palette-row">${palette}</div>`);
  if (fonts) specsBlocks.push(`<div class="spec-label">${esc(COPY.fontsLabel)}</div><div class="spec-value fonts-row">${fonts}</div>`);
  if (meta.motifs) specsBlocks.push(`<div class="spec-label">${esc(COPY.motifsLabel)}</div><div class="spec-value">${esc(meta.motifs)}</div>`);
  const specsHtml = specsBlocks.length
    ? `<div class="specs">${specsBlocks.join('')}</div>`
    : '';

  const longHtml = meta.long ? `<p class="style-long">${esc(meta.long)}</p>` : '';

  const prevName = prev && ((lang === 'zh' ? prev.name_zh : prev.name_en) || prev.id);
  const nextName = next && ((lang === 'zh' ? next.name_zh : next.name_en) || next.id);
  const pagerHtml = isMulti ? `
    <nav class="pager">
      <a class="step prev" href="${esc(prev.id)}-page.html">
        <div class="step-info">
          <div class="step-label">${esc(COPY.prevLabel)}</div>
          <div class="step-name">${esc(prevName)}</div>
        </div>
      </a>
      <a class="step next" href="${esc(next.id)}-page.html">
        <div class="step-info">
          <div class="step-label">${esc(COPY.nextLabel)}</div>
          <div class="step-name">${esc(nextName)}</div>
        </div>
      </a>
    </nav>` : '';

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
</head>
<body>
  <nav class="nav-bar">
    <div class="inner">
      ${navBack}
      <a class="nav-brand" href="${isMulti ? 'index.html' : '#'}">${esc(COPY.brand)}</a>
      <span></span>
    </div>
  </nav>

  <main class="detail">
    <div class="preview">
      <div class="frame">
        <iframe id="design-iframe" src="${esc(design.id)}.html" frameborder="0" scrolling="no" title="${esc(designName)}"></iframe>
      </div>
      ${switcherHtml}
    </div>

    <div class="detail-info">
      <div>
        <h1 class="style-name">${esc(designName)}</h1>
        ${meta.short ? `<div class="style-short">${esc(meta.short)}</div>` : ''}
      </div>

      ${longHtml}

      ${specsHtml}

      <div class="download-group">
        <div class="download-group-label">${esc(COPY.downloadGroupLabel)}</div>
        <div class="download-row">
          <a class="download-cta" href="png/social/${esc(design.id)}.png" download="${esc(design.id)}-social.png">
            <span class="download-icon">↓</span>
            <span class="download-text">
              <div class="download-label">${esc(COPY.downloadSocialLabel)}</div>
              <div class="download-hint">${esc(COPY.downloadSocialHint)}</div>
            </span>
          </a>
          <a class="download-cta" href="png/print/${esc(design.id)}.png" download="${esc(design.id)}-print.png">
            <span class="download-icon">↓</span>
            <span class="download-text">
              <div class="download-label">${esc(COPY.downloadPrintLabel)}</div>
              <div class="download-hint">${esc(COPY.downloadPrintHint)}</div>
            </span>
          </a>
        </div>
      </div>

      ${pagerHtml}
    </div>
  </main>
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
