# Workflow — how to drive the conversation

This file teaches the agent (you) how to take a user from "I want to make a wedding invitation" to a finished PNG. The flow has **7 stages** (Stages 1-6 plus Stage 2.5 mode selection). Do not skip stages. Do not start writing HTML before Stage 4.

## Speak the user's language

The moment language is set in Stage 2, **switch your conversational language to match `languages[0]` (the primary language)**. This means every subsequent question, summary, status update, AskUserQuestion label, error message, and follow-up to the user — all in the primary language. Examples:

- `["zh"]` → reply only in Chinese (中文回复). Don't slip into English even for "Render now?" or "Done!".
- `["zh", "en"]` → reply primarily in Chinese (primary), but English technical terms / template ids are fine inline.
- `["en"]` → reply in English.
- `["ja"]`, `["es"]`, `["ko"]`, ... → reply in that language; if you can't, reply in English and apologize.

Code, file paths, template ids, JSON keys, and bash commands stay in their native form. Only your **prose to the user** changes language. This is non-negotiable — a Chinese-language invitation built with an English-speaking agent feels disconnected; the conversational language IS part of the design experience.

## The two modes

After collecting wedding data (Stage 2) but before the aesthetic stage, the user picks a mode:

- **Single mode (default)** — design 1 custom template, iterate 3-5 rounds, export PNG. Best when the user knows roughly what they want.
- **Multi mode** — generate N variants in parallel (3 / 5 / 8, or user-specified), present in a gallery, user picks favorite. Either download as-is, or "iterate on this one" → drops back into single-mode flow with the chosen variant as the starting point.

The end of both modes is a local `dist/index.html` gallery page with download buttons for two PNG sizes (social 1080×1440 + print 2160×2880).

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

4. **If 5+ photos** — discuss selection **before** moving on. The invitation features one primary photo (sometimes one extra). If the user dropped a whole album in, you must NOT silently pick one. Instead:

   - Read all the photos with the Read tool (they're images — Claude can see them).
   - Surface what you see: "I see N photos. Some are portrait pose, some are outdoor candid, some are full-length. Which 1-3 would you like to use on the invitation?"
   - Build a Tier-1 visual preview (`_photo-select.html`) with all photos as numbered cards so the user can answer "p03, p07, p12" rather than describing them in words.
   - Wait for an explicit selection. Note their primary choice — that goes into `designs.json` as `primary_photo`. Keep the rest copied in `photos/` so the gallery's photo-switcher can offer them.

   Skip this step if the user gave you ≤4 photos — assume they've already curated.

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

3. **Pick font CDN** (Tier 2 or 3). This is a one-line question that determines which Google Fonts mirror the rendered HTML loads from:
   > "Where will you preview this invitation from?"
   > - mainland China (use `fonts.font.im` — the CN mirror)
   > - elsewhere (use `fonts.googleapis.com` — official, faster)

   Write the answer into `data/wedding.json` as `font_cdn`: `"fontim"` for CN, `"googleapis"` for everywhere else. Default to `"googleapis"` if the user isn't sure.

4. **Gather the seed fields** — ask one at a time, in the language(s) chosen:

   | Field | Question | When required |
   |---|---|---|
   | `names.groom_zh` / `bride_zh` | "Groom's / bride's Chinese name?" | if `zh` in languages |
   | `names.groom_en` / `bride_en` | "Groom's / bride's English name (FAMILY GIVEN, all caps preferred)?" | if `en` in languages |
   | `names.groom_<lang>` / `bride_<lang>` | "Names in <language>?" | for other languages |
   | `date.iso` | "Wedding date? (YYYY-MM-DD)" | always |
   | `time.value` | "Ceremony start time? (HH:MM, 24-hour)" | always |
   | `venue.city_<lang>`, `venue.lines_<lang>` (array) | "Venue: city + 2-line address in each language" | per language |
   | `venue.name_<lang>` | "Venue name (e.g. hotel / church)?" | per language |
   | `date.lunar` | "Include a lunar date on the invitation? (e.g. 戊辰年八月十五)" | **only if `zh` in languages** — see rule below |

   **Lunar date rule** — the lunar date question is **Chinese-context only and skip-by-default**:
   - If `zh` is NOT in `languages` → do not ask about lunar at all. Skip the row entirely.
   - If `zh` IS in `languages` → ask only as an optional add-on, framed as opt-in not opt-out: "要不要在请帖上加一行农历日期？（可跳过 / 不知道就跳过）". Default to empty/skip if the user is unsure or doesn't answer immediately. Most modern Chinese couples don't include it; only ask once, accept a "no" / "skip" fast.

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

## Stage 2.5 — Pick a mode

Right after Stage 2 (language + couple details collected), ask the user which mode they prefer.

**Use AskUserQuestion (Tier 2)** with these options:

> "How would you like to design this?"
> - **One design, iterated to perfection** — I'll design one template tailored to you and refine with your feedback. ~30 minutes, 3-5 rounds.
> - **Compare a few alternatives** — I'll generate 3 different aesthetics side-by-side. You pick the favorite (or iterate on one).
> - **See many alternatives** — I'll generate 8 different aesthetics for broad comparison.
> - **A specific number** — tell me how many (2-10).

If the user picks single: proceed to Stage 3 normally (pick one aesthetic).
If multi: proceed to Stage 3 but pick N aesthetic directions, then in Stage 4 generate all N variants.

Write the mode + count into `data/wedding.json`:
```json
{
  "mode": "single" | "multi",
  "multi_count": 1 | 3 | 5 | 8 | <user-specified>
}
```

The downstream scripts (`build-gallery.js`) inspect `designs.json.length` to determine output structure — `length == 1` → single-mode gallery (no wrap), `length > 1` → multi-mode gallery (grid + detail pages).

## Stage 3 — Aesthetic direction (Tier 1 visual preview)

This is the most important interaction. **Do not ask "do you want minimal or vintage?" in plain text** — show, don't tell.

1. **Read the user's photos** (use the Read tool — they're images). **The photos drive the recommendation.** Note:
   - **Subject framing**: head-and-shoulders portrait? half-body? full-length? group? — this changes which photo-frame shapes are viable. Tight portraits work in oval / circle / arch. Full-length needs taller rectangular or no-frame layouts. A tight crop pushed into a circle WILL clip a forehead or chin.
   - **Pose & formality**: studio formal portrait, casual outdoor candid, editorial fashion shot, traditional dress?
   - **Outfits & culture**: white gown, qipao, hanbok, sari, kimono, suit, casual?
   - **Color palette of the photo**: warm sunlight, cool studio, cream / beige, navy / black, vibrant?
   - **Composition**: where are heads/faces positioned (top third? center? off-center)?

   **Recommend aesthetics whose decorative elements + frame shape genuinely fit the photo.** Anti-patterns to avoid:
   - Don't propose `art-deco` (heavy symmetric geometric frames) for a wide casual outdoor full-length shot — the photo can't carry the frame.
   - Don't propose `red-gold` / `gugong` for a beachside / casual portrait — cultural / formal mismatch.
   - Don't propose tight circle / oval frames if the photo's subject is full-length or off-center — heads will get clipped.

2. **Pick aesthetic directions** from `design-principles.md` that fit the photos + any user hints. The number depends on mode:
   - **Single mode**: pick **3-4 candidates** → user picks one → you design that one. **Cap at 4** so the follow-up pick fits in a single AskUserQuestion modal (the tool only allows 4 options).
   - **Multi mode**: pick exactly `multi_count` candidates (no overlap), each will become a separate design

   If you really want to surface 5-6 candidates for comparison, you must commit to Tier 3 (open text) for the follow-up pick — tell the user explicitly: "type the name you like (e.g. `morandi`)" — because AskUserQuestion cannot show more than 4 options.

   Aesthetic names you can choose from, grouped by cultural origin:
   - **Chinese**: `new-chinese`, `red-gold`, `gugong`, `ink-flower`
   - **Japanese**: `wabi-sabi`
   - **Korean**: `korean-hanbok`
   - **South Asian**: `indian`
   - **Middle Eastern**: `arabic`
   - **Latin / Mexican**: `latin`
   - **European**: `french-provence`, `art-deco`, `vogue`, `newspaper`, `letter`
   - **Soft contemporary** (culturally neutral): `morandi`, `modern-minimal`, `mediterranean`, `black-gold`
   - **Themed**: `retro-poster`, `vintage-stars`

   Examples of pairing:
   - Indoor formal portraits, traditional dress → `new-chinese`, `red-gold`, `gugong`, `indian`, `korean-hanbok`
   - Outdoor casual / nature → `morandi`, `wabi-sabi`, `mediterranean`, `french-provence`
   - Editorial / fashion-y → `vogue`, `art-deco`, `modern-minimal`
   - Ornate / ceremonial → `indian`, `arabic`, `red-gold`, `gugong`
   - Festive / colorful → `latin`, `red-gold`

