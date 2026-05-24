// Build the GitHub Pages site under docs/.
//
//   node scripts/build-pages.js
//
// Output:
//   docs/index.html               — EN landing page (gallery)
//   docs/index.zh.html            — ZH landing page (gallery)
//   docs/<style-id>.html          — detail page with iframe + meta + prev/next
//                                   (JS toggle for EN/ZH copy)
//   docs/invitations/<style>.html — raw rendered invitation (iframe src)
//   docs/thumbnails/<style>.png   — thumbnails copied from examples/thumbnails/

import fs from 'node:fs';
import path from 'node:path';
import { fixtureFor, render } from './fixtures.js';
import { STYLE_META } from './style-meta.js';

const ROOT = path.resolve(import.meta.dirname, '..');
const EXAMPLES_DIR = path.join(ROOT, 'examples');
const PHOTOS_DIR = path.join(EXAMPLES_DIR, 'photos');
const THUMBS_DIR = path.join(EXAMPLES_DIR, 'thumbnails');
const DOCS_DIR = path.join(ROOT, 'docs');
const SITE_THUMBS_DIR = path.join(DOCS_DIR, 'thumbnails');
const INV_DIR = path.join(DOCS_DIR, 'invitations');

const COPY = {
  en: {
    title: 'Wedding Invitation Skill — 20 World-Culture Examples',
    description: 'An AI-agent skill that designs your wedding invitation from a conversation. 20 example designs across Chinese, Japanese, Korean, Indian, Middle Eastern, Latin, French, and contemporary aesthetics.',
    brand: 'Wedding Invitation',
    h1Pre: 'Wedding',
    h1Post: 'Invitation',
    tagline: 'An AI-agent skill that designs your wedding invitation from a conversation — any language, any aesthetic, rendered locally, never uploaded.',
    btnGithub: 'View on GitHub',
    btnQuickStart: 'Quick Start',
    note: 'The 20 examples below were each designed from scratch for a different aesthetic. Your invitation will be designed fresh in your chosen language. Click any to see it in full.',
    paletteLabel: 'Palette',
    fontsLabel: 'Typography',
    motifsLabel: 'Decorative Motifs',
    cultureLabel: 'Cultural Origin',
    inspirationLabel: 'Design Inspiration',
    backToGallery: 'All Examples',
    prevLabel: 'Previous',
    nextLabel: 'Next',
    footerLead: 'Built with the',
    footerLink: 'wedding-invitation skill',
    footerTail: '· MIT License · No data leaves your machine.'
  },
  zh: {
    title: '婚礼请帖 Skill — 20 张跨文化样例',
    description: '一个 AI agent skill，通过对话为你设计专属婚礼请帖。20 张样例覆盖中式、日式、韩式、印度、阿拉伯、拉丁、法式以及欧美当代各种 aesthetic。',
    brand: '婚礼请帖',
    h1Pre: '婚礼',
    h1Post: '请帖',
    tagline: '一个 AI agent skill，通过对话为你设计专属婚礼请帖 — 任意语言、任意风格、本地渲染、数据不外传。',
    btnGithub: '查看 GitHub',
    btnQuickStart: '快速开始',
    note: '下面 20 张样例每一张都为不同 aesthetic 从零设计的。你的请帖会用你选择的语言重新设计。点任意一张看完整效果。',
    paletteLabel: '配色',
    fontsLabel: '字体',
    motifsLabel: '装饰元素',
    cultureLabel: '文化起源',
    inspirationLabel: '设计灵感',
    backToGallery: '所有样例',
    prevLabel: '上一个',
    nextLabel: '下一个',
    footerLead: '由',
    footerLink: 'wedding-invitation skill',
    footerTail: '生成 · MIT 许可 · 数据不出本机。'
  }
};

