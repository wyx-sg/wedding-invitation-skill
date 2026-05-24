<p align="right"><a href="./README.md">English</a> · <strong>简体中文</strong></p>

# 婚礼请帖

> 一个 AI agent skill，通过对话为你设计专属婚礼请帖 — 任意语言、任意风格、本地渲染、数据不外传。

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

然后在 [Claude Code](https://claude.ai/code) 里调用 skill：

```
/wedding-invitation
```

或者直接说"帮我做一张婚礼请帖"。两种都行 — Claude 会接着引导对话，不需要重启 Claude Code。

## 你将得到

- 一张**为你专属设计**的 HTML 请帖 — 而不是从模板库里挑一张
- 一张**可印刷**的高清 PNG，1080×1440（或 1080×1920 的竖版海报）
- 用**你选择的语言**设计 — 中文、英文、西班牙文、日文、韩文，或任意双语组合
- 你的照片、姓名、地址**全程不出本机**

上图中 20 张样例覆盖了世界各种文化和当代风格：

- **中式** — `新中式`、`传统红金`、`故宫工笔`、`水墨花卉`
- **日式** — `侘寂`
- **韩式** — `Hanbok`
- **南亚** — `印度`
- **中东** — `阿拉伯`
- **拉美** — `Latin / 墨西哥民俗`
- **欧式** — `法式普罗旺斯`、`Art Deco`、`时尚杂志`、`复古报纸`、`手写信笺`
- **当代** — `莫兰迪`、`现代极简`、`地中海`、`黑金`
- **主题** — `复古海报`、`复古星空`

它们**不是**模板供你挑选 — 每一张都是一次性的、从零设计的。你的请帖会按你选的语言和风格方向重新设计。

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

照片、姓名、地址全程不出本机。不上传、不开账号、没有埋点、没有第三方服务。

skill 自己完全不请求网络。唯一会走网络的是浏览器预览时加载 Google Fonts — 也只是字体 URL，不含任何你的数据。

## 常见问题

<details>
<summary><b>不用 Claude Code 能用吗？</b></summary>

能。任何能读 markdown 的编程 agent 都能用，只是需要手动指它读 `SKILL.md`。自动发现是 Claude Code 独有的能力。

</details>

<details>
<summary><b>这是个网站吗？</b></summary>

不是。它产出一张静态 PNG，你可以打印、分享、加邮件附件，或者通过即时通讯软件发出去。

</details>

<details>
<summary><b>支持哪些语言？</b></summary>

任意语言。skill 一上来就会问。中文、英文、西班牙文、日文、韩文、法文，或者双语组合都行 — `design-principles.md` 里收录了主要文字系统的排印指引。

</details>

<details>
<summary><b>能用我自己的照片吗？</b></summary>

能。skill 会问你照片在本机的什么位置，然后复制到项目里。

</details>

<details>
<summary><b>Windows 上能跑吗？</b></summary>

能。`render.js` 会调用你装的 Chrome / Chromium / Edge。skill 文档里的 bash 命令都有对应的 PowerShell 写法。

</details>

## 许可

MIT — 见 [LICENSE](./LICENSE)。
