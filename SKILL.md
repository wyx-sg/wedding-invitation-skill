---
name: wedding-invitation
description: Use this skill when the user wants to design and generate a wedding invitation card in any language. The skill drives a conversational workflow — you gather the couple's info and style preferences, design a bespoke HTML template from scratch (no template selection), render it locally with headless Chrome, produce a print-ready PNG, and include a live tweak panel so the user can adjust colors, fonts, frames, and optional components without rebuilding. All data stays on the user's machine; no cloud, no signups, no data leaves.
---

# Wedding Invitation Skill

## When to invoke

The user asks for help making a wedding invitation, save-the-date, or a similar event card (engagement, anniversary, etc.) in any language. They want a single image or set of images — not a website, not a SaaS product.

## Core principle: design, don't pick

This skill **does not** have a generic template gallery the user picks from. Every invitation is **designed from scratch for this specific couple** in the language(s) they want.

How many designs end up in the final gallery depends entirely on the **style picker** in Stage 3 — it's multi-select. Pick 1 aesthetic → 1 design. Pick 3 → 3 designs. The output is always a local gallery (`dist/index.html`) with one detail page + one tweak studio page per design, regardless of count. No mode flag, no upfront mode choice — emerges naturally from picker selections.

Each design is custom-built (not pulled from a frozen template library) using `design-principles.md` as the visual vocabulary.

Your job:
1. Talk with the user to learn who they are, what language(s), and which aesthetic direction(s) fit their photos
2. Design **fresh** HTML template(s) tailored to them, one per direction they picked
3. Render them locally + open the gallery, where each design can be downloaded or tweaked via a live tweak panel

**The aesthetic vocabulary in `design-principles.md` is directional, not prescriptive.** Each aesthetic entry has a **Spirit** (the soul), a **Starting palette** (a reference, not a recipe — shift hues to match the photo), a **Typography family** (pick within the family for the formality the couple wants), and a **NEVER list** (hard constraints — those are non-negotiable). Some culturally-specific aesthetics also have **Hard cultural requirements** (e.g. `red-gold` must be red-dominant, `arabic` must use a mihrab arch). Otherwise, you are designing — using judgment to adapt the direction to the couple's photo, language, and preferences.

**The `examples/` directory is OFF LIMITS for reading.** It is a frozen showcase of reference invitations used in the README gallery — each in its own native cultural language. Reading those files is forbidden: they bias you toward copying a specific design, and their language may not match the user's chosen language. Use `design-principles.md` as your sole visual reference. **Do not show `examples/thumbnails/*.png` to the user during the Stage 3 style picker either** — the user fixates on "I want THAT one" and the agent gets pulled toward literal copy. Instead, present aesthetic directions as **mood-board cards** (palette swatches + type sample + spirit description). See `workflow.md` Stage 3 for the picker template.

The `references/` directory IS readable at runtime — it ships agent-copyable starting points (a blank-canvas template + a maximal tweak_options snippet) used when the user picks Custom in Stage 3. Unlike `examples/`, these are not finished designs to copy — they're skeletons to fill in with the user's data.

### Repository layout note (for skill maintainers)

The 20 showcase invitations live in `examples/` as authoritative master copies. The GitHub Pages site at `docs/` is **generated** from `examples/` by `scripts/build-pages.js` and committed — GH Pages serves static files, so the generated artifacts are checked in. If you see two `styleNN-…html` files (one in each directory) and wonder which to edit, edit the `examples/` copy and re-run `node scripts/build-pages.js` to regenerate `docs/`. Don't hand-edit `docs/*.html`.

This layout matters only to the skill author. At runtime — when a user runs the wedding-invitation skill — neither `examples/` nor `docs/` is read. The skill works exclusively from `skeleton/`, `references/`, `workflow.md`, and `design-principles.md`.

## Language

The user's language choice is the FIRST design decision. Ask it before you ask anything else (see `workflow.md` Stage 1).

`data/wedding.json` declares `languages` as an array, e.g.:
- `["en"]` — English wedding card
- `["zh"]` — Chinese 婚帖
- `["zh", "en"]` — bilingual
- `["es"]`, `["ja"]`, `["ko"]`, `["fr"]`, ... — design from that culture's conventions

`design-principles.md` covers typography for the major scripts (Latin, CJK, Korean, Japanese, Arabic, etc.).

For non-en / non-zh languages, `derive.js` cannot auto-format dates and times — you write localized strings directly into `data/wedding.json`.

## Privacy invariant

Wedding data (photos, names, dates, venues, family info) is **highly sensitive**. The skill is designed so data never leaves the user's machine:

