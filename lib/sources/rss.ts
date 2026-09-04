import Parser from "rss-parser";
import {
  RSS_FEEDS,
  RSS_ITEMS_PER_FEED,
  RSS_RECENT_DAYS,
  extractTags,
  matchesAiKeywords,
  type FeedConfig,
} from "@/config/keywords";
import {
  CHINA_FEEDS,
  CHINA_ITEMS_PER_FEED,
  CHINA_RECENT_DAYS,
  extractChinaTags,
  matchesChinaKeywords,
} from "@/config/china";
import { fetchWithTimeout, toIso, toSummary } from "@/lib/fetch-utils";
import type { ContentItem, SourceResult } from "@/lib/types";

const parser = new Parser({
  timeout: 8_000,
  customFields: { item: [["content:encoded", "contentEncoded"]] },
});

interface FeedItem {
  guid?: string;
  link?: string;
  title?: string;
  contentSnippet?: string;
  content?: string;
  contentEncoded?: string;
  summary?: string;
  isoDate?: string;
  pubDate?: string;
  categories?: string[];
}

/** 一组 feed 的抓取参数：主题匹配器、tag 提取器、条数与时间窗口 */
interface FeedGroup {
  feeds: FeedConfig[];
  matches: (...parts: (string | undefined | null)[]) => boolean;
  extractTags: (...parts: (string | undefined | null)[]) => string[];
  itemsPerFeed: number;
  recentDays: number;
}

const AI_GROUP: FeedGroup = {
  feeds: RSS_FEEDS,
  matches: matchesAiKeywords,
  extractTags,
  itemsPerFeed: RSS_ITEMS_PER_FEED,
  recentDays: RSS_RECENT_DAYS,
};

const CHINA_GROUP: FeedGroup = {
  feeds: CHINA_FEEDS,
  matches: matchesChinaKeywords,
  extractTags: extractChinaTags,
  itemsPerFeed: CHINA_ITEMS_PER_FEED,
  recentDays: CHINA_RECENT_DAYS,
};

/** AI 新闻资讯。每个源独立抓取，失败只影响自己。 */
export function fetchRssFeeds(): Promise<SourceResult[]> {
  return fetchGroup(AI_GROUP);
}

/** 全球媒体的涉华报道。同样逐源独立，一个挂了不影响其它。 */
export function fetchChinaFeeds(): Promise<SourceResult[]> {
  return fetchGroup(CHINA_GROUP);
}

/**
 * 返回按 sourceName 拆开的多个结果，
 * 好让 Header 和页脚能逐个源显示状态。
 */
async function fetchGroup(group: FeedGroup): Promise<SourceResult[]> {
  const results = await Promise.allSettled(
    group.feeds.map((feed) => fetchOneFeed(feed, group)),
  );

  return results.map((result, index) => {
    const feed = group.feeds[index];
    if (result.status === "fulfilled") return result.value;
    return {
      sourceName: feed.name,
      items: [],
      error:
        result.reason instanceof Error
          ? result.reason.message
          : String(result.reason),
    };
  });
}

async function fetchOneFeed(
  feed: FeedConfig,
  group: FeedGroup,
): Promise<SourceResult> {
  // 走自己的 fetch 而不是 rss-parser 内置的 http，这样超时和 UA 行为统一
  const res = await fetchWithTimeout(feed.url, {
    headers: { Accept: "application/rss+xml, application/xml, text/xml, */*" },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);

  const xml = await res.text();
  const parsed = await parser.parseString(xml);
  const cutoff = Date.now() - group.recentDays * 24 * 60 * 60 * 1000;

  const items = ((parsed.items ?? []) as FeedItem[])
    .flatMap((item) => toContentItem(item, feed, group))
    .filter((item) => new Date(item.publishedAt).getTime() >= cutoff)
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
    .slice(0, group.itemsPerFeed);

  return { sourceName: feed.name, items };
}

function toContentItem(
  item: FeedItem,
  feed: FeedConfig,
  group: FeedGroup,
): ContentItem[] {
  const title = item.title?.trim();
  const url = item.link?.trim();
  if (!title || !url) return [];

  const body = item.contentSnippet ?? item.summary ?? item.contentEncoded ?? item.content;

  // topical 的源整站都是本主题（如 OpenAI 官方博客），不必再过关键词；
  // 综合媒体的 feed 会混入无关内容，必须过滤。
  if (!feed.topical && !group.matches(title, body, ...(item.categories ?? []))) {
    return [];
  }

  const publishedAt = toIso(item.isoDate ?? item.pubDate);

  return [
    {
      id: `rss:${feed.name}:${item.guid ?? url}`,
      title: cleanTitle(title, feed.name),
      summary: toSummary(body) || feed.name,
      url,
      sourceType: feed.sourceType,
      sourceName: feed.name,
      // RSS 没有热度指标，用「新鲜度」折算成分数，
      // 保证跟 HN / GitHub / Reddit 混排时不至于永远垫底
      score: freshnessScore(publishedAt),
      publishedAt,
      tags: dedupe([
        ...(item.categories ?? []).slice(0, 2).map((c) => String(c).trim()),
        ...group.extractTags(title, body),
      ]).slice(0, 4),
    },
  ];
}

/** Google News 会在标题末尾拼上 " - 原始媒体名"，卡片上显示很啰嗦，去掉 */
function cleanTitle(title: string, feedName: string): string {
  if (!feedName.startsWith("Google News")) return title;
  return title.replace(/\s+-\s+[^-]{2,40}$/, "").trim() || title;
}

/** 24h 内 100 分，之后每天衰减，最低 10 分 */
function freshnessScore(publishedAt: string): number {
  const hours = (Date.now() - new Date(publishedAt).getTime()) / (60 * 60 * 1000);
  if (hours <= 24) return 100;
  return Math.max(10, Math.round(100 - ((hours - 24) / 24) * 12));
}

function dedupe(values: string[]): string[] {
  const seen = new Set<string>();
  return values.filter((v) => {
    const key = v.toLowerCase();
    if (!v || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
