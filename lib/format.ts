import type { SourceType } from "@/lib/types";

/** 相对时间，如 "3小时前" */
export function relativeTime(iso: string, now: number = Date.now()): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";

  const diffSec = Math.round((now - then) / 1000);
  if (diffSec < 0) return "刚刚";
  if (diffSec < 60) return "刚刚";

  const mins = Math.floor(diffSec / 60);
  if (mins < 60) return `${mins}分钟前`;

  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}小时前`;

  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}天前`;

  const months = Math.floor(days / 30);
  if (months < 12) return `${months}个月前`;

  return `${Math.floor(months / 12)}年前`;
}

export function absoluteTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

/** 热度前缀图标：GitHub 用星，其余用赞 */
export function scoreIcon(sourceName: string): string {
  return sourceName === "GitHub" ? "⭐" : "👍";
}

export function formatScore(score: number): string {
  if (score >= 10000) return `${(score / 1000).toFixed(1)}k`;
  if (score >= 1000) return `${(score / 1000).toFixed(1)}k`;
  return String(score);
}

/**
 * 来源 Badge 配色。
 * 强调色（靛蓝）全局只留给热度/选中态，所以这里用低饱和的色相区分来源，
 * 保持克制不花哨。
 */
const SOURCE_HUES: Record<string, number> = {
  "Hacker News": 24,
  GitHub: 0,
  "TechCrunch AI": 145,
  "VentureBeat AI": 265,
  "The Verge AI": 315,
  "Ars Technica AI": 195,
  "MIT Tech Review AI": 355,
  "OpenAI Blog": 165,
  "Hugging Face Blog": 45,
  // 「全球看中国」的来源
  "BBC 中国": 5,
  "The Guardian 中国": 210,
  "NYT 亚太": 220,
  "SCMP 南华早报": 30,
  "Al Jazeera": 40,
  "德国之声 DW": 15,
  "France 24 亚太": 230,
  日经亚洲: 340,
  "The Diplomat": 200,
  "NPR 国际": 250,
  "Google News 涉华": 100,
  Reddit: 20,
  Bluesky: 205,
};

export function sourceBadgeStyle(sourceName: string): React.CSSProperties {
  const hue = SOURCE_HUES[sourceName] ?? hashHue(sourceName);
  // GitHub 和 X 的品牌色都是黑白，用中性灰而不是硬凑一个色相
  if (sourceName === "GitHub" || sourceName === "X") {
    return {
      color: "#d4d4d8",
      backgroundColor: "rgba(255,255,255,0.06)",
      borderColor: "rgba(255,255,255,0.14)",
    };
  }
  return {
    color: `hsl(${hue} 70% 72%)`,
    backgroundColor: `hsl(${hue} 70% 55% / 0.12)`,
    borderColor: `hsl(${hue} 70% 60% / 0.28)`,
  };
}

function hashHue(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash * 31 + value.charCodeAt(i)) % 360;
  }
  return hash;
}

export const SOURCE_TYPE_LABEL: Record<SourceType, string> = {
  news: "资讯",
  community: "社区",
  skill_tool: "工具",
  china_watch: "涉华",
};