// --- shared CSS (used by gallery + detail pages) ---

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
  .nav-brand:hover { color: #f0d8b0; }
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
  .nav-back .arrow { font-size: 16px; transition: transform 0.2s; }
  .nav-back:hover .arrow { transform: translateX(-3px); }
  .lang-switch {
    font-size: 12px;
    letter-spacing: 2px;
    color: var(--text-muted);
    display: inline-flex;
    align-items: center;
    gap: 8px;
  }
  .lang-switch a, .lang-switch button {
    color: var(--accent);
    text-decoration: none;
    background: none;
    border: none;
    cursor: pointer;
    font: inherit;
    letter-spacing: inherit;
    padding: 0;
    border-bottom: 1px solid transparent;
    transition: border-color 0.2s;
  }
  .lang-switch a:hover, .lang-switch button:hover { border-bottom-color: var(--accent); }
  .lang-switch .current { color: var(--text-muted); cursor: default; }
  .lang-switch .sep { color: var(--border); }
  @media (max-width: 600px) {
    .nav-bar .inner { padding: 12px 16px; gap: 12px; }
    .nav-brand { font-size: 14px; letter-spacing: 2px; }
    .nav-back { font-size: 11px; letter-spacing: 2px; }
  }
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
    font-size: 40px;
    letter-spacing: 5px;
    margin: 0 0 8px;
    color: var(--accent);
    text-transform: uppercase;
  }
  h1 .amp {
    font-style: italic;
    color: var(--accent-warm);
    margin: 0 8px;
  }
  .tagline {
    font-family: 'Cormorant Garamond', 'Noto Serif SC', serif;
    font-style: italic;
    font-size: 16px;
    color: #a89878;
    max-width: 640px;
    margin: 0 auto 16px;
    line-height: 1.5;
    text-wrap: balance;
  }
  .actions {
    display: flex;
    gap: 12px;
    justify-content: center;
    margin-bottom: 0;
    flex-wrap: wrap;
  }
  .btn {
    display: inline-block;
    padding: 11px 24px;
    border: 1px solid var(--accent);
    color: var(--accent);
    text-decoration: none;
    font-size: 12px;
    letter-spacing: 4px;
    text-transform: uppercase;
    border-radius: 2px;
    transition: all 0.2s;
  }
  .btn:hover { background: var(--accent); color: var(--bg); }
  .btn.primary { background: var(--accent); color: var(--bg); }
  .btn.primary:hover { background: var(--accent-warm); border-color: var(--accent-warm); }
  .note { display: none; }
  main {
    max-width: 1680px;
    margin: 0 auto;
    padding: 32px 40px 64px;
  }
  .group-label {
    font-family: 'Cormorant Garamond', serif;
    font-style: italic;
    font-size: 13px;
    letter-spacing: 5px;
    text-transform: uppercase;
    color: var(--text-muted);
    margin: 16px 8px 10px;
    border-bottom: 1px solid var(--border-soft);
    padding-bottom: 8px;
  }
  .group-label:first-of-type { margin-top: 0; }
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
  .culture {
    font-size: 10px;
    color: var(--text-muted);
    margin-top: 8px;
    letter-spacing: 3px;
    text-transform: uppercase;
  }
  footer {
    max-width: 1280px;
    margin: 0 auto;
    padding: 32px 32px 64px;
    text-align: center;
    color: var(--text-muted);
    font-size: 13px;
    border-top: 1px solid var(--border-soft);
  }
  footer a { color: var(--accent-warm); text-decoration: none; }
  footer a:hover { color: var(--accent); }
  @media (max-width: 960px) {
    main { padding: 24px 24px 48px; }
    .grid { grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 20px; max-width: 720px; margin: 0 auto; }
    h1 { font-size: 36px; letter-spacing: 4px; }
    header.hero { padding: 20px 24px 16px; }
  }
  @media (max-width: 600px) {
    main { padding: 20px 16px 40px; }
    .grid { grid-template-columns: 1fr; max-width: 360px; gap: 18px; }
    h1 { font-size: 30px; letter-spacing: 3px; }
    header.hero { padding: 16px 16px 12px; }
    .tagline { font-size: 14px; }
    .btn { padding: 10px 18px; font-size: 11px; letter-spacing: 3px; }
  }
