"use client";

import * as React from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { relativeTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { DashboardPayload } from "@/lib/types";

export function Header({
  data,
  isRefreshing,
  lastUpdated,
  onRefresh,
  refreshIntervalMinutes,
}: {
  data: DashboardPayload | undefined;
  isRefreshing: boolean;
  lastUpdated: number | null;
  onRefresh: () => void;
  refreshIntervalMinutes: number;
}) {
  // 相对时间需要自己走秒表，否则「最后更新」会一直停在 "刚刚"
  const [, forceTick] = React.useReducer((n: number) => n + 1, 0);
  React.useEffect(() => {
    const timer = setInterval(forceTick, 30_000);
    return () => clearInterval(timer);
  }, []);

  const failed = (data?.sources ?? []).filter((s) => s.error);

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-[var(--background)]/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-[1400px] flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:gap-6 md:px-8">
        <div className="flex items-center gap-3">
          <div className="flex size-8 items-center justify-center rounded-md border border-[var(--accent)]/30 bg-[var(--accent-soft)]">
            <span className="text-sm">◆</span>
          </div>
          <div>
            <h1 className="text-sm font-semibold tracking-tight text-[var(--foreground)]">
              AI 热点与 Skill 雷达
            </h1>
            <p className="text-[11px] text-[var(--muted-foreground)]">
              一个页面看完当下 AI 圈在聊什么、有什么新工具
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 sm:ml-auto">
          {failed.length > 0 && (
            <span
              className="hidden items-center gap-1.5 text-[11px] text-amber-400/90 md:flex"
              title={failed.map((s) => `${s.name}: ${s.error}`).join("\n")}
            >
              <AlertTriangle className="size-3.5" />
              {failed.length} 个源抓取失败
            </span>
          )}

          <div className="text-right">
            <p className="text-[11px] text-[var(--muted-foreground)]">
              最后更新{" "}
              <span className="text-[var(--foreground)]">
                {lastUpdated ? relativeTime(new Date(lastUpdated).toISOString()) : "—"}
              </span>
            </p>
            <p className="text-[10px] text-[var(--muted-foreground)]/70">
              每 {refreshIntervalMinutes} 分钟自动刷新
            </p>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={isRefreshing}
            aria-label="刷新数据"
          >
            <RefreshCw className={cn("size-3.5", isRefreshing && "animate-spin")} />
            {isRefreshing ? "刷新中" : "刷新"}
          </Button>
        </div>
      </div>
    </header>
  );
}
