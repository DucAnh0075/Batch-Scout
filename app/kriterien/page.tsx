import { CRITERIA } from "@/lib/criteria";
import { PROMPT_VERSION } from "@/lib/prompts";
import { PREFILTER_MODEL, SCORING_MODEL } from "@/lib/scoring";

export const dynamic = "force-dynamic";

export default function KriterienPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Kriterien & Transparenz</h1>
        <p className="mt-1 text-sm text-slate-500">
          Prompt und Kriterien sind dokumentiert und versioniert, damit nachvollziehbar
          bleibt, <em>warum</em> ein Score zustande kam.
        </p>
      </div>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Die sechs Auswahlkriterien
        </h2>
        <ol className="space-y-3">
          {CRITERIA.map((c, i) => (
            <li key={c.key} className="rounded-lg border border-slate-200 bg-white p-4">
              <div className="flex items-baseline gap-2">
                <span className="text-sm font-bold text-slate-400">K{i + 1}</span>
                <h3 className="font-semibold text-slate-900">{c.label}</h3>
              </div>
              <p className="mt-1 text-sm text-slate-600">{c.description}</p>
              <p className="mt-2 text-xs text-slate-500">
                <span className="font-medium">Bewertungsanker (0–5):</span> {c.rubric}
              </p>
            </li>
          ))}
        </ol>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Modelle & Versionierung
          </h2>
          <dl className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-slate-500">Prompt-Version</dt>
              <dd className="font-mono text-slate-800">{PROMPT_VERSION}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Bewertung (tief)</dt>
              <dd className="font-mono text-slate-800">{SCORING_MODEL}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Vorfilter</dt>
              <dd className="font-mono text-slate-800">{PREFILTER_MODEL}</dd>
            </div>
          </dl>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Fairness & Datenschutz
          </h2>
          <ul className="mt-3 space-y-2 text-sm text-slate-600">
            <li>
              <strong>Entscheidungshilfe, keine Entscheidung.</strong> Die Auswahl der 10
              Startups trifft die Jury.
            </li>
            <li>Kein automatisiertes Aussortieren (DSGVO Art. 22) — das Tool sortiert vor.</li>
            <li>Override jederzeit möglich; die menschliche Bewertung gewinnt immer.</li>
            <li>
              Ideenphasen-Bewerbungen werden nicht abgelehnt, sondern Richtung{" "}
              <em>Open Accelerator</em> geroutet.
            </li>
            <li>Self-Hosting: Bewerberdaten bleiben lokal (SQLite); nur der Bewertungstext geht an die LLM-API.</li>
          </ul>
        </div>
      </section>
    </div>
  );
}
