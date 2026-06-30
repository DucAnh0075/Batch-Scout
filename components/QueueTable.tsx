"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { ApplicationStatus, ApplicationView } from "@/lib/types";
import { STATUS_LABELS, STATUS_ORDER } from "@/lib/labels";
import { StatusBadge, VerdictBadge } from "./Badges";
import { ScoreBar } from "./ScoreBar";

type SortKey = "score" | "name" | "status";

export function QueueTable({ views }: { views: ApplicationView[] }) {
  const [statusFilter, setStatusFilter] = useState<ApplicationStatus | "all">("all");
  const [sortKey, setSortKey] = useState<SortKey>("score");

  const statusesPresent = useMemo(
    () => STATUS_ORDER.filter((s) => views.some((v) => v.application.status === s)),
    [views],
  );

  const rows = useMemo(() => {
    const filtered =
      statusFilter === "all"
        ? views
        : views.filter((v) => v.application.status === statusFilter);
    const sorted = [...filtered];
    sorted.sort((a, b) => {
      if (sortKey === "name") {
        return a.application.startup_name.localeCompare(b.application.startup_name);
      }
      if (sortKey === "status") {
        return (
          STATUS_ORDER.indexOf(a.application.status) -
          STATUS_ORDER.indexOf(b.application.status)
        );
      }
      return (b.scorecard?.overall_score ?? -1) - (a.scorecard?.overall_score ?? -1);
    });
    return sorted;
  }, [views, statusFilter, sortKey]);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3 text-sm">
        <label className="flex items-center gap-2">
          <span className="text-slate-500">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as ApplicationStatus | "all")}
            className="rounded-md border border-slate-300 bg-white px-2 py-1"
          >
            <option value="all">Alle ({views.length})</option>
            {statusesPresent.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABELS[s]} (
                {views.filter((v) => v.application.status === s).length})
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-2">
          <span className="text-slate-500">Sortierung:</span>
          <select
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value as SortKey)}
            className="rounded-md border border-slate-300 bg-white px-2 py-1"
          >
            <option value="score">Score (hoch → niedrig)</option>
            <option value="name">Startup (A → Z)</option>
            <option value="status">Status</option>
          </select>
        </label>
      </div>

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3 font-medium">Startup</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Verdict</th>
              <th className="px-4 py-3 font-medium">Score</th>
              <th className="px-4 py-3 font-medium">Top Red Flag</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((v) => {
              const sc = v.scorecard;
              const topFlag = sc?.red_flags[0];
              return (
                <tr key={v.application.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <Link
                      href={`/applications/${v.application.id}`}
                      className="font-medium text-slate-900 hover:underline"
                    >
                      {v.application.startup_name}
                    </Link>
                    <div className="text-xs text-slate-400">
                      {v.application.founder_name}
                      {v.review?.shortlisted && (
                        <span className="ml-2 text-emerald-600">★ Shortlist</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={v.application.status} />
                  </td>
                  <td className="px-4 py-3">
                    {sc ? <VerdictBadge verdict={sc.verdict} /> : <span className="text-slate-300">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    {sc ? <ScoreBar score={sc.overall_score} /> : <span className="text-slate-300">—</span>}
                  </td>
                  <td className="px-4 py-3 text-slate-500">
                    {topFlag ? (
                      <span className="text-rose-600">⚑ {topFlag}</span>
                    ) : (
                      <span className="text-slate-300">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
