"use client";

import { ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  SOURCE_TYPE_LABEL,
  absoluteTime,
  formatScore,
  relativeTime,
  scoreIcon,
  sourceBadgeStyle,
} from "@/lib/format";
import type { ContentItem } from "@/lib/types";

export function DetailDrawer({
  item,
  onOpenChange,
}: {
  item: ContentItem | null;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Sheet open={item !== null} onOpenChange={onOpenChange}>
      <SheetContent>
        {item && (
          <>
            <div className="flex-1 overflow-y-auto px-6 pb-6 pt-6">
              <div className="flex flex-wrap items-center gap-2 pr-8">
                <Badge style={sourceBadgeStyle(item.sourceName)}>
                  {item.sourceName}
                </Badge>
                <Badge>{SOURCE_TYPE_LABEL[item.sourceType]}</Badge>
                <span className="text-xs font-medium tabular-nums text-[var(--accent)]">
                  {scoreIcon(item.sourceName)} {formatScore(item.score)}
                </span>
              </div>

              <SheetTitle className="mt-4 text-xl font-semibold leading-snug text-[var(--foreground)]">
                {item.title}
              </SheetTitle>

              <p className="mt-2 text-xs text-[var(--muted-foreground)]">
                {relativeTime(item.publishedAt)} · {absoluteTime(item.publishedAt)}
              </p>

              <div className="my-5 h-px bg-[var(--border)]" />

              <SheetDescription className="text-sm leading-relaxed text-[#d4d4d8]">
                {item.summary || "该条目没有提供摘要。"}
              </SheetDescription>

              {item.tags.length > 0 && (
                <div className="mt-6 flex flex-wrap gap-1.5">
                  {item.tags.map((tag) => (
                    <Badge key={tag}>{tag}</Badge>
                  ))}
                </div>
              )}

              <div className="mt-6 space-y-1">
                <p className="text-[11px] uppercase tracking-wide text-[var(--muted-foreground)]">
                  原文链接
                </p>
                <p className="break-all text-xs text-[var(--muted-foreground)]">
                  {item.url}
                </p>
              </div>
            </div>

            <div className="border-t border-[var(--border)] p-4">
              <Button asChild className="w-full">
                <a href={item.url} target="_blank" rel="noopener noreferrer">
                  查看原文
                  <ExternalLink className="size-3.5" />
                </a>
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
