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

### No element may extend outside the canvas

**Hard rule:** every visible element — text, photo, SVG decoration, frame, seal stamp, date numeral — must fit inside the 420×height card. Bleed-through past the card edge looks broken on web preview and gets clipped weirdly during PNG render.

Mandatory safety net:

```css
.card {
  width: 420px;
  height: 560px;             /* or the chosen height */
  overflow: hidden;          /* ← non-negotiable */
  position: relative;        /* so abs-positioned children resolve against the card */
}
```

Watch these specific failure modes — they have all bitten real templates:

- **Vertical text** (`writing-mode: vertical-rl`) — measure the *height* of the text run; long names like 沈安然 plus pinyin in vertical mode can be 200+ px tall and trivially exceed the card height.
- **Oversized display numerals** — `font-size: 96px` "10.18" or "08·15" on the card looks gorgeous but the bounding box can extend past the right or bottom edge. Always test render and check the actual painted width.
- **Decorative SVG rays / sunbursts / mandalas** at corners — these often have a viewBox larger than expected; if positioned at `top: 0; right: 0` they spill past the card.
- **Seal stamps / monograms with `position: absolute`** — `right: -10px` (or any negative offset) and `top: -5px` move the element outside the card. Use non-negative offsets only.
- **Border rings around the photo** — `box-shadow: 0 0 0 20px gold` adds 20 px outside the photo wrap; if the wrap is already near the card edge, the ring will spill.
- **Vertical decorative stripes / side bars** running edge-to-edge — verify they end at `height: 560px`, not `100vh`.

Verify by previewing each template at exactly 420 px viewport width — anything visible outside the card outline is a bug to fix before declaring the template done.

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

## Color palettes — starting points, not prescriptions

The table below lists named palette references you can use as a **starting point**. They're not prescriptions: shift hues to match the user's photo tones, the couple's preferences, the venue lighting, the season. Pick **one** palette per design (don't mix), but stay free within that palette's family.

A few hard rules that stay strict:
- Cultural-authentic palettes (`Red-gold`, `Indian regal`, `Arabic geometric`, `Korean royal`) should keep their dominant hue and gold accents — those *are* the aesthetic. Other choices can drift.
- Don't combine more than 3 distinct hues in one design (background + primary + 1-2 accents). Crowded palettes look amateurish.

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

Each entry below describes an aesthetic **direction**, not a fixed template. The job of the agent is to *design* an invitation in that direction — adapting the palette, typography, and decoration to **this** couple's photo, language, and preferences. The starting points are reference; the **Spirit** and **NEVER** lists are the load-bearing constraints.

How to read each entry:

- **Spirit** — what the aesthetic IS at its core. The single most important line.
- **Starting palette** — a reference, not a prescription. Shift hues to harmonize with the couple's photo tones.
- **Typography** — the *family* / *register* matters more than the exact font name.
- **Decoration** — motifs that fit the aesthetic. Pick a few; don't pile them all on.
- **Photo frame** — shapes that work with this aesthetic's mood.
- **NEVER** — things that break the aesthetic. These are hard. Stick to them.
- **Hard cultural requirements** (some aesthetics only) — non-negotiable elements that ARE the aesthetic. Skipping them loses authenticity.

### new-chinese (新中式)

**Spirit**: refined traditional Chinese — Suzhou-garden restraint, not red-explosion banquet. Cream paper + a single vermilion accent + antique gold hairlines.
**Starting palette**: warm paper cream (`#fdf8f0`-ish), vermilion accent (`#b8362b`-ish), antique gold (`#d4af37`-ish), deep ink text. Adapt the cream warmth to the couple's photo; keep vermilion as a single deliberate accent (one seal, one small block — not everywhere).
**Typography**: ZH = serif/traditional family (`Songti SC`, `Source Han Serif SC`, `Noto Serif SC`, or `ZCOOL XiaoWei`). EN/pinyin = quiet elegant serif (`Cormorant Garamond` or `EB Garamond`). Letter-spacing 2-6 px on ZH names for formality.
**Decoration**: a 囍 character used carefully as centerpiece (real Unicode glyph in a serif font, NOT an emoji); thin gold hairlines as dividers / borders; optional single seal-shaped block holding `{{names.groom_zh.0}}`; subtle lotus / plum / ink-line motifs OK in small doses (SVG).
**Photo frame**: oval, soft arch, or rounded rectangle — refined, not assertive.
**NEVER**: solid red background, garish gold gradients, emoji decorations, more than one bold accent color.

