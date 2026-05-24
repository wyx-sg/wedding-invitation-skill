# Workflow — how to drive the conversation

This file teaches the agent (you) how to take a user from "I want to make a wedding invitation" to a finished PNG. The flow has 6 stages. Do not skip stages. Do not start writing HTML before Stage 4.

## How to interact with the user — 3-tier degradation

For every choice you ask the user to make, prefer the richest interaction the current environment supports:

```
Tier 1 (preferred):  HTML preview in the user's browser
                     Use when: choice is visual (style direction, photo crop, layout)
                     Method: write _preview.html with side-by-side options;
                             tell the user to refresh; ask which one in text
                             or via AskUserQuestion.

Tier 2 (fallback):   AskUserQuestion tool (in-agent multiple-choice modal)
                     Use when: choice is non-visual but discrete (yes/no, short list)
                     Note:    AskUserQuestion is Claude Code specific. In other
                              agents (Cursor / Aider / Codex / Gemini), fall back
                              to Tier 3.

Tier 3 (last resort): plain text question in chat
                     Use when: above unavailable, or answer is open-ended
                     (e.g. "Groom's name in Chinese?")
```

Examples:

| Choice | Best tier |
|---|---|
| Pick an aesthetic direction | Tier 1 — render reference thumbnails side-by-side |
| Pick which photo is primary | Tier 1 — show all photos as cards |
| Square vs round photo frame | Tier 1 — render both, side-by-side |
| Date / time / venue / names | Tier 3 — open text |
| "Render now?" / "Use red or gold accent?" | Tier 2 — AskUserQuestion |
| Choose invitation language(s) | Tier 2 (or Tier 3 if AskUserQuestion unavailable) |

Never start with Tier 3 if the choice is visual. A wedding invitation is a visual artifact; words alone cannot usefully describe "oval vs square vs arched photo frame".

## Stage 1 — Set up the workspace

1. **Choose working directory.** Default `~/my-wedding/`. Ask:
   > "Where should I put the project? (default: `~/my-wedding/`)"

2. **Copy skeleton** (use cross-platform commands appropriate to the user's OS):
   - macOS / Linux:
     ```bash
     cp -R <skill-path>/skeleton/. <working-dir>/
     cd <working-dir>/
     cp data/wedding.example.json data/wedding.json
     cp data/designs.example.json data/designs.json
     ```
   - Windows (PowerShell):
     ```powershell
     Copy-Item -Recurse <skill-path>\skeleton\* <working-dir>\
     cd <working-dir>
     Copy-Item data\wedding.example.json data\wedding.json
     Copy-Item data\designs.example.json data\designs.json
     ```

3. **Photos** — ask:
   > "Where are your wedding photos on this machine? Give me an absolute directory path (e.g. `~/Pictures/wedding/`). I'll copy and rename them into the project."

   Copy + rename with the appropriate OS commands. HEIC handling:
   - macOS: `sips -s format jpeg <input>.heic --out <output>.jpg`
   - Linux: `heif-convert <input>.heic <output>.jpg`
   - Windows: ask the user to convert HEIC manually, or skip those files

   Confirm photo count back to the user. Don't proceed until `photos/` has at least one image.

## Stage 2 — Language and couple details

This is the **first** content decision. Don't assume Chinese (or any language).

1. **Ask language(s)** via AskUserQuestion (Tier 2) or plain text (Tier 3):
   > "What language(s) should the invitation be in?"
   > - English only
   > - Chinese only (中文)
   > - Bilingual: Chinese + English
   > - Other (specify, e.g. Spanish, Japanese, Korean)

2. **Write the `languages` field** into `data/wedding.json` as an array of language codes:
   - English only → `["en"]`
   - Chinese only → `["zh"]`
   - Bilingual zh+en → `["zh", "en"]` (primary first)
   - Other → use ISO 639-1 codes: `["es"]`, `["ja"]`, `["ko"]`, `["fr"]`, etc.

3. **Gather the seed fields** — ask one at a time, in the language(s) chosen:

   | Field | Question | When required |
   |---|---|---|
   | `names.groom_zh` / `bride_zh` | "Groom's / bride's Chinese name?" | if `zh` in languages |
   | `names.groom_en` / `bride_en` | "Groom's / bride's English name (FAMILY GIVEN, all caps preferred)?" | if `en` in languages |
   | `names.groom_<lang>` / `bride_<lang>` | "Names in <language>?" | for other languages |
   | `date.iso` | "Wedding date? (YYYY-MM-DD)" | always |
   | `time.value` | "Ceremony start time? (HH:MM, 24-hour)" | always |
   | `venue.city_<lang>`, `venue.lines_<lang>` (array) | "Venue: city + 2-line address in each language" | per language |
   | `venue.name_<lang>` | "Venue name (e.g. hotel / church)?" | per language |
   | `date.lunar` | "Include a lunar date on the invitation? (e.g. 戊辰年八月十五)" | only if `zh` in languages, optional |

   **Privacy nudge** — for address detail, AskUserQuestion:
   - Full address (street level)
   - City + venue name only
   - Region / province only

4. **Run derive**:
   ```bash
   npm run derive
   ```

   `derive.js` is language-aware: it derives Chinese date formats (`zh_formal`, `weekday_zh`, etc.) only if `zh` is in `languages`, and English formats (`en_long`, `roman_year`, etc.) only if `en` is in. For other languages, it passes through whatever you wrote — you fill localized strings manually.

   Verify the printed summary matches what the user expects.

   If derive fails, the seed is incomplete or malformed for the declared languages — fix the seed and re-run.

## Stage 3 — Aesthetic direction (Tier 1 visual preview)

This is the most important interaction. **Do not ask "do you want minimal or vintage?" in plain text** — show, don't tell.

1. **Read the user's photos** (use the Read tool — they're images). Note dominant colors, formality of pose, whether outfits are traditional / western / casual.

