import type { ApplicationStatus, Verdict } from "@/lib/types";
import {
  STATUS_BADGE_CLASS,
  STATUS_LABELS,
  VERDICT_BADGE_CLASS,
  VERDICT_LABELS,
} from "@/lib/labels";

function Badge({ className, children }: { className: string; children: React.ReactNode }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${className}`}
    >
      {children}
    </span>
  );
}

export function VerdictBadge({ verdict }: { verdict: Verdict }) {
  return <Badge className={VERDICT_BADGE_CLASS[verdict]}>{VERDICT_LABELS[verdict]}</Badge>;
}

export function StatusBadge({ status }: { status: ApplicationStatus }) {
  return <Badge className={STATUS_BADGE_CLASS[status]}>{STATUS_LABELS[status]}</Badge>;
}
