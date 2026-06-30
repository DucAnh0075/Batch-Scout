import type { CriterionKey } from "./criteria";

export type ApplicationStatus =
  | "new" // intake received, not yet evaluated
  | "prefiltered" // failed the cheap completeness/scope prefilter
  | "scored" // AI scorecard generated, awaiting human review
  | "in_review" // a reviewer is working on it
  | "decided" // human reached a final decision
  | "routed_open"; // routed to the Open Accelerator (idea stage)

export type Verdict = "strong" | "borderline" | "weak" | "open_accelerator";

export type HumanVerdict = "shortlist" | "interview" | "reject" | "open_accelerator";

/** Normalized application fields mapped from the Typeform payload. */
export interface ApplicationAnswers {
  problem: string;
  solution: string;
  traction: string;
  ai_usage: string;
  team: string;
  scale_status: string;
  cologne_presence: string;
}

export interface ApplicationRecord {
  id: string;
  batch: string;
  status: ApplicationStatus;
  submitted_at: string;
  founder_name: string;
  startup_name: string;
  email: string;
  website: string | null;
  answers: ApplicationAnswers;
  enrichment_text: string | null;
  created_at: string;
}

export interface CriterionScore {
  key: CriterionKey;
  score: number; // 0–5
  justification: string;
  evidence_quote: string;
}

export interface PrefilterResult {
  complete: boolean;
  in_scope: boolean;
  reason: string;
}

export interface ScorecardRecord {
  id: string;
  application_id: string;
  model: string;
  prompt_version: string;
  overall_score: number; // 0–100
  verdict: Verdict;
  summary: string;
  criteria: CriterionScore[];
  red_flags: string[];
  prefilter: PrefilterResult | null;
  created_at: string;
}

export interface ReviewRecord {
  application_id: string;
  human_verdict: HumanVerdict | null;
  human_notes: string | null;
  shortlisted: boolean;
  reviewed_by: string | null;
  reviewed_at: string | null;
}

/** Joined view used by list/detail/ranking endpoints and the UI. */
export interface ApplicationView {
  application: ApplicationRecord;
  scorecard: ScorecardRecord | null;
  review: ReviewRecord | null;
}
