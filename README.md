<p align="right"><strong>English</strong> · <a href="./README.zh-CN.md">简体中文</a></p>

# Wedding Invitation

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

```bash
git clone https://github.com/wyx-sg/wedding-invitation-skill \
  ~/.claude/skills/wedding-invitation
```

Then in [Claude Code](https://claude.ai/code), invoke the skill:

```
/wedding-invitation
```

Or just tell Claude: "Help me make a wedding invitation." Either way works — Claude takes it from there. No restart needed.

## What you'll get

- A **bespoke HTML design** created for you — not picked from a generic gallery
- **Two PNG sizes per design** — 1080×1440 for messaging/email, 2160×2880 at 300 DPI for printing
- A **local gallery page** that opens in your browser with download buttons
- Designed in **your language(s)** — English, Chinese, Spanish, Japanese, Korean, French, Hindi, Arabic, or any combination
- Your photos, names, and address **never leave your machine**

You pick a **mode** at the start:

- **Single design + iterate** (default) — Claude designs one template tailored to you and refines with your feedback. ~30 minutes, 3-5 rounds.
- **Multiple alternatives** — Claude generates 3 / 5 / 8 different aesthetics in parallel using your actual data. You browse them in a local gallery and either download a favorite or pick one to keep iterating.

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

Whatever mode you pick, each invitation is custom-designed from scratch — not pulled from a template library.

## How it works

```mermaid
flowchart LR
    A[💬 You talk] --> B[language · names<br/>date · venue · photos]
    B --> M{mode?}
    M -->|Single| S[Claude designs 1 template<br/>· iterate with feedback]
    M -->|Multi N| G[Claude generates N variants<br/>· each a different aesthetic]
    S --> R[Render PNG · 2 sizes<br/>Social 1080 · Print 2160]
    G --> R
    R --> O[Local gallery opens in browser<br/>📥 Download buttons]
```

1. **Talk** — Claude asks your language(s), names, date, venue, style preference
2. **Mode** — Single design or compare alternatives
3. **Preview** — Claude shows aesthetic directions visually in your browser
4. **Design** — Claude writes unique HTML template(s) from scratch in your language
5. **Iterate** (single mode) — you say "bigger font" / "softer color" / "swap the photo"; Claude tweaks
6. **Open gallery** — `dist/index.html` opens in your browser with download buttons for two PNG sizes

## Requirements

- **Node.js 18+**
- **Google Chrome, Chromium, or Microsoft Edge** — used to render the PNG. The skill ships with a cross-platform Node script (`render.js`) that locates whichever you have.
- **macOS, Linux, or Windows**

If you don't have a Chromium-family browser, the skill prints install instructions for your OS.

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
