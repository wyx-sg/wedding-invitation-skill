// Tiny local server that lets the picker pages persist selections to disk,
// so the agent can read them directly without asking the user to copy/paste.
//
//   node scripts/picker-server.js
//   npm run pick
//
// Endpoints:
//   GET  /api/picker-state           → returns data/picker-state.json (or {} if missing)
//   POST /api/picker-state           → body is JSON, written to data/picker-state.json
//   *                                → static files from project root
//
// State file format (overwritten on every change):
//   {
//     "stage": "style" | "photo",       // which picker the state is for
//     "picks": ["morandi", "art-deco"], // selected ids (in selection order)
//     "updatedAt": "2026-05-25T16:42:31Z"
//   }
//
// Picker pages are static; they detect whether they are served via http://
// (server-backed → live sync) or file:// (no server → fall back to Copy button).
// The server is OPTIONAL: copy/paste continues to work without it.
//
// No npm dependencies — uses Node built-ins only. Listens on PORT 8765 by
// default, override with --port=NNNN or PICKER_PORT env var.

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DATA_DIR = path.join(ROOT, 'data');
const STATE_FILE = path.join(DATA_DIR, 'picker-state.json');
const TWEAK_STATE_FILE = path.join(DATA_DIR, 'tweak-state.json');

const argPort = process.argv.find(a => a.startsWith('--port='));
const PORT = Number(argPort ? argPort.slice('--port='.length) : (process.env.PICKER_PORT || 8765));

// Bind to loopback only — wedding data must never reach the user's LAN.
const HOST = '127.0.0.1';

// Allow same-origin requests from the page the server serves (http://127.0.0.1:PORT,
// http://localhost:PORT) plus file:// pages (which carry Origin: "null"). Anything
// else gets no CORS header → browser blocks cross-origin reads/writes from random
// sites the user might also have open.
const ALLOWED_ORIGINS = new Set([
  `http://127.0.0.1:${PORT}`,
  `http://localhost:${PORT}`,
  'null',
]);
function corsFor(req) {
  const origin = req.headers.origin;
  if (origin && ALLOWED_ORIGINS.has(origin)) return { 'Access-Control-Allow-Origin': origin };
  return {};
}

// Server-side guard so a malicious site can't side-effect (write disk) before
// the browser would block the response. Same-origin requests (no Origin header,
// or matching one) and file:// (Origin: "null") are allowed.
function isOriginAllowed(req) {
  const origin = req.headers.origin;
  if (!origin) return true;
  return ALLOWED_ORIGINS.has(origin);
}

// Map common extensions to content types. Everything else served as octet-stream.
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css':  'text/css; charset=utf-8',
  '.js':   'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg':  'image/svg+xml',
  '.webp': 'image/webp',
  '.ico':  'image/x-icon',
};

function send(res, status, headers, body) {
  res.writeHead(status, {
    'Cache-Control': 'no-store',
    ...headers,
  });
  res.end(body);
}

function readState() {
  try {
    return fs.readFileSync(STATE_FILE, 'utf8');
  } catch {
    return '{}';
  }
}

function writeState(json) {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(STATE_FILE, json);
}

function readTweakState() {
  try {
    return fs.readFileSync(TWEAK_STATE_FILE, 'utf8');
  } catch {
    return '{}';
  }
}

function writeTweakState(designId, state) {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  let existing = {};
  try { existing = JSON.parse(readTweakState()); } catch { existing = {}; }
  existing[designId] = { ...state, updatedAt: new Date().toISOString() };
  fs.writeFileSync(TWEAK_STATE_FILE, JSON.stringify(existing, null, 2));
}

// Path normalization: strip leading `/`, resolve, and reject anything that
// escapes the project root (defense against `../../etc/passwd`-style traversal).
function safeResolve(reqUrl) {
  const decoded = decodeURIComponent(reqUrl.split('?')[0]);
  const stripped = decoded.replace(/^\/+/, '');
  const resolved = path.resolve(ROOT, stripped || '.');
  if (resolved !== ROOT && !resolved.startsWith(ROOT + path.sep)) return null;
  return resolved;
}

