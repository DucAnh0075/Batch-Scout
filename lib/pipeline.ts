import { upsertScorecard, updateApplicationStatus, getApplicationView } from "./db";
import { scoreApplication } from "./scoring";
import type { ApplicationRecord, ApplicationView } from "./types";

// Runs the score step and applies the resulting status transition. Shared by the
// intake (?score=1) and the explicit /score route so the rules live in one place.
//
// Status rules:
//  - prefilter says incomplete/out-of-scope  -> "prefiltered" (needs a human follow-up)
//  - verdict "open_accelerator"               -> "routed_open"
//  - otherwise                                -> "scored" (in the jury queue)
export async function runScoring(app: ApplicationRecord): Promise<ApplicationView> {
  const scorecard = await scoreApplication(app);
  upsertScorecard(scorecard);

  const pre = scorecard.prefilter;
  if (pre && (!pre.complete || !pre.in_scope)) {
    updateApplicationStatus(app.id, "prefiltered");
  } else if (scorecard.verdict === "open_accelerator") {
    updateApplicationStatus(app.id, "routed_open");
  } else {
    updateApplicationStatus(app.id, "scored");
  }

  return getApplicationView(app.id)!;
}
