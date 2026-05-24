// Generate per-template AI wedding photos via Nano Banana Pro (OpenRouter).
// Each prompt is tailored to its template's photo frame shape AND cultural
// aesthetic — circle / oval / arched / fan / wide / square / etc.
//
//   OPENROUTER_API_KEY=sk-or-... node scripts/build-example-photos.js
//
// Output: examples/photos/<style-id>.jpg
//
// Skip-if-exists: re-running only regenerates missing files. Delete a file
// to force regeneration. Total cost: ~$2.5 for all 20 photos.

import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const OUT_DIR = path.join(ROOT, 'examples', 'photos');
const MODEL = 'google/gemini-3-pro-image-preview';  // Nano Banana Pro

const apiKey = process.env.OPENROUTER_API_KEY;
if (!apiKey) { console.error('Set OPENROUTER_API_KEY first.'); process.exit(1); }

// Shared composition rules per frame shape — appended to subject prompt.
const SHAPE = {
  oval_portrait:
    'Vertical portrait, 3:4 aspect ratio, tall composition. ' +
    'Both faces centered in frame, shoulder-up shot, leaning gently together. ' +
    'Couple positioned in middle of frame. NO landscape orientation.',
  square:
    'Square 1:1 composition. Both faces centered close-up shoulder-up shot, ' +
    'leaning gently together. Couple framed tightly in the center.',
  arched_top:
    'Vertical portrait, 3:4 aspect ratio. Both faces in the UPPER HALF of frame ' +
    '(since the arched top will softly frame their heads). Shoulder-up shot, ' +
    'couple leaning together, centered horizontally. NO landscape.',
  landscape:
    'Wide landscape, 16:9 aspect ratio. Full upper body shot of the couple, ' +
    'environment visible around them. Both faces clearly visible, centered.',
  macro:
    'Close-up macro detail shot, shallow depth of field, intimate small subject.',
  fan_horizontal:
    'Horizontal composition with subjects framed by an arc. Both faces visible ' +
    'and centered, slight upper-half placement so a curved top frame complements ' +
    'rather than crops them.'
};

