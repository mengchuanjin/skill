"use client";

import * as React from "react";
import useSWR from "swr";
import { DetailDrawer } from "@/components/detail-drawer";
import { Header } from "@/components/header";
import { Section } from "@/components/section";
import type { ContentItem, DashboardPayload } from "@/lib/types";

/**
 * 自动刷新间隔（分钟）。默认 45，落在需求要求的 30-60 区间内。
 * 想验证自动刷新逻辑时，在 .env.local 里把它调成 1 即可。
 */
const REFRESH_INTERVAL_MINUTES = Number(
  process.env.NEXT_PUBLIC_REFRESH_INTERVAL_MINUTES ?? 45,
);

async function fetcher(url: string): Promise<DashboardPayload> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`请求失败：HTTP ${res.status}`);
  return res.json();
}

export function Dashboard() {
  const [selected, setSelected] = React.useState<ContentItem | null>(null);
  const [manualRefreshing, setManualRefreshing] = React.useState(false);

  const { data, error, isLoading, mutate } = useSWR<DashboardPayload>(
    "/api/dashboard",
    fetcher,
    {
      // 前端定时器触发重新请求，不需要服务端 cron
      refreshInterval: REFRESH_INTERVAL_MINUTES * 60 * 1000,
      revalidateOnFocus: false,
      keepPreviousData: true,
    },
  );

  const handleRefresh = React.useCallback(async () => {
    setManualRefreshing(true);
    try {
      // refresh=1 让后端跳过 5 分钟内存缓存，真正回源
      const fresh = await fetcher("/api/dashboard?refresh=1");
      await mutate(fresh, { revalidate: false });
    } catch {
      await mutate();
    } finally {
      setManualRefreshing(false);
    }
  }, [mutate]);

  const items = React.useMemo(() => data?.items ?? [], [data]);

  // 板块 A：资讯 + 社区；板块 B：工具/Skill
  const hotTopics = React.useMemo(
    () => items.filter((item) => item.sourceType !== "skill_tool"),
    [items],
  );
  const skillTools = React.useMemo(
    () => items.filter((item) => item.sourceType === "skill_tool"),
    [items],
  );

  const lastUpdated = data?.fetchedAt ? new Date(data.fetchedAt).getTime() : null;
  const busy = manualRefreshing || isLoading;

  return (
    <div className="min-h-screen">
      <Header
        data={data}
        isRefreshing={busy}
        lastUpdated={lastUpdated}
        onRefresh={handleRefresh}
        refreshIntervalMinutes={REFRESH_INTERVAL_MINUTES}
      />

      <main className="mx-auto max-w-[1400px] space-y-14 px-5 py-10 md:px-8 md:py-14">
        {data?.fixtures && (
          <div className="rounded-lg border border-amber-500/30 bg-amber-500/[0.06] px-4 py-3 text-sm text-amber-300">
            当前为<strong className="font-semibold">离线示例数据</strong>（DASHBOARD_FIXTURES=1）。
            去掉该环境变量并重启即可切回真实数据源。
          </div>
        )}

        {error && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/[0.06] px-4 py-3 text-sm text-red-300">
            数据加载失败：{error instanceof Error ? error.message : String(error)}
          </div>
        )}

        <Section
          title="热门话题"
          description="AI 媒体资讯与技术社区正在讨论的内容"
          items={hotTopics}
          loading={busy}
          onSelect={setSelected}
        />

        <Section
          title="最新 Skill / 工具"
          description="近期发布的 AI 工具、Skill 与开发者项目"
          items={skillTools}
          loading={busy}
          onSelect={setSelected}
        />

        <SourceStatus data={data} />
      </main>

      <DetailDrawer
        item={selected}
        onOpenChange={(open) => !open && setSelected(null)}
      />
    </div>
  );
}

/** 页脚的来源健康状态，方便一眼看出哪个源挂了 */
function SourceStatus({ data }: { data: DashboardPayload | undefined }) {
  if (!data?.sources?.length) return null;

  return (
    <footer className="border-t border-[var(--border)] pt-6">
      <p className="mb-3 text-[11px] uppercase tracking-wide text-[var(--muted-foreground)]">
        数据源状态
      </p>
      <div className="flex flex-wrap gap-x-5 gap-y-2">
        {data.sources.map((source) => (
          <span
            key={source.name}
            title={source.error}
            className="flex items-center gap-1.5 text-[11px] text-[var(--muted-foreground)]"
          >
            <span
              className={
                source.error
                  ? "size-1.5 rounded-full bg-red-400"
                  : "size-1.5 rounded-full bg-emerald-400"
              }
            />
            {source.name}
            <span className="tabular-nums opacity-60">{source.count}</span>
          </span>
        ))}
      </div>
    </footer>
  );
}
