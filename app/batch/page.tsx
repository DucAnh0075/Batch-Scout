import { listApplicationViews, listBatches } from "@/lib/db";
import { BatchComparison } from "@/components/BatchComparison";
import Link from "next/link";

export const dynamic = "force-dynamic";

const DEFAULT_BATCH = "batch-3";

export default async function BatchPage({
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
          <h1 className="text-2xl font-bold tracking-tight">Batch-Vergleich & Ranking</h1>
          <p className="mt-1 text-sm text-slate-500">
            Alle Bewerbungen eines Batches nebeneinander, sortierbar. Markiere die
            Shortlist für das Auswahlgespräch.
          </p>
        </div>
        {batches.length > 1 && (
          <div className="flex gap-1 text-sm">
            {batches.map((b) => (
              <Link
                key={b}
                href={`/batch?batch=${b}`}
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

      {views.length === 0 ? (
        <p className="rounded-lg border border-dashed border-slate-300 bg-white p-12 text-center text-slate-500">
          Keine Bewerbungen in diesem Batch.
        </p>
      ) : (
        <BatchComparison views={views} />
      )}
    </div>
  );
}
