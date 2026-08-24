import {
  GITHUB_MIN_STARS,
  GITHUB_RECENT_DAYS,
  GITHUB_TOPICS,
  extractTags,
  matchesAiKeywords,
} from "@/config/keywords";
import { daysAgoIso, fetchWithTimeout, toIso, toSummary } from "@/lib/fetch-utils";
import type { ContentItem, SourceResult } from "@/lib/types";

const SOURCE_NAME = "GitHub";
const ENDPOINT = "https://api.github.com/search/repositories";

interface Repo {
  id: number;
  full_name: string;
  html_url: string;
  description: string | null;
  stargazers_count: number;
  created_at: string;
  pushed_at: string;
  topics?: string[];
  language: string | null;
  owner?: { login: string };
}

/**
 * 最新 Skill / 工具。用 GitHub Search API 按 topic + 创建时间过滤，
 * 未认证 60 次/小时；设置 DASHBOARD_GITHUB_TOKEN 可提到 30 次/分钟（可选）。
 */
export async function fetchGithub(): Promise<SourceResult> {
  const items = new Map<string, ContentItem>();
  const errors: string[] = [];

  const results = await Promise.allSettled(
    GITHUB_TOPICS.map((topic) => fetchOneTopic(topic)),
  );

  for (const [index, result] of results.entries()) {
    if (result.status === "rejected") {
      errors.push(`${GITHUB_TOPICS[index]}: ${describe(result.reason)}`);
      continue;
    }
    for (const item of result.value) items.set(item.id, item);
  }

  const error =
    items.size === 0 && errors.length > 0 ? errors.join("; ") : undefined;

  return { sourceName: SOURCE_NAME, items: [...items.values()], error };
}

async function fetchOneTopic(topic: string): Promise<ContentItem[]> {
  const createdAfter = daysAgoIso(GITHUB_RECENT_DAYS).slice(0, 10);
  const q = `topic:${topic} stars:>=${GITHUB_MIN_STARS} created:>${createdAfter}`;
  const params = new URLSearchParams({
    q,
    sort: "stars",
    order: "desc",
    per_page: "20",
  });

  // 刻意用专属变量名而不是通用的 GITHUB_TOKEN：
  // 很多开发环境里已经存在一个用途不同的 GITHUB_TOKEN，误用会直接 401。
  const token = process.env.DASHBOARD_GITHUB_TOKEN;
  const res = await fetchWithTimeout(`${ENDPOINT}?${params}`, {
    headers: {
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (res.status === 403 || res.status === 429) {
    throw new Error(
      "GitHub API 限流（未认证 60 次/小时），可设置 DASHBOARD_GITHUB_TOKEN 提额",
    );
  }
  if (!res.ok) throw new Error(`HTTP ${res.status}`);

  const data = (await res.json()) as { items?: Repo[] };
  return (data.items ?? []).flatMap((repo) => toContentItem(repo, topic));
}

function toContentItem(repo: Repo, topic: string): ContentItem[] {
  const haystack = [repo.full_name, repo.description, ...(repo.topics ?? [])].join(" ");
  // topic 本身已经是 AI 相关的，所以 topic 命中直接放行，其余再走关键词过滤
  const isAiTopic = GITHUB_TOPICS.includes(topic);
  if (!isAiTopic && !matchesAiKeywords(haystack)) return [];

  const tags = Array.from(
    new Set([
      ...(repo.topics ?? []).slice(0, 3),
      ...(repo.language ? [repo.language] : []),
      ...extractTags(repo.description),
    ]),
  ).slice(0, 4);

  return [
    {
      id: `github:${repo.id}`,
      title: repo.full_name,
      summary: toSummary(repo.description) || "该仓库暂无描述",
      url: repo.html_url,
      sourceType: "skill_tool",
      sourceName: SOURCE_NAME,
      score: repo.stargazers_count,
      // 用创建时间：这个板块看的是「最新发布」，不是「最近有人提交」
      publishedAt: toIso(repo.created_at),
      tags,
    },
  ];
}

function describe(reason: unknown): string {
  return reason instanceof Error ? reason.message : String(reason);
}
