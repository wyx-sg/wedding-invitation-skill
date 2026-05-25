# Tweak Page (Design Studio) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an interactive "tweak page" on the detail view that lets users adjust color scheme, fonts, optional components (Phase 1) and photo frame (Phase 2) in real time via `postMessage` to the design iframe — no rebuild, no reload, all local.

**Architecture:** Reuse the existing `postMessage` channel (already used by the photo switcher between `build-gallery.js` and the listener injected by `build.js`). Extend the protocol with new message types (`set-css-vars`, `set-font`, `toggle-component`, `set-frame`, `reset`). Templates declare their tweak surface area via CSS variables (`--card-bg`, `--font-headline`, `--photo-radius`, ...) and class hooks (`.optional .lunar-date`, ...). Each design's allowed variants are declared in `data/designs.json` under a new `tweak_options` field; the detail page reads them and renders the control panel only when present.

**Tech Stack:** Vanilla JS, CSS custom properties, no new deps. Templates remain pure HTML+CSS with placeholders.

---

## Scope split

- **Phase 1 (tasks 1–6)** — Protocol expansion + preset color schemes + fonts + component toggles + reset.
- **Phase 2 (tasks 5–6 inline)** — Frame switcher (`set-frame`) wired up alongside Phase 1.
- **Phase 3 (tasks 7–8)** — Fixture + end-to-end verification with browser MCP.
- **Phase 4 (tasks 9–11)** — Docs updates (design-principles.md, workflow.md, SKILL.md).
- **Phase 5 (tasks 12–15)** — **NEW**: Custom design from scratch — Stage 3 "Custom" card + blank-canvas template + free-form controls in tweak panel + "Save as new design" persistence.
- **Phase 6 (tasks 16–17)** — **NEW**: Consolidate `docs/` and `examples/` duplication. Decide source-of-truth direction and migrate.
- **Phase 7 (tasks 18–19)** — Final cleanup, self-review, PR.

---

## File structure

**Modified:**
- `skeleton/scripts/build.js` — extend the injected iframe listener to handle 5 new message types
- `skeleton/scripts/build-gallery.js` — render tweak panel on detail page when `design.tweak_options` is set; wire up `postMessage` from controls
- `skeleton/data/designs.example.json` — add `tweak_options` to the example
- `design-principles.md` — add "Tweakable Templates" section: CSS-variable contract + class hooks
- `workflow.md` — Stage 4 / Stage 5 instructions: how to populate `tweak_options`

**Created:**
- `docs/superpowers/plans/2026-05-25-tweak-page.md` — this file
- `__test__/tweak-fixture/` — temporary working dir for end-to-end verification (gitignored / cleaned up post-PR)

**Untouched:**
- `skeleton/scripts/render.js` — PNG render must remain the design's initial state (no tweak applied). The render flow already loads `dist/<id>.html#render` directly; the tweak panel lives in the gallery layer, never reaches render.
- `skeleton/scripts/derive.js` and `template-engine.js`

---

## Phase 1 — Core protocol + color/font/component panel

### Task 1: Branch + plan

**Files:**
- Create: `docs/superpowers/plans/2026-05-25-tweak-page.md` (already done)

- [ ] **Step 1: Create feature branch from main**

```bash
git checkout -b feat/tweak-page
```

- [ ] **Step 2: Confirm clean working tree**

```bash
git status
```

Expected: `nothing to commit, working tree clean` (the plan file is fine to be untracked at this point — we'll commit it with Task 1's wrap-up).

- [ ] **Step 3: Commit the plan**

```bash
git add docs/superpowers/plans/2026-05-25-tweak-page.md
git commit -m "docs: plan for interactive tweak page"
```

---

### Task 2: Extend `build.js` postMessage listener

**Files:**
- Modify: `skeleton/scripts/build.js` around the `frameCss` template literal (lines ~113–144)

The current injected script only handles `{type:'set-photo', url}`. Add a unified handler for:
- `set-css-vars` — `{ vars: {'--k': 'v', ...} }` → for each entry, `documentElement.style.setProperty(k, v)`
- `set-font` — `{ var: '--font-headline', value: 'Manrope' }` → `setProperty(var, value)`. Convenience alias.
- `toggle-component` — `{ id: 'lunar-date', visible: false }` → `document.querySelectorAll('.<id>')` → toggle `.hidden`
- `set-frame` — `{ radius: '50%', aspect: '4/5' }` → setProperty `--photo-radius` and `--photo-aspect`
- `reset` — remove ALL inline style properties on `documentElement.style` (so the template's `:root` defaults take over), AND remove `.hidden` from any element that has it

The id string in `toggle-component` is interpolated into a CSS selector — it MUST be sanitized to alphanumeric + dash to prevent injection. Drop anything that doesn't match `/^[a-zA-Z][a-zA-Z0-9-]*$/`.

- [ ] **Step 1: Replace the message-event listener inside `frameCss`**

Replace the block

```js
      window.addEventListener('message', function (e) {
        var d = e && e.data;
        if (!d || d.type !== 'set-photo' || !d.url) return;
        var img = document.getElementById('main-photo');
        if (img) img.setAttribute('src', d.url);
      });
```

with:

```js
      var SAFE_ID = /^[a-zA-Z][a-zA-Z0-9-]*$/;
      window.addEventListener('message', function (e) {
        var d = e && e.data;
        if (!d || typeof d.type !== 'string') return;
        var root = document.documentElement;
        switch (d.type) {
          case 'set-photo': {
            if (!d.url) return;
            var img = document.getElementById('main-photo');
            if (img) img.setAttribute('src', d.url);
            return;
          }
          case 'set-css-vars': {
            if (!d.vars || typeof d.vars !== 'object') return;
            for (var k in d.vars) {
              if (typeof k === 'string' && k.indexOf('--') === 0) {
                root.style.setProperty(k, String(d.vars[k]));
              }
            }
            return;
          }
          case 'set-font': {
            if (typeof d.var !== 'string' || d.var.indexOf('--') !== 0) return;
            root.style.setProperty(d.var, String(d.value || ''));
            return;
          }
          case 'toggle-component': {
            if (!SAFE_ID.test(String(d.id || ''))) return;
            var els = document.querySelectorAll('.' + d.id);
            for (var i = 0; i < els.length; i++) {
              els[i].classList.toggle('hidden', d.visible === false);
            }
            return;
          }
          case 'set-frame': {
            if (typeof d.radius === 'string') root.style.setProperty('--photo-radius', d.radius);
            if (typeof d.aspect === 'string') root.style.setProperty('--photo-aspect', d.aspect);
            return;
          }
          case 'reset': {
            // clear every custom prop we may have set
            var s = root.style;
            for (var j = s.length - 1; j >= 0; j--) {
              var prop = s[j];
              if (prop && prop.indexOf('--') === 0) s.removeProperty(prop);
            }
            // unhide every .hidden element
            var hidden = document.querySelectorAll('.hidden');
            for (var h = 0; h < hidden.length; h++) hidden[h].classList.remove('hidden');
            return;
          }
        }
      });
```

- [ ] **Step 2: Smoke test build.js still parses**

```bash
node -e "import('./skeleton/scripts/build.js').catch(e => { if (!String(e).includes('designs.json')) throw e; console.log('build.js loaded OK (expected designs.json error)'); })"
```

Expected: `build.js loaded OK …` — the script errors on missing designs.json but the import itself succeeds. If you see a SyntaxError, fix the injected JS.

- [ ] **Step 3: Commit**

```bash
git add skeleton/scripts/build.js
git commit -m "build: extend postMessage listener with tweak protocol (css-vars, font, toggle, frame, reset)"
```

---

### Task 3: Schema — `designs.example.json` `tweak_options`

**Files:**
- Modify: `skeleton/data/designs.example.json`

Add a `tweak_options` block to the example so agents have a worked example. Keep it small and faithful to the morandi spec the user provided.

- [ ] **Step 1: Update `designs.example.json`**

Replace the file with:

```json
[
  {
    "id": "my-design",
    "name_zh": "我的请帖",
    "name_en": "MY INVITATION",
    "template": "my-design.html",
    "primary_photo": "photo-01",
    "width": 420,
    "height": 560,
    "meta": {
      "short": "Short subtitle for the design (1 line)",
      "long": "Optional longer description shown in the gallery / detail page.",
      "palette": ["#f6efe1", "#b8362b", "#d4af37", "#1a1a1a"],
      "fonts": ["Songti SC", "Cormorant Garamond"],
      "motifs": "Decorative motifs (comma separated, optional)"
    },
    "tweak_options": {
      "color_schemes": [
        {
          "name_en": "Warm",
          "name_zh": "暖调",
          "vars": {
            "--card-bg": "#e8e4dc",
            "--card-text": "#2c2c2c",
            "--card-accent-1": "#7a8a6d",
            "--card-accent-2": "#a59585"
          }
        },
        {
          "name_en": "Cool",
          "name_zh": "冷调",
          "vars": {
            "--card-bg": "#dde2dd",
            "--card-text": "#2a3236",
            "--card-accent-1": "#7a8a96",
            "--card-accent-2": "#95a0a5"
          }
        }
      ],
      "fonts": {
        "--font-headline": ["Inter", "Manrope", "DM Sans"],
        "--font-body":     ["Inter", "Manrope"]
      },
      "frames": [
        { "name": "oval",          "radius": "50%",                "aspect": "4/5" },
        { "name": "rounded-rect",  "radius": "8px",                "aspect": "4/5" },
        { "name": "arch",          "radius": "50% 50% 4px 4px",    "aspect": "4/5" }
      ],
      "components": [
        { "id": "tagline",      "label_en": "Tagline",        "label_zh": "寄语",    "default": true  },
        { "id": "lunar-date",   "label_en": "Lunar date",     "label_zh": "农历",    "default": false },
        { "id": "address-full", "label_en": "Full address",   "label_zh": "完整地址", "default": true  }
      ]
    }
  }
]
```

- [ ] **Step 2: Commit**

```bash
git add skeleton/data/designs.example.json
git commit -m "data: add tweak_options example to designs.example.json"
```

---

### Task 4: `build-gallery.js` — tweak panel CSS

**Files:**
- Modify: `skeleton/scripts/build-gallery.js` (extend `DETAIL_CSS`)

Add CSS for the new tweak panel. It lives inside `.detail-info`, between `.specs` and `.download-group`. Wrap it in `.tweak-panel { display: flex; flex-direction: column; gap: 18px; }` with internal `.tweak-group` sections.

- [ ] **Step 1: Append the following CSS to the `DETAIL_CSS` template-literal in `build-gallery.js` (before the final backtick)**

```css
  .tweak-panel {
    display: flex;
    flex-direction: column;
    gap: 18px;
    padding: 18px 0;
    border-bottom: 1px solid var(--border-soft);
  }
  .tweak-group { display: flex; flex-direction: column; gap: 8px; }
  .tweak-group-label {
    font-size: 9.5px;
    letter-spacing: 3.5px;
    text-transform: uppercase;
    color: var(--text-muted);
  }
  .tweak-row {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    align-items: center;
  }
  .tweak-swatch {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 4px 10px 4px 4px;
    background: var(--bg-elevated);
    border: 1.5px solid transparent;
    border-radius: 999px;
    cursor: pointer;
    transition: border-color 0.18s, transform 0.12s;
    font-family: 'Inter', sans-serif;
    font-size: 11px;
    color: var(--text-dim);
    letter-spacing: 0.5px;
  }
  .tweak-swatch:hover { transform: translateY(-1px); }
  .tweak-swatch.active { border-color: var(--accent); color: var(--text); }
  .tweak-swatch .dot-stack {
    display: inline-flex;
    gap: 2px;
  }
  .tweak-swatch .dot {
    width: 14px; height: 14px; border-radius: 50%;
    border: 1px solid rgba(0,0,0,0.12);
  }
  .tweak-font-btn,
  .tweak-frame-btn,
  .tweak-reset-btn {
    padding: 6px 12px;
    background: var(--bg-elevated);
    border: 1.5px solid transparent;
    border-radius: 4px;
    cursor: pointer;
    font-size: 12px;
    color: var(--text-dim);
    transition: border-color 0.18s, color 0.18s, transform 0.12s;
    letter-spacing: 0.5px;
  }
  .tweak-font-btn:hover,
  .tweak-frame-btn:hover { transform: translateY(-1px); color: var(--text); }
  .tweak-font-btn.active,
  .tweak-frame-btn.active { border-color: var(--accent); color: var(--accent); }
  .tweak-checkbox {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 6px 10px;
    background: var(--bg-elevated);
    border: 1.5px solid transparent;
    border-radius: 4px;
    cursor: pointer;
    font-size: 12px;
    color: var(--text-dim);
    transition: border-color 0.18s, color 0.18s;
  }
  .tweak-checkbox:hover { color: var(--text); }
  .tweak-checkbox input {
    margin: 0;
    accent-color: var(--accent);
  }
  .tweak-checkbox.checked { color: var(--text); border-color: rgba(212,184,150,0.3); }
  .tweak-font-sub {
    font-size: 9px;
    letter-spacing: 2.5px;
    text-transform: uppercase;
    color: var(--text-muted);
    flex-basis: 100%;
    margin-bottom: -2px;
  }
  .tweak-reset {
    align-self: flex-end;
    margin-top: -4px;
  }
  .tweak-reset-btn {
    color: var(--text-muted);
    font-size: 11px;
    letter-spacing: 1px;
  }
  .tweak-reset-btn:hover {
    color: var(--accent);
    border-color: var(--border);
  }
```

- [ ] **Step 2: Sanity check the file still parses**

```bash
node --check skeleton/scripts/build-gallery.js
```

Expected: no output (success).

- [ ] **Step 3: Commit**

```bash
git add skeleton/scripts/build-gallery.js
git commit -m "gallery: add CSS for tweak panel UI"
```

---

### Task 5: `build-gallery.js` — tweak panel HTML rendering

**Files:**
- Modify: `skeleton/scripts/build-gallery.js`

Render the tweak panel **only if** `design.tweak_options` is defined. Place it inside `.detail-info`, between `${specsHtml}` and `<div class="download-group">`.

The panel needs to know the design's tweak options at runtime (JS click handlers); embed them as JSON in a `<script>` block scoped to this page.

- [ ] **Step 1: Add a `COPY` entry**

In the `COPY` object near the top, add for both `en` and `zh`:

en branch — add inside the object:
```js
    tweakColorLabel: 'Color',
    tweakFontLabel: 'Typography',
    tweakFrameLabel: 'Photo frame',
    tweakComponentsLabel: 'Show / hide',
    tweakResetLabel: 'Reset',
    tweakHeadlineSub: 'Headline',
    tweakBodySub: 'Body',
```

zh branch — add inside the object:
```js
    tweakColorLabel: '配色',
    tweakFontLabel: '字体',
    tweakFrameLabel: '照片框',
    tweakComponentsLabel: '显示 / 隐藏',
    tweakResetLabel: '重置',
    tweakHeadlineSub: '标题字体',
    tweakBodySub: '正文字体',
```

- [ ] **Step 2: Build the tweak panel renderer**

Inside `detailHtml(design, index, isMulti)`, just before the `const specsBlocks = [];` line, add:

```js
  // Tweak panel — render only when design declares tweak_options.
  // Each section is omitted if the design didn't declare it.
  const tweak = design.tweak_options || null;
  let tweakHtml = '';
  let tweakConfigJson = 'null';
  if (tweak) {
    const sections = [];

    // Colors
    if (Array.isArray(tweak.color_schemes) && tweak.color_schemes.length) {
      const swatches = tweak.color_schemes.map((cs, i) => {
        const name = (lang === 'zh' ? cs.name_zh : cs.name_en) || cs.name || `#${i + 1}`;
        const dots = Object.values(cs.vars || {}).slice(0, 4)
          .map(v => `<span class="dot" style="background:${esc(v)}"></span>`).join('');
        return `<button type="button" class="tweak-swatch" data-tweak-color="${i}">
          <span class="dot-stack">${dots}</span>
          <span>${esc(name)}</span>
        </button>`;
      }).join('');
      sections.push(`<div class="tweak-group" data-section="color">
        <div class="tweak-group-label">${esc(COPY.tweakColorLabel)}</div>
        <div class="tweak-row">${swatches}</div>
      </div>`);
    }

    // Fonts (one row per font variable)
    if (tweak.fonts && typeof tweak.fonts === 'object') {
      const fontRows = Object.entries(tweak.fonts).map(([cssVar, options]) => {
        const subLabel = cssVar === '--font-headline' ? COPY.tweakHeadlineSub
                       : cssVar === '--font-body'     ? COPY.tweakBodySub
                       : cssVar;
        const buttons = (Array.isArray(options) ? options : []).map(font =>
          `<button type="button" class="tweak-font-btn" data-tweak-font-var="${esc(cssVar)}" data-tweak-font-value="${esc(font)}" style="font-family:'${esc(font)}',sans-serif">${esc(font)}</button>`
        ).join('');
        return `<div class="tweak-row">
          <div class="tweak-font-sub">${esc(subLabel)}</div>
          ${buttons}
        </div>`;
      }).join('');
      sections.push(`<div class="tweak-group" data-section="fonts">
        <div class="tweak-group-label">${esc(COPY.tweakFontLabel)}</div>
        ${fontRows}
      </div>`);
    }

    // Frames
    if (Array.isArray(tweak.frames) && tweak.frames.length) {
      const frameButtons = tweak.frames.map((f, i) =>
        `<button type="button" class="tweak-frame-btn" data-tweak-frame="${i}">${esc(f.name || `#${i+1}`)}</button>`
      ).join('');
      sections.push(`<div class="tweak-group" data-section="frame">
        <div class="tweak-group-label">${esc(COPY.tweakFrameLabel)}</div>
        <div class="tweak-row">${frameButtons}</div>
      </div>`);
    }

    // Components
    if (Array.isArray(tweak.components) && tweak.components.length) {
      const checkboxes = tweak.components.map(c => {
        const label = (lang === 'zh' ? c.label_zh : c.label_en) || c.label || c.id;
        const checkedAttr = c.default ? ' checked' : '';
        const klass = c.default ? ' checked' : '';
        return `<label class="tweak-checkbox${klass}" data-tweak-component="${esc(c.id)}">
          <input type="checkbox"${checkedAttr}>
          <span>${esc(label)}</span>
        </label>`;
      }).join('');
      sections.push(`<div class="tweak-group" data-section="components">
        <div class="tweak-group-label">${esc(COPY.tweakComponentsLabel)}</div>
        <div class="tweak-row">${checkboxes}</div>
      </div>`);
    }

    // Reset
    sections.push(`<div class="tweak-row tweak-reset">
      <button type="button" class="tweak-reset-btn" id="tweak-reset">↻ ${esc(COPY.tweakResetLabel)}</button>
    </div>`);

    tweakHtml = `<div class="tweak-panel" id="tweak-panel">${sections.join('')}</div>`;
    tweakConfigJson = JSON.stringify(tweak)
      .replace(/</g, '\\u003c')
      .replace(/>/g, '\\u003e')
      .replace(/&/g, '\\u0026');
  }
```

- [ ] **Step 3: Insert `tweakHtml` into the detail page HTML**

In the same function, find the section that currently outputs

```js
      ${specsHtml}

      <div class="download-group">
```

and change it to

```js
      ${specsHtml}

      ${tweakHtml}

      <div class="download-group">
```

- [ ] **Step 4: Sanity check**

```bash
node --check skeleton/scripts/build-gallery.js
```

Expected: no output.

- [ ] **Step 5: Commit**

```bash
git add skeleton/scripts/build-gallery.js
git commit -m "gallery: render tweak panel on detail page when design declares tweak_options"
```

---

### Task 6: `build-gallery.js` — wire tweak panel → postMessage

**Files:**
- Modify: `skeleton/scripts/build-gallery.js`

Add an IIFE in the detail page's inline scripts that:
1. Reads the embedded config (`window.__TWEAK_CONFIG__`)
2. On iframe-ready, applies the design's component defaults (any `c.default === false` → send `toggle-component`)
3. Wires click handlers for color, font, frame, component, reset

Insert this **before** the existing zoom-controls IIFE and **after** the photo-switcher IIFE in the body's `<script>` block, so it can hook into the same iframe-ready broadcast.

- [ ] **Step 1: Inject the tweak config into the page**

In `detailHtml`, just before the closing `</head>` (in the returned template literal), find the existing `<script>${DETAIL_CSS ? '' : ''}</script>` location — actually, simpler: replace the line

```js
  <style>${DETAIL_CSS}</style>
</head>
```

with

```js
  <style>${DETAIL_CSS}</style>
  <script>window.__TWEAK_CONFIG__ = ${tweakConfigJson};</script>
