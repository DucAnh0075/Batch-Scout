import { scoreColorClass } from "@/lib/labels";

/** Overall 0–100 score as a labelled bar. */
export function ScoreBar({ score }: { score: number }) {
  return (
    <div className="flex items-center gap-2">
      <div className="h-2 w-24 overflow-hidden rounded-full bg-slate-200">
        <div
          className={`h-full rounded-full ${scoreColorClass(score)}`}
          style={{ width: `${score}%` }}
        />
      </div>
      <span className="w-8 text-right text-sm font-semibold tabular-nums text-slate-700">
        {score}
      </span>
    </div>
  );
}

/** Criterion 0–5 score as five pips. */
export function ScorePips({ score }: { score: number }) {
  return (
    <div className="flex items-center gap-1" aria-label={`${score} von 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span
          key={i}
          className={`h-2.5 w-2.5 rounded-full ${
            i <= score ? "bg-slate-700" : "bg-slate-200"
          }`}
        />
      ))}
      <span className="ml-1 text-xs font-medium tabular-nums text-slate-500">
        {score}/5
      </span>
    </div>
  );
}
