# wedding-invitation skill

A Claude Code skill for generating beautiful, bespoke wedding invitation cards — **entirely on your own machine**.

## What it does

You chat with Claude about your wedding (names, date, venue, style preference, photos). Claude designs a custom HTML template for you, renders it with headless Chrome, and hands you a print-ready PNG.

No website. No signup. No cloud. Your photos, names, and address never leave your laptop.

## What makes it different

| Most wedding-invitation tools | This skill |
|---|---|
| Pick from a fixed gallery of templates | Claude *designs* a unique one based on your style preferences |
| Upload photos to their servers | Photos stay on your machine — `.gitignore`'d by default |
| SaaS / monthly fee / signup wall | Free; runs locally; no account |
| Web-based editor that bottlenecks on remote servers | Pure file:// preview; no network calls after install |

## Install

This is a Claude Code skill. After installing, just tell Claude:

> "Help me make a wedding invitation."

Claude reads `SKILL.md` and drives the conversation from there.

For the curious / hacker — the skill layout:

```
SKILL.md                ← skill entry point (Claude reads this)
workflow.md             ← dialogue / decision guide
design-principles.md    ← visual + technical constraints
references/             ← 15 example templates as stylistic vocabulary
skeleton/               ← starting project copied to your workspace
```

## Requirements

- **Node.js 18+**
- **Google Chrome or Chromium** installed — used to screenshot the HTML into a PNG.
  If you don't have it, the skill will fall back to `npx puppeteer-cli` which downloads a bundled chromium (~200 MB on first run).
- **macOS or Linux**. Windows is untested; the render script uses bash. WSL works.

## Workflow (under the hood)

1. **Setup** — Claude copies `skeleton/` into a working directory you choose (e.g. `~/my-wedding/`)
2. **Gather** — Claude asks for names, date, venue, time, style preference; fills `data/wedding.json`
3. **Style preview** — Claude renders 3 candidate styles in your browser so you can compare visually
4. **Design** — Claude writes a new `templates/<your-design>.html` tailored to the direction you chose
5. **Build** — `npm run build` renders the template to `dist/<your-design>.html`; you open it in your browser
6. **Iterate** — you give feedback ("bigger font", "softer color", "swap the photo"), Claude tweaks the template, you rebuild
7. **Export** — `npm run render` screenshots the HTML to `dist/png/<your-design>.png` at 1080×1440 print resolution; Claude asks where to save the final file

## Privacy

- Photos in `skeleton/photos/` — already `.gitignore`d
- Wedding data (`data/wedding.json`) — already `.gitignore`d
- Build output (`dist/`) — already `.gitignore`d
- No telemetry. The skill itself makes zero network requests. The browser loads fonts from `fonts.font.im` at preview time (browser-side, optional — you can pre-download fonts).

## Credits

Templates in `references/` were originally built for one anonymized wedding, used here as stylistic vocabulary. All identifying information has been stripped; what you see in references are pure design exercises with `{{path.to.value}}` placeholders only. Real wedding data never enters this repo.

## License

MIT.