// [id, prompt] — subject + style cues; the SHAPE prefix is added below.
const PHOTOS = [
  // ── Chinese (oval portrait) ──
  ['style01-new-chinese',
    `Chinese wedding couple, modern refined "new Chinese" aesthetic. Bride in red qipao with golden phoenix embroidery, simple hairpin updo; groom in dark mao-collar suit. Soft natural window light, warm intimate interior with subtle wooden lattice screen behind. Photorealistic medium-format film look, neutral palette, refined Song-dynasty literati mood.`,
    'oval_portrait'],

  ['style04-red-gold',
    `Traditional Chinese banquet-style wedding portrait. Bride in saturated red embroidered qipao with abundant gold dragon-phoenix detailing and pearl headpiece; groom in red tang-style wedding suit with gold ornaments. Warm vermilion-red banquet hall background softly blurred. Photorealistic, celebratory regal mood.`,
    'oval_portrait'],

  ['style13-ink-flower',
    `Chinese wedding couple in traditional hanfu robes (bride cream-and-pink, groom indigo-and-cream), refined and serene. Background suggests an ink-wash painting: blurred plum blossoms and bamboo branches in pale wash tones. Soft diffused light, photorealistic but with a painterly quality.`,
    'oval_portrait'],

  // ── Chinese (fan-shape — palace) ──
  ['style09-gugong',
    `Imperial Chinese palace wedding portrait. Bride in elaborate red embroidered gown with phoenix crown (鳯冠), heavy gold and pearl ornaments; groom in matching scholar's robe with jade ornaments. Soft Forbidden City courtyard backdrop in warm vermilion and gold tones. Museum-grade photorealism, both faces centered, slight upper-half placement to complement a fan-shaped frame.`,
    'fan_horizontal'],

  // ── Contemporary Western (oval portrait) ──
  ['style02-modern-minimal',
    `Modern wedding couple, Scandinavian minimal aesthetic. Bride in simple unadorned ivory silk dress, low chignon; groom in well-tailored dark grey suit. Clean off-white minimalist studio backdrop, soft diffused daylight, neutral palette, restrained editorial style. Photorealistic.`,
    'oval_portrait'],

  ['style03-morandi',
    `Soft contemporary wedding couple. Bride in flowing dusty-sage silk dress, groom in warm grey linen suit. Background a soft outdoor garden blurred to muted Morandi tones — warm grey, sage, sand. Diffused overcast light, gentle photographer-style portrait. Photorealistic, soft contemporary aesthetic.`,
    'oval_portrait'],

  // ── European editorial / formal (square + landscape) ──
  ['style05-vogue',
    `Editorial fashion wedding cover photo, full vertical magazine portrait, 3:4 aspect ratio. Dramatic monochrome with subtle warm tone. Couple in haute couture wedding attire — bride in sculptural ivory gown, groom in immaculate black tuxedo. Strong cinematic studio lighting, expressive but contained faces, intense Vogue magazine cover mood. Full upper body visible, both faces centered upper area.`,
    'oval_portrait'],  // vogue is a 420×380 area (~portrait-ish) — use 3:4

  ['style06-black-gold',
    `Formal black-tie wedding portrait. Groom in classic black tuxedo with bow tie; bride in elegant ivory satin gown. Dramatic golden-hour rim light, dark moody cinematic background with subtle gold sheen. Both faces centered, refined and timeless. Photorealistic, Gatsby-era luxury hotel feel.`,
    'square'],

  ['style07-newspaper',
    `Vintage 1950s sepia wedding photograph, classic styled couple. Bride in tea-length lace dress holding a small bouquet, groom in dark single-breasted suit with carnation. Captured in front of a small-town clapboard church or chapel, full upper-body framing. Soft film grain, faded sepia tones. Photorealistic, nostalgic small-town newspaper feature look.`,
    'landscape'],

  ['style08-letter',
    `Macro close-up of two simple gold wedding bands resting on a handwritten cream love letter. Warm afternoon window light from the left, shallow depth of field, the cursive ink slightly blurred behind the rings. Romantic, intimate, photorealistic detail shot.`,
    'macro'],

  ['style12-art-deco',
    `1920s Art Deco wedding couple, Great Gatsby glamour. Bride with pearl beaded headband and ostrich feather, drop-waist beaded dress; groom in white-tie tuxedo with tails. Dark velvet backdrop with subtle geometric gold motif. Studio chiaroscuro lighting, both faces centered. Photorealistic film-noir warm tones.`,
    'oval_portrait'],

  ['style19-french-provence',
    `French Provence countryside wedding couple. Bride in soft lace ivory dress holding a small lavender bouquet, fresh natural makeup; groom in linen sand-colored suit. Background: blurred rows of lavender and a distant stone chateau in golden afternoon light. Both faces centered upper area, romantic warm tones, photorealistic.`,
    'arched_top'],

  // ── Themed (square / portrait) ──
  ['style10-mediterranean',
    `Mediterranean destination wedding couple. Bride in airy ivory chiffon gown, groom in light beige linen suit, both windswept and happy. Background: blurred olive grove with golden hour sun and a hint of ocean. Sun-drenched warm terracotta and ivory tones, photorealistic.`,
    'square'],

  ['style14-retro-poster',
    `Wedding couple shoulder-up portrait styled like a 1970s travel poster character — bride with simple veil, groom in tan suit. Warm vintage color grading: mustard yellow, teal, cream, soft film flare. Both faces centered, retro photographic aesthetic. Photorealistic with vintage palette.`,
    'square'],

  ['style15-vintage-stars',
    `Wedding couple under a soft starry night sky. Bride in elegant deep-navy or ivory gown, groom in dark suit. Subtle crescent moon and gold star scatter softly behind them. Deep navy and brass tones, dreamy romantic celestial mood, both faces centered. Photorealistic.`,
    'oval_portrait'],

  // ── World cultures (square / portrait / arched) ──
  ['style11-wabi-sabi',
    `Japanese wedding couple in traditional wedding attire — bride in white shiromuku kimono, groom in black montsuki haori-hakama. Soft monochrome restraint, single suggestion of an ink-wash branch or empty space behind them. Calm zen mood, both faces centered upper area. Photorealistic, refined wabi-sabi aesthetic.`,
    'arched_top'],

  ['style16-indian',
    `Indian wedding couple close-up. Bride in deep crimson and gold lehenga with intricate gold jewelry, maang tikka, and red bindi; groom in ivory sherwani with maroon dupatta. Both faces centered, intricate textile details visible. Warm marigold-and-gold background softly blurred. Photorealistic, regal Rajasthani wedding mood.`,
    'square'],

  ['style17-arabic',
    `Middle Eastern wedding couple. Bride in elegant ivory-and-gold embroidered gown with delicate veil over hair, groom in formal dark suit. Both faces centered in upper portion of frame. Subtle arabesque tile background blurred behind them in jewel-toned teal and gold. Photorealistic, refined and ornate.`,
    'arched_top'],

  ['style18-latin',
    `Mexican folk wedding couple close-up. Bride in traditional white embroidered dress with colorful flower crown of marigolds and roses; groom in charro-style outfit with embroidered short jacket. Vibrant warm colors, papel picado banners softly visible behind. Photorealistic, joyful folk-art mood.`,
    'square'],

  ['style20-korean-hanbok',
    `Korean wedding couple in traditional hanbok. Bride in deep emerald-green jeogori with red chima skirt and elaborate hwarot embroidery, hair adorned with a binyeo hairpin; groom in indigo and ivory hanbok with gakdae belt. Subtle Joseon-era palace eaves behind them in soft blur. Both faces centered upper area, photorealistic.`,
    'arched_top'],
];

