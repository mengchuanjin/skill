import { cn } from "@/lib/utils";
import type { DashboardPayload } from "@/lib/types";

/** 页脚的来源健康状态，方便一眼看出哪个源挂了 */
export function SourceStatus({ data }: { data: DashboardPayload | undefined }) {
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
            className={cn(
              "flex items-center gap-1.5 text-[11px] text-[var(--muted-foreground)]",
              source.skipped && "opacity-50",
            )}
          >
            <span
              className={cn(
                "size-1.5 rounded-full",
                source.skipped
                  ? "bg-zinc-600"
                  : source.error
                    ? "bg-red-400"
                    : "bg-emerald-400",
              )}
            />
            {source.name}
            <span className="tabular-nums opacity-60">{source.count}</span>
          </span>
        ))}
      </div>
    </footer>
  );
}