### red-gold (传统红金)

**Spirit**: full traditional Chinese banquet — celebratory, symmetric, ornate, red dominates, gold ornaments. The aesthetic that ties to wedding-banquet halls and tea-ceremony scrolls.
**Starting palette**: red background (`#b8362b` to `#a02520`), gold primary (`#d4af37`-ish), cream highlights for legibility. The red should be deep banquet red, not bright modern red.
**Typography**: ZH = bold traditional serif (`Noto Serif SC` 700+, `Source Han Serif SC` 700+, or `Songti SC` heavy). Color the heavy weight gold. EN = decorative serif (`Cormorant Garamond` italic or `Playfair Display`) used sparingly.
**Decoration**: large 囍 centerpiece in gold SVG strokes (this is mandatory for the aesthetic); traditional cloud / paisley motifs at corners (gold-on-red); a "X 府之喜" line where X is `{{names.groom_zh.0}}`. Layout symmetric, banquet-hall energy.
**Photo frame**: framed in a gold border (single ring is fine; double ring also classic). Square or rectangle suits the formality.
**NEVER**: muted Morandi tones, sans-serif body fonts, asymmetric layouts, white/cream-dominant backgrounds.
**Hard cultural requirements**: red must be the dominant hue; gold must be the accent; the 囍 (or equivalent traditional symbol) appears somewhere prominent.

### palace / gugong (故宫工笔)

**Spirit**: museum-grade Chinese imperial — Forbidden City gongbi paintings, lacquer artifact richness. Deep black background, gold detail, scroll-painting refinement.
**Starting palette**: deep black or near-black (`#1a1a1a`-ish), royal gold (`#d4af37`-ish), small vermilion accents OK, cream/ivory for legible text on dark. Photo can carry warm imperial-red tones from the dress.
**Typography**: ZH = `Songti SC`, `Source Han Serif SC`, or `Ma Shan Zheng` (brush) for headlines. EN = quiet serif (`Cormorant Garamond`) — small role.
**Decoration**: fan-shaped or arched photo crop is iconic; painted bird-flower line art (gold strokes on dark); traditional square seal stamps (year + couple character) tucked in a corner.
**Photo frame**: fan shape (`clip-path: ellipse(...)`), arched top, or scroll-shape rectangle.
**NEVER**: light backgrounds, modern sans-serif, geometric grids, casual photography poses.
**Hard cultural requirements**: dark luxury background (not cream); gold as the primary ornament color.

### wabi-sabi

**Spirit**: Japanese aesthetic of restraint and asymmetric quiet. Negative space, ink-painting feel, the unfinished. The opposite of decoration.
**Starting palette**: rice-paper white (`#fafafa`-ish), ink black (`#1a1a1a`-ish), one sumi-grey (`#888`-ish). Optional: a single soft accent (faded pink, moss green) only if the photo invites it.
**Typography**: JP = `Noto Serif JP` or `Sawarabi Mincho`. ZH = `Songti SC` or `Source Han Serif SC`. EN = light-weight serif (`Cormorant Garamond` light, `EB Garamond` light). Generous size hierarchy. Letter-spacing wide.
**Decoration**: very minimal. One enso (Zen circle) SVG with brush-like stroke. One ink-wash stroke. That's it. **Negative space IS the decoration**.
**Photo frame**: irregular oval, soft arch, or no frame at all (image bleeds into white). Asymmetric placement.
**NEVER**: symmetry, multiple decorative motifs, saturated color, ornate borders.

