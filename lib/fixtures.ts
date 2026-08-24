import type { ContentItem, SourceResult } from "@/lib/types";

/**
 * 离线示例数据。
 *
 * 仅在设置了 DASHBOARD_FIXTURES=1 时启用，默认关闭 —— 正常运行永远走真实数据源。
 * 用途有两个：
 *   1. 网络不通 / 第三方 API 限流时仍能开发调试前端；
 *   2. 验证聚合、去重、排序、筛选、抽屉这些逻辑，不受上游内容变化干扰。
 * 启用时接口会返回 fixtures: true，页面顶部会显示醒目的「示例数据」提示。
 */
export function isFixtureMode(): boolean {
  return process.env.DASHBOARD_FIXTURES === "1";
}

const hoursAgo = (h: number) =>
  new Date(Date.now() - h * 60 * 60 * 1000).toISOString();

const hn = (
  id: string,
  title: string,
  summary: string,
  url: string,
  score: number,
  hours: number,
  tags: string[],
): ContentItem => ({
  id: `hn:${id}`,
  title,
  summary,
  url,
  sourceType: "community",
  sourceName: "Hacker News",
  score,
  publishedAt: hoursAgo(hours),
  tags,
});

const repo = (
  id: string,
  title: string,
  summary: string,
  score: number,
  hours: number,
  tags: string[],
): ContentItem => ({
  id: `github:${id}`,
  title,
  summary,
  url: `https://github.com/${title}`,
  sourceType: "skill_tool",
  sourceName: "GitHub",
  score,
  publishedAt: hoursAgo(hours),
  tags,
});

const article = (
  source: string,
  id: string,
  title: string,
  summary: string,
  url: string,
  score: number,
  hours: number,
  tags: string[],
): ContentItem => ({
  id: `rss:${source}:${id}`,
  title,
  summary,
  url,
  sourceType: "news",
  sourceName: source,
  score,
  publishedAt: hoursAgo(hours),
  tags,
});

export function fixtureHackerNews(): SourceResult {
  return {
    sourceName: "Hacker News",
    items: [
      hn(
        "f1",
        "Show HN: I built a local-first RAG pipeline that runs entirely on-device",
        "把检索和推理全部塞进本地，索引 20 万篇文档只用了 1.2GB 内存，作者详细写了向量量化的取舍。",
        "https://example.com/local-rag",
        842,
        3,
        ["rag", "llm", "embedding"],
      ),
      hn(
        "f2",
        "The bitter lesson of building AI agents in production",
        "作者复盘一年来把 agent 推上生产环境踩过的坑：工具调用比 prompt 重要，可观测性比模型重要。",
        "https://example.com/agents-bitter-lesson",
        613,
        9,
        ["agent", "agentic", "llm"],
      ),
      hn(
        "f3",
        "Ask HN: What is your actual daily LLM workflow in 2026?",
        "一条千楼讨论，大量开发者晒出自己真实的模型使用习惯，出乎意料的是本地小模型占比明显上升。",
        "https://news.ycombinator.com/item?id=f3",
        497,
        18,
        ["llm", "gpt"],
      ),
      hn(
        "f4",
        "Model Context Protocol is quietly becoming the USB-C of AI tooling",
        "一篇结构清晰的技术分析，解释 MCP 为什么在半年内被主流编辑器和 agent 框架集体采纳。",
        "https://example.com/mcp-usb-c",
        368,
        27,
        ["mcp", "model context protocol", "agent"],
      ),
      hn(
        "f5",
        "We cut our inference bill by 78% without changing models",
        "全部靠 prompt 缓存、批处理和路由到更小的模型，作者贴了完整的成本对比表。",
        "https://example.com/inference-bill",
        291,
        41,
        ["inference", "llm"],
      ),
      hn(
        "f6",
        "A skeptic's guide to evaluating AI coding assistants",
        "作者设计了一套不看 benchmark 的评测方法，用真实 PR 的通过率来衡量助手价值。",
        "https://example.com/eval-coding-assistants",
        204,
        56,
        ["ai", "copilot"],
      ),
    ],
  };
}

