# Design Principles

Hard constraints **and concrete visual vocabulary** for every template you write. This is the **only** design reference you read — never read `examples/*.html` (they are frozen showcase artifacts, not templates to copy).

## Language

The invitation is designed in the language(s) the user picked. Read `data/wedding.json` → `languages` (array, e.g. `["zh"]`, `["en"]`, `["zh", "en"]`, `["es"]`).

**Design for THAT language specifically.** Typography, line breaks, formality, and visual cues vary dramatically across cultures. Do not default to Chinese or English unless the user chose it.

Common combinations:
- `["en"]` — Western wedding card; English only
- `["zh"]` — Chinese 婚帖; traditional or modern
- `["zh", "en"]` — bilingual; common for HK / SG / mainland weddings with international guests
- `["es"]`, `["ja"]`, `["ko"]`, `["fr"]`, ... — design from cultural conventions of that language; research before designing

When bilingual: pick a **primary** (usually `languages[0]`) and a **secondary**. Primary gets the dominant typographic weight; secondary is decorative / supportive.

## Canvas

- Default 420×560 px (3:4). The most photogenic ratio for both Lock Screen wallpapers and printed cards.
- Alternative 420×747 px (9:16) only if the user explicitly wants a tall poster format.
- All sizes are *logical* px — `scripts/render.js` upscales 2.5714× for print resolution (final 1080×1440).
- Root element must be `<div class="card">` with exact `width: 420px` and `height: <height>px`. No padding on `<body>` — frame CSS injected by `build.js` handles centering.

## Typography

Pick fonts that match the language(s) AND the aesthetic.

**Font CDN selection is region-aware.** Read `data/wedding.json` → `font_cdn`:
- `"fontim"` — user is in mainland China; load from `https://fonts.font.im/css?family=...`
- `"googleapis"` (default) — load from `https://fonts.googleapis.com/css?family=...`

```html
<!-- China mainland -->
<link rel="stylesheet" href="https://fonts.font.im/css?family=Cormorant+Garamond:ital,wght@0,400;0,500&display=swap">

<!-- Everywhere else -->
<link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Cormorant+Garamond:ital,wght@0,400;0,500&display=swap">
```

`fonts.font.im` is a Google-Fonts mirror reachable from CN; `fonts.googleapis.com` is the official Google CDN (faster outside CN, partially blocked inside CN). The skill asks the user at Stage 2; if `font_cdn` is missing, default to `googleapis`.

### Chinese (zh)
Always include the system fallback chain:
```css
font-family: "PingFang SC", "Source Han Serif SC", "Songti SC",
             "STSong", "Noto Serif SC", serif;
```
- Serif / calligraphic / formal: `"Songti SC"`, `"Source Han Serif SC"`, `"Noto Serif SC"`, `"ZCOOL XiaoWei"`
- Sans / modern: `"PingFang SC"`, `"Noto Sans SC"`
- Brush: `"Ma Shan Zheng"` (use sparingly — high character)

### English / Latin scripts (en, es, fr, de, it, pt, ...)
- Serif elegant: `"Cormorant Garamond"`, `"Playfair Display"`, `"EB Garamond"`
- Modern sans: `"Inter"`, `"Manrope"`, `"DM Sans"`
- Display: `"Bodoni Moda"` (high contrast), `"DM Serif Display"`

### Japanese (ja)
- Serif: `"Noto Serif JP"`, `"Source Han Serif JP"`, `"Sawarabi Mincho"`
- Sans: `"Noto Sans JP"`

### Korean (ko)
- Serif: `"Noto Serif KR"`, `"Nanum Myeongjo"`
- Sans: `"Noto Sans KR"`, `"Nanum Gothic"`

### Arabic / Hebrew / Thai / others
- Use `"Noto Serif <Lang>"` and `"Noto Sans <Lang>"` (Google Fonts). Include `dir="rtl"` on the `<html>` tag for Arabic / Hebrew.

### Sizes (logical px, on a 420×560 canvas)
- Primary couple names: 22-28 px
- Secondary names / pinyin / romanization: 9-11 px, letter-spacing 4-6 px
- Date headline: 24-32 px
- Subdate / lunar / period qualifier: 10-13 px
- Venue / address: 11-13 px
- Decorative tags: 8-10 px, letter-spacing 3-5 px

**Letter spacing**: 2-6 px on Chinese / Japanese names and headers feels formal. 0 px feels casual. For Latin scripts, 1-3 px on small caps; 0 on body.

## Color palettes