2. **Pick 3-5 aesthetic directions** from `design-principles.md` that fit the photos + any user hints. Aesthetic names you can choose from:
   - `new-chinese`, `red-gold`, `palace`, `ink-flower` — Chinese cultural
   - `wabi-sabi` — Japanese
   - `morandi`, `modern-minimal`, `mediterranean` — soft contemporary
   - `art-deco`, `vogue` — editorial / formal
   - `newspaper`, `letter`, `retro-poster`, `vintage-stars` — narrative / themed

   Examples of pairing:
   - Indoor formal portraits, traditional dress → `new-chinese`, `red-gold`, `palace`
   - Outdoor casual / nature → `morandi`, `wabi-sabi`, `mediterranean`
   - Editorial / fashion-y → `vogue`, `art-deco`, `modern-minimal`

3. **Build a visual gallery** using `examples/thumbnails/<aesthetic>.png` for each candidate. These thumbnails are pre-rendered Chinese examples — they show the *aesthetic*, not what the final invitation will look like. Tell the user this.

   Save the gallery to the user's working directory as `_style-preview.html`:
   ```html
   <!DOCTYPE html><html><head><meta charset="utf-8"><style>
     body{margin:0;background:#1a1a1a;color:#e0d8c8;font-family:system-ui;padding:24px}
     .note{text-align:center;font-weight:300;opacity:.7;max-width:680px;margin:0 auto 24px;font-size:13px;line-height:1.6}
     .grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:20px;max-width:1400px;margin:0 auto}
     .card{background:#0f0f0f;padding:12px;border-radius:6px;text-align:center}
     .card img{width:100%;height:auto;border-radius:4px;display:block}
     .card .name{margin-top:10px;font-size:13px;letter-spacing:1px;color:#d4af37}
   </style></head><body>
     <h1 style="text-align:center;font-weight:300">Pick an aesthetic direction</h1>
     <p class="note">These are Chinese examples showing what each aesthetic looks like.
       Your invitation will be designed fresh in <strong>{{your-languages}}</strong> —
       only the visual direction (color, typography, decoration) carries over.</p>
     <div class="grid">
       <!-- one .card per candidate; use absolute file:// path to skill's examples/thumbnails/ -->
       <div class="card"><img src="file:///path/to/skill/examples/thumbnails/style03-morandi.png"><div class="name">morandi</div></div>
       <!-- ... -->
     </div>
   </body></html>
   ```

4. Tell the user:
   > "I've prepared some aesthetic directions for you to compare. Open this file in your browser: `file://<absolute-path>/_style-preview.html`"

5. After the user picks (AskUserQuestion or open text with the aesthetic name), move to Stage 4.

