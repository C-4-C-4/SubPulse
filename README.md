# 订阅监控看板 (Subscription Monitor • Pure)

## 📌 项目简介
这是一个基于 Cloudflare Workers 构建的轻量级、无服务器（Serverless）订阅流量监控看板。该程序将后端 API 解析与前端页面渲染集于一身，能够定时获取指定代理节点订阅链接（如 V2Ray、Clash 等）的流量信息，并通过一个具有现代化 UI 设计的页面进行实时可视化展示。
版本信息：**STABLE V1**

## ✨ 核心特性

### 后端 (API 层)

- **并发数据获取**: 使用 `Promise.all` 异步并发请求多个订阅链接，极大缩短数据获取时间。
- **严格超时控制**: 内置 `fetchWithTimeout` 机制（默认 5 秒），防止因单个异常节点响应过慢而阻塞整个页面的加载。
- **精准请求模拟**: 请求头部伪装为 `v2rayN/6.23`，以确保兼容大部分机场/服务商的订阅下发策略。
- **智能数据提取**: 自动解析 HTTP 响应头中的 `Subscription-Userinfo` 字段，提取 `upload`、`download`、`total` 和 `expire` 数据，并自动换算为 GB 单位。
- **内置缓存控制**: 接口级设置 `Cache-Control: public, max-age=60`，静态 HTML 缓存 `3600` 秒，有效降低源站 API 压力。

### 前端 (UI 层)

- **现代化纯粹设计**: 采用 "Pure" 主题理念，基于 Tailwind CSS 构建高斯模糊卡片（毛玻璃效果）、渐变高亮背景和丝滑的动画过渡。
- **骨架屏加载**: 数据请求期间提供 Skeleton 骨架屏动画，拒绝白屏等待，提升用户体验。
- **动态状态反馈**:
  - 根据流量使用比例自动改变进度条和数值的颜色（正常、警告、危险）。
  - 遇到无法连接或解析失败的节点时，展示专属的红色“异常” UI 样式。
- **完善的暗黑模式**: 支持自动检测并跟随系统主题，同时提供一个带丝滑动画的“日月胶囊开关”供手动切换（偏好会自动保存至 `localStorage`）。

## 🛠️ 技术栈

- **运行环境**: Cloudflare Workers
- **前端样式**: Tailwind CSS (通过 CDN 引入) + 原生 CSS 变量
- **前端逻辑**: Vanilla JavaScript

## ⚙️ 配置指南
在部署之前，你只需要修改代码最顶部的 `SUBSCRIPTIONS` 数组即可：

```javascript
// 1. 订阅地址配置区
const SUBSCRIPTIONS = [
  { name: "你的主用机场", url: "https://your-sub-link-1.com/xxx" },
  { name: "备用节点 A", url: "https://your-sub-link-2.com/xxx" },
  { name: "备用节点 B", url: "https://your-sub-link-3.com/xxx" }
];

```

- **name**: 显示在面板上的自定义名称。
- **url**: 你的真实订阅链接。

## 📡 API 接口参考
该 Worker 自带一个隐藏的数据接口，供前端 AJAX 调用。

- **路径**: `/api/traffic`
- **请求方式**: `GET`
- **响应格式**: JSON 数组
- **数据结构示例**:

```json
[
  {
    "name": "你的主用机场",
    "up_gb": "12.50",
    "dl_gb": "180.20",
    "used_gb": "192.70",
    "total_gb": "500.00",
    "usage_percent": "38.5",
    "expire_date": "2026-12-31"
  },
  {
    "name": "备用节点 A",
    "error": true
  }
]

```

## 🚀 部署说明

1. 登录 Cloudflare Dashboard。
2. 导航至 **Workers & Pages**，点击 **Create Worker**。
3. 为你的应用输入一个名称，点击 **Deploy**。
4. 部署完成后，点击 **Edit code** 进入网页编辑器。
5. 将本地 `worker.js` 中的所有代码粘贴并覆盖编辑器内的默认代码。
6. 修改代码第 2-6 行的 `SUBSCRIPTIONS` 配置为你自己的订阅信息。
7. 点击右上角的 **Save and deploy**。
8. 访问 Cloudflare 分配的 `*.workers.dev` 域名即可查看你的专属监控看板。