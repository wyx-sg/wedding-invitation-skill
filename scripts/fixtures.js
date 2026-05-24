// Per-culture fixture data for example renders.
//
// Each template gets a fixture matched to its cultural aesthetic — Chinese
// names+dates for new-chinese / red-gold / gugong / ink-flower; English for
// modern-minimal / vogue / art-deco / etc.; Korean for korean-hanbok; Japanese
// for wabi-sabi; and so on.
//
// The `_zh` field name is legacy from when the skill was Chinese-only — it now
// just means "primary script" for the template. Templates show whatever script
// gets put into the `_zh` slot (their CSS font stacks fall back gracefully).

import { render } from '../skeleton/scripts/template-engine.js';

// --- helpers shared across all fixtures (dates are absolute) ---

const ABS_DATE = {
  iso: '2099-10-01',
  zh_formal: '公元 二〇九九 年 十月一日',
  zh_short: '二〇九九年十月一日',
  en_long: 'October 1, 2099',
  en_short: '10.01.2099',
  en_compact: '10 · 01',
  weekday_zh: '星期一',
  weekday_en: 'Monday',
  lunar: '',
  zh_year: '二〇九九',
  zh_month_day: '十月一日',
  en_month: '10',
  en_day: '01',
  en_year: '2099',
  roman_year: 'MMXCIX'
};

const ABS_TIME = {
  value: '18:00',
  zh_full: '傍晚 18:00 入席',
  zh_label: '恭候',
  hours: '18',
  minutes: '00'
};

function makeFixture({ names, venue, site }) {
  return {
    names: {
      groom_surname_en: names.groom_en.split(/\s+/)[0],
      bride_surname_en: names.bride_en.split(/\s+/)[0],
      couple_en_short: `${names.groom_en[0]} & ${names.bride_en[0]}`,
      ...names
    },
    date: ABS_DATE,
    time: ABS_TIME,
    venue,
    site
  };
}

// --- 8 culture-specific fixtures ---

const CHINESE = makeFixture({
  names: {
    groom_zh: '林知言',
    groom_en: 'LIN ZHIYAN',
    bride_zh: '沈安然',
    bride_en: 'SHEN ANRAN'
  },
  venue: {
    full_zh: '上海 · 黄浦区 · 锦绣花园酒店',
    province_zh: '上海',
    province_en: 'SHANGHAI',
    city_zh: '上海',
    city_en: 'Shanghai',
    city_en_upper: 'SHANGHAI',
    lines_zh: ['黄浦区 永宁路 188 号', '锦绣花园酒店 宴会厅'],
    lines_en: ['188 Yongning Road, Huangpu District', 'Eternal Garden Hotel Ballroom'],
    type_zh: '酒店 · 宴会'
  },
  site: {
    title: '林知言 & 沈安然 · 婚礼请帖',
    subtitle: '2099.10.01 · 上海',
    intro: '',
    newspaper_title: 'The LIN Times'
  }
});

const ENGLISH = makeFixture({
  names: {
    // Western contemporary: same name in "primary" and "secondary" slots
    groom_zh: 'Alex',
    groom_en: 'ALEX JOHNSON',
    bride_zh: 'Maria',
    bride_en: 'MARIA GARCIA'
  },
  venue: {
    full_zh: 'Singapore · Marina Bay · The Fullerton Bay',
    province_zh: 'Singapore',
    province_en: 'SINGAPORE',
    city_zh: 'Singapore',
    city_en: 'Singapore',
    city_en_upper: 'SINGAPORE',
    lines_zh: ['80 Collyer Quay, Marina Bay', 'The Fullerton Bay Hotel'],
    lines_en: ['80 Collyer Quay, Marina Bay', 'The Fullerton Bay Hotel'],
    type_zh: 'Hotel · Ballroom'
  },
  site: {
    title: 'Alex Johnson & Maria Garcia · Wedding',
    subtitle: '10.01.2099 · Singapore',
    intro: '',
    newspaper_title: 'The JOHNSON Times'
  }
});

const JAPANESE = makeFixture({
  names: {
    groom_zh: '健太郎',
    groom_en: 'SATO KENTARO',
    bride_zh: '美咲',
    bride_en: 'SUZUKI MISAKI'
  },
  venue: {
    full_zh: '東京 · 港区 · パークハイアット',
    province_zh: '東京',
    province_en: 'TOKYO',
    city_zh: '東京',
    city_en: 'Tokyo',
    city_en_upper: 'TOKYO',
    lines_zh: ['港区 西新宿 3-7-1-2', 'パーク ハイアット 東京'],
    lines_en: ['3-7-1-2 Nishi-Shinjuku, Minato', 'Park Hyatt Tokyo'],
    type_zh: 'ホテル · 披露宴'
  },
  site: {
    title: '佐藤健太郎 & 鈴木美咲 · 結婚式',
    subtitle: '10.01.2099 · Tokyo',
    intro: '',
    newspaper_title: 'The SATO Times'
  }
});

const KOREAN = makeFixture({
  names: {
    groom_zh: '민준',
    groom_en: 'KIM MINJUN',
    bride_zh: '서연',
    bride_en: 'LEE SEOYEON'
  },
  venue: {
    full_zh: '서울 · 강남구 · 그랜드 하얏트',
    province_zh: '서울',
    province_en: 'SEOUL',
    city_zh: '서울',
    city_en: 'Seoul',
    city_en_upper: 'SEOUL',
    lines_zh: ['강남구 테헤란로 152', '그랜드 하얏트 서울'],
    lines_en: ['152 Teheran-ro, Gangnam-gu', 'Grand Hyatt Seoul'],
    type_zh: '호텔 · 컨벤션'
  },
  site: {
    title: '김민준 & 이서연 · 결혼식',
    subtitle: '10.01.2099 · Seoul',
    intro: '',
    newspaper_title: 'The KIM Times'
  }
});

