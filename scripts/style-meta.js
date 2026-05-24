// Per-style metadata for the Pages site detail pages.
// Palette / fonts / motifs / description for each of the 20 example aesthetics.

export const STYLE_META = {
  'style01-new-chinese': {
    name: 'new-chinese',
    culture: { en: 'Chinese', zh: '中式' },
    short: { en: 'refined traditional', zh: '新中式 · 雅致' },
    long: {
      en: 'A polished take on the Chinese wedding card. Cream paper background, vermilion seal accents, antique gold hairlines. Designed for refined indoor weddings — not the full red-explosion banquet style.',
      zh: '中式婚帖的雅致演绎。米色纸底、朱红印章、淡金细线。适合精致室内婚礼 — 不是满堂红的宴会式喧闹。'
    },
    palette: ['#f6efe1', '#b8362b', '#d4af37', '#1a1a1a'],
    fonts: ['Songti SC', 'ZCOOL XiaoWei', 'Cormorant Garamond'],
    motifs: { en: '囍 character · seal stamp · gold hairlines', zh: '囍字 · 印章 · 金线' }
  },
  'style02-modern-minimal': {
    name: 'modern-minimal',
    culture: { en: 'Contemporary', zh: '当代' },
    short: { en: 'scandi minimalism', zh: '极简主义' },
    long: {
      en: 'Off-white background, oval portrait, generous whitespace. Type does all the heavy lifting. Scandinavian-Japanese restraint, suitable for any contemporary wedding.',
      zh: '米白底色、椭圆人像、大量留白。靠字体把美感撑起来。北欧+日式的克制感，适合各种现代婚礼。'
    },
    palette: ['#fafaf7', '#0a0a0a', '#b8956a', '#1a1a1a'],
    fonts: ['Cormorant Garamond', 'Inter'],
    motifs: { en: 'oval photo · thin rules · soft golden accent', zh: '椭圆照片 · 细线 · 柔金点缀' }
  },
  'style03-morandi': {
    name: 'morandi',
    culture: { en: 'Contemporary', zh: '当代' },
    short: { en: 'soft contemporary', zh: '柔和当代' },
    long: {
      en: 'Muted Morandi palette — warm grey, sage, sand. Small photo, big date. Asymmetric, photographer-friendly aesthetic for soft outdoor weddings.',
      zh: '莫兰迪柔和色 — 暖灰、鼠尾草、沙色。小照片大日期，不对称构图，适合柔和户外婚礼。'
    },
    palette: ['#e8e4dc', '#7a8a6d', '#a59585', '#2c2c2c'],
    fonts: ['Inter', 'Cormorant Garamond'],
    motifs: { en: 'oval photo · hairline dividers · muted accents', zh: '椭圆照片 · 细线分隔 · 柔和点缀' }
  },
  'style04-red-gold': {
    name: 'red-gold',
    culture: { en: 'Chinese', zh: '中式' },
    short: { en: 'traditional banquet', zh: '红金传统宴' },
    long: {
      en: 'Full traditional Chinese banquet feel — red background, gold ornaments, large 囍 centerpiece. Designed for celebratory hotel banquet halls.',
      zh: '满堂红金传统宴会感 — 红底金饰、大囍居中。专为酒店宴会厅式婚礼设计。'
    },
    palette: ['#b8362b', '#d4af37', '#fdf8f0', '#8b2418'],
    fonts: ['Noto Serif SC', 'ZCOOL XiaoWei'],
    motifs: { en: 'big 囍 character · gold borders · cloud patterns', zh: '大囍字 · 金边 · 云纹' }
  },
  'style05-vogue': {
    name: 'vogue',
    culture: { en: 'European', zh: '欧式' },
    short: { en: 'editorial / fashion', zh: '时尚杂志' },
    long: {
      en: 'Magazine-cover energy. Oversized display serif headline, vertical type rules, FIG. 1 captions. Suits bold editorial wedding portraits.',
      zh: '时尚杂志封面感。超大衬线大标题、垂直排版细节、FIG.1 风格说明。适合编辑感婚纱照。'
    },
    palette: ['#fafaf7', '#0a0a0a', '#b8956a', '#1a1a1a'],
    fonts: ['Playfair Display', 'Bodoni Moda'],
    motifs: { en: 'oversized headline · vertical rules · figure captions', zh: '巨型标题 · 垂直分隔 · 图注样式' }
  },
  'style06-black-gold': {
    name: 'black-gold',
    culture: { en: 'Contemporary', zh: '当代' },
    short: { en: 'monogram / formal', zh: '黑金 monogram' },
    long: {
      en: 'Deep black, gold rim photo frame, italic monogram of the couple\'s initials. Formal black-tie wedding energy.',
      zh: '深黑底、金边照片框、新人首字母 monogram。正式 black-tie 婚礼感。'
    },
    palette: ['#0a0a0a', '#d4af37', '#8b6e3a', '#e0d8c8'],
    fonts: ['Bodoni Moda', 'Noto Serif SC'],
    motifs: { en: 'initial monogram · gold rim · double frame', zh: '首字母 monogram · 金边 · 双层框' }
  },
  'style07-newspaper': {
    name: 'newspaper',
    culture: { en: 'European', zh: '欧式' },
    short: { en: 'old-print broadsheet', zh: '复古报纸' },
    long: {
      en: 'Treats the wedding as a front-page article. Masthead, column rules, FIG. 1 photo caption, drop caps. Nostalgic old-print warmth.',
      zh: '把婚礼当头版新闻设计。报头、栏线、图注、首字下沉。复古老报纸的温度。'
    },
    palette: ['#f4ede0', '#1a1a1a', '#8b7355', '#1a1a1a'],
    fonts: ['Playfair Display', 'EB Garamond'],
    motifs: { en: 'masthead · column rules · drop caps · figure captions', zh: '报头 · 栏线 · 首字下沉 · 图注' }
  },
  'style08-letter': {
    name: 'letter',
    culture: { en: 'European', zh: '欧式' },
    short: { en: 'handwritten note', zh: '手写信笺' },
    long: {
      en: 'Cream paper, intimate close-up of rings, "Dear you" opening, signature at bottom. Personal hand-written letter aesthetic.',
      zh: '米色信纸、戒指特写、"亲爱的你"开篇、底部署名。亲笔信式的私密感。'
    },
    palette: ['#fdf8f0', '#3a2418', '#c4825a', '#544838'],
    fonts: ['EB Garamond', 'Caveat'],
    motifs: { en: 'lined paper · close-up rings · cursive signature', zh: '信笺纹 · 戒指特写 · 手写签名' }
  },
  'style09-gugong': {
    name: 'gugong',
    culture: { en: 'Chinese', zh: '中式' },
    short: { en: 'chinese palace', zh: '故宫工笔' },
    long: {
      en: 'Museum-grade. Phoenix crown, palace setting, fan-shaped photo, bird-and-flower motifs. Refined imperial Chinese aesthetic.',
      zh: '博物馆级。凤冠、宫殿背景、扇形照片、花鸟纹。精致皇家中式感。'
    },
    palette: ['#1a1a1a', '#d4af37', '#b8362b', '#e0d8c8'],
    fonts: ['Songti SC', 'Ma Shan Zheng'],
    motifs: { en: 'fan-shaped photo · bird-flower line art · seal stamps', zh: '扇形照片 · 花鸟线描 · 印章' }
  },
  'style10-mediterranean': {
    name: 'mediterranean',
    culture: { en: 'Contemporary', zh: '当代' },
    short: { en: 'destination / outdoor', zh: '地中海目的地' },
    long: {
      en: 'Terracotta sun, olive branches both sides, horizon line, warm sandy gradient. Mediterranean destination wedding feel.',
      zh: '土陶色太阳、双侧橄榄枝、地平线、暖沙渐变。地中海目的地婚礼感。'
    },
    palette: ['#f4ead8', '#c4683a', '#5a7a5e', '#5a3a28'],
    fonts: ['Cormorant Garamond', 'EB Garamond'],
    motifs: { en: 'olive branches · terracotta sun · horizon line', zh: '橄榄枝 · 土陶色太阳 · 地平线' }
  },
  'style11-wabi-sabi': {
    name: 'wabi-sabi',
    culture: { en: 'Japanese', zh: '日式' },
    short: { en: 'japanese restraint', zh: '日式侘寂' },
    long: {
      en: 'Pale background, arched photo frame, single ink-wash brush stroke, generous negative space. Zen restraint, asymmetric.',
      zh: '浅底色、拱顶照片框、单一墨笔笔触、大量留白。禅意克制、不对称构图。'
    },
    palette: ['#fafafa', '#1a1a1a', '#888', '#2c2c2c'],
    fonts: ['Noto Serif JP', 'Cormorant Garamond'],
    motifs: { en: 'arched photo · ink stroke · negative space', zh: '拱形照片 · 墨笔 · 留白' }
  },
  'style12-art-deco': {
    name: 'art-deco',
    culture: { en: 'European', zh: '欧式' },
    short: { en: 'gatsby glamour', zh: 'Gatsby 装饰艺术' },
    long: {
      en: 'Big sunburst fan, stepped chamfered frame, octagonal photo, italic monogram. Full 1920s Gatsby Art Deco glamour.',
      zh: '大 sunburst 扇 + 阶梯倒角框 + 八角照片 + 斜体 monogram。1920 年代 Gatsby 装饰艺术的华丽感。'
    },
    palette: ['#1a1a1a', '#d4af37', '#b8956a', '#f4ede0'],
    fonts: ['Bodoni Moda', 'Playfair Display'],
    motifs: { en: 'sunburst fan · stepped frame · octagonal photo · monogram', zh: 'Sunburst 扇 · 阶梯框 · 八角照片 · monogram' }
  },
  'style13-ink-flower': {
    name: 'ink-flower',
    culture: { en: 'Chinese', zh: '中式' },
    short: { en: 'chinese ink painting', zh: '水墨花卉' },
    long: {
      en: 'Rice paper background, ink-flower branch, oval photo, red seal stamp. Chinese ink painting aesthetic with single accent color.',
      zh: '宣纸底、水墨花枝、椭圆照片、红印章。中式水墨画感，单色 accent。'
    },
    palette: ['#fafafa', '#1a1a1a', '#c9817e', '#888'],
    fonts: ['Ma Shan Zheng', 'Noto Serif SC'],
    motifs: { en: 'ink branch · oval photo · red seal stamp', zh: '水墨枝 · 椭圆照片 · 红印章' }
  },
  'style14-retro-poster': {
    name: 'retro-poster',
    culture: { en: 'Themed', zh: '主题' },
    short: { en: 'travel-poster', zh: '复古旅行海报' },
    long: {
      en: 'Mustard, teal, cream. Big "WE\'RE MARRIED" condensed type, sunburst rays. 1970s vintage travel poster style.',
      zh: '芥末黄、青绿、奶油色。大字 "WE\'RE MARRIED"、放射光线。1970 年代复古旅行海报风。'
    },
    palette: ['#d4a02a', '#3a7060', '#f4e8c4', '#1a1a1a'],
    fonts: ['Bebas Neue', 'Cormorant Garamond'],
    motifs: { en: 'big bold type · sunburst · block borders', zh: '大字粗体 · 放射光 · 色块边框' }
  },
  'style15-vintage-stars': {
    name: 'vintage-stars',
    culture: { en: 'Themed', zh: '主题' },
    short: { en: 'celestial / night', zh: '星空夜空' },
    long: {
      en: 'Midnight navy, brass star scatter, crescent moon, italic display serif. Celestial night-sky romantic wedding.',
      zh: '深夜蓝、铜色星点、月牙、斜体衬线。星空夜晚浪漫婚礼。'
    },
    palette: ['#0e1428', '#c8a154', '#f0e8d4', '#e0d8c8'],
    fonts: ['Cormorant Garamond', 'Inter'],
    motifs: { en: 'star scatter · moon · constellation hints', zh: '散星 · 月亮 · 星座线' }
  },
  'style16-indian': {
    name: 'indian',
    culture: { en: 'South Asian', zh: '南亚' },
    short: { en: 'mandala / paisley', zh: '印度 mandala' },
    long: {
      en: 'Mandala at top, paisley sides, lotus row at bottom. Maroon + saffron + gold. Regal Indian wedding aesthetic.',
      zh: '顶部 mandala、两侧 paisley、底部莲花。酒红 + 藏红 + 金。印度宫廷婚礼感。'
    },
    palette: ['#7a1f2e', '#d4a02a', '#e8a042', '#f4d8a0'],
    fonts: ['Cinzel', 'Cormorant Garamond'],
    motifs: { en: 'mandala · paisley · lotus · ornate gold frame', zh: 'Mandala · Paisley · 莲花 · 金边框' }
  },
  'style17-arabic': {
    name: 'arabic',
    culture: { en: 'Middle Eastern', zh: '中东' },
    short: { en: 'arabesque / mihrab', zh: '阿拉伯 arabesque' },
    long: {
      en: 'Teal background, mihrab-arched photo, arabesque corner ornaments, gold geometric tile pattern. Islamic geometric beauty.',
      zh: '青绿底、mihrab 拱形照片、arabesque 角饰、金色几何瓷砖纹。伊斯兰几何美学。'
    },
    palette: ['#1d6160', '#c8a040', '#f0e0c0', '#0a201f'],
    fonts: ['Amiri', 'Cormorant Garamond'],
    motifs: { en: 'arched mihrab photo · arabesque corners · tile pattern', zh: 'Mihrab 拱形照片 · Arabesque 角饰 · 瓷砖纹' }
  },
  'style18-latin': {
    name: 'latin',
    culture: { en: 'Latin', zh: '拉美' },
    short: { en: 'papel picado / folk', zh: '拉美民俗' },
    long: {
      en: 'Papel picado banner top, marigold flowers, Talavera tile bottom border. Vibrant Mexican folk art aesthetic.',
      zh: 'Papel picado 剪纸横幅、万寿菊、Talavera 瓷砖底边。鲜艳墨西哥民俗艺术。'
    },
    palette: ['#faf2e4', '#e7665a', '#3aa39a', '#e8a330'],
    fonts: ['Cinzel', 'Cormorant Garamond'],
    motifs: { en: 'papel picado · marigold · talavera tile border', zh: 'Papel picado · 万寿菊 · Talavera 瓷砖边' }
  },
  'style19-french-provence': {
    name: 'french-provence',
    culture: { en: 'European', zh: '欧式' },
    short: { en: 'lavender / chateau', zh: '法式普罗旺斯' },
    long: {
      en: 'Lavender sprigs arched over names, botanical line art sides, cursive "amour" monogram. French countryside chateau romance.',
      zh: '薰衣草拱过姓名、两侧植物线描、手写 "amour" 字样。法式乡村 chateau 浪漫。'
    },
    palette: ['#f5f1e8', '#a08fbf', '#8a9882', '#4a3a4a'],
    fonts: ['Allura', 'EB Garamond', 'Cormorant Garamond'],
    motifs: { en: 'lavender sprigs · botanical sides · cursive monogram', zh: '薰衣草 · 植物线描 · 手写 monogram' }
  },
  'style20-korean-hanbok': {
    name: 'korean-hanbok',
    culture: { en: 'Korean', zh: '韩式' },
    short: { en: 'traditional joseon', zh: '韩式 hanbok' },
    long: {
      en: 'Emerald top band, gold kkwaegi knot ornament, arched royal-portrait photo frame, persimmon and lotus side motifs. Traditional Korean Joseon-era aesthetic.',
      zh: '翡翠绿顶带、金色 kkwaegi 结饰、拱顶宫廷肖像照片框、两侧柿子和莲花纹。朝鲜王朝传统韩式感。'
    },
    palette: ['#326b3c', '#c8a040', '#f5ede0', '#c9817e'],
    fonts: ['Nanum Myeongjo', 'Cormorant Garamond'],
    motifs: { en: 'kkwaegi knot · arched photo · persimmon and lotus', zh: 'Kkwaegi 结 · 拱顶照片 · 柿子 / 莲' }
  }
};
