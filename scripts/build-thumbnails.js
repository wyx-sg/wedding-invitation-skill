// Pre-render all examples/*.html into examples/thumbnails/*.png so the
// README gallery and any inspiration UI can show what the skill has
// produced in the past without needing live rendering.
//
// This is a build-time tool for the skill *author* (not the end user).
// Run once after editing examples/, then commit the PNGs.
//
//   node scripts/build-thumbnails.js
//
// Output: examples/thumbnails/<style-id>.png at 840×1120 (2x retina for a
// 420×560 gallery card).

import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execFileSync } from 'node:child_process';
import { fixtureFor, render } from './fixtures.js';

const ROOT = path.resolve(import.meta.dirname, '..');
const EXAMPLES_DIR = path.join(ROOT, 'examples');
const OUT_DIR = path.join(EXAMPLES_DIR, 'thumbnails');
const TMP_DIR = path.join(os.tmpdir(), 'wedding-skill-thumbs');

// Per-template placeholder photo. Each example template has its own AI-generated
// wedding photo tailored to its aesthetic (examples/photos/<style-id>.jpg).
// Falls back to placeholder-couple.jpg if a per-template image is missing.
// Embedded as base64 data URI so the temp HTML written to /tmp can resolve it
// regardless of the user's filesystem layout.
const FALLBACK_PHOTO = path.join(ROOT, 'examples', 'photos', 'placeholder-couple.jpg');

function photoUrlFor(templateId) {
  const specific = path.join(ROOT, 'examples', 'photos', `${templateId}.jpg`);
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

  const refs = fs.readdirSync(EXAMPLES_DIR)
    .filter(f => f.endsWith('.html'))
    .sort();
  console.log(`[thumbs] Found ${refs.length} example template(s)`);

  for (const ref of refs) {
    const id = ref.replace(/\.html$/, '');
    const tplPath = path.join(EXAMPLES_DIR, ref);
    const tpl = fs.readFileSync(tplPath, 'utf8');

    // Probe height from the template's .card rule. Default 560.
    const heightMatch = tpl.match(/\.card\s*\{[^}]*?height:\s*(\d+)px/);
    const height = heightMatch ? parseInt(heightMatch[1], 10) : 560;

    // Render with fixture data; inject the per-template photo so each
    // thumbnail shows an aesthetic-matched wedding photo.
    const designCtx = {
      id, name_zh: '', name_en: '', primary_photo: '_placeholder',
      primary_photo_url: photoUrlFor(id),
      width: 420, height
    };
    let html = render(tpl, { ...fixtureFor(id), design: designCtx });
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
  console.log(`[thumbs] Done. ${refs.length} thumbnails in examples/thumbnails/`);
}

main();
