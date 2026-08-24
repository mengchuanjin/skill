# AI 热点与 Skill 雷达

一个页面看完当下 AI 圈在讨论什么、有什么新工具/Skill 发布。个人用的本地看板，无登录、无数据库。

![两个板块的深色看板界面](docs/preview.png)

<sub>截图跑在 `DASHBOARD_FIXTURES=1` 的离线示例数据下，所以顶部有黄色提示条；接真实数据源时没有这一条。</sub>

## 快速开始

```bash
npm install
npm run dev
```

打开 http://localhost:3000 即可，无需任何配置。想调整可选项就复制 `.env.example` 成 `.env.local`。

## 它做什么

页面分成两个独立板块，不做统一信息流：

| 板块 | 内容 | 数据来源 |
|---|---|---|
| **热门话题** | AI 资讯 + 社区讨论 | Hacker News、TechCrunch AI、The Verge AI、Ars Technica、VentureBeat、MIT Tech Review |
| **最新 Skill / 工具** | 新发布的工具与项目 | GitHub Search、OpenAI Blog、Hugging Face Blog |

每个板块都支持按来源筛选、按「热度 / 最新」切换排序。点卡片从右侧滑出详情抽屉，底部「查看原文」新标签页打开原链接。

Header 有手动刷新按钮（带 loading 态）和最后更新时间；页面开着时每 45 分钟自动刷新一次，靠前端定时器实现，没有服务端常驻任务。

## 数据源都不要 API Key

| 源 | 接入方式 | 限额 |
|---|---|---|
| Hacker News | Algolia HN Search API | 免 Key |
| GitHub | REST Search API，按 topic + star + 创建时间过滤 | 未认证 60 次/小时，配 token 可提额 |
| RSS | `rss-parser` 解析各媒体分类 feed | 无 |

后端有 5 分钟内存缓存，所以正常翻页不会反复打上游；点手动刷新会带 `?refresh=1` 跳过缓存真正回源。

**任何一个源挂掉都不会影响其它源** —— 失败的源会在页脚「数据源状态」里标红，页面照常展示其余内容。

## 改关键词和信源

抓取逻辑里没有写死任何关键词，全部集中在 [`config/keywords.ts`](config/keywords.ts)：

- `AI_KEYWORDS` — 命中任意一个就算 AI 相关（HN、综合媒体需要过滤，本身就是 AI 专属的源不过滤）
- `NOISE_KEYWORDS` — 反向过滤，挡掉 "real estate agent" 这类误伤
- `HN_QUERIES` / `HN_MIN_POINTS` — HN 搜哪些词、多少分以上才展示
- `GITHUB_TOPICS` / `GITHUB_MIN_STARS` / `GITHUB_RECENT_DAYS` — GitHub 的 topic 与门槛
- `RSS_FEEDS` — 增删 RSS 源，顺便决定它归到哪个板块

短关键词（`ai`、`llm`、`gpt` 等 3 字符以内）走词边界匹配，不会被 "chair"、"rail" 这类词误命中。

## API

前端只请求 `/api/dashboard`，聚合、去重、排序都在后端做。

```
GET /api/sources/hn        单独看 Hacker News 抓到了什么
GET /api/sources/github    单独看 GitHub
GET /api/sources/rss       单独看各 RSS 源（按源分开返回）
GET /api/dashboard         聚合结果
    ?sourceType=news|skill_tool|community
    ?sort=score|date
    ?refresh=1             跳过 5 分钟缓存
```

所有源都统一转换成同一个 [`ContentItem`](lib/types.ts)，前端不感知任何第三方 API 的原始结构。去重先按 id、再按规范化 URL（去掉 www / query / hash），同一篇文章同时出现在 HN 和 RSS 里时保留热度高的那条。

## 环境变量

全部可选，见 [`.env.example`](.env.example)：

- `DASHBOARD_GITHUB_TOKEN` — GitHub 只读 token，把 60 次/小时提到 5000 次/小时
- `NEXT_PUBLIC_REFRESH_INTERVAL_MINUTES` — 自动刷新间隔，默认 45；调成 `0.1` 可以在 20 秒内验证自动刷新逻辑
- `DASHBOARD_FIXTURES=1` — 用内置离线示例数据，一个第三方接口都不打，适合断网开发。启用时页面顶部会有醒目提示，不会被误当成真实数据

## 技术栈

Next.js 16（App Router）+ TypeScript + Tailwind CSS v4 + Radix UI（Sheet / Select，shadcn/ui 风格组件直接放在 `components/ui/`）+ SWR。

## 目录

```
config/keywords.ts     关键词、信源、阈值 —— 要调的东西都在这
lib/types.ts           ContentItem 统一数据模型
lib/sources/           三个源各自的抓取 + 转换
lib/aggregate.ts       聚合、去重、排序
lib/cache.ts           5 分钟内存缓存（含并发请求合并）
lib/fixtures.ts        离线示例数据
app/api/               API Routes
components/            看板 UI
```

## 明确不做

无用户体系、无数据库、无历史趋势、无全网爬虫、无搜索框、无收藏、无服务端 cron。只展示当前快照。