3. **Build a visual gallery** using `examples/thumbnails/<aesthetic>.png` for each candidate. These thumbnails are pre-rendered reference invitations — they show the *aesthetic*, not what the final invitation will look like. The thumbnails are in **various languages** (most are Chinese, but the culturally-specific ones — `indian`, `arabic`, `latin`, `french-provence`, `korean-hanbok`, etc. — are in their native cultural language). The user's actual invitation will be designed fresh in their chosen language(s). Tell the user this, in their primary language, and don't claim "these are all Chinese examples" — it's not true.

   Use the gallery template, also localizing the headline + note to the user's primary language (the snippet below has English placeholders; translate before writing the file):

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
     <p class="note">Reference examples — each in its native cultural language (Chinese / English / French / Hindi / Korean / etc.).
       Your invitation will be designed fresh in <strong>{{your-languages}}</strong> —
       only the visual feel (color, typography, decoration) carries over.</p>
     <div class="grid">
       <!-- one .card per candidate; use absolute file:// path to skill's examples/thumbnails/ -->
       <div class="card"><img src="file:///path/to/skill/examples/thumbnails/style03-morandi.png"><div class="name">morandi</div></div>
       <!-- ... -->
     </div>
   </body></html>
   ```

4. Tell the user:
   > "I've prepared some aesthetic directions for you to compare. Open this file in your browser: `file://<absolute-path>/_style-preview.html`"

5. After the user picks (AskUserQuestion or open text):
   - **Single mode**: user picks 1 aesthetic name → move to Stage 4 to design that one
   - **Multi mode**: user can either confirm all `multi_count` candidates or trim/swap a few. Move to Stage 4 to design all of them.

**You are NOT going to copy any reference HTML.** The thumbnail shows what `morandi` looks like as an aesthetic; you will design a fresh template in the user's language using `design-principles.md`'s spec for that aesthetic.

## Stage 4 — Design from scratch

This is the creative stage. In single mode you design 1 template; in multi mode you design N (one per chosen aesthetic).

1. **Open `design-principles.md`**. For each chosen aesthetic, internalize:
   - Color palette (exact hex values)
   - Typography for the user's language(s)
   - Decorative motifs (seal stamps, line art, geometric frames, etc.)
   - Layout pattern

2. **Do NOT read `examples/*.html`.** They are frozen Chinese showcase artifacts. Reading them biases you toward copying and toward Chinese typography. Design fresh from prose.

3. **Write each template from scratch** as `templates/<design-id>.html`:
   - Use placeholders matching the fields actually present in `data/wedding.json` (e.g. `{{names.groom_en}}` if `en` in languages, `{{names.groom_es}}` if `es` etc.)
   - Apply hard constraints from `design-principles.md` (canvas size, photo wrap, mobile-first, **no element extending outside the 420×height canvas**)
   - Set `overflow: hidden` on `.card` as a safety net so any accidentally-oversized child (giant date numerals, vertical text, SVG rays, position:absolute with negative offsets) gets clipped instead of bleeding past the canvas edge into the surrounding page background.
   - Bring in user-specific requests ("add a small icon of our dog", "make the date the most prominent element") that no aesthetic prescribes
   - In **multi mode**: each variant must look meaningfully different from the others. Don't write 3 templates that all turn into "minimalist serif + photo + name". Push range.

4. **Update `data/designs.json`** — one entry per design, with an optional `meta` block used by the gallery page:
   ```json
   [
     {
       "id": "morandi-v1",
       "name_zh": "莫兰迪柔和",
       "name_en": "MORANDI",
       "template": "morandi-v1.html",
       "primary_photo": "photo-01",
       "width": 420,
       "height": 560,
       "meta": {
         "short": "soft contemporary · muted palette",
         "long": "Optional longer description shown in the gallery / detail page.",
         "palette": ["#e8e4dc", "#7a8a6d", "#a59585", "#2c2c2c"],
         "fonts": ["Inter", "Cormorant Garamond"],
         "motifs": "oval photo · hairline dividers"
       }
     }
   ]
   ```

   In single mode the array has length 1. In multi mode it has length N. All other downstream behavior is automatic from the array length.

## Stage 5 — Build, preview, iterate

```bash
npm run build
```

This renders every design in `data/designs.json` into `dist/<id>.html` (the raw invitation HTML, used as iframe source by the gallery).