### morandi

**Spirit**: photographer-friendly, restrained contemporary. Asymmetric. Named for Italian painter Giorgio Morandi's muted still-life palette — grays that hold warmth.
**Starting palette**: muted neutrals. One warm neutral (warm grey `#e8e4dc`, cream, dusty beige) + one soft accent (sage `#7a8a6d`, dusty blue, lichen, smoky lavender) + optionally one secondary (sand, muted clay, smoke) + deep text. Adapt to the photo tones — if photo is cool, push accent cooler; if warm, push toward sand.
**Typography**: clean sans-serif. Latin = `Inter` / `Manrope` / `DM Sans`. ZH = `PingFang SC` / `Noto Sans SC`. Light serif (`Cormorant Garamond` italic) acceptable in tiny doses for a date or monogram.
**Decoration**: minimal — hairline dividers, asymmetric framing, small geometric shapes. Restraint is the look.
**Photo frame**: oval, rounded rectangle, soft arch, or full-bleed asymmetric.
**NEVER**: saturated jewel tones, gold ornaments, vermilion / red accents, brush scripts, display serifs, scrollwork.

### art-deco

**Spirit**: Gatsby-era glamour. High-contrast, heavily symmetric, geometric ornament. Glittering nightlife mood.
**Starting palette**: black background (`#1a1a1a`-ish), gold primary (`#d4af37`-ish), brass / champagne secondary, ivory text. Substitute black with deep navy or oxblood if the photo invites — but keep high contrast.
**Typography**: high-contrast display serif. `Bodoni Moda`, `Playfair Display`, `Cormorant Garamond` italic. Headlines can be large. Small caps for body.
**Decoration**: symmetric geometric frames (rectangles within rectangles); sunburst rays from corners; chevron / zigzag borders; a centered monogram circle with `{{names.groom_en.0}}&{{names.bride_en.0}}`.
**Photo frame**: rectangle with stepped art-deco border, or a centered oval inside a geometric frame.
**NEVER**: asymmetric layouts, soft Morandi pastels, brush scripts, naturalistic florals.
**Hard requirements**: symmetry; geometric (not organic) ornament; gold-on-dark contrast.

### vogue (editorial / fashion)

**Spirit**: magazine-cover energy. Editorial, oversized type, asymmetric photo placement. Treats the invitation like a fashion-magazine spread.
**Starting palette**: monochrome or near-monochrome. Off-white background + near-black + one muted accent (muted gold, dusty pink, smoke). High-contrast minimalism.
**Typography**: oversized display serif for headline (`Playfair Display`, `Bodoni Moda`, `Cormorant Garamond` — 60-90 px on the 420-canvas). Small caps body. Strong size hierarchy.
**Decoration**: vertical text elements (`writing-mode: vertical-rl`) — magazine columns; thin one-pixel rules; FIG. 1 / VOL. annotations.
**Photo frame**: full-bleed on one side (asymmetric); large; the photo IS the design.
**NEVER**: ornate decoration, symmetric layouts, multiple competing accent colors.

### newspaper

**Spirit**: front-page newspaper article ABOUT the wedding. Old broadsheet feel, sepia / newsprint aging, columns of type.
**Starting palette**: newsprint cream (`#f4ede0`-ish), ink black, optional sepia accent. Looks like aged paper.
**Typography**: `Playfair Display` for headlines, `EB Garamond` for body, `Songti SC` for ZH. Drop caps on first paragraph. Italic byline.
**Decoration**: faux masthead with "The X Times" (`{{site.newspaper_title}}`); column rules; FIG. 1 photo caption; fake byline ("By staff reporter").
**Photo frame**: square or rectangle with thin caption below. Black-and-white or sepia photo treatment.
**NEVER**: bright modern colors, sans-serif body, glossy effects, drop shadows.

### letter (手写信笺)

