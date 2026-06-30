"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ApplicationView } from "@/lib/types";
import { CRITERIA } from "@/lib/criteria";
import { VerdictBadge } from "./Badges";

// Concept step [10]: side-by-side ranking with per-criterion scores and a shortlist toggle.
export function BatchComparison({ views }: { views: ApplicationView[] }) {
  const router = useRouter();
  const [onlyShortlist, setOnlyShortlist] = useState(false);
  const [pending, setPending] = useState<string | null>(null);

  const rows = useMemo(() => {
    const filtered = onlyShortlist ? views.filter((v) => v.review?.shortlisted) : views;
    return [...filtered].sort(
      (a, b) => (b.scorecard?.overall_score ?? -1) - (a.scorecard?.overall_score ?? -1),
    );
  }, [views, onlyShortlist]);

  const shortlistCount = views.filter((v) => v.review?.shortlisted).length;

  async function toggleShortlist(v: ApplicationView) {
    setPending(v.application.id);
    try {
      await fetch(`/api/applications/${v.application.id}/review`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shortlisted: !v.review?.shortlisted }),
      });
      router.refresh();
    } finally {
      setPending(null);
    }
  }

  return (
    <div className="space-y-3">
      <label className="flex items-center gap-2 text-sm text-slate-600">
        <input
          type="checkbox"
          checked={onlyShortlist}
          onChange={(e) => setOnlyShortlist(e.target.checked)}
          className="h-4 w-4 rounded border-slate-300"
        />
        Nur Shortlist anzeigen ({shortlistCount})
      </label>

      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="w-full min-w-[820px] text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-3 py-3 font-medium">#</th>
              <th className="px-3 py-3 font-medium">Startup</th>
              <th className="px-3 py-3 font-medium">Verdict</th>
              <th className="px-3 py-3 text-right font-medium">Σ</th>
              {CRITERIA.map((c, i) => (
                <th
                  key={c.key}
                  className="px-2 py-3 text-center font-medium"
                  title={c.label}
                >
                  K{i + 1}
                </th>
              ))}
              <th className="px-3 py-3 text-center font-medium">Shortlist</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((v, idx) => {
              const sc = v.scorecard;
              const byKey = new Map(sc?.criteria.map((c) => [c.key, c.score]));
              return (
                <tr key={v.application.id} className="hover:bg-slate-50">
                  <td className="px-3 py-3 text-slate-400">{idx + 1}</td>
                  <td className="px-3 py-3">
                    <Link
                      href={`/applications/${v.application.id}`}
                      className="font-medium text-slate-900 hover:underline"
                    >
                      {v.application.startup_name}
                    </Link>
                  </td>
                  <td className="px-3 py-3">
                    {sc ? <VerdictBadge verdict={sc.verdict} /> : "—"}
                  </td>
                  <td className="px-3 py-3 text-right font-semibold tabular-nums">
                    {sc?.overall_score ?? "—"}
                  </td>
                  {CRITERIA.map((c) => {
                    const s = byKey.get(c.key);
                    return (
                      <td key={c.key} className="px-2 py-3 text-center tabular-nums">
                        <span
                          className={
                            s == null
                              ? "text-slate-300"
                              : s >= 4
                                ? "text-emerald-600"
                                : s <= 1
                                  ? "text-rose-600"
                                  : "text-slate-600"
                          }
                        >
                          {s ?? "—"}
                        </span>
                      </td>
                    );
                  })}
                  <td className="px-3 py-3 text-center">
                    <button
                      type="button"
                      onClick={() => toggleShortlist(v)}
                      disabled={pending === v.application.id}
                      className={`text-lg leading-none transition disabled:opacity-40 ${
                        v.review?.shortlisted ? "text-amber-500" : "text-slate-300 hover:text-amber-400"
                      }`}
                      aria-label="Shortlist umschalten"
                    >
                      ★
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-slate-400">
        K1–K6 = die sechs Kriterien (0–5). Reihenfolge wie auf der{" "}
        <Link href="/kriterien" className="underline">
          Kriterien-Seite
        </Link>
        .
      </p>
    </div>
  );
}
