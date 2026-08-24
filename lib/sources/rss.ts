import Parser from "rss-parser";
import {
  RSS_FEEDS,
  RSS_ITEMS_PER_FEED,
  RSS_RECENT_DAYS,
  extractTags,
  matchesAiKeywords,
  type FeedConfig,
} from "@/config/keywords";
import { fetchWithTimeout, toIso, toSummary } from "@/lib/fetch-utils";
import type { ContentItem, SourceResult } from "@/lib/types";

const parser = new Parser({
  timeout: 10_000,
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

/**
 * AI 新闻资讯。每个源独立抓取，失败只影响自己。
 * 返回按 sourceName 拆开的多个结果，好让 Header 能逐个源显示状态。
 */
export async function fetchRssFeeds(): Promise<SourceResult[]> {
  const results = await Promise.allSettled(RSS_FEEDS.map(fetchOneFeed));

  return results.map((result, index) => {
    const feed = RSS_FEEDS[index];
    if (result.status === "fulfilled") return result.value;
    return {
      sourceName: feed.name,
      items: [],
      error: result.reason instanceof Error ? result.reason.message : String(result.reason),
    };
  });
}

async function fetchOneFeed(feed: FeedConfig): Promise<SourceResult> {
  // 走自己的 fetch 而不是 rss-parser 内置的 http，这样超时和 UA 行为统一
  const res = await fetchWithTimeout(feed.url, {
    headers: { Accept: "application/rss+xml, application/xml, text/xml, */*" },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);

  const xml = await res.text();
  const parsed = await parser.parseString(xml);
  const cutoff = Date.now() - RSS_RECENT_DAYS * 24 * 60 * 60 * 1000;

  const items = ((parsed.items ?? []) as FeedItem[])
    .flatMap((item) => toContentItem(item, feed))
    .filter((item) => new Date(item.publishedAt).getTime() >= cutoff)
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
    .slice(0, RSS_ITEMS_PER_FEED);

  return { sourceName: feed.name, items };
}

function toContentItem(item: FeedItem, feed: FeedConfig): ContentItem[] {
  const title = item.title?.trim();
  const url = item.link?.trim();
  if (!title || !url) return [];

  const body = item.contentSnippet ?? item.summary ?? item.contentEncoded ?? item.content;

  // OpenAI / HuggingFace 这种整站都是 AI 的源不做关键词过滤，
  // TechCrunch/Verge 这类综合媒体的分类页偶尔混入非 AI 内容，需要过滤。
  const trustedFeed = feed.sourceType === "skill_tool";
  if (!trustedFeed && !matchesAiKeywords(title, body, ...(item.categories ?? []))) {
    return [];
  }

  const publishedAt = toIso(item.isoDate ?? item.pubDate);

  return [
    {
      id: `rss:${feed.name}:${item.guid ?? url}`,
      title,
      summary: toSummary(body) || feed.name,
      url,
      sourceType: feed.sourceType,
      sourceName: feed.name,
      // RSS 没有热度指标，用「新鲜度」折算成分数，保证跟 HN/GitHub 混排时不至于永远垫底
      score: freshnessScore(publishedAt),
      publishedAt,
      tags: dedupe([
        ...(item.categories ?? []).slice(0, 2).map((c) => String(c).trim()),
        ...extractTags(title, body),
      ]).slice(0, 4),
    },
  ];
}

/** 24h 内 100 分，之后每天衰减，最低 10 分 */
function freshnessScore(publishedAt: string): number {
  const hours = (Date.now() - new Date(publishedAt).getTime()) / (60 * 60 * 1000);
  if (hours <= 24) return 100;
  return Math.max(10, Math.round(100 - (hours - 24) / 24 * 12));
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
