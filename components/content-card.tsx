"use client";

import { Badge } from "@/components/ui/badge";
import {
  formatScore,
  relativeTime,
  scoreIcon,
  sourceBadgeStyle,
} from "@/lib/format";
import type { ContentItem } from "@/lib/types";

export function ContentCard({
  item,
  onSelect,
}: {
  item: ContentItem;
  onSelect: (item: ContentItem) => void;
}) {
  return (
    <article
      role="button"
      tabIndex={0}
      onClick={() => onSelect(item)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onSelect(item);
        }
      }}
      className="group flex h-full cursor-pointer flex-col gap-3 rounded-lg border border-[var(--border)] bg-[var(--card)] p-4 outline-none transition-colors duration-150 hover:border-[var(--border-strong)] hover:bg-[var(--card-hover)] focus-visible:border-[var(--accent)] focus-visible:ring-1 focus-visible:ring-[var(--accent)]"
    >
      <header className="flex items-center gap-2">
        <Badge style={sourceBadgeStyle(item.sourceName)}>{item.sourceName}</Badge>
        <span className="ml-auto shrink-0 text-[11px] text-[var(--muted-foreground)]">
          {relativeTime(item.publishedAt)}
        </span>
      </header>

      <h3 className="line-clamp-2 text-[15px] font-medium leading-snug text-[var(--foreground)] transition-colors group-hover:text-[var(--accent)]">
        {item.title}
      </h3>

      <p className="line-clamp-2 text-[13px] leading-relaxed text-[var(--muted-foreground)]">
        {item.summary}
      </p>

      <footer className="mt-auto flex items-center gap-2 pt-1">
        <span className="text-xs font-medium tabular-nums text-[var(--accent)]">
          {scoreIcon(item.sourceName)} {formatScore(item.score)}
        </span>
        <div className="ml-auto flex min-w-0 gap-1.5">
          {item.tags.slice(0, 2).map((tag) => (
            <Badge key={tag} variant="default" className="truncate">
              {tag}
            </Badge>
          ))}
        </div>
      </footer>
    </article>
  );
}