**You are NOT going to copy any reference HTML.** The thumbnail shows what `morandi` looks like as an aesthetic; you will design a fresh template in the user's language using `design-principles.md`'s spec for that aesthetic.

## Stage 4 — Design from scratch

This is the creative stage.

1. **Open `design-principles.md`**. Find the section for the chosen aesthetic. Internalize:
   - Color palette (exact hex values)
   - Typography for the user's language(s)
   - Decorative motifs (seal stamps, line art, geometric frames, etc.)
   - Layout pattern

2. **Do NOT read `examples/*.html`.** They are frozen Chinese showcase artifacts. Reading them biases you toward copying and toward Chinese typography. Design fresh from prose.

3. **Write `templates/<your-design-id>.html` from scratch:**
   - Use placeholders matching the fields actually present in `data/wedding.json` (e.g. `{{names.groom_en}}` if `en` in languages, `{{names.groom_es}}` if `es` etc.)
   - Apply hard constraints from `design-principles.md` (canvas size, photo wrap, mobile-first)
   - Bring in user-specific requests ("add a small icon of our dog", "make the date the most prominent element") that no aesthetic prescribes

4. **Update `data/designs.json`:**
   ```json
   [{
     "id": "their-design-id",
     "name_zh": "...",
     "name_en": "...",
     "template": "their-design-id.html",
     "primary_photo": "photo-01",
     "width": 420,
     "height": 560
   }]
   ```

## Stage 5 — Build, preview, iterate

```bash
npm run build
```

Then open `dist/their-design-id.html` in the user's browser (macOS: `open`; Linux: `xdg-open`; Windows: `start`).

Feedback patterns and what they map to:

| User says | You change |
|---|---|
| "Font too small" | bump `font-size` 2-4 px on the relevant rule |
| "Color too dark" | lighten the hex / drop opacity |
| "Head is cropped" | `object-position: center 12%` → `8%` or `4%` |
| "Make the frame square instead of oval" | `.photo-wrap { border-radius: 50% → 4px }` |
| "Swap the photo" | edit `data/designs.json` `primary_photo` |
| "Arched frame" | `border-radius: 50% 50% 4px 4px` |
| "I don't like this layout" | re-read `design-principles.md`; rewrite the template (don't try to patch a bad layout) |

For visual choices ("square / round / oval photo frame?"), build all three and use Tier 1 (HTML preview).

Average iterations: 3-5 rounds.

## Stage 6 — Export PNG

When the user is satisfied:

1. **Run render**:
   ```bash
   npm run render
   ```
   `render.js` is cross-platform (macOS / Linux / Windows) and zero-dependency — it shells out to whatever Chrome / Chromium / Edge is on the machine. Output: `dist/png/<your-design-id>.png` at 1080×1440 (or 1080×1920 for 9:16).

   If Chrome isn't found, `render.js` prints install instructions for the user's OS.

2. **Ask where to save the final PNG** via AskUserQuestion (or plain text fallback):
   > "Where should I save the final image?"
   > 1. Leave it in `dist/png/<id>.png` (inside the project)
   > 2. Copy to Desktop `~/Desktop/<id>.png`
   > 3. Copy to a custom path (have user specify)

   Do **not** silently put it on Desktop — it's a privacy artifact.

3. **Open the PNG** so the user sees the final result:
   - macOS: `open <path>`
   - Linux: `xdg-open <path>`
   - Windows: `start <path>`

That's the deliverable. The user takes the PNG wherever they want (messaging app, email, AirDrop, print) — outside the skill's scope.

## Anti-patterns

- ❌ **Reading `examples/*.html`** — design-principles.md is your only visual reference
- ❌ **Defaulting to Chinese** — always ask language first
- ❌ Asking style choices in plain text ("traditional or modern?") — always show visuals
- ❌ Suggesting upload to any cloud / online editor / SaaS
- ❌ Defaulting to `~/Desktop/` for final output without asking
- ❌ Generating 5 designs upfront for the user to "pick from" — converge on one with feedback, don't shotgun
- ❌ Hardcoding any user data in a template (always `{{path}}` placeholders)
- ❌ Continuing past Stage 1 without confirmed photos on disk
- ❌ Using bash-only commands when the user is on Windows
