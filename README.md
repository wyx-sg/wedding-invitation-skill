<p align="right"><strong>English</strong> · <a href="./README.zh-CN.md">简体中文</a></p>

# Wedding Invitation

> An AI-agent skill that designs your wedding invitation from a conversation — any language, any aesthetic, rendered locally, never uploaded.

<p align="center">
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

- A **bespoke HTML template** designed for you — not picked from a gallery
- A **print-ready PNG** at 1080×1440 (or 1080×1920 for 9:16 poster format)
- Designed in **your language(s)** — English, Chinese, Spanish, Japanese, Korean, or any combination
- Your photos, names, and address **never leave your machine**

The 20 examples in the image above span world cultures and contemporary aesthetics:

- **Chinese** — `new-chinese`, `red-gold`, `gugong`, `ink-flower`
- **Japanese** — `wabi-sabi`
- **Korean** — `korean-hanbok`
- **South Asian** — `indian`
- **Middle Eastern** — `arabic`
- **Latin / Mexican** — `latin`
- **European** — `french-provence`, `art-deco`, `vogue`, `newspaper`, `letter`
- **Contemporary** — `morandi`, `modern-minimal`, `mediterranean`, `black-gold`
- **Themed** — `retro-poster`, `vintage-stars`

These are not templates you pick from — each is a one-off, designed from scratch. Your invitation will be designed fresh in your chosen language, with your aesthetic direction.

## How it works

1. **Talk** — Claude asks your language(s), names, date, venue, style preference
2. **Preview** — Claude shows aesthetic directions visually in your browser
3. **Design** — Claude writes a unique HTML template from scratch in your language
4. **Iterate** — you say "bigger font" / "softer color" / "swap the photo"; Claude tweaks
5. **Export** — one command screenshots the HTML into a high-res print-ready PNG

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
