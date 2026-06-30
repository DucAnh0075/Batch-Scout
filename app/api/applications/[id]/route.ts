import { NextResponse } from "next/server";
import { getApplicationView } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const view = getApplicationView(id);
  if (!view) {
    return NextResponse.json({ error: "Bewerbung nicht gefunden." }, { status: 404 });
  }
  return NextResponse.json({ view });
}
