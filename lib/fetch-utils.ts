/** 带超时的 fetch —— 单个源卡住时不能拖垮整个聚合接口 */
export async function fetchWithTimeout(
  url: string,
  init: RequestInit = {},
  timeoutMs = 10_000,
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, {
      ...init,
      signal: controller.signal,
      // 缓存由 lib/cache.ts 统一管理，这里不让 Next 再缓存一层
      cache: "no-store",
      headers: {
        "User-Agent": "ai-hotspot-dashboard (personal dashboard)",
        ...(init.headers ?? {}),
      },
    });
  } finally {
    clearTimeout(timer);
  }
}

/** 把 HTML 摘要压成 1-2 行纯文本 */
export function toSummary(raw: string | undefined | null, maxLen = 180): string {
  if (!raw) return "";
  const text = raw
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/\s+/g, " ")
    .trim();
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen).replace(/\s+\S*$/, "") + "…";
}

export function toIso(input: string | number | Date | undefined | null): string {
  if (input === undefined || input === null) return new Date().toISOString();
  const date =
    typeof input === "number"
      ? new Date(input < 1e12 ? input * 1000 : input)
      : new Date(input);
  return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
}

export function daysAgoIso(days: number): string {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
}
