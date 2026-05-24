---
name: wedding-invitation
description: Use this skill when the user wants to design and generate a wedding invitation card in any language. The skill drives a conversational workflow — you gather the couple's info and style preferences, design a bespoke HTML template from scratch (no template selection), render it locally with headless Chrome, and produce a print-ready PNG. All data stays on the user's machine; no cloud, no signups, no data leaves.
---

# Wedding Invitation Skill

## When to invoke

The user asks for help making a wedding invitation, save-the-date, or a similar event card (engagement, anniversary, etc.) in any language. They want a single image or set of images — not a website, not a SaaS product.

## Core principle: design, don't pick

This skill **does not** have a template gallery the user picks from. Every invitation is **designed from scratch** for the specific couple — in the language(s) they want, with the visual direction they want.

Your job:
1. Talk with the user to learn who they are, what language(s), and what aesthetic
2. Design a unique HTML template tailored to them, using `design-principles.md` as your visual vocabulary
3. Render it locally and iterate

**The `examples/` directory is OFF LIMITS for reading.** It is a frozen showcase of Chinese examples used in the README gallery. Reading those files is forbidden — they bias you toward copying, and they are all in Chinese (the user's invitation may be in any language). Use `design-principles.md` as your sole visual reference.

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

The only network egress is at preview time: the browser loads webfonts from `fonts.font.im` (a Google-Fonts CN mirror). If the user is offline, the templates degrade to system fonts; the PNG export still works.

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
examples/                 ← frozen Chinese showcase artifacts; DO NOT READ at runtime
  *.html                    (15 example invitations — README gallery use only)
  thumbnails/*.png          (rendered thumbnails for README + inspiration display)
  photos/                   (stock placeholder images bundled for thumbnails)
skeleton/                 ← starting project copied into the user's workspace
  package.json
  scripts/
    derive.js               (expands seed → all required fields per declared languages)
    build.js                (renders templates with user data into dist/<id>.html)
    render.js               (cross-platform headless-Chrome → PNG, zero npm deps)
    template-engine.js      (tiny {{path.to.value}} replacer)
  templates/                (where new templates you write live)
  data/
    wedding.example.json    (post-derive schema example; bilingual zh+en)
    designs.example.json
  photos/                   (user drops their photos here)
  .gitignore
```

## Output: what success looks like

A directory like `~/my-wedding/` containing:
- `dist/<design-id>.html` — previewable in any browser via file://
- `dist/png/<design-id>.png` — high-resolution (1080×1440 at 2.57× scale) print-ready PNG

The user opens the PNG and is delighted, or asks for changes; you iterate.
