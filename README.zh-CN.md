<p align="right"><a href="./README.md">English</a> · <strong>简体中文</strong></p>

# 婚礼请帖

> 一个 AI agent skill，通过对话为你设计专属婚礼请帖 — 任意语言、任意风格、本地渲染、数据不外传。

![hero](./docs/hero.png)

<p align="center">
  <img alt="MIT License" src="https://img.shields.io/badge/license-MIT-blue.svg">
  <img alt="Works with Claude Code" src="https://img.shields.io/badge/Claude%20Code-compatible-d4af37">
  <img alt="Node 18+" src="https://img.shields.io/badge/node-%E2%89%A518-339933">
  <img alt="macOS · Linux · Windows" src="https://img.shields.io/badge/platform-macOS%20%C2%B7%20Linux%20%C2%B7%20Windows-lightgrey">
</p>

## 快速开始

```bash
git clone https://github.com/wyx-sg/wedding-invitation-skill \
  ~/.claude/skills/wedding-invitation
```

然后在 [Claude Code](https://claude.ai/code) 里说：

> 帮我做一张婚礼请帖。

Claude 会接着引导对话。不需要重启 — Claude Code 在当前会话就能识别新装的 skill。

## 你将得到

- 一张**为你专属设计**的 HTML 请帖 — 而不是从模板库里挑一张
- 一张**可印刷**的高清 PNG，1080×1440（或 1080×1920 的竖版海报）
- 用**你选择的语言**设计 — 中文、英文、西班牙文、日文、韩文，或任意双语组合
- 你的照片、姓名、地址**全程不出本机**

## 样例展示

下面 15 张请帖是**中文示例**，展示这个 skill 能产出的视觉风格。它们**不是**模板供你挑选 — 每一张都是从零设计的。你的请帖会用你选择的语言重新设计。

<table>
  <tr>
    <td align="center"><img src="examples/thumbnails/style01-new-chinese.png" width="160"><br><sub><b>新中式</b><br>refined traditional</sub></td>
    <td align="center"><img src="examples/thumbnails/style02-modern-minimal.png" width="160"><br><sub><b>现代极简</b><br>scandi minimalism</sub></td>
    <td align="center"><img src="examples/thumbnails/style03-morandi.png" width="160"><br><sub><b>莫兰迪</b><br>柔和当代</sub></td>
    <td align="center"><img src="examples/thumbnails/style04-red-gold.png" width="160"><br><sub><b>传统红金</b><br>宴会喜庆</sub></td>
    <td align="center"><img src="examples/thumbnails/style05-vogue.png" width="160"><br><sub><b>时尚杂志</b><br>editorial</sub></td>
  </tr>
  <tr>
    <td align="center"><img src="examples/thumbnails/style06-black-gold.png" width="160"><br><sub><b>黑金</b><br>正式 / monogram</sub></td>
    <td align="center"><img src="examples/thumbnails/style07-newspaper.png" width="160"><br><sub><b>复古报纸</b><br>old-print 风格</sub></td>
    <td align="center"><img src="examples/thumbnails/style08-letter.png" width="160"><br><sub><b>手写信笺</b><br>亲笔信</sub></td>
    <td align="center"><img src="examples/thumbnails/style09-gugong.png" width="160"><br><sub><b>故宫工笔</b><br>博物馆质感</sub></td>
    <td align="center"><img src="examples/thumbnails/style10-mediterranean.png" width="160"><br><sub><b>地中海</b><br>目的地 / 户外</sub></td>
  </tr>
  <tr>
    <td align="center"><img src="examples/thumbnails/style11-wabi-sabi.png" width="160"><br><sub><b>侘寂</b><br>日式克制</sub></td>
    <td align="center"><img src="examples/thumbnails/style12-art-deco.png" width="160"><br><sub><b>装饰艺术</b><br>Gatsby 时代</sub></td>
    <td align="center"><img src="examples/thumbnails/style13-ink-flower.png" width="160"><br><sub><b>水墨花卉</b><br>中式国画</sub></td>
    <td align="center"><img src="examples/thumbnails/style14-retro-poster.png" width="160"><br><sub><b>复古海报</b><br>旅行海报</sub></td>
    <td align="center"><img src="examples/thumbnails/style15-vintage-stars.png" width="160"><br><sub><b>复古星空</b><br>夜晚 / 浪漫</sub></td>
  </tr>
</table>

## 工作流程

1. **对话** — Claude 问你想要的语言、姓名、日期、场地、风格偏好
2. **预览** — Claude 在浏览器里展示几个候选风格方向供你视觉选择
3. **设计** — Claude 用你选的语言从零写一张专属 HTML 模板
4. **迭代** — 你说"字大一点""换张照片""配色再柔和"，Claude 实时调
5. **导出** — 一条命令把 HTML 截图成高清可印刷 PNG

## 系统要求

- **Node.js 18+**
- **Google Chrome、Chromium 或 Microsoft Edge** — 用于把 HTML 渲染成 PNG。skill 自带跨平台 Node 脚本 (`render.js`) 会自动定位你已装的浏览器。
- **macOS、Linux 或 Windows**

如果你没装 Chromium 系浏览器，脚本会按你的操作系统打印安装指引。

## 兼容其他编程 agent

| Agent | 使用方式 |
|---|---|
| **Claude Code** | 原生支持 — `git clone` 之后自动发现 |
| **Claude Agent SDK** | 支持 |
| Cursor / Aider / Codex CLI / Gemini CLI / 其他 | 任意路径 clone，告诉 agent："读一下 `SKILL.md`，然后帮我做一张请帖" |

部分交互用了 Claude Code 专属的 `AskUserQuestion` 工具做视觉选择；其他 agent 会自动降级为纯文本提问。

## 隐私

你的照片、姓名、地址全程不出本机。

- skill 本身**完全没有网络请求**。
- 浏览器预览时，渲染出来的 HTML 会从 `fonts.font.im`（Google Fonts 的国内镜像）加载字体 — 只有你的浏览器看得到，且只是字体 URL。如果想完全离线，可以把字体文件预下载到本地。
- 项目目录的 `.gitignore` 默认排除了 `photos/`、`data/wedding.json` 和 `dist/` — 即使你给婚礼项目 `git init`，数据也不会被追踪。
- 没有埋点、没有 analytics、没有第三方服务。

## 常见问题

**不用 Claude Code 能用吗？**
能。任何能读 markdown 的编程 agent 都能用，只是需要手动指它读 `SKILL.md`。自动发现是 Claude Code 独有的能力。

**这是个网站吗？**
不是。它产出一张静态 PNG，你可以打印、分享、加邮件附件，或者通过即时通讯软件发出去。

**支持哪些语言？**
任意语言。skill 一上来就会问。中文、英文、西班牙文、日文、韩文、法文，或者双语组合都行 — `design-principles.md` 里收录了主要文字系统的排印指引。

**能用我自己的照片吗？**
能。skill 会问你照片在本机的什么位置，然后复制到项目里。

**我的数据会不会泄露到网上？**
不会。项目目录默认 `.gitignore`，照片和细节都留在本地。

**Windows 上能跑吗？**
能。`render.js` 会调用你装的 Chrome / Chromium / Edge。skill 的文档里 macOS、Linux、Windows 命令都覆盖了。

## 许可

MIT — 见 [LICENSE](./LICENSE)。
