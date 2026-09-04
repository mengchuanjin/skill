import { NextResponse } from "next/server";
import { loadChina } from "@/lib/aggregate";

export const dynamic = "force-dynamic";
// 十几个境外源一起抓，Vercel 默认 10s 不够用
export const maxDuration = 30;

export async function GET(request: Request) {
  const force = new URL(request.url).searchParams.get("refresh") === "1";
  try {
    const results = await loadChina({ force });
    return NextResponse.json(results);
  } catch (error) {
    return NextResponse.json(
      [{ sourceName: "全球看中国", items: [], error: message(error) }],
      { status: 502 },
    );
  }
}

function message(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}
