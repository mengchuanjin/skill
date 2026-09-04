import type { SourceType } from "@/lib/types";

/**
 * AI 相关关键词配置。
 *
 * 抓取逻辑不允许写死任何关键词 —— 全部集中在这个文件里，方便随时增删调整。
 * 修改后重启 dev server（或等 5 分钟缓存过期）即可生效。
 */

/** 命中任意一个即认为与 AI 相关。全部小写，匹配时对标题/摘要做小写化处理。 */
export const AI_KEYWORDS: string[] = [
  // 通用
  "ai",
  "a.i.",
  "artificial intelligence",
  "machine learning",
  "deep learning",
  "neural network",
  "transformer",
  "inference",
  "fine-tune",
  "fine tuning",
  "embedding",
  "rag",
  "vector database",
  "multimodal",
  "diffusion",
  "generative",
  // 模型 / 厂商
  "llm",
  "gpt",
  "chatgpt",
  "openai",
  "claude",
  "anthropic",
  "gemini",
  "deepmind",
  "llama",
  "mistral",
  "qwen",
  "deepseek",
  "grok",
  "copilot",
  "perplexity",
  "hugging face",
  "huggingface",
  "ollama",
  "stable diffusion",
  "midjourney",
  "sora",
  // Agent / 工具生态
  "agent",
  "agentic",
  "mcp",
  "model context protocol",
  "skill",
  "prompt",
  "langchain",
  "llamaindex",
  "vibe coding",
  "cursor",
  "codex",
  // 中文
  "人工智能",
  "机器学习",
  "深度学习",
  "大模型",
  "智能体",
  "多模态",
  "提示词",
];

/**
 * 噪音词：命中这些的条目会被丢掉。
 * 主要挡掉 "agent"（保险中介 / 房产经纪）、"ai" 作为人名或地名子串等误伤。
 */
export const NOISE_KEYWORDS: string[] = [
  "real estate agent",
  "insurance agent",
  "travel agent",
  "free agent",
  "federal agent",
  "user agent",
];

/**
 * HN 搜索用的查询词。每个词都会独立打一次 Algolia HN Search API，
 * 结果合并去重。词太多会拖慢接口，建议控制在 6 个以内。
 */
export const HN_QUERIES: string[] = ["AI", "LLM", "GPT", "Claude", "AI agent"];

/** HN story 的最低点数门槛，低于此值不展示 */
export const HN_MIN_POINTS = 30;

/**
 * GitHub 搜索用的 topic。用于抓「最新 Skill / 工具」板块。
 * 参考 https://github.com/topics
 */
export const GITHUB_TOPICS: string[] = [
  "llm",
  "ai-agents",
  "mcp",
  "generative-ai",
  "llmops",
];

/** GitHub 仓库最低 star 数 */
export const GITHUB_MIN_STARS = 30;

/** 只看最近 N 天内创建/推送的仓库，保证「最新」 */
export const GITHUB_RECENT_DAYS = 60;

/**
 * AI 新闻 RSS 源。
 * 任意一个源解析失败不会影响其它源，只会在 Header 的来源状态里标红。
 */
export interface FeedConfig {
  /** 展示用的来源名，会成为 ContentItem.sourceName */
  name: string;
  url: string;
  /** 该源的条目归到哪个板块 */
  sourceType: SourceType;
  /**
   * true = 整个源都是本主题的，跳过关键词过滤。
   * 只在确定该 feed 不会混入无关内容时才设（如 OpenAI 官方博客）。
   */
  topical?: boolean;
}

export const RSS_FEEDS: FeedConfig[] = [
  {
    name: "TechCrunch AI",
    url: "https://techcrunch.com/category/artificial-intelligence/feed/",
    sourceType: "news",
  },
  {
    name: "VentureBeat AI",
    url: "https://venturebeat.com/category/ai/feed/",
    sourceType: "news",
  },
  {
    name: "The Verge AI",
    url: "https://www.theverge.com/rss/ai-artificial-intelligence/index.xml",
    sourceType: "news",
  },
  {
    name: "Ars Technica AI",
    url: "https://arstechnica.com/ai/feed/",
    sourceType: "news",
  },
  {
    name: "MIT Tech Review AI",
    url: "https://www.technologyreview.com/topic/artificial-intelligence/feed",
    sourceType: "news",
  },
  {
    name: "OpenAI Blog",
    url: "https://openai.com/news/rss.xml",
    sourceType: "skill_tool",
    topical: true,
  },
  {
    name: "Hugging Face Blog",
    url: "https://huggingface.co/blog/feed.xml",
    sourceType: "skill_tool",
    topical: true,
  },
];

/** 每个 RSS 源最多取多少条 */
export const RSS_ITEMS_PER_FEED = 12;

/** 只保留最近 N 天的 RSS 条目 */
export const RSS_RECENT_DAYS = 14;

const lowerAi = AI_KEYWORDS.map((k) => k.toLowerCase());
const lowerNoise = NOISE_KEYWORDS.map((k) => k.toLowerCase());

/** 判断一段文本是否与 AI 相关 */
export function matchesAiKeywords(...parts: (string | undefined | null)[]): boolean {
  const text = parts.filter(Boolean).join(" ").toLowerCase();
  if (!text) return false;
  if (lowerNoise.some((n) => text.includes(n))) return false;
  return lowerAi.some((k) => isWordMatch(text, k));
}

/** 从文本里提取命中的关键词，作为卡片上的 tags */
export function extractTags(...parts: (string | undefined | null)[]): string[] {
  const text = parts.filter(Boolean).join(" ").toLowerCase();
  const hits = lowerAi.filter((k) => isWordMatch(text, k));
  return Array.from(new Set(hits)).slice(0, 4);
}

/**
 * 短关键词（<= 3 字符，如 ai / llm / gpt / rag / mcp）要求词边界匹配，
 * 否则 "chair"、"rail" 这类词会被 "ai" 误命中。
 */
function isWordMatch(text: string, keyword: string): boolean {
  if (keyword.length > 3 || /[^\x00-\x7F]/.test(keyword)) {
    return text.includes(keyword);
  }
  const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(^|[^a-z0-9])${escaped}([^a-z0-9]|$)`, "i").test(text);
}
