import { NextResponse } from "next/server";
import { insertApplication, getApplication } from "@/lib/db";
import { normalizeIntake } from "@/lib/normalize";
import { runScoring } from "@/lib/pipeline";
import { hasApiKey, MissingApiKeyError } from "@/lib/scoring";

export const dynamic = "force-dynamic";

// Concept steps [1]/[2]: accept a Typeform-shaped (or flat) payload, normalize, store as "new".
// With ?score=1 it also runs the prefilter + scoring inline (steps [4]/[5]) for demo convenience.
export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Ungültiges JSON." }, { status: 400 });
  }

  let input;
  try {
    input = normalizeIntake(payload);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Mapping fehlgeschlagen." },
      { status: 400 },
    );
  }

  if (!input.startup_name || !input.email) {
    return NextResponse.json(
      { error: "Pflichtfelder fehlen (startup_name, email)." },
      { status: 400 },
    );
  }

  const app = insertApplication(input);

  const { searchParams } = new URL(request.url);
  const shouldScore = searchParams.get("score") === "1";

  if (shouldScore) {
    if (!hasApiKey()) {
      return NextResponse.json(
        {
          application_id: app.id,
          scored: false,
          warning: new MissingApiKeyError().message,
        },
        { status: 202 },
      );
    }
    try {
      const view = await runScoring(getApplication(app.id)!);
      return NextResponse.json({ application_id: app.id, scored: true, view }, { status: 201 });
    } catch (err) {
      return NextResponse.json(
        {
          application_id: app.id,
          scored: false,
          error: err instanceof Error ? err.message : "Scoring fehlgeschlagen.",
        },
        { status: 502 },
      );
    }
  }

  return NextResponse.json({ application_id: app.id, scored: false }, { status: 201 });
}
