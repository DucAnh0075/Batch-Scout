import { CRITERIA_BY_KEY } from "@/lib/criteria";
import type { CriterionScore } from "@/lib/types";
import { ScorePips } from "./ScoreBar";

export function CriterionCard({ criterion }: { criterion: CriterionScore }) {
  const meta = CRITERIA_BY_KEY[criterion.key];
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="flex items-start justify-between gap-4">
        <h3 className="text-sm font-semibold text-slate-900">{meta.label}</h3>
        <ScorePips score={criterion.score} />
      </div>
      <p className="mt-2 text-sm text-slate-600">{criterion.justification}</p>
      {criterion.evidence_quote && (
        <blockquote className="mt-2 border-l-2 border-slate-300 pl-3 text-sm italic text-slate-500">
          „{criterion.evidence_quote}"
        </blockquote>
      )}
    </div>
  );
}
