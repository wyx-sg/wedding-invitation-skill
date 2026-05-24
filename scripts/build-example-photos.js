// Generate per-template AI wedding photos for the README gallery.
// Each thumbnail style gets a photo tailored to its aesthetic, so the gallery
// shows real visual variety rather than one photo applied 15 times.
//
// Uses Pollinations.ai — free, no API key. Seeded for deterministic output.
//
//   node scripts/build-example-photos.js
//
// Output: examples/photos/<style-id>.jpg
//
// Note: this is a build-time tool for the skill author. Generation can take
// 5-15 minutes total (Pollinations is slow). Run once, commit the results.

import fs from 'node:fs';
import path from 'node:path';
import https from 'node:https';

const ROOT = path.resolve(import.meta.dirname, '..');
const OUT_DIR = path.join(ROOT, 'examples', 'photos');

// [id, seed, prompt]. Seed makes the generation deterministic.
const PHOTOS = [
  ['style01-new-chinese',      101, 'elegant chinese wedding couple, bride in red qipao with phoenix embroidery, groom in dark traditional mao suit, soft natural light, refined traditional, intimate portrait, photorealistic'],
  ['style02-modern-minimal',   102, 'minimalist wedding portrait, couple in simple modern attire, white linen background, soft natural daylight, scandinavian minimalism, clean composition, neutral palette, photorealistic'],
  ['style03-morandi',          103, 'wedding couple soft portrait, muted morandi grey-sage color palette, photographer style, asymmetric dreamy composition, contemporary aesthetic, photorealistic'],
  ['style04-red-gold',         104, 'traditional chinese wedding portrait, bride in red embroidered qipao with gold accents, groom in red tang dynasty suit, ornate red and gold banquet hall background, photorealistic'],
  ['style05-vogue',            105, 'fashion editorial wedding portrait, dramatic monochrome black and white, couple in haute couture, high contrast vogue magazine cover aesthetic, photorealistic'],
  ['style06-black-gold',       106, 'elegant wedding couple silhouette at golden hour, gold rim light, dark cinematic background, formal black tie attire, romantic dramatic chiaroscuro, photorealistic'],
  ['style07-newspaper',        107, 'vintage sepia wedding portrait, 1950s style classic couple, soft film grain texture, nostalgic old hollywood glamour, black and white with sepia tones, photorealistic'],
  ['style08-letter',           108, 'intimate macro close-up of bride and groom hands holding wedding rings on a handwritten love letter, warm soft window light, romantic moment, shallow depth of field, photorealistic'],
  ['style09-gugong',           109, 'traditional chinese palace wedding portrait, bride in elaborate phoenix crown and embroidered red gown, groom in scholar robes, forbidden city architecture in background, museum quality, photorealistic'],
  ['style10-mediterranean',    110, 'mediterranean destination wedding couple, golden hour sun, olive grove and ocean background, casual elegant attire, sun-drenched warm terracotta tones, photorealistic'],
  ['style11-wabi-sabi',        111, 'minimalist japanese wedding portrait, couple in traditional white and indigo kimono, soft monochrome zen restraint, single ink-wash branch in foreground, photorealistic'],
  ['style12-art-deco',         112, '1920s art deco wedding portrait, flapper bride with pearl beaded headband and feather, groom in white tie tuxedo, geometric gatsby-era glamour backdrop, photorealistic'],
  ['style13-ink-flower',       113, 'chinese ink painting style wedding portrait, bride and groom in traditional hanfu, soft watercolor wash, plum blossom and bamboo branches, painterly aesthetic'],
  ['style14-retro-poster',     114, 'retro travel poster style wedding couple, 1970s vintage illustration, stylized sunburst rays, warm mustard and teal color palette, poster art'],
  ['style15-vintage-stars',    115, 'romantic wedding couple under starry night sky, celestial portrait with stars and crescent moon, deep navy blue and gold tones, dreamy magical, photorealistic'],
  ['style16-indian',           116, 'indian wedding couple portrait, bride in heavy red and gold lehenga with intricate gold jewelry and maang tikka, groom in ivory sherwani with maroon dupatta, marigold and rose petals, traditional indian wedding photography, ornate background, photorealistic'],
  ['style17-arabic',           117, 'middle eastern wedding couple, bride in elegant ivory and gold embroidered gown with delicate veil, groom in formal dark suit, ornate arabesque background with geometric arch, jewel-toned palette teal and gold, photorealistic'],
  ['style18-latin',            118, 'mexican folk wedding couple portrait, bride in traditional embroidered white dress with colorful flower crown, groom in charro suit, marigolds and papel picado banner background, vibrant warm colors, photorealistic'],
  ['style19-french-provence',  119, 'french provence wedding couple, bride in lace ivory gown holding lavender bouquet, groom in linen suit, lavender field and stone chateau background, soft golden light, romantic countryside, photorealistic'],
  ['style20-korean-hanbok',    120, 'korean wedding couple in traditional hanbok, bride in deep emerald and red hanbok with elaborate hwarot crown, groom in indigo and ivory hanbok with gakdae belt, traditional Joseon palace background, photorealistic'],
];

const WIDTH = 800;
const HEIGHT = 1067;
const TIMEOUT_MS = 240000; // 4 minutes per image

function fetchImage(prompt, seed, outPath) {
  const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=${WIDTH}&height=${HEIGHT}&seed=${seed}&model=turbo&nologo=true`;

  return new Promise((resolve, reject) => {
    function get(target, depth = 0) {
      if (depth > 5) return reject(new Error('too many redirects'));
      const req = https.get(target, { timeout: TIMEOUT_MS }, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          res.resume();
          return get(res.headers.location, depth + 1);
        }
        if (res.statusCode !== 200) {
          res.resume();
          return reject(new Error(`HTTP ${res.statusCode}`));
        }
        const file = fs.createWriteStream(outPath);
        res.pipe(file);
        file.on('finish', () => { file.close(); resolve(); });
        file.on('error', reject);
      });
      req.on('error', reject);
      req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
    }
    get(url);
  });
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function generateOne([id, seed, prompt]) {
  const outPath = path.join(OUT_DIR, `${id}.jpg`);
  // Skip if already exists and is non-empty (lets you re-run to fill in failures)
  if (fs.existsSync(outPath) && fs.statSync(outPath).size > 5000) {
    console.log(`[photos] ${id} ... already exists, skip`);
    return { id, ok: true, skipped: true };
  }
  process.stdout.write(`[photos] ${id} ... `);
  const t0 = Date.now();
  try {
    await fetchImage(prompt, seed, outPath);
    const size = fs.statSync(outPath).size;
    const dt = ((Date.now() - t0) / 1000).toFixed(1);
    console.log(`✓ (${(size / 1024).toFixed(0)} KB, ${dt}s)`);
    return { id, ok: true };
  } catch (e) {
    console.log(`✗ ${e.message}`);
    return { id, ok: false, error: e.message };
  }
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  console.log(`[photos] Generating ${PHOTOS.length} AI wedding photos via Pollinations.ai (sequential)...`);

  const results = [];
  for (const photo of PHOTOS) {
    const result = await generateOne(photo);
    results.push(result);
    if (!result.skipped) await sleep(3000); // be gentle on the free tier
  }
  const failed = results.filter(r => !r.ok);
  console.log(`\n[photos] Done. ${results.length - failed.length}/${results.length} succeeded.`);
  if (failed.length) {
    console.log(`[photos] Failed: ${failed.map(f => f.id).join(', ')}`);
    console.log(`[photos] Re-run the script to retry failed images.`);
  }
}

main();
