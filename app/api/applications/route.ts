import { NextResponse } from "next/server";
import { listApplicationViews } from "@/lib/db";
import type { ApplicationStatus } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const batch = searchParams.get("batch") ?? undefined;
  const status = (searchParams.get("status") as ApplicationStatus | null) ?? undefined;

  const views = listApplicationViews({ batch, status });
  return NextResponse.json({ applications: views });
}
