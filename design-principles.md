# Design Principles

Hard constraints for any template you write. These exist because they make the difference between "looks like a wedding invitation" and "looks like a webpage someone made in 1999".

## Canvas

- Default 420×560 px (3:4). The most photogenic ratio for both Lock Screen wallpapers and printed cards.
- Alternative 420×747 px (9:16) only if the user explicitly wants a tall poster format.
- All sizes are *logical* px — `scripts/render.sh` upscales 2.5714× for print resolution (final 1080×1440).
- The root element must be `<div class="card">` with exactly `width: 420px` and `height: <height>px`. No padding on `<body>` — frame CSS injected by `build.js` handles centering.

## Typography

**Chinese fonts** — always include this stack:
```css
font-family: "PingFang SC", "Source Han Serif SC", "Songti SC",
             "STSong", "Noto Serif SC", serif;
```
For serif / calligraphic feel use `"Songti SC", "Source Han Serif SC"`. For modern / clean use `"PingFang SC"` (sans).

**English fonts** — pick from this curated set for matching tone:
- Serif elegant: `"Cormorant Garamond"`, `"Playfair Display"`, `"EB Garamond"`
- Modern sans: `"Inter"`, `"Manrope"`
- Display: `"Bodoni Moda"` (high contrast), `"DM Serif Display"`
- Always load via `<link rel="stylesheet" href="https://fonts.font.im/css?family=...">` (this is fonts.font.im, a Google-Fonts mirror reachable from China — never `fonts.googleapis.com` directly).

**Sizes** — rough hierarchy for 420×560 canvas:
- Couple names (Chinese): 22-28 px
- Pinyin / English names: 9-11 px, letter-spacing 4-6 px
- Date headline: 24-32 px
- Subdate / lunar: 10-13 px
- Venue line: 11-13 px
- Decorative English: 8-10 px, letter-spacing 3-5 px

**Letter spacing for Chinese**: 2-6 px on names and headers feels formal. 0 px feels casual / modern.

## Color palettes

Pick *one* palette per design. Don't mix.

| Style | Background | Primary | Accent | Text |
|---|---|---|---|---|
| Chinese classic | `#fdf8f0` (paper cream) | `#b8362b` (vermilion seal) | `#d4af37` (antique gold) | `#1a1a1a` |
| Modern minimal | `#fafaf7` (off-white) | `#0a0a0a` | `#B8956A` (muted gold) | `#1a1a1a` |
| Morandi | `#e8e4dc` (warm grey) | `#7a8a6d` (sage) | `#a59585` (sand) | `#2c2c2c` |
| Mediterranean | `#e8f0e8` (mint white) | `#5a7a5e` (olive) | `#fff` (highlight) | `#2c4a3e` |
| Palace / black-gold | `#1a1a1a` (deep black) | `#d4af37` (royal gold) | `#b8362b` (red) | `#e0d8c8` |
| Vintage newspaper | `#f4ede0` (newsprint) | `#1a1a1a` | `#8b7355` (sepia) | `#1a1a1a` |
| Japanese wabi-sabi | `#fafafa` (rice paper) | `#1a1a1a` | `#888` (ink wash) | `#2c2c2c` |

## Photo handling

- Wrap photo in a container element so the shape is independent of the image:
  ```html
  <div class="photo-wrap">
    <img id="main-photo" src="{{design.primary_photo_url}}" alt="couple">
  </div>
  ```
- `.photo-wrap` has fixed `width × height`, `overflow: hidden`, and `border-radius` defining the shape (circle = 50%, square = 4px, oval = 50% with non-1:1 aspect)
- `<img>` inside uses `object-fit: cover` and `object-position: center 12%` (12% from top keeps heads in frame for portrait photos — adjust 4%-20% per design)
- Never display the bare image without a wrap — you lose control over cropping

## Layout patterns

The 15 references cover these layouts — pick (or hybrid) based on style direction:

| Layout | Reference | Use when |
|---|---|---|
| Photo top, names + date below | most | most cases (3:4 canvas with portrait photo) |
| Asymmetric photo + side text | `vogue`, `art-deco` | bold / editorial styles |
| Photo as background with text overlay | `gugong`, `vintage-stars` | dramatic / cinematic mood |
| Letter / newspaper layout | `letter`, `newspaper` | nostalgic / "personal note" tone |
| Save-the-date style | `modern-minimal` | minimal copy, big visual |

## Mobile-first

Even though the final output is a PNG, the HTML must look correct on mobile when previewed via file:// — users will preview on their phones too. The card sits centered on a dark `<body>` background. No responsive breakpoints needed (the card is fixed 420 px wide), but make sure font sizes are readable when the PNG is opened on a phone (1080-wide PNG ≈ fills a phone screen).

## Forbidden patterns

- ❌ Hardcoded names, dates, places — always use `{{names.groom_zh}}` etc.
- ❌ Emoji decorations — wedding invitations need real visual elements (SVG seals, calligraphic strokes, geometric lines)
- ❌ More than 3 distinct colors in one design (palette + 2 supporting accents max)
- ❌ Casual fonts (Comic Sans, fake handwriting)
- ❌ Drop shadows on text (looks 2008)
- ❌ Gradient backgrounds (rarely work for print; flat colors photograph better)

## When in doubt

Look at the 3 strongest references first: `new-chinese`, `modern-minimal`, `gugong`. They demonstrate the polish expected. If your design feels weaker than these, redo it.