export function fixtureGithub(): SourceResult {
  return {
    sourceName: "GitHub",
    items: [
      repo(
        "g1",
        "openhands/skill-forge",
        "一个把任意 CLI 工具自动包装成 agent skill 的脚手架，支持 MCP server 一键导出。",
        4210,
        30,
        ["ai-agents", "mcp", "TypeScript"],
      ),
      repo(
        "g2",
        "vellum-ai/promptlab",
        "本地跑的 prompt 版本管理与 A/B 评测工具，带 diff 视图和回归测试。",
        2870,
        72,
        ["llm", "llmops", "Python"],
      ),
      repo(
        "g3",
        "trylumen/agent-sandbox",
        "给 AI agent 用的轻量沙箱运行时，毫秒级冷启动，默认无出网权限。",
        1955,
        120,
        ["ai-agents", "Rust"],
      ),
      repo(
        "g4",
        "kernelspace/tinyembed",
        "40MB 的嵌入模型推理库，纯 C 实现，可以直接编进桌面应用。",
        1408,
        200,
        ["embedding", "generative-ai", "C"],
      ),
      repo(
        "g5",
        "flowbase/mcp-registry",
        "社区维护的 MCP server 索引，带安装脚本和权限说明。",
        962,
        260,
        ["mcp", "llm", "Go"],
      ),
      repo(
        "g6",
        "arcticfox/llm-router",
        "按成本与延迟自动在多家模型之间路由的网关，支持 fallback 与预算上限。",
        734,
        330,
        ["llmops", "llm", "TypeScript"],
      ),
      repo(
        "g7",
        "nanocode/diffusion-kit",
        "面向产品工程师的扩散模型工具箱，封装了常见的图像编辑管线。",
        512,
        420,
        ["generative-ai", "diffusion", "Python"],
      ),
    ],
  };
}

export function fixtureRss(): SourceResult[] {
  return [
    {
      sourceName: "TechCrunch AI",
      items: [
        article(
          "TechCrunch AI",
          "t1",
          "AI 初创公司融资节奏回落，投资人开始追问单位经济模型",
          "多家机构表示，2026 年下半年的尽调重点从模型能力转向毛利率和留存曲线。",
          "https://example.com/tc-funding",
          100,
          2,
          ["ai", "机器学习"],
        ),
        article(
          "TechCrunch AI",
          "t2",
          "监管机构对通用 agent 的自动化操作提出新的披露要求",
          "新规要求任何代表用户执行不可逆操作的 agent 必须留存可审计日志。",
          "https://example.com/tc-regulation",
          100,
          11,
          ["agent", "ai"],
        ),
      ],
    },
    {
      sourceName: "The Verge AI",
      items: [
        article(
          "The Verge AI",
          "v1",
          "新一代设备端助手把多模态输入做成了系统级能力",
          "厂商演示了摄像头、剪贴板与本地文件同时作为上下文输入的交互方式。",
          "https://example.com/verge-ondevice",
          100,
          6,
          ["multimodal", "ai"],
        ),
        article(
          "The Verge AI",
          "v2",
          "开源模型在长上下文任务上首次追平闭源旗舰",
          "在公开的长文档问答基准上，两者差距缩小到统计噪声范围内。",
          "https://example.com/verge-openweights",
          88,
          33,
          ["llm", "开源"],
        ),
      ],
    },
    {
      sourceName: "OpenAI Blog",
      items: [
        {
          id: "rss:OpenAI Blog:o1",
          title: "开发者平台上线结构化工具调用的批量执行接口",
          summary:
            "新接口允许一次提交多个工具调用计划，显著降低多步 agent 任务的往返延迟。",
          url: "https://example.com/openai-batch-tools",
          sourceType: "skill_tool",
          sourceName: "OpenAI Blog",
          score: 100,
          publishedAt: hoursAgo(14),
          tags: ["agent", "gpt"],
        },
      ],
    },
    {
      sourceName: "Hugging Face Blog",
      items: [
        {
          id: "rss:Hugging Face Blog:h1",
          title: "Spaces 新增 skill 打包格式，一次定义到处调用",
          summary:
            "作者可以把一个 Space 声明成 skill，其它 agent 框架可直接发现并调用它。",
          url: "https://example.com/hf-skill-format",
          sourceType: "skill_tool",
          sourceName: "Hugging Face Blog",
          score: 95,
          publishedAt: hoursAgo(29),
          tags: ["skill", "huggingface"],
        },
      ],
    },
  ];
}