</head>
```

- [ ] **Step 2: Add the tweak IIFE**

In the body `<script>` blocks, add a new script after the photo-switcher IIFE and before the zoom IIFE. (Look for the existing `(function () {\n      var thumbs = document.getElementById('photo-switcher-thumbs');` block; the new block goes right after its closing `})();`.)

```html
  <script>
    (function () {
      var cfg = window.__TWEAK_CONFIG__;
      var panel = document.getElementById('tweak-panel');
      var iframe = document.getElementById('design-iframe');
      if (!cfg || !panel || !iframe) return;

      function send(msg) {
        if (!iframe.contentWindow) return;
        try { iframe.contentWindow.postMessage(msg, '*'); } catch (_) {}
      }

      function applyDefaults() {
        if (Array.isArray(cfg.components)) {
          cfg.components.forEach(function (c) {
            if (c && c.id && c.default === false) {
              send({ type: 'toggle-component', id: c.id, visible: false });
            }
          });
        }
      }

      // Apply defaults once the iframe announces ready.
      window.addEventListener('message', function (e) {
        var d = e && e.data;
        if (d && d.type === 'photo-iframe-ready') applyDefaults();
      });

      function setActive(group, btn) {
        panel.querySelectorAll('[data-section="' + group + '"] .' + btn.className.split(' ')[0]).forEach(function (b) {
          b.classList.toggle('active', b === btn);
        });
      }

      panel.addEventListener('click', function (e) {
        var t = e.target.closest('[data-tweak-color],[data-tweak-font-var],[data-tweak-frame],#tweak-reset');
        if (!t) return;

        if (t.id === 'tweak-reset') {
          send({ type: 'reset' });
          // Re-apply this design's defaults (hide components that default to false)
          applyDefaults();
          // Reset active states in panel
          panel.querySelectorAll('.tweak-swatch.active,.tweak-font-btn.active,.tweak-frame-btn.active').forEach(function (b) {
            b.classList.remove('active');
          });
          panel.querySelectorAll('.tweak-checkbox').forEach(function (cb) {
            var id = cb.getAttribute('data-tweak-component');
            var def = (cfg.components || []).find(function (c) { return c.id === id; });
            var on = def ? !!def.default : true;
            cb.classList.toggle('checked', on);
            var input = cb.querySelector('input');
            if (input) input.checked = on;
          });
          return;
        }

        if (t.hasAttribute('data-tweak-color')) {
          var idx = +t.getAttribute('data-tweak-color');
          var cs = (cfg.color_schemes || [])[idx];
          if (!cs) return;
          send({ type: 'set-css-vars', vars: cs.vars || {} });
          setActive('color', t);
          return;
        }

        if (t.hasAttribute('data-tweak-font-var')) {
          var cssVar = t.getAttribute('data-tweak-font-var');
          var value = t.getAttribute('data-tweak-font-value');
          send({ type: 'set-css-vars', vars: (function () { var o = {}; o[cssVar] = value; return o; })() });
          // Mark active within the row (other font-btns for the same var go inactive)
          panel.querySelectorAll('[data-tweak-font-var="' + cssVar + '"]').forEach(function (b) {
            b.classList.toggle('active', b === t);
          });
          return;
        }

        if (t.hasAttribute('data-tweak-frame')) {
          var fi = +t.getAttribute('data-tweak-frame');
          var fr = (cfg.frames || [])[fi];
          if (!fr) return;
          send({ type: 'set-frame', radius: fr.radius || '', aspect: fr.aspect || '' });
          setActive('frame', t);
          return;
        }
      });

      // Component checkboxes — separate handler because they're labels with inner inputs
      panel.addEventListener('change', function (e) {
        var input = e.target;
        if (input.tagName !== 'INPUT') return;
        var label = input.closest('.tweak-checkbox');
        if (!label) return;
        var id = label.getAttribute('data-tweak-component');
        if (!id) return;
        label.classList.toggle('checked', input.checked);
        send({ type: 'toggle-component', id: id, visible: input.checked });
      });
    })();
  </script>
```

- [ ] **Step 3: Sanity check**

```bash
node --check skeleton/scripts/build-gallery.js
```

Expected: no output.

- [ ] **Step 4: Commit**

```bash
git add skeleton/scripts/build-gallery.js
git commit -m "gallery: wire tweak panel controls to postMessage protocol"
```

---

### Task 7: Build a test fixture (morandi template with full tweak surface)

**Files:**
- Create: `__test__/tweak-fixture/data/wedding.json`
- Create: `__test__/tweak-fixture/data/designs.json`
- Create: `__test__/tweak-fixture/templates/morandi-tweak.html`
- Create: `__test__/tweak-fixture/photos/photo-01.jpg`, `photo-02.jpg` (copied from skeleton seed or from examples/photos)

This fixture lives outside `skeleton/` so it doesn't pollute the skill template. It's a one-off test bed for `npm run build && npm run gallery`. We'll delete it before merging or keep it as a fixture and add to `.gitignore`.

- [ ] **Step 1: Set up the fixture skeleton**

```bash
mkdir -p __test__/tweak-fixture
cp -R skeleton/. __test__/tweak-fixture/
cd __test__/tweak-fixture
cp data/wedding.example.json data/wedding.json
# We will write our own designs.json below.
```

- [ ] **Step 2: Get two test photos**

Copy two arbitrary jpgs from `examples/photos/` into the fixture's `photos/`:

```bash
ls examples/photos/ | head -2
cp examples/photos/$(ls examples/photos/ | grep -E '\.(jpg|jpeg|png)$' | sed -n '1p') __test__/tweak-fixture/photos/photo-01.jpg
cp examples/photos/$(ls examples/photos/ | grep -E '\.(jpg|jpeg|png)$' | sed -n '2p') __test__/tweak-fixture/photos/photo-02.jpg
```

If the source files are `.png`, rename to `.jpg` (just the extension — the build.js photo-resolver accepts jpg/jpeg/png regardless of actual content, but for the test we don't need extension/content to match — we just need at least one valid image). If those examples don't exist on disk yet, use any local image you have.

- [ ] **Step 3: Write `__test__/tweak-fixture/templates/morandi-tweak.html`**

Use placeholders + CSS variables. The variables must have sensible defaults in `:root` so a raw load (without any tweak applied) still looks right.

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<title>Morandi · {{names.groom_zh}} & {{names.bride_zh}}</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Inter:300,400,500|Manrope:300,400,500|DM+Sans:400,500&display=swap">
<style>
  :root {
    --card-bg: #e8e4dc;
    --card-text: #2c2c2c;
    --card-accent-1: #7a8a6d;
    --card-accent-2: #a59585;
    --font-headline: 'Inter', sans-serif;
    --font-body: 'Inter', sans-serif;
    --photo-radius: 50%;
    --photo-aspect: 4/5;
  }
  body { margin: 0; }
  .card {
    width: 420px; height: 560px;
    background: var(--card-bg);
    color: var(--card-text);
    position: relative; overflow: hidden;
    font-family: var(--font-body);
    padding: 40px 36px;
    box-sizing: border-box;
  }
  .photo-wrap {
    width: 200px;
    aspect-ratio: var(--photo-aspect);
    margin: 16px auto 24px;
    border-radius: var(--photo-radius);
    overflow: hidden;
  }
  .photo-wrap img {
    width: 100%; height: 100%;
    object-fit: cover; object-position: center 18%;
  }
  .names {
    text-align: center;
    font-family: var(--font-headline);
    font-size: 22px;
    letter-spacing: 4px;
    margin: 0 0 4px;
  }
  .amp { color: var(--card-accent-1); margin: 0 8px; }
  .pinyin {
    text-align: center;
    font-size: 9px;
    letter-spacing: 5px;
    color: var(--card-accent-2);
    margin: 0 0 24px;
  }
  .divider {
    width: 40px; height: 1px;
    background: var(--card-accent-1);
    margin: 0 auto 16px;
  }
  .date {
    text-align: center;
    font-family: var(--font-headline);
    font-size: 28px;
    letter-spacing: 2px;
    color: var(--card-text);
  }
  .lunar-date {
    text-align: center;
    font-size: 11px;
    letter-spacing: 3px;
    color: var(--card-accent-2);
    margin-top: 4px;
  }
  .tagline {
    text-align: center;
    font-family: var(--font-body);
    font-style: italic;
    font-size: 12px;
    color: var(--card-accent-1);
    margin-top: 18px;
  }
  .venue {
    text-align: center;
    font-size: 11px;
    color: var(--card-text);
    margin-top: 18px;
    line-height: 1.6;
  }
  .address-full { font-size: 10px; color: var(--card-accent-2); }
  .hidden { display: none !important; }
</style>
</head>
<body>
  <div class="card">
    <div class="photo-wrap">
      <img id="main-photo" src="{{design.primary_photo_url}}" alt="couple">
    </div>
    <h1 class="names">{{names.groom_zh}}<span class="amp">&amp;</span>{{names.bride_zh}}</h1>
    <p class="pinyin">{{names.groom_en}} &middot; {{names.bride_en}}</p>
    <div class="divider"></div>
    <div class="date">{{date.iso}}</div>
    <div class="lunar-date optional">戊辰年 八月 十五</div>
    <div class="tagline optional">A quiet promise, kept in light.</div>
    <div class="venue">
      <div>{{venue.name_zh}}</div>
      <div class="address-full optional">{{venue.lines_zh.0}}</div>
    </div>
  </div>
</body>
</html>
```

- [ ] **Step 4: Write `__test__/tweak-fixture/data/designs.json`**

```json
[
  {
    "id": "morandi-tweak",
    "name_zh": "莫兰迪 · 可调",
    "name_en": "MORANDI · TWEAKABLE",
    "template": "morandi-tweak.html",
    "primary_photo": "photo-01",
    "width": 420,
    "height": 560,
    "meta": {
      "short": "soft contemporary · tweakable",
      "palette": ["#e8e4dc", "#7a8a6d", "#a59585", "#2c2c2c"],
      "fonts": ["Inter"],
      "motifs": "oval photo · hairline dividers"
    },
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
        { "name": "oval",          "radius": "50%",                "aspect": "4/5" },
        { "name": "rounded-rect",  "radius": "8px",                "aspect": "4/5" },
        { "name": "arch",          "radius": "50% 50% 4px 4px",    "aspect": "4/5" }
      ],
      "components": [
        { "id": "tagline",      "label_en": "Tagline",      "label_zh": "寄语",    "default": true  },
        { "id": "lunar-date",   "label_en": "Lunar date",   "label_zh": "农历",    "default": false },
        { "id": "address-full", "label_en": "Full address", "label_zh": "完整地址", "default": true  }
      ]
    }
  }
]
```

- [ ] **Step 5: Build the fixture**

```bash
cd __test__/tweak-fixture
node scripts/derive.js
node scripts/build.js
node scripts/build-gallery.js
ls dist/
```

Expected: `dist/index.html`, `dist/morandi-tweak.html`, `dist/photos/`. No errors.

