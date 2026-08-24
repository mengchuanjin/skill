import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "AI 热点与 Skill 雷达",
  description: "聚合 AI 资讯、社区讨论与最新 Skill/工具的个人看板",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN" className={inter.variable}>
      <body className="antialiased">{children}</body>
    </html>
  );
}