const server = http.createServer((req, res) => {
  const cors = corsFor(req);

  // Reject mutating requests from disallowed origins before they touch disk.
  if (req.method === 'POST' && !isOriginAllowed(req)) {
    return send(res, 403, { 'Content-Type': MIME['.json'] }, JSON.stringify({ error: 'origin not allowed' }));
  }

  if (req.method === 'OPTIONS') {
    return send(res, 204, {
      ...cors,
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    }, '');
  }

  if (req.url === '/api/picker-state' || req.url.startsWith('/api/picker-state?')) {
    if (req.method === 'GET') {
      return send(res, 200, { ...cors, 'Content-Type': MIME['.json'] }, readState());
    }
    if (req.method === 'POST') {
      let body = '';
      let tooBig = false;
      req.on('data', chunk => {
        body += chunk;
        if (body.length > 64 * 1024) {                          // hard cap: 64 KB
          tooBig = true;
          req.destroy();
        }
      });
      req.on('end', () => {
        if (tooBig) return;
        try {
          const parsed = JSON.parse(body);
          if (parsed.stage !== 'photo' && parsed.stage !== 'style') {
            return send(res, 400, { ...cors, 'Content-Type': MIME['.json'] }, JSON.stringify({ error: 'stage must be "photo" or "style"' }));
          }
          if (!Array.isArray(parsed.picks) || !parsed.picks.every(p => typeof p === 'string')) {
            return send(res, 400, { ...cors, 'Content-Type': MIME['.json'] }, JSON.stringify({ error: 'picks must be string[]' }));
          }
          const safe = { stage: parsed.stage, picks: parsed.picks, updatedAt: new Date().toISOString() };
          writeState(JSON.stringify(safe, null, 2));
          send(res, 200, { ...cors, 'Content-Type': MIME['.json'] }, JSON.stringify({ ok: true }));
        } catch (e) {
          send(res, 400, { ...cors, 'Content-Type': MIME['.json'] }, JSON.stringify({ error: 'invalid json' }));
        }
      });
      return;
    }
    return send(res, 405, cors, 'method not allowed');
  }

  if (req.url === '/api/tweak-state' || req.url.startsWith('/api/tweak-state?')) {
    if (req.method === 'GET') {
      return send(res, 200, { ...cors, 'Content-Type': MIME['.json'] }, readTweakState());
    }
    if (req.method === 'POST') {
      let body = '';
      let tooBig = false;
      req.on('data', chunk => {
        body += chunk;
        if (body.length > 64 * 1024) {
          tooBig = true;
          req.destroy();
        }
      });
      req.on('end', () => {
        if (tooBig) return;
        try {
          const parsed = JSON.parse(body);
          const designId = String(parsed.designId || '').trim();
          if (!designId || !/^[a-zA-Z][a-zA-Z0-9-]*$/.test(designId)) {
            return send(res, 400, { ...cors, 'Content-Type': MIME['.json'] }, JSON.stringify({ error: 'missing or invalid designId' }));
          }
          writeTweakState(designId, parsed.state || {});
          send(res, 200, { ...cors, 'Content-Type': MIME['.json'] }, JSON.stringify({ ok: true }));
        } catch (e) {
          send(res, 400, { ...cors, 'Content-Type': MIME['.json'] }, JSON.stringify({ error: 'invalid json' }));
        }
      });
      return;
    }
    return send(res, 405, cors, 'method not allowed');
  }

  // Static file serving. Only GET / HEAD.
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    return send(res, 405, cors, 'method not allowed');
  }

  const resolved = safeResolve(req.url);
  if (!resolved) return send(res, 403, cors, 'forbidden');

  let target = resolved;
  try {
    const stat = fs.statSync(target);
    if (stat.isDirectory()) target = path.join(target, 'index.html');
  } catch {
    return send(res, 404, cors, 'not found');
  }

  try {
    const data = fs.readFileSync(target);
    const ext = path.extname(target).toLowerCase();
    const mime = MIME[ext] || 'application/octet-stream';
    send(res, 200, { ...cors, 'Content-Type': mime }, data);
  } catch {
    send(res, 404, cors, 'not found');
  }
});

server.listen(PORT, HOST, () => {
  console.log(`[picker-server] http://localhost:${PORT}/  (loopback only)`);
  console.log(`[picker-server] state file: ${path.relative(ROOT, STATE_FILE)}`);
  console.log(`[picker-server] open _photo-select.html or _style-preview.html in your browser`);
  console.log(`[picker-server] Ctrl-C to stop`);
});
