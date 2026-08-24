/**
 * 统一内容数据模型。
 * 所有数据源（HN / GitHub / RSS）抓取后都必须转换成这一种格式，
 * 前端只消费 ContentItem，不感知任何第三方 API 的原始结构。
 */
export type SourceType = "news" | "skill_tool" | "community";

export interface ContentItem {
  /** 唯一 ID，约定为 `${sourceName}:${原始id}` 形式 */
  id: string;
  title: string;
  /** 简短摘要，1-2 行 */
  summary: string;
  /** 原文链接 */
  url: string;
  /** 归属板块：news + community -> 热门话题；skill_tool -> 最新 Skill/工具 */
  sourceType: SourceType;
  /** 具体来源名，如 "Hacker News" / "GitHub" / "TechCrunch AI" */
  sourceName: string;
  /** 热度分（points / stars / comments），用于排序 */
  score: number;
  /** ISO 时间字符串 */
  publishedAt: string;
  tags: string[];
}

/** 单个数据源抓取结果，带上失败信息以便前端提示（某个源挂掉不影响整体） */
export interface SourceResult {
  sourceName: string;
  items: ContentItem[];
  error?: string;
}

export interface DashboardPayload {
  items: ContentItem[];
  /** 每个源的抓取状态，用于 Header 上的健康提示 */
  sources: { name: string; count: number; error?: string }[];
  fetchedAt: string;
  /** 是否为离线示例数据（DASHBOARD_FIXTURES=1 时为 true） */
  fixtures?: boolean;
}

export type SortMode = "score" | "date";
