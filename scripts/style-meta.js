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
    motifs: { en: '囍 character · seal stamp · gold hairlines', zh: '囍字 · 印章 · 金线' },
    inspiration: {
      en: 'Inspired by Song-dynasty literati gatherings and the negative-space aesthetic of Suzhou gardens. Palette pulled from carved-lacquer (剔红) artifacts in the Forbidden City collection.',
      zh: '灵感来自宋代文人雅集和苏州园林的留白美学。配色提取自故宫珍藏的剔红漆器。'
    }
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
    motifs: { en: 'oval photo · thin rules · soft golden accent', zh: '椭圆照片 · 细线 · 柔金点缀' },
    inspiration: {
      en: 'A blend of Scandinavian minimalism, Japanese ma (間), and modern editorial layout. Helvetica meets the Apple Store storefront.',
      zh: '北欧极简、日式"间"的留白美学、加上现代杂志的编辑感。Helvetica 字体的克制 + Apple Store 橱窗的呼吸感。'
    }
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
    motifs: { en: 'oval photo · hairline dividers · muted accents', zh: '椭圆照片 · 细线分隔 · 柔和点缀' },
    inspiration: {
      en: 'Named for the Italian painter Giorgio Morandi — muted grays that nonetheless hold warmth. Modern editorial wedding photography style.',
      zh: '命名来自意大利画家 Giorgio Morandi — 灰调里藏着温度的静物画。现代编辑式婚纱摄影风格。'
    }
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
    motifs: { en: 'big 囍 character · gold borders · cloud patterns', zh: '大囍字 · 金边 · 云纹' },
    inspiration: {
      en: 'The full-saturation banquet aesthetic of traditional Chinese wedding halls — dragon-and-phoenix symbolism, satin red walls, gold-foil ornaments.',
      zh: '中式宴会的满堂红金美学 — 龙凤呈祥、绸缎红墙、金箔装饰。'
    }
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
    motifs: { en: 'oversized headline · vertical rules · figure captions', zh: '巨型标题 · 垂直分隔 · 图注样式' },
    inspiration: {
      en: 'Borrowed from Vogue covers under Anna Wintour — oversize Didone serifs, stark white space, FIG. 1 figure captions.',
      zh: '取自 Anna Wintour 时期的 Vogue 封面 — 巨型 Didone 衬线、极简留白、FIG.1 风格图注。'
    }
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
    motifs: { en: 'initial monogram · gold rim · double frame', zh: '首字母 monogram · 金边 · 双层框' },
    inspiration: {
      en: 'Drawn from Gatsby-era elegance and modern luxury hotel guest books. The italic Bodoni monogram echoes embossed brass plates.',
      zh: 'Gatsby 时代的优雅 + 现代奢华酒店签到册。斜体 Bodoni monogram 呼应铜版浮雕铭牌。'
    }
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
    motifs: { en: 'masthead · column rules · drop caps · figure captions', zh: '报头 · 栏线 · 首字下沉 · 图注' },
    inspiration: {
      en: 'Modeled on 1950s small-town newspapers — front-page treatment that frames the wedding as the year\'s biggest local news.',
      zh: '仿照 1950 年代地方报纸的版式 — 头版头条把婚礼当作年度大新闻。'
    }
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
    motifs: { en: 'lined paper · close-up rings · cursive signature', zh: '信笺纹 · 戒指特写 · 手写签名' },
    inspiration: {
      en: 'Wartime letters home and Jane Austen-era private correspondence — the wedding announced as if writing to the person who matters most.',
      zh: '战时家书 + Jane Austen 时代的私人书信 — 像写给最在意的那个人一样宣告婚讯。'
    }
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
    motifs: { en: 'fan-shaped photo · bird-flower line art · seal stamps', zh: '扇形照片 · 花鸟线描 · 印章' },
    inspiration: {
      en: 'Adapted from imperial Chinese silk court robes and the meticulous bird-and-flower paintings of Forbidden City workshops. Fan-shaped photo crop mirrors palace portrait conventions.',
      zh: '取自宫廷缂丝礼服纹样和故宫工笔花鸟画。扇形照片仿照传统宫廷肖像格式。'
    }
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
    motifs: { en: 'olive branches · terracotta sun · horizon line', zh: '橄榄枝 · 土陶色太阳 · 地平线' },
    inspiration: {
      en: 'A blend of Amalfi Coast sunsets and Provence olive groves. "Amore eterno" is borrowed from Italian wedding wishes carved into village walls.',
      zh: '阿马尔菲海岸的夕阳 + 普罗旺斯橄榄园的双重灵感。"Amore eterno" 来自意大利乡村墙上的婚礼祝福刻字。'
    }
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
    motifs: { en: 'arched photo · ink stroke · negative space', zh: '拱形照片 · 墨笔 · 留白' },
    inspiration: {
      en: 'The Japanese wabi-sabi aesthetic — one brush stroke, one stretch of empty space, enough. Influenced by tea-ceremony scrolls and zen ensō circles.',
      zh: '日式侘寂美学 — 一抹墨笔、一片留白，足够。来自茶道挂轴和禅宗"圆相"的影响。'
    }
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
    motifs: { en: 'sunburst fan · stepped frame · octagonal photo · monogram', zh: 'Sunburst 扇 · 阶梯框 · 八角照片 · monogram' },
    inspiration: {
      en: 'The 1925 Paris Exposition Internationale and the lobby ornament of New York\'s Chrysler Building — geometric sunbursts, chevrons, stepped pyramids.',
      zh: '1925 年巴黎装饰艺术博览会 + 纽约 Chrysler 大厦大厅装饰 — 几何放射、人字纹、阶梯金字塔。'
    }
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
    motifs: { en: 'ink branch · oval photo · red seal stamp', zh: '水墨枝 · 椭圆照片 · 红印章' },
    inspiration: {
      en: 'Bada Shanren\'s ink-and-wash birds-and-flowers, refracted through modern minimalism. The red seal stamp asserts the family name with a single character.',
      zh: '八大山人的水墨花鸟画 + 现代极简留白。红色印章用一个字宣告家姓。'
    }
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
    motifs: { en: 'big bold type · sunburst · block borders', zh: '大字粗体 · 放射光 · 色块边框' },
    inspiration: {
      en: '1970s airline travel posters and Saul Bass film posters. Big block type as a destination announcement — the wedding as the trip of a lifetime.',
      zh: '1970 年代航空公司旅行海报 + Saul Bass 风格电影海报。大字粗体宣告目的地 — 婚礼即一生旅行。'
    }
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
    motifs: { en: 'star scatter · moon · constellation hints', zh: '散星 · 月亮 · 星座线' },
    inspiration: {
      en: 'Medieval astronomical charts and the night skies of vintage cinema posters. "Under the same sky" — wherever the guests are, the couple is too.',
      zh: '中世纪星图 + 老电影海报里的夜空。"Under the same sky" — 不管宾客在哪里，新人也在。'
    }
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
    motifs: { en: 'mandala · paisley · lotus · ornate gold frame', zh: 'Mandala · Paisley · 莲花 · 金边框' },
    inspiration: {
      en: 'Rajasthani royal weddings and the gold-leaf ornament of Mughal miniature paintings. "Shubh Vivah" is the Sanskrit blessing for an auspicious wedding.',
      zh: '拉贾斯坦邦宫廷婚礼 + 莫卧儿细密画的金箔装饰。"Shubh Vivah" 是梵语的"吉祥婚礼"祝词。'
    }
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
    motifs: { en: 'arched mihrab photo · arabesque corners · tile pattern', zh: 'Mihrab 拱形照片 · Arabesque 角饰 · 瓷砖纹' },
    inspiration: {
      en: 'The geometric ceilings of the Alhambra and the tile patterns of Istanbul\'s Blue Mosque. The mihrab arch — usually a niche pointing to Mecca — becomes the photo frame.',
      zh: '阿尔罕布拉宫的几何天花板 + 伊斯坦布尔蓝色清真寺的瓷砖纹。Mihrab 拱（原本是指向麦加的壁龛）成为照片框。'
    }
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
    motifs: { en: 'papel picado · marigold · talavera tile border', zh: 'Papel picado · 万寿菊 · Talavera 瓷砖边' },
    inspiration: {
      en: 'Frida Kahlo\'s portrait backgrounds and the papel picado (cut-paper) banners of Mexican Día de los Muertos. Marigolds are the flower of celebration and remembrance.',
      zh: 'Frida Kahlo 自画像的背景 + 墨西哥亡灵节的 papel picado 剪纸花。万寿菊是庆祝与缅怀之花。'
    }
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
    motifs: { en: 'lavender sprigs · botanical sides · cursive monogram', zh: '薰衣草 · 植物线描 · 手写 monogram' },
    inspiration: {
      en: 'Cézanne\'s Provence villages and the fine line-drawings of 19th-century French botanical encyclopedias. "Amour" in cursive evokes vintage perfume labels.',
      zh: 'Cézanne 笔下的普罗旺斯山村 + 19 世纪法国植物图鉴的细线画。手写体 "amour" 让人想起复古香水标签。'
    }
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
    motifs: { en: 'kkwaegi knot · arched photo · persimmon and lotus', zh: 'Kkwaegi 结 · 拱顶照片 · 柿子 / 莲' },
    inspiration: {
      en: 'Joseon dynasty wedding-painting albums (혼례도) and the dancheong polychrome that decorates Korean temple eaves. The kkwaegi knot is the traditional symbol of binding two families.',
      zh: '朝鲜王朝《婚礼图》册页 + 韩国寺庙飞檐的"丹青"彩画。Kkwaegi 结是传统中两家结合的象征。'
    }
  }
};

