/**
 * 「全球看中国」板块的信源与关键词配置。
 *
 * 一条原则：**只做主题过滤，不做立场过滤。**
 * 这里没有、也不打算加任何情绪/倾向判分 —— 正面负面一律照单全收，
 * 观感留给人自己看。关键词只用来判断「是不是在讲中国」，
 * 不参与判断「讲得好不好」。
 *
 * 同样地，各家媒体本身的立场差异很大，所以卡片上始终显示来源名，
 * 二级页可以按来源筛选，方便对比同一件事不同媒体怎么写。
 */
import type { FeedConfig } from "@/config/keywords";

/** 命中任意一个即认为与中国相关。全部小写。 */
export const CHINA_KEYWORDS: string[] = [
  // 国家 / 地区
  "china",
  "chinese",
  "prc",
  "beijing",
  "shanghai",
  "shenzhen",
  "guangdong",
  "hong kong",
  "macau",
  "taiwan",
  "taipei",
  "xinjiang",
  "uyghur",
  "uighur",
  "tibet",
  "south china sea",
  // 政治 / 军事
  "xi jinping",
  "communist party",
  "politburo",
  "people's liberation army",
  "pla",
  "belt and road",
  "one china",
  // 经济 / 企业
  "renminbi",
  "yuan",
  "huawei",
  "tiktok",
  "bytedance",
  "alibaba",
  "tencent",
  "xiaomi",
  "byd",
  "catl",
  "smic",
  "deepseek",
  "shein",
  "temu",
  // 中文
  "中国",
  "中方",
  "北京",
];

/**
 * 噪音词：命中这些的条目会被丢掉。
 * "bone china" 是瓷器，"china cabinet" 是餐边柜，都跟国家无关。
 */
export const CHINA_NOISE_KEYWORDS: string[] = [
  "bone china",
  "china cabinet",
  "china plate",
  "fine china",
];

/**
 * 全球主要媒体的 RSS 源。
 * 刻意覆盖不同立场和地区：英美、欧洲、中东、亚太、以及港媒，
 * 这样「整体感知」才不是单一视角的回声。
 *
 * 注意：这些源全部会再过一遍中国关键词，所以放综合新闻 feed 也没关系，
 * 非涉华的内容会被过滤掉。
 */
export const CHINA_FEEDS: FeedConfig[] = [
  {
    name: "BBC 中国",
    url: "https://feeds.bbci.co.uk/news/world/asia/china/rss.xml",
    sourceType: "china_watch",
  },
  {
    name: "The Guardian 中国",
    url: "https://www.theguardian.com/world/china/rss",
    sourceType: "china_watch",
  },
  {
    name: "NYT 亚太",
    url: "https://rss.nytimes.com/services/xml/rss/nyt/AsiaPacific.xml",
    sourceType: "china_watch",
  },
  {
    name: "SCMP 南华早报",
    url: "https://www.scmp.com/rss/91/feed",
    sourceType: "china_watch",
  },
  {
    name: "Al Jazeera",
    url: "https://www.aljazeera.com/xml/rss/all.xml",
    sourceType: "china_watch",
  },
  {
    name: "德国之声 DW",
    url: "https://rss.dw.com/rdf/rss-en-world",
    sourceType: "china_watch",
  },
  {
    name: "France 24 亚太",
    url: "https://www.france24.com/en/asia-pacific/rss",
    sourceType: "china_watch",
  },
  {
    name: "日经亚洲",
    url: "https://asia.nikkei.com/rss/feed/nar",
    sourceType: "china_watch",
  },
  {
    name: "The Diplomat",
    url: "https://thediplomat.com/feed/",
    sourceType: "china_watch",
  },
  {
    name: "NPR 国际",
    url: "https://feeds.npr.org/1004/rss.xml",
    sourceType: "china_watch",
  },
  {
    // Google News 的搜索 RSS 是个聚合器，能把 Reuters / AP / WSJ / Bloomberg
    // 这些自己不再提供公开 RSS 的通讯社也捞进来，覆盖面最广的一个源。
    name: "Google News 涉华",
    url: "https://news.google.com/rss/search?q=China&hl=en-US&gl=US&ceid=US:en",
    sourceType: "china_watch",
  },
];

/** 每个涉华源最多取多少条 */
export const CHINA_ITEMS_PER_FEED = 15;

/** 只保留最近 N 天的涉华条目 */
export const CHINA_RECENT_DAYS = 7;

/**
 * Reddit：看普通网民而不是编辑部怎么聊中国。
 * Reddit 的 .json 接口免 Key，但对 UA 敏感，必须带一个像样的 User-Agent。
 */
export const REDDIT_QUERIES: { subreddit: string; query: string }[] = [
  { subreddit: "worldnews", query: "China" },
  { subreddit: "geopolitics", query: "China" },
  { subreddit: "China", query: "" },
];

/** Reddit 帖子最低赞数 */
export const REDDIT_MIN_SCORE = 50;

/**
 * Bluesky：X 的免费替代。
 * 公共 AppView 接口免登录、免 Key，直接能搜全站帖子，
 * 用来感受社交平台上的即时议论。
 */
export const BLUESKY_QUERIES: string[] = ["China", "Chinese economy", "Taiwan China"];

/** Bluesky 帖子最低互动数（赞 + 转），过滤掉自言自语 */
export const BLUESKY_MIN_ENGAGEMENT = 10;

/**
 * X（原 Twitter）：X 在 2023 年取消了免费的搜索 API，
 * recent search 属于付费档位，所以这个源默认关闭。
 * 有付费 App 的话把 Bearer Token 填到 X_BEARER_TOKEN 就会自动启用。
 */
export const X_QUERIES: string[] = ["China -is:retweet lang:en"];

/** X 推文最低互动数（赞 + 转） */
export const X_MIN_ENGAGEMENT = 20;

const lowerChina = CHINA_KEYWORDS.map((k) => k.toLowerCase());
const lowerNoise = CHINA_NOISE_KEYWORDS.map((k) => k.toLowerCase());

/** 判断一段文本是不是在讲中国。只判主题，不判立场。 */
export function matchesChinaKeywords(
  ...parts: (string | undefined | null)[]
): boolean {
  const text = parts.filter(Boolean).join(" ").toLowerCase();
  if (!text) return false;
  if (lowerNoise.some((n) => text.includes(n))) return false;
  return lowerChina.some((k) => isWordMatch(text, k));
}

/** 从文本里提取命中的关键词，作为卡片上的 tags */
export function extractChinaTags(...parts: (string | undefined | null)[]): string[] {
  const text = parts.filter(Boolean).join(" ").toLowerCase();
  const hits = lowerChina.filter((k) => isWordMatch(text, k));
  return Array.from(new Set(hits)).slice(0, 4);
}

/** 短词（pla / prc / yuan 等）要求词边界，否则 "plan"、"yuan" 之类会误命中 */
function isWordMatch(text: string, keyword: string): boolean {
  if (keyword.length > 4 || /[^\x00-\x7F]/.test(keyword)) {
    return text.includes(keyword);
  }
  const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(^|[^a-z0-9])${escaped}([^a-z0-9]|$)`, "i").test(text);
}
