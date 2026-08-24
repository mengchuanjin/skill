import {
  HN_MIN_POINTS,
  HN_QUERIES,
  extractTags,
  matchesAiKeywords,
} from "@/config/keywords";
import { fetchWithTimeout, toIso, toSummary } from "@/lib/fetch-utils";
import type { ContentItem, SourceResult } from "@/lib/types";

const SOURCE_NAME = "Hacker News";
const ENDPOINT = "https://hn.algolia.com/api/v1/search";

interface AlgoliaHit {
  objectID: string;
  title?: string;
  story_title?: string;
  url?: string;
  story_url?: string;
  points?: number;
  num_comments?: number;
  created_at?: string;
  author?: string;
  story_text?: string;
  _tags?: string[];
}

/**
 * 社区讨论热度。Algolia 的 HN Search API 免 Key。
 * 对 config 里的每个关键词各打一次，再按 objectID 去重。
 */
export async function fetchHackerNews(): Promise<SourceResult> {
  const items = new Map<string, ContentItem>();
  const errors: string[] = [];

  const results = await Promise.allSettled(
    HN_QUERIES.map((query) => fetchOneQuery(query)),
  );

  for (const [index, result] of results.entries()) {
    if (result.status === "rejected") {
      errors.push(`${HN_QUERIES[index]}: ${describe(result.reason)}`);
      continue;
    }
    for (const item of result.value) items.set(item.id, item);
  }

  // 全部查询都失败才算这个源挂了；部分失败静默降级
  const error =
    items.size === 0 && errors.length > 0 ? errors.join("; ") : undefined;

  return { sourceName: SOURCE_NAME, items: [...items.values()], error };
}

async function fetchOneQuery(query: string): Promise<ContentItem[]> {
  const params = new URLSearchParams({
    query,
    tags: "story",
    hitsPerPage: "30",
    numericFilters: `points>${HN_MIN_POINTS},created_at_i>${weekAgoUnix()}`,
  });

  const res = await fetchWithTimeout(`${ENDPOINT}?${params}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);

  const data = (await res.json()) as { hits?: AlgoliaHit[] };
  return (data.hits ?? []).flatMap(toContentItem);
}

function toContentItem(hit: AlgoliaHit): ContentItem[] {
  const title = hit.title ?? hit.story_title;
  if (!title) return [];

  // 关键词过滤：HN 本身不是 AI 专属站点
  if (!matchesAiKeywords(title, hit.story_text)) return [];

  const discussionUrl = `https://news.ycombinator.com/item?id=${hit.objectID}`;

  return [
    {
      id: `hn:${hit.objectID}`,
      title,
      summary:
        toSummary(hit.story_text) ||
        `${hit.points ?? 0} points · ${hit.num_comments ?? 0} comments${
          hit.author ? ` · by ${hit.author}` : ""
        }`,
      // 优先跳原文，Ask HN 这类没有外链的回退到讨论页
      url: hit.url ?? hit.story_url ?? discussionUrl,
      sourceType: "community",
      sourceName: SOURCE_NAME,
      score: hit.points ?? 0,
      publishedAt: toIso(hit.created_at),
      tags: extractTags(title, hit.story_text),
    },
  ];
}

function weekAgoUnix(): number {
  return Math.floor((Date.now() - 7 * 24 * 60 * 60 * 1000) / 1000);
}

function describe(reason: unknown): string {
  return reason instanceof Error ? reason.message : String(reason);
}
