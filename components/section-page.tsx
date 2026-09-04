"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ErrorBanner, FixtureBanner } from "@/components/dashboard";
import { Header } from "@/components/header";
import { Section } from "@/components/section";
import { SourceStatus } from "@/components/source-status";
import { sectionBySlug, type SectionSlug } from "@/lib/sections";
import { useDashboard } from "@/lib/use-dashboard";

/**
 * 「更多」二级页：某一个板块的完整列表，不做两行截断。
 * 和首页共用同一个 SWR key，所以从首页点进来不会重新打接口。
 */
export function SectionPage({ slug }: { slug: SectionSlug }) {
  const { data, items, error, refresh, isBusy, lastUpdated } = useDashboard();
  const section = sectionBySlug(slug);

  if (!section) return null;

  return (
    <div className="min-h-screen">
      <Header
        data={data}
        isRefreshing={isBusy}
        lastUpdated={lastUpdated}
        onRefresh={refresh}
      />

      <main className="mx-auto max-w-[1400px] space-y-8 px-5 py-10 md:px-8 md:py-14">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs text-[var(--muted-foreground)] transition-colors hover:text-[var(--accent)]"
        >
          <ArrowLeft className="size-3.5" />
          返回看板
        </Link>

        {data?.fixtures && <FixtureBanner />}
        {error && <ErrorBanner error={error} />}

        <Section
          title={section.title}
          description={section.description}
          items={items.filter(section.match)}
          loading={isBusy}
          defaultSort={section.defaultSort}
        />

        <SourceStatus data={data} />
      </main>
    </div>
  );
}