**Single mode**: open `dist/<your-design-id>.html` in the user's browser (macOS: `open`; Linux: `xdg-open`; Windows: `start`).

**Multi mode**: skip live preview — go straight to Stage 6. The user will see all variants in the gallery at once.

**Mandatory photo-crop review.** Before showing the result to the user, **open the rendered HTML yourself** (Read the PNG output from `npm run render`, or open `dist/<id>.html` in a way you can verify) and check:

- No head, forehead, chin, or face is cropped by `.photo-wrap` border-radius / shape.
- Both people in a couple shot are visible — no one is half-cut by the frame edge.
- Important elements (hands holding rings, bouquet, etc.) are inside the frame.

If the crop is wrong, fix it BEFORE handing back to the user. Don't ship a card with a cropped forehead and let the user discover it. Common fixes:

- Adjust `object-position: center 12%` — lower the percentage (4%, 8%) to keep heads in frame, or raise (20%, 30%) for a face-centered crop.
- Switch the frame shape: circle → oval (taller) → arch (rounded top, square bottom) → rectangle. Each one clips less of the subject's head.
- Widen the photo-wrap: 240px → 280px → 320px so the photo isn't squeezed.
- If the photo is full-length and the frame is small + tight, switch to a layout that gives the photo more vertical room, or pick a different photo.

Feedback patterns (single mode iteration) and what they map to:

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

## Stage 6 — Render + open gallery

When the user is satisfied (single mode) or after all variants are designed (multi mode):

1. **Render PNGs + build gallery** in one shot:
   ```bash
   npm run render && npm run gallery
   ```

   - `render.js` shells out to Chrome / Chromium / Edge and outputs **two sizes per design**:
     - `dist/png/social/<id>.png` — 1080×1440 (for messaging, email, social)
     - `dist/png/print/<id>.png`  — 2160×2880 at 300 DPI (for physical printing)
   - `build-gallery.js` reads `designs.json` and writes `dist/index.html`:
     - **Single mode** (1 design): the detail page directly — iframe preview + palette/typography meta + two download buttons
     - **Multi mode** (N designs): a grid landing + per-design `dist/<id>-page.html` with prev/next/back

   If Chrome isn't found, `render.js` prints install instructions for the user's OS.

2. **Open the gallery** so the user sees the final result(s):
   - macOS: `open dist/index.html`
   - Linux: `xdg-open dist/index.html`
   - Windows: `start dist/index.html`

3. **The user takes it from there.** They click "Social" or "Print" to download. They can pick where to save (browser's native download UI handles this — no need to ask).

   **In multi mode**, the user can also reply "let me iterate on #3" → drop back into single-mode Stage 5 flow with that variant as the working template, then come back to Stage 6 when refined.

That's the deliverable. PNGs are saved via browser download into the user's chosen location, then sent (messaging app, email, AirDrop, print) — outside the skill's scope.

## Anti-patterns

- ❌ **Reading `examples/*.html`** — design-principles.md is your only visual reference
- ❌ **Defaulting to Chinese** — always ask language first
- ❌ **Speaking English to a user who picked Chinese (or any non-English language)** — switch your conversational language at Stage 2 and stay there
- ❌ **Asking about lunar date when `zh` is NOT in `languages`** — it's a Chinese-specific field; skip it entirely otherwise
- ❌ Asking style choices in plain text ("traditional or modern?") — always show visuals
- ❌ **Picking an aesthetic without looking at the photos** — frame shape / formality must match the photo's framing & pose
- ❌ **Shipping a template with a cropped forehead / chin / half-visible person** — always do the Stage 5 crop review before declaring done
- ❌ **Silently picking 1 photo out of 20** — if the user dropped a folder of photos, discuss which to feature before designing
- ❌ **Elements bleeding outside the 420×height canvas** — vertical text, oversized numerals, SVG decorations, negative-offset absolutes must stay inside; use `overflow:hidden` on `.card` as a safety net
- ❌ Suggesting upload to any cloud / online editor / SaaS
- ❌ Skipping Stage 2.5 — always ask single vs multi explicitly
- ❌ **In multi mode**, generating N similar designs — they must look meaningfully different, not 3 minor variants of the same template
- ❌ **In single mode**, shotgun-generating multiple drafts to "pick from" — converge with iteration, not selection
- ❌ Hardcoding any user data in a template (always `{{path}}` placeholders)
- ❌ Continuing past Stage 1 without confirmed photos on disk
- ❌ Using bash-only commands when the user is on Windows
