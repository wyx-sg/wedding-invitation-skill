// Build the user's local gallery: index landing + per-design detail + per-design
// tweak studio. Output is always the same shape regardless of how many designs
// — with 1 design the gallery is a single-card landing.
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
// Outputs (always, for every design):
//   dist/index.html       — gallery grid (cards with thumbnails)
//   dist/<id>-page.html   — detail page (iframe + meta + download buttons; prev/next only if >1 design)
//   dist/<id>-studio.html — tweak studio (color/font/frame/component switchers)
//
// Open dist/index.html in a browser to view + download.

import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const DATA_DIR = path.join(ROOT, 'data');
export const DIST_DIR = path.join(ROOT, 'dist');
const DIST_PHOTOS_DIR = path.join(DIST_DIR, 'photos');

const wedding = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'wedding.json'), 'utf8'));
export const designs = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'designs.json'), 'utf8'));

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
    inspirationLabel: 'Design Inspiration',
    downloadGroupLabel: 'Download',
    downloadSocialLabel: 'Social',
    downloadSocialHint: '1080 × 1440 · messaging, email',
    downloadPrintLabel: 'Print',
    downloadPrintHint: '2160 × 2880 · 300 DPI for printing',
    backToGallery: 'All Designs',
    backToPreview: 'Preview gallery',
    prevLabel: 'Previous',
    nextLabel: 'Next',
    photoSwitcherLabel: 'Photo',
    photoSwitcherAria: id => `Switch to photo ${id}`,
    zoomOutLabel: 'Zoom out',
    zoomInLabel: 'Zoom in',
    zoomResetLabel: 'Fit to screen',
    multiTagline: 'Generated alternatives — pick a favorite and download.',
    singleTagline: 'Click the card to view or download.',
    previewTagline: 'Click a design to preview and tweak. Tell the agent when you are ready for downloads.',
    tweakColorLabel: 'Color',
    tweakFontLabel: 'Typography',
    tweakFrameLabel: 'Photo frame',
    tweakComponentsLabel: 'Show / hide',
    tweakResetLabel: 'Reset',
    tweakHeadlineSub: 'Headline',
    tweakBodySub: 'Body',
    tweakExportLabel: 'Copy tweaks',
    tweakExportCopied: 'Copied ✓',
    tweakExportHint: "Your tweaks auto-sync to your assistant. If they don't see them, click Copy and paste into chat.",
    poweredByLabel: 'Made with',
    poweredBySuffix: '',
  },
  zh: {
    brand: '婚礼请帖',
    pageTitle: '我的婚礼请帖',
    paletteLabel: '配色',
    fontsLabel: '字体',
    motifsLabel: '装饰元素',
    inspirationLabel: '设计灵感',
    downloadGroupLabel: '下载',
    downloadSocialLabel: '社交版',
    downloadSocialHint: '1080 × 1440 · 微信 / 邮件',
    downloadPrintLabel: '印刷版',
    downloadPrintHint: '2160 × 2880 · 300 DPI 印刷',
    backToGallery: '所有设计',
    backToPreview: '预览页',
    prevLabel: '上一个',
    nextLabel: '下一个',
    photoSwitcherLabel: '换照片',
    photoSwitcherAria: id => `切换到照片 ${id}`,
    zoomOutLabel: '缩小',
    zoomInLabel: '放大',
    zoomResetLabel: '适应屏幕',
    multiTagline: '生成的几个备选方案 — 挑一个你最喜欢的下载。',
    singleTagline: '点击卡片查看详情或下载。',
    previewTagline: '点击卡片预览 + 微调。调好后告诉 Agent 出最终下载页。',
    tweakColorLabel: '配色',
    tweakFontLabel: '字体',
    tweakFrameLabel: '照片框',
    tweakComponentsLabel: '显示 / 隐藏',
    tweakResetLabel: '重置',
    tweakHeadlineSub: '标题字体',
    tweakBodySub: '正文字体',
    tweakExportLabel: '复制微调结果',
    tweakExportCopied: '已复制 ✓',
    tweakExportHint: '你的微调会自动同步给 Agent。如果 Agent 没看到，点「复制微调结果」把当前选择粘回对话窗口。',
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
  /* Unified header — matches picker pages (_photo-select.html, _style-preview.html)
     and the standalone-card header injected by build.js.
     Sticky + bottom rule so it stays visible while the page scrolls. */
  .wis-nav {
    position: sticky;
    top: 0;
    z-index: 50;
    text-align: center;
    padding: 18px 16px 12px;
    background: rgba(10, 9, 7, 0.92);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border-bottom: 1px solid var(--border-soft);
  }
  .wis-brand {
    font-family: 'Cormorant Garamond', serif;
    font-style: italic;
    font-size: 18px;
    letter-spacing: 3px;
    color: var(--accent);
    text-transform: uppercase;
  }
  .wis-pb {
    font-size: 9.5px;
    letter-spacing: 1.2px;
    color: var(--text-muted);
    margin-top: 4px;
    font-family: 'Inter', sans-serif;
  }
  .wis-pb a {
    color: var(--text-dim);
    text-decoration: none;
    border-bottom: 1px dotted var(--border-soft);
    transition: color 0.18s, border-color 0.18s;
  }
  .wis-pb a:hover {
    color: var(--accent);
    border-bottom-color: var(--accent);
  }
  .wis-nav-back {
    position: absolute;
    left: 28px;
    top: 22px;
    font-size: 11px;
    letter-spacing: 2.5px;
    text-transform: uppercase;
    color: var(--text-dim);
    text-decoration: none;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    transition: color 0.18s;
  }
  .wis-nav-back:hover { color: var(--accent); }
  @media (max-width: 600px) {
    .wis-nav-back {
      position: static;
      display: block;
      margin: 0 auto 8px;
    }
  }
`;

const GALLERY_CSS = `
  ${SHARED_CSS}
  header.hero {
    max-width: 1280px;
    margin: 0 auto;
    padding: 22px 32px 4px;
    text-align: center;
  }
  .tagline {
    font-family: 'Cormorant Garamond', 'Noto Serif SC', serif;
    font-style: italic;
    font-size: 14px;
    color: #a89878;
    margin: 0 auto;
    max-width: 640px;
    line-height: 1.55;
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
  /* Stage-4 nav gallery: live iframe preview instead of PNG.
     Card is fixed at 280px (the grid template above); iframe is the
     template's natural 420x560, scaled to fit via CSS transform.
     pointer-events:none so clicks fall through to the parent <a>. */
  .thumb-iframe { position: relative; width: 280px; height: 373px; overflow: hidden; background: #14110d; }
  .thumb-iframe iframe { width: 420px; height: 560px; border: 0; transform: scale(0.6667); transform-origin: top left; pointer-events: none; }
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
    .grid { grid-template-columns: 1fr; max-width: 360px; gap: 18px; }
    main { padding: 20px 16px 40px; }
  }
  /* Nav-gallery (Stage-4 index): consolidated Copy block at top, above the grid */
  .nav-export {
    max-width: 720px;
    margin: 8px auto 32px;
    padding: 0 24px;
    text-align: center;
  }
  .nav-export-hint {
    font-family: 'Cormorant Garamond', 'Noto Serif SC', serif;
    font-style: italic;
    font-size: 13px;
    color: var(--text-muted);
    line-height: 1.6;
    margin: 0 0 14px;
  }
  .nav-export-btn {
    padding: 8px 22px;
    background: transparent;
    border: 1px solid var(--accent-warm);
    border-radius: 999px;
    color: var(--accent);
    font-family: 'Inter', sans-serif;
    font-size: 11px;
    letter-spacing: 2px;
    text-transform: uppercase;
    cursor: pointer;
    transition: background 0.18s, color 0.18s;
  }
  .nav-export-btn:hover { background: rgba(212,184,150,0.12); }
  .nav-export-btn.copied { background: var(--accent); color: var(--bg); border-color: var(--accent); }
`;

// IIFE running on the nav gallery. Reads tweak state from
// /api/tweak-state (server-backed) or localStorage (file://), then
// formats a multi-design human-readable summary on Copy click.
const NAV_EXPORT_IIFE_SCRIPT = `
  (function () {
    var data = window.__NAV_SUMMARY__;
    if (!data) return;
    var btn = document.getElementById('nav-export-btn');
    if (!btn) return;

    function lookup(obj, field, fallback) {
      if (!obj) return fallback;
      var primary = field + '_' + (data.lang || 'en');
      if (obj[primary] != null && obj[primary] !== '') return obj[primary];
      if (obj[field + '_en'] != null && obj[field + '_en'] !== '') return obj[field + '_en'];
      if (obj[field] != null && obj[field] !== '') return obj[field];
      return fallback;
    }

    function buildPerDesign(d, state) {
      if (!state) return null;
      var tweak = d.tweak || {};
      var copy = data.copy;
      var lines = [];
      lines.push('【' + copy.intro.replace('{name}', d.displayName) + '】');
      if (typeof state.colorIdx === 'number' && state.colorIdx >= 0) {
        var cs = (tweak.color_schemes || [])[state.colorIdx];
        if (cs) lines.push('· ' + copy.color + ': ' + lookup(cs, 'name', '#' + state.colorIdx));
      }
      Object.keys(state.fontValues || {}).forEach(function (k) {
        var lbl = k === '--font-headline' ? copy.headline : k === '--font-body' ? copy.body : k;
        lines.push('· ' + lbl + ': ' + state.fontValues[k]);
      });
      if (typeof state.frameIdx === 'number' && state.frameIdx >= 0) {
        var fr = (tweak.frames || [])[state.frameIdx];
        if (fr) lines.push('· ' + copy.frame + ': ' + lookup(fr, 'name', '#' + state.frameIdx));
      }
      var compDefs = tweak.components || [];
      var shown = [], hidden = [];
      compDefs.forEach(function (c) {
        if (!c || !c.id) return;
        var lbl = lookup(c, 'label', c.id);
        var visible = state.components && state.components.hasOwnProperty(c.id) ? state.components[c.id] : c.default !== false;
        if (visible) shown.push(lbl); else hidden.push(lbl);
      });
      if (shown.length) lines.push('· ' + copy.show + ': ' + shown.join(copy.sep));
      if (hidden.length) lines.push('· ' + copy.hide + ': ' + hidden.join(copy.sep));
      return lines.join('\\n');
    }

    async function getStates() {
      var out = {};
      if (location.protocol === 'http:' || location.protocol === 'https:') {
        try {
          var r = await fetch('/api/tweak-state', { cache: 'no-store' });
          if (r.ok) {
            var j = await r.json();
            // server file shape: { "<designId>": {...state, updatedAt}, ... }
            Object.keys(j || {}).forEach(function (k) { out[k] = j[k]; });
          }
        } catch (_) {}
      }
      // localStorage fallback (file://) or supplement.
      try {
        for (var i = 0; i < localStorage.length; i++) {
          var k = localStorage.key(i);
          if (k && k.indexOf('wis-tweak-') === 0) {
            var id = k.slice('wis-tweak-'.length);
            if (!out[id]) {
              try { out[id] = JSON.parse(localStorage.getItem(k)); } catch (_) {}
            }
          }
        }
      } catch (_) {}
      return out;
    }

    function buildSummary(states) {
      var blocks = [];
      var anyTweaked = false;
      data.designs.forEach(function (d) {
        var st = states[d.id];
        if (!st) return;
        var b = buildPerDesign(d, st);
        if (b) { blocks.push(b); anyTweaked = true; }
      });
      if (!anyTweaked) return data.copy.noTweaks;
      return data.copy.sectionTitle + '\\n\\n' + blocks.join('\\n\\n');
    }

    btn.addEventListener('click', async function () {
      var states = await getStates();
      var text = buildSummary(states);
      var done = function () {
        btn.classList.add('copied');
        btn.textContent = data.copy.copied;
        setTimeout(function () {
          btn.classList.remove('copied');
          btn.textContent = data.copy.label;
        }, 2400);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(done).catch(function () {
          var ta = document.createElement('textarea');
          ta.value = text; document.body.appendChild(ta); ta.select();
          try { document.execCommand('copy'); done(); } catch (_) {}
          document.body.removeChild(ta);
        });
      } else {
        var ta2 = document.createElement('textarea');
        ta2.value = text; document.body.appendChild(ta2); ta2.select();
        try { document.execCommand('copy'); done(); } catch (_) {}
        document.body.removeChild(ta2);
      }
    });

    // --- thumbnail live tweak sync ---
    // Each thumbnail iframe loads dist/<id>.html and fires a 'photo-iframe-ready'
    // message when its postMessage listener is hooked up. We catch that, read
    // the user's tweak state for that design, and forward the same postMessage
    // events the studio sends — so the thumbnail mirrors the user's tweaks.
    var statesPromise = getStates();
    function applyStateToIframe(iframe, tweak, state) {
      function send(msg) { try { iframe.contentWindow.postMessage(msg, '*'); } catch (_) {} }
      if (typeof state.colorIdx === 'number' && state.colorIdx >= 0) {
        var cs = (tweak.color_schemes || [])[state.colorIdx];
        if (cs && cs.vars) send({ type: 'set-css-vars', vars: cs.vars });
      }
      if (state.fontValues && Object.keys(state.fontValues).length) {
        send({ type: 'set-css-vars', vars: state.fontValues });
      }
      if (typeof state.frameIdx === 'number' && state.frameIdx >= 0) {
        var fr = (tweak.frames || [])[state.frameIdx];
        if (fr) send({ type: 'set-frame', radius: fr.radius || '', aspect: fr.aspect || '' });
      }
      if (state.components) {
        Object.keys(state.components).forEach(function (id) {
          send({ type: 'toggle-component', id: id, visible: !!state.components[id] });
        });
      }
    }
    window.addEventListener('message', async function (e) {
      if (!e.data || e.data.type !== 'photo-iframe-ready') return;
      var designId = e.data.id;
      if (!designId) return;
      var states = await statesPromise;
      var state = states[designId];
      if (!state) return;
      var design = data.designs.find(function (d) { return d.id === designId; });
      if (!design || !design.tweak) return;
      var iframe = document.querySelector('iframe[data-design-id="' + designId.replace(/"/g, '\\"') + '"]');
      if (iframe && iframe.contentWindow) applyStateToIframe(iframe, design.tweak, state);
    });
  })()`;

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
  .wis-nav { flex: 0 0 auto; }

  main.detail {
    flex: 0 0 auto;
    min-height: calc(100vh - 80px);
    width: 100%;
    margin: 0 auto;
    padding: 24px 40px 32px;
    display: flex;
    justify-content: center;
    align-items: flex-start;
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
    position: sticky;
    top: 80px;
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
    position: relative;
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

  .category {
    font-size: 10px;
    letter-spacing: 4px;
    text-transform: uppercase;
    color: var(--accent);
    margin-bottom: 16px;
  }
  .style-name {
    font-family: 'Cormorant Garamond', serif;
    font-weight: 300;
    font-size: 56px;
    letter-spacing: -0.5px;
    color: var(--text);
    line-height: 1.05;
    margin: 0 0 8px;
  }
  .style-short {
    font-family: 'Cormorant Garamond', 'Noto Serif SC', serif;
    font-style: italic;
    font-size: 16px;
    color: var(--text-dim);
    margin: 0 0 22px;
    letter-spacing: 0.3px;
  }
  .style-long {
    font-family: 'Cormorant Garamond', 'Noto Serif SC', serif;
    font-size: 15px;
    line-height: 1.65;
    color: var(--text-dim);
    font-style: italic;
    text-wrap: balance;
    overflow-wrap: anywhere;
    margin: 0 0 22px;
  }
  .design-inspiration {
    border-left: 1.5px solid var(--border-soft);
    padding: 2px 0 4px 22px;
    margin: 0 0 26px;
  }
  .design-inspiration .insp-label {
    font-size: 10px;
    letter-spacing: 3px;
    text-transform: uppercase;
    color: var(--text-muted);
    margin: 0 0 10px;
  }
  .design-inspiration .insp-text {
    font-family: 'Cormorant Garamond', 'Noto Serif SC', serif;
    font-style: italic;
    font-size: 14.5px;
    line-height: 1.6;
    color: var(--text-dim);
    margin: 0;
  }
  .specs {
    display: grid;
    grid-template-columns: 124px 1fr;
    row-gap: 18px;
    column-gap: 24px;
    padding: 22px 0;
    border-top: 1px solid var(--border-soft);
    border-bottom: 1px solid var(--border-soft);
    margin-bottom: 24px;
    align-items: start;
  }
  .spec-label {
    font-size: 10px;
    letter-spacing: 3px;
    text-transform: uppercase;
    color: var(--text-muted);
    margin: 0;
    padding-top: 4px;
    line-height: 1.4;
  }
  .spec-value {
    font-family: 'Cormorant Garamond', 'Noto Serif SC', serif;
    font-style: italic;
    font-size: 14px;
    color: var(--text-dim);
    margin: 0;
    line-height: 1.4;
  }
  .palette-row {
    display: flex;
    gap: 8px;
    align-items: center;
    padding-top: 0;
  }
  .swatch {
    width: 22px;
    height: 22px;
    border-radius: 50%;
    border: 1px solid rgba(255,255,255,0.08);
    flex-shrink: 0;
  }
  .fonts-row {
    /* now uses .spec-value italic style by default */
  }
  .download-group {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  .download-group-label {
    font-size: 9px;
    letter-spacing: 3px;
    text-transform: uppercase;
    color: var(--text-muted);
  }
  .download-row {
    display: flex;
    gap: 12px;
  }
  .download-cta {
    flex: 1;
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 12px 14px;
    background: var(--bg-elevated);
    border: 1px solid var(--border);
    border-radius: 6px;
    text-decoration: none;
    color: var(--text);
    transition: border-color 0.2s, background 0.2s, transform 0.15s;
  }
  .download-cta:hover {
    border-color: var(--accent-warm);
    background: #1f1a14;
    transform: translateY(-2px);
  }
  .download-icon {
    font-size: 20px;
    color: var(--accent);
    flex-shrink: 0;
    line-height: 1;
  }
  .download-text {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  }
  .download-label {
    font-size: 13px;
    font-weight: 500;
    letter-spacing: 0.3px;
  }
  .download-hint {
    font-size: 10px;
    color: var(--text-dim);
    letter-spacing: 0.3px;
  }
  .pager {
    display: flex;
    gap: 12px;
    padding-top: 4px;
  }
  .pager .step {
    flex: 1;
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 14px;
    background: var(--bg-elevated);
    border: 1px solid var(--border);
    border-radius: 6px;
    text-decoration: none;
    color: var(--text-dim);
    font-size: 12px;
    letter-spacing: 0.5px;
    transition: border-color 0.2s, color 0.2s, background 0.2s;
  }
  .pager .step:hover {
    border-color: var(--accent-warm);
    color: var(--text);
    background: #1f1a14;
  }
  .pager .step.next {
    justify-content: flex-end;
    text-align: right;
  }
  .pager .step-label {
    font-size: 9px;
    letter-spacing: 2.5px;
    text-transform: uppercase;
    color: var(--text-muted);
    display: block;
  }
  .pager .step-name {
    display: block;
    font-family: 'Cormorant Garamond', serif;
    font-style: italic;
    font-size: 14px;
    color: inherit;
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
    .download-row { flex-direction: column; }
    .pager { flex-direction: row; }
  }
  .tweak-panel {
    display: flex;
    flex-direction: column;
    gap: 18px;
    padding: 4px 0 0;
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
    align-self: center;
    margin-top: 12px;
    padding-top: 16px;
    border-top: 1px dashed var(--border-soft);
    width: 100%;
    text-align: center;
  }
  .tweak-reset-btn {
    background: transparent;
    border: 0;
    color: var(--text-muted);
    font-size: 11px;
    letter-spacing: 2.5px;
    text-transform: uppercase;
    cursor: pointer;
    padding: 4px 12px;
    font-family: 'Inter', sans-serif;
    transition: color 0.18s, letter-spacing 0.18s;
  }
  .tweak-reset-btn:hover {
    color: var(--accent);
    letter-spacing: 3.5px;
  }
  .tweak-export {
    border-top: 1px dashed var(--border-soft);
    margin-top: 36px;
    padding: 22px 0 0;
    display: flex;
    flex-direction: column;
    gap: 12px;
    align-items: center;
    text-align: center;
  }
  .tweak-export-hint {
    margin: 0;
    font-family: 'Cormorant Garamond', 'Noto Serif SC', serif;
    font-style: italic;
    font-size: 12px;
    color: var(--text-muted);
    line-height: 1.55;
    max-width: 460px;
  }
  .tweak-export-btn {
    padding: 6px 18px;
    background: transparent;
    border: 1px solid var(--accent-warm);
    border-radius: 999px;
    color: var(--accent);
    font-family: 'Inter', sans-serif;
    font-size: 11px;
    letter-spacing: 2px;
    text-transform: uppercase;
    cursor: pointer;
    transition: background 0.18s, color 0.18s;
  }
  .tweak-export-btn:hover { background: rgba(212,184,150,0.12); }
  .tweak-export-btn.copied { background: var(--accent); color: var(--bg); border-color: var(--accent); }
`;

// --- shared helpers ---

// Localized field lookup: tries <field>_<lang>, then <field>_en, then bare <field>,
// then the provided fallback. Supports any language code in wedding.json languages[0].
function localizedName(obj, fields, fallback) {
  if (!obj) return fallback;
  const primaryKey = fields + '_' + lang;
  const enKey = fields + '_en';
  if (obj[primaryKey] != null && obj[primaryKey] !== '') return obj[primaryKey];
  if (obj[enKey] != null && obj[enKey] !== '') return obj[enKey];
  if (obj[fields] != null && obj[fields] !== '') return obj[fields];
  return fallback;
}

// Shared photo switcher + iframe scale compute IIFE builders
function buildSwitcherHtml(design) {
  const primaryPhotoName = design.primary_photo;
  const photoThumbs = availablePhotos.map(file => {
    const photoId = file.replace(PHOTO_RE, '');
    const isActive = photoId === primaryPhotoName;
    const cls = isActive ? ' class="active"' : '';
    return `<button type="button"${cls} data-photo-url="photos/${esc(file)}" data-photo-id="${esc(photoId)}" aria-label="${esc(COPY.photoSwitcherAria(photoId))}"><img src="photos/${esc(file)}" alt="" loading="lazy"></button>`;
  }).join('');
  return availablePhotos.length >= 2 ? `
    <div class="photo-switcher">
      <span class="photo-switcher-label">${esc(COPY.photoSwitcherLabel)}</span>
      <div class="photo-switcher-thumbs" id="photo-switcher-thumbs">${photoThumbs}</div>
    </div>` : '';
}

function buildTweakParts(design) {
  const safeColor = c => /^#?[0-9a-fA-F]{3,8}$/.test(String(c).replace('#', '')) ? c : '#888';
  const tweak = design.tweak_options || null;
  let tweakHtml = '';
  let tweakConfigJson = 'null';
  if (tweak) {
    const sections = [];

    // Colors
    if (Array.isArray(tweak.color_schemes) && tweak.color_schemes.length) {
      const swatches = tweak.color_schemes.map((cs, i) => {
        const name = localizedName(cs, 'name', `#${i + 1}`);
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
        const frameName = localizedName(f, 'name', `#${i+1}`);
        return `<button type="button" class="tweak-frame-btn${activeClass}" data-tweak-frame="${i}">${esc(frameName)}</button>`;
      }).join('');

      sections.push(`<div class="tweak-group" data-section="frame">
        <div class="tweak-group-label">${esc(COPY.tweakFrameLabel)}</div>
        <div class="tweak-row">${frameButtons}</div>
      </div>`);
    }

    // Components
    if (Array.isArray(tweak.components) && tweak.components.length) {
      const checkboxes = tweak.components.map(c => {
        const label = localizedName(c, 'label', c.id);
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

    // Reset — only rendered when at least one section exists
    if (sections.length > 0) {
      sections.push(`<div class="tweak-reset">
        <button type="button" class="tweak-reset-btn" id="tweak-reset">↻ ${esc(COPY.tweakResetLabel)}</button>
      </div>`);
      tweakHtml = `<div class="tweak-panel" id="tweak-panel" data-design-id="${esc(design.id)}">${sections.join('')}</div>`;
      const tweakConfigShape = {
        tweak: tweak,
        lang: lang,
        copy: {
          intro: lang === 'zh' ? '我对设计「{name}」的微调' : 'My tweaks for "{name}"',
          color: COPY.tweakColorLabel,
          headline: COPY.tweakHeadlineSub,
          body: COPY.tweakBodySub,
          frame: COPY.tweakFrameLabel,
          show: lang === 'zh' ? '显示' : 'Show',
          hide: lang === 'zh' ? '隐藏' : 'Hide',
          sep: lang === 'zh' ? '、' : ', ',
          exportLabel: COPY.tweakExportLabel,
          exportCopied: COPY.tweakExportCopied,
        },
        design: {
          id: design.id,
          displayName: localizedName(design, 'name', design.id),
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
  return { tweakHtml, tweakConfigJson };
}

// Shared zoom controls IIFE script (same in both detail and studio)
const TWEAK_IIFE_SCRIPT = `
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
        var state = {
          colorIdx: null,
          fontValues: {},
          frameIdx: null,
          components: {}
        };

        var activeColor = panel.querySelector('.tweak-swatch.active');
        if (activeColor) state.colorIdx = +activeColor.getAttribute('data-tweak-color');

        panel.querySelectorAll('.tweak-font-btn.active').forEach(function (b) {
          state.fontValues[b.getAttribute('data-tweak-font-var')] = b.getAttribute('data-tweak-font-value');
        });

        var activeFrame = panel.querySelector('.tweak-frame-btn.active');
        if (activeFrame) state.frameIdx = +activeFrame.getAttribute('data-tweak-frame');

        panel.querySelectorAll('.tweak-checkbox').forEach(function (cb) {
          var id = cb.getAttribute('data-tweak-component');
          var input = cb.querySelector('input');
          if (id) state.components[id] = input ? input.checked : true;
        });

        return state;
      }

      function applyState(state) {
        if (!state) return;

        // 1. Color scheme
        if (typeof state.colorIdx === 'number' && state.colorIdx >= 0) {
          var cs = (TWEAK.color_schemes || [])[state.colorIdx];
          if (cs && cs.vars) {
            send({ type: 'set-css-vars', vars: cs.vars });
            panel.querySelectorAll('.tweak-swatch').forEach(function (b) {
              b.classList.toggle('active', +b.getAttribute('data-tweak-color') === state.colorIdx);
            });
          }
        }

        // 2. Font values per CSS var
        if (state.fontValues) {
          var vars = {};
          Object.keys(state.fontValues).forEach(function (cssVar) {
            vars[cssVar] = state.fontValues[cssVar];
          });
          if (Object.keys(vars).length) send({ type: 'set-css-vars', vars: vars });
          panel.querySelectorAll('.tweak-font-btn').forEach(function (b) {
            var v = b.getAttribute('data-tweak-font-var');
            var val = b.getAttribute('data-tweak-font-value');
            b.classList.toggle('active', state.fontValues[v] === val);
          });
        }

        // 3. Frame
        if (typeof state.frameIdx === 'number' && state.frameIdx >= 0) {
          var fr = (TWEAK.frames || [])[state.frameIdx];
          if (fr) {
            send({ type: 'set-frame', radius: fr.radius || '', aspect: fr.aspect || '' });
            panel.querySelectorAll('.tweak-frame-btn').forEach(function (b) {
              b.classList.toggle('active', +b.getAttribute('data-tweak-frame') === state.frameIdx);
            });
          }
        }

        // 4. Components
        if (state.components) {
          Object.keys(state.components).forEach(function (id) {
            var visible = !!state.components[id];
            send({ type: 'toggle-component', id: id, visible: visible });
            var cb = panel.querySelector('.tweak-checkbox[data-tweak-component="' + id + '"]');
            if (cb) {
              cb.classList.toggle('checked', visible);
              var input = cb.querySelector('input');
              if (input) input.checked = visible;
            }
          });
        }
      }

      // Live sync to picker-server so the agent can read data/tweak-state.json
      // without asking the user to copy/paste. file:// pages silently degrade
      // to localStorage-only + the Copy button below.
      var serverBacked = location.protocol === 'http:' || location.protocol === 'https:';
      function postToServer(state) {
        if (!serverBacked) return;
        try {
          fetch('/api/tweak-state', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ designId: DESIGN_ID, state: state }),
          }).catch(function () { /* server gone — Copy still works */ });
        } catch (_) {}
      }

      function autoSave() {
        var state = collectState();
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (_) {}
        postToServer(state);
      }

      // Save synchronously on every tweak so navigation doesn't lose changes.
      ['click', 'change', 'input'].forEach(function (ev) {
        panel.addEventListener(ev, autoSave);
      });
      // Also save on page hide as a belt-and-suspenders measure.
      window.addEventListener('pagehide', autoSave);

      // Note: the Copy-tweaks button lives on the preview gallery (index.html),
      // not here. The studio only owns auto-sync + the live preview. See
      // navGalleryHtml in build-gallery.js for the consolidated Copy flow.

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

    })()`;

const PHOTO_SWITCHER_IIFE_SCRIPT = `
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
    })()`;

const ZOOM_IIFE_SCRIPT = `
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
    })()`;

// --- detail page ---

export function detailHtml(design, index) {
  const meta = design.meta || {};
  const safeColor = c => /^#?[0-9a-fA-F]{3,8}$/.test(String(c).replace('#', '')) ? c : '#888';
  const palette = (meta.palette || [])
    .map(c => `<span class="swatch" style="background:${safeColor(c)}" title="${esc(c)}"></span>`)
    .join('');
  const fonts = (meta.fonts || []).map(esc).join(' · ');
  const tplH = design.height || 560;
  const tplW = design.width || 420;

  const hasSiblings = designs.length > 1;
  const prev = hasSiblings ? designs[(index - 1 + designs.length) % designs.length] : null;
  const next = hasSiblings ? designs[(index + 1) % designs.length] : null;

  const switcherHtml = buildSwitcherHtml(design);

  const designName = localizedName(design, 'name', design.id);
  const category = localizedName(meta, 'category', '');
  const inspiration = localizedName(meta, 'inspiration', '');
  const motifs = localizedName(meta, 'motifs', '');

  const longHtml = meta.long ? `<p class="style-long">${esc(meta.long)}</p>` : '';
  const inspirationHtml = inspiration ? `
      <div class="design-inspiration">
        <div class="insp-label">${esc(COPY.inspirationLabel)}</div>
        <p class="insp-text">${esc(inspiration)}</p>
      </div>` : '';

  const specsBlocks = [];
  if (palette) specsBlocks.push(`<div class="spec-label">${esc(COPY.paletteLabel)}</div><div class="spec-value palette-row">${palette}</div>`);
  if (fonts) specsBlocks.push(`<div class="spec-label">${esc(COPY.fontsLabel)}</div><div class="spec-value fonts-row">${fonts}</div>`);
  if (motifs) specsBlocks.push(`<div class="spec-label">${esc(COPY.motifsLabel)}</div><div class="spec-value">${esc(motifs)}</div>`);
  const specsHtml = specsBlocks.length
    ? `<div class="specs">${specsBlocks.join('')}</div>`
    : '';

  const prevName = prev && localizedName(prev, 'name', prev.id);
  const nextName = next && localizedName(next, 'name', next.id);
  const pagerHtml = hasSiblings ? `
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
  <nav class="wis-nav">
    <a class="wis-nav-back" href="index.html"><span>←</span><span>${esc(COPY.backToGallery)}</span></a>
    <div class="wis-brand">${esc(COPY.brand)}</div>
    <div class="wis-pb">${esc(COPY.poweredByLabel)} <a href="https://github.com/wyx-sg/wedding-invitation-skill" target="_blank" rel="noopener">wedding-invitation-skill</a>${esc(COPY.poweredBySuffix)}</div>
  </nav>
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
        ${category ? `<div class="category">${esc(category)}</div>` : ''}
        <h1 class="style-name">${esc(designName)}</h1>
        ${meta.short ? `<div class="style-short">${esc(meta.short)}</div>` : ''}
      </div>

      ${longHtml}

      ${inspirationHtml}

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
  <script>${PHOTO_SWITCHER_IIFE_SCRIPT};</script>
  <script>${ZOOM_IIFE_SCRIPT};</script>
</body>
</html>
`;
}

// --- studio page ---

export function studioHtml(design, index) {
  const meta = design.meta || {};
  const tplH = design.height || 560;
  const tplW = design.width || 420;

  const hasSiblings = designs.length > 1;
  const prev = hasSiblings ? designs[(index - 1 + designs.length) % designs.length] : null;
  const next = hasSiblings ? designs[(index + 1) % designs.length] : null;

  const switcherHtml = buildSwitcherHtml(design);

  const designName = localizedName(design, 'name', design.id);
  const category = localizedName(meta, 'category', '');
  const inspiration = localizedName(meta, 'inspiration', '');
  const longHtml = meta.long ? `<p class="style-long">${esc(meta.long)}</p>` : '';
  const inspirationHtml = inspiration ? `
      <div class="design-inspiration">
        <div class="insp-label">${esc(COPY.inspirationLabel)}</div>
        <p class="insp-text">${esc(inspiration)}</p>
      </div>` : '';

  const { tweakHtml, tweakConfigJson } = buildTweakParts(design);

  const prevName = prev && localizedName(prev, 'name', prev.id);
  const nextName = next && localizedName(next, 'name', next.id);
  const studioPagerHtml = hasSiblings ? `
    <nav class="pager">
      <a class="step prev" href="${esc(prev.id)}-studio.html">
        <div class="step-info">
          <div class="step-label">${esc(COPY.prevLabel)}</div>
          <div class="step-name">${esc(prevName)}</div>
        </div>
      </a>
      <a class="step next" href="${esc(next.id)}-studio.html">
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
  <title>${esc(designName)} · ${esc(COPY.brand)}</title>
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
  <nav class="wis-nav">
    <a class="wis-nav-back" href="index.html"><span>←</span><span>${esc(COPY.backToPreview)}</span></a>
    <div class="wis-brand">${esc(COPY.brand)}</div>
    <div class="wis-pb">${esc(COPY.poweredByLabel)} <a href="https://github.com/wyx-sg/wedding-invitation-skill" target="_blank" rel="noopener">wedding-invitation-skill</a>${esc(COPY.poweredBySuffix)}</div>
  </nav>

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
        ${category ? `<div class="category">${esc(category)}</div>` : ''}
        <h1 class="style-name">${esc(designName)}</h1>
        ${meta.short ? `<div class="style-short">${esc(meta.short)}</div>` : ''}
      </div>

      ${longHtml}

      ${inspirationHtml}

      ${tweakHtml}

      ${studioPagerHtml}
    </div>
  </main>

  <script>${PHOTO_SWITCHER_IIFE_SCRIPT};</script>
  <script>${TWEAK_IIFE_SCRIPT};</script>
  <script>${ZOOM_IIFE_SCRIPT};</script>
</body>
</html>
`;
}

// --- galleries ---

// Stage-5 final gallery: PNG thumbnails, cards link to <id>-page.html for
// download. Replaces dist/index.html with the deliverable view.
export function finalGalleryHtml() {
  const cards = designs.map(d => {
    const name = localizedName(d, 'name', d.id);
    const short = d.meta?.short || '';
    return `<a class="card" href="${esc(d.id)}-page.html">
      <div class="thumb"><img src="png/social/${esc(d.id)}.png" alt="${esc(name)}" loading="lazy"></div>
      <div class="meta">
        <div class="name">${esc(name)}</div>
        ${short ? `<div class="desc">${esc(short)}</div>` : ''}
      </div>
    </a>`;
  }).join('\n');

  return galleryShellHtml({
    title: COPY.pageTitle,
    tagline: designs.length === 1 ? COPY.singleTagline : COPY.multiTagline,
    cardsHtml: cards,
  });
}

// Stage-4 navigation gallery: live iframe previews, cards link to
// <id>-studio.html for tweaking. Lazy-loads iframes via loading="lazy".
// Also hosts the consolidated "Copy tweaks" block — the user iterates
// across multiple studios; this is the one place that summarizes every
// design's tweak state in one paste.
export function navGalleryHtml() {
  const cards = designs.map(d => {
    const name = localizedName(d, 'name', d.id);
    const short = d.meta?.short || '';
    return `<a class="card" href="${esc(d.id)}-studio.html">
      <div class="thumb thumb-iframe">
        <iframe src="${esc(d.id)}.html" data-design-id="${esc(d.id)}" loading="lazy" scrolling="no" frameborder="0" title="${esc(name)}"></iframe>
      </div>
      <div class="meta">
        <div class="name">${esc(name)}</div>
        ${short ? `<div class="desc">${esc(short)}</div>` : ''}
      </div>
    </a>`;
  }).join('\n');

  // Inject minimal per-design data the Copy script needs to format a
  // human-readable summary across all designs.
  const tweakSummaryData = designs.map(d => ({
    id: d.id,
    displayName: localizedName(d, 'name', d.id),
    tweak: d.tweak_options || null,
  }));

  const copyHintLabel = COPY.tweakExportHint;
  const copyButtonLabel = COPY.tweakExportLabel;
  const copyButtonCopied = COPY.tweakExportCopied;
  const noTweaksMsg = lang === 'zh' ? '我还没微调过任何设计。' : "I haven't tweaked any designs yet.";

  const exportHeader = `
  <section class="nav-export">
    <p class="nav-export-hint">${esc(copyHintLabel)}</p>
    <button type="button" class="nav-export-btn" id="nav-export-btn">${esc(copyButtonLabel)}</button>
  </section>
  <script>
    window.__NAV_SUMMARY__ = {
      designs: ${JSON.stringify(tweakSummaryData).replace(/</g, '\\u003c').replace(/>/g, '\\u003e').replace(/&/g, '\\u0026')},
      lang: ${JSON.stringify(lang)},
      copy: ${JSON.stringify({
        intro: '{name}',
        color: COPY.tweakColorLabel,
        headline: COPY.tweakHeadlineSub,
        body: COPY.tweakBodySub,
        frame: COPY.tweakFrameLabel,
        show: lang === 'zh' ? '显示' : 'Show',
        hide: lang === 'zh' ? '隐藏' : 'Hide',
        sep: lang === 'zh' ? '、' : ', ',
        noTweaks: noTweaksMsg,
        copied: copyButtonCopied,
        label: copyButtonLabel,
        sectionTitle: lang === 'zh' ? '我对设计做了以下微调：' : 'My tweaks across the designs:',
      })}
    };
  </script>
  <script>${NAV_EXPORT_IIFE_SCRIPT};</script>`;

  return galleryShellHtml({
    title: COPY.pageTitle,
    tagline: COPY.previewTagline,
    cardsHtml: cards,
    headerExtraHtml: exportHeader,
  });
}

// Shared HTML shell used by both galleries — nav bar + tagline +
// optional `headerExtraHtml` slot (above the grid) + grid + optional
// `footerHtml` slot. No big h1 — the nav bar already says "婚礼请帖".
function galleryShellHtml({ title, tagline, cardsHtml, headerExtraHtml = '', footerHtml = '' }) {
  return `<!DOCTYPE html>
<html lang="${lang === 'zh' ? 'zh-CN' : 'en'}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${esc(title)}</title>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300&family=Inter:wght@300;400;500&family=Noto+Serif+SC:wght@400;500&display=swap">
  <style>${GALLERY_CSS}</style>
</head>
<body>
  <nav class="wis-nav">
    <div class="wis-brand">${esc(COPY.brand)}</div>
    <div class="wis-pb">${esc(COPY.poweredByLabel)} <a href="https://github.com/wyx-sg/wedding-invitation-skill" target="_blank" rel="noopener">wedding-invitation-skill</a>${esc(COPY.poweredBySuffix)}</div>
  </nav>
  <header class="hero">
    <p class="tagline">${esc(tagline)}</p>
  </header>
  ${headerExtraHtml}
  <main>
    <div class="grid">
      ${cardsHtml}
    </div>
  </main>
  ${footerHtml}
</body>
</html>
`;
}

// --- main ---
// Stage 5 deliverable: per-design detail pages + final gallery (PNG thumbnails,
// linking to detail). Run via `node scripts/build-gallery.js` or `npm run gallery`.
// Stage 4 surface (studio + nav-gallery) is in build-studio.js, which imports
// from this file.

import { pathToFileURL } from 'node:url';
const isMain = import.meta.url === pathToFileURL(process.argv[1]).href;

if (isMain) {
  designs.forEach((d, i) => {
    fs.writeFileSync(path.join(DIST_DIR, `${d.id}-page.html`), detailHtml(d, i));
    console.log(`[gallery] → dist/${d.id}-page.html (detail)`);
  });
  fs.writeFileSync(path.join(DIST_DIR, 'index.html'), finalGalleryHtml());
  console.log(`[gallery] → dist/index.html (final gallery, ${designs.length} design${designs.length > 1 ? 's' : ''})`);
  console.log('[gallery] Done. Open dist/index.html in a browser.');
}
