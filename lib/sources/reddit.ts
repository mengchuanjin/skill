import {
  REDDIT_MIN_SCORE,
  REDDIT_QUERIES,
  extractChinaTags,
  matchesChinaKeywords,
} from "@/config/china";
import { fetchWithTimeout, toIso, toSummary } from "@/lib/fetch-utils";
import type { ContentItem, SourceResult } from "@/lib/types";

const SOURCE_NAME = "Reddit";

interface RedditPost {
  id: string;
  title?: string;
  selftext?: string;
  permalink?: string;
  score?: number;
  num_comments?: number;
  created_utc?: number;
  subreddit?: string;
  over_18?: boolean;
  stickied?: boolean;
}

interface RedditListing {
  data?: { children?: { data?: RedditPost }[] };
}

/**
 * 看普通网民而不是编辑部怎么聊中国。
 * Reddit 的 .json 接口免 Key，但对 User-Agent 很敏感，
 * 缺 UA 或 UA 太通用会直接 429/403。
 */
export async function fetchReddit(): Promise<SourceResult> {
  const items = new Map<string, ContentItem>();
  const errors: string[] = [];

  const results = await Promise.allSettled(REDDIT_QUERIES.map(fetchOne));

  for (const [index, result] of results.entries()) {
    if (result.status === "rejected") {
      errors.push(`r/${REDDIT_QUERIES[index].subreddit}: ${describe(result.reason)}`);
      continue;
    }
    for (const item of result.value) items.set(item.id, item);
  }

  return {
    sourceName: SOURCE_NAME,
    items: [...items.values()],
    error: items.size === 0 && errors.length > 0 ? errors.join("; ") : undefined,
  };
}

async function fetchOne(entry: {
  subreddit: string;
  query: string;
}): Promise<ContentItem[]> {
  // 有 query 走搜索，没 query 就直接取该 sub 的本周热帖
  const url = entry.query
    ? `https://www.reddit.com/r/${entry.subreddit}/search.json?` +
      new URLSearchParams({
        q: entry.query,
        restrict_sr: "1",
        sort: "top",
        t: "week",
        limit: "25",
      })
    : `https://www.reddit.com/r/${entry.subreddit}/top.json?t=week&limit=25`;

  const res = await fetchWithTimeout(url, {
    headers: {
      Accept: "application/json",
      "User-Agent": "web:ai-hotspot-dashboard:v1.0 (personal dashboard)",
    },
  });
  if (res.status === 403 || res.status === 429) {
    throw new Error(`Reddit 限流或拒绝（HTTP ${res.status}）`);
  }
  if (!res.ok) throw new Error(`HTTP ${res.status}`);

  const data = (await res.json()) as RedditListing;
  return (data.data?.children ?? []).flatMap((child) => toContentItem(child.data));
}

function toContentItem(post: RedditPost | undefined): ContentItem[] {
  if (!post?.title || !post.permalink) return [];
  if (post.over_18 || post.stickied) return [];

  const score = post.score ?? 0;
  if (score < REDDIT_MIN_SCORE) return [];

  // r/China 里的帖子天然涉华，但 r/worldnews 的搜索结果仍要再确认一遍
  if (!matchesChinaKeywords(post.title, post.selftext, post.subreddit)) return [];

  return [
    {
      id: `reddit:${post.id}`,
      title: post.title,
      summary:
        toSummary(post.selftext) ||
        `r/${post.subreddit} · ${score} 赞 · ${post.num_comments ?? 0} 评论`,
      // 跳讨论页而不是外链：这个源的价值在评论区的反应，不在原文
      url: `https://www.reddit.com${post.permalink}`,
      sourceType: "china_watch",
      sourceName: SOURCE_NAME,
      score,
      publishedAt: toIso(post.created_utc),
      tags: dedupe([
        post.subreddit ? `r/${post.subreddit}` : "",
        ...extractChinaTags(post.title, post.selftext),
      ]).slice(0, 4),
    },
  ];
}

function dedupe(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))];
}

function describe(reason: unknown): string {
  return reason instanceof Error ? reason.message : String(reason);
}
