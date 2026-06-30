import { NextResponse } from "next/server";
import { getApplication, getApplicationView, updateApplicationEnrichment } from "@/lib/db";
import { enrichFromWebsite } from "@/lib/enrich";

export const dynamic = "force-dynamic";

// Concept step [3]: pull the startup website as plain text and attach it for scoring context.
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const app = getApplication(id);
  if (!app) {
    return NextResponse.json({ error: "Bewerbung nicht gefunden." }, { status: 404 });
  }
  if (!app.website) {
    return NextResponse.json({ error: "Keine Website hinterlegt." }, { status: 400 });
  }
  try {
    const text = await enrichFromWebsite(app.website);
    updateApplicationEnrichment(id, text);
    return NextResponse.json({ view: getApplicationView(id) });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Anreicherung fehlgeschlagen." },
      { status: 502 },
    );
  }
}
