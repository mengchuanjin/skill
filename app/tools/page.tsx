import type { Metadata } from "next";
import { SectionPage } from "@/components/section-page";

export const metadata: Metadata = { title: "最新 Skill / 工具 · AI 热点与 Skill 雷达" };

export default function Page() {
  return <SectionPage slug="tools" />;
}