const headers = {
  'Authorization': `Bearer ${apiKey}`,
  'Content-Type': 'application/json',
  'HTTP-Referer': 'https://github.com/wyx-sg/wedding-invitation-skill',
  'X-Title': 'Wedding Invitation Skill - photo gen'
};

async function generateOne(id, subject, shapeKey) {
  const outPath = path.join(OUT_DIR, `${id}.jpg`);
  if (fs.existsSync(outPath) && fs.statSync(outPath).size > 10000) {
    console.log(`[photos] ${id} ... already exists, skip`);
    return { id, ok: true, skipped: true };
  }
  process.stdout.write(`[photos] ${id} ... `);
  const t0 = Date.now();

  const prompt = `${SHAPE[shapeKey]}\n\n${subject}\n\nPhotorealistic high-quality wedding photography. Shallow depth of field. No text, no watermarks, no captions.`;

  try {
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: MODEL,
        messages: [{ role: 'user', content: prompt }],
        modalities: ['image', 'text']
      })
    });
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`HTTP ${res.status}: ${body.slice(0, 200)}`);
    }
    const data = await res.json();
    const img = data.choices?.[0]?.message?.images?.[0];
    const dataUrl = img?.image_url?.url || img?.url;
    if (!dataUrl?.startsWith('data:')) throw new Error('no image in response');
    const buf = Buffer.from(dataUrl.split(',', 2)[1], 'base64');
    fs.writeFileSync(outPath, buf);
    const dt = ((Date.now() - t0) / 1000).toFixed(1);
    console.log(`✓ (${(buf.length / 1024).toFixed(0)} KB, ${dt}s)`);
    return { id, ok: true };
  } catch (e) {
    console.log(`✗ ${e.message}`);
    return { id, ok: false, error: e.message };
  }
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  console.log(`[photos] Generating ${PHOTOS.length} photos via ${MODEL} (sequential)...`);
  const results = [];
  for (const [id, subject, shape] of PHOTOS) {
    results.push(await generateOne(id, subject, shape));
  }
  const failed = results.filter(r => !r.ok);
  console.log(`\n[photos] Done. ${results.length - failed.length}/${results.length} succeeded.`);
  if (failed.length) console.log(`[photos] Failed: ${failed.map(f => f.id).join(', ')}`);
}

main();
