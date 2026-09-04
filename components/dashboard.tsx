"use client";

import { Header } from "@/components/header";
import { Section } from "@/components/section";
import { SourceStatus } from "@/components/source-status";
import { SECTIONS } from "@/lib/sections";
import { useDashboard } from "@/lib/use-dashboard";

/** 首页：每个板块只露两行，看更多点标题旁边的「更多」进二级页 */
export function Dashboard() {
  const { data, items, error, refresh, isBusy, lastUpdated } = useDashboard();

  return (
    <div className="min-h-screen">
      <Header
        data={data}
        isRefreshing={isBusy}
        lastUpdated={lastUpdated}
        onRefresh={refresh}
      />

      <main className="mx-auto max-w-[1400px] space-y-14 px-5 py-10 md:px-8 md:py-14">
        {data?.fixtures && <FixtureBanner />}
        {error && <ErrorBanner error={error} />}

        {SECTIONS.map((section) => (
          <Section
            key={section.slug}
            title={section.title}
            description={section.description}
            items={items.filter(section.match)}
            loading={isBusy}
            defaultSort={section.defaultSort}
            moreHref={`/${section.slug}`}
          />
        ))}

        <SourceStatus data={data} />
      </main>
    </div>
  );
}

export function FixtureBanner() {
  return (
    <div className="rounded-lg border border-amber-500/30 bg-amber-500/[0.06] px-4 py-3 text-sm text-amber-300">
      当前为<strong className="font-semibold">离线示例数据</strong>（DASHBOARD_FIXTURES=1）。
      去掉该环境变量并重启即可切回真实数据源。
    </div>
  );
}

export function ErrorBanner({ error }: { error: unknown }) {
  return (
    <div className="rounded-lg border border-red-500/30 bg-red-500/[0.06] px-4 py-3 text-sm text-red-300">
      数据加载失败：{error instanceof Error ? error.message : String(error)}
    </div>
  );
}
