// Fill in the redundant / formatted fields in data/wedding.json from a minimal
// seed. Language-aware — only derives the fields needed for the languages the
// invitation is being designed in.
//
// Usage:
//   node scripts/derive.js                # reads data/wedding.json, fills in
//                                         # blanks, writes back to same file
//
// Seed schema (what the agent gathers from the user):
//
//   {
//     "languages": ["zh", "en"],   // required — any subset; e.g. ["en"], ["es"]
//     "names": {
//       // if "zh" in languages: groom_zh + bride_zh required
//       // if "en" in languages: groom_en + bride_en required (FAMILY GIVEN, all caps)
//       // for other languages: provide whatever name fields the template needs
//     },
//     "date": { "iso": "YYYY-MM-DD" },      // always required
//     "time": { "value": "HH:MM" },         // always required (24-hour)
//     "venue": { ... }                       // free-form text fields, language-suffixed
//   }
//
// Only "zh" and "en" are auto-derived. For other languages (es, ja, ko, fr, ...),
// the agent writes localized date/time strings directly into data/wedding.json.
// Lunar date is NEVER auto-derived (requires a lookup table); fill seed.date.lunar
// manually if the couple wants it.

import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const FILE = path.join(ROOT, 'data', 'wedding.json');

// --- Helpers (Chinese) ---

const ZH_DIGITS = ['〇', '一', '二', '三', '四', '五', '六', '七', '八', '九'];

function zhDigits(n) {
  return String(n).split('').map(d => ZH_DIGITS[parseInt(d, 10)]).join('');
}

function zhMonth(m) {
  if (m < 10) return ZH_DIGITS[m] + '月';
  if (m === 10) return '十月';
  return '十' + ZH_DIGITS[m - 10] + '月';
}

function zhDay(d) {
  if (d < 10) return ZH_DIGITS[d] + '日';
  if (d === 10) return '十日';
  if (d < 20) return '十' + ZH_DIGITS[d - 10] + '日';
  if (d === 20) return '二十日';
  if (d < 30) return '二十' + ZH_DIGITS[d - 20] + '日';
  if (d === 30) return '三十日';
  return '三十一日';
}

const ZH_WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六'];

// --- Helpers (English) ---

function toRoman(num) {
  const vals = [
    [1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'],
    [100,  'C'], [90,  'XC'], [50,  'L'], [40,  'XL'],
    [10,   'X'], [9,   'IX'], [5,   'V'], [4,   'IV'],
    [1,    'I']
  ];
  let out = '';
  let n = num;
  for (const [v, s] of vals) {
    while (n >= v) { out += s; n -= v; }
  }
  return out;
}

const EN_MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];
const EN_WEEKDAYS = [
  'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'
];

function pad2(n) {
  return String(n).padStart(2, '0');
}

// --- Derivers ---

function deriveDate(seed, languages) {
  const { iso } = seed;
  if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) {
    throw new Error(`date.iso must be YYYY-MM-DD, got: ${iso}`);
  }
  const [yStr, mStr, dStr] = iso.split('-');
  const y = parseInt(yStr, 10);
  const m = parseInt(mStr, 10);
  const d = parseInt(dStr, 10);
  const dt = new Date(Date.UTC(y, m - 1, d));
  const weekdayIdx = dt.getUTCDay();

  const out = { iso };

  if (languages.includes('zh')) {
    out.zh_formal = `公元 ${zhDigits(y)} 年 ${zhMonth(m)}${zhDay(d)}`;
    out.zh_short = `${zhDigits(y)}年${zhMonth(m)}${zhDay(d)}`;
    out.weekday_zh = `星期${ZH_WEEKDAYS[weekdayIdx]}`;
    out.zh_year = zhDigits(y);
    out.zh_month_day = `${zhMonth(m)}${zhDay(d)}`;
    out.lunar = seed.lunar || '';
  }
  if (languages.includes('en')) {
    out.en_long = `${EN_MONTHS[m - 1]} ${d}, ${y}`;
    out.en_short = `${pad2(m)}.${pad2(d)}.${y}`;
    out.en_compact = `${pad2(m)} · ${pad2(d)}`;
    out.weekday_en = EN_WEEKDAYS[weekdayIdx];
    out.en_month = pad2(m);
    out.en_day = pad2(d);
    out.en_year = String(y);
    out.roman_year = toRoman(y);
  }

  // Carry over any caller-provided fields for non-auto-derived languages
  for (const [k, v] of Object.entries(seed)) {
    if (!(k in out)) out[k] = v;
  }
  return out;
}

