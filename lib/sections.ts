import type { ContentItem } from "@/lib/types";

/**
 * 两个板块的定义。首页和「更多」二级页共用同一份，
 * 免得标题、归类规则在两个地方各写一遍会写歪。
 */
export interface SectionDef {
  /** URL 里的 slug，同时用作 React key */
  slug: "topics" | "tools";
  title: string;
  description: string;
  /** 该条目属不属于这个板块 */
  match: (item: ContentItem) => boolean;
}

export const SECTIONS: SectionDef[] = [
  {
    slug: "topics",
    title: "热门话题",
    description: "AI 媒体资讯与技术社区正在讨论的内容",
    match: (item) => item.sourceType !== "skill_tool",
  },
  {
    slug: "tools",
    title: "最新 Skill / 工具",
    description: "近期发布的 AI 工具、Skill 与开发者项目",
    match: (item) => item.sourceType === "skill_tool",
  },
];

export function sectionBySlug(slug: string): SectionDef | undefined {
  return SECTIONS.find((section) => section.slug === slug);
}
