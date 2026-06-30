"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { ApplicationStatus, HumanVerdict, ReviewRecord } from "@/lib/types";
import {
  HUMAN_VERDICT_LABELS,
  HUMAN_VERDICT_ORDER,
  STATUS_LABELS,
  STATUS_ORDER,
} from "@/lib/labels";

// The human override (concept step [9]). Visually the dominant action on the page:
// the reviewer's verdict always wins over the AI scorecard.
export function ReviewPanel({
  applicationId,
  status,
  review,
  canScore,
}: {
  applicationId: string;
  status: ApplicationStatus;
  review: ReviewRecord | null;
  canScore?: boolean;
}) {
  const router = useRouter();
  const [humanVerdict, setHumanVerdict] = useState<HumanVerdict | "">(
    review?.human_verdict ?? "",
  );
  const [newStatus, setNewStatus] = useState<ApplicationStatus>(status);
  const [notes, setNotes] = useState(review?.human_notes ?? "");
  const [shortlisted, setShortlisted] = useState(review?.shortlisted ?? false);
  const [busy, setBusy] = useState<"save" | "score" | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function save() {
    setBusy("save");
    setMessage(null);
    try {
      const res = await fetch(`/api/applications/${applicationId}/review`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          human_verdict: humanVerdict || null,
          human_notes: notes,
          shortlisted,
          status: newStatus,
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Fehler");
      setMessage("Gespeichert.");
      router.refresh();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Fehler beim Speichern.");
    } finally {
      setBusy(null);
    }
  }

  async function rescore() {
    setBusy("score");
    setMessage(null);
    try {
      const res = await fetch(`/api/applications/${applicationId}/score`, {
        method: "POST",
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Fehler");
      setMessage("Neu bewertet.");
      router.refresh();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Scoring fehlgeschlagen.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="rounded-lg border-2 border-slate-900 bg-white p-5">
      <h2 className="text-sm font-bold text-slate-900">Menschliche Entscheidung</h2>
      <p className="mt-1 text-xs text-slate-500">
        Überschreibt die KI-Bewertung. Die menschliche Bewertung gewinnt immer.
      </p>

      <div className="mt-4 space-y-4">
        <div>
          <label className="block text-xs font-medium text-slate-600">Verdict (Mensch)</label>
          <div className="mt-1 flex flex-wrap gap-1.5">
            {HUMAN_VERDICT_ORDER.map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setHumanVerdict(humanVerdict === v ? "" : v)}
                className={`rounded-md px-2.5 py-1 text-xs font-medium ring-1 ring-inset transition ${
                  humanVerdict === v
                    ? "bg-slate-900 text-white ring-slate-900"
                    : "bg-white text-slate-600 ring-slate-300 hover:bg-slate-50"
                }`}
              >
                {HUMAN_VERDICT_LABELS[v]}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-600">Status</label>
          <select
            value={newStatus}
            onChange={(e) => setNewStatus(e.target.value as ApplicationStatus)}
            className="mt-1 w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm"
          >
            {STATUS_ORDER.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABELS[s]}
              </option>
            ))}
          </select>
        </div>

        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={shortlisted}
            onChange={(e) => setShortlisted(e.target.checked)}
            className="h-4 w-4 rounded border-slate-300"
          />
          Auf Shortlist
        </label>

        <div>
          <label className="block text-xs font-medium text-slate-600">Notizen</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="Begründung, offene Fragen für das Gespräch …"
            className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
          />
        </div>

        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={save}
            disabled={busy !== null}
            className="rounded-md bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-50"
          >
            {busy === "save" ? "Speichert …" : "Entscheidung speichern"}
          </button>
          {canScore && (
            <button
              type="button"
              onClick={rescore}
              disabled={busy !== null}
              className="rounded-md bg-white px-3 py-2 text-sm font-medium text-slate-700 ring-1 ring-slate-300 hover:bg-slate-50 disabled:opacity-50"
            >
              {busy === "score" ? "Bewertet neu …" : "KI neu bewerten"}
            </button>
          )}
        </div>

        {message && <p className="text-xs text-slate-500">{message}</p>}
        {review?.reviewed_at && (
          <p className="text-xs text-slate-400">
            Zuletzt geprüft von {review.reviewed_by ?? "Jury"} am{" "}
            {new Date(review.reviewed_at).toLocaleString("de-DE")}.
          </p>
        )}
      </div>
    </div>
  );
}
