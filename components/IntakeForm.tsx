"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const FIELDS: { name: string; label: string; type: "input" | "textarea"; required?: boolean }[] = [
  { name: "startup_name", label: "Startup-Name", type: "input", required: true },
  { name: "founder_name", label: "Gründer:in", type: "input", required: true },
  { name: "email", label: "E-Mail", type: "input", required: true },
  { name: "website", label: "Website (optional)", type: "input" },
  { name: "problem", label: "Welches Problem löst ihr?", type: "textarea" },
  { name: "solution", label: "Eure Lösung / Produkt", type: "textarea" },
  { name: "traction", label: "Erste Kunden / Traktion", type: "textarea" },
  { name: "ai_usage", label: "Wie nutzt ihr KI als Wachstumshebel?", type: "textarea" },
  { name: "team", label: "Team (Größe, Rollen)", type: "textarea" },
  { name: "scale_status", label: "Phase / Skalierungsstatus", type: "textarea" },
  { name: "cologne_presence", label: "4 Monate Präsenz in Köln machbar?", type: "input" },
];

const EMPTY = Object.fromEntries(FIELDS.map((f) => [f.name, ""])) as Record<string, string>;

export function IntakeForm({ canScore }: { canScore: boolean }) {
  const router = useRouter();
  const [values, setValues] = useState<Record<string, string>>(EMPTY);
  const [scoreNow, setScoreNow] = useState(canScore);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  function set(name: string, value: string) {
    setValues((v) => ({ ...v, [name]: value }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMessage(null);
    try {
      const url = scoreNow && canScore ? "/api/applications/intake?score=1" : "/api/applications/intake";
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ batch: "batch-3", ...values }),
      });
      const data = await res.json();
      if (!res.ok && res.status !== 202) {
        throw new Error(data.error ?? "Fehler beim Anlegen.");
      }
      if (data.application_id && data.scored) {
        router.push(`/applications/${data.application_id}`);
        return;
      }
      setMessage(
        data.warning
          ? `Angelegt (ohne Bewertung): ${data.warning}`
          : "Bewerbung angelegt. Bewertung kann auf der Detailseite ausgelöst werden.",
      );
      if (data.application_id) {
        router.push(`/applications/${data.application_id}`);
      }
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Fehler.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4 rounded-lg border border-slate-200 bg-white p-6">
      {FIELDS.map((f) => (
        <div key={f.name}>
          <label className="block text-sm font-medium text-slate-700">
            {f.label}
            {f.required && <span className="text-rose-500"> *</span>}
          </label>
          {f.type === "textarea" ? (
            <textarea
              value={values[f.name]}
              onChange={(e) => set(f.name, e.target.value)}
              required={f.required}
              rows={2}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
          ) : (
            <input
              value={values[f.name]}
              onChange={(e) => set(f.name, e.target.value)}
              required={f.required}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
          )}
        </div>
      ))}

      <label className="flex items-center gap-2 text-sm text-slate-700">
        <input
          type="checkbox"
          checked={scoreNow}
          disabled={!canScore}
          onChange={(e) => setScoreNow(e.target.checked)}
          className="h-4 w-4 rounded border-slate-300"
        />
        Sofort von Claude bewerten lassen
        {!canScore && <span className="text-xs text-slate-400">(kein API-Key gesetzt)</span>}
      </label>

      <button
        type="submit"
        disabled={busy}
        className="rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-50"
      >
        {busy ? "Wird angelegt …" : "Bewerbung anlegen"}
      </button>

      {message && <p className="text-sm text-slate-500">{message}</p>}
    </form>
  );
}
