// Build the GitHub Pages site under docs/.
//
// For each example template, fills in fixture data + base64-embeds the
// per-template photo so the HTML is self-contained. Generates an index.html
// gallery linking to each rendered invitation.
//
//   node scripts/build-pages.js
//
// Output:
//   docs/index.html               — landing page with 20-thumbnail gallery
//   docs/<style-id>.html          — pre-rendered invitation (self-contained)
//   docs/thumbnails/<style>.png   — thumbnails copied from examples/thumbnails/

import fs from 'node:fs';
import path from 'node:path';
import { render } from '../skeleton/scripts/template-engine.js';

const ROOT = path.resolve(import.meta.dirname, '..');
const EXAMPLES_DIR = path.join(ROOT, 'examples');
const PHOTOS_DIR = path.join(EXAMPLES_DIR, 'photos');
const THUMBS_DIR = path.join(EXAMPLES_DIR, 'thumbnails');
const DOCS_DIR = path.join(ROOT, 'docs');
const SITE_THUMBS_DIR = path.join(DOCS_DIR, 'thumbnails');

// Sample fixture data — anonymized Chinese couple, year 2099, Shanghai.
const FIXTURE = {
  names: {
    groom_zh: '林知言',
    groom_en: 'LIN ZHIYAN',
    groom_surname_en: 'LIN',
    bride_zh: '沈安然',
    bride_en: 'SHEN ANRAN',
    bride_surname_en: 'SHEN',
    couple_en_short: 'L & S'
  },
  date: {
    iso: '2099-10-01',
    zh_formal: '公元 二〇九九 年 十月一日',
    zh_short: '二〇九九年十月一日',
    en_long: 'October 1, 2099',
    en_short: '10.01.2099',
    en_compact: '10 · 01',
    weekday_zh: '星期一',
    weekday_en: 'Monday',
    lunar: '',
    zh_year: '二〇九九',
    zh_month_day: '十月一日',
    en_month: '10',
    en_day: '01',
    en_year: '2099',
    roman_year: 'MMXCIX'
  },
  time: {
    value: '18:00',
    zh_full: '傍晚 18:00 入席',
    zh_label: '恭候',
    hours: '18',
    minutes: '00'
  },
  venue: {
    full_zh: '上海 · 黄浦区 · 锦绣花园酒店',
    province_zh: '上海',
    province_en: 'SHANGHAI',
    city_zh: '上海',
    city_en: 'Shanghai',
    city_en_upper: 'SHANGHAI',
    lines_zh: ['黄浦区 永宁路 188 号', '锦绣花园酒店 宴会厅'],
    lines_en: ['188 Yongning Road, Huangpu District', 'Eternal Garden Hotel Ballroom'],
    type_zh: '酒店 · 宴会'
  },
  site: {
    title: '林知言 & 沈安然 · 婚礼请帖',
    subtitle: '2099.10.01 · 上海',
    intro: '',
    newspaper_title: 'The LIN Times'
  }
};

const STYLE_INFO = {
  'style01-new-chinese':      { name: 'new-chinese',      desc: 'refined traditional',     culture: 'Chinese' },
  'style02-modern-minimal':   { name: 'modern-minimal',   desc: 'scandi minimalism',       culture: 'Contemporary' },
  'style03-morandi':          { name: 'morandi',          desc: 'soft contemporary',       culture: 'Contemporary' },
  'style04-red-gold':         { name: 'red-gold',         desc: 'traditional banquet',     culture: 'Chinese' },
  'style05-vogue':            { name: 'vogue',            desc: 'editorial / fashion',     culture: 'European' },
  'style06-black-gold':       { name: 'black-gold',       desc: 'monogram / formal',       culture: 'Contemporary' },
  'style07-newspaper':        { name: 'newspaper',        desc: 'old-print broadsheet',    culture: 'European' },
  'style08-letter':           { name: 'letter',           desc: 'handwritten note',        culture: 'European' },
  'style09-gugong':           { name: 'gugong',           desc: 'chinese palace',          culture: 'Chinese' },
  'style10-mediterranean':    { name: 'mediterranean',    desc: 'destination / outdoor',   culture: 'Contemporary' },
  'style11-wabi-sabi':        { name: 'wabi-sabi',        desc: 'japanese restraint',      culture: 'Japanese' },
  'style12-art-deco':         { name: 'art-deco',         desc: 'gatsby glamour',          culture: 'European' },
  'style13-ink-flower':       { name: 'ink-flower',       desc: 'chinese ink painting',    culture: 'Chinese' },
  'style14-retro-poster':     { name: 'retro-poster',     desc: 'travel-poster',           culture: 'Themed' },
  'style15-vintage-stars':    { name: 'vintage-stars',    desc: 'celestial / night',       culture: 'Themed' },
  'style16-indian':           { name: 'indian',           desc: 'mandala / paisley',       culture: 'South Asian' },
  'style17-arabic':           { name: 'arabic',           desc: 'arabesque / mihrab',      culture: 'Middle Eastern' },
  'style18-latin':            { name: 'latin',            desc: 'papel picado / folk',     culture: 'Latin' },
  'style19-french-provence':  { name: 'french-provence',  desc: 'lavender / chateau',      culture: 'European' },
  'style20-korean-hanbok':    { name: 'korean-hanbok',    desc: 'traditional joseon',      culture: 'Korean' }
};

