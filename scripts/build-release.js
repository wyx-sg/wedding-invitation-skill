// Build a clean release zip containing only the runtime files an end-user needs.
//
//   node scripts/build-release.js
//
// Output:
//   release/wedding-invitation-skill.zip
//
// Used by .github/workflows/release.yml on tag push, but also runnable
// locally to verify the contents.

import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const ROOT = path.resolve(import.meta.dirname, '..');
const OUT_DIR = path.join(ROOT, 'release');
const STAGE_DIR = path.join(OUT_DIR, 'wedding-invitation-skill');
const ZIP_PATH = path.join(OUT_DIR, 'wedding-invitation-skill.zip');

// Files / directories included in the release. Paths are relative to ROOT.
const INCLUDE = [
  'SKILL.md',
  'workflow.md',
  'design-principles.md',
  'LICENSE',
  'references',
  'skeleton'
];

function copyRecursive(src, dst) {
  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    fs.mkdirSync(dst, { recursive: true });
    for (const f of fs.readdirSync(src)) {
      copyRecursive(path.join(src, f), path.join(dst, f));
    }
  } else {
    fs.mkdirSync(path.dirname(dst), { recursive: true });
    fs.copyFileSync(src, dst);
  }
}

// Reset the output area
fs.rmSync(OUT_DIR, { recursive: true, force: true });
fs.mkdirSync(STAGE_DIR, { recursive: true });

console.log('[release] Staging files…');
for (const entry of INCLUDE) {
  const src = path.join(ROOT, entry);
  if (!fs.existsSync(src)) {
    console.error(`[release] Missing: ${entry}`);
    process.exit(1);
  }
  const dst = path.join(STAGE_DIR, entry);
  copyRecursive(src, dst);
  console.log(`[release]   ✓ ${entry}`);
}

// Zip it. Use system `zip` (BSD on macOS, Info-Zip on Linux). Falls back to
// reporting an instructive error if zip is missing.
console.log('[release] Creating zip…');
try {
  execFileSync('zip', ['-r', '-q', path.basename(ZIP_PATH), 'wedding-invitation-skill'], {
    cwd: OUT_DIR,
    stdio: 'inherit'
  });
} catch (err) {
  console.error('[release] `zip` not found or failed.');
  console.error('[release]   macOS: built-in. Linux: apt install zip. Windows: use WSL or 7-zip.');
  process.exit(1);
}

const size = fs.statSync(ZIP_PATH).size;
console.log(`[release] ✓ ${path.relative(ROOT, ZIP_PATH)} (${(size / 1024).toFixed(1)} KB)`);
console.log(`[release] Extract: cd <target> && unzip wedding-invitation-skill.zip`);