**Spirit**: personal handwritten letter from the couple to the guest. Intimate, asymmetric, warm.
**Starting palette**: warm cream paper (`#f8f1e4` / `#fdf8f0`), dark ink (deep brown or black). Maybe one understated accent (a single seal-red, a navy ink).
**Typography**: hand-style serif (`EB Garamond` italic) or actual handwriting font (`Caveat`, `Dancing Script` — use sparingly, only for the signature). For ZH letters, `Ma Shan Zheng` or a hand-feel font.
**Decoration**: lined paper effect (very subtle horizontal rules); a "Dear ___," opening line; a signature at bottom in handwriting style.
**Photo frame**: small, tucked, often square or polaroid-like. Sometimes no photo at all (let the letter speak).
**NEVER**: ornate borders, symmetric formal layouts, multiple competing colors, glossy effects.

### modern-minimal

**Spirit**: Scandi-Japanese restraint. Type does all the heavy lifting. Empty space is the decoration.
**Starting palette**: off-white background (`#fafaf7`-ish), near-black text, optional one muted accent (`#b8956a` muted gold, soft sage, or skip the accent entirely).
**Typography**: sans-serif throughout (`Inter`, `Manrope`, `DM Sans`). Generous size hierarchy — the date is huge, names are large, supporting info is small. Light weight preferred.
**Decoration**: **nothing.** Maybe one thin horizontal rule. One small accent line below the date. That's it.
**Photo frame**: oval (small, off-center), tall rectangle, or no photo (text-only save-the-date).
**NEVER**: any decoration beyond a single rule, multiple colors, brush scripts, ornate borders.

### mediterranean

**Spirit**: outdoor destination — sunny, casual, beach / vineyard / olive grove. Warmth + leaves + a hint of terracotta.
**Starting palette**: mint-cream background (`#e8f0e8`-ish) or ivory; olive green (`#5a7a5e`) primary; terracotta / clay accent (`#c4825a`); deep text. Adapt to the venue — beach pulls toward blue-greens, vineyard pulls toward warm clay.
**Typography**: relaxed serif (`EB Garamond`, `Cormorant Garamond`). Casual feel, not formal small caps.
**Decoration**: olive branch line-art (SVG); optional sun rays from corner; optional wave motif. Sparse — let the warmth of the palette carry it.
**Photo frame**: rounded rectangle, soft arch, or oval. Casual outdoor feel.
**NEVER**: heavy gold, dark formal backgrounds, brush calligraphy, jewel-tone saturation.

### vintage-stars (复古星空)

**Spirit**: celestial / night wedding — moon, stars, deep sky, brass accents. Romantic + dreamy.
**Starting palette**: midnight blue (`#0e1428`-ish) or deep indigo background; brass (`#c8a154`-ish) for accents; star-white highlights; cream text.
**Typography**: serif (`Cormorant Garamond` italic, `Playfair Display` italic) + tiny brass-color caps for labels.
**Decoration**: small star icons scattered (real SVG, not emoji); constellation lines connecting a few; optional moon phase glyph; thin gold border.
**Photo frame**: oval, arched, or in a starry frame. Photo can have a slight cool tone.
**NEVER**: bright modern colors, beachy palettes, casual sans-serif, daytime energy.

### retro-poster

**Spirit**: old travel-poster aesthetic — bold flat color blocks, condensed type, geometric sun-ray motifs, mid-century feel.
**Starting palette**: warm mustard (`#d4a02a`-ish), teal (`#3a7060`-ish), cream (`#f4e8c4`-ish). Adapt to the era you're invoking (1920s travel = teal+mustard; 1950s = mint+coral; 1970s = avocado+orange).
**Typography**: condensed bold sans (`Bebas Neue`, `Oswald`, `Anton`). All caps. Strong leading.
**Decoration**: thick block borders; sun-ray motif from corner; geometric retro shapes (circles, triangles); a "location stamp" rectangle.
**Photo frame**: rectangle with thick mid-century border. Photo color-tinted to match the era.
**NEVER**: serif body, soft pastels, ornate florals, asymmetric whitespace.

