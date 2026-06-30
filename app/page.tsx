import Link from "next/link";
import { listApplicationViews, listBatches } from "@/lib/db";
import { hasApiKey } from "@/lib/scoring";
import { QueueTable } from "@/components/QueueTable";

export const dynamic = "force-dynamic";

const DEFAULT_BATCH = "batch-3";

export default async function QueuePage({
  searchParams,
}: {
  searchParams: Promise<{ batch?: string }>;
}) {
  const { batch } = await searchParams;
  const batches = listBatches();
  const activeBatch = batch ?? (batches.includes(DEFAULT_BATCH) ? DEFAULT_BATCH : batches[0]);
  const views = activeBatch ? listApplicationViews({ batch: activeBatch }) : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Review-Queue</h1>
          <p className="mt-1 text-sm text-slate-500">
            Eingehende Bewerbungen, vorsortiert nach den sechs Auswahlkriterien.
            Die Jury sichtet, überschreibt und entscheidet.
          </p>
        </div>
        {batches.length > 1 && (
          <div className="flex gap-1 text-sm">
            {batches.map((b) => (
              <Link
                key={b}
                href={`/?batch=${b}`}
                className={`rounded-md px-3 py-1.5 font-medium ${
                  b === activeBatch
                    ? "bg-slate-900 text-white"
                    : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"
                }`}
              >
                {b}
              </Link>
            ))}
          </div>
        )}
      </div>

      {!hasApiKey() && (
        <p className="rounded-md bg-slate-100 px-4 py-2 text-xs text-slate-500">
          Live-Scoring ist deaktiviert (kein <code>ANTHROPIC_API_KEY</code> gesetzt). Die
          angezeigten Scorecards stammen aus den Seed-Daten.
        </p>
      )}

      {views.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-300 bg-white p-12 text-center">
          <p className="text-slate-500">
            Noch keine Bewerbungen. Lege welche über{" "}
            <Link href="/intake" className="font-medium text-slate-900 underline">
              Intake
            </Link>{" "}
            an oder führe <code className="rounded bg-slate-100 px-1">npm run seed</code> aus.
          </p>
        </div>
      ) : (
        <QueueTable views={views} />
      )}
    </div>
  );
}
