import Database from "better-sqlite3";
import { existsSync, mkdirSync } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import type {
  ApplicationAnswers,
  ApplicationRecord,
  ApplicationStatus,
  ApplicationView,
  CriterionScore,
  HumanVerdict,
  PrefilterResult,
  ReviewRecord,
  ScorecardRecord,
  Verdict,
} from "./types";

const DATA_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DATA_DIR, "batch-scout.db");

let _db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (_db) return _db;
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
  const db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  migrate(db);
  _db = db;
  return db;
}

function migrate(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS applications (
      id TEXT PRIMARY KEY,
      batch TEXT NOT NULL,
      status TEXT NOT NULL,
      submitted_at TEXT NOT NULL,
      founder_name TEXT NOT NULL,
      startup_name TEXT NOT NULL,
      email TEXT NOT NULL,
      website TEXT,
      answers_json TEXT NOT NULL,
      enrichment_text TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS scorecards (
      id TEXT PRIMARY KEY,
      application_id TEXT NOT NULL UNIQUE REFERENCES applications(id) ON DELETE CASCADE,
      model TEXT NOT NULL,
      prompt_version TEXT NOT NULL,
      overall_score INTEGER NOT NULL,
      verdict TEXT NOT NULL,
      summary TEXT NOT NULL,
      criteria_json TEXT NOT NULL,
      red_flags_json TEXT NOT NULL,
      prefilter_json TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS reviews (
      application_id TEXT PRIMARY KEY REFERENCES applications(id) ON DELETE CASCADE,
      human_verdict TEXT,
      human_notes TEXT,
      shortlisted INTEGER NOT NULL DEFAULT 0,
      reviewed_by TEXT,
      reviewed_at TEXT
    );
  `);
}

// ---------------------------------------------------------------------------
// Row <-> domain mapping
// ---------------------------------------------------------------------------

interface ApplicationRow {
  id: string;
  batch: string;
  status: ApplicationStatus;
  submitted_at: string;
  founder_name: string;
  startup_name: string;
  email: string;
  website: string | null;
  answers_json: string;
  enrichment_text: string | null;
  created_at: string;
}

function rowToApplication(row: ApplicationRow): ApplicationRecord {
  return {
    id: row.id,
    batch: row.batch,
    status: row.status,
    submitted_at: row.submitted_at,
    founder_name: row.founder_name,
    startup_name: row.startup_name,
    email: row.email,
    website: row.website,
    answers: JSON.parse(row.answers_json) as ApplicationAnswers,
    enrichment_text: row.enrichment_text,
    created_at: row.created_at,
  };
}

interface ScorecardRow {
  id: string;
  application_id: string;
  model: string;
  prompt_version: string;
  overall_score: number;
  verdict: Verdict;
  summary: string;
  criteria_json: string;
  red_flags_json: string;
  prefilter_json: string | null;
  created_at: string;
}

function rowToScorecard(row: ScorecardRow): ScorecardRecord {
  return {
    id: row.id,
    application_id: row.application_id,
    model: row.model,
    prompt_version: row.prompt_version,
    overall_score: row.overall_score,
    verdict: row.verdict,
    summary: row.summary,
    criteria: JSON.parse(row.criteria_json) as CriterionScore[],
    red_flags: JSON.parse(row.red_flags_json) as string[],
    prefilter: row.prefilter_json
      ? (JSON.parse(row.prefilter_json) as PrefilterResult)
      : null,
    created_at: row.created_at,
  };
}

interface ReviewRow {
  application_id: string;
  human_verdict: HumanVerdict | null;
  human_notes: string | null;
  shortlisted: number;
  reviewed_by: string | null;
  reviewed_at: string | null;
}

function rowToReview(row: ReviewRow): ReviewRecord {
  return {
    application_id: row.application_id,
    human_verdict: row.human_verdict,
    human_notes: row.human_notes,
    shortlisted: row.shortlisted === 1,
    reviewed_by: row.reviewed_by,
    reviewed_at: row.reviewed_at,
  };
}

// ---------------------------------------------------------------------------
// Applications
// ---------------------------------------------------------------------------

export interface NewApplicationInput {
  batch: string;
  submitted_at?: string;
  founder_name: string;
  startup_name: string;
  email: string;
  website?: string | null;
  answers: ApplicationAnswers;
  status?: ApplicationStatus;
}

export function insertApplication(input: NewApplicationInput): ApplicationRecord {
  const db = getDb();
  const now = new Date().toISOString();
  const record: ApplicationRecord = {
    id: randomUUID(),
    batch: input.batch,
    status: input.status ?? "new",
    submitted_at: input.submitted_at ?? now,
    founder_name: input.founder_name,
    startup_name: input.startup_name,
    email: input.email,
    website: input.website ?? null,
    answers: input.answers,
    enrichment_text: null,
    created_at: now,
  };
  db.prepare(
    `INSERT INTO applications
       (id, batch, status, submitted_at, founder_name, startup_name, email, website, answers_json, enrichment_text, created_at)
     VALUES
       (@id, @batch, @status, @submitted_at, @founder_name, @startup_name, @email, @website, @answers_json, @enrichment_text, @created_at)`,
  ).run({
    ...record,
    answers_json: JSON.stringify(record.answers),
    enrichment_text: record.enrichment_text,
  });
  return record;
}

export function getApplication(id: string): ApplicationRecord | null {
  const row = getDb()
    .prepare("SELECT * FROM applications WHERE id = ?")
    .get(id) as ApplicationRow | undefined;
  return row ? rowToApplication(row) : null;
}

export function updateApplicationStatus(id: string, status: ApplicationStatus): void {
  getDb().prepare("UPDATE applications SET status = ? WHERE id = ?").run(status, id);
}

export function updateApplicationEnrichment(id: string, text: string): void {
  getDb()
    .prepare("UPDATE applications SET enrichment_text = ? WHERE id = ?")
    .run(text, id);
}

export interface ListFilters {
  batch?: string;
  status?: ApplicationStatus;
}

export function listApplicationViews(filters: ListFilters = {}): ApplicationView[] {
  const db = getDb();
  const clauses: string[] = [];
  const params: Record<string, string> = {};
  if (filters.batch) {
    clauses.push("batch = @batch");
    params.batch = filters.batch;
  }
  if (filters.status) {
    clauses.push("status = @status");
    params.status = filters.status;
  }
  const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
  const rows = db
    .prepare(`SELECT * FROM applications ${where} ORDER BY created_at ASC`)
    .all(params) as ApplicationRow[];
  return rows.map((row) => assembleView(rowToApplication(row)));
}

export function getApplicationView(id: string): ApplicationView | null {
  const app = getApplication(id);
  return app ? assembleView(app) : null;
}

function assembleView(application: ApplicationRecord): ApplicationView {
  return {
    application,
    scorecard: getScorecard(application.id),
    review: getReview(application.id),
  };
}

export function listBatches(): string[] {
  const rows = getDb()
    .prepare("SELECT DISTINCT batch FROM applications ORDER BY batch ASC")
    .all() as { batch: string }[];
  return rows.map((r) => r.batch);
}

// ---------------------------------------------------------------------------
// Scorecards
// ---------------------------------------------------------------------------

export interface ScorecardInput {
  application_id: string;
  model: string;
  prompt_version: string;
  overall_score: number;
  verdict: Verdict;
  summary: string;
  criteria: CriterionScore[];
  red_flags: string[];
  prefilter: PrefilterResult | null;
}

/** Insert or replace the scorecard for an application (one per application). */
export function upsertScorecard(input: ScorecardInput): ScorecardRecord {
  const db = getDb();
  const record: ScorecardRecord = {
    id: randomUUID(),
    created_at: new Date().toISOString(),
    ...input,
  };
  db.prepare(
    `INSERT INTO scorecards
       (id, application_id, model, prompt_version, overall_score, verdict, summary, criteria_json, red_flags_json, prefilter_json, created_at)
     VALUES
       (@id, @application_id, @model, @prompt_version, @overall_score, @verdict, @summary, @criteria_json, @red_flags_json, @prefilter_json, @created_at)
     ON CONFLICT(application_id) DO UPDATE SET
       id = excluded.id,
       model = excluded.model,
       prompt_version = excluded.prompt_version,
       overall_score = excluded.overall_score,
       verdict = excluded.verdict,
       summary = excluded.summary,
       criteria_json = excluded.criteria_json,
       red_flags_json = excluded.red_flags_json,
       prefilter_json = excluded.prefilter_json,
       created_at = excluded.created_at`,
  ).run({
    id: record.id,
    application_id: record.application_id,
    model: record.model,
    prompt_version: record.prompt_version,
    overall_score: record.overall_score,
    verdict: record.verdict,
    summary: record.summary,
    criteria_json: JSON.stringify(record.criteria),
    red_flags_json: JSON.stringify(record.red_flags),
    prefilter_json: record.prefilter ? JSON.stringify(record.prefilter) : null,
    created_at: record.created_at,
  });
  return record;
}

export function getScorecard(applicationId: string): ScorecardRecord | null {
  const row = getDb()
    .prepare("SELECT * FROM scorecards WHERE application_id = ?")
    .get(applicationId) as ScorecardRow | undefined;
  return row ? rowToScorecard(row) : null;
}

// ---------------------------------------------------------------------------
// Reviews (human override — always wins over the AI scorecard)
// ---------------------------------------------------------------------------

export interface ReviewInput {
  application_id: string;
  human_verdict?: HumanVerdict | null;
  human_notes?: string | null;
  shortlisted?: boolean;
  reviewed_by?: string | null;
}

export function upsertReview(input: ReviewInput): ReviewRecord {
  const db = getDb();
  const existing = getReview(input.application_id);
  const record: ReviewRecord = {
    application_id: input.application_id,
    human_verdict:
      input.human_verdict !== undefined
        ? input.human_verdict
        : (existing?.human_verdict ?? null),
    human_notes:
      input.human_notes !== undefined
        ? input.human_notes
        : (existing?.human_notes ?? null),
    shortlisted:
      input.shortlisted !== undefined
        ? input.shortlisted
        : (existing?.shortlisted ?? false),
    reviewed_by:
      input.reviewed_by !== undefined
        ? input.reviewed_by
        : (existing?.reviewed_by ?? null),
    reviewed_at: new Date().toISOString(),
  };
  db.prepare(
    `INSERT INTO reviews (application_id, human_verdict, human_notes, shortlisted, reviewed_by, reviewed_at)
     VALUES (@application_id, @human_verdict, @human_notes, @shortlisted, @reviewed_by, @reviewed_at)
     ON CONFLICT(application_id) DO UPDATE SET
       human_verdict = excluded.human_verdict,
       human_notes = excluded.human_notes,
       shortlisted = excluded.shortlisted,
       reviewed_by = excluded.reviewed_by,
       reviewed_at = excluded.reviewed_at`,
  ).run({
    application_id: record.application_id,
    human_verdict: record.human_verdict,
    human_notes: record.human_notes,
    shortlisted: record.shortlisted ? 1 : 0,
    reviewed_by: record.reviewed_by,
    reviewed_at: record.reviewed_at,
  });
  return record;
}

export function getReview(applicationId: string): ReviewRecord | null {
  const row = getDb()
    .prepare("SELECT * FROM reviews WHERE application_id = ?")
    .get(applicationId) as ReviewRow | undefined;
  return row ? rowToReview(row) : null;
}