### ink-flower (水墨花卉)

**Spirit**: Chinese ink-painting feel — rice paper, brush strokes, one delicate floral motif. Soft + traditional + literary.
**Starting palette**: rice paper background (`#fafafa` or `#f5efe1` warm), ink black, one accent color (peach pink / plum red / soft jade — pick ONE).
**Typography**: ZH = `Ma Shan Zheng` (brush) for headlines; `Noto Serif SC` for body. EN = quiet light serif.
**Decoration**: a single ink-flower painting at one corner (SVG line art or PNG); a red seal stamp (`{{names.groom_zh.0}}` in a square red box) is iconic; optional ink-wash splash.
**Photo frame**: irregular soft shape, fan, or no frame (image fades into rice paper).
**NEVER**: multiple competing accent colors, symmetric heavy ornament, modern sans-serif, glossy effects.

### indian (印度)

**Spirit**: regal traditional Indian wedding — abundance, ornate gold-on-maroon, mandala / paisley / marigold motifs. Ceremonial richness.
**Starting palette**: deep maroon (`#7a1f2e`-ish) or rich red; gold primary (`#d4a02a`-ish); saffron / marigold secondary (`#e8a042`); ivory text. The dress carries warm reds and golds; the design echoes them.
**Typography**: Latin = `Cinzel` for headers (caps, decorative), `Cormorant Garamond` for body. Hindi/Devanagari = `Tiro Devanagari Hindi` or `Noto Serif Devanagari`.
**Decoration**: a large mandala SVG at the top (concentric rings with 8 petals + gold lines); paisley flourishes on the sides; a row of stylized lotus / marigolds at bottom. Multi-layered ornate frame around the photo (gold rings, double border).
**Photo frame**: ornate gold double or triple border; circle or arched top.
**NEVER**: muted Morandi tones, sans-serif body, minimal decoration, single-color schemes.
**Hard cultural requirements**: gold-on-maroon dominance; at least one of the iconic motifs (mandala / paisley / marigold) present.

### arabic (阿拉伯 / Islamic geometric)

**Spirit**: Middle Eastern formal — Islamic geometric pattern, mihrab arch, 8-point star tiles. Symmetric, refined, gold-on-teal.
**Starting palette**: teal / deep green (`#1d6160`-ish) background; gold primary (`#c8a040`); ivory (`#f0e0c0`) for highlights and text. Adapt teal hue toward navy or emerald if the photo suggests.
**Typography**: Arabic = `Amiri` (proper Arabic typeface). Latin = `Cormorant Garamond`. ZH = `Noto Serif SC`. Right-to-left layout for Arabic with `dir="rtl"` on `<html>`.
**Decoration**: photo wrapped in a mihrab arch (flat bottom, curved arch top); subtle 8-point star tile pattern as background texture; arabesque corner ornaments; "✦" or 8-point star as section dividers.
**Photo frame**: **mihrab arch is mandatory** — flat bottom edge, smooth curved top.
**NEVER**: asymmetric layout, brush scripts, casual photography, muted Morandi tones.
**Hard cultural requirements**: mihrab arch around the photo; gold-on-teal palette; geometric (not organic) ornament; symmetric layout.

### latin (拉美 / Mexican folk)

**Spirit**: vibrant Mexican / Latin folk art — papel picado, marigolds, Talavera tile, joyful warmth.
**Starting palette**: warm cream (`#faf2e4`-ish); coral / hot pink primary (`#e7665a`); turquoise + marigold secondary (`#3aa39a`, `#e8a330`); deep warm text. This is the one aesthetic where MORE color is the point.
**Typography**: `Cinzel` decorative for headers; `Cormorant Garamond` italic for romance lines.
**Decoration**: papel picado-style cut-paper banner at top (rectangle with cut-out shapes in different colors); marigold flower clusters at corners (orange petals + red center, with green stem); Talavera-tile striped border at bottom (alternating coral / turquoise / marigold blocks).
**Photo frame**: double-color border (gold outer + turquoise inner).
**NEVER**: muted tones, single-color schemes, austere minimalism, brush scripts.
**Hard cultural requirements**: at least one of (papel picado, marigold, Talavera tile) present; vibrant multi-hue palette.

