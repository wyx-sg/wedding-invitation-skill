// Pre-render all references/*.html into references/thumbnails/*.png so
// Stage 3 (style selection) can show the user a visual menu instantly
// instead of doing 3× full build+render at runtime.
//
// This is a build-time tool for the skill *author* (not the end user).
// Run once after editing references/, then commit the PNGs.
//
//   node scripts/build-thumbnails.js
//
// Output: references/thumbnails/<style-id>.png at 840×1120 (2x retina for a
// 420×560 gallery card).

import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execFileSync } from 'node:child_process';
import { render } from '../skeleton/scripts/template-engine.js';

const ROOT = path.resolve(import.meta.dirname, '..');
const REFS_DIR = path.join(ROOT, 'references');
const OUT_DIR = path.join(REFS_DIR, 'thumbnails');
const TMP_DIR = path.join(os.tmpdir(), 'wedding-skill-thumbs');

// Fixture data — fully placeholder, no real-world identifying info.
// Mirrors skeleton/data/wedding.example.json but kept inline so this script
// is self-contained.
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
    full_zh: '示例市 · 示例路 · 示例酒店',
    province_zh: '示例省',
    province_en: 'EXAMPLE PROVINCE',
    city_zh: '示例 · 城市',
    city_en: 'Example City',
    city_en_upper: 'EXAMPLE CITY',
    lines_zh: ['示例区 示例街道', '示例酒店 宴会厅'],
    type_zh: '酒店 · 宴会'
  },
  site: {
    title: '林知言 & 沈安然 · 婚礼请帖',
    subtitle: '2099.10.01 · 示例城市',
    intro: '',
    newspaper_title: 'The LIN Times'
  }
};

// Placeholder photo as a self-contained SVG data URI (gradient + label).
// Aspect 3:4 to match what the templates expect.
const PLACEHOLDER_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 1067" preserveAspectRatio="xMidYMid slice">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#e8d8c4"/>
      <stop offset="1" stop-color="#c4a888"/>
    </linearGradient>
  </defs>
  <rect width="800" height="1067" fill="url(#g)"/>
  <g fill="#8c7058" font-family="Georgia, serif">
    <text x="400" y="490" text-anchor="middle" font-size="56" font-style="italic">photo</text>
    <text x="400" y="560" text-anchor="middle" font-size="22" letter-spacing="4">PLACEHOLDER</text>
  </g>
</svg>`;
const PLACEHOLDER_URL = 'data:image/svg+xml;utf8,' + encodeURIComponent(PLACEHOLDER_SVG);

function findChrome() {
  const env = process.env.CHROME;
  if (env && fs.existsSync(env)) return env;
  const candidates = [
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Chromium.app/Contents/MacOS/Chromium',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser'
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }
  throw new Error('Chrome/Chromium not found. Set CHROME=/path/to/chrome and retry.');
}

function frameCSS(height) {
  // For thumbnails we always want pure card output, no centering/bg bleed.
  // (The thumbnail will be displayed inside a gallery card of its own.)
  return `<style id="__thumb_frame__">
    html,body{margin:0!important;padding:0!important;width:420px!important;height:${height}px!important;background:transparent!important;overflow:hidden!important}
    body>.card,body .card{margin:0!important;box-shadow:none!important}
  </style></head>`;
}

function main() {
  const chrome = findChrome();
  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.mkdirSync(TMP_DIR, { recursive: true });
  // Clean stale thumbnails so renamed/removed references don't leave orphans
  for (const f of fs.readdirSync(OUT_DIR)) {
    if (f.endsWith('.png')) fs.unlinkSync(path.join(OUT_DIR, f));
  }

  const refs = fs.readdirSync(REFS_DIR)
    .filter(f => f.endsWith('.html'))
    .sort();
  console.log(`[thumbs] Found ${refs.length} reference template(s)`);

  for (const ref of refs) {
    const id = ref.replace(/\.html$/, '');
    const tplPath = path.join(REFS_DIR, ref);
    const tpl = fs.readFileSync(tplPath, 'utf8');

    // Probe height from the template's .card rule. Default 560.
    const heightMatch = tpl.match(/\.card\s*\{[^}]*?height:\s*(\d+)px/);
    const height = heightMatch ? parseInt(heightMatch[1], 10) : 560;

    // Render with fixture data; inject placeholder for the photo URL so we
    // don't need any photo files on disk.
    const designCtx = {
      id, name_zh: '', name_en: '', primary_photo: '_placeholder',
      primary_photo_url: PLACEHOLDER_URL,
      width: 420, height
    };
    let html = render(tpl, { ...FIXTURE, design: designCtx });
    // Some templates still hardcode "{{design.primary_photo_url}}" — done above.
    // Inject frame + write to temp HTML
    html = html.replace(/<\/head>/, frameCSS(height));
    const tmpHtml = path.join(TMP_DIR, `${id}.html`);
    fs.writeFileSync(tmpHtml, html);

    const out = path.join(OUT_DIR, `${id}.png`);
    // 2x scale for retina-quality thumbnails (840×1120 for 420×560 templates)
    execFileSync(chrome, [
      '--headless', '--disable-gpu', '--hide-scrollbars',
      `--window-size=420,${height}`,
      '--force-device-scale-factor=2',
      `--screenshot=${out}`,
      `file://${tmpHtml}`
    ], { stdio: ['ignore', 'ignore', 'ignore'] });
    const size = fs.statSync(out).size;
    console.log(`[thumbs] → ${id}.png (${(size / 1024).toFixed(0)} KB)`);
  }
  console.log(`[thumbs] Done. ${refs.length} thumbnails in references/thumbnails/`);
}

main();
