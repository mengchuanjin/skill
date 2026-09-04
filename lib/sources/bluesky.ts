import {
  BLUESKY_MIN_ENGAGEMENT,
  BLUESKY_QUERIES,
  extractChinaTags,
  matchesChinaKeywords,
} from "@/config/china";
import { fetchWithTimeout, toIso, toSummary } from "@/lib/fetch-utils";
import type { ContentItem, SourceResult } from "@/lib/types";

const SOURCE_NAME = "Bluesky";
const ENDPOINT = "https://public.api.bsky.app/xrpc/app.bsky.feed.searchPosts";

interface BskyPost {
  uri: string;
  author?: { handle?: string; displayName?: string };
  record?: { text?: string; createdAt?: string };
  likeCount?: number;
  repostCount?: number;
  replyCount?: number;
  indexedAt?: string;
}

/**
 * 社交平台上的即时议论。
 * Bluesky 的 public AppView 免登录、免 Key，是目前唯一还能白嫖的
 * 「X 式」全站搜索，用来补 X 付费后留下的空缺。
 */
export async function fetchBluesky(): Promise<SourceResult> {
  const items = new Map<string, ContentItem>();
  const errors: string[] = [];

  const results = await Promise.allSettled(BLUESKY_QUERIES.map(fetchOneQuery));

  for (const [index, result] of results.entries()) {
    if (result.status === "rejected") {
      errors.push(`${BLUESKY_QUERIES[index]}: ${describe(result.reason)}`);
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

async function fetchOneQuery(query: string): Promise<ContentItem[]> {
  const params = new URLSearchParams({
    q: query,
    limit: "50",
    sort: "top",
  });

  const res = await fetchWithTimeout(`${ENDPOINT}?${params}`, {
    headers: { Accept: "application/json" },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);

  const data = (await res.json()) as { posts?: BskyPost[] };
  return (data.posts ?? []).flatMap(toContentItem);
}

function toContentItem(post: BskyPost): ContentItem[] {
  const text = post.record?.text?.trim();
  const handle = post.author?.handle;
  if (!text || !handle) return [];

  const engagement = (post.likeCount ?? 0) + (post.repostCount ?? 0);
  if (engagement < BLUESKY_MIN_ENGAGEMENT) return [];

  // 搜索命中不等于真的在讲中国（比如只是提到某个含关键词的地名），再确认一遍
  if (!matchesChinaKeywords(text)) return [];

  // at://did:plc:xxx/app.bsky.feed.post/<rkey> -> 网页地址要的是最后那段 rkey
  const rkey = post.uri.split("/").pop();
  if (!rkey) return [];

  const author = post.author?.displayName?.trim() || handle;
  const firstLine = text.split("\n")[0].trim();

  return [
    {
      id: `bsky:${post.uri}`,
      // 推文没有标题，用首行当标题、全文当摘要
      title: truncate(firstLine, 110),
      summary: toSummary(text) || `@${handle}`,
      url: `https://bsky.app/profile/${handle}/post/${rkey}`,
      sourceType: "china_watch",
      sourceName: SOURCE_NAME,
      score: engagement,
      publishedAt: toIso(post.record?.createdAt ?? post.indexedAt),
      tags: [`@${truncate(author, 18)}`, ...extractChinaTags(text)].slice(0, 4),
    },
  ];
}

function truncate(value: string, max: number): string {
  return value.length <= max ? value : `${value.slice(0, max)}…`;
}

function describe(reason: unknown): string {
  return reason instanceof Error ? reason.message : String(reason);
}
