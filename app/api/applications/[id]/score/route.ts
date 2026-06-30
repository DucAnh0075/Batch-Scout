import { NextResponse } from "next/server";
import { getApplication } from "@/lib/db";
import { runScoring } from "@/lib/pipeline";
import { hasApiKey, MissingApiKeyError } from "@/lib/scoring";

export const dynamic = "force-dynamic";

// Concept steps [4]/[5]/[6]: (re-)run prefilter + scoring and persist the scorecard.
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const app = getApplication(id);
  if (!app) {
    return NextResponse.json({ error: "Bewerbung nicht gefunden." }, { status: 404 });
  }
  if (!hasApiKey()) {
    return NextResponse.json({ error: new MissingApiKeyError().message }, { status: 503 });
  }
  try {
    const view = await runScoring(app);
    return NextResponse.json({ view });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Scoring fehlgeschlagen." },
      { status: 502 },
    );
  }
}
