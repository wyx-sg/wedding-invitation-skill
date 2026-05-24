// Compose the example thumbnails into a single hero image for the README.
// Same headless-Chrome trick as build-thumbnails.js — zero npm deps.
//
//   node scripts/build-hero.js
//
// Output: docs/hero.png

import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execFileSync } from 'node:child_process';

const ROOT = path.resolve(import.meta.dirname, '..');
const THUMBS_DIR = path.join(ROOT, 'examples', 'thumbnails');
const OUT_DIR = path.join(ROOT, 'docs');
const OUT_PNG = path.join(OUT_DIR, 'hero.png');
const TMP_DIR = path.join(os.tmpdir(), 'wedding-skill-hero');

const COLS = 5;
const ROWS = 4;
const CELL_W = 240;
const CELL_H = 320;
const GAP = 16;
const PAD = 36;
const W = COLS * CELL_W + (COLS - 1) * GAP + PAD * 2;
const H = ROWS * CELL_H + (ROWS - 1) * GAP + PAD * 2;

function findChrome() {
  if (process.env.CHROME && fs.existsSync(process.env.CHROME)) return process.env.CHROME;
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
  throw new Error('Chrome / Chromium not found. Set CHROME=/path/to/chrome and retry.');
}

function main() {
  const chrome = findChrome();
  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.mkdirSync(TMP_DIR, { recursive: true });

  const thumbs = fs.readdirSync(THUMBS_DIR)
    .filter(f => f.endsWith('.png'))
    .sort();

  if (thumbs.length !== COLS * ROWS) {
    console.warn(`[hero] Expected ${COLS * ROWS} thumbnails, found ${thumbs.length}. Layout may have empty cells or overflow.`);
  }
  const display = thumbs.slice(0, COLS * ROWS);

  const cards = display.map(f => {
    const b64 = fs.readFileSync(path.join(THUMBS_DIR, f)).toString('base64');
    return `<div class="cell"><img src="data:image/png;base64,${b64}"></div>`;
  }).join('\n  ');

  const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><style>
  html, body { margin: 0; padding: 0; background: #0a0907; }
  body {
    width: ${W}px; height: ${H}px;
    padding: ${PAD}px;
    box-sizing: border-box;
  }
  .grid {
    display: grid;
    grid-template-columns: repeat(${COLS}, ${CELL_W}px);
    grid-template-rows: repeat(${ROWS}, ${CELL_H}px);
    gap: ${GAP}px;
  }
  .cell {
    width: ${CELL_W}px;
    height: ${CELL_H}px;
    border-radius: 4px;
    overflow: hidden;
    box-shadow: 0 6px 20px rgba(0,0,0,0.55);
  }
  .cell img { width: 100%; height: 100%; object-fit: cover; display: block; }
</style></head><body>
  <div class="grid">
  ${cards}
  </div>
</body></html>`;

  const tmpHtml = path.join(TMP_DIR, 'hero.html');
  fs.writeFileSync(tmpHtml, html);

  execFileSync(chrome, [
    '--headless', '--disable-gpu', '--hide-scrollbars',
    `--window-size=${W},${H}`,
    `--screenshot=${OUT_PNG}`,
    `file://${tmpHtml}`
  ], { stdio: ['ignore', 'ignore', 'inherit'] });

  const size = fs.statSync(OUT_PNG).size;
  console.log(`[hero] → ${path.relative(ROOT, OUT_PNG)} (${W}×${H}, ${(size / 1024).toFixed(0)} KB)`);
}

main();
