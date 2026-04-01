# 订阅监控 · Pure

> 基于 Cloudflare Workers 构建的代理订阅流量监控面板，支持多订阅源实时追踪双向流量与到期状态。

![Version](https://img.shields.io/badge/version-5.1.0-blue) ![Platform](https://img.shields.io/badge/platform-Cloudflare%20Workers-orange) ![License](https://img.shields.io/badge/license-MIT-green)

---

## ✨ 功能特性

- **多订阅聚合** — 同时监控多个机场/订阅源，集中展示
- **实时流量统计** — 显示上传量、下载量、已用流量、总流量及使用百分比
- **到期日提醒** — 自动解析并展示订阅到期时间
- **进度条可视化** — 直观呈现流量使用情况，超量时自动变色预警
- **深色 / 浅色主题** — 胶囊式开关，偏好自动持久化
- **骨架屏加载** — 数据加载期间展示占位动画，体验流畅
- **一键刷新** — 点击刷新按钮即可重新拉取最新数据
- **响应式布局** — 移动端、平板、桌面端均可完美适配

---

## 🚀 快速部署

### 前提条件

- 一个 [Cloudflare](https://cloudflare.com) 账号
- 已安装 [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/install-and-update/)（可选，用于命令行部署）

### 方式一：Cloudflare Dashboard（推荐新手）

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com)
2. 进入 **Workers & Pages** → 点击 **Create Application** → **Create Worker**
3. 将 `worker.js` 的全部内容粘贴到编辑器中
4. 修改顶部 `SUBSCRIPTIONS` 配置（见下方说明）
5. 点击 **Save and Deploy**，完成！

### 方式二：Wrangler CLI

```bash
# 1. 安装 Wrangler
npm install -g wrangler

# 2. 登录 Cloudflare
wrangler login

# 3. 部署 Worker
wrangler deploy worker.js --name sub-monitor
```

---

## ⚙️ 配置说明

打开 `worker.js`，修改文件顶部的 `SUBSCRIPTIONS` 数组，填入你自己的订阅信息：

```js
const SUBSCRIPTIONS = [
  {
    name: "主力机场",           // 显示在面板上的名称，可自定义
    url: "https://your-sub-url" // 你的订阅链接
  },
  {
    name: "备用机场 A",
    url: "https://your-backup-url-a"
  },
  // 可继续添加更多订阅...
];
```

> **注意：** 订阅链接需支持返回 `Subscription-Userinfo` 响应头，大多数主流机场的 Clash/V2Ray 订阅链接均支持此标准。

---

## 📡 API 接口

| 路径 | 方法 | 说明 |
|------|------|------|
| `/` | `GET` | 返回监控面板 HTML 页面 |
| `/api/traffic` | `GET` | 返回所有订阅的流量 JSON 数据 |

### `/api/traffic` 响应示例

```json
[
  {
    "name": "主力机场",
    "up_gb": "1.23",
    "dl_gb": "45.67",
    "used_gb": "46.90",
    "total_gb": "100.00",
    "usage_percent": "46.9",
    "expire_date": "2026-12-31"
  }
]
```

字段含义：

| 字段 | 类型 | 说明 |
|------|------|------|
| `name` | string | 订阅名称 |
| `up_gb` | string | 上传量（GB） |
| `dl_gb` | string | 下载量（GB） |
| `used_gb` | string | 总已用流量（GB） |
| `total_gb` | string | 套餐总流量（GB） |
| `usage_percent` | string | 使用百分比（%） |
| `expire_date` | string | 到期日期（YYYY-MM-DD），无期限则为 `"无期限"` |
| `error` | boolean | 请求失败时为 `true` |

---

## 🎨 界面预览

面板采用极简设计风格，主要元素：

- **顶部标题栏** — 页面标题 + 主题切换开关 + 刷新按钮
- **订阅卡片网格** — 每张卡片展示一个订阅的完整信息
- **流量进度条** — 颜色随使用率变化：正常（蓝）→ 警戒（橙）→ 超量（红）
- **底部页脚** — 版本号与版权信息

---

## 📁 项目结构

```
.
└── worker.js        # 全量单文件 Worker（前端页面 + 后端 API 一体）
```

本项目为 **单文件架构**，所有逻辑（路由、API、HTML/CSS/JS）均内联于 `worker.js`，无需构建工具，部署零依赖。

---

## 🔧 技术栈

| 技术 | 用途 |
|------|------|
| Cloudflare Workers | 边缘运行时，全球低延迟 |
| Tailwind CSS (CDN) | 快速样式构建 |
| Vanilla JavaScript | 前端交互逻辑 |

---

## 📝 许可证

© 2022 - 2026 **CcoMm** · 极光纯净版

本项目仅供学习与个人使用，请勿用于任何违反当地法律法规的用途。