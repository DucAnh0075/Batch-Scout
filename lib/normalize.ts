import type { ApplicationAnswers } from "./types";
import type { NewApplicationInput } from "./db";

// Maps a (simplified) Typeform-shaped payload onto our normalized application shape.
// Two input forms are accepted:
//   1. A flat object with our field names (used by the seed + the /intake demo form).
//   2. A Typeform `form_response` webhook, where answers are matched by question `ref`.
// This mirrors n8n step [2] "Normalisieren (Set-Node: Felder mappen)".

export interface FlatIntakePayload {
  batch?: string;
  submitted_at?: string;
  founder_name: string;
  startup_name: string;
  email: string;
  website?: string | null;
  problem: string;
  solution: string;
  traction: string;
  ai_usage: string;
  team: string;
  scale_status: string;
  cologne_presence: string;
}

const DEFAULT_BATCH = "batch-3";

const ANSWER_KEYS: (keyof ApplicationAnswers)[] = [
  "problem",
  "solution",
  "traction",
  "ai_usage",
  "team",
  "scale_status",
  "cologne_presence",
];

/** Typeform `form_response` webhook payload (only the parts we use). */
interface TypeformWebhook {
  form_response: {
    submitted_at?: string;
    definition?: { fields?: { ref?: string }[] };
    answers?: TypeformAnswer[];
    hidden?: Record<string, string>;
  };
}

interface TypeformAnswer {
  field?: { ref?: string };
  type?: string;
  text?: string;
  email?: string;
  url?: string;
  choice?: { label?: string };
  boolean?: boolean;
}

function isTypeformWebhook(payload: unknown): payload is TypeformWebhook {
  return (
    typeof payload === "object" &&
    payload !== null &&
    "form_response" in payload
  );
}

function answerValue(a: TypeformAnswer): string {
  return (
    a.text ??
    a.email ??
    a.url ??
    a.choice?.label ??
    (typeof a.boolean === "boolean" ? (a.boolean ? "Ja" : "Nein") : "")
  );
}

function fromTypeform(payload: TypeformWebhook): NewApplicationInput {
  const fr = payload.form_response;
  const byRef = new Map<string, string>();
  for (const a of fr.answers ?? []) {
    const ref = a.field?.ref;
    if (ref) byRef.set(ref, answerValue(a));
  }
  const hidden = fr.hidden ?? {};
  const answers = Object.fromEntries(
    ANSWER_KEYS.map((k) => [k, byRef.get(k) ?? ""]),
  ) as unknown as ApplicationAnswers;
  return {
    batch: hidden.batch ?? DEFAULT_BATCH,
    submitted_at: fr.submitted_at,
    founder_name: byRef.get("founder_name") ?? hidden.founder_name ?? "",
    startup_name: byRef.get("startup_name") ?? hidden.startup_name ?? "",
    email: byRef.get("email") ?? hidden.email ?? "",
    website: byRef.get("website") ?? null,
    answers,
  };
}

function fromFlat(payload: FlatIntakePayload): NewApplicationInput {
  const record = payload as unknown as Record<string, unknown>;
  const answers = Object.fromEntries(
    ANSWER_KEYS.map((k) => [k, String(record[k] ?? "")]),
  ) as unknown as ApplicationAnswers;
  return {
    batch: payload.batch ?? DEFAULT_BATCH,
    submitted_at: payload.submitted_at,
    founder_name: payload.founder_name,
    startup_name: payload.startup_name,
    email: payload.email,
    website: payload.website ?? null,
    answers,
  };
}

export function normalizeIntake(payload: unknown): NewApplicationInput {
  if (isTypeformWebhook(payload)) return fromTypeform(payload);
  return fromFlat(payload as FlatIntakePayload);
}