`;

const DETAIL_CSS = `
  ${SHARED_CSS}

  /* Natural page scroll. Card stays vertically centered at any zoom; if it
     exceeds the viewport, the page scrolls. Nothing is ever pinned to top. */
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
    align-items: center;
    justify-content: center;
    min-height: 0;
    position: relative;
  }
  /* Zoom controls overlay (PC only) — fade in on hover */
  .zoom-controls {
    position: absolute;
    bottom: 16px;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    gap: 2px;
    padding: 4px;
    background: rgba(14, 11, 7, 0.85);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    border: 1px solid var(--border);
    border-radius: 999px;
    opacity: 0.6;
    transition: opacity 0.2s;
    z-index: 10;
  }
  .preview:hover .zoom-controls,
  .zoom-controls:hover,
  .zoom-controls:focus-within { opacity: 1; }
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
    .zoom-controls { display: none; }
  }
  /* The card frame: shadow + thin gold hairline. No outer box. */
  .preview .frame {
    width: calc(var(--tpl-w) * var(--iframe-scale));
    height: calc(var(--tpl-h) * var(--iframe-scale));
    overflow: hidden;
    border-radius: 3px;
    background: #fff;
    box-shadow:
      0 40px 90px -20px rgba(0, 0, 0, 0.85),
      0 0 0 1px rgba(212, 184, 150, 0.08);
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

  /* Right column: fixed-width sidebar, content can flow naturally. */
  .detail-info {
    flex: 0 0 480px;
    max-width: 480px;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 22px;
  }

  /* Header block — magazine masthead style. */
  .style-header { line-height: 1; }
  .style-culture {
    display: inline-block;
    font-size: 10px;
    letter-spacing: 5px;
    text-transform: uppercase;
    color: var(--accent-warm);
    padding-bottom: 4px;
    border-bottom: 1px solid var(--border);
    margin-bottom: 18px;
  }
  .style-name {
    font-family: 'Cormorant Garamond', serif;
    font-weight: 300;
    font-size: 52px;
    letter-spacing: 1px;
    color: var(--accent);
    text-transform: lowercase;
    line-height: 1;
    margin: 0 0 10px;
  }
  .style-short {
    font-family: 'Cormorant Garamond', 'Noto Serif SC', serif;
    font-style: italic;
    font-size: 17px;
    color: #b9a47f;
    line-height: 1.4;
  }

  /* Long description — no box, just type. */
  .style-long {
    font-family: 'Cormorant Garamond', 'Noto Serif SC', serif;
    font-size: 15px;
    line-height: 1.75;
    color: var(--text);
    font-style: italic;
    text-wrap: balance;
    overflow-wrap: anywhere;
    margin: 0;
    max-width: 100%;
  }

  /* Inspiration — pulled quote with decorative mark. */
  .inspiration {
    position: relative;
    padding: 0 0 0 28px;
    border-left: 1px solid var(--accent-warm);
    max-width: 100%;
  }
  .inspiration .insp-label {
    font-size: 9.5px;
    letter-spacing: 4px;
    text-transform: uppercase;
    color: var(--text-muted);
    margin-bottom: 8px;
  }
  .inspiration .insp-text {
    font-family: 'Cormorant Garamond', 'Noto Serif SC', serif;
    font-size: 14.5px;
    line-height: 1.7;
    color: var(--text);
    font-style: italic;
    text-wrap: balance;
    overflow-wrap: anywhere;
  }

  /* Specs — clean key/value rows, no card box. */
  .specs {
    display: grid;
    grid-template-columns: 88px 1fr;
    column-gap: 24px;
    row-gap: 14px;
    align-items: baseline;
    padding: 18px 0;
    border-top: 1px solid var(--border-soft);
    border-bottom: 1px solid var(--border-soft);
    max-width: 100%;
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
    word-break: break-word;
  }
  .palette-row { display: flex; gap: 8px; align-items: center; }
  .swatch {
    width: 22px;
    height: 22px;
    border-radius: 50%;
    border: 1px solid rgba(212, 184, 150, 0.18);
    position: relative;
    cursor: default;
  }
  .swatch:hover::after {
    content: attr(data-color);
    position: absolute;
    bottom: calc(100% + 8px);
    left: 50%;
    transform: translateX(-50%);
    background: var(--bg-elevated);
    color: var(--accent);
    padding: 5px 9px;
    font-size: 10px;
    letter-spacing: 1px;
    border-radius: 3px;
    white-space: nowrap;
    border: 1px solid var(--border);
  }
  .fonts-row, .motifs-row {
    font-family: 'Cormorant Garamond', 'Noto Serif SC', serif;
    font-style: italic;
  }

  /* Pager — minimal text + thumbnail, no box. */
  .pager {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 24px;
    max-width: 100%;
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
  .pager .step-thumb {
    width: 40px;
    height: 54px;
    flex-shrink: 0;
    border-radius: 2px;
    overflow: hidden;
    background: #000;
    box-shadow: 0 4px 12px rgba(0,0,0,0.5);
  }
  .pager .step-thumb img { width: 100%; height: 100%; object-fit: cover; display: block; }
  .pager .step-info { flex: 1; min-width: 0; overflow: hidden; }
  .pager .step-label {
    font-size: 9px;
    letter-spacing: 3px;
    text-transform: uppercase;
    color: var(--text-muted);
    margin-bottom: 3px;
  }
  .pager .step-name {
    font-family: 'Cormorant Garamond', serif;
    font-style: italic;
    font-size: 15px;
    color: var(--accent);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    transition: color 0.2s;
  }
  .pager .step:hover .step-name { color: #f0d8b0; }

  /* Tablet: still side-by-side but tighter */
  @media (max-width: 1280px) {
    main.detail { padding: 24px 32px; gap: 40px; }
    .style-name { font-size: 44px; }
  }

  /* Mobile: stack vertically. */
  @media (max-width: 960px) {
    body { background: var(--bg); }
    main.detail {
      flex-direction: column;
      align-items: center;
      justify-content: flex-start;
      padding: 20px 16px 48px;
      gap: 28px;
      min-height: auto;
    }
    .preview {
      flex: 0 0 auto;
      width: 100%;
    }
    .detail-info {
      flex: 0 0 auto;
      max-width: 560px;
      width: 100%;
      gap: 20px;
    }
    .style-long, .inspiration, .specs, .pager { max-width: 100%; }
    .style-name { font-size: 36px; letter-spacing: 1px; }
    .nav-bar .inner { padding: 14px 16px; gap: 12px; }
  }
  @media (max-width: 600px) {
    main.detail { padding: 16px 12px 40px; gap: 24px; }
    .style-name { font-size: 28px; letter-spacing: 1px; }
    .style-culture { font-size: 9.5px; letter-spacing: 4px; margin-bottom: 12px; }
    .pager { grid-template-columns: 1fr; gap: 14px; }
    .pager .step.next { flex-direction: row; text-align: left; }
    .specs { grid-template-columns: 80px 1fr; column-gap: 16px; row-gap: 10px; padding: 14px 0; }
    .nav-brand { font-size: 14px; letter-spacing: 2px; }
    .nav-back { font-size: 11px; letter-spacing: 2px; }
    .lang-switch { font-size: 11px; letter-spacing: 1px; }
  }
  /* Very narrow phones: hide brand to give back-link and lang-switch room */
  @media (max-width: 380px) {
    .nav-brand { display: none; }
  }
`;

// --- render helpers ---

function photoUrlFor(templateId) {
  const specific = path.join(PHOTOS_DIR, `${templateId}.jpg`);
  const fallback = path.join(PHOTOS_DIR, 'placeholder-couple.jpg');
  const chosen = fs.existsSync(specific) ? specific : fallback;
  return 'data:image/jpeg;base64,' + fs.readFileSync(chosen).toString('base64');
}

function renderInvitation(templateId) {
  const tplPath = path.join(EXAMPLES_DIR, `${templateId}.html`);
  const tpl = fs.readFileSync(tplPath, 'utf8');
  const heightMatch = tpl.match(/\.card\s*\{[^}]*?height:\s*(\d+)px/);
  const height = heightMatch ? parseInt(heightMatch[1], 10) : 560;

  const designCtx = {
    id: templateId,
    name_zh: '',
    name_en: '',
    primary_photo: '_placeholder',
    primary_photo_url: photoUrlFor(templateId),
    width: 420,
    height
  };

  let html = render(tpl, { ...fixtureFor(templateId), design: designCtx });
  // Strip body padding so the iframe sees just the card
  const frame = `<style id="__pages_frame__">
    html, body { margin: 0; padding: 0; background: transparent; width: 420px; height: ${height}px; overflow: hidden; }
    body > .card { box-shadow: none; margin: 0; }
  </style></head>`;
  html = html.replace(/<\/head>/, frame);
  return { html, height };
}

// --- gallery (index) ---

function indexHtml(templateIds, lang) {
  const c = COPY[lang];
  const otherLang = lang === 'en' ? 'zh' : 'en';
  const otherHref = otherLang === 'en' ? 'index.html' : 'index.zh.html';
  const otherLabel = otherLang === 'en' ? 'English' : '简体中文';
  const langLabel = lang === 'en' ? 'English' : '简体中文';

  // Flat tile — no grouping
  const cards = templateIds.map(id => {
    const meta = STYLE_META[id] || {};
    return `      <a class="card" href="${id}.html">
        <div class="thumb"><img src="thumbnails/${id}.png" alt="${meta.name || id}" loading="lazy"></div>
        <div class="meta">
          <div class="name">${meta.name || id}</div>
          <div class="desc">${meta.short?.[lang] || ''}</div>
          <div class="culture">${meta.culture?.[lang] || ''}</div>
        </div>
      </a>`;
  }).join('\n');
  const sections = `    <div class="grid">
${cards}
    </div>`;

  return `<!DOCTYPE html>
<html lang="${lang === 'zh' ? 'zh-CN' : 'en'}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${c.title}</title>
  <meta name="description" content="${c.description}">
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300&family=Inter:wght@300;400;500&family=Noto+Serif+SC:wght@400;500&display=swap">
  <style>${GALLERY_CSS}</style>
</head>
<body>
  <nav class="nav-bar">
    <div class="inner">
      <a class="nav-brand" href="${lang === 'zh' ? 'index.zh.html' : 'index.html'}">${c.brand}</a>
      <div class="lang-switch">
        <span class="current">${langLabel}</span><span class="sep">·</span><a href="${otherHref}">${otherLabel}</a>
      </div>
    </div>
  </nav>

  <header class="hero">
    <h1>${c.h1Pre} <span class="amp">&amp;</span> ${c.h1Post}</h1>
    <p class="tagline">${c.tagline}</p>
    <div class="actions">
      <a class="btn primary" href="https://github.com/wyx-sg/wedding-invitation-skill">${c.btnGithub}</a>
      <a class="btn" href="https://github.com/wyx-sg/wedding-invitation-skill#quick-start">${c.btnQuickStart}</a>
    </div>
    <p class="note">${c.note}</p>
  </header>

  <main>
${sections}
  </main>

  <footer>
    ${c.footerLead} <a href="https://github.com/wyx-sg/wedding-invitation-skill">${c.footerLink}</a> ${c.footerTail}
  </footer>
</body>
</html>
`;
}

// --- detail page (JS toggle for EN/ZH) ---

function detailHtml(templateId, prevId, nextId, height) {
  const meta = STYLE_META[templateId] || {};
  const paletteSwatches = (meta.palette || []).map(c =>
    `<span class="swatch" data-color="${c}" style="background:${c}"></span>`
  ).join('');
  const fonts = (meta.fonts || []).join(' · ');

  // Iframe scale handled by CSS variable --iframe-scale. The .frame
  // wrapper computes its size via calc() so it always matches.

  const prevMeta = STYLE_META[prevId] || {};
  const nextMeta = STYLE_META[nextId] || {};

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${meta.name} — Wedding Invitation Skill</title>
  <meta name="description" content="${meta.long?.en || ''}">
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300;1,400&family=Inter:wght@300;400;500&family=Noto+Serif+SC:wght@400;500&display=swap">
  <style>
    :root {
      --tpl-w: 420px;
      --tpl-h: ${height}px;
      /* Scale is computed by JS on load + resize (CSS calc with mixed units
         had unreliable resolution across browsers). Fallback = native size. */
      --iframe-scale-auto: 1;
      --iframe-scale-default: 1.32;
      --iframe-scale: var(--iframe-scale-override, var(--iframe-scale-default));
    }
  </style>
  <script>
    /* Compute scale BEFORE first paint to avoid a flash at the fallback size. */
    (function () {
      const TPL_H = ${height};
      const isMobile = matchMedia('(max-width: 960px)').matches;
      function compute() {
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        let auto, def;
        if (isMobile || matchMedia('(max-width: 960px)').matches) {
          auto = Math.min(1, (vw - 48) / 420);
          def = auto;
        } else {
          const byW = (vw - 616) / 420;
          const byH = (vh - 108) / TPL_H;
          auto = Math.max(0.9, Math.min(byW, byH, 2.5));
          def = auto * 0.87;
        }
        const root = document.documentElement;
        root.style.setProperty('--iframe-scale-auto', String(auto));
        root.style.setProperty('--iframe-scale-default', String(def));
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
      <a class="nav-back" href="index.html" id="back-link">
        <span class="arrow">←</span>
        <span data-i18n data-en="${COPY.en.backToGallery}" data-zh="${COPY.zh.backToGallery}">${COPY.en.backToGallery}</span>
      </a>
      <a class="nav-brand" href="index.html" id="brand-link" data-i18n data-en="${COPY.en.brand}" data-zh="${COPY.zh.brand}">${COPY.en.brand}</a>
      <div class="lang-switch">
        <button type="button" data-set-lang="en" class="lang-en">English</button>
        <span class="sep">·</span>
        <button type="button" data-set-lang="zh" class="lang-zh">简体中文</button>
      </div>
    </div>
  </nav>

  <main class="detail">
    <div class="preview">
      <div class="zoom-controls" role="toolbar" aria-label="Zoom invitation">
        <button class="zoom-btn" data-zoom="out" aria-label="Zoom out" title="Zoom out">−</button>
        <span class="zoom-level" id="zoom-level">100%</span>
        <button class="zoom-btn" data-zoom="in" aria-label="Zoom in" title="Zoom in">+</button>
        <button class="zoom-btn reset" data-zoom="reset" aria-label="Reset zoom" title="Fit to screen">⤢</button>
      </div>
      <div class="frame">
        <iframe src="invitations/${templateId}.html" frameborder="0" scrolling="no" loading="lazy" title="${meta.name} invitation preview"></iframe>
      </div>
    </div>

    <div class="detail-info">
      <div class="style-header">
        <div class="style-culture" data-i18n data-en="${meta.culture?.en || ''}" data-zh="${meta.culture?.zh || ''}">${meta.culture?.en || ''}</div>
        <h1 class="style-name">${meta.name}</h1>
        <div class="style-short" data-i18n data-en="${meta.short?.en || ''}" data-zh="${meta.short?.zh || ''}">${meta.short?.en || ''}</div>
      </div>

      <p class="style-long" data-i18n data-en="${(meta.long?.en || '').replace(/"/g, '&quot;')}" data-zh="${(meta.long?.zh || '').replace(/"/g, '&quot;')}">${meta.long?.en || ''}</p>

      <div class="inspiration">
        <div class="insp-label" data-i18n data-en="${COPY.en.inspirationLabel}" data-zh="${COPY.zh.inspirationLabel}">${COPY.en.inspirationLabel}</div>
        <p class="insp-text" data-i18n data-en="${(meta.inspiration?.en || '').replace(/"/g, '&quot;')}" data-zh="${(meta.inspiration?.zh || '').replace(/"/g, '&quot;')}">${meta.inspiration?.en || ''}</p>
      </div>

      <div class="specs">
        <div class="spec-label" data-i18n data-en="${COPY.en.paletteLabel}" data-zh="${COPY.zh.paletteLabel}">${COPY.en.paletteLabel}</div>
        <div class="spec-value palette-row">${paletteSwatches}</div>
        <div class="spec-label" data-i18n data-en="${COPY.en.fontsLabel}" data-zh="${COPY.zh.fontsLabel}">${COPY.en.fontsLabel}</div>
        <div class="spec-value fonts-row">${fonts}</div>
        <div class="spec-label" data-i18n data-en="${COPY.en.motifsLabel}" data-zh="${COPY.zh.motifsLabel}">${COPY.en.motifsLabel}</div>
        <div class="spec-value motifs-row" data-i18n data-en="${(meta.motifs?.en || '').replace(/"/g, '&quot;')}" data-zh="${(meta.motifs?.zh || '').replace(/"/g, '&quot;')}">${meta.motifs?.en || ''}</div>
      </div>

      <nav class="pager">
        <a class="step prev" href="${prevId}.html">
          <div class="step-thumb"><img src="thumbnails/${prevId}.png" alt="${prevMeta.name || ''}" loading="lazy"></div>
          <div class="step-info">
            <div class="step-label" data-i18n data-en="${COPY.en.prevLabel}" data-zh="${COPY.zh.prevLabel}">${COPY.en.prevLabel}</div>
            <div class="step-name">${prevMeta.name || ''}</div>
          </div>
        </a>
        <a class="step next" href="${nextId}.html">
          <div class="step-thumb"><img src="thumbnails/${nextId}.png" alt="${nextMeta.name || ''}" loading="lazy"></div>
          <div class="step-info">
            <div class="step-label" data-i18n data-en="${COPY.en.nextLabel}" data-zh="${COPY.zh.nextLabel}">${COPY.en.nextLabel}</div>
            <div class="step-name">${nextMeta.name || ''}</div>
          </div>
        </a>
      </nav>
    </div>
  </main>

  <script>
    (function () {
      // ----- Language toggle (persistent across pages) -----
      const saved = localStorage.getItem('wis-lang');
      const lang = saved === 'zh' ? 'zh' : 'en';

      function applyLang(lang) {
        document.documentElement.lang = lang === 'zh' ? 'zh-CN' : 'en';
        document.querySelectorAll('[data-i18n]').forEach(el => {
          const v = el.getAttribute('data-' + lang);
          if (v !== null) el.textContent = v;
        });
        document.querySelectorAll('.lang-switch button').forEach(b => {
          b.classList.toggle('current', b.dataset.setLang === lang);
        });
        const backHref = lang === 'zh' ? 'index.zh.html' : 'index.html';
        const back = document.getElementById('back-link');
        const brand = document.getElementById('brand-link');
        if (back) back.setAttribute('href', backHref);
        if (brand) brand.setAttribute('href', backHref);
      }
      document.querySelectorAll('.lang-switch button').forEach(b => {
        b.addEventListener('click', () => {
          const l = b.dataset.setLang;
          localStorage.setItem('wis-lang', l);
          applyLang(l);
        });
      });
      applyLang(lang);

      // ----- Zoom controls -----
      const ZOOM_KEY = 'wis-zoom';
      const root = document.documentElement;
      const levelEl = document.getElementById('zoom-level');

      function currentAuto() {
        const v = getComputedStyle(root).getPropertyValue('--iframe-scale-auto').trim();
        return parseFloat(v) || 1;
      }
      function currentDefault() {
        const v = getComputedStyle(root).getPropertyValue('--iframe-scale-default').trim();
        return parseFloat(v) || 1;
      }
      function currentScale() {
        const v = getComputedStyle(root).getPropertyValue('--iframe-scale').trim();
        return parseFloat(v) || 1;
      }
      /* % is relative to the default — so default shows 100%, zoom in shows >100%. */
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
        if (levelEl) levelEl.textContent = fmtPct(currentScale());
      }

      document.querySelectorAll('.zoom-btn').forEach(b => {
        b.addEventListener('click', () => {
          const op = b.dataset.zoom;
          if (op === 'reset') { applyZoom(null); return; }
          const cur = currentScale();
          applyZoom(op === 'in' ? cur * 1.15 : cur * 0.87);
        });
      });

      // Keyboard shortcuts: +/=/- and 0 for reset
      document.addEventListener('keydown', e => {
        if (e.target.matches('input, textarea')) return;
        if (e.key === '+' || e.key === '=') { applyZoom(currentScale() * 1.15); e.preventDefault(); }
        else if (e.key === '-' || e.key === '_') { applyZoom(currentScale() * 0.87); e.preventDefault(); }
        else if (e.key === '0') { applyZoom(null); e.preventDefault(); }
      });

      // Restore session zoom (per-tab); update level display on resize
      const restored = parseFloat(sessionStorage.getItem(ZOOM_KEY));
      if (restored && !isNaN(restored)) applyZoom(restored);
      else if (levelEl) levelEl.textContent = '100%';
      window.addEventListener('resize', () => {
        if (levelEl) levelEl.textContent = fmtPct(currentScale());
      });
    })();
  </script>
</body>
</html>
`;
}

// --- main ---

function main() {
  fs.mkdirSync(DOCS_DIR, { recursive: true });
  fs.mkdirSync(SITE_THUMBS_DIR, { recursive: true });
  fs.mkdirSync(INV_DIR, { recursive: true });

  // Clean stale top-level HTMLs and invitations
  for (const f of fs.readdirSync(DOCS_DIR)) {
    if (f.endsWith('.html')) fs.unlinkSync(path.join(DOCS_DIR, f));
  }
  for (const f of fs.readdirSync(INV_DIR)) {
    if (f.endsWith('.html')) fs.unlinkSync(path.join(INV_DIR, f));
  }

  // Copy thumbnails
  for (const f of fs.readdirSync(THUMBS_DIR)) {
    if (f.endsWith('.png')) {
      fs.copyFileSync(path.join(THUMBS_DIR, f), path.join(SITE_THUMBS_DIR, f));
    }
  }

  // Sort template ids in numeric order so prev/next is intuitive
  const templateIds = fs.readdirSync(EXAMPLES_DIR)
    .filter(f => f.endsWith('.html'))
    .map(f => f.replace(/\.html$/, ''))
    .sort();

  // 1. Raw invitation iframes
  const heights = {};
  for (const id of templateIds) {
    const { html, height } = renderInvitation(id);
    heights[id] = height;
    fs.writeFileSync(path.join(INV_DIR, `${id}.html`), html);
  }
  console.log(`[pages] → docs/invitations/ (${templateIds.length} raw invitations)`);

  // 2. Detail pages (with prev/next)
  for (let i = 0; i < templateIds.length; i++) {
    const id = templateIds[i];
    const prev = templateIds[(i - 1 + templateIds.length) % templateIds.length];
    const next = templateIds[(i + 1) % templateIds.length];
    fs.writeFileSync(path.join(DOCS_DIR, `${id}.html`), detailHtml(id, prev, next, heights[id]));
  }
  console.log(`[pages] → docs/<style>.html (${templateIds.length} detail pages)`);

  // 3. Galleries
  fs.writeFileSync(path.join(DOCS_DIR, 'index.html'), indexHtml(templateIds, 'en'));
  fs.writeFileSync(path.join(DOCS_DIR, 'index.zh.html'), indexHtml(templateIds, 'zh'));
  console.log(`[pages] → docs/index.html + docs/index.zh.html (gallery)`);

  console.log(`\n[pages] Done. ${templateIds.length} examples, gallery EN+ZH, detail pages with JS lang toggle.`);
}

main();
