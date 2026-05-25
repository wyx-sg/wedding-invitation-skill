// Screenshot each design in dist/ into a print-ready PNG using headless Chrome.
//
// Cross-platform (macOS / Linux / Windows). Zero npm dependencies — uses
// whichever Chrome / Chromium / Edge is installed on the machine.
//
// Override the browser binary explicitly with:
//   CHROME=/path/to/chrome  node scripts/render.js

import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const ROOT = path.resolve(import.meta.dirname, '..');
const DIST_DIR = path.join(ROOT, 'dist');
const PNG_DIR = path.join(DIST_DIR, 'png');
const SOCIAL_DIR = path.join(PNG_DIR, 'social');
const PRINT_DIR = path.join(PNG_DIR, 'print');
const DESIGNS_FILE = path.join(ROOT, 'data', 'designs.json');

// Two output sizes per design: social (messaging/email) + print (300 DPI).
// targetWidth is the rendered pixel width — height follows the template's
// aspect ratio. Card templates are 420×560 by default → outputs are 3:4.
const SIZES = [
  { name: 'social', dir: SOCIAL_DIR, targetWidth: 1080 },
  { name: 'print',  dir: PRINT_DIR,  targetWidth: 2160 }
];

function findChrome() {
  if (process.env.CHROME && fs.existsSync(process.env.CHROME)) {
    return process.env.CHROME;
  }
  const pf = process.env['ProgramFiles'] || 'C:/Program Files';
  const pf86 = process.env['ProgramFiles(x86)'] || 'C:/Program Files (x86)';
  const lad = process.env['LocalAppData'] || '';
  const candidates = {
    darwin: [
      '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      '/Applications/Chromium.app/Contents/MacOS/Chromium',
      '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge'
    ],
    win32: [
      path.join(pf, 'Google/Chrome/Application/chrome.exe'),
      path.join(pf86, 'Google/Chrome/Application/chrome.exe'),
      lad && path.join(lad, 'Google/Chrome/Application/chrome.exe'),
      lad && path.join(lad, 'Chromium/Application/chrome.exe'),
      path.join(pf86, 'Microsoft/Edge/Application/msedge.exe'),
      path.join(pf, 'Microsoft/Edge/Application/msedge.exe')
    ],
    linux: [
      '/usr/bin/google-chrome',
      '/usr/bin/google-chrome-stable',
      '/usr/bin/chromium',
      '/usr/bin/chromium-browser',
      '/snap/bin/chromium'
    ]
  }[process.platform] || [];

  for (const c of candidates) {
    if (c && fs.existsSync(c)) return c;
  }
  return null;
}

function reportChromeMissing() {
  const installHint = {
    darwin: '  brew install --cask google-chrome\n  # or download from https://www.google.com/chrome/',
    linux:  '  sudo apt install chromium-browser    # Debian / Ubuntu\n  sudo dnf install chromium            # Fedora',
    win32:  '  winget install Google.Chrome\n  # or download from https://www.google.com/chrome/'
  }[process.platform] || '  See https://www.google.com/chrome/';

  console.error('[render] Chrome / Chromium / Edge not found on this machine.\n');
  console.error('Install one of:');
  console.error(installHint + '\n');
  console.error('Or, override with an explicit path:');
  console.error('  CHROME=/full/path/to/chrome npm run render');
}

function fileUrl(p) {
  let abs = path.resolve(p);
  if (process.platform === 'win32') abs = abs.replace(/\\/g, '/');
  if (!abs.startsWith('/')) abs = '/' + abs;
  return 'file://' + abs;
}

function main() {
  const chrome = findChrome();
  if (!chrome) {
    reportChromeMissing();
    process.exit(1);
  }

  if (!fs.existsSync(DESIGNS_FILE)) {
    console.error(`[render] Missing ${DESIGNS_FILE}.`);
    console.error('[render] Run from inside a wedding project directory (with data/designs.json).');
    process.exit(1);
  }

  const designs = JSON.parse(fs.readFileSync(DESIGNS_FILE, 'utf8'));
  if (!Array.isArray(designs) || designs.length === 0) {
    console.error('[render] data/designs.json must be a non-empty array.');
    process.exit(1);
  }

  for (const s of SIZES) {
    fs.mkdirSync(s.dir, { recursive: true });
    for (const f of fs.readdirSync(s.dir)) {
      if (f.endsWith('.png')) fs.unlinkSync(path.join(s.dir, f));
    }
  }

  for (const d of designs) {
    const width = d.width || 420;
    const height = d.height || 560;
    const srcHtml = path.join(DIST_DIR, `${d.id}.html`);

    if (!fs.existsSync(srcHtml)) {
      console.log(`[render] Skipping ${d.id}: ${path.relative(ROOT, srcHtml)} missing — run 'npm run build' first.`);
      continue;
    }

    for (const s of SIZES) {
      const outPng = path.join(s.dir, `${d.id}.png`);
      const scale = (s.targetWidth / width).toFixed(4);
      // #render tells the page (via build.js-injected script) to skip the
      // dark "preview" frame styling. Required: at high DPR (e.g. print
      // scale 5.1428×), Chrome's effective CSS viewport can drift slightly
      // past 420 px and trigger a width-based media query, baking the
      // preview dark bg into the PNG. The hash-based opt-out is exact.
      execFileSync(chrome, [
        '--headless',
        '--disable-gpu',
        '--hide-scrollbars',
        `--window-size=${width},${height}`,
        `--force-device-scale-factor=${scale}`,
        `--screenshot=${outPng}`,
        fileUrl(srcHtml) + '#render'
      ], { stdio: ['ignore', 'ignore', 'ignore'] });
      const px = `${s.targetWidth}×${Math.round(height * (s.targetWidth / width))}`;
      console.log(`→ ${path.relative(ROOT, outPng)} (${s.name}, ${px})`);
    }
  }

  console.log(`[render] Done. PNGs in ${path.relative(ROOT, PNG_DIR)}/{social,print}/`);
}

main();
