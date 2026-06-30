# Batch Scout

**KI-gestütztes Bewerbungs-Screening für den STARTPLATZ KI Accelerator NRW.**

Batch Scout liest eingehende Bewerbungen ein, bewertet sie mit Claude gegen die **sechs
offiziellen Auswahlkriterien**, legt eine strukturierte Scorecard ab und gibt der Jury eine
Review-Konsole zum Sichten, Überschreiben und Entscheiden. Das Tool **sortiert vor — es
entscheidet nicht** und lehnt nichts eigenständig ab (DSGVO Art. 22).

> Konzept-Prototyp / Bewerbungsstück. Nicht offiziell mit STARTPLATZ verbunden.

Dies ist die in der Konzeptbeschreibung genannte „laufende Web-Konsole als Demo": die
Orchestrierungs-Schritte aus dem n8n-Konzept (Intake → Vorfilter → Bewertung → Speichern →
Benachrichtigen → Review) sind hier direkt als eigenständige Next.js-App umgesetzt.

## Schnellstart

```bash
npm install
npm run seed      # legt 10 Beispiel-Bewerbungen mit fertigen Scorecards an
npm run dev       # http://localhost:3000
```

Die Demo läuft **ohne API-Key** vollständig über die Seed-Daten. Für echtes Live-Scoring:

```bash
cp .env.example .env
# ANTHROPIC_API_KEY=... in .env eintragen
```

## Die sechs Auswahlkriterien

Definiert an einer Stelle in [`lib/criteria.ts`](lib/criteria.ts) und von Prompt, Parser und
UI gemeinsam genutzt:

1. Erste Kunden & validiertes Geschäftsmodell
2. Skalierbares Produkt mit Wachstumsambition
3. KI als echter Wachstumshebel
4. Team von 2–10 Personen, bereit zu skalieren
5. Pre-Scale-up: funktioniert, aber noch nicht skaliert
6. 4 Monate Präsenz in Köln machbar

Jedes Kriterium wird mit 0–5 bewertet; der Gesamtscore (0–100) ist der Durchschnitt.
Reine Ideenphasen werden **nicht abgelehnt**, sondern als `open_accelerator` markiert.

## Wie das Scoring funktioniert

- **Vorfilter** (Claude Haiku, [`lib/scoring.ts`](lib/scoring.ts) → `prefilter`): günstiger
  Check auf Vollständigkeit & Scope. Spart teure Calls (Dual-Model-Kostenoptimierung).
- **Bewertung** (Claude Sonnet, `scoreApplication`): erzeugt die Scorecard über **erzwungenes
  Tool-Use** — Claude muss das Tool `submit_scorecard` aufrufen, dessen Schema die Scorecard
  ist. Das garantiert valides, deterministisch weiterverarbeitbares JSON.
- **Versionierung**: Jede Scorecard speichert `model` und `prompt_version`
  ([`lib/prompts.ts`](lib/prompts.ts)) — so bleibt nachvollziehbar, *warum* ein Score entstand.
  Sichtbar unter `/kriterien`.

## Oberfläche

| Seite | Zweck |
|---|---|
| `/` | **Review-Queue** — vorsortierte Bewerbungen, Filter & Sortierung |
| `/applications/[id]` | **Scorecard** — 6 Kriterien, Red Flags, Originalangaben, **menschliche Override** + „neu bewerten" |
| `/batch` | **Batch-Vergleich** — Ranking nebeneinander, Shortlist-Markierung |
| `/intake` | Bewerbung manuell anlegen (simuliert Typeform-Eingang) |
| `/kriterien` | **Transparenz** — Kriterien, Prompt-Version, Datenschutz-Hinweise |

## API

| Route | Beschreibung |
|---|---|
| `POST /api/applications/intake` | Typeform-förmiges (oder flaches) Payload normalisieren & speichern. `?score=1` bewertet sofort. |
| `GET /api/applications?batch=&status=` | Liste (mit Scorecard + Review) |
| `GET /api/applications/[id]` | Detailansicht |
| `POST /api/applications/[id]/score` | Vorfilter + Bewertung (neu) ausführen |
| `POST /api/applications/[id]/enrich` | Website als Text anreichern |
| `PATCH /api/applications/[id]/review` | Menschliche Override (Verdict, Status, Notizen, Shortlist) |
| `GET /api/batches/[batch]/ranking` | Sortierte Vergleichsdaten |

Live-Scoring per `curl` (API-Key nötig):

```bash
curl -X POST "http://localhost:3000/api/applications/intake?score=1" \
  -H "Content-Type: application/json" \
  -d '{
    "startup_name": "Beispiel AI", "founder_name": "Test", "email": "t@example.com",
    "problem": "...", "solution": "...", "traction": "3 zahlende Kunden",
    "ai_usage": "LLM im Kern", "team": "4 Personen",
    "scale_status": "live, noch nicht skaliert", "cologne_presence": "Ja"
  }'
```

## Datenschutz & Verantwortung

- **Self-Hosting**: Bewerberdaten liegen lokal in SQLite (`data/batch-scout.db`); nur der reine
  Bewertungstext geht an die LLM-API.
- **Mensch entscheidet**: Die Override (`reviews`) wird getrennt von der KI-Scorecard gespeichert
  und gewinnt immer. Es gibt keinen Pfad, der automatisch ablehnt.
- **Transparenz**: Kriterien + Prompt-Version sind in der App und im Code dokumentiert.

## Architektur

```
Intake (Typeform/Form/Webhook)
  → normalize  (lib/normalize.ts)
  → prefilter  (Claude Haiku)        ┐ lib/scoring.ts
  → score      (Claude Sonnet, JSON) ┘ lib/pipeline.ts → Status
  → SQLite     (lib/db.ts)
  → Review-Konsole (Mensch entscheidet)
  → Batch-Ranking → Shortlist
```

## Stack

Next.js 15 (App Router) · TypeScript · Tailwind CSS · better-sqlite3 · @anthropic-ai/sdk.

## Scripts

- `npm run dev` — Dev-Server
- `npm run seed` — Datenbank mit Beispieldaten füllen (idempotent)
- `npm run build` / `npm run start` — Production-Build & -Start