// Photo compatibility — for each template, which of the 20 example photos
// visually fit the aesthetic. First entry is always the template's own
// primary photo (rendered by default). Additional entries enable a photo
// switcher on the detail page. Curated by hand based on tonal palette,
// subject framing, formality, and cultural register.
//
// Cultural-specific templates (indian / arabic / latin / korean-hanbok) and
// the object-only template (letter, just rings on paper) have only their
// own photo — there's nothing else that fits without breaking the design.
export const COMPATIBLE_PHOTOS = {
  // Warm Chinese formal cluster — refined portraits with traditional outfits
  'style01-new-chinese':   ['style01-new-chinese', 'style13-ink-flower', 'style09-gugong'],
  'style04-red-gold':      ['style04-red-gold', 'style01-new-chinese'],
  'style09-gugong':        ['style09-gugong', 'style13-ink-flower', 'style01-new-chinese'],
  'style13-ink-flower':    ['style13-ink-flower', 'style09-gugong', 'style11-wabi-sabi', 'style01-new-chinese'],

  // Modern minimalist neutral cluster — clean cream/grey contemporary
  'style02-modern-minimal': ['style02-modern-minimal', 'style03-morandi', 'style19-french-provence', 'style10-mediterranean'],
  'style03-morandi':        ['style03-morandi', 'style19-french-provence', 'style10-mediterranean', 'style02-modern-minimal'],
  'style10-mediterranean':  ['style10-mediterranean', 'style03-morandi', 'style19-french-provence', 'style02-modern-minimal'],
  'style19-french-provence':['style19-french-provence', 'style03-morandi', 'style10-mediterranean', 'style02-modern-minimal'],

  // Editorial / dark-glamour cluster — dramatic black-tie / fashion shots
  'style05-vogue':         ['style05-vogue', 'style06-black-gold', 'style12-art-deco'],
  'style06-black-gold':    ['style06-black-gold', 'style05-vogue', 'style12-art-deco'],
  'style12-art-deco':      ['style12-art-deco', 'style06-black-gold', 'style05-vogue'],
  'style15-vintage-stars': ['style15-vintage-stars', 'style12-art-deco'],

  // Vintage / themed
  'style07-newspaper':     ['style07-newspaper', 'style14-retro-poster'],
  'style14-retro-poster':  ['style14-retro-poster', 'style07-newspaper'],

  // Japanese ink — shares ink-painting backdrop with ink-flower
  'style11-wabi-sabi':     ['style11-wabi-sabi', 'style13-ink-flower'],

  // Single-photo (no alternates fit) — object photo or highly culture-specific outfits
  'style08-letter':        ['style08-letter'],
  'style16-indian':        ['style16-indian'],
  'style17-arabic':        ['style17-arabic'],
  'style18-latin':         ['style18-latin'],
  'style20-korean-hanbok': ['style20-korean-hanbok']
};
