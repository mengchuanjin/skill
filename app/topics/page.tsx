import type { Metadata } from "next";
import { SectionPage } from "@/components/section-page";

export const metadata: Metadata = { title: "热门话题 · AI 热点与 Skill 雷达" };

export default function Page() {
  return <SectionPage slug="topics" />;
}
