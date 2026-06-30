import Anthropic from "@anthropic-ai/sdk";
import { CRITERION_KEYS, CRITERIA } from "./criteria";
import { PREFILTER_PROMPT, PROMPT_VERSION, SCORING_SYSTEM_PROMPT } from "./prompts";
import type {
  ApplicationRecord,
  CriterionScore,
  PrefilterResult,
  ScorecardRecord,
  Verdict,
} from "./types";
import type { ScorecardInput } from "./db";

export const SCORING_MODEL = process.env.SCORING_MODEL ?? "claude-sonnet-4-6";
export const PREFILTER_MODEL = process.env.PREFILTER_MODEL ?? "claude-haiku-4-5";

export class MissingApiKeyError extends Error {
  constructor() {
    super(
      "ANTHROPIC_API_KEY ist nicht gesetzt. Live-Scoring ist deaktiviert — die Demo läuft über die Seed-Daten.",
    );
    this.name = "MissingApiKeyError";
  }
}

function client(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new MissingApiKeyError();
  return new Anthropic({ apiKey });
}

export function hasApiKey(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

function renderApplication(app: ApplicationRecord): string {
  const a = app.answers;
  const lines = [
    `Startup: ${app.startup_name}`,
    `Gründer:in: ${app.founder_name}`,
    `Website: ${app.website ?? "—"}`,
    "",
    `Problem: ${a.problem}`,
    `Lösung: ${a.solution}`,
    `Traktion / erste Kunden: ${a.traction}`,
    `KI-Einsatz: ${a.ai_usage}`,
    `Team: ${a.team}`,
    `Phase / Skalierung: ${a.scale_status}`,
    `Präsenz in Köln (4 Monate): ${a.cologne_presence}`,
  ];
  if (app.enrichment_text) {
    lines.push("", "--- Angereicherter Website-Text ---", app.enrichment_text);
  }
  return lines.join("\n");
}

// ---------------------------------------------------------------------------
// Prefilter (Claude Haiku) — cheap completeness/scope check
// ---------------------------------------------------------------------------

const PREFILTER_TOOL: Anthropic.Tool = {
  name: "submit_prefilter",
  description: "Gib das Ergebnis des Vorfilters zurück.",
  input_schema: {
    type: "object",
    properties: {
      complete: { type: "boolean", description: "Pflichtangaben vorhanden?" },
      in_scope: { type: "boolean", description: "Plausibel ein KI-Startup im Programm-Scope?" },
      reason: { type: "string", description: "Kurze Begründung auf Deutsch." },
    },
    required: ["complete", "in_scope", "reason"],
  },
};

export async function prefilter(app: ApplicationRecord): Promise<PrefilterResult> {
  const res = await client().messages.create({
    model: PREFILTER_MODEL,
    max_tokens: 512,
    system: PREFILTER_PROMPT,
    tools: [PREFILTER_TOOL],
    tool_choice: { type: "tool", name: "submit_prefilter" },
    messages: [{ role: "user", content: renderApplication(app) }],
  });
  const input = firstToolInput(res, "submit_prefilter");
  return {
    complete: Boolean(input.complete),
    in_scope: Boolean(input.in_scope),
    reason: String(input.reason ?? ""),
  };
}

// ---------------------------------------------------------------------------
// Scoring (Claude Sonnet) — structured scorecard via forced tool-use
// ---------------------------------------------------------------------------

const SCORING_TOOL: Anthropic.Tool = {
  name: "submit_scorecard",
  description: "Gib die strukturierte Scorecard für die Bewerbung zurück.",
  input_schema: {
    type: "object",
    properties: {
      criteria: {
        type: "array",
        description: "Genau sechs Einträge, einer pro Kriterium.",
        items: {
          type: "object",
          properties: {
            key: { type: "string", enum: CRITERION_KEYS as unknown as string[] },
            score: { type: "integer", minimum: 0, maximum: 5 },
            justification: { type: "string" },
            evidence_quote: { type: "string" },
          },
          required: ["key", "score", "justification", "evidence_quote"],
        },
      },
      red_flags: { type: "array", items: { type: "string" } },
      verdict: {
        type: "string",
        enum: ["strong", "borderline", "weak", "open_accelerator"],
      },
      summary: { type: "string", description: "2–3 Sätze für die Jury." },
    },
    required: ["criteria", "red_flags", "verdict", "summary"],
  },
};

export interface ScoreResult {
  scorecard: ScorecardInput;
}

export async function scoreApplication(app: ApplicationRecord): Promise<ScorecardInput> {
  // Optional cheap prefilter first (concept step [4] / dual-model cost optimization).
  let pre: PrefilterResult | null = null;
  try {
    pre = await prefilter(app);
  } catch {
    pre = null; // prefilter is best-effort; never block scoring on it
  }

  const res = await client().messages.create({
    model: SCORING_MODEL,
    max_tokens: 2048,
    system: SCORING_SYSTEM_PROMPT,
    tools: [SCORING_TOOL],
    tool_choice: { type: "tool", name: "submit_scorecard" },
    messages: [{ role: "user", content: renderApplication(app) }],
  });

  const input = firstToolInput(res, "submit_scorecard");
  const criteria = normalizeCriteria(input.criteria);
  const verdict = (input.verdict as Verdict) ?? "borderline";
  const overall_score = computeOverallScore(criteria);

  return {
    application_id: app.id,
    model: SCORING_MODEL,
    prompt_version: PROMPT_VERSION,
    overall_score,
    verdict,
    summary: String(input.summary ?? ""),
    criteria,
    red_flags: Array.isArray(input.red_flags) ? input.red_flags.map(String) : [],
    prefilter: pre,
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function firstToolInput(
  res: Anthropic.Message,
  toolName: string,
): Record<string, unknown> {
  for (const block of res.content) {
    if (block.type === "tool_use" && block.name === toolName) {
      return block.input as Record<string, unknown>;
    }
  }
  throw new Error(`Claude hat das erwartete Tool "${toolName}" nicht aufgerufen.`);
}

/** Coerce the model output into exactly the six known criteria, in canonical order. */
function normalizeCriteria(raw: unknown): CriterionScore[] {
  const list = Array.isArray(raw) ? (raw as Record<string, unknown>[]) : [];
  const byKey = new Map<string, Record<string, unknown>>();
  for (const item of list) {
    if (item && typeof item.key === "string") byKey.set(item.key, item);
  }
  return CRITERIA.map((c) => {
    const item = byKey.get(c.key);
    const score = clampScore(item?.score);
    return {
      key: c.key,
      score,
      justification: String(item?.justification ?? "Keine Angabe."),
      evidence_quote: String(item?.evidence_quote ?? ""),
    };
  });
}

function clampScore(v: unknown): number {
  const n = Math.round(Number(v));
  if (Number.isNaN(n)) return 0;
  return Math.max(0, Math.min(5, n));
}

/** Overall 0–100 = average of the six 0–5 criterion scores. */
export function computeOverallScore(criteria: CriterionScore[]): number {
  if (criteria.length === 0) return 0;
  const sum = criteria.reduce((acc, c) => acc + c.score, 0);
  return Math.round((sum / (criteria.length * 5)) * 100);
}

export type { ScorecardRecord };
