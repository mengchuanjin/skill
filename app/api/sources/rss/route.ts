import { NextResponse } from "next/server";
import { loadRss } from "@/lib/aggregate";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const force = new URL(request.url).searchParams.get("refresh") === "1";
  try {
    const results = await loadRss({ force });
    return NextResponse.json(results);
  } catch (error) {
    return NextResponse.json(
      [{ sourceName: "RSS", items: [], error: message(error) }],
      { status: 502 },
    );
  }
}

function message(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}
