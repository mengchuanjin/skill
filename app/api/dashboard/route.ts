import { NextResponse } from "next/server";
import { loadDashboard } from "@/lib/aggregate";
import type { SortMode, SourceType } from "@/lib/types";

export const dynamic = "force-dynamic";

const SOURCE_TYPES: SourceType[] = ["news", "skill_tool", "community"];
const SORTS: SortMode[] = ["score", "date"];

/**
 * 前端唯一需要请求的端点。
 * ?sourceType=news|skill_tool|community  ?sort=score|date  ?refresh=1（跳过缓存）
 */
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;

  const rawType = params.get("sourceType");
  const sourceType = SOURCE_TYPES.includes(rawType as SourceType)
    ? (rawType as SourceType)
    : undefined;

  const rawSort = params.get("sort");
  const sort = SORTS.includes(rawSort as SortMode) ? (rawSort as SortMode) : "score";

  try {
    const payload = await loadDashboard({
      sourceType,
      sort,
      force: params.get("refresh") === "1",
    });
    return NextResponse.json(payload);
  } catch (error) {
    return NextResponse.json(
      {
        items: [],
        sources: [],
        fetchedAt: new Date().toISOString(),
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 502 },
    );
  }
}