### french-provence (法式普罗旺斯)

**Spirit**: French countryside romance — lavender fields, olive groves, soft pastels, hand-script monograms. Pastoral elegance.
**Starting palette**: ivory (`#f5f1e8`-ish); lavender (`#a08fbf`) primary; sage (`#8a9882`) secondary; deep mauve text (`#4a3a4a`-ish). Adapt: cooler lavender for hotter days, warmer mauve for evening venues.
**Typography**: `Allura` cursive for monograms or "amour" script (small, used as accent); `Cormorant Garamond` for headlines; `EB Garamond` for body.
**Decoration**: lavender sprigs arching over the top (curved branch + small purple ellipses); botanical line-art running down the sides (vine + leaves); subtle gold dot dividers.
**Photo frame**: vintage rounded-top frame (`border-radius: 50% 50% 4px 4px`).
**NEVER**: bold saturated colors, heavy formal layouts, condensed sans, dark backgrounds.

### korean-hanbok (韩식)

**Spirit**: Joseon-era Korean royal formal — emerald + rose + gold, kkwaegi knot, ceremonial calm. Traditional jewel-toned.
**Starting palette**: cream (`#f5ede0`) background; emerald green (`#326b3c`-ish) primary; gold (`#c8a040`) accent; rose (`#c9817e`) tertiary; deep emerald text.
**Typography**: Korean = `Nanum Myeongjo` for headings (e.g. 결혼, 신랑, 신부). Latin = `Cormorant Garamond` italic. ZH = `Noto Serif SC`.
**Decoration**: solid emerald top band; traditional Korean kkwaegi knot ornament centered in the band (4-loop knot drawn as overlapping SVG curves); persimmon / lotus motifs in vertical strips on the sides (red circles with gold petals); thin rose-gold bottom band.
**Photo frame**: arched-top frame (matches royal portrait conventions).
**NEVER**: casual outdoor energy, muted Morandi tones, brush calligraphy that's not Korean.
**Hard cultural requirements**: kkwaegi knot or equivalent traditional Korean motif present; jewel-toned palette (not pastel).

### Adapting an aesthetic to a different language

The aesthetic IS the spirit + palette + decoration vocabulary — not the language. For an English-only `morandi` invitation, drop the Chinese fonts and use Inter/Manrope throughout; keep the morandi palette/spirit/asymmetry. For a Chinese `art-deco` invitation, use `Bodoni Moda` for the small EN bits and `Songti SC` for the Chinese names, but keep the gold-on-black symmetry.

The strongly culture-specific aesthetics (`new-chinese`, `red-gold`, `palace`, `ink-flower`, `wabi-sabi`, `indian`, `arabic`, `latin`, `korean-hanbok`) have stronger cultural baggage. Use them only when the language / cultural fit matches, OR the couple explicitly wants that aesthetic. Don't force an English-language wedding into a `red-gold` Chinese banquet aesthetic just because the photo happens to be in red attire.

### When the photo and the aesthetic conflict

Aesthetics aren't fixed cages. Stretch them to match the couple:

- Photo is full-length outdoor casual + couple wants `morandi`: keep the morandi spirit, but loosen — wider rectangle frame instead of oval, larger photo area, less aggressive negative space.
- Photo is bright vermilion qipao + couple wants `wabi-sabi`: that's a real conflict. Either talk them into `new-chinese` (better photo-aesthetic fit) OR honor the wabi-sabi spirit by treating the photo as a single bold ink-mark on white.
- Couple is bilingual zh+en + wants `morandi`: keep morandi visual, use a Chinese family-name as a tiny stamp accent if they want a cultural touch — adapt without breaking the spirit.

