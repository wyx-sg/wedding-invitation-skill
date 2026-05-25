# Workflow — how to drive the conversation

This file teaches the agent (you) how to take a user from "I want to make a wedding invitation" to a finished PNG. The flow has **5 stages**. Do not skip stages. Do not start writing HTML before Stage 4.

## Speak the user's language

The moment language is set in Stage 2, **switch your conversational language to match `languages[0]` (the primary language)**. This means every subsequent question, summary, status update, AskUserQuestion label, error message, and follow-up to the user — all in the primary language. Examples:

- `["zh"]` → reply only in Chinese (中文回复). Don't slip into English even for "Render now?" or "Done!".
- `["zh", "en"]` → reply primarily in Chinese (primary), but English technical terms / template ids are fine inline.
- `["en"]` → reply in English.
- `["ja"]`, `["es"]`, `["ko"]`, ... → reply in that language; if you can't, reply in English and apologize.

Code, file paths, template ids, JSON keys, and bash commands stay in their native form. Only your **prose to the user** changes language. This is non-negotiable — a Chinese-language invitation built with an English-speaking agent feels disconnected; the conversational language IS part of the design experience.

## Single output vs multiple variants — emerges from the picker

The user does NOT pre-declare "I want 1 design" or "I want 5 designs". The number of final designs emerges naturally from the **style picker** (Stage 3) — the picker is multi-select; whatever the user picks becomes what gets designed.

- Picks 1 style → Agent designs 1 template → `dist/index.html` is the detail page directly
- Picks N styles → Agent designs N templates → `dist/index.html` is a gallery grid + per-design detail pages

`build-gallery.js` auto-branches on `data/designs.json` array length — `length == 1` → single-design output, `length > 1` → multi-design gallery. Agent doesn't need to set any mode flag.

The end of either path is a local `dist/index.html` page with download buttons for two PNG sizes (social 1080×1440 + print 2160×2880), and a tweak panel for fine-tuning each design.

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
   - Build a Tier-1 visual preview (`_photo-select.html`) with all photos as numbered cards. The user clicks to select (multi-select supported), then clicks a **Copy** button in the bottom summary bar — that writes a chat-ready sentence like `我选了 p01、p03` (or `I picked p01, p03` for en) to the clipboard. The user pastes it back into chat. The page MUST include:
     - A centered **two-line header at the top**: brand (婚礼请帖 / Wedding Invitation) on top, "Made with wedding-invitation-skill" / "由 wedding-invitation-skill 设计制作" small below (localized). Linked to https://github.com/wyx-sg/wedding-invitation-skill.
     - A short reminder note: pick → click Copy → paste back into chat (localized). Use a generic phrase like "back to chat" / "回到对话窗口" rather than naming a specific agent host (Claude Code, Cursor, etc.) — the skill is host-agnostic.
     - A sticky bottom summary bar with: current selection (left), a **Copy** button (hidden when nothing selected) that writes a chat-ready sentence to clipboard via `navigator.clipboard.writeText` (with `document.execCommand('copy')` fallback).

   When telling the user in chat: "Open `file://…/_photo-select.html`, click the photos you like, hit **Copy** in the bottom bar, then paste back here. I'll take it from there." (Localized.) Don't proceed until the user pastes their picks.
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

2. **Pick the 5 aesthetic directions from `design-principles.md` that best fit the photos** (no overlap with previously-shown directions on this session). The picker is multi-select — the user decides how many to keep. They can also ask for more rounds.

   **Track what you have already shown.** Keep a running list of aesthetic ids you've put in front of the user this session. When the user replies "换一批" / "再来几个" / "show me others" / similar, pick 5 NEW aesthetics from the unshown pool — never repeat. You can keep cycling until all 14 are exhausted; after that, tell the user there are no more directions to show.

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

