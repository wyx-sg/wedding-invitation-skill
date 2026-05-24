// Pre-render two PNG sizes per template for the showcase site download links.
//   - Social PNG: 1080×1440  (3x the 420×560 card — for messaging, email, social)
//   - Print PNG:  2160×2880  (6x — 300 DPI for printing physical cards at 5×7 in)
//
// Run once after build-thumbnails.js when invitations change.
//
//   node scripts/build-png-exports.js
//
// Output:
//   docs/png/social/<style-id>.png   (~600 KB-1 MB each, 20 files ~15 MB total)
//   docs/png/print/<style-id>.png    (~2-3 MB each, 20 files ~50 MB total)

import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execFileSync } from 'node:child_process';
import { fixtureFor, render } from './fixtures.js';

const ROOT = path.resolve(import.meta.dirname, '..');
const EXAMPLES_DIR = path.join(ROOT, 'examples');
const PHOTOS_DIR = path.join(EXAMPLES_DIR, 'photos');
const DOCS_DIR = path.join(ROOT, 'docs');
const SOCIAL_DIR = path.join(DOCS_DIR, 'png', 'social');
const PRINT_DIR = path.join(DOCS_DIR, 'png', 'print');
const TMP_DIR = path.join(os.tmpdir(), 'wedding-skill-png-exports');

const SIZES = [
  { name: 'social', dir: SOCIAL_DIR, targetWidth: 1080 },
  { name: 'print',  dir: PRINT_DIR,  targetWidth: 2160 }
];

const FALLBACK_PHOTO = path.join(PHOTOS_DIR, 'placeholder-couple.jpg');

function photoUrlFor(templateId) {
  const specific = path.join(PHOTOS_DIR, `${templateId}.jpg`);
  const chosen = fs.existsSync(specific) ? specific : FALLBACK_PHOTO;
  return 'data:image/jpeg;base64,' + fs.readFileSync(chosen).toString('base64');
}

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
  for (const c of candidates) if (fs.existsSync(c)) return c;
  throw new Error('Chrome/Chromium not found. Set CHROME=/path/to/chrome and retry.');
}

function frameCss(height) {
  // Same logic as build-thumbnails — strip body bleed, no centering for exact card export.
  return `<style id="__export_frame__">
    html,body{margin:0!important;padding:0!important;width:420px!important;height:${height}px!important;background:transparent!important;overflow:hidden!important}
    body>.card,body .card{margin:0!important;box-shadow:none!important}
  </style></head>`;
}

function main() {
  const chrome = findChrome();
  for (const s of SIZES) fs.mkdirSync(s.dir, { recursive: true });
  fs.mkdirSync(TMP_DIR, { recursive: true });

  // Clean stale exports
  for (const s of SIZES) {
    for (const f of fs.readdirSync(s.dir)) {
      if (f.endsWith('.png')) fs.unlinkSync(path.join(s.dir, f));
    }
  }

  const refs = fs.readdirSync(EXAMPLES_DIR)
    .filter(f => f.endsWith('.html'))
    .sort();
  console.log(`[png-exports] ${refs.length} templates × ${SIZES.length} sizes = ${refs.length * SIZES.length} renders`);

  for (const ref of refs) {
    const id = ref.replace(/\.html$/, '');
    const tplPath = path.join(EXAMPLES_DIR, ref);
    const tpl = fs.readFileSync(tplPath, 'utf8');
    const heightMatch = tpl.match(/\.card\s*\{[^}]*?height:\s*(\d+)px/);
    const height = heightMatch ? parseInt(heightMatch[1], 10) : 560;

    const designCtx = {
      id, name_zh: '', name_en: '', primary_photo: '_placeholder',
      primary_photo_url: photoUrlFor(id),
      width: 420, height
    };
    let html = render(tpl, { ...fixtureFor(id), design: designCtx });
    html = html.replace(/<\/head>/, frameCss(height));

    const tmpHtml = path.join(TMP_DIR, `${id}.html`);
    fs.writeFileSync(tmpHtml, html);

    for (const s of SIZES) {
      const out = path.join(s.dir, `${id}.png`);
      const scale = (s.targetWidth / 420).toFixed(4);
      execFileSync(chrome, [
        '--headless', '--disable-gpu', '--hide-scrollbars',
        `--window-size=420,${height}`,
        `--force-device-scale-factor=${scale}`,
        `--screenshot=${out}`,
        `file://${tmpHtml}`
      ], { stdio: ['ignore', 'ignore', 'ignore'] });
      const size = fs.statSync(out).size;
      console.log(`[png-exports] ${id} ${s.name.padEnd(7)} → ${(size / 1024).toFixed(0)} KB`);
    }
  }
  console.log(`[png-exports] Done.`);
}

main();
