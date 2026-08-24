import { NextResponse } from "next/server";
import { loadGithub } from "@/lib/aggregate";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const force = new URL(request.url).searchParams.get("refresh") === "1";
  try {
    const result = await loadGithub({ force });
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { sourceName: "GitHub", items: [], error: message(error) },
      { status: 502 },
    );
  }
}

function message(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}
