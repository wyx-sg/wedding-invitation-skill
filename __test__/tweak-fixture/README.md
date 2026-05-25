# tweak-fixture

End-to-end test fixture for the tweak page feature. Mirrors a user's
working directory (`cp -R skeleton/. <fixture-dir>/`) with morandi-tweak
template + designs.json containing a worked `tweak_options` block.

## Run

```
# After any edit to skeleton/scripts/*.js, resync the fixture's scripts:
node ../../scripts/sync-fixture.js

# Then build + render + open in browser:
node scripts/build.js
node scripts/build-gallery.js
node scripts/render.js     # optional — produces PNGs in dist/png/{social,print}/
open dist/index.html       # macOS; use xdg-open / start on Linux / Windows
```

## What's tracked vs not

Tracked: data/, photos/, templates/, scripts/ (synced from skeleton/scripts/).
Not tracked: dist/ (gitignored at the repo root).

## When to update

- `skeleton/scripts/*.js` changed → run `node scripts/sync-fixture.js` from the repo root
- A new tweak feature added to the template contract → update `templates/morandi-tweak.html` and `data/designs.json` accordingly
