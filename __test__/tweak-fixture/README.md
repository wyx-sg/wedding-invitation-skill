# tweak-fixture

End-to-end test fixture for the tweak page feature. Mirrors a user's
working directory (`cp -R skeleton/. <fixture-dir>/`) with morandi-tweak
template + designs.json containing a worked `tweak_options` block.

## Run

```
# After any edit to skeleton/scripts/*.js, resync the fixture's scripts + package.json:
node ../../scripts/sync-fixture.js

# Stage 4 (preview + tweak):
npm run preview            # → dist/preview.html + dist/<id>-studio.html
open dist/preview.html

# Stage 5 (deliver):
npm run deliver            # → dist/index.html + dist/<id>-page.html + PNGs in dist/png/{social,print}/
open dist/index.html

# Full pipeline:
npm run all                # derive + preview + deliver
```

## Testing single-design mode

The fixture ships with 2 designs (`morandi-tweak` + `custom-canvas`) to exercise the multi path (gallery grid + prev/next pager). The single-design path (`designs.length === 1` — pager hidden on detail/studio) is the same scripts with a one-entry `designs.json` — to test it, edit `data/designs.json` to keep just one design, rerun the build. No separate fixture needed.

## What's tracked vs not

Tracked: data/, photos/, templates/, scripts/ (synced from skeleton/scripts/).
Not tracked: dist/ (gitignored at the repo root).

## When to update

- `skeleton/scripts/*.js` changed → run `node scripts/sync-fixture.js` from the repo root
- A new tweak feature added to the template contract → update `templates/morandi-tweak.html` and `data/designs.json` accordingly
