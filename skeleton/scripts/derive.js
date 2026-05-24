// Derive all the redundant fields in data/wedding.json from a minimal seed.
//
// Wedding data has ~26 fields with significant redundancy (zh_formal, zh_short,
// en_long, en_short, roman_year, weekday_zh, etc. all encode the same ISO date
// or the same name pinyin). Asking the agent to compute them by hand is
// error-prone — especially Chinese number conversion and Roman numerals.
//
// Usage:
//   node scripts/derive.js                # reads data/wedding.json, fills in
//                                         # blanks, writes back to same file
//
// Minimal seed (what the agent gathers from the user):
//   {
//     "names": { "groom_zh": "...", "bride_zh": "...",
//                "groom_en": "...", "bride_en": "..." },
//     "date":  { "iso": "YYYY-MM-DD" },
//     "time":  { "value": "HH:MM" },
//     "venue": { "city_zh": "...", "city_en": "...", "province_zh": "...",
//                "province_en": "...", "lines_zh": [...], "type_zh": "...", "full_zh": "..." }
//   }
//
// Everything else is derived. Lunar date is NOT computed (requires a lookup
// table); leave `date.lunar` as "" or fill it manually if the couple wants it.

import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const FILE = path.join(ROOT, 'data', 'wedding.json');

// --- Helpers ---

const ZH_DIGITS = ['〇', '一', '二', '三', '四', '五', '六', '七', '八', '九'];

function zhDigits(n) {
  // Convert 2099 -> "二〇九九" (digit by digit, no thousand-hundred-ten units)
  return String(n).split('').map(d => ZH_DIGITS[parseInt(d, 10)]).join('');
}

function zhMonth(m) {
  // 1-12 -> 一月 ... 十二月
  if (m < 10) return ZH_DIGITS[m] + '月';
  if (m === 10) return '十月';
  return '十' + ZH_DIGITS[m - 10] + '月';
}

function zhDay(d) {
  // 1-31 -> 一日 / 十日 / 二十一日 / 三十一日
  if (d < 10) return ZH_DIGITS[d] + '日';
  if (d === 10) return '十日';
  if (d < 20) return '十' + ZH_DIGITS[d - 10] + '日';
  if (d === 20) return '二十日';
  if (d < 30) return '二十' + ZH_DIGITS[d - 20] + '日';
  if (d === 30) return '三十日';
  return '三十一日';
}

function toRoman(num) {
  // 1-3999. Wedding years are well within range.
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
const ZH_WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六'];

function pad2(n) {
  return String(n).padStart(2, '0');
}

// --- Derive ---

function deriveDate(seed) {
  const { iso } = seed;
  if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) {
    throw new Error(`date.iso must be YYYY-MM-DD, got: ${iso}`);
  }
  const [yStr, mStr, dStr] = iso.split('-');
  const y = parseInt(yStr, 10);
  const m = parseInt(mStr, 10);
  const d = parseInt(dStr, 10);
  // Use UTC to avoid timezone shifts on the date itself
  const dt = new Date(Date.UTC(y, m - 1, d));
  const weekdayIdx = dt.getUTCDay();

  return {
    iso,
    zh_formal: `公元 ${zhDigits(y)} 年 ${zhMonth(m)}${zhDay(d)}`,
    zh_short: `${zhDigits(y)}年${zhMonth(m)}${zhDay(d)}`,
    en_long: `${EN_MONTHS[m - 1]} ${d}, ${y}`,
    en_short: `${pad2(m)}.${pad2(d)}.${y}`,
    en_compact: `${pad2(m)} · ${pad2(d)}`,
    weekday_zh: `星期${ZH_WEEKDAYS[weekdayIdx]}`,
    weekday_en: EN_WEEKDAYS[weekdayIdx],
    lunar: seed.lunar || '',
    zh_year: zhDigits(y),
    zh_month_day: `${zhMonth(m)}${zhDay(d)}`,
    en_month: pad2(m),
    en_day: pad2(d),
    en_year: String(y),
    roman_year: toRoman(y)
  };
}

function deriveTime(seed) {
  const { value } = seed;
  if (!value || !/^\d{1,2}:\d{2}$/.test(value)) {
    throw new Error(`time.value must be HH:MM, got: ${value}`);
  }
  const [h, mm] = value.split(':');
  const hour = parseInt(h, 10);
  const period = hour < 6 ? '凌晨' : hour < 12 ? '上午' : hour < 14 ? '中午' : hour < 18 ? '下午' : '晚上';
  return {
    value,
    zh_full: `${period} ${value} 入席`,
    zh_label: seed.zh_label || '恭候',
    hours: pad2(hour),
    minutes: mm
  };
}

function deriveNames(seed) {
  const { groom_zh, bride_zh, groom_en, bride_en } = seed;
  for (const [k, v] of Object.entries({ groom_zh, bride_zh, groom_en, bride_en })) {
    if (!v) throw new Error(`names.${k} is required`);
  }
  // Surname (uppercase first word of EN name): "LIN ZHIYAN" -> "LIN"
  const groom_surname_en = seed.groom_surname_en || groom_en.trim().split(/\s+/)[0].toUpperCase();
  const bride_surname_en = seed.bride_surname_en || bride_en.trim().split(/\s+/)[0].toUpperCase();
  const couple_en_short = seed.couple_en_short || `${groom_surname_en[0]} & ${bride_surname_en[0]}`;
  return {
    groom_zh, bride_zh, groom_en, bride_en,
    groom_surname_en, bride_surname_en, couple_en_short
  };
}

function deriveSite(seed, names, date, venue) {
  return {
    title: seed.title || `${names.groom_zh} & ${names.bride_zh} · 婚礼请帖`,
    subtitle: seed.subtitle || `${date.en_year}.${date.en_month}.${date.en_day} · ${venue.city_zh || ''}`.trim(),
    intro: seed.intro || '',
    newspaper_title: seed.newspaper_title || `The ${names.groom_surname_en} Times`
  };
}

// --- Main ---

function main() {
  if (!fs.existsSync(FILE)) {
    console.error(`[derive] Not found: ${FILE}`);
    console.error('[derive] Run from inside a wedding project directory.');
    process.exit(1);
  }
  const seed = JSON.parse(fs.readFileSync(FILE, 'utf8'));
  if (!seed.names || !seed.date || !seed.time || !seed.venue) {
    console.error('[derive] wedding.json missing one of: names, date, time, venue');
    process.exit(1);
  }
  const names = deriveNames(seed.names);
  const date = deriveDate(seed.date);
  const time = deriveTime(seed.time);
  const venue = seed.venue; // venue fields are user-provided strings, no math
  const site = deriveSite(seed.site || {}, names, date, venue);

  const out = { names, date, time, venue, site };
  fs.writeFileSync(FILE, JSON.stringify(out, null, 2) + '\n');
  console.log(`[derive] Wrote ${FILE}`);
  console.log(`[derive] Date:     ${date.zh_short} (${date.weekday_zh})`);
  console.log(`[derive] Couple:   ${names.groom_zh} & ${names.bride_zh}`);
  console.log(`[derive] Roman yr: ${date.roman_year}`);
  if (!date.lunar) {
    console.log('[derive] Note: lunar date is empty. Fill it manually in data/wedding.json if you want it on the invitation.');
  }
}

main();
