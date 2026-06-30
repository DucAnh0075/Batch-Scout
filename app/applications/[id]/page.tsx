import Link from "next/link";
import { notFound } from "next/navigation";
import { getApplicationView } from "@/lib/db";
import type { ApplicationAnswers } from "@/lib/types";
import { CriterionCard } from "@/components/CriterionCard";
import { RedFlagList } from "@/components/RedFlagList";
import { ScoreBar } from "@/components/ScoreBar";
import { StatusBadge, VerdictBadge } from "@/components/Badges";
import { ReviewPanel } from "@/components/ReviewPanel";

export const dynamic = "force-dynamic";

const ANSWER_LABELS: Record<keyof ApplicationAnswers, string> = {
  problem: "Problem",
  solution: "Lösung",
  traction: "Traktion / erste Kunden",
  ai_usage: "KI-Einsatz",
  team: "Team",
  scale_status: "Phase / Skalierung",
  cologne_presence: "Präsenz in Köln (4 Monate)",
};

export default async function ApplicationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const view = getApplicationView(id);
  if (!view) notFound();

  const { application, scorecard, review } = view;

  return (
    <div className="space-y-6">
      <Link href="/" className="text-sm text-slate-500 hover:underline">
        ← Zurück zur Queue
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight">
              {application.startup_name}
            </h1>
            <StatusBadge status={application.status} />
          </div>
          <p className="mt-1 text-sm text-slate-500">
            {application.founder_name} · {application.email}
            {application.website && (
              <>
                {" · "}
                <a
                  href={application.website}
                  target="_blank"
                  rel="noreferrer"
                  className="text-slate-700 underline"
                >
                  {application.website}
                </a>
              </>
            )}
          </p>
        </div>
        {scorecard && (
          <div className="flex items-center gap-4">
            <VerdictBadge verdict={scorecard.verdict} />
            <ScoreBar score={scorecard.overall_score} />
          </div>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {scorecard ? (
            <>
              <section className="rounded-lg border border-slate-200 bg-white p-5">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                  Zusammenfassung (KI)
                </h2>
                <p className="mt-2 text-slate-700">{scorecard.summary}</p>
                {scorecard.prefilter && (
                  <p className="mt-3 rounded bg-slate-50 px-3 py-2 text-xs text-slate-500">
                    Vorfilter: {scorecard.prefilter.complete ? "vollständig" : "unvollständig"},{" "}
                    {scorecard.prefilter.in_scope ? "im Scope" : "außerhalb Scope"} —{" "}
                    {scorecard.prefilter.reason}
                  </p>
                )}
              </section>

              <section className="space-y-3">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                  Bewertung der sechs Kriterien
                </h2>
                <div className="grid gap-3 sm:grid-cols-2">
                  {scorecard.criteria.map((c) => (
                    <CriterionCard key={c.key} criterion={c} />
                  ))}
                </div>
              </section>

              <section className="rounded-lg border border-slate-200 bg-white p-5">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                  Red Flags
                </h2>
                <div className="mt-3">
                  <RedFlagList flags={scorecard.red_flags} />
                </div>
              </section>
            </>
          ) : (
            <section className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center text-slate-500">
              Noch keine Scorecard. Nutze „Neu bewerten" im Panel rechts (benötigt API-Key).
            </section>
          )}

          <section className="rounded-lg border border-slate-200 bg-white p-5">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              Bewerbung (Originalangaben)
            </h2>
            <dl className="mt-3 space-y-3">
              {(Object.keys(ANSWER_LABELS) as (keyof ApplicationAnswers)[]).map((key) => (
                <div key={key}>
                  <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
                    {ANSWER_LABELS[key]}
                  </dt>
                  <dd className="mt-0.5 text-sm text-slate-700">
                    {application.answers[key] || "—"}
                  </dd>
                </div>
              ))}
            </dl>
            {application.enrichment_text && (
              <div className="mt-4 border-t border-slate-100 pt-4">
                <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  Angereicherter Website-Text
                </dt>
                <dd className="mt-1 max-h-40 overflow-y-auto text-xs text-slate-500">
                  {application.enrichment_text}
                </dd>
              </div>
            )}
          </section>
        </div>

        <div className="space-y-4 lg:col-span-1">
          <ReviewPanel
            applicationId={application.id}
            status={application.status}
            review={review}
            canScore
          />
          {scorecard && (
            <p className="px-1 text-xs text-slate-400">
              Modell: {scorecard.model} · Prompt {scorecard.prompt_version} · erstellt{" "}
              {new Date(scorecard.created_at).toLocaleString("de-DE")}.{" "}
              <Link href="/kriterien" className="underline">
                Kriterien & Prompt
              </Link>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
