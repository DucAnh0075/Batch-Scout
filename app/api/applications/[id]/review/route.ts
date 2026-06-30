import { NextResponse } from "next/server";
import {
  getApplication,
  getApplicationView,
  updateApplicationStatus,
  upsertReview,
} from "@/lib/db";
import { HUMAN_VERDICT_ORDER, STATUS_ORDER } from "@/lib/labels";
import type { ApplicationStatus, HumanVerdict } from "@/lib/types";

export const dynamic = "force-dynamic";

// Concept step [9]: the human override. The reviewer's decision always wins and is stored
// separately from the (immutable) AI scorecard. Nothing here ever auto-rejects.
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const app = getApplication(id);
  if (!app) {
    return NextResponse.json({ error: "Bewerbung nicht gefunden." }, { status: 404 });
  }

  let body: {
    human_verdict?: HumanVerdict | null;
    human_notes?: string | null;
    shortlisted?: boolean;
    status?: ApplicationStatus;
    reviewed_by?: string | null;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Ungültiges JSON." }, { status: 400 });
  }

  if (
    body.human_verdict != null &&
    !HUMAN_VERDICT_ORDER.includes(body.human_verdict)
  ) {
    return NextResponse.json({ error: "Ungültiges human_verdict." }, { status: 400 });
  }
  if (body.status != null && !STATUS_ORDER.includes(body.status)) {
    return NextResponse.json({ error: "Ungültiger Status." }, { status: 400 });
  }

  upsertReview({
    application_id: id,
    human_verdict: body.human_verdict,
    human_notes: body.human_notes,
    shortlisted: body.shortlisted,
    reviewed_by: body.reviewed_by ?? "Jury",
  });

  if (body.status) {
    updateApplicationStatus(id, body.status);
  }

  return NextResponse.json({ view: getApplicationView(id) });
}
