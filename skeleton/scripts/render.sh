#!/bin/bash
# Render each design in dist/ to a PNG using headless Chrome.
# Output goes to dist/png/<design-id>.png at 2.5x DPI for high-res prints.

set -e
cd "$(dirname "$0")/.."

# Locate Chrome. Override with CHROME=... npm run render if needed.
if [ -z "$CHROME" ]; then
  for candidate in \
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
    "/Applications/Chromium.app/Contents/MacOS/Chromium" \
    "/usr/bin/google-chrome" \
    "/usr/bin/chromium" \
    "/usr/bin/chromium-browser"; do
    if [ -x "$candidate" ]; then CHROME="$candidate"; break; fi
  done
fi

if [ -z "$CHROME" ] || [ ! -x "$CHROME" ]; then
  cat >&2 <<'EOF'
[render] Error: Chrome/Chromium not found on this machine.

Install options:
  • macOS:   brew install --cask google-chrome
             (or download https://www.google.com/chrome/)
  • Linux:   sudo apt install chromium-browser     (Debian/Ubuntu)
             sudo dnf install chromium             (Fedora)

Then re-run: npm run render

Or, override with an explicit path:
  CHROME=/full/path/to/chrome npm run render

Fallback (no Chrome install): one-off render via npx
  npx puppeteer-cli@2 print "file://$(pwd)/dist/<design-id>.html" "dist/png/<design-id>.png"
  (downloads bundled Chromium ~200 MB on first run)
EOF
  exit 1
fi

DIST_DIR="dist"
OUT_DIR="$DIST_DIR/png"
mkdir -p "$OUT_DIR"
rm -f "$OUT_DIR"/*.png

# Enumerate designs from data/designs.json
TUPLES=$(node -e "
const d = JSON.parse(require('fs').readFileSync('./data/designs.json', 'utf8'));
d.forEach(x => {
  const w = x.width || 420;
  const h = x.height || 560;
  console.log(x.id + '\t' + w + '\t' + h);
});
")

echo "$TUPLES" | while IFS=$'\t' read -r DESIGN_ID WIDTH HEIGHT; do
  SRC_HTML="$DIST_DIR/${DESIGN_ID}.html"
  OUT_PNG="$OUT_DIR/${DESIGN_ID}.png"
  if [ ! -f "$SRC_HTML" ]; then
    echo "[render] Skipping ${DESIGN_ID}: $SRC_HTML missing — run 'npm run build' first."
    continue
  fi
  # Use 2.5714x DPI (1080/420) so 420×560 logical → 1080×1440 print-ready
  "$CHROME" --headless --disable-gpu --hide-scrollbars \
    --window-size="${WIDTH},${HEIGHT}" \
    --force-device-scale-factor=2.5714 \
    --screenshot="$OUT_PNG" \
    "file://$(pwd)/$SRC_HTML" 2>/dev/null
  echo "→ $OUT_PNG (${WIDTH}x${HEIGHT})"
done

echo "[render] Done. PNGs in $OUT_DIR/"
