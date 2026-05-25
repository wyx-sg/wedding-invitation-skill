<p align="right"><strong>English</strong> · <a href="./README.zh-CN.md">简体中文</a></p>

# Wedding Invitation

[![Download Latest Release](https://img.shields.io/github/v/release/wyx-sg/wedding-invitation-skill?label=Download%20skill%20zip&color=2c2c2c&style=for-the-badge)](https://github.com/wyx-sg/wedding-invitation-skill/releases/latest/download/wedding-invitation-skill.zip)

> An AI-agent skill that designs your wedding invitation from a conversation — any language, any aesthetic, rendered locally, never uploaded.

**🎨 [Open the live gallery](https://wyx-sg.github.io/wedding-invitation-skill/)** — click any of the 20 examples to see it rendered full-size.

[![hero](./docs/hero.png)](https://wyx-sg.github.io/wedding-invitation-skill/)

<p align="center">
  <a href="https://wyx-sg.github.io/wedding-invitation-skill/"><img alt="Live Gallery" src="https://img.shields.io/badge/%F0%9F%8E%A8%20Live%20Gallery-d4af37?labelColor=2a2218"></a>
  <img alt="MIT License" src="https://img.shields.io/badge/license-MIT-blue.svg">
  <img alt="Works with Claude Code" src="https://img.shields.io/badge/Claude%20Code-compatible-d4af37">
  <img alt="Node 18+" src="https://img.shields.io/badge/node-%E2%89%A518-339933">
  <img alt="macOS · Linux · Windows" src="https://img.shields.io/badge/platform-macOS%20%C2%B7%20Linux%20%C2%B7%20Windows-lightgrey">
</p>

## Quick start

Download the latest release into Claude Code's skills directory:

```bash
mkdir -p ~/.claude/skills && cd ~/.claude/skills
curl -L https://github.com/wyx-sg/wedding-invitation-skill/releases/latest/download/wedding-invitation-skill.zip -o wedding-invitation-skill.zip
unzip -o wedding-invitation-skill.zip && rm wedding-invitation-skill.zip
```

Then in [Claude Code](https://claude.ai/code):

```
/wedding-invitation
```

Or just say "help me make a wedding invitation" — Claude takes it from there, no restart needed.

The release zip is under 100 KB and contains only the runtime files: `SKILL.md`, `workflow.md`, `design-principles.md`, `LICENSE`, `references/`, `skeleton/`.

### Requirements

- Node.js 18+
- A Chromium-family browser (Google Chrome, Chromium, or Microsoft Edge) — used by `render.js` for PNG export. If missing, the skill prints install instructions for your OS.
- macOS, Linux, or Windows

### Contributing? Clone the source instead

```bash
git clone https://github.com/wyx-sg/wedding-invitation-skill ~/.claude/skills/wedding-invitation
```

The repo includes extras not needed to *use* the skill but useful for development:
- `examples/` — 20 showcase invitations (source of truth for the README gallery)
- `docs/` — the GitHub Pages site, generated from `examples/` via `scripts/build-pages.js`
- `__test__/tweak-fixture/` — end-to-end test fixture
- `scripts/` — maintainer build tools

## What you'll get

- A **bespoke HTML design** created for you — not picked from a generic gallery
- **Two PNG sizes per design** — 1080×1440 for messaging/email, 2160×2880 at 300 DPI for printing
- A **local browser tweak studio** to fine-tune color / font / photo-frame / optional components on each design — live, no rebuild needed
- Designed in **your language(s)** — English, Chinese, Spanish, Japanese, Korean, French, Hindi, Arabic, or any combination
- Your photos, names, and address **never leave your machine**

You pick **how many designs** by how many style directions you select. Pick one direction → one design. Pick three → three designs side-by-side in the gallery. You can also tell Claude to skip the curated picker and design from a conversation about your specific vision.

The 20 examples in the image above span world cultures and contemporary aesthetics, showing the visual range available:

- **Chinese** — `new-chinese`, `red-gold`, `gugong`, `ink-flower`
- **Japanese** — `wabi-sabi`
- **Korean** — `korean-hanbok`
- **South Asian** — `indian`
- **Middle Eastern** — `arabic`
- **Latin / Mexican** — `latin`
- **European** — `french-provence`, `art-deco`, `vogue`, `newspaper`, `letter`
- **Contemporary** — `morandi`, `modern-minimal`, `mediterranean`, `black-gold`
- **Themed** — `retro-poster`, `vintage-stars`

Each invitation is custom-designed from scratch — not pulled from a template library.

## How it works

```mermaid
flowchart LR
    A[💬 Talk: language<br/>names · date · venue] --> P[📷 Pick photos]
    P --> S[🎨 Pick style direction<br/>multi-select]
    S --> D[Claude writes one HTML<br/>template per direction]
    D --> ST[🛠 Stage 4 · Preview + tweak<br/>dist/preview.html<br/>live studio per design]
    ST --> DL[📥 Stage 5 · Deliver<br/>dist/index.html<br/>download Social / Print PNG]
```

1. **Talk** — language(s), names, date, venue
2. **Pick photos** — Claude shows every photo you provided as a card; tap to select (multi-select or "Select All"). First selected becomes primary; the rest stay available as alternates the design can switch to
3. **Pick style direction(s)** — Claude looks at your photos and curates 5 best-matching aesthetic directions; you pick one or several. Reply "show me others" for a fresh batch (already-picked ones stay), or just tell Claude in chat "I want something custom" / "我想要自定义" to skip the curated picker and design from a conversation about your specific vision
4. **Design** — Claude writes a fresh HTML template per direction you picked
5. **Preview + tweak** (Stage 4 — `dist/preview.html`) — live iframe thumbnails of every design; click any card to open its **studio** with color / font / photo-frame / show-hide controls. Tweaks save to disk so Claude knows what you picked. Tell Claude in chat for anything the studio can't do
6. **Deliver** (Stage 5 — `dist/index.html`) — final gallery with PNG thumbnails; click a card → detail page with **Social** (1080×1440) and **Print** (2160×2880) download buttons. You can flip back to Stage 4 anytime to tweak more

## Use with other coding agents

| Agent | How to use |
|---|---|
| **Claude Code** | First-class — auto-discovers the skill after `git clone` |
| **Claude Agent SDK** | Supported |
| Cursor / Aider / Codex CLI / Gemini CLI / others | Clone anywhere; tell the agent: "read `SKILL.md` and help me make a wedding invitation" |

Some interactions use Claude Code's `AskUserQuestion` tool for visual picking; other agents automatically fall back to plain text.

## Privacy

Your photos, names, and address stay on your laptop. No uploads. No cloud accounts. No telemetry. No third-party services.

The skill makes zero network requests of its own. The only thing that hits the network is your browser loading webfonts from Google Fonts during HTML preview — and that's just font URLs, nothing about you.

## FAQ

<details>
<summary><b>Can I use this without Claude Code?</b></summary>

Yes. Any coding agent that reads markdown works — you just need to manually point it at `SKILL.md`. Auto-discovery is Claude Code specific.

</details>

<details>
<summary><b>Is this a website?</b></summary>

No. It produces a static PNG you can print, share, attach to email, or send via messaging apps.

</details>

<details>
<summary><b>What languages does it support?</b></summary>

Anything. The skill asks at the start. Chinese, English, Spanish, Japanese, Korean, French, bilingual combinations — `design-principles.md` has typography guidance for the major scripts.

</details>

<details>
<summary><b>Can I use my own photos?</b></summary>

Yes. The skill asks where they live on your machine and copies them into the project.

</details>

<details>
<summary><b>What if I'm on Windows?</b></summary>

Works. `render.js` shells out to whichever Chrome / Chromium / Edge you have installed. Bash-only commands in the skill docs all have Windows PowerShell equivalents.

</details>

## License

MIT — see [LICENSE](./LICENSE).