function deriveTime(seed, languages) {
  const { value } = seed;
  if (!value || !/^\d{1,2}:\d{2}$/.test(value)) {
    throw new Error(`time.value must be HH:MM (24h), got: ${value}`);
  }
  const [h, mm] = value.split(':');
  const hour = parseInt(h, 10);

  const out = { value, hours: pad2(hour), minutes: mm };

  if (languages.includes('zh')) {
    const period = hour < 6 ? '凌晨' : hour < 12 ? '上午' : hour < 14 ? '中午' : hour < 18 ? '下午' : '晚上';
    out.zh_full = `${period} ${value} 入席`;
    out.zh_label = seed.zh_label || '恭候';
  }
  // For other languages, agent writes localized strings directly.
  for (const [k, v] of Object.entries(seed)) {
    if (!(k in out)) out[k] = v;
  }
  return out;
}

function deriveNames(seed, languages) {
  const out = { ...seed };

  if (languages.includes('zh')) {
    if (!seed.groom_zh || !seed.bride_zh) {
      throw new Error('languages includes "zh" — names.groom_zh and names.bride_zh are required');
    }
  }
  if (languages.includes('en')) {
    if (!seed.groom_en || !seed.bride_en) {
      throw new Error('languages includes "en" — names.groom_en and names.bride_en are required');
    }
    // Family-name extraction: assume EN names are "FAMILY GIVEN ..." (caps)
    out.groom_surname_en = seed.groom_surname_en || seed.groom_en.trim().split(/\s+/)[0].toUpperCase();
    out.bride_surname_en = seed.bride_surname_en || seed.bride_en.trim().split(/\s+/)[0].toUpperCase();
    out.couple_en_short = seed.couple_en_short || `${out.groom_surname_en[0]} & ${out.bride_surname_en[0]}`;
  }
  return out;
}

function deriveSite(seed, names, date, venue, languages) {
  const out = { ...seed };
  const primary = languages[0];

  if (!out.title) {
    if (primary === 'zh' && names.groom_zh && names.bride_zh) {
      out.title = `${names.groom_zh} & ${names.bride_zh} · 婚礼请帖`;
    } else if (primary === 'en' && names.groom_en && names.bride_en) {
      out.title = `${names.groom_en} & ${names.bride_en} · Wedding Invitation`;
    } else {
      out.title = 'Wedding Invitation';
    }
  }
  if (!out.subtitle) {
    if (languages.includes('en') && date.en_year) {
      const city = venue.city_en || venue.city_zh || '';
      out.subtitle = `${date.en_year}.${date.en_month}.${date.en_day}${city ? ' · ' + city : ''}`;
    } else if (languages.includes('zh') && date.zh_year) {
      const city = venue.city_zh || '';
      out.subtitle = `${date.zh_year}${city ? ' · ' + city : ''}`;
    }
  }
  if (!out.newspaper_title && names.groom_surname_en) {
    out.newspaper_title = `The ${names.groom_surname_en} Times`;
  }
  return out;
}

// --- Main ---

function main() {
  if (!fs.existsSync(FILE)) {
    console.error(`[derive] Not found: ${FILE}`);
    console.error('[derive] Run from inside a wedding project directory.');
    process.exit(1);
  }
  const seed = JSON.parse(fs.readFileSync(FILE, 'utf8'));

  if (!Array.isArray(seed.languages) || seed.languages.length === 0) {
    console.error('[derive] wedding.json must declare "languages": e.g. ["zh"], ["en"], ["zh", "en"], ["es"].');
    process.exit(1);
  }
  if (!seed.names || !seed.date || !seed.time || !seed.venue) {
    console.error('[derive] wedding.json missing one of: names, date, time, venue');
    process.exit(1);
  }

  const languages = seed.languages;
  const names = deriveNames(seed.names, languages);
  const date = deriveDate(seed.date, languages);
  const time = deriveTime(seed.time, languages);
  const venue = seed.venue;
  const site = deriveSite(seed.site || {}, names, date, venue, languages);

  const out = { languages, names, date, time, venue, site };
  fs.writeFileSync(FILE, JSON.stringify(out, null, 2) + '\n');

  console.log(`[derive] Wrote ${FILE}`);
  console.log(`[derive] Languages: ${languages.join(', ')}`);
  if (date.zh_short) console.log(`[derive] Date (zh): ${date.zh_short} (${date.weekday_zh})`);
  if (date.en_long)  console.log(`[derive] Date (en): ${date.en_long} (${date.weekday_en})`);
  if (languages.includes('zh') && !date.lunar) {
    console.log('[derive] Note: lunar date is empty. Fill seed.date.lunar manually if you want it on the invitation.');
  }
  const otherLangs = languages.filter(l => l !== 'zh' && l !== 'en');
  if (otherLangs.length) {
    console.log(`[derive] Note: ${otherLangs.join(', ')} — date/time strings were passed through; write them in data/wedding.json directly.`);
  }
}

main();
