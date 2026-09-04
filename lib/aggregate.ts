import { DEFAULT_TTL_MS, cached } from "@/lib/cache";
import {
  fixtureChina,
  fixtureGithub,
  fixtureHackerNews,
  fixtureRss,
  isFixtureMode,
} from "@/lib/fixtures";
import { fetchBluesky } from "@/lib/sources/bluesky";
import { fetchGithub } from "@/lib/sources/github";
import { fetchHackerNews } from "@/lib/sources/hn";
import { fetchReddit } from "@/lib/sources/reddit";
import { fetchChinaFeeds, fetchRssFeeds } from "@/lib/sources/rss";
import { fetchX } from "@/lib/sources/x";
import type { ContentItem, DashboardPayload, SortMode, SourceResult, SourceType } from "@/lib/types";

export const CACHE_KEYS = {
  hn: "source:hn",
  github: "source:github",
  rss: "source:rss",
  china: "source:china",
} as const;

type LoadOpts = { force?: boolean };

export function loadHackerNews(opts: LoadOpts = {}) {
  if (isFixtureMode()) return Promise.resolve(fixtureHackerNews());
  return cached(CACHE_KEYS.hn, DEFAULT_TTL_MS, fetchHackerNews, opts);
}

export function loadGithub(opts: LoadOpts = {}) {
  if (isFixtureMode()) return Promise.resolve(fixtureGithub());
  return cached(CACHE_KEYS.github, DEFAULT_TTL_MS, fetchGithub, opts);
}

export function loadRss(opts: LoadOpts = {}) {
  if (isFixtureMode()) return Promise.resolve(fixtureRss());
  return cached(CACHE_KEYS.rss, DEFAULT_TTL_MS, fetchRssFeeds, opts);
}

/**
 * 全球媒体涉华报道 = 各国媒体 RSS + Reddit + Bluesky + （可选）X。
 * 四类一起抓，任何一类失败都只是少一块，不影响其它。
 */
export function loadChina(opts: LoadOpts = {}) {
  if (isFixtureMode()) return Promise.resolve(fixtureChina());
  return cached(
    CACHE_KEYS.china,
    DEFAULT_TTL_MS,
    async (): Promise<SourceResult[]> => {
      const [feeds, reddit, bluesky, x] = await Promise.all([
        fetchChinaFeeds().catch((reason) => [toFailed("涉华 RSS")(reason)]),
        fetchReddit().catch(toFailed("Reddit")),
        fetchBluesky().catch(toFailed("Bluesky")),
        fetchX().catch(toFailed("X")),
      ]);
      return [...feeds, reddit, bluesky, x];
    },
    opts,
  );
}

/** 聚合三个源，去重 + 排序。任意源失败都只记录 error，不抛出。 */
export async function loadDashboard(
  params: { sourceType?: SourceType; sort?: SortMode; force?: boolean } = {},
): Promise<DashboardPayload> {
  const opts = { force: params.force };
  const [hn, github, rss, china] = await Promise.all([
    loadHackerNews(opts).catch(toFailed("Hacker News")),
    loadGithub(opts).catch(toFailed("GitHub")),
    loadRss(opts).catch((reason) => [toFailed("RSS")(reason)]),
    loadChina(opts).catch((reason) => [toFailed("全球看中国")(reason)]),
  ]);

  const results: SourceResult[] = [hn, github, ...rss, ...china];

  let items = dedupe(results.flatMap((r) => r.items));
  if (params.sourceType) {
    items = items.filter((item) => item.sourceType === params.sourceType);
  }
  items = sortItems(items, params.sort ?? "score");

  return {
    items,
    sources: results.map((r) => ({
      name: r.sourceName,
      count: r.items.length,
      error: r.error,
      skipped: r.skipped,
    })),
    fetchedAt: new Date().toISOString(),
    fixtures: isFixtureMode() || undefined,
  };
}

export function sortItems(items: ContentItem[], sort: SortMode): ContentItem[] {
  const sorted = [...items];
  if (sort === "date") {
    sorted.sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
  } else {
    sorted.sort(
      (a, b) => b.score - a.score || b.publishedAt.localeCompare(a.publishedAt),
    );
  }
  return sorted;
}

/**
 * 去重：先按 id，再按规范化 URL。
 * 同一篇文章常同时出现在 HN 和 RSS 里，保留热度高的那条。
 */
function dedupe(items: ContentItem[]): ContentItem[] {
  const byId = new Map<string, ContentItem>();
  for (const item of items) byId.set(item.id, item);

  const byUrl = new Map<string, ContentItem>();
  for (const item of byId.values()) {
    const key = normalizeUrl(item.url);
    const existing = byUrl.get(key);
    if (!existing || item.score > existing.score) byUrl.set(key, item);
  }
  return [...byUrl.values()];
}

function normalizeUrl(url: string): string {
  try {
    const parsed = new URL(url);
    parsed.hash = "";
    parsed.search = "";
    parsed.protocol = "https:";
    const host = parsed.host.replace(/^www\./, "");
    const path = parsed.pathname.replace(/\/+$/, "");
    return `${host}${path}`.toLowerCase();
  } catch {
    return url.toLowerCase();
  }
}

function toFailed(sourceName: string) {
  return (reason: unknown): SourceResult => ({
    sourceName,
    items: [],
    error: reason instanceof Error ? reason.message : String(reason),
  });
}