function photoUrlFor(templateId) {
  const specific = path.join(PHOTOS_DIR, `${templateId}.jpg`);
  const fallback = path.join(PHOTOS_DIR, 'placeholder-couple.jpg');
  const chosen = fs.existsSync(specific) ? specific : fallback;
  return 'data:image/jpeg;base64,' + fs.readFileSync(chosen).toString('base64');
}

function renderExample(templateId) {
  const tplPath = path.join(EXAMPLES_DIR, `${templateId}.html`);
  const tpl = fs.readFileSync(tplPath, 'utf8');

  // Probe height for canvases other than 560
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

  let html = render(tpl, { ...FIXTURE, design: designCtx });

  // Center the card on a moody dark background + drop shadow
  const frame = `<style id="__pages_frame__">
    html, body { margin: 0; padding: 0; background: #15110d; min-height: 100vh; }
    body { display: flex; align-items: center; justify-content: center; padding: 24px 0; }
    body > .card { box-shadow: 0 16px 48px rgba(0, 0, 0, 0.55); }
  </style></head>`;
  html = html.replace(/<\/head>/, frame);
  return html;
}

function indexHtml(templateIds) {
  const cards = templateIds.map(id => {
    const info = STYLE_INFO[id] || { name: id, desc: '', culture: '' };
    return `      <a class="card" href="${id}.html" data-culture="${info.culture}">
        <div class="thumb"><img src="thumbnails/${id}.png" alt="${info.name}" loading="lazy"></div>
        <div class="meta">
          <div class="name">${info.name}</div>
          <div class="desc">${info.desc}</div>
          <div class="culture">${info.culture}</div>
        </div>
      </a>`;
  }).join('\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Wedding Invitation Skill — 20 World-Culture Examples</title>
  <meta name="description" content="An AI-agent skill that designs your wedding invitation from a conversation. 20 example designs across Chinese, Japanese, Korean, Indian, Middle Eastern, Latin, French, and contemporary aesthetics.">
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300&family=Inter:wght@300;400;500&display=swap">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      background: #0a0907;
      color: #d4c4a8;
      font-family: 'Inter', -apple-system, sans-serif;
      line-height: 1.6;
    }
    header {
      max-width: 1280px;
      margin: 0 auto;
      padding: 72px 32px 32px;
      text-align: center;
    }
    h1 {
      font-family: 'Cormorant Garamond', serif;
      font-weight: 300;
      font-size: 56px;
      letter-spacing: 6px;
      margin: 0 0 12px;
      color: #d4b896;
      text-transform: uppercase;
    }
    h1 .amp {
      font-style: italic;
      color: #b8956a;
      margin: 0 8px;
    }
    .tagline {
      font-family: 'Cormorant Garamond', serif;
      font-style: italic;
      font-size: 18px;
      color: #a89878;
      max-width: 640px;
      margin: 0 auto 28px;
    }
    .actions {
      display: flex;
      gap: 12px;
      justify-content: center;
      margin-bottom: 16px;
    }
    .btn {
      display: inline-block;
      padding: 10px 22px;
      border: 1px solid #d4b896;
      color: #d4b896;
      text-decoration: none;
      font-size: 12px;
      letter-spacing: 4px;
      text-transform: uppercase;
      border-radius: 2px;
      transition: all 0.2s;
    }
    .btn:hover { background: #d4b896; color: #0a0907; }
    .btn.primary { background: #d4b896; color: #0a0907; }
    .btn.primary:hover { background: #b8956a; border-color: #b8956a; }
    .note {
      max-width: 640px;
      margin: 24px auto 0;
      font-size: 12px;
      color: #6a5c48;
      font-style: italic;
    }
    main {
      max-width: 1400px;
      margin: 0 auto;
      padding: 32px 24px 72px;
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 28px;
    }
    .card {
      background: #14110d;
      border-radius: 6px;
      overflow: hidden;
      text-decoration: none;
      color: inherit;
      transition: transform 0.25s, box-shadow 0.25s;
      display: block;
    }
    .card:hover {
      transform: translateY(-6px);
      box-shadow: 0 18px 32px rgba(0, 0, 0, 0.6);
    }
    .thumb { aspect-ratio: 3 / 4; overflow: hidden; }
    .thumb img { width: 100%; height: 100%; object-fit: cover; display: block; }
    .meta { padding: 14px 18px 18px; }
    .name {
      font-family: 'Cormorant Garamond', serif;
      font-style: italic;
      font-size: 18px;
      color: #d4b896;
      letter-spacing: 1px;
    }
    .desc {
      font-size: 12px;
      color: #888;
      margin-top: 2px;
      letter-spacing: 0.5px;
    }
    .culture {
      font-size: 10px;
      color: #6a5c48;
      margin-top: 6px;
      letter-spacing: 3px;
      text-transform: uppercase;
    }
    footer {
      max-width: 1280px;
      margin: 0 auto;
      padding: 32px 32px 64px;
      text-align: center;
      color: #6a5c48;
      font-size: 13px;
      border-top: 1px solid #1f1a14;
    }
    footer a { color: #b8956a; text-decoration: none; }
    footer a:hover { color: #d4b896; }
    @media (max-width: 600px) {
      h1 { font-size: 36px; letter-spacing: 4px; }
      header { padding: 48px 20px 24px; }
    }
  </style>
</head>
<body>
  <header>
    <h1>Wedding <span class="amp">&amp;</span> Invitation</h1>
    <p class="tagline">An AI-agent skill that designs your wedding invitation from a conversation — any language, any aesthetic, rendered locally, never uploaded.</p>
    <div class="actions">
      <a class="btn primary" href="https://github.com/wyx-sg/wedding-invitation-skill">VIEW ON GITHUB</a>
      <a class="btn" href="https://github.com/wyx-sg/wedding-invitation-skill#quick-start">QUICK START</a>
    </div>
    <p class="note">The 20 examples below were each designed from scratch for a different aesthetic. Your invitation will be designed fresh in your chosen language. Click any to see it in full.</p>
  </header>

  <main>
    <div class="grid">
${cards}
    </div>
  </main>

  <footer>
    Built with the <a href="https://github.com/wyx-sg/wedding-invitation-skill">wedding-invitation skill</a> · MIT License · No data leaves your machine.
  </footer>
</body>
</html>
`;
}

function main() {
  fs.mkdirSync(DOCS_DIR, { recursive: true });
  fs.mkdirSync(SITE_THUMBS_DIR, { recursive: true });

  // Clean stale rendered HTMLs (keep hero.png + thumbnails dir)
  for (const f of fs.readdirSync(DOCS_DIR)) {
    if (f.endsWith('.html')) fs.unlinkSync(path.join(DOCS_DIR, f));
  }

  // Copy thumbnails
  for (const f of fs.readdirSync(THUMBS_DIR)) {
    if (f.endsWith('.png')) {
      fs.copyFileSync(path.join(THUMBS_DIR, f), path.join(SITE_THUMBS_DIR, f));
    }
  }

  // Render each example
  const templateIds = fs.readdirSync(EXAMPLES_DIR)
    .filter(f => f.endsWith('.html'))
    .map(f => f.replace(/\.html$/, ''))
    .sort();

  for (const id of templateIds) {
    const html = renderExample(id);
    const outPath = path.join(DOCS_DIR, `${id}.html`);
    fs.writeFileSync(outPath, html);
    const size = (fs.statSync(outPath).size / 1024).toFixed(0);
    console.log(`[pages] → docs/${id}.html (${size} KB)`);
  }

  // Write index
  const indexPath = path.join(DOCS_DIR, 'index.html');
  fs.writeFileSync(indexPath, indexHtml(templateIds));
  console.log(`[pages] → docs/index.html`);

  console.log(`\n[pages] Done. ${templateIds.length} examples rendered.`);
  console.log(`[pages] Open docs/index.html locally, or push to deploy on GitHub Pages.`);
}

main();