**The agent uses judgment.** The vocabulary above is a starting point, not a destination.

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
- **The `id="main-photo"` on the `<img>` is required** — the gallery's photo-switcher and the build pipeline both target it by id to swap photos at preview time.

### Photo crop is template-specific — review every design

A given photo crop is not "one size fits all". The same photo cropped to circle vs oval vs arched vs rectangle will succeed or fail differently. **Before declaring any template done, look at the rendered output and verify:**

- The subject's full face (forehead → chin) is visible.
- For couple shots, both people are fully inside the frame — not one half-cut at the edge.
- Key context (held hands, bouquet, ring exchange) is not clipped off.
- The subject isn't squished into a corner of the frame because the photo's aspect ratio fights the wrap's shape.

If the crop is wrong, fix it before showing the user:

| Symptom | Fix |
|---|---|
| Top of head clipped by circular frame | Lower `object-position` Y% (12% → 6% → 2%) or switch to oval / arch |
| Subject's body is shown but head is above the frame | Negative-ish `object-position: center top` or `0%` |
| One person in a couple shot is half-cut at the right edge | Re-center: `object-position: center center` instead of `center 12%`; or switch frame to a wider aspect |
| Photo is full-length, frame is small + tight | Make `.photo-wrap` taller (240→320 px), use rectangle / arched shape, or pick a different (closer-cropped) photo |
| Vertical portrait being forced into a horizontal frame | Change `.photo-wrap` aspect ratio to match the photo, or change the layout |

**Frame shape vs subject framing — a quick guide:**

| Photo framing | Frame shapes that work | Frame shapes to AVOID |
|---|---|---|
| Tight head-and-shoulders | circle, oval, arch, square | full-bleed rectangle (looks empty) |
| Half-body portrait | oval, arch, rounded rectangle | tight circle (clips head) |
| Full-length / group | tall rectangle, arch, no-frame full-bleed | circle, oval, tight square (clips people) |
| Candid / outdoor wide | tall rectangle, full-bleed | any tight geometric frame |

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

## Tweakable templates (CSS variable contract)

The detail-page tweak panel can change a template's color scheme, fonts, photo frame, and component visibility in real time without rebuilding. For this to work, your template MUST follow this contract.

### 1. Use CSS variables for tweak-able properties

In `:root`, declare defaults for everything the user is allowed to tweak. Templates that hardcode `color: #2c2c2c` directly on `.names` cannot be tweaked — the gallery has no way to override.

```css
:root {
  --card-bg: #e8e4dc;
  --card-text: #2c2c2c;
  --card-accent-1: #7a8a6d;
  --card-accent-2: #a59585;
  --font-headline: 'Inter', sans-serif;
  --font-body: 'Inter', sans-serif;
  --photo-radius: 50%;
  --photo-aspect: 4/5;
}
.card {
  background: var(--card-bg);
  color: var(--card-text);
  font-family: var(--font-body);
}
.names { font-family: var(--font-headline); }
.amp, .divider { background: var(--card-accent-1); color: var(--card-accent-1); }
.photo-wrap {
  border-radius: var(--photo-radius);
  aspect-ratio: var(--photo-aspect);
}
```

The `:root` declarations are the standalone preview's defaults; the gallery's panel overrides them by setting inline style on `documentElement`. A "Reset" click removes the inline styles, falling back to `:root`.

### 2. Mark optional components with a class hook

Each optional component (tagline, lunar date, full address, seal, etc.) needs a stable class that matches the `id` declared in `designs.json` → `tweak_options.components`.

```html
<div class="tagline optional">A quiet promise, kept in light.</div>
<div class="lunar-date optional">戊辰年 八月 十五</div>
<div class="address-full optional">{{venue.lines_zh.0}}</div>
```

Add this rule once at the bottom of your `<style>`:

```css
.hidden { display: none !important; }
```

