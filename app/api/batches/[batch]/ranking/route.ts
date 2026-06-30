import { NextResponse } from "next/server";
import { listApplicationViews } from "@/lib/db";
import type { ApplicationView } from "@/lib/types";

export const dynamic = "force-dynamic";

// Concept step [10]: batch comparison / ranking data, sorted by overall score (desc).
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ batch: string }> },
) {
  const { batch } = await params;
  const views = listApplicationViews({ batch });
  const ranked = [...views].sort(byScoreDesc);
  return NextResponse.json({ batch, applications: ranked });
}

function byScoreDesc(a: ApplicationView, b: ApplicationView): number {
  return (b.scorecard?.overall_score ?? -1) - (a.scorecard?.overall_score ?? -1);
}