Pick **one** palette per design. Don't mix.

| Palette name | Background | Primary | Accent | Text | Mood |
|---|---|---|---|---|---|
| Chinese classic | `#fdf8f0` paper cream | `#b8362b` vermilion | `#d4af37` antique gold | `#1a1a1a` | refined traditional |
| Red-gold (banquet) | `#b8362b` red | `#d4af37` gold | — | `#fdf8f0` cream | full traditional |
| Modern minimal | `#fafaf7` off-white | `#0a0a0a` near-black | `#b8956a` muted gold | `#1a1a1a` | Scandi minimalism |
| Morandi | `#e8e4dc` warm grey | `#7a8a6d` sage | `#a59585` sand | `#2c2c2c` | soft contemporary |
| Mediterranean | `#e8f0e8` mint white | `#5a7a5e` olive | `#c4825a` terracotta | `#2c4a3e` | destination / outdoor |
| Palace / black-gold | `#1a1a1a` deep black | `#d4af37` royal gold | `#b8362b` red | `#e0d8c8` cream | museum / formal |
| Newspaper / sepia | `#f4ede0` newsprint | `#1a1a1a` ink | `#8b7355` sepia | `#1a1a1a` | old-print / editorial |
| Wabi-sabi | `#fafafa` rice paper | `#1a1a1a` ink | `#888` sumi grey | `#2c2c2c` | Japanese restraint |
| Art-deco | `#1a1a1a` black | `#d4af37` gold | `#b8956a` brass | `#f4ede0` ivory | Gatsby glamour |
| Vintage stars | midnight `#0e1428` | brass `#c8a154` | star-white `#f0e8d4` | `#e0d8c8` | celestial / night |
| Indian regal | maroon `#7a1f2e` | gold `#d4a02a` | saffron `#e8a042` | `#f4d8a0` ivory | Indian wedding regal |
| Arabic geometric | teal `#1d6160` | gold `#c8a040` | ivory `#f0e0c0` | `#f0e0c0` | Islamic geometric |
| Latin folk | cream `#faf2e4` | coral `#e7665a` | turquoise `#3aa39a` + marigold `#e8a330` | `#3a2a20` | Mexican folk vibrant |
| French Provence | ivory `#f5f1e8` | lavender `#a08fbf` | sage `#8a9882` | `#4a3a4a` | French countryside |
| Korean royal | cream `#f5ede0` | emerald `#326b3c` | gold `#c8a040` + rose `#c9817e` | `#2a4a32` | Joseon traditional |

## Visual vocabulary by aesthetic

These describe what to **produce**. Design from these principles, not by reading example HTMLs.

### new-chinese (新中式)
Refined traditional, not red-explosion. Palette: *Chinese classic*. Typography: `Songti SC` for ZH headlines, `Cormorant Garamond` for EN/pinyin. Decorative: 囍 character as centerpiece (use a real Unicode character with serif font, NOT an emoji), a single seal-shaped block with the groom's surname character (`{{names.groom_zh.0}}`), thin gold hairlines as borders, optional lotus / plum line-art (SVG paths). Layout: photo top, names center, date+venue bottom.

### red-gold (传统红金)
Full traditional banquet feel. Palette: *Red-gold*. Background is solid red; text and ornaments are gold. Typography: `Noto Serif SC` weight 700+ for names, gold-colored. Decorative: a large 囍 centerpiece (SVG with gold strokes), traditional cloud / paisley motifs at corners (as SVG paths or filled shapes), a "X 府之喜" or "X 宅囍事" line where X is the family surname character. Very symmetric, banquet-hall energy.

### palace / gugong (故宫工笔)
Museum-grade. Palette: *Palace / black-gold*. Typography: `Songti SC` or `Ma Shan Zheng` for ZH; serif EN small. Decorative: a fan-shaped photo crop (a `clip-path: ellipse(...)` or SVG mask), painted bird-flower motif in line art (gold strokes on dark), traditional seal stamps with year + couple character at corner. Layout: photo as central fan, names flowing around it.

### wabi-sabi
Japanese restraint. Palette: *Wabi-sabi*. Typography: `Noto Serif JP` or `Sawarabi Mincho` for ZH/JP; light-weight serif for EN. Decorative: an enso (Zen circle) drawn as SVG with brush-like stroke, single ink-wash stroke (SVG path with calligraphic weight), generous negative space. Asymmetric. NO symmetry.

