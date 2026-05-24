---
name: wedding-invitation
description: Use this skill when the user wants to design and generate a wedding invitation card. The skill drives a conversational workflow — you gather the couple's info and style preferences, then write a bespoke HTML template (no fixed-template selection), render it locally with headless Chrome, and produce a print-ready PNG. All data stays on the user's machine; no cloud, no signups, no data leaves.
---

# Wedding Invitation Skill

## When to invoke

The user asks for help making a wedding invitation, save-the-date, or a similar event card (engagement, anniversary, etc.). They want a single image or set of images — not a website, not a SaaS product.

## Core principle: design, don't pick

This is **not** a fixed-template generator. There is no menu of 15 templates the user chooses from. Your job is to:

1. Talk with the user to understand who they are and what they want
2. Synthesize a unique HTML template tailored to that specific couple
3. Render it locally and iterate based on user feedback

The `references/` directory holds 15 example templates as **stylistic vocabulary** — read them to understand what `morandi`, `wabi-sabi`, `palace`, `art-deco`, etc. look like in HTML+CSS. Then write a new template; do **not** just copy one of them verbatim.

## Privacy invariant

User-provided data (photos, names, dates, venues, family info) is **highly sensitive** in the wedding-invitation context. This skill is designed so that data never leaves the user's machine:

- All rendering is local (headless Chrome screenshots HTML files via file://)
- No telemetry, no API calls, no uploads
- The `skeleton/.gitignore` excludes `photos/`, `data/wedding.json`, `data/designs.json`, and `dist/` from version control

Never suggest external services (image hosting, online editors, cloud rendering) for any step.

## Workflow

Read `workflow.md` before you start interacting with the user. It walks through the 6 dialogue stages and what to do in each.

## Interaction principle

Visual choices (style direction, frame shape, layout) deserve visual previews — render HTML in the user's browser before asking. Non-visual discrete choices use the AskUserQuestion tool. Open-ended answers (names, dates) use plain text. `workflow.md` gives the full 3-tier degradation.

## System requirements

The user's machine must have:
- Node.js 18+
- Google Chrome OR Chromium installed (for the local PNG screenshot step in Stage 6)
- macOS or Linux

If the user lacks Chrome, you have two fallbacks:
1. Tell them how to install (`brew install --cask google-chrome` on Mac, `apt install chromium` on Linux)
2. Suggest `npx puppeteer-cli` which downloads a bundled chromium (~200 MB) — useful in CI / one-off setups but slower for the user the first time

Photos are provided by the user via a local directory path they give you — you copy + rename into the project. Never ask them to upload anywhere.

## Design rules

Before writing any template, read `design-principles.md`. It contains the hard constraints (canvas size, font stack, color palettes, photo aspect ratios, mobile-first considerations) that every template must obey.

## Files in this skill

```
SKILL.md                ← you are here
workflow.md             ← step-by-step dialogue and decision guide
design-principles.md    ← visual / technical constraints for new templates
references/             ← 15 example templates (stylistic vocabulary)
  thumbnails/             ← pre-rendered PNG previews for instant style picking
skeleton/               ← starting project to copy into the user's workspace
  package.json
  scripts/
    derive.js           ← expands a minimal data seed into the full 26-field wedding.json
    build.js            ← renders templates with user data into dist/<id>.html
    render.sh           ← screenshots dist/<id>.html into a PNG via headless Chrome
    template-engine.js  ← tiny {{path.to.value}} replacer
  templates/            ← where new templates you write live
  data/
    wedding.example.json
    designs.example.json
  photos/               ← user drops their photos here
  .gitignore
```

## Output: what success looks like

A directory like `~/my-wedding/` containing:
- `dist/<design-id>.html` — previewable in any browser via file://
- `dist/png/<design-id>.png` — high-resolution (1080×1440 at 2.57x scale) print-ready PNG
- The user opens the PNG and is delighted, or asks for changes; you iterate.