const INDIAN = makeFixture({
  names: {
    groom_zh: 'Raj',
    groom_en: 'RAJ SHARMA',
    bride_zh: 'Priya',
    bride_en: 'PRIYA VERMA'
  },
  venue: {
    full_zh: 'Mumbai · Nariman Point · Taj Mahal Palace',
    province_zh: 'Maharashtra',
    province_en: 'MAHARASHTRA',
    city_zh: 'Mumbai',
    city_en: 'Mumbai',
    city_en_upper: 'MUMBAI',
    lines_zh: ['Apollo Bunder, Colaba', 'The Taj Mahal Palace Mumbai'],
    lines_en: ['Apollo Bunder, Colaba', 'The Taj Mahal Palace Mumbai'],
    type_zh: 'Heritage Hotel · Banquet'
  },
  site: {
    title: 'Raj Sharma & Priya Verma · Wedding',
    subtitle: '10.01.2099 · Mumbai',
    intro: '',
    newspaper_title: 'The SHARMA Times'
  }
});

const ARABIC = makeFixture({
  names: {
    groom_zh: 'Ahmad',
    groom_en: 'AHMAD AL-HASSAN',
    bride_zh: 'Layla',
    bride_en: 'LAYLA AL-FARSI'
  },
  venue: {
    full_zh: 'Dubai · Jumeirah · Burj Al Arab',
    province_zh: 'Dubai',
    province_en: 'DUBAI',
    city_zh: 'Dubai',
    city_en: 'Dubai',
    city_en_upper: 'DUBAI',
    lines_zh: ['Jumeirah Beach Road', 'Burj Al Arab Jumeirah'],
    lines_en: ['Jumeirah Beach Road', 'Burj Al Arab Jumeirah'],
    type_zh: 'Resort · Hall'
  },
  site: {
    title: 'Ahmad Al-Hassan & Layla Al-Farsi · Wedding',
    subtitle: '10.01.2099 · Dubai',
    intro: '',
    newspaper_title: 'The AL-HASSAN Times'
  }
});

const SPANISH = makeFixture({
  names: {
    groom_zh: 'Alejandro',
    groom_en: 'ALEJANDRO GARCIA',
    bride_zh: 'Sofía',
    bride_en: 'SOFIA HERNANDEZ'
  },
  venue: {
    full_zh: 'Ciudad de México · Polanco · Four Seasons',
    province_zh: 'CDMX',
    province_en: 'CIUDAD DE MEXICO',
    city_zh: 'Ciudad de México',
    city_en: 'Mexico City',
    city_en_upper: 'CIUDAD DE MEXICO',
    lines_zh: ['Paseo de la Reforma 500', 'Four Seasons Hotel'],
    lines_en: ['Paseo de la Reforma 500', 'Four Seasons Hotel Mexico City'],
    type_zh: 'Hotel · Salón'
  },
  site: {
    title: 'Alejandro García & Sofía Hernández · Boda',
    subtitle: '10.01.2099 · CDMX',
    intro: '',
    newspaper_title: 'The GARCIA Times'
  }
});

const FRENCH = makeFixture({
  names: {
    groom_zh: 'Alexandre',
    groom_en: 'ALEXANDRE DUBOIS',
    bride_zh: 'Camille',
    bride_en: 'CAMILLE LAURENT'
  },
  venue: {
    full_zh: 'Provence · Les Baux · Domaine de Manville',
    province_zh: 'Provence',
    province_en: 'PROVENCE',
    city_zh: 'Provence',
    city_en: 'Provence',
    city_en_upper: 'PROVENCE',
    lines_zh: ['Les Baux-de-Provence', 'Domaine de Manville'],
    lines_en: ['Les Baux-de-Provence', 'Domaine de Manville'],
    type_zh: 'Domaine · Réception'
  },
  site: {
    title: 'Alexandre Dubois & Camille Laurent · Mariage',
    subtitle: '10.01.2099 · Provence',
    intro: '',
    newspaper_title: 'The DUBOIS Times'
  }
});

// --- template → fixture mapping ---

const MAP = {
  'style01-new-chinese':      CHINESE,
  'style02-modern-minimal':   ENGLISH,
  'style03-morandi':          ENGLISH,
  'style04-red-gold':         CHINESE,
  'style05-vogue':            ENGLISH,
  'style06-black-gold':       ENGLISH,
  'style07-newspaper':        ENGLISH,
  'style08-letter':           ENGLISH,
  'style09-gugong':           CHINESE,
  'style10-mediterranean':    ENGLISH,
  'style11-wabi-sabi':        JAPANESE,
  'style12-art-deco':         ENGLISH,
  'style13-ink-flower':       CHINESE,
  'style14-retro-poster':     ENGLISH,
  'style15-vintage-stars':    ENGLISH,
  'style16-indian':           INDIAN,
  'style17-arabic':           ARABIC,
  'style18-latin':            SPANISH,
  'style19-french-provence':  FRENCH,
  'style20-korean-hanbok':    KOREAN
};

export function fixtureFor(templateId) {
  return MAP[templateId] || ENGLISH;
}

export { render };
