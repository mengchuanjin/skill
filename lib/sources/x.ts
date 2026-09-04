import {
  X_MIN_ENGAGEMENT,
  X_QUERIES,
  extractChinaTags,
  matchesChinaKeywords,
} from "@/config/china";
import { fetchWithTimeout, toIso, toSummary } from "@/lib/fetch-utils";
import type { ContentItem, SourceResult } from "@/lib/types";

const SOURCE_NAME = "X";
const ENDPOINT = "https://api.x.com/2/tweets/search/recent";

interface Tweet {
  id: string;
  text?: string;
  created_at?: string;
  author_id?: string;
  public_metrics?: {
    like_count?: number;
    retweet_count?: number;
    reply_count?: number;
  };
}

interface XUser {
  id: string;
  username?: string;
  name?: string;
}

/**
 * X（原 Twitter）。
 *
 * X 在 2023 年关掉了免费的搜索 API，recent search 现在属于付费档位，
 * 所以这个源**默认不启用** —— 没有 X_BEARER_TOKEN 时直接返回一条说明，
 * 不会去打接口、也不会在页面上报红错。
 * 有付费 App 的话把 Bearer Token 填进环境变量就会自动接上。
 */
export async function fetchX(): Promise<SourceResult> {
  const token = process.env.X_BEARER_TOKEN;
  if (!token) {
    return {
      sourceName: SOURCE_NAME,
      items: [],
      error: "未配置 X_BEARER_TOKEN（X 已取消免费搜索 API），该源未启用",
      skipped: true,
    };
  }

  const items = new Map<string, ContentItem>();
  const errors: string[] = [];

  const results = await Promise.allSettled(
    X_QUERIES.map((query) => fetchOneQuery(query, token)),
  );

  for (const [index, result] of results.entries()) {
    if (result.status === "rejected") {
      errors.push(`${X_QUERIES[index]}: ${describe(result.reason)}`);
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

async function fetchOneQuery(query: string, token: string): Promise<ContentItem[]> {
  const params = new URLSearchParams({
    query,
    max_results: "50",
    "tweet.fields": "created_at,public_metrics",
    expansions: "author_id",
    "user.fields": "username,name",
  });

  const res = await fetchWithTimeout(`${ENDPOINT}?${params}`, {
    headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
  });

  if (res.status === 401 || res.status === 403) {
    throw new Error(`X token 无效或档位不支持 recent search（HTTP ${res.status}）`);
  }
  if (res.status === 429) throw new Error("X API 限流（HTTP 429）");
  if (!res.ok) throw new Error(`HTTP ${res.status}`);

  const data = (await res.json()) as {
    data?: Tweet[];
    includes?: { users?: XUser[] };
  };

  const users = new Map((data.includes?.users ?? []).map((u) => [u.id, u]));
  return (data.data ?? []).flatMap((tweet) => toContentItem(tweet, users));
}

function toContentItem(tweet: Tweet, users: Map<string, XUser>): ContentItem[] {
  const text = tweet.text?.trim();
  if (!text) return [];

  const metrics = tweet.public_metrics ?? {};
  const engagement = (metrics.like_count ?? 0) + (metrics.retweet_count ?? 0);
  if (engagement < X_MIN_ENGAGEMENT) return [];

  if (!matchesChinaKeywords(text)) return [];

  const user = tweet.author_id ? users.get(tweet.author_id) : undefined;
  const username = user?.username ?? "i";
  const author = user?.name?.trim() || username;
  const firstLine = text.split("\n")[0].trim();

  return [
    {
      id: `x:${tweet.id}`,
      title: truncate(firstLine, 110),
      summary: toSummary(text) || `@${username}`,
      url: `https://x.com/${username}/status/${tweet.id}`,
      sourceType: "china_watch",
      sourceName: SOURCE_NAME,
      score: engagement,
      publishedAt: toIso(tweet.created_at),
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
