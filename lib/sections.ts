import type { ContentItem, SortMode } from "@/lib/types";

/**
 * 两个板块的定义。首页和「更多」二级页共用同一份，
 * 免得标题、归类规则在两个地方各写一遍会写歪。
 */
export interface SectionDef {
  /** URL 里的 slug，同时用作 React key */
  slug: SectionSlug;
  title: string;
  description: string;
  /** 该条目属不属于这个板块 */
  match: (item: ContentItem) => boolean;
  /** 该板块进来时的默认排序，不传按热度 */
  defaultSort?: SortMode;
}

export type SectionSlug = "china" | "topics" | "tools";

export const SECTIONS: SectionDef[] = [
  {
    slug: "china",
    title: "全球看中国",
    description: "各国主流媒体与社交平台上的涉华报道，正面负面一律照原样收录",
    match: (item) => item.sourceType === "china_watch",
    // 新闻看的是「刚发生了什么」，默认按时间；想看热度自己切
    defaultSort: "date",
  },
  {
    slug: "topics",
    title: "热门话题",
    description: "AI 媒体资讯与技术社区正在讨论的内容",
    // 必须逐个列出，不能写成「不是 skill_tool」——
    // 那样每新增一个板块，条目都会漏进这里
    match: (item) =>
      item.sourceType === "news" || item.sourceType === "community",
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