- [ ] **Step 6: Commit (fixture not gitignored yet — we'll clean it up before PR)**

```bash
cd ../..
git add __test__/tweak-fixture/templates/morandi-tweak.html __test__/tweak-fixture/data/designs.json
# Skip wedding.json — it's the example seed, no harm but redundant
git status __test__/tweak-fixture/ | head -30
# Stage the artifacts we want to keep in the diff for review; we'll add .gitignore later
git add __test__/tweak-fixture/data/wedding.json __test__/tweak-fixture/photos/
git commit -m "test: morandi-tweak fixture for tweak page e2e testing"
```

---

### Task 8: Manual verification with browser MCP

**Files:**
- None (interaction-only)

Drive the browser to verify each interaction works. Use the in-chrome MCP tools (`tabs_create_mcp`, `navigate`, `find`, `read_page`, `javascript_tool`, `read_console_messages`, `gif_creator`).

- [ ] **Step 1: Open the fixture gallery**

```
mcp__claude-in-chrome__tabs_context_mcp     # check tabs
mcp__claude-in-chrome__tabs_create_mcp      # open file:///Users/xing/wedding-invitation-skill/__test__/tweak-fixture/dist/index.html
mcp__claude-in-chrome__read_console_messages  # confirm no JS errors
```

Expected: detail page opens. Tweak panel visible. Color swatches, font buttons, frame buttons, component checkboxes, reset button all render. Console clean.

- [ ] **Step 2: Click "Cool" color scheme**

```
mcp__claude-in-chrome__find  → click the [data-tweak-color="1"] button
mcp__claude-in-chrome__javascript_tool → confirm document.querySelector('#design-iframe').contentDocument.documentElement.style.getPropertyValue('--card-bg') === '#dde2dd'
```

Expected: card background visually shifts to cool grey-blue. No iframe reload.

- [ ] **Step 3: Click "Manrope" font**

Click the Manrope button under headline. Confirm `--font-headline` is set on iframe documentElement. The names should re-render in Manrope.

- [ ] **Step 4: Toggle "Lunar date" on**

Check the lunar-date checkbox. Confirm `.lunar-date` element loses the `.hidden` class. The "戊辰年 八月 十五" line should appear.

- [ ] **Step 5: Toggle "Tagline" off**

Uncheck the tagline checkbox. Confirm `.tagline` gets `.hidden`. The italic line disappears.

- [ ] **Step 6: Click reset**

Click `↻ Reset`. Confirm:
- Card returns to warm cream background
- Font returns to Inter
- Lunar date is hidden again (its default is false)
- Tagline reappears (its default is true)
- All `.tweak-swatch.active`, `.tweak-font-btn.active` cleared

- [ ] **Step 7: Switch photos**

Click a different photo thumb. Confirm the photo swaps and the tweak panel state survives (don't have to be visually intact; just no crash).

- [ ] **Step 8: Open `dist/morandi-tweak.html` directly (no gallery)**

Tab → `file:///Users/.../__test__/tweak-fixture/dist/morandi-tweak.html`. Confirm:
- Card renders with template defaults (warm bg, Inter, oval frame, tagline visible, lunar hidden, address visible)
- No tweak panel (it's a gallery-layer feature)
- Console clean

- [ ] **Step 9: Render PNGs and confirm they capture initial state**

```bash
cd __test__/tweak-fixture
node scripts/render.js
ls dist/png/social/ dist/png/print/
```

Expected: `morandi-tweak.png` exists in both social and print. Open one and confirm it shows the template's INITIAL state (warm bg, lunar hidden, tagline visible) — proving render is independent of any tweak applied in the gallery.

- [ ] **Step 10: Record a GIF for the PR**

```
mcp__claude-in-chrome__gif_creator → file `tweak-page-demo.gif`, capture: open page, click color, click font, toggle components, click reset.
```

Save the GIF to `docs/superpowers/plans/2026-05-25-tweak-page-demo.gif` for the PR.

- [ ] **Step 11: If any step fails, stop and debug**

Common failure modes:
- "JS error: cannot read property contentWindow of null" → iframe id mismatch
- "color doesn't change" → template missing `:root { --card-bg: ... }` defaults, OR `--card-bg` not used by the CSS rule, OR `setProperty` was called with the wrong key
- "lunar-date doesn't toggle" → element doesn't have `.lunar-date` class, OR has additional class that prevents `display:none` (e.g. `display:flex` rule winning specificity)
- "reset doesn't restore lunar-date to hidden" → defaults aren't being re-applied after reset; check the `applyDefaults()` call in the reset branch

---

## Phase 2 — (Already implemented in Phase 1's panel, only e2e verify)

Frame switcher is already wired in tasks 5/6/8. No separate task — Phase 2 is just "verify it works in the manual test".

---

## Phase 3 — Docs updates

### Task 9: Update `design-principles.md` — template contract

**Files:**
- Modify: `design-principles.md`

Add a new section explaining the CSS-variable contract and class hooks for tweakable templates.

- [ ] **Step 1: Insert a new section at the end of `design-principles.md`**

Append before the `## Forbidden patterns` section (i.e. after `## Mobile-first`):

```markdown
## Tweakable templates (CSS variable contract)

The detail-page tweak panel can change a template's color scheme, fonts, photo frame, and component visibility in real time without rebuilding. For this to work, your template MUST follow this contract.

### 1. Use CSS variables for tweak-able properties

In `:root`, declare defaults for everything the user is allowed to tweak. Templates that hardcode `color: #2c2c2c` directly on `.names` cannot be tweaked — the gallery has no way to override.

```css
:root {
  --card-bg: #e8e4dc;
  --card-text: #2c2c2c;
  --card-accent-1: #7a8a6d;
  --card-accent-2: #a59585;
  --font-headline: 'Inter', sans-serif;
  --font-body: 'Inter', sans-serif;
  --photo-radius: 50%;
  --photo-aspect: 4/5;
}
.card {
  background: var(--card-bg);
  color: var(--card-text);
  font-family: var(--font-body);
}
.names { font-family: var(--font-headline); }
.amp, .divider { background: var(--card-accent-1); color: var(--card-accent-1); }
.photo-wrap {
  border-radius: var(--photo-radius);
  aspect-ratio: var(--photo-aspect);
}
```

The `:root` declarations are the standalone preview's defaults; the gallery's panel overrides them by setting inline style on `documentElement`. A "Reset" click removes the inline styles, falling back to `:root`.

### 2. Mark optional components with a class hook

Each optional component (tagline, lunar date, full address, seal, etc.) needs a stable class that matches the `id` declared in `designs.json` → `tweak_options.components`.

```html
<div class="tagline optional">A quiet promise, kept in light.</div>
<div class="lunar-date optional">戊辰年 八月 十五</div>
<div class="address-full optional">{{venue.lines_zh.0}}</div>
```

Add this rule once at the bottom of your `<style>`:

```css
.hidden { display: none !important; }
```

When the user unchecks a component, the gallery sends `{type:'toggle-component', id:'tagline', visible:false}` and the listener adds `.hidden` to every `.tagline` element.

### 3. The `optional` class is purely documentation

It signals "this element is allowed to be toggled" to a reader of the template. The runtime only cares about the id-matching class (`.tagline`, `.lunar-date`, ...) and the `.hidden` toggle. Feel free to use `.optional` for your own styling if you want.

### 4. After writing the template, populate `tweak_options`

Edit `data/designs.json` and add a `tweak_options` block (see Stage 4 in `workflow.md` for the schema). The agent's job is to choose meaningful variants:

- **Color schemes**: at least 2 (e.g. warm / cool, or palette A / B). Each is a complete vars override — don't ship a "cool" scheme that only swaps the accent and leaves a warm bg.
- **Fonts**: 2–3 options per font variable, all in the aesthetic's family (see Typography above). Don't put a brush script in the "headline" set of a Morandi card.
- **Frames** (optional): the shapes that work for the photo (see Photo handling). If only oval works for your photo, omit the frame switcher.
- **Components**: every element you marked `.optional` should appear in `components`. Pick a sensible default (lunar-date defaults to off for most modern Chinese weddings; tagline defaults to on if you wrote one).

If the design doesn't make sense to tweak (e.g. red-gold's red dominance is the aesthetic — color schemes don't apply), omit `tweak_options` entirely. The panel just won't render.
```

- [ ] **Step 2: Commit**

```bash
git add design-principles.md
git commit -m "docs: template contract for tweakable templates (CSS variables + class hooks)"
```

---

### Task 10: Update `workflow.md` — Stage 4 / Stage 5 instructions

**Files:**
- Modify: `workflow.md`

In Stage 4, after step 4 ("Update `data/designs.json`"), add a sub-step about `tweak_options`. In Stage 5, mention checking the tweak panel.

- [ ] **Step 1: Edit Stage 4 in `workflow.md`**

Find the block

```markdown
4. **Update `data/designs.json`** — one entry per design, with an optional `meta` block used by the gallery page:
```

After that block (after the closing of the JSON example and its closing `   ```), add a new numbered item:

```markdown
5. **Populate `tweak_options` in `data/designs.json`** (recommended for most aesthetics, see `design-principles.md` → "Tweakable templates").

   The tweak panel renders only if a design declares `tweak_options`. Skip it only if the aesthetic resists variation (e.g. `red-gold` — the red is the aesthetic).

   Required fields (omit any section to hide that section in the panel):

   - `color_schemes` — array of `{ name_en, name_zh, vars: { '--card-bg': '#…', '--card-text': '#…', '--card-accent-1': '#…', ... } }`. At least 2 schemes; each must be a complete override (don't leave hue gaps). Stay within the aesthetic's palette — for morandi, all schemes are muted; for art-deco, all are gold-on-dark with different golds.
   - `fonts` — object keyed by font CSS var (`--font-headline`, `--font-body`); each value is an array of 2–3 font-family strings already loaded by the template's `<link>`. Stay within the aesthetic's typography family (Latin serif for art-deco; sans for morandi; brush for red-gold).
   - `frames` — array of `{ name, radius, aspect }` for photo-frame variants. Pick shapes that the photo's framing supports (see "Photo crop is template-specific" in `design-principles.md`).
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
       { "name": "oval", "radius": "50%", "aspect": "4/5" },
       { "name": "rounded-rect", "radius": "8px", "aspect": "4/5" }
     ],
     "components": [
       { "id": "tagline",    "label_en": "Tagline",    "label_zh": "寄语", "default": true  },
       { "id": "lunar-date", "label_en": "Lunar date", "label_zh": "农历", "default": false }
     ]
   }
   ```

   **Template contract reminder** — for the tweak panel to do anything useful, the template MUST use CSS variables for tweak-able properties (`var(--card-bg)`, `var(--font-headline)`, `var(--photo-radius)`, `var(--photo-aspect)`) and class hooks for optional components (`.lunar-date.hidden { display: none !important; }`). See `design-principles.md` → "Tweakable templates" for the full contract.
```

- [ ] **Step 2: Edit Stage 5 in `workflow.md`**

In the table of feedback patterns, add two new rows:

```markdown
| "I want to try a different color" | Open the gallery (`npm run gallery`), use the tweak panel's color-scheme swatches — no rebuild needed |
| "Hide the lunar date" | Tweak panel → uncheck "Lunar date" (or set `default: false` in `designs.json` if it should be off by default) |
```

(Insert them near the relevant rows — between "Color too dark" and "Head is cropped" works.)

- [ ] **Step 3: Commit**

```bash
git add workflow.md
git commit -m "docs: instruct agents to populate tweak_options in Stage 4"
```

---

### Task 11: Verify the skill's own SKILL.md still describes reality

**Files:**
- Read: `SKILL.md`
- Possibly modify: `SKILL.md`

The SKILL.md mentions designs.json and the gallery; check if anything we changed contradicts it. The expected outcome is usually no change needed — SKILL.md is high-level.

- [ ] **Step 1: Re-read SKILL.md and decide**

```bash
cat SKILL.md
```

If a sentence is now wrong, fix it. Otherwise skip.

- [ ] **Step 2 (conditional): Commit any tweaks**

```bash
git add SKILL.md
git commit -m "docs: align SKILL.md with tweak page additions"
```

---

## Phase 5 — Custom design from scratch

The user opens the skill, talks to the agent, and at Stage 3 (style picker) they see ALL aesthetic directions, can shuffle between them ("换一批"), and there's ALWAYS a "Custom / 自定义" card pinned visible. Picking Custom takes them through Stage 4 with a neutral blank-canvas template — the tweak page then becomes their design surface. When they like what they have, they hit "Save as new design" and it persists for future use.

### Task 12: Stage 3 picker — always-pinned Custom card + "换一批" via chat

**Files:**
- Modify: `workflow.md` Stage 3 section (the picker template + flow)

Today the agent picks N aesthetic cards (N = 3–4 in single, `multi_count` in multi) and renders `_style-preview.html`. We're keeping that — NOT pre-rendering all 14. Two additions:

1. **Custom card always pinned at the end** of the rendered cards. A neutral "blank canvas" card labelled `Custom / 自定义` representing "design from scratch".
2. **"换一批" is a conversational command**, NOT a button. If the user doesn't like the N shown, they reply "换一批" in chat (or "show me other options" / "再来一批"). The agent then re-curates: pick a different N from the aesthetic vocabulary, regenerate `_style-preview.html`, tell the user to refresh. Repeat as needed.

The picker file stays small. No JS shuffle, no all-14 mega-render.

- [ ] **Step 1: Update workflow.md Stage 3 step 3 — add Custom card to the template**

In the existing picker HTML template, after the example aesthetic cards (`<!-- ...one card per candidate -->`), add a new "Custom card" example. The card has the same 6-layer structure as the others, but:

- **Sketch**: an empty 3:4 frame with a soft dashed outline + a small `+` glyph in the center, signalling "blank canvas".
- **Name**: `Custom / 自定义` (localized to primary).
- **Spirit line**: "从零开始 · 自己挑配色、字体、组件" (or English: "design from scratch · pick your own colors, fonts, components").
- **Swatches**: 4 muted neutrals so it doesn't pick a side.
- **Type sample**: system font (`-apple-system, sans-serif`).
- **Motif line**: "fully tweakable" / "完全自定义".

Reference card snippet to add to the template:

```html
       <!-- Pinned Custom card — always last, agent does not skip it -->
       <div class="card custom-card">
         <svg class="sketch" viewBox="0 0 240 320" xmlns="http://www.w3.org/2000/svg">
           <rect width="240" height="320" fill="#1a1a1a"/>
           <rect x="40" y="50" width="160" height="220" fill="none" stroke="#d4b896" stroke-width="0.7" stroke-dasharray="4 4" opacity="0.6"/>
           <g transform="translate(120 160)" stroke="#d4b896" stroke-width="1" opacity="0.7">
             <line x1="-10" y1="0" x2="10" y2="0"/>
             <line x1="0" y1="-10" x2="0" y2="10"/>
           </g>
         </svg>
         <div class="name">custom · 自定义</div>
         <div class="spirit">从零开始 · 自己挑配色、字体、组件</div>
         <div class="swatches"><span style="background:#e8e4dc"></span><span style="background:#dde2dd"></span><span style="background:#a59585"></span><span style="background:#1a1a1a"></span></div>
         <div class="type-sample" style="font-family:system-ui,sans-serif">Aa · 字 · ✨</div>
         <div class="motifs">fully tweakable · 完全自定义</div>
       </div>
```

The agent localizes the strings to the user's primary language. The Custom card is **mandatory** — it appears in every Stage 3 picker render, after the curated aesthetic cards.

- [ ] **Step 2: Update Stage 3 step 4 — instructions to the user**

Change the existing prose

> "I've prepared some aesthetic directions for you to compare. Open this file in your browser: `file://<absolute-path>/_style-preview.html`"

to (translated to user's primary language at runtime):

> "我准备了 N 个风格方向给你看。在浏览器里打开：`file://…/_style-preview.html`
>
> 看看哪个最对味，告诉我名字（比如 `morandi`）就行。如果都不喜欢，回复 **"换一批"** 我就重新选 N 个。也可以选最后那张 **Custom / 自定义** —— 我们直接进设计台，所有颜色字体组件你自己挑。"

(English equivalent for `en` users.)

- [ ] **Step 3: Update Stage 3 step 5 — handle the three response branches**

Replace step 5 with:

> After the user replies, branch on what they said:
>
> - **User named an aesthetic** (e.g. "morandi", "art-deco") → proceed to Stage 4 to design that one (single mode) or all N (multi mode, where the user confirms or trims `multi_count` aesthetics).
> - **User said "换一批" / "再来一批" / "再换" / "看看别的"** — pick a DIFFERENT set of N aesthetics from the vocabulary, regenerate `_style-preview.html`, tell the user to refresh the browser. Repeat as many times as needed; track which aesthetics you've already shown so you don't repeat (unless you've cycled through all 14).
> - **User picked Custom** → do NOT design from scratch in Stage 4 by writing a fresh aesthetic. Instead, copy `references/blank-canvas.html` (shipped with the skill) into `templates/<id>.html`, replacing placeholder fields (e.g. `groom_zh` → `groom_es` if user is Spanish-only). Configure `data/designs.json` with the contents of `references/blank-canvas-designs.json` (adjusted: id, primary_photo, name). Skip straight to Stage 6 — the tweak page is the user's design surface. Skip the iterative-feedback loop of Stage 5; they iterate via the panel.

- [ ] **Step 4: Update the AskUserQuestion fallback in Stage 3 step 5**

If `AskUserQuestion` is the chosen interaction (Tier 2), add `Custom / 自定义` to the options list alongside the N aesthetic names. The user can pick Custom from the modal directly.

- [ ] **Step 5: Commit**

```bash
git add workflow.md
git commit -m "workflow: Stage 3 picker — always-pinned Custom card + conversational 换一批"
```

---

### Task 13: Blank-canvas reference template

**Files:**
- Create: `references/blank-canvas.html`
- Create: `references/blank-canvas-designs.json` (snippet showing how the designs.json entry should look)
- Modify: `SKILL.md` to mention `references/`

The blank canvas is the starting template for Custom mode. Maximally neutral, every tweak surface available, sensible defaults that look OK out of the box even before any tweak.

- [ ] **Step 1: Create `references/` directory and `blank-canvas.html`**

```bash
mkdir -p references
```

Write `references/blank-canvas.html` with:
- 420×560 canvas, `overflow:hidden`
- All tweak CSS vars in `:root` with neutral defaults (cream bg, dark text, soft accent, Inter font, oval photo frame)
- Class hooks for all common optional components (`.tagline`, `.lunar-date`, `.address-full`, `.seal`, `.divider`, `.pinyin`)
- Uses `{{placeholders}}` for couple data (matching the field names of whatever languages are in wedding.json — the agent has to swap these for the right keys for the user's language)
- Single `<img id="main-photo">` (per the contract)
- `.hidden { display: none !important; }` rule

A reasonable structure (omit pinyin if languages doesn't include en):

```html
<!DOCTYPE html>
<html lang="{{site.lang}}">
<head>
<meta charset="utf-8">
<title>{{names.bride_zh}} &amp; {{names.groom_zh}}</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Inter:300,400,500|Manrope:300,400,500|DM+Sans:400,500|Cormorant+Garamond:ital,wght@0,400;1,400|Playfair+Display:400&display=swap">
<style>
  :root {
    --card-bg: #f5f1e8;
    --card-text: #2c2c2c;
    --card-accent-1: #8a9882;
    --card-accent-2: #a59585;
    --font-headline: 'Cormorant Garamond', serif;
    --font-body: 'Inter', sans-serif;
    --photo-radius: 50%;
    --photo-aspect: 4/5;
  }
  body { margin: 0; }
  .card {
    width: 420px; height: 560px;
    background: var(--card-bg);
    color: var(--card-text);
    position: relative; overflow: hidden;
    font-family: var(--font-body);
    padding: 44px 36px 36px;
    box-sizing: border-box;
    text-align: center;
  }
  .photo-wrap {
    width: 200px;
    aspect-ratio: var(--photo-aspect);
    margin: 0 auto 28px;
    border-radius: var(--photo-radius);
    overflow: hidden;
  }
  .photo-wrap img { width:100%; height:100%; object-fit:cover; object-position:center 18%; }
  .names {
    font-family: var(--font-headline);
    font-size: 28px;
    letter-spacing: 3px;
    margin: 0 0 4px;
  }
  .amp { color: var(--card-accent-1); margin: 0 8px; }
  .pinyin {
    font-size: 9px; letter-spacing: 5px;
    color: var(--card-accent-2);
    margin: 0 0 22px;
  }
  .divider {
    width: 36px; height: 1px;
    background: var(--card-accent-1);
    margin: 0 auto 18px;
  }
  .date {
    font-family: var(--font-headline);
    font-size: 26px; letter-spacing: 2px;
  }
  .lunar-date {
    font-size: 11px; letter-spacing: 3px;
    color: var(--card-accent-2);
    margin-top: 4px;
  }
  .tagline {
    font-style: italic;
    font-size: 12px;
    color: var(--card-accent-1);
    margin-top: 18px;
  }
  .venue {
    font-size: 11px;
    margin-top: 18px;
    line-height: 1.6;
  }
  .address-full { font-size: 10px; color: var(--card-accent-2); }
  .seal {
    position: absolute;
    bottom: 24px; right: 24px;
    width: 36px; height: 36px;
    border: 1px solid var(--card-accent-1);
    border-radius: 4px;
    display: flex; align-items: center; justify-content: center;
    font-family: var(--font-headline);
    font-size: 14px;
    color: var(--card-accent-1);
  }
  .hidden { display: none !important; }
</style>
</head>
<body>
  <div class="card">
    <div class="photo-wrap"><img id="main-photo" src="{{design.primary_photo_url}}" alt="couple"></div>
    <h1 class="names">{{names.groom_zh}}<span class="amp">&amp;</span>{{names.bride_zh}}</h1>
    <p class="pinyin optional">{{names.groom_en}} &middot; {{names.bride_en}}</p>
    <div class="divider optional"></div>
    <div class="date">{{date.iso}}</div>
    <div class="lunar-date optional"></div>
    <div class="tagline optional"></div>
    <div class="venue">
      <div>{{venue.name_zh}}</div>
      <div class="address-full optional">{{venue.lines_zh.0}}</div>
    </div>
    <div class="seal optional">{{names.groom_zh.0}}</div>
  </div>
</body>
</html>
```

The agent will adapt placeholder names (`groom_zh` → `groom_en` etc.) to the user's language and remove blocks the user doesn't want before saving as templates/<id>.html.

- [ ] **Step 2: Create `references/blank-canvas-designs.json`**

A small JSON snippet showing the maximal `tweak_options` block the agent should use:

```json
{
  "id": "custom-canvas",
  "name_zh": "自定义设计",
  "name_en": "CUSTOM",
  "template": "custom-canvas.html",
  "primary_photo": "photo-01",
  "width": 420,
  "height": 560,
  "custom": true,
  "meta": {
    "short": "designed from scratch",
    "palette": ["#f5f1e8", "#8a9882", "#a59585", "#2c2c2c"],
    "fonts": ["Cormorant Garamond", "Inter"],
    "motifs": "fully tweakable"
  },
  "tweak_options": {
    "color_schemes": [
      { "name_en": "Warm cream", "name_zh": "暖米", "vars": { "--card-bg": "#f5f1e8", "--card-text": "#2c2c2c", "--card-accent-1": "#8a9882", "--card-accent-2": "#a59585" } },
      { "name_en": "Cool stone", "name_zh": "冷石",   "vars": { "--card-bg": "#dde2dd", "--card-text": "#2a3236", "--card-accent-1": "#7a8a96", "--card-accent-2": "#95a0a5" } },
      { "name_en": "Black-gold", "name_zh": "黑金",   "vars": { "--card-bg": "#1a1a1a", "--card-text": "#e0d8c8", "--card-accent-1": "#d4af37", "--card-accent-2": "#b8956a" } },
      { "name_en": "Ink wash",   "name_zh": "水墨",   "vars": { "--card-bg": "#fafafa", "--card-text": "#1a1a1a", "--card-accent-1": "#1a1a1a", "--card-accent-2": "#888888" } }
    ],
    "fonts": {
      "--font-headline": ["Cormorant Garamond", "Playfair Display", "Inter", "Manrope", "DM Sans"],
      "--font-body":     ["Inter", "Manrope", "DM Sans", "Cormorant Garamond"]
    },
    "frames": [
      { "name": "oval",         "radius": "50%",             "aspect": "4/5" },
      { "name": "rounded-rect", "radius": "8px",             "aspect": "4/5" },
      { "name": "arch",         "radius": "50% 50% 4px 4px", "aspect": "4/5" },
      { "name": "circle",       "radius": "50%",             "aspect": "1/1" },
      { "name": "rectangle",    "radius": "2px",             "aspect": "4/5" }
    ],
    "components": [
      { "id": "tagline",      "label_en": "Tagline",      "label_zh": "寄语",    "default": false },
      { "id": "lunar-date",   "label_en": "Lunar date",   "label_zh": "农历",    "default": false },
      { "id": "address-full", "label_en": "Full address", "label_zh": "完整地址", "default": true  },
      { "id": "pinyin",       "label_en": "Romanization", "label_zh": "拼音",    "default": true  },
      { "id": "divider",      "label_en": "Divider",      "label_zh": "分隔线",   "default": true  },
      { "id": "seal",         "label_en": "Seal",         "label_zh": "印章",    "default": false }
    ]
  }
}
```

- [ ] **Step 3: Update SKILL.md to mention references/**

Add to the "Files in this skill" tree at the end of SKILL.md:

```
references/                ← agent-copyable starting points (NOT runtime-read like examples/)
  blank-canvas.html          ← neutral template used when user picks Custom in Stage 3
  blank-canvas-designs.json  ← maximal tweak_options for the Custom design entry
```

And in the "Core principle" section, after the paragraph about `examples/` being off-limits:

> The `references/` directory IS readable at runtime — it ships agent-copyable starting points (blank-canvas template + maximal tweak_options snippet for the Custom flow). Unlike `examples/`, these are not finished designs to copy — they're skeletons to fill in with the user's data.

- [ ] **Step 4: Commit**

```bash
git add references/ SKILL.md
git commit -m "feat: blank-canvas reference template for Custom flow"
```

---

### Task 14: Free-form controls in tweak panel (color picker, font input, frame inputs)

**Files:**
- Modify: `skeleton/scripts/build-gallery.js`

In addition to the preset variants (color schemes, fonts, frames), the panel needs free-form controls so users can pick ANY color, ANY font name, ANY frame radius/aspect. These are visible whenever `tweak_options` exists; they live under the preset section in each group.

The controls are:
- **Custom colors**: one `<input type="color">` for each CSS var that appears as a key in any color scheme (i.e., the set of `Object.keys(cs.vars)` across all schemes). Initial value = the value from the active or first color scheme.
- **Custom font**: a `<input type="text" list="font-options">` per font CSS var, with a `<datalist>` of common font families (Inter, Manrope, Cormorant Garamond, Playfair Display, Songti SC, Noto Serif SC, etc.). On `input` event, send `set-css-vars` with that var.
- **Custom frame**: `radius` and `aspect` text inputs. On `change`, send `set-frame`.

- [ ] **Step 1: Add CSS for the free-form controls**

Append to the `DETAIL_CSS` block:

```css
  .tweak-custom {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 10px 12px;
    background: rgba(20, 17, 13, 0.5);
    border: 1px dashed var(--border);
    border-radius: 4px;
    margin-top: 4px;
  }
  .tweak-custom-label {
    font-size: 9px;
    letter-spacing: 2.5px;
    text-transform: uppercase;
    color: var(--text-muted);
  }
  .tweak-color-row,
  .tweak-font-row,
  .tweak-frame-row {
    display: flex; flex-wrap: wrap; gap: 8px; align-items: center;
  }
  .tweak-color-row label,
  .tweak-font-row label,
  .tweak-frame-row label {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 11px;
    color: var(--text-dim);
  }
  .tweak-color-row input[type=color] {
    width: 32px; height: 24px; border: 0; padding: 0;
    background: transparent; cursor: pointer;
  }
  .tweak-font-row input[type=text],
  .tweak-frame-row input[type=text] {
    background: var(--bg-elevated);
    color: var(--text);
    border: 1px solid var(--border);
    border-radius: 3px;
    padding: 4px 8px;
    font-size: 11px;
    font-family: 'Inter', sans-serif;
    min-width: 120px;
  }
  .tweak-frame-row input[type=text] { min-width: 80px; }
```

- [ ] **Step 2: Add rendering for free-form controls inside `detailHtml` for each tweak group**

Inside the existing `if (tweak)` block, after each preset section is built, append a `.tweak-custom` block:

In the Colors section, after the `${swatches}` row, add:

```js
      // Build a unique set of color CSS vars from all schemes
      var colorVarSet = new Set();
      tweak.color_schemes.forEach(function (cs) {
        Object.keys(cs.vars || {}).forEach(function (k) { colorVarSet.add(k); });
      });
      var initialVars = (tweak.color_schemes[0] || {}).vars || {};
      var colorInputs = Array.from(colorVarSet).map(function (k) {
        var label = k.replace(/^--card-/, '').replace(/-/g, ' ');
        var value = initialVars[k] || '#888888';
        // Only emit if hex (color picker requires hex)
        if (!/^#[0-9a-fA-F]{6}$/.test(value)) return '';
        return '<label><input type="color" data-tweak-custom-color="' + esc(k) + '" value="' + esc(value) + '"><span>' + esc(label) + '</span></label>';
      }).join('');
```

(in JS string form for the renderer). Then append to the colors section HTML:

```html
        <div class="tweak-custom">
          <div class="tweak-custom-label">${esc(COPY.tweakCustomLabel)}</div>
          <div class="tweak-color-row">${colorInputs}</div>
        </div>
```

Do the same for fonts: under the font preset buttons, add free-form `<input type="text" list="...">` for each font var, with a shared `<datalist>` of suggestions. The datalist:

```html
<datalist id="tweak-font-suggestions">
  <option value="Inter">
  <option value="Manrope">
  <option value="DM Sans">
  <option value="Cormorant Garamond">
  <option value="Playfair Display">
  <option value="Bodoni Moda">
  <option value="EB Garamond">
  <option value="Songti SC">
  <option value="Noto Serif SC">
  <option value="Noto Sans SC">
  <option value="PingFang SC">
  <option value="Ma Shan Zheng">
  <option value="ZCOOL XiaoWei">
  <option value="Noto Serif JP">
  <option value="Sawarabi Mincho">
  <option value="Nanum Myeongjo">
  <option value="Amiri">
  <option value="Allura">
</datalist>
```

For frames: free-form `<input type="text">` for radius and aspect, with placeholders showing the format. On `change`, send `set-frame`.

- [ ] **Step 3: Add COPY entries**

In the `en` branch of COPY:
```js
    tweakCustomLabel: 'Custom',
    tweakFontTextHint: 'Type a font name (or pick)…',
    tweakFrameRadiusLabel: 'Radius',
    tweakFrameAspectLabel: 'Aspect',
    tweakSaveLabel: 'Save as new design',
    tweakSavePromptLabel: 'Name this design',
    tweakSaveExportLabel: 'Export JSON',
    tweakSaveInfoLabel: 'Saved locally · refresh keeps your changes',
```

In `zh`:
```js
    tweakCustomLabel: '自定义',
    tweakFontTextHint: '输入字体名（或从列表选）…',
    tweakFrameRadiusLabel: '圆角',
    tweakFrameAspectLabel: '比例',
    tweakSaveLabel: '保存为新设计',
    tweakSavePromptLabel: '给这个设计起个名字',
    tweakSaveExportLabel: '导出 JSON',
    tweakSaveInfoLabel: '已保存到本地 · 刷新后仍在',
    tweakContributeLabel: '设计得不错？欢迎给项目提 PR，加进 skill 让更多人用 →',
    tweakContributeHref: 'https://github.com/wyx-sg/skill-wedding-invitation-skill/issues/new?labels=design-contribution&title=New+design+contribution',
```

And the equivalent English:
```js
    tweakContributeLabel: 'Love this design? Open a PR to add it to the skill — share with others →',
    tweakContributeHref: 'https://github.com/wyx-sg/skill-wedding-invitation-skill/issues/new?labels=design-contribution&title=New+design+contribution',
```

After a successful Save (Task 15 Step 3 / 4), append a small "contribute back" CTA line under `.tweak-save-info`:

```html
<a class="tweak-contribute" href="${esc(COPY.tweakContributeHref)}" target="_blank" rel="noopener">
  ${esc(COPY.tweakContributeLabel)}
</a>
```

CSS (added in Task 14's CSS pass):
```css
  .tweak-contribute {
    font-size: 10.5px;
    color: var(--text-muted);
    text-decoration: none;
    text-align: center;
    border-top: 1px dashed var(--border-soft);
    padding-top: 8px;
    margin-top: 4px;
    transition: color 0.18s;
  }
  .tweak-contribute:hover { color: var(--accent-warm); }
```

Also update README.md and README.zh-CN.md with a "Contributing your design" section pointing at the Custom flow + the PR-back path. Include the GitHub URL.

- [ ] **Step 4: Wire free-form controls to postMessage in the IIFE**

In the Task-6 tweak IIFE, add `input` event listeners (delegated on the panel):

```js
      panel.addEventListener('input', function (e) {
        var t = e.target;
        if (t.matches('[data-tweak-custom-color]')) {
          var k = t.getAttribute('data-tweak-custom-color');
          send({ type: 'set-css-vars', vars: (function () { var o = {}; o[k] = t.value; return o; })() });
        } else if (t.matches('[data-tweak-custom-font]')) {
          var fv = t.getAttribute('data-tweak-custom-font');
          send({ type: 'set-css-vars', vars: (function () { var o = {}; o[fv] = t.value; return o; })() });
        } else if (t.matches('[data-tweak-custom-frame-radius]')) {
          send({ type: 'set-frame', radius: t.value });
        } else if (t.matches('[data-tweak-custom-frame-aspect]')) {
          send({ type: 'set-frame', aspect: t.value });
        }
      });
```

- [ ] **Step 5: Sanity check and commit**

```bash
node --check skeleton/scripts/build-gallery.js
git add skeleton/scripts/build-gallery.js
git commit -m "gallery: free-form color picker / font input / frame inputs in tweak panel"
```

---

### Task 15: "Save as new design" — persist via localStorage + export JSON

**Files:**
- Modify: `skeleton/scripts/build-gallery.js`
- Modify: `skeleton/scripts/build.js` (read localStorage state on iframe load — optional but improves UX)

Two-level persistence:
1. **localStorage** — auto-saves the current tweak state per `design.id`. Survives reload. Lives in `localStorage[`wis-tweak-${id}`]`.
2. **Export JSON** — downloads a JSON snippet the user can paste into `data/designs.json` as a new entry, then rerun `npm run build && npm run gallery`.

The save button copies the current state into a new design entry with `id = <slug-of-user-supplied-name>`.

- [ ] **Step 1: Add Save / Export buttons to the panel HTML**

In `detailHtml`, inside the `tweak-panel` sections (after the reset row), add:

```js
    sections.push(`<div class="tweak-row tweak-save-row">
      <button type="button" class="tweak-save-btn" id="tweak-save">★ ${esc(COPY.tweakSaveLabel)}</button>
      <button type="button" class="tweak-export-btn" id="tweak-export">${esc(COPY.tweakSaveExportLabel)}</button>
    </div>
    <div class="tweak-save-info">${esc(COPY.tweakSaveInfoLabel)}</div>`);
```

- [ ] **Step 2: Add CSS for the save row**

```css
  .tweak-save-row {
    margin-top: 8px;
    display: flex;
    gap: 8px;
  }
  .tweak-save-btn,
  .tweak-export-btn {
    flex: 1;
    padding: 8px 12px;
    border-radius: 4px;
    border: 1px solid var(--accent);
    background: linear-gradient(135deg, rgba(212,184,150,0.18), rgba(184,149,106,0.06));
    color: var(--accent);
    font-family: 'Cormorant Garamond', serif;
    font-style: italic;
    font-size: 14px;
    cursor: pointer;
    transition: background 0.2s, transform 0.12s;
  }
  .tweak-export-btn {
    background: transparent;
    color: var(--text-dim);
    border-color: var(--border);
  }
  .tweak-save-btn:hover { transform: translateY(-1px); }
  .tweak-export-btn:hover { color: var(--accent); border-color: var(--accent-warm); }
  .tweak-save-info {
    font-size: 10px;
    color: var(--text-muted);
    text-align: center;
    letter-spacing: 0.5px;
  }
```

- [ ] **Step 3: Wire Save + Export in the tweak IIFE**

Inside the tweak panel IIFE, after the click handler, add:

```js
      var DESIGN_ID = ${JSON.stringify(design.id)};
      var STORAGE_KEY = 'wis-tweak-' + DESIGN_ID;

      function collectState() {
        var state = { vars: {}, components: {}, frame: null };
        // Active color scheme — copy vars
        var activeColor = panel.querySelector('.tweak-swatch.active');
        if (activeColor) {
          var idx = +activeColor.getAttribute('data-tweak-color');
          var cs = (cfg.color_schemes || [])[idx];
          if (cs && cs.vars) Object.assign(state.vars, cs.vars);
        }
        // Custom color overrides
        panel.querySelectorAll('[data-tweak-custom-color]').forEach(function (i) {
          state.vars[i.getAttribute('data-tweak-custom-color')] = i.value;
        });
        // Active font preset
        panel.querySelectorAll('.tweak-font-btn.active').forEach(function (b) {
          state.vars[b.getAttribute('data-tweak-font-var')] = b.getAttribute('data-tweak-font-value');
        });
        // Custom font overrides
        panel.querySelectorAll('[data-tweak-custom-font]').forEach(function (i) {
          if (i.value) state.vars[i.getAttribute('data-tweak-custom-font')] = i.value;
        });
        // Active frame preset
        var activeFrame = panel.querySelector('.tweak-frame-btn.active');
        if (activeFrame) {
          var fi = +activeFrame.getAttribute('data-tweak-frame');
          state.frame = (cfg.frames || [])[fi] || null;
        }
        // Custom frame
        var customR = panel.querySelector('[data-tweak-custom-frame-radius]');
        var customA = panel.querySelector('[data-tweak-custom-frame-aspect]');
        if (customR && customR.value) state.frame = Object.assign({}, state.frame || {}, { radius: customR.value });
        if (customA && customA.value) state.frame = Object.assign({}, state.frame || {}, { aspect: customA.value });
        // Components
        panel.querySelectorAll('.tweak-checkbox').forEach(function (cb) {
          var id = cb.getAttribute('data-tweak-component');
          var input = cb.querySelector('input');
          state.components[id] = input ? input.checked : true;
        });
        return state;
      }

      function applyState(state) {
        if (!state) return;
        if (state.vars && Object.keys(state.vars).length) {
          send({ type: 'set-css-vars', vars: state.vars });
        }
        if (state.frame) {
          send({ type: 'set-frame', radius: state.frame.radius || '', aspect: state.frame.aspect || '' });
        }
        if (state.components) {
          Object.keys(state.components).forEach(function (id) {
            send({ type: 'toggle-component', id: id, visible: !!state.components[id] });
          });
        }
      }

      // Auto-save state to localStorage on any change
      function autoSave() {
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(collectState())); } catch (_) {}
      }
      ['click', 'change', 'input'].forEach(function (ev) {
        panel.addEventListener(ev, function () { setTimeout(autoSave, 50); });
      });

      // Restore state on iframe ready
      window.addEventListener('message', function (e) {
        var d = e && e.data;
        if (d && d.type === 'photo-iframe-ready') {
          try {
            var raw = localStorage.getItem(STORAGE_KEY);
            if (raw) applyState(JSON.parse(raw));
          } catch (_) {}
        }
      });

      // Save button — name it, mark as saved (we'll also export the JSON)
      document.getElementById('tweak-save').addEventListener('click', function () {
        var name = prompt(${JSON.stringify('${COPY.tweakSavePromptLabel}'.replace(/\$\{[^}]+\}/g, ''))});
        if (!name) return;
        autoSave();
        // Also write under a named key so the user can have multiple custom saves
        var slug = String(name).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
        if (!slug) return;
        try {
          localStorage.setItem('wis-saved-' + slug, JSON.stringify({ name: name, fromDesign: DESIGN_ID, state: collectState(), savedAt: new Date().toISOString() }));
        } catch (_) {}
        alert(${JSON.stringify('Saved locally as: ')} + name);
      });

      // Export — download a JSON snippet ready to paste into designs.json
      document.getElementById('tweak-export').addEventListener('click', function () {
        var name = prompt(${JSON.stringify('${COPY.tweakSavePromptLabel}'.replace(/\$\{[^}]+\}/g, ''))});
        if (!name) return;
        var slug = String(name).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
        if (!slug) return;
        var state = collectState();
        // Build a new design entry: same template, applied vars become a new color_scheme + applied components become new defaults
        var entry = {
          id: slug,
          name_en: name,
          name_zh: name,
          template: ${JSON.stringify(design.template || (design.id + '.html'))},
          primary_photo: ${JSON.stringify(design.primary_photo)},
          width: ${tplW},
          height: ${tplH},
          meta: { short: 'Saved from ' + DESIGN_ID + ' on ' + new Date().toLocaleDateString() },
          tweak_options: {
            color_schemes: state.vars && Object.keys(state.vars).length
              ? [{ name_en: 'Saved', name_zh: '已保存', vars: state.vars }]
              : [],
            components: Object.keys(state.components || {}).map(function (id) {
              return { id: id, label_en: id, label_zh: id, default: !!state.components[id] };
            })
          }
        };
        if (state.frame) entry.tweak_options.frames = [Object.assign({ name: 'Saved' }, state.frame)];
        var json = JSON.stringify(entry, null, 2);
        var blob = new Blob([json], { type: 'application/json' });
        var a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = slug + '.design.json';
        a.click();
        setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
        alert('Downloaded: ' + slug + '.design.json — append its contents to data/designs.json as a new array entry, then rerun npm run build && npm run gallery.');
      });
```

(Note the `${design.template ...}` and `${tplW}` interpolations work because this string is built inside `detailHtml` template literal.)

- [ ] **Step 4: Sanity check and commit**

```bash
node --check skeleton/scripts/build-gallery.js
git add skeleton/scripts/build-gallery.js
git commit -m "gallery: Save/Export buttons — localStorage persist + JSON download for custom designs"
```

---

## Phase 6 — Consolidate docs/ and examples/

The repo currently has two parallel sets of 20 styleNN.html files: `examples/` and `docs/`. Their content differs (different md5 hashes) but the visual designs are the same — the difference is probably path prefixes for GH Pages vs in-repo references. We'll merge them into a single source of truth and update SKILL.md accordingly.

### Task 16: Investigate docs/ vs examples/ overlap, decide direction

**Files:**
- Read: `docs/*.html`, `examples/*.html`, `docs/index.html`, README files

- [ ] **Step 1: Compare a couple of file diffs**

```bash
diff docs/style01-new-chinese.html examples/style01-new-chinese.html | head -40
diff docs/style03-morandi.html examples/style03-morandi.html | head -40
```

Note what differs (paths? a `<base>` tag? landing page navigation links?).

- [ ] **Step 2: Check who references each**

```bash
grep -r "examples/style" --include="*.md" -l
grep -r "docs/style" --include="*.md" -l
grep -r "examples/" --include="*.md"
grep -r "docs/" --include="*.md"
```

Confirm:
- `README.md` and `README.zh-CN.md` link to GH Pages docs site (`wyx-sg.github.io/...`)
- `SKILL.md` references `examples/` as the off-limits showcase

- [ ] **Step 3: Decide direction**

Two viable directions:
1. **Make `examples/` the source of truth**; regenerate `docs/` from a build script (`scripts/build-docs.js`). Keep `docs/` checked in (GH Pages needs the static files), but generate it from examples + a landing template.
2. **Make `docs/` the source of truth**; delete `examples/`; SKILL.md's "DO NOT READ examples/" rule moves to "DO NOT READ docs/style*.html"; READMEs still link to GH Pages.

Direction 1 is cleaner long-term (clear authoring location), but adds a build script and complicates rendering thumbnails (the existing `examples/thumbnails/*.png` are referenced by README). Direction 2 has fewer moving parts but mixes two concerns in one folder.

**Recommendation: Direction 2 (delete `examples/`).** Reasons:
- `docs/` already contains everything `examples/` does, PLUS the index landing pages
- README hero links to GH Pages → `docs/` is the public-facing artifact, more visible
- Adding a build script (Direction 1) for a one-time concern is overkill
- Skill rule "DO NOT READ examples/" easily becomes "DO NOT READ docs/style*.html at runtime" with same intent

If the user disagrees, switch to Direction 1.

- [ ] **Step 4: Document decision in this task**

After deciding, write one paragraph in the PR description summarizing the choice. (Not a commit step — just notes for the agent.)

---

### Task 17: Migrate to Direction 2 (delete examples/, point references to docs/)

**Files:**
- Delete: `examples/` (entire directory)
- Modify: `SKILL.md` — rephrase the "DO NOT READ examples/" rule
- Modify: `design-principles.md` — rephrase "Don't read examples/" (it has at least one mention in "Forbidden patterns")
- Modify: `workflow.md` — same as above
- Modify: any other doc that references `examples/`

- [ ] **Step 1: Find every textual reference to `examples/`**

```bash
grep -rn "examples/" --include="*.md" .
```

- [ ] **Step 2: Replace `examples/` references**

For each match, replace `examples/` with the appropriate alternative:
- "examples/photos/" → "docs/photos/"
- "examples/thumbnails/" → "docs/thumbnails/"
- "examples/*.html" / "examples/style*.html" → "docs/style*.html"
- "DO NOT READ examples/" → "DO NOT READ docs/style*.html at runtime"

Make the agent's runtime contract crystal clear: the skill must not read `docs/style*.html` or `docs/index*.html` at runtime — those are GH Pages showcase artifacts.

- [ ] **Step 3: Remove `examples/` from disk**

```bash
git rm -r examples/
```

- [ ] **Step 4: Verify nothing else broke**

```bash
grep -rn "examples/" --include="*.md" .
grep -rn "examples/" --include="*.html" .
grep -rn "examples/" --include="*.js" .
```

Expected: no remaining references (or only references inside `docs/` that are self-references — those are fine since `docs/` is the deployed site).

- [ ] **Step 5: Commit**

```bash
git add SKILL.md design-principles.md workflow.md
git commit -m "docs: consolidate examples/ into docs/ — single source of truth for showcase artifacts"
git commit -m "chore: delete examples/ (merged into docs/)" --allow-empty
# (the git rm was staged earlier; combine into one commit if you prefer)
```

If there were nuanced path differences between docs/ versions of the styleNN.html and examples/ versions (different relative paths), make sure docs/ has the deployed version. If examples/ versions were authoritative (different sample data), back-port to docs/ first.

---

## Phase 7 — Final cleanup + PR

### Task 18: Clean up fixture

**Files:**
- Modify or delete: `__test__/tweak-fixture/`
- Possibly modify: `.gitignore`

(Was old Task 12 — same content.)

- [ ] **Step 1: Add `.gitignore` entry for fixture build artifacts**

Append to `.gitignore`:

```
__test__/*/dist/
__test__/*/node_modules/
```

- [ ] **Step 2: Remove any accidental build artifacts already committed**

```bash
git rm -r --cached __test__/tweak-fixture/dist 2>/dev/null || true
git rm -r --cached __test__/tweak-fixture/node_modules 2>/dev/null || true
```

- [ ] **Step 3: Confirm fixture photos are from `docs/photos/` (after Phase 6 migration)**

If you used `examples/photos/` earlier, the migration in Phase 6 already moved them to `docs/photos/`. Update the fixture's photos to copy from `docs/photos/` instead.

- [ ] **Step 4: Commit cleanup**

```bash
git add .gitignore __test__/tweak-fixture/
git commit -m "test: ignore tweak-fixture build artifacts"
```

---

### Task 19: Final e2e verify + Self-review + PR

- [ ] **Step 1: Full end-to-end run with the fixture**

```bash
cd __test__/tweak-fixture
rm -rf dist
node scripts/derive.js
node scripts/build.js
node scripts/render.js
node scripts/build-gallery.js
```

Open `dist/index.html` and verify:
- Tweak panel renders with all sections (colors / fonts / frames / components / custom controls / save+export buttons)
- Preset interactions work (Task 8 steps 2–6)
- Free-form interactions work: color picker changes card bg live, font text input applies live, custom frame radius/aspect apply live
- Save: button prompts for name, alert confirms saved. Reload page → tweaks persist.
- Export: button downloads `<slug>.design.json`. Open the JSON — it has valid `tweak_options`.

- [ ] **Step 2: Test Stage 3 picker (Custom card pinned)**

Spin up a quick fresh working dir, run through Stage 1–2 in the agent, then have the agent render `_style-preview.html` with N=4 aesthetics. Open it and verify:
- 4 curated aesthetic cards present (the agent's photo-based picks)
- Custom card pinned at the end (5th card)
- All cards in the user's primary language (headlines, spirit lines, motifs)
- Saying "换一批" in chat → agent re-runs the picker with a different N=4 set + Custom card still pinned

- [ ] **Step 3: Verify the branch's full diff**

```bash
git diff main...feat/tweak-page --stat
git log main..feat/tweak-page --oneline
```

Expected: ~18–22 commits, touching `skeleton/scripts/build.js`, `skeleton/scripts/build-gallery.js`, `skeleton/data/designs.example.json`, `design-principles.md`, `workflow.md`, `SKILL.md`, `references/blank-canvas.html`, `references/blank-canvas-designs.json`, `__test__/tweak-fixture/*`, `.gitignore`, `docs/superpowers/plans/*`, deletion of `examples/`.

- [ ] **Step 4: Run `/review` on the branch**

Use the project's `/review` skill. Read findings, fix bugs, defer style nits.

- [ ] **Step 5: Push and open PR**

```bash
git push -u origin feat/tweak-page
gh pr create --title "Tweak page + Custom design + docs/examples cleanup" --body "$(cat <<'EOF'
## Summary
- **Tweak page (Phases 1–4)** — detail page now has a live control panel: preset color schemes, fonts, photo frame, component visibility. All updates happen via postMessage; no rebuild.
- **Custom design from scratch (Phase 5)** — Stage 3 picker now shows all aesthetics with a 换一批 shuffle + a pinned Custom card. Picking Custom opens a neutral blank-canvas template that the tweak panel can shape into anything. Free-form color picker / font input / frame inputs sit alongside the presets. Save persists state to localStorage; Export downloads a designs.json entry for future reuse.
- **docs/ + examples/ consolidation (Phase 6)** — deleted `examples/` (merged into `docs/`). Single source of truth for the showcase. SKILL.md / design-principles.md / workflow.md updated.

## Template contract
Templates must use CSS variables (`--card-bg`, `--font-headline`, `--photo-radius`, …) for tweak-able properties and class hooks (`.lunar-date.hidden { display: none }`) for optional components. See `design-principles.md` → "Tweakable templates".

## Test plan
- [x] Fixture `__test__/tweak-fixture/morandi-tweak.html` — preset color / font / component / frame controls all work live
- [x] Custom color picker — selecting a color in `<input type="color">` updates the iframe immediately
- [x] Custom font input — typing a font family applies it via CSS var
- [x] Save → reload → state restored from localStorage
- [x] Export → JSON downloaded, valid `tweak_options` block
- [x] Reset → restores design defaults (incl. re-hiding components whose default is off)
- [x] Standalone `dist/<id>.html` (no gallery) renders with template defaults, no panel
- [x] `npm run render` PNG captures initial template state (not any tweaks applied at preview)
- [x] Stage 3 picker shows the N curated aesthetic cards + always-pinned Custom card; saying "换一批" in chat re-curates

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

- [ ] **Step 6: Paste PR URL into chat for user review**

---

## Self-review notes

**Spec coverage check (against the user's brief + clarifications):**

User's original brief items:
- ✅ Tweak panel on detail page with preset color schemes, fonts, photo frame, components, reset
- ✅ Reuses postMessage protocol — no iframe reload
- ✅ designs.json `tweak_options` schema
- ✅ Template contract (CSS vars + class hooks) documented
- ✅ workflow.md updated (Stage 3, 4, 5)
- ✅ PNG render unaffected
- ✅ Standalone `dist/<id>.html` still works

User's clarifications:
- ✅ Custom design from scratch — accessible at Stage 3, not just on tweak page (Task 12)
- ✅ Save user's custom design for future use — localStorage + JSON export (Task 15)
- ✅ Stage 3 picker has a pinned Custom card; "换一批" is a conversational command (agent re-curates and re-renders) (Task 12)
- ✅ docs/ examples/ deduplication done in same PR (Phase 6)

Layout decisions (not strictly per-spec but documented):
- Left 60 / right 40 — NOT enforced as a hard 60/40 split. Kept the existing `flex: 0 0 480px` detail-info column. The panel lives in that column. If you want strict 60/40, edit DETAIL_CSS as a follow-up.
- Mobile collapse — panel stacks under preview at ≤960px via the existing responsive rules. If it becomes too long, wrap each tweak-group in a `<details>` element as a follow-up.

**Possibly tricky bits to watch:**

- `setActive` helper assumes the button has one class — buttons with modifier classes break it. Use `data-` attribute selectors explicitly.
- `__TWEAK_CONFIG__` is HTML-escaped via Unicode escapes — preventing `</script>` injection. Don't simplify.
- localStorage save runs on every `click`/`change`/`input` — debounced to 50ms via setTimeout. If a user spams the color picker, you'll write 100 times — still fine since localStorage writes are sub-ms.
- Export JSON button writes a JSON snippet to disk — the user has to manually paste it into `data/designs.json`. We're not modifying the user's source file from the browser (would need FileSystem Access API or a local server — out of scope).
- Stage 3 picker stays small — agent renders only the N curated cards + Custom; "换一批" is a chat command that triggers a re-render, not a page-side button.
- Phase 6 deletion of `examples/` — make sure no script reads from `examples/` programmatically. Spot-check `scripts/render-thumbnails.js` if it exists, or other thumbnail-generation paths.
- `references/blank-canvas.html` uses `{{names.groom_zh}}` placeholders — the agent must adapt these to the user's language at Stage 4. The blank-canvas-designs.json snippet is also a template the agent edits, not a literal copy.