- All rendering is local (headless Chrome screenshots HTML files via file://)
- No telemetry, no API calls, no uploads
- `skeleton/.gitignore` excludes `photos/`, `data/wedding.json`, `data/designs.json`, and `dist/` from version control

Never suggest external services (image hosting, online editors, cloud rendering, web-based invitation builders) for any step.

The only network egress is at preview time: the browser loads webfonts from a Google Fonts CDN. The skill asks the user at Stage 2 which to use:
- `fonts.font.im` if the user is in mainland China (CN mirror, reachable from inside the GFW)
- `fonts.googleapis.com` everywhere else (official, faster, partially blocked in CN)

If the user is offline, the templates degrade to system fonts; the PNG export still works.

## Workflow

Read `workflow.md` before you start interacting with the user. It walks through 6 dialogue stages.

## Interaction principle (3-tier degradation)

Visual choices deserve visual previews. Non-visual discrete choices use the `AskUserQuestion` tool when available. Open-ended answers (names, dates) use plain text.

`AskUserQuestion` is **Claude Code specific**. If you're running in a different coding agent (Cursor, Aider, Codex CLI, Gemini CLI, etc.) and don't have that tool, degrade gracefully to plain text questions in chat.

`workflow.md` has the full 3-tier policy and worked examples.

## System requirements

The user's machine must have:
- Node.js 18+
- Google Chrome / Chromium / Microsoft Edge (any one — used by `render.js` for the PNG screenshot step)
- macOS, Linux, or Windows

If the user lacks a Chromium-family browser:
- **macOS:** `brew install --cask google-chrome` or download from <https://www.google.com/chrome/>
- **Linux:** `sudo apt install chromium-browser` (Debian/Ubuntu), `sudo dnf install chromium` (Fedora)
- **Windows:** `winget install Google.Chrome` or download from <https://www.google.com/chrome/>

Photos: ask the user for an absolute path on their machine; copy + rename into the project. Never ask them to upload anywhere.

## Design rules

Read `design-principles.md` before writing ANY template. It contains:
- Hard constraints (canvas size, mobile-first, photo handling, forbidden patterns)
- Per-language typography (fonts for zh / en / ja / ko / es / ar / ...)
- Concrete visual vocabulary for 14+ aesthetics (morandi, wabi-sabi, art-deco, new-chinese, etc.)
- Color palettes

This file is your **only** design reference. Do not read `examples/*.html`.

## Files in this skill

```
SKILL.md                  ← you are here
workflow.md               ← 6-stage dialogue and decision guide
design-principles.md      ← visual / technical constraints + per-aesthetic vocabulary
docs/                     ← GitHub Pages site (https://wyx-sg.github.io/wedding-invitation-skill/)
                            GENERATED from examples/ via scripts/build-pages.js — do NOT hand-edit
  index.html / index.zh.html   (EN/ZH landing pages with the 20-style gallery)
  invitations/<style>.html     (raw rendered invitation HTML — iframe sources for the detail pages)
  <style>.html                 (per-style detail page with iframe + meta + EN/ZH toggle)
  thumbnails/*.png             (copied from examples/thumbnails/)
  photos/*.jpg                 (copied from examples/photos/)
examples/                 ← skill-author source of truth; DO NOT READ at runtime
  *.html                    (20 example invitation templates — the master copies)
  thumbnails/*.png          (rendered thumbnails for README + inspiration display)
  photos/*.jpg              (per-template AI-generated couple photos)
references/                 ← agent-copyable starting points (runtime-readable, unlike examples/)
  blank-canvas.html           (neutral template used when user picks Custom in Stage 3)
  blank-canvas-designs.json   (maximal tweak_options snippet for the Custom design entry)
scripts/                  ← skill-author build tools (NOT used at user runtime)
  build-pages.js            (regenerates docs/ from examples/ — run before deploying GH Pages)
  build-thumbnails.js       (renders examples/*.html → examples/thumbnails/*.png at 2x)
  build-example-photos.js   (AI-generates examples/photos/*.jpg via Nano Banana Pro)
  fixtures.js / style-meta.js (shared placeholders + per-style metadata for the above)
skeleton/                 ← starting project copied into the user's workspace
  package.json
  scripts/
    derive.js               (expands seed → all required fields per declared languages)
    build.js                (renders templates with user data into dist/<id>.html)
    render.js               (cross-platform headless-Chrome → PNGs at 2 sizes)
    build-gallery.js        (generates dist/index.html + per-design detail pages)
    template-engine.js      (tiny {{path.to.value}} replacer)
  templates/                (where new templates you write live)
  data/
    wedding.example.json    (post-derive schema example; bilingual zh+en)
    designs.example.json    (one entry per design; includes optional meta block)
  photos/                   (user drops their photos here)
  .gitignore
```

## Output: what success looks like

A directory like `~/my-wedding/` containing:
- `dist/<design-id>.html` — the rendered invitation (iframe source for the gallery)
- `dist/png/social/<design-id>.png` — 1080×1440, for messaging / email / social media
- `dist/png/print/<design-id>.png` — 2160×2880 at 300 DPI, for printing physical cards
- `dist/index.html` — local gallery landing (always, even for 1 design): a grid of cards, each linking to its own detail page
- `dist/<id>-page.html` — per-design detail page: iframe preview, palette/typography meta, two download buttons, prev/next pager (only when >1 design)
- `dist/<id>-studio.html` — per-design tweak studio: live color/font/frame/component switchers, no rebuild needed

The user opens `dist/index.html`, sees their invitation(s) in a polished page, and downloads the size they need. They can also continue iterating with you to refine.