### morandi
Soft contemporary. Palette: *Morandi*. Typography: sans-serif everywhere (`Inter` / `Manrope` for EN; `PingFang SC` for ZH); NEVER serif. Decorative: thin hairlines as dividers, asymmetric framing, oval or rounded-rectangle photo crop, no ornaments beyond geometric lines. Photographer-friendly.

### art-deco
Gatsby-era glamour. Palette: *Art-deco*. Typography: high-contrast display serif (`Bodoni Moda`, `Cormorant Garamond` italic). Decorative: symmetric geometric frames (rectangles within rectangles), sunburst rays from corners, chevron / zigzag borders, monogram circle in center with `{{names.groom_en.0}}&{{names.bride_en.0}}`. Heavy symmetry.

### vogue (editorial / fashion)
Magazine-cover energy. Palette: *Modern minimal*. Typography: oversized display serif for headline (`Playfair Display` 80+px even on 420 canvas), small caps body. Decorative: asymmetric photo placement (full-bleed on one side), vertical type elements (rotated `writing-mode: vertical-rl`), thin one-pixel rules, FIG. 1 / VOL. style annotations.

### newspaper
Old-print broadsheet. Palette: *Newspaper / sepia*. Typography: `Playfair Display` for headlines, `EB Garamond` for body, ZH = `Songti SC`. Decorative: faux masthead with "The X Times" (use `{{site.newspaper_title}}`), column rules, fake byline `By staff reporter`, FIG. 1 photo caption, drop cap on first paragraph. Treat it as a single front-page article about the wedding.

### letter (手写信笺)
Personal letter feel. Palette: warm cream `#f8f1e4` or `#fdf8f0`. Typography: a hand-style serif (`EB Garamond` italic) or actual handwriting font (`Caveat`, `Dancing Script` — use sparingly). Decorative: lined paper effect (very subtle horizontal lines), a "Dear ___," opening, signature at bottom in handwriting style. Asymmetric, intimate.

### modern-minimal
Scandi-Japanese minimalism. Palette: *Modern minimal*. Typography: sans-serif throughout (`Inter`), generous size hierarchy. Decorative: **nothing.** Empty space IS the decoration. A single thin horizontal rule, maybe. One small accent line for date.

### mediterranean
Outdoor / destination. Palette: *Mediterranean*. Typography: relaxed serif (`EB Garamond`), informal small caps. Decorative: olive branch line-art (SVG), sun rays at corner, optional wave motif. Mood: sunny, casual, beach.

### vintage-stars (复古星空)
Celestial / night wedding. Palette: *Vintage stars*. Typography: serif (`Cormorant Garamond` italic) + tiny brass-color caps. Decorative: small star icons scattered (SVG `★` or 4-point asterisks), constellation lines, optional small moon phase glyph, gold border. Mood: night-sky romantic.

### retro-poster
Old travel-poster aesthetic. Palette: mustard `#d4a02a` / teal `#3a7060` / cream `#f4e8c4`. Typography: condensed bold sans (`Bebas Neue`), all caps. Decorative: thick block borders, sun-ray motif from corner, geometric retro shapes, location stamp.

### ink-flower (水墨花卉)
Chinese ink-painting feel. Palette: rice paper background, ink black, single accent color (peach pink or plum red). Typography: ZH = `Ma Shan Zheng` (brush) for headlines, `Noto Serif SC` for body. Decorative: a single ink-flower painting at corner (SVG line art or PNG), red seal stamp (could be `{{names.groom_zh.0}}` in a square red box), splashes of ink as wash effects. Asymmetric, soft.

### indian (印度)
Regal traditional Indian wedding. Palette: *Indian regal*. Typography: `Cinzel` for English caps headers, `Cormorant Garamond` for body; for Hindi/Devanagari `Tiro Devanagari Hindi` or `Noto Serif Devanagari`. Decorative: a large mandala SVG at top (concentric rings with 8 petals + gold lines), paisley flourishes on the sides (curved drop shapes with inner detail), a row of stylized lotus / marigolds at bottom. Heavy gold-on-maroon palette. Multi-layered ornate frame around photo (gold rings, double border). Mood: regal, abundant, ceremonial.

### arabic (阿拉伯 / Islamic geometric)
Middle Eastern formal. Palette: *Arabic geometric*. Typography: `Amiri` for Arabic script lines, `Cormorant Garamond` for English; ZH = `Noto Serif SC`. Decorative: photo wrapped in an arched (mihrab-style) frame — flat bottom, curved arch top. Subtle 8-point star tile pattern as background. Arabesque corner ornaments (curling vine + small star at each corner). 8-point star or "✦" as section dividers. Heavy symmetry, gold-on-teal palette.