3. **Build a mood-board preview** — one card per candidate, showing the aesthetic's **design vocabulary** (palette swatches + a typography sample + a brief spirit / motif description). **Do NOT show pre-rendered example invitations** in this picker. Reasons:
   - The examples have other couples' names, dates, and venues — users see those, fixate on "I want THAT one", and the agent gets pulled toward literal copy.
   - Examples are in their native cultural language; if the user picked a different language, the examples don't match what they'll get.
   - Aesthetics here are **directions**, not finished templates. The picker should communicate direction, not destination.

   Build `_style-preview.html` in the user's working directory. Each card shows: aesthetic name, palette swatches (the suggested starting-point colors from `design-principles.md`), a small typography sample (a few characters in the aesthetic's font family), and one line of spirit / motif description. Cards are **clickable** — clicking toggles selection (**multi-select**; the user may pick one direction OR several). The page MUST include:
   - A centered **sticky two-line header at the top**: brand (婚礼请帖 / Wedding Invitation) on top, "Made with wedding-invitation-skill" / "由 wedding-invitation-skill 设计制作" small below (localized). Linked to https://github.com/wyx-sg/wedding-invitation-skill.
   - A short note near the top reminding the user of the flow: pick → click Copy → paste back into chat (localized). Use a generic phrase ("back to chat" / "回到对话窗口") — don't name a specific agent host.
   - **A "Selected" area at the top** (between header and the candidates grid). When the user clicks a card, the card visually moves into this area; clicking it again moves it back. Hide the area entirely when nothing is selected. The selected area keeps user picks visible while they browse new candidate rounds.
   - **A "Candidates" area below** with the 5 cards you picked this round. Cards the user has already selected in a previous round should appear in the Selected area at the top (pre-marked), NOT in the candidates grid below.
   - A sticky bottom summary bar with: current selection joined by `、` for zh / `,` for en (`已选 morandi、art-deco`), a **Copy** button (hidden when nothing selected) that writes a chat-ready sentence like `我选 morandi、art-deco` to clipboard (uses `navigator.clipboard.writeText` with `document.execCommand('copy')` fallback).

   When telling the user in chat (Stage 3 step 4 below), explicitly tell them: pick → Copy → paste back.

   Localize the headline + note + spirit lines to the user's primary language before writing the file.

   Each card has SIX layers:

   1. **Abstract SVG sketch** (3:4 aspect, matching the 420×560 invitation card) — draws the aesthetic's design DIRECTION using only shapes / lines / typography, NO real names or dates. Examples below.
   2. **Aesthetic name** (`morandi`, `art-deco`, ...)
   3. **Spirit line** — one phrase in the user's primary language capturing the aesthetic's soul.
   4. **Palette swatches** — 3-4 circles sampling the suggested starting palette from `design-principles.md`.
   5. **Typography sample** — a few characters in the aesthetic's actual font family (loaded via Google Fonts in the page `<head>`).
   6. **Motif list** — short, comma-separated, the visual vocabulary.

   Reference template (English copy; **translate the prose to the user's primary language** before writing). Load all the fonts you'll reference in the `<link>` tag.

   ```html
   <!DOCTYPE html><html><head><meta charset="utf-8">
   <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300&family=Inter:wght@300;400;500&family=Noto+Serif+SC:wght@400;500;700&family=Bodoni+Moda:wght@400&family=Songti+SC&family=Allura&family=Noto+Serif+JP:wght@400&display=swap">
   <style>
     body{margin:0;background:#0a0907;color:#d4c4a8;font-family:system-ui;padding:32px 24px;min-height:100vh}
     h1{text-align:center;font-weight:300;font-family:'Cormorant Garamond',serif;font-size:32px;letter-spacing:4px;color:#d4b896;margin:0 0 12px;text-transform:uppercase}
     .note{text-align:center;font-family:'Cormorant Garamond','Noto Serif SC',serif;font-style:italic;font-size:14px;color:#a89878;max-width:680px;margin:0 auto 36px;line-height:1.55;text-wrap:balance}
     .note strong{color:#d4b896;font-style:normal;font-weight:400}
     .grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:20px;max-width:1280px;margin:0 auto}
     .card{background:#14110d;border:1px solid #2a2218;padding:20px 22px 22px;border-radius:6px;display:flex;flex-direction:column;gap:14px;transition:border-color .2s,transform .2s;cursor:pointer}
     .card:hover{border-color:#b8956a;transform:translateY(-2px)}
     .sketch{width:62%;aspect-ratio:3/4;border-radius:3px;overflow:hidden;display:block;align-self:center;box-shadow:0 12px 28px -10px rgba(0,0,0,0.6)}
     .name{font-family:'Cormorant Garamond',serif;font-size:24px;color:#d4b896;letter-spacing:1.5px;text-transform:lowercase;margin-top:4px}
     .spirit{font-family:'Cormorant Garamond','Noto Serif SC',serif;font-style:italic;font-size:13px;color:#b9a47f;line-height:1.5}
     .swatches{display:flex;gap:6px}
     .swatches span{width:24px;height:24px;border-radius:50%;border:1px solid rgba(212,184,150,.18)}
     .type-sample{font-size:20px;letter-spacing:2px;color:#d4c4a8;border-top:1px solid #1f1a14;padding-top:12px;line-height:1.3}
     .motifs{font-size:10.5px;letter-spacing:2.5px;text-transform:uppercase;color:#5a4a36}
   </style></head><body>
     <h1>Pick an aesthetic direction</h1>
     <p class="note">These are <strong>directions</strong>, not finished templates. The agent will design your invitation fresh in <strong>{{your-languages}}</strong>, adapting the palette and decoration to your photo and preferences.</p>
     <div class="grid">

       <!-- Example card 1: morandi -->
       <div class="card">
         <svg class="sketch" viewBox="0 0 240 320" xmlns="http://www.w3.org/2000/svg">
           <rect width="240" height="320" fill="#e8e4dc"/>
           <ellipse cx="100" cy="115" rx="56" ry="62" fill="#a59585" opacity="0.55"/>
           <line x1="50" y1="210" x2="190" y2="210" stroke="#7a8a6d" stroke-width="0.8"/>
           <g stroke="#2c2c2c" stroke-width="0.5" opacity="0.45">
             <line x1="80" y1="228" x2="180" y2="228"/>
             <line x1="80" y1="238" x2="150" y2="238"/>
             <line x1="80" y1="248" x2="165" y2="248"/>
           </g>
         </svg>
         <div class="name">morandi</div>
         <div class="spirit">soft contemporary · restrained · asymmetric</div>
         <div class="swatches"><span style="background:#e8e4dc"></span><span style="background:#7a8a6d"></span><span style="background:#a59585"></span><span style="background:#2c2c2c"></span></div>
         <div class="type-sample" style="font-family:'Inter',sans-serif">Aa · 字 · 1 2 3</div>
         <div class="motifs">hairline dividers · oval frame · no ornament</div>
       </div>

       <!-- Example card 2: art-deco -->
       <div class="card">
         <svg class="sketch" viewBox="0 0 240 320" xmlns="http://www.w3.org/2000/svg">
           <rect width="240" height="320" fill="#1a1a1a"/>
           <rect x="20" y="20" width="200" height="280" fill="none" stroke="#d4af37" stroke-width="1.2"/>
           <rect x="30" y="30" width="180" height="260" fill="none" stroke="#d4af37" stroke-width="0.5"/>
           <circle cx="120" cy="160" r="34" fill="none" stroke="#d4af37" stroke-width="1"/>
           <text x="120" y="172" text-anchor="middle" font-family="serif" font-size="26" fill="#d4af37" font-style="italic">M&amp;V</text>
           <g stroke="#d4af37" stroke-width="0.6" opacity="0.6">
             <line x1="28" y1="28" x2="45" y2="40"/>
             <line x1="28" y1="28" x2="40" y2="48"/>
             <line x1="212" y1="28" x2="195" y2="40"/>
             <line x1="212" y1="28" x2="200" y2="48"/>
           </g>
         </svg>
         <div class="name">art-deco</div>
         <div class="spirit">Gatsby glamour · heavy symmetry · gold-on-dark</div>
         <div class="swatches"><span style="background:#1a1a1a"></span><span style="background:#d4af37"></span><span style="background:#b8956a"></span><span style="background:#f4ede0"></span></div>
         <div class="type-sample" style="font-family:'Bodoni Moda',serif">Aa · 字 · M&amp;V</div>
         <div class="motifs">sunburst rays · stepped frame · monogram circle</div>
       </div>

       <!-- ...one card per candidate. Sketch should communicate the aesthetic's visual
            direction: dominant background color, photo placement, key motifs, symmetry
            vs asymmetry. Use the palette + motifs from design-principles.md as your
            vocabulary. NEVER include real names, dates, or venues in the sketch.
            DO NOT include a Custom card — Custom is a chat-only reply option. -->
     </div>
   </body></html>
   ```

   **Sketch design notes** (these are guidance, not prescriptions — adapt to each aesthetic's spirit):

   - **Background fill**: the aesthetic's dominant background color (cream / red / black / ivory / white).
   - **Photo placement**: a soft shape (oval / arch / rectangle / fan) in the suggested position. Use a low-opacity fill — it's abstract, not a real photo.
   - **Decoration suggestion**: 1-2 of the aesthetic's signature motifs (a seal, an arch, a sunburst, a brush stroke, a 囍, a mandala outline). Keep it abstract — small SVG paths, not detailed illustration.
   - **Text suggestion**: thin gray lines hinting at where names / dates would go. **Never** real text.
   - **Symmetry / asymmetry**: should mirror the aesthetic's spirit. Art-deco is centered + symmetric; morandi is off-center; wabi-sabi has lots of empty space.

4. Tell the user — translate the message to the user's primary language at runtime. Chinese example:
   > "我看了你的照片，挑了 5 个最合适的风格方向。在浏览器里打开：`file://…/_style-preview.html`
   >
   > 看哪几个对味就点哪几张（**可多选**）。挑好了点底部 **复制** 把内容粘到对话里，我接着帮你做。
   >
   > 如果都不喜欢、或者想多看几个，回复 **"换一批"** 我会再挑 5 个新的（已选的不会被换掉）。或者回复 **Custom / 自定义** —— 我们直接进设计台，所有颜色字体组件你自己挑。"

   English equivalent:
   > "I picked the 5 aesthetic directions that fit your photos best. Open in your browser: `file://…/_style-preview.html`
   >
   > Click the ones you like (**multi-select**). When done, click **Copy** at the bottom and paste back into chat.
   >
   > Want more options? Reply **"show me others" / "换一批"** and I'll pick 5 fresh ones (your existing selections stay). Or reply **Custom** to skip the curated set — we'll go straight to the design studio where you pick everything yourself."

5. **AskUserQuestion fallback**: AskUserQuestion only supports 4 options. If using Tier-2 fallback, list 3-4 of the 5 curated aesthetics; otherwise stick with Tier-1 page picker.

   **The picker page MUST NOT include a Custom card.** Custom is a chat-only escape hatch — surfacing it on the picker biases users to pick it without trying any curated direction. The chat prompt above mentions it as a reply option ("回复 Custom / 自定义"), which is enough.

   Branch on the user's response:

   - **User named one or more aesthetics** (e.g. "我选 morandi、art-deco"):
     - Proceed to Stage 4 with however many aesthetics the user named.
     - `designs.json` will have N entries — downstream `build-gallery.js` always produces gallery + per-design detail + per-design studio regardless of N.

   - **User said "换一批" / "再来一批" / "再换" / "看看别的" / "show me others" / similar**:
     - Pick a DIFFERENT set of 5 aesthetics from `design-principles.md` — never repeat anything already shown this session.
     - Regenerate `_style-preview.html`:
       - **Selected area at the top**: any aesthetics the user has already selected (pre-marked, persisted across rounds — they can still deselect).
       - **Candidates area below**: the 5 NEW unseen aesthetics.
     - Tell the user to refresh their browser.
     - Repeat as needed. Once all 14 aesthetics are exhausted, tell the user there are no more directions to show.

   - **User replied "Custom" / "自定义" / "I want to design from scratch" / similar** (in chat, not via picker):
     - DO NOT design a fresh aesthetic in Stage 4. Instead:
       a. Copy `references/blank-canvas.html` into `templates/<chosen-id>.html` (replace placeholder field names — e.g. `groom_zh` → `groom_es` — to match the active languages).
       b. Configure `data/designs.json` with the contents of `references/blank-canvas-designs.json` (adjusted: set `id`, `primary_photo`, `name_*`, ensure the `template` filename matches what you wrote).
     - The tweak page (`dist/<id>-studio.html`, opened from the gallery) IS the user's design surface — they pick colors, fonts, frame, components there. Move to Stage 5 to render and open the gallery.

**You are designing, not picking.** The user picked a direction (`morandi`, `art-deco`, etc.). In Stage 4 you will design a fresh template in their language, with their actual data, adapting the palette/typography to their photo and preferences — using `design-principles.md` as your vocabulary, not as a fixed recipe.

## Stage 4 — Design from scratch

This is the creative stage. You design one template per aesthetic the user selected — if they picked 1 style, write 1 template; if they picked 3 styles, write 3 templates (one per style, each meaningfully different in spirit).

1. **Open `design-principles.md`**. For each chosen aesthetic, internalize:
   - **Spirit** — the soul of the aesthetic. This is the load-bearing constraint.
   - **Starting palette** — a reference, NOT a prescription. Shift hues to harmonize with the user's photo tones (cooler photo → shift accents cooler; warmer photo → shift toward warm tones).
   - **Typography family** — match the language(s); pick the specific font within the family based on the formality the couple wants.
   - **Decoration vocabulary** — pick a few motifs from the suggested list (not all), or invent ones in the same spirit.
   - **NEVER list** — these are hard. Don't violate them.
   - **Hard cultural requirements** (where listed) — non-negotiable. Skip them and you've lost the aesthetic.

   You're not stamping out a fixed template. You're designing in a direction — your job is to make judgment calls within the spirit + NEVERs of the chosen aesthetic.

2. **Do NOT read `examples/*.html`.** They are frozen Chinese showcase artifacts. Reading them biases you toward copying and toward Chinese typography. Design fresh from prose.

3. **Write each template from scratch** as `templates/<design-id>.html`:
   - Use placeholders matching the fields actually present in `data/wedding.json` (e.g. `{{names.groom_en}}` if `en` in languages, `{{names.groom_es}}` if `es` etc.)
   - Apply hard constraints from `design-principles.md` (canvas size, photo wrap, mobile-first, **no element extending outside the 420×height canvas**)
   - Set `overflow: hidden` on `.card` as a safety net so any accidentally-oversized child (giant date numerals, vertical text, SVG rays, position:absolute with negative offsets) gets clipped instead of bleeding past the canvas edge into the surrounding page background.
   - Bring in user-specific requests ("add a small icon of our dog", "make the date the most prominent element") that no aesthetic prescribes
   - **When designing multiple templates in one session**: each variant must look meaningfully different from the others. Don't write 3 templates that all turn into "minimalist serif + photo + name". Push range — different aesthetic = different layout, palette, typography, motifs.

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

   The array has 1 entry if the user selected 1 style, N if they selected N. All downstream behavior is automatic from `designs.json.length` — no mode flag needed.

5. **Populate `tweak_options` in `data/designs.json`** (recommended for most aesthetics, see `design-principles.md` → "Tweakable templates").

   The tweak panel renders only if a design declares `tweak_options`. Skip it only if the aesthetic resists variation (e.g. `red-gold` — the red is the aesthetic).

   Required fields (omit any section to hide that section in the panel):

   - `color_schemes` — array of `{ name_en, name_zh, vars: { '--card-bg': '#…', '--card-text': '#…', '--card-accent-1': '#…', ... } }`. At least 2 schemes; each must be a complete override (don't leave hue gaps). Stay within the aesthetic's palette — for morandi, all schemes are muted; for art-deco, all are gold-on-dark with different golds.
   - `fonts` — object keyed by font CSS var (`--font-headline`, `--font-body`); each value is an array of 2–3 font-family strings already loaded by the template's `<link>`. Stay within the aesthetic's typography family (Latin serif for art-deco; sans for morandi; brush for red-gold).
   - `frames` — array of `{ name_zh, name_en, radius, aspect }` for photo-frame variants (bare `name` also accepted as fallback). Pick shapes that the photo's framing supports (see "Photo crop is template-specific" in `design-principles.md`).
   - `components` — array of `{ id, label_en, label_zh, default }` matching the `.optional` class hooks in the template. `default: false` for elements the user usually wants off (lunar-date for non-traditional couples).

   Example for a morandi design:

   ```json
   "tweak_options": {
     "color_schemes": [
       { "name_en": "Warm", "name_zh": "暖调",
         "vars": { "--card-bg": "#e8e4dc", "--card-text": "#2c2c2c", "--card-accent-1": "#7a8a6d", "--card-accent-2": "#a59585" } },
       { "name_en": "Cool", "name_zh": "冷调",
         "vars": { "--card-bg": "#dde2dd", "--card-text": "#2a3236", "--card-accent-1": "#7a8a96", "--card-accent-2": "#95a0a5" } }
     ],
     "fonts": {
       "--font-headline": ["Inter", "Manrope", "DM Sans"],
       "--font-body":     ["Inter", "Manrope"]
     },
     "frames": [
       { "name_zh": "椭圆", "name_en": "Oval", "radius": "50%", "aspect": "4/5" },
       { "name_zh": "圆角方形", "name_en": "Rounded", "radius": "8px", "aspect": "4/5" }
     ],
     "components": [
       { "id": "tagline",    "label_en": "Tagline",    "label_zh": "寄语", "default": true  },
       { "id": "lunar-date", "label_en": "Lunar date", "label_zh": "农历", "default": false }
     ]
   }
   ```

   Frame entries support `name_zh` / `name_en` (plus optional bare `name` fallback) so the labels in the panel match the user's primary language.

   **Template contract reminder** — for the tweak panel to do anything useful, the template MUST use CSS variables for tweak-able properties (`var(--card-bg)`, `var(--font-headline)`, `var(--photo-radius)`, `var(--photo-aspect)`) and class hooks for optional components (`.lunar-date.hidden { display: none !important; }`). See `design-principles.md` → "Tweakable templates" for the full contract.

   `build.js` also bakes `default: false` components into the rendered HTML — meaning the standalone preview and PNG output match the gallery's initial state.

   **Localization**: every prose field uses `<field>_<lang>` keyed off the primary language in `data/wedding.json` → `languages[0]`. For a Spanish card, write `name_es`, `label_es`. The renderer falls back: `<field>_<lang>` → `<field>_en` → bare `<field>` → a sane default (`#1`, the design id, etc.). Always provide `<field>_en` alongside the localized version as a sanity fallback.

## Stage 5 — Build, render, open gallery

One bundled stage. Build the HTML, render the PNGs, build the gallery, do a photo-crop review, open it for the user.

1. **Build everything**:
   ```bash
   npm run build && npm run render && npm run gallery
   ```

   - `build.js` renders every design in `data/designs.json` → `dist/<id>.html` (raw invitation HTML, used as iframe source by the gallery)
   - `render.js` shells out to Chrome / Chromium / Edge and outputs **two PNG sizes per design**:
     - `dist/png/social/<id>.png` — 1080×1440 (for messaging, email, social)
     - `dist/png/print/<id>.png`  — 2160×2880 at 300 DPI (for physical printing)
   - `build-gallery.js` reads `designs.json` and writes:
     - **1 design** (`designs.length === 1`): `dist/index.html` IS the detail page (iframe preview + meta + two download buttons + tweak panel if `tweak_options` declared)
     - **N designs** (`designs.length > 1`): `dist/index.html` is a gallery grid; each design also gets `dist/<id>-page.html` (detail) and `dist/<id>-studio.html` (tweak)

   If Chrome isn't found, `render.js` prints install instructions for the user's OS.

2. **Mandatory photo-crop review.** BEFORE opening the gallery for the user, **read the rendered social PNG yourself** (`dist/png/social/<id>.png` — Read tool, it's an image) and check:

   - No head, forehead, chin, or face is cropped by `.photo-wrap` border-radius / shape.
   - Both people in a couple shot are visible — no one is half-cut by the frame edge.
   - Important elements (hands holding rings, bouquet, etc.) are inside the frame.

   If the crop is wrong, fix it BEFORE handing back to the user. Don't ship a card with a cropped forehead and let the user discover it. Common fixes:

   - Adjust `object-position: center 12%` — lower the percentage (4%, 8%) to keep heads in frame, or raise (20%, 30%) for a face-centered crop.
   - Switch the frame shape: circle → oval (taller) → arch (rounded top, square bottom) → rectangle. Each one clips less of the subject's head.
   - Widen the photo-wrap: 240px → 280px → 320px so the photo isn't squeezed.
   - If the photo is full-length and the frame is small + tight, switch to a layout that gives the photo more vertical room, or pick a different photo.

   Repeat `npm run build && npm run render && npm run gallery` after any fix.

3. **Open the gallery**:
   - macOS: `open dist/index.html`
   - Linux: `xdg-open dist/index.html`
   - Windows: `start dist/index.html`

4. **The user takes it from there.**
   - **Tweak panel** — every design (single or multi) ships with `<id>-studio.html` where the user can swap color scheme, fonts, photo frame, and toggle optional components. No rebuild needed; changes apply live and persist via `localStorage`.
   - **Download** — Social and Print PNG buttons on the detail page write to wherever the browser saves downloads.
   - **Iterate via chat for things the tweak panel can't do** — e.g. "make the date numerals bigger", "swap the photo", "rewrite the layout, the date is too far from the names". Update the template, re-run `npm run build && npm run render && npm run gallery`, tell the user to refresh.

   Feedback patterns and what they map to:

   | User says | You change |
   |---|---|
   | "I want to try a different color" | Point them to the **tweak panel** (`<id>-studio.html`) — no rebuild |
   | "Hide the lunar date" | **Tweak panel** → uncheck "Lunar date" (or set `default: false` in `designs.json` if it should be off forever) |
   | "Font too small" | bump `font-size` 2-4 px on the relevant rule in the template + rebuild |
   | "Color too dark" | lighten the hex / drop opacity in the template + rebuild |
   | "Head is cropped" | `object-position: center 12%` → `8%` or `4%` + rebuild |
   | "Make the frame square instead of oval" | Either point to tweak panel's frame switcher (if declared) or edit `.photo-wrap { border-radius: 50% → 4px }` + rebuild |
   | "Swap the photo" | edit `data/designs.json` `primary_photo` + rebuild |
   | "I don't like this layout" | re-read `design-principles.md`; rewrite the template (don't try to patch a bad layout); rebuild |

   For visual choices ("square / round / oval photo frame?"), prefer surfacing the tweak panel's frame switcher — it's faster than rebuilding.

   **If the user picked multiple designs and now wants to refine just one** — edit that one design's template (or its `tweak_options`), rebuild, tell the user to refresh. The other designs are unaffected.

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
- ❌ **Generating multiple similar designs in one session** — when the user selects N aesthetics in Stage 3, each variant must look meaningfully different (different layout, palette, motifs); don't ship 3 minor variants of the same template
- ❌ **Including a Custom card in the picker** — Custom is a chat-only reply ("回复 Custom"); putting it in the picker biases users to skip the curated set
- ❌ Hardcoding any user data in a template (always `{{path}}` placeholders)
- ❌ Continuing past Stage 1 without confirmed photos on disk
- ❌ Using bash-only commands when the user is on Windows