When the user unchecks a component, the gallery sends `{type:'toggle-component', id:'tagline', visible:false}` and the listener adds `.hidden` to every `.tagline` element. Conversely, when a component declares `default: false` in `designs.json`, `build.js` bakes the `hidden` class into the rendered HTML at build time — so the PNG and standalone preview match the gallery's initial state.

### 3. The `optional` class is purely documentation

It signals "this element is allowed to be toggled" to a reader of the template. The runtime only cares about the id-matching class (`.tagline`, `.lunar-date`, …) and the `.hidden` toggle. Feel free to use `.optional` for your own styling if you want.

### 4. Component ids must match the regex `[a-zA-Z][a-zA-Z0-9-]*`

The id is interpolated into a CSS class selector in the iframe's postMessage listener. Anything outside `[a-zA-Z][a-zA-Z0-9-]*` is rejected (the message is silently dropped). Stick to lowercase letters, digits, and hyphens: `tagline`, `lunar-date`, `address-full`, `seal`, `pinyin`. Avoid underscores or non-ASCII.

### 5. After writing the template, populate `tweak_options`

Edit `data/designs.json` and add a `tweak_options` block (see Stage 4 in `workflow.md` for the schema). The agent's job is to choose meaningful variants:

- **Color schemes**: at least 2 (e.g. warm / cool, or palette A / B). Each is a complete vars override — don't ship a "cool" scheme that only swaps the accent and leaves a warm bg.
- **Fonts**: 2–3 options per font variable, all in the aesthetic's family (see Typography above). Don't put a brush script in the "headline" set of a Morandi card.
- **Frames** (optional): the shapes that work for the photo (see "Photo handling"). Each frame entry uses `name_zh` / `name_en` (and optionally a bare `name` fallback) so the panel labels match the user's primary language. If only oval works for your photo, omit the frame switcher. The localized lookup follows `<field>_<lang>` → `<field>_en` → bare `<field>`, where `<lang>` is `data/wedding.json` `languages[0]`. So for a Spanish-language card, the agent writes `name_es` / `label_es`; for Japanese, `name_ja` / `label_ja`. Any user-facing prose (color scheme names, frame names, component labels, design name + description) must be localized this way.
- **Components**: every element you marked `.optional` should appear in `components`. Pick a sensible default (lunar-date defaults to off for most modern Chinese weddings; tagline defaults to on if you wrote one).

If the design doesn't make sense to tweak (e.g. `red-gold`'s red dominance IS the aesthetic — color schemes don't apply), omit `tweak_options` entirely. The panel just won't render.

## Forbidden patterns

- ❌ **Reading `examples/*.html`** — use this document as your only visual vocabulary
- ❌ **Defaulting to Chinese** unless the user picked `zh` in `languages`
- ❌ **Any element extending outside the 420×height canvas** — vertical text, oversized numerals, SVG rays, negative-offset absolutes, edge-to-edge stripes. Use `overflow: hidden` on `.card` as the safety net.
- ❌ **Shipping a template without doing the photo-crop review** — clipped forehead / chin / half-visible person is a bug, not a stylistic choice
- ❌ **Hardcoded names, dates, places** — always `{{path.to.value}}` placeholders; the field names depend on the active languages (`groom_zh` vs `groom_en` vs `groom_es`)
- ❌ **Missing `id="main-photo"` on the photo `<img>`** — the gallery's photo-switcher requires it
- ❌ Emoji decorations — wedding invitations need real visual elements (SVG seals, calligraphic strokes, geometric lines)
- ❌ More than 3 distinct colors in one design (palette + 2 supporting accents max)
- ❌ Casual fonts (Comic Sans, fake handwriting unless the letter aesthetic explicitly asks for it)
- ❌ Drop shadows on text (looks 2008)
- ❌ Gradient backgrounds (rarely work for print; flat colors photograph better)
- ❌ Copying decorative SVG/CSS verbatim from another template — design fresh
