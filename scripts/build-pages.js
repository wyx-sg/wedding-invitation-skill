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
    padding: 64px 32px 32px;
    text-align: center;
  }
  h1 {
    font-family: 'Cormorant Garamond', serif;
    font-weight: 300;
    font-size: 56px;
    letter-spacing: 6px;
    margin: 0 0 14px;
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
    font-size: 19px;
    color: #a89878;
    max-width: 680px;
    margin: 0 auto 32px;
    line-height: 1.6;
  }
  .actions {
    display: flex;
    gap: 12px;
    justify-content: center;
    margin-bottom: 24px;
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
  .note {
    max-width: 680px;
    margin: 24px auto 0;
    font-size: 13px;
    color: var(--text-muted);
    font-style: italic;
  }
  main {
    max-width: 1400px;
    margin: 0 auto;
    padding: 32px 24px 72px;
  }
  .group-label {
    font-family: 'Cormorant Garamond', serif;
    font-style: italic;
    font-size: 14px;
    letter-spacing: 6px;
    text-transform: uppercase;
    color: var(--text-muted);
    margin: 32px 8px 16px;
    border-bottom: 1px solid var(--border-soft);
    padding-bottom: 10px;
  }
  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: 28px;
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
  @media (max-width: 600px) {
    h1 { font-size: 36px; letter-spacing: 4px; }
    header.hero { padding: 48px 20px 24px; }
    .tagline { font-size: 16px; }
  }
`;

const DETAIL_CSS = `
  ${SHARED_CSS}
  main {
    max-width: 880px;
    margin: 0 auto;
    padding: 56px 32px 64px;
  }
  .style-header {
    text-align: center;
    margin-bottom: 36px;
  }
  .style-culture {
    display: inline-block;
    padding: 5px 14px;
    font-size: 10px;
    letter-spacing: 4px;
    text-transform: uppercase;
    color: var(--accent-warm);
    border: 1px solid var(--border);
    border-radius: 999px;
    margin-bottom: 16px;
  }
  .style-name {
    font-family: 'Cormorant Garamond', serif;
    font-weight: 300;
    font-size: 48px;
    letter-spacing: 4px;
    color: var(--accent);
    margin-bottom: 10px;
    text-transform: lowercase;
  }
  .style-short {
    font-family: 'Cormorant Garamond', 'Noto Serif SC', serif;
    font-style: italic;
    font-size: 17px;
    color: #a89878;
  }
  .preview {
    display: flex;
    justify-content: center;
    margin: 32px 0 48px;
    padding: 32px;
    background: linear-gradient(180deg, #1a1410 0%, #110c08 100%);
    border-radius: 8px;
    border: 1px solid var(--border-soft);
  }
  .preview iframe {
    width: 420px;
    border: none;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.8);
    background: white;
    display: block;
  }
  .style-long {
    font-family: 'Cormorant Garamond', 'Noto Serif SC', serif;
    font-size: 17px;
    line-height: 1.8;
    color: var(--text);
    max-width: 640px;
    margin: 0 auto 40px;
    text-align: center;
    font-style: italic;
  }
  .specs {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: 24px;
    margin: 40px 0 48px;
    padding: 28px;
    background: var(--bg-card);
    border-radius: 6px;
    border: 1px solid var(--border-soft);
  }
  .spec-label {
    font-size: 10px;
    letter-spacing: 4px;
    text-transform: uppercase;
    color: var(--text-muted);
    margin-bottom: 10px;
  }
  .spec-value {
    font-size: 13px;
    color: var(--text);
    line-height: 1.6;
  }
  .palette-row {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
  }
  .swatch {
    width: 32px;
    height: 32px;
    border-radius: 4px;
    border: 1px solid var(--border);
    cursor: default;
    position: relative;
  }
  .swatch:hover::after {
    content: attr(data-color);
    position: absolute;
    bottom: calc(100% + 6px);
    left: 50%;
    transform: translateX(-50%);
    background: var(--bg-elevated);
    color: var(--accent);
    padding: 4px 8px;
    font-size: 10px;
    letter-spacing: 1px;
    border-radius: 3px;
    white-space: nowrap;
    border: 1px solid var(--border);
  }
  .fonts-row, .motifs-row {
    font-family: 'Cormorant Garamond', serif;
    font-style: italic;
  }
  .pager {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
    margin-top: 56px;
  }
  .pager .step {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 20px;
    background: var(--bg-card);
    border: 1px solid var(--border-soft);
    border-radius: 6px;
    text-decoration: none;
    color: inherit;
    transition: border-color 0.2s, transform 0.2s;
  }
  .pager .step:hover { border-color: var(--accent-warm); transform: translateY(-2px); }
  .pager .step.next { flex-direction: row-reverse; text-align: right; }
  .pager .step-thumb {
    width: 60px;
    height: 80px;
    flex-shrink: 0;
    border-radius: 3px;
    overflow: hidden;
    background: #000;
  }
  .pager .step-thumb img { width: 100%; height: 100%; object-fit: cover; display: block; }
  .pager .step-info { flex: 1; min-width: 0; }
  .pager .step-label {
    font-size: 10px;
    letter-spacing: 3px;
    text-transform: uppercase;
    color: var(--text-muted);
    margin-bottom: 4px;
  }
  .pager .step-name {
    font-family: 'Cormorant Garamond', serif;
    font-style: italic;
    font-size: 18px;
    color: var(--accent);
  }
  footer {
    max-width: 880px;
    margin: 0 auto;
    padding: 48px 32px 72px;
    text-align: center;
    color: var(--text-muted);
    font-size: 13px;
    border-top: 1px solid var(--border-soft);
  }
  footer a { color: var(--accent-warm); text-decoration: none; }
  footer a:hover { color: var(--accent); }
  @media (max-width: 600px) {
    main { padding: 32px 16px 48px; }
    .preview { padding: 16px; }
    .preview iframe { width: 100%; max-width: 420px; }
    .style-name { font-size: 36px; letter-spacing: 2px; }
    .pager { grid-template-columns: 1fr; }
    .pager .step.next { flex-direction: row; text-align: left; }
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

  // Group templates by culture
  const grouped = new Map();
  for (const id of templateIds) {
    const meta = STYLE_META[id];
    const cult = meta?.culture[lang] || 'Other';
    if (!grouped.has(cult)) grouped.set(cult, []);
    grouped.get(cult).push(id);
  }

  // Stable group order
  const groupOrder = lang === 'en'
    ? ['Chinese', 'Japanese', 'Korean', 'South Asian', 'Middle Eastern', 'Latin', 'European', 'Contemporary', 'Themed']
    : ['中式', '日式', '韩式', '南亚', '中东', '拉美', '欧式', '当代', '主题'];

  const sections = groupOrder
    .filter(g => grouped.has(g))
    .map(g => {
      const cards = grouped.get(g).map(id => {
        const meta = STYLE_META[id] || {};
        return `        <a class="card" href="${id}.html">
          <div class="thumb"><img src="thumbnails/${id}.png" alt="${meta.name || id}" loading="lazy"></div>
          <div class="meta">
            <div class="name">${meta.name || id}</div>
            <div class="desc">${meta.short?.[lang] || ''}</div>
            <div class="culture">${meta.culture?.[lang] || ''}</div>
          </div>
        </a>`;
      }).join('\n');
      return `      <div class="group-label">${g}</div>
      <div class="grid">
${cards}
      </div>`;
    }).join('\n');

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

  // Localized fields embedded via data attrs (JS toggle picks the right one)
  const t = (en, zh) => `<span data-i18n data-en="${en.replace(/"/g, '&quot;')}" data-zh="${zh.replace(/"/g, '&quot;')}">${en}</span>`;

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

  <main>
    <div class="style-header">
      <div class="style-culture" data-i18n data-en="${meta.culture?.en || ''}" data-zh="${meta.culture?.zh || ''}">${meta.culture?.en || ''}</div>
      <h1 class="style-name">${meta.name}</h1>
      <div class="style-short" data-i18n data-en="${meta.short?.en || ''}" data-zh="${meta.short?.zh || ''}">${meta.short?.en || ''}</div>
    </div>

    <div class="preview">
      <iframe src="invitations/${templateId}.html" width="420" height="${height}" loading="lazy" title="${meta.name} invitation preview"></iframe>
    </div>

    <p class="style-long" data-i18n data-en="${(meta.long?.en || '').replace(/"/g, '&quot;')}" data-zh="${(meta.long?.zh || '').replace(/"/g, '&quot;')}">${meta.long?.en || ''}</p>

    <div class="specs">
      <div>
        <div class="spec-label" data-i18n data-en="${COPY.en.paletteLabel}" data-zh="${COPY.zh.paletteLabel}">${COPY.en.paletteLabel}</div>
        <div class="spec-value palette-row">${paletteSwatches}</div>
      </div>
      <div>
        <div class="spec-label" data-i18n data-en="${COPY.en.fontsLabel}" data-zh="${COPY.zh.fontsLabel}">${COPY.en.fontsLabel}</div>
        <div class="spec-value fonts-row">${fonts}</div>
      </div>
      <div>
        <div class="spec-label" data-i18n data-en="${COPY.en.motifsLabel}" data-zh="${COPY.zh.motifsLabel}">${COPY.en.motifsLabel}</div>
        <div class="spec-value motifs-row" data-i18n data-en="${(meta.motifs?.en || '').replace(/"/g, '&quot;')}" data-zh="${(meta.motifs?.zh || '').replace(/"/g, '&quot;')}">${meta.motifs?.en || ''}</div>
      </div>
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
  </main>

  <footer>
    <span data-i18n data-en="${COPY.en.footerLead}" data-zh="${COPY.zh.footerLead}">${COPY.en.footerLead}</span>
    <a href="https://github.com/wyx-sg/wedding-invitation-skill"><span data-i18n data-en="${COPY.en.footerLink}" data-zh="${COPY.zh.footerLink}">${COPY.en.footerLink}</span></a>
    <span data-i18n data-en="${COPY.en.footerTail}" data-zh="${COPY.zh.footerTail}">${COPY.en.footerTail}</span>
  </footer>

  <script>
    (function () {
      const saved = localStorage.getItem('wis-lang');
      const lang = saved === 'zh' ? 'zh' : 'en';

      function apply(lang) {
        document.documentElement.lang = lang === 'zh' ? 'zh-CN' : 'en';
        document.querySelectorAll('[data-i18n]').forEach(el => {
          const v = el.getAttribute('data-' + lang);
          if (v !== null) el.textContent = v;
        });
        document.querySelectorAll('.lang-switch button').forEach(b => {
          b.classList.toggle('current', b.dataset.setLang === lang);
        });
        // Back link goes to the right gallery
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
          apply(l);
        });
      });

      apply(lang);
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