### latin (拉美 / Mexican folk)
Vibrant Latin folk art. Palette: *Latin folk*. Typography: `Cinzel` decorative for headers, `Cormorant Garamond` italic for romance lines. Decorative: papel picado-style cut-paper banner at top (rectangle with cut-out shapes in different colors), marigold flower clusters at corners (orange petals + red center, with green stem), Talavera-tile striped border at bottom (alternating coral / turquoise / marigold blocks). Photo with double-color border (gold outer + turquoise inner). Mood: festive, warm, joyful.

### french-provence (法式普罗旺斯)
French countryside romance. Palette: *French Provence*. Typography: `Allura` cursive for monograms / `amour` script, `Cormorant Garamond` for headlines, `EB Garamond` for body. Decorative: lavender sprigs arching over the top (curved branch + small purple ellipse flowers), botanical line-art running down the sides (vine + small leaves), subtle gold dot dividers. Photo with vintage rounded-top frame (50% 50% 4px 4px border-radius). Mood: soft, romantic, countryside elegance.

### korean-hanbok (韩式)
Traditional Korean Joseon-era formal. Palette: *Korean royal*. Typography: `Nanum Myeongjo` for Korean characters (e.g. 결혼, 신랑, 신부), `Cormorant Garamond` italic for English; ZH = `Noto Serif SC`. Decorative: solid emerald top band, traditional Korean knot (kkwaegi) ornament centered in the band (a 4-loop knot drawn as overlapping curves), persimmon / lotus motifs in vertical strips on the sides (red circles with gold petals), thin rose-gold bottom band. Photo with arched-top frame (matches royal portrait conventions). Mood: ceremonial, jewel-toned, traditional.

### Adapting any aesthetic to non-CJK languages
The aesthetic is the **palette + decorative motifs**, not the language. For an English-only morandi invitation: drop the Chinese fonts, use Inter/Manrope throughout, but keep the morandi palette and the asymmetric layout. The cultural aesthetics (`new-chinese`, `red-gold`, `palace`, `wabi-sabi`) have stronger cultural baggage — use them only when the language matches OR the couple explicitly wants that aesthetic.

## Photo handling

- Wrap photo in a container so the shape is independent of the image:
  ```html
  <div class="photo-wrap">
    <img id="main-photo" src="{{design.primary_photo_url}}" alt="couple">
  </div>
  ```
- `.photo-wrap` has fixed `width × height`, `overflow: hidden`, and `border-radius` defining the shape (circle = 50%, square = 4px, oval = 50% with non-1:1 aspect, arched = `50% 50% 4px 4px`)
- `<img>` inside uses `object-fit: cover` and `object-position: center 12%` (12% from top keeps heads in frame for portrait photos — adjust 4-20% per design)
- Never display the bare image without a wrap — you lose control over cropping

## Layout patterns

| Layout | Use when |
|---|---|
| Photo top, names + date below | most cases (3:4 canvas with portrait photo) |
| Asymmetric photo + side text | bold / editorial styles (vogue, art-deco) |
| Photo as background with text overlay | dramatic / cinematic (palace, vintage-stars) |
| Letter / newspaper full-page layout | nostalgic / "personal note" tone |
| Save-the-date single statement | minimal copy, big visual (modern-minimal) |

## Mobile-first

The final output is a PNG, but users will preview the HTML on phones too. The card sits centered on a dark `<body>` background. No responsive breakpoints needed (fixed 420 px wide), but font sizes must be readable when the PNG is opened on a phone (1080-wide PNG ≈ fills a phone screen).

## Forbidden patterns

- ❌ **Reading `examples/*.html`** — use this document as your only visual vocabulary
- ❌ **Defaulting to Chinese** unless the user picked `zh` in `languages`
- ❌ **Hardcoded names, dates, places** — always `{{path.to.value}}` placeholders; the field names depend on the active languages (`groom_zh` vs `groom_en` vs `groom_es`)
- ❌ Emoji decorations — wedding invitations need real visual elements (SVG seals, calligraphic strokes, geometric lines)
- ❌ More than 3 distinct colors in one design (palette + 2 supporting accents max)
- ❌ Casual fonts (Comic Sans, fake handwriting unless the letter aesthetic explicitly asks for it)
- ❌ Drop shadows on text (looks 2008)
- ❌ Gradient backgrounds (rarely work for print; flat colors photograph better)
- ❌ Copying decorative SVG/CSS verbatim from another template — design fresh
