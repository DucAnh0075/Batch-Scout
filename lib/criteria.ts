// The six official selection criteria of the STARTPLATZ KI Accelerator NRW,
// taken 1:1 from the public program page. Single source of truth — imported by the
// scoring prompt, the parser/validator, and the UI so they can never drift apart.

export type CriterionKey =
  | "customers_validation"
  | "scalable_product"
  | "ai_growth_lever"
  | "team"
  | "pre_scale_up"
  | "cologne_presence";

export interface Criterion {
  key: CriterionKey;
  /** Short German label shown in the UI. */
  label: string;
  /** One-line German description of what is being assessed. */
  description: string;
  /** 0–5 rubric anchors (German) guiding both Claude and human reviewers. */
  rubric: string;
}

export const CRITERIA: Criterion[] = [
  {
    key: "customers_validation",
    label: "Erste Kunden & validiertes Geschäftsmodell",
    description:
      "Gibt es zahlende oder aktiv nutzende Erstkunden und ein am Markt validiertes Geschäftsmodell?",
    rubric:
      "0 = reine Idee, keine Kunden. 3 = erste Pilotkunden / LOIs, Modell teilweise validiert. 5 = mehrere zahlende Kunden, wiederholbares, validiertes Geschäftsmodell.",
  },
  {
    key: "scalable_product",
    label: "Skalierbares Produkt mit Wachstumsambition",
    description:
      "Ist das Produkt technisch und wirtschaftlich skalierbar und besteht eine klare Wachstumsambition?",
    rubric:
      "0 = Dienstleistung/Manufaktur ohne Skalierung. 3 = skalierbar mit Einschränkungen, moderate Ambition. 5 = klar skalierbares Produkt, ambitionierter Wachstumsplan.",
  },
  {
    key: "ai_growth_lever",
    label: "KI als echter Wachstumshebel",
    description:
      "Ist KI ein zentraler Wachstumshebel im Geschäftsmodell — nicht nur Buzzword oder Beiwerk?",
    rubric:
      "0 = KI nur als Schlagwort. 3 = KI unterstützt das Produkt sinnvoll. 5 = KI ist der Kern des Wettbewerbsvorteils und Wachstumstreibers.",
  },
  {
    key: "team",
    label: "Team von 2–10 Personen, bereit zu skalieren",
    description:
      "Besteht das Team aus 2–10 Personen mit der Bereitschaft und Fähigkeit zu skalieren?",
    rubric:
      "0 = Einzelgründer:in oder >10 Personen / nicht skalierbereit. 3 = passende Größe, Skalierungsbereitschaft teils unklar. 5 = 2–10 Personen, komplementär, klar skalierungsbereit.",
  },
  {
    key: "pre_scale_up",
    label: "Pre-Scale-up: funktioniert, aber noch nicht skaliert",
    description:
      "Ist das Startup in der Pre-Scale-up-Phase — das Geschäft funktioniert, ist aber noch nicht skaliert?",
    rubric:
      "0 = reine Ideen-/Konzeptphase (→ Open Accelerator). 3 = funktionierendes Produkt, frühe Traktion. 5 = bewährtes Geschäft an der Schwelle zum Skalieren.",
  },
  {
    key: "cologne_presence",
    label: "4 Monate Präsenz in Köln machbar",
    description:
      "Kann das Team über vier Monate vor Ort in Köln präsent sein?",
    rubric:
      "0 = Präsenz explizit nicht möglich. 3 = teilweise / mit Aufwand machbar. 5 = Präsenz in Köln problemlos zugesagt.",
  },
];

export const CRITERIA_BY_KEY: Record<CriterionKey, Criterion> = Object.fromEntries(
  CRITERIA.map((c) => [c.key, c]),
) as Record<CriterionKey, Criterion>;

export const CRITERION_KEYS = CRITERIA.map((c) => c.key) as CriterionKey[];
