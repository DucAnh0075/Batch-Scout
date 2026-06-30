import type { ApplicationStatus, HumanVerdict, Verdict } from "./types";

export const VERDICT_LABELS: Record<Verdict, string> = {
  strong: "Starker Fit",
  borderline: "Grenzfall",
  weak: "Schwacher Fit",
  open_accelerator: "→ Open Accelerator",
};

export const STATUS_LABELS: Record<ApplicationStatus, string> = {
  new: "Neu",
  prefiltered: "Vorfilter offen",
  scored: "Bewertet – zu prüfen",
  in_review: "In Prüfung",
  decided: "Entschieden",
  routed_open: "Open Accelerator",
};

export const HUMAN_VERDICT_LABELS: Record<HumanVerdict, string> = {
  shortlist: "Shortlist",
  interview: "Zum Gespräch",
  reject: "Ablehnen",
  open_accelerator: "Open Accelerator",
};

export const STATUS_ORDER: ApplicationStatus[] = [
  "new",
  "prefiltered",
  "scored",
  "in_review",
  "decided",
  "routed_open",
];

export const HUMAN_VERDICT_ORDER: HumanVerdict[] = [
  "shortlist",
  "interview",
  "open_accelerator",
  "reject",
];

// Tailwind utility classes for badge colors, kept here so badges stay consistent.
export const VERDICT_BADGE_CLASS: Record<Verdict, string> = {
  strong: "bg-emerald-100 text-emerald-800 ring-emerald-600/20",
  borderline: "bg-amber-100 text-amber-800 ring-amber-600/20",
  weak: "bg-rose-100 text-rose-800 ring-rose-600/20",
  open_accelerator: "bg-sky-100 text-sky-800 ring-sky-600/20",
};

export const STATUS_BADGE_CLASS: Record<ApplicationStatus, string> = {
  new: "bg-slate-100 text-slate-700 ring-slate-600/20",
  prefiltered: "bg-orange-100 text-orange-800 ring-orange-600/20",
  scored: "bg-indigo-100 text-indigo-800 ring-indigo-600/20",
  in_review: "bg-violet-100 text-violet-800 ring-violet-600/20",
  decided: "bg-emerald-100 text-emerald-800 ring-emerald-600/20",
  routed_open: "bg-sky-100 text-sky-800 ring-sky-600/20",
};

export function scoreColorClass(score: number): string {
  if (score >= 70) return "bg-emerald-500";
  if (score >= 45) return "bg-amber-500";
  return "bg-rose-500";
}
