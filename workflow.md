# Workflow — how to drive the conversation

This file teaches the agent (you) how to take a user from "I want to make a wedding invitation" to a finished PNG. The flow has 6 stages. Do not skip stages. Do not start writing HTML before stage 4.

## How to interact with the user — 3-tier degradation

For every choice you ask the user to make, prefer the richest interaction the current environment supports:

```
Tier 1 (preferred):  HTML preview in the user's browser
                     Use when: choice is visual (style direction, photo crop, layout)
                     Method: write dist/_preview.html with side-by-side options,
                             tell the user to refresh, then ask which one in text
                             or via AskUserQuestion

Tier 2 (fallback):   AskUserQuestion tool (in-agent multiple-choice modal)
                     Use when: choice is non-visual but discrete (yes/no, short list)

Tier 3 (last resort): plain text question in chat
                     Use when: the above are unavailable, or the answer is open-ended
                     (e.g. "Groom's Chinese name?")
```

Examples:

| Choice | Best tier |
|---|---|
| Pick a style direction | Tier 1 — render 3 reference HTMLs side-by-side |
| Pick which photo is primary | Tier 1 — show all photos as cards |
| Square vs round photo frame | Tier 1 — render both, side-by-side |
| Date / time / venue / names | Tier 3 — open text |
| "Render now?" / "Use red or gold accent?" | Tier 2 — AskUserQuestion |

Never start with Tier 3 if the choice is visual. A wedding invitation is a visual artifact; words alone cannot usefully describe "oval vs square vs arched photo frame".

## Stage 1 — Set up the workspace

1. **Choose working directory.** Default `~/my-wedding/`. Use AskUserQuestion or open text:
   > "Where should I put the project? (default: ~/my-wedding/)"
2. **Copy skeleton:**
   ```bash
   cp -R <skill-path>/skeleton/. <working-dir>/   # note trailing /. — copies contents, not the dir itself
   cd <working-dir>/
   cp data/wedding.example.json data/wedding.json
   cp data/designs.example.json data/designs.json
   ```
3. **Photos** — ask:
   > "Where are your wedding photos on this machine? Give me an absolute directory path (e.g. ~/Pictures/wedding/). I'll copy and rename them into the project."

   Then:
   ```bash
   # Copy with renaming to photo-01.jpg, photo-02.jpg, ...
   i=1
   for f in <user-supplied-dir>/*.{jpg,jpeg,png,heic}; do
     [ -f "$f" ] || continue
     cp "$f" <working-dir>/photos/photo-$(printf '%02d' $i).jpg
     i=$((i+1))
   done
   ```

   Convert HEIC if the user is on Mac (`sips -s format jpeg ...`). Confirm photo count back to the user.

   Don't proceed until `photos/` has at least one image.

## Stage 2 — Gather couple details

Ask the **seed** fields one at a time (open text). You don't need to derive anything by hand — `scripts/derive.js` computes all 26 redundant fields (Chinese number conversion, Roman year, weekday, etc.) from the seed.

**Minimum seed to collect:**

| Field | Question | Notes |
|---|---|---|
| `names.groom_zh` / `bride_zh` | "Groom's / bride's Chinese name?" | open text |
| `names.groom_en` / `bride_en` | "Pinyin?" | usually `FAMILY GIVEN`, all caps |
| `date.iso` | "Wedding date? (YYYY-MM-DD)" | exact ISO format required |
| `time.value` | "What time does the ceremony start? (HH:MM)" | 24-hour |
| `venue.city_zh` / `city_en` / `province_zh` / `province_en` | "Where? Province + city in both languages" | derive both languages |
| `venue.lines_zh` (array) | "Full address as 2 lines (will appear on invitation)" | optional — see AskUserQuestion below |
| `venue.full_zh` / `type_zh` | derive or ask | |
| `date.lunar` | "Include lunar date on the invitation?" | AskUserQuestion: yes / no. If yes, ask the user for the lunar string (format like `戊辰年八月十五`) — derive.js doesn't compute lunar |

**Privacy nudge** — AskUserQuestion: "How detailed should the address be on the card?"
- full address (street level)
- city + venue name only
- region / province only

Write the seed into `data/wedding.json` as you go, then run:

```bash
npm run derive
```

This expands the seed into all required fields (zh_short, zh_formal, en_long, roman_year, weekday_zh, surname_en, couple_en_short, newspaper_title, site.title, site.subtitle, ...). Verify the printed summary matches what the user expects (`[derive] Date: 二〇九九年十月一日 (星期日)`).

If derive.js refuses, the seed is incomplete or malformed — fix the seed and re-run, don't edit derived fields by hand.

## Stage 3 — Style direction (Tier 1 — visual preview)

This is the most important interaction. **Do not ask "do you want minimal or vintage?" in plain text** — show, don't tell.

The skill ships with pre-rendered thumbnails at `references/thumbnails/<style-id>.png` for all 15 reference styles, rendered with placeholder data. They are ready to display immediately — **do not** waste time re-rendering them with the user's data at this stage.

