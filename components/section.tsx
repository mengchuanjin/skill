"use client";

import * as React from "react";
import { ArrowDownWideNarrow, Clock } from "lucide-react";
import { ContentCard } from "@/components/content-card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { ContentItem, SortMode } from "@/lib/types";

const ALL_SOURCES = "__all__";

export function Section({
  title,
  description,
  items,
  loading,
  onSelect,
}: {
  title: string;
  description: string;
  items: ContentItem[];
  loading: boolean;
  onSelect: (item: ContentItem) => void;
}) {
  const [source, setSource] = React.useState<string>(ALL_SOURCES);
  const [sort, setSort] = React.useState<SortMode>("score");

  const sources = React.useMemo(
    () => [...new Set(items.map((item) => item.sourceName))].sort(),
    [items],
  );

  // 选中的来源可能因为数据刷新而消失。这里在渲染时直接回落到「全部」，
  // 不用 effect 去改 state，避免多一轮渲染。
  const activeSource = sources.includes(source) ? source : ALL_SOURCES;

  const visible = React.useMemo(() => {
    const filtered =
      activeSource === ALL_SOURCES
        ? items
        : items.filter((item) => item.sourceName === activeSource);

    return [...filtered].sort((a, b) =>
      sort === "date"
        ? b.publishedAt.localeCompare(a.publishedAt)
        : b.score - a.score || b.publishedAt.localeCompare(a.publishedAt),
    );
  }, [items, activeSource, sort]);

  return (
    <section className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold tracking-tight text-[var(--foreground)]">
            {title}
            <span className="ml-2 text-xs font-normal tabular-nums text-[var(--muted-foreground)]">
              {visible.length}
            </span>
          </h2>
          <p className="text-[13px] text-[var(--muted-foreground)]">{description}</p>
        </div>

        <div className="flex items-center gap-2">
          <Select value={activeSource} onValueChange={setSource}>
            <SelectTrigger className="w-[150px]" aria-label={`${title} 来源筛选`}>
              <SelectValue placeholder="全部来源" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_SOURCES}>全部来源</SelectItem>
              {sources.map((name) => (
                <SelectItem key={name} value={name}>
                  {name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <SortToggle value={sort} onChange={setSort} />
        </div>
      </div>

      {loading && items.length === 0 ? (
        <CardGrid>
          {Array.from({ length: 6 }).map((_, index) => (
            <SkeletonCard key={index} />
          ))}
        </CardGrid>
      ) : visible.length === 0 ? (
        <div className="rounded-lg border border-dashed border-[var(--border-strong)] px-6 py-14 text-center text-sm text-[var(--muted-foreground)]">
          暂无内容。可以试试切换来源筛选，或点击右上角刷新。
        </div>
      ) : (
        <CardGrid>
          {visible.map((item) => (
            <ContentCard key={item.id} item={item} onSelect={onSelect} />
          ))}
        </CardGrid>
      )}
    </section>
  );
}

/** 响应式网格：移动端单列，桌面 3-4 列 */
function CardGrid({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {children}
    </div>
  );
}

function SortToggle({
  value,
  onChange,
}: {
  value: SortMode;
  onChange: (value: SortMode) => void;
}) {
  const options = [
    { value: "score" as const, label: "热度", Icon: ArrowDownWideNarrow },
    { value: "date" as const, label: "最新", Icon: Clock },
  ];

  return (
    <div
      role="group"
      aria-label="排序方式"
      className="flex items-center rounded-md border border-[var(--border-strong)] p-0.5"
    >
      {options.map(({ value: option, label, Icon }) => (
        <button
          key={option}
          type="button"
          aria-pressed={value === option}
          onClick={() => onChange(option)}
          className={cn(
            "flex items-center gap-1.5 rounded-[5px] px-2.5 py-1 text-xs transition-colors",
            value === option
              ? "bg-[var(--accent-soft)] text-[var(--accent)]"
              : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]",
          )}
        >
          <Icon className="size-3.5" />
          {label}
        </button>
      ))}
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="h-[168px] animate-pulse rounded-lg border border-[var(--border)] bg-[var(--card)] p-4">
      <div className="h-4 w-20 rounded bg-white/[0.06]" />
      <div className="mt-4 h-4 w-full rounded bg-white/[0.06]" />
      <div className="mt-2 h-4 w-3/5 rounded bg-white/[0.06]" />
      <div className="mt-5 h-3 w-full rounded bg-white/[0.04]" />
      <div className="mt-2 h-3 w-4/5 rounded bg-white/[0.04]" />
    </div>
  );
}