1. Read the user's photos (use the Read tool — they're images). Note the dominant colors, formality of the pose, whether outfits are traditional / western / casual.
2. Based on photos + any explicit user hints, pick 3-5 reference styles that fit. Examples:
   - Indoor formal portraits → `gugong`, `red-gold`, `new-chinese`
   - Outdoor casual / nature → `morandi`, `wabi-sabi`, `mediterranean`
   - Editorial / fashion-y → `vogue`, `art-deco`, `modern-minimal`
3. Build a simple HTML gallery that shows the chosen thumbnails side by side. Save it to the user's working directory as `_style-preview.html`:
   ```html
   <!DOCTYPE html><html><head><meta charset="utf-8"><style>
     body{margin:0;background:#1a1a1a;color:#e0d8c8;font-family:system-ui;padding:24px}
     .grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:20px;max-width:1400px;margin:0 auto}
     .card{background:#0f0f0f;padding:12px;border-radius:6px;text-align:center}
     .card img{width:100%;height:auto;border-radius:4px;display:block}
     .card .name{margin-top:10px;font-size:13px;letter-spacing:1px;color:#d4af37}
   </style></head><body>
     <h1 style="text-align:center;font-weight:300">Pick a style direction</h1>
     <div class="grid">
       <!-- one .card per candidate; use file:// path to the skill's references/thumbnails/ -->
       <div class="card"><img src="file:///path/to/skill/references/thumbnails/style02-modern-minimal.png"><div class="name">modern-minimal</div></div>
       <!-- ... -->
     </div>
   </body></html>
   ```
4. Tell the user:
   > "I've prepared a few style directions for you to compare. Open this file in your browser: file://<absolute-path>/_style-preview.html"
5. After the user picks (AskUserQuestion or open text with the style id), move to Stage 4. **You are not going to use the chosen reference as-is** — it's just a direction; you'll write a fresh template inspired by it.

## Stage 4 — Design and write a NEW template

Read the chosen reference file carefully. Internalize:
- Layout structure (where photo, names, date, venue sit)
- Color palette (extract exact hex values)
- Typography (Chinese font stack, English serif/sans)
- Decorative elements (frames, seals, lines, motifs, SVGs)

Then write `templates/<their-design-id>.html` from scratch. Constraints from `design-principles.md` apply. This new file is theirs — it can incorporate requests ("add a small icon of our dog" / "make the date the most prominent element") that no reference covers.

Update `data/designs.json`:
```json
[{
  "id": "their-design-id",
  "name_zh": "...",
  "template": "their-design-id.html",
  "primary_photo": "photo-01",
  "width": 420,
  "height": 560
}]
```

## Stage 5 — Build, preview, iterate

```bash
npm run build
open dist/their-design-id.html   # macOS; on Linux: xdg-open
```

Feedback patterns and what they map to:

| User says (typical) | You change |
|---|---|
| "Font too small" | bump `font-size` 2-4 px on the relevant rule |
| "Color too dark" | lighten the hex / drop opacity |
| "Head is cropped" | `object-position: center 12%` → `8%` or `4%` |
| "Make the frame square instead of oval" | `.photo-wrap { border-radius: 50% → 4px }` |
| "Swap the photo" | edit `data/designs.json` `primary_photo` |
| "Arched frame" | `border-radius: 50% 50% 4px 4px` |
| "I don't like this layout" | re-read references; rewrite the template (don't try to patch a bad layout) |

For visual choices ("square / round / oval photo frame?"), build all three and use Tier 1 (HTML preview) again to let the user compare.

Average iterations: 3-5 rounds.

## Stage 6 — Export PNG

When the user is satisfied:

1. **Check Chrome is installed.** Run `npm run render`. The script searches common Chrome paths. If it errors out:
   - On macOS: `brew install --cask google-chrome` or download from https://www.google.com/chrome/
   - On Linux: `apt install chromium` or distro equivalent
   - Fallback (no install): `npx puppeteer-cli@2 print file://<abs-path>/dist/<id>.html <output>.png` — downloads chromium on first run, ~200 MB
2. **Export:**
   ```bash
   npm run render
   ```
   Output: `dist/png/<their-design-id>.png` at 1080×1440 (or 1080×1920 for 9:16).
3. **Ask the user where to save the final PNG.** AskUserQuestion:
   > "Where should I save the final image?"
   > 1. Leave it in `dist/png/<id>.png` (inside the project)
   > 2. Copy to Desktop `~/Desktop/<id>.png`
   > 3. Copy to a custom path (have user specify)

   Do **not** silently put it on Desktop — it's a privacy artifact.
4. Open the PNG so the user sees the final result:
   ```bash
   open <final-path>   # macOS
   ```

That's the deliverable. The user takes the PNG wherever they want (messaging app, email, AirDrop, print) — outside the skill's scope.

## Anti-patterns

- ❌ Asking style choices in plain text ("traditional or modern?") — always show visuals
- ❌ Suggesting upload to any cloud / online editor / SaaS
- ❌ Defaulting to `~/Desktop/` for final output without asking
- ❌ Generating 5 designs upfront for the user to "pick from" — converge on one with feedback, don't shotgun
- ❌ Hardcoding any user data in a template (always `{{path}}` placeholders)
- ❌ Continuing past Stage 1 without confirmed photos on disk
