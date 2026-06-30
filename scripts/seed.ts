/**
 * Seeds the SQLite database with realistic sample applications and pre-computed
 * scorecards so the demo runs fully WITHOUT an Anthropic API key. The spread is
 * deliberate: strong fits, borderline cases, idea-stage (→ Open Accelerator), a
 * Köln-presence red flag, and one incomplete application that fails the prefilter.
 *
 * Run with: npm run seed
 */
import { getDb, insertApplication, upsertScorecard, upsertReview, updateApplicationStatus } from "../lib/db";
import { CRITERION_KEYS } from "../lib/criteria";
import { computeOverallScore } from "../lib/scoring";
import { PROMPT_VERSION } from "../lib/prompts";
import type {
  ApplicationAnswers,
  ApplicationStatus,
  CriterionScore,
  HumanVerdict,
  PrefilterResult,
  Verdict,
} from "../lib/types";

const BATCH = "batch-3";
const SCORING_MODEL = "claude-sonnet-4-6";

interface Sample {
  startup_name: string;
  founder_name: string;
  email: string;
  website: string | null;
  answers: ApplicationAnswers;
  status: ApplicationStatus;
  verdict: Verdict;
  /** Six scores in CRITERION_KEYS order. */
  scores: [number, number, number, number, number, number];
  justifications: [string, string, string, string, string, string];
  evidence: [string, string, string, string, string, string];
  red_flags: string[];
  summary: string;
  prefilter: PrefilterResult;
  review?: { human_verdict?: HumanVerdict; shortlisted?: boolean; notes?: string };
}

const SAMPLES: Sample[] = [
  {
    startup_name: "PflegePilot",
    founder_name: "Dr. Lena Brandt",
    email: "lena@pflegepilot.de",
    website: "https://pflegepilot.de",
    answers: {
      problem: "Ambulante Pflegedienste verlieren täglich Stunden mit manueller Tourenplanung.",
      solution: "KI-gestützte Tourenoptimierung und Dienstplanung als SaaS für Pflegedienste.",
      traction: "14 zahlende Pflegedienste, 9.000 €/Monat MRR, Pilot mit zwei Caritas-Verbänden.",
      ai_usage: "Routing-Modell und Nachfrageprognose sind der Kern; ohne KI kein Produkt.",
      team: "5 Personen: 2 Gründer (Pflege + ML), 2 Entwickler, 1 Vertrieb.",
      scale_status: "Produkt live seit 14 Monaten, wiederholbarer Sales-Prozess, noch nicht skaliert.",
      cologne_presence: "Ja, Sitz in Düsseldorf, Präsenz in Köln problemlos.",
    },
    status: "decided",
    verdict: "strong",
    scores: [5, 5, 5, 5, 5, 5],
    justifications: [
      "14 zahlende Kunden und klarer MRR — Geschäftsmodell validiert.",
      "Reines SaaS, klar skalierbar, ambitionierter Plan.",
      "KI (Routing/Prognose) ist der Produktkern, kein Beiwerk.",
      "5-köpfiges, komplementäres Team, skalierungsbereit.",
      "Live seit 14 Monaten mit wiederholbarem Sales — klassisches Pre-Scale-up.",
      "Präsenz in Köln ausdrücklich zugesagt.",
    ],
    evidence: [
      "14 zahlende Pflegedienste, 9.000 €/Monat MRR",
      "KI-gestützte Tourenoptimierung … als SaaS",
      "Routing-Modell und Nachfrageprognose sind der Kern",
      "5 Personen: 2 Gründer (Pflege + ML)",
      "Produkt live seit 14 Monaten … noch nicht skaliert",
      "Präsenz in Köln problemlos",
    ],
    red_flags: [],
    summary:
      "Sehr starker Fit: validiertes SaaS-Geschäft mit KI im Kern, passendes Team, klar im Pre-Scale-up. Priorisieren.",
    prefilter: { complete: true, in_scope: true, reason: "Vollständig und klar im Scope." },
    review: { human_verdict: "shortlist", shortlisted: true, notes: "Top-Kandidat, fürs Gespräch einladen." },
  },
  {
    startup_name: "LegalLens AI",
    founder_name: "Jonas Weber",
    email: "jonas@legallens.ai",
    website: "https://legallens.ai",
    answers: {
      problem: "KMU-Anwält:innen verbringen Stunden mit manueller Vertragsprüfung.",
      solution: "KI-Assistent, der Verträge analysiert und Risiken markiert.",
      traction: "7 zahlende Kanzleien, 3 weitere im Test, erste Umsätze seit 6 Monaten.",
      ai_usage: "LLM-gestützte Klauselanalyse mit eigenem Retrieval — zentrales Feature.",
      team: "4 Personen, davon 2 mit Legal-Tech-Hintergrund.",
      scale_status: "Funktionierendes Produkt, frühe wiederkehrende Umsätze.",
      cologne_presence: "Team in Köln ansässig.",
    },
    status: "scored",
    verdict: "strong",
    scores: [4, 5, 5, 4, 4, 5],
    justifications: [
      "7 zahlende Kanzleien — solide erste Validierung.",
      "Klar skalierbares SaaS in großem Markt.",
      "KI-Klauselanalyse ist das Kernfeature.",
      "4-köpfiges Team mit Domänen-Know-how.",
      "Produkt funktioniert, frühe wiederkehrende Umsätze.",
      "Team bereits in Köln.",
    ],
    evidence: [
      "7 zahlende Kanzleien, 3 weitere im Test",
      "KI-Assistent, der Verträge analysiert",
      "LLM-gestützte Klauselanalyse … zentrales Feature",
      "4 Personen, davon 2 mit Legal-Tech-Hintergrund",
      "Funktionierendes Produkt, frühe wiederkehrende Umsätze",
      "Team in Köln ansässig",
    ],
    red_flags: ["Noch geringe Kundenzahl — Validierung früh."],
    summary: "Starker Fit mit klarer KI-Kernfunktion und erster Traktion. Für die Shortlist prüfen.",
    prefilter: { complete: true, in_scope: true, reason: "Vollständig, im Scope." },
    review: { shortlisted: true },
  },
  {
    startup_name: "AgriSense",
    founder_name: "Mareike Hoffmann",
    email: "m.hoffmann@agrisense.eu",
    website: "https://agrisense.eu",
    answers: {
      problem: "Landwirt:innen erkennen Pflanzenkrankheiten zu spät.",
      solution: "Drohnen + Bildanalyse zur Früherkennung von Krankheiten.",
      traction: "3 Pilotbetriebe, noch keine Umsätze, LOIs vorhanden.",
      ai_usage: "Computer-Vision-Modell zur Krankheitserkennung — zentral.",
      team: "6 Personen, stark technisch.",
      scale_status: "Prototyp im Feldeinsatz, Geschäftsmodell noch in Validierung.",
      cologne_presence: "Machbar, Team teils remote.",
    },
    status: "scored",
    verdict: "borderline",
    scores: [2, 4, 5, 4, 3, 3],
    justifications: [
      "Nur Pilotbetriebe und LOIs, keine Umsätze — Validierung offen.",
      "Skalierbar, aber Hardware-Komponente bremst.",
      "Computer Vision ist der Kern.",
      "6 Personen, technisch stark.",
      "Prototyp im Feld, Modell noch nicht bewährt.",
      "Präsenz machbar, aber Team teils remote.",
    ],
    evidence: [
      "3 Pilotbetriebe, noch keine Umsätze",
      "Drohnen + Bildanalyse",
      "Computer-Vision-Modell … zentral",
      "6 Personen, stark technisch",
      "Prototyp im Feldeinsatz",
      "Machbar, Team teils remote",
    ],
    red_flags: ["Keine zahlenden Kunden", "Hardware-Abhängigkeit (Drohnen)"],
    summary:
      "Echter Grenzfall: starke KI und Team, aber Geschäftsmodell noch unvalidiert. Menschliche Prüfung besonders wertvoll.",
    prefilter: { complete: true, in_scope: true, reason: "Vollständig, im Scope." },
  },
  {
    startup_name: "ShopMind",
    founder_name: "Tobias Krüger",
    email: "tobias@shopmind.io",
    website: "https://shopmind.io",
    answers: {
      problem: "Kleine Onlineshops personalisieren ihre Angebote kaum.",
      solution: "Plug-in für Produktempfehlungen per KI.",
      traction: "120 Installationen, davon 18 zahlend, ~1.500 €/Monat.",
      ai_usage: "Empfehlungs-Engine auf Basis von Nutzerverhalten.",
      team: "3 Personen, Rollen teils überlappend.",
      scale_status: "Live, aber Wachstum stockt.",
      cologne_presence: "Ja.",
    },
    status: "scored",
    verdict: "borderline",
    scores: [3, 4, 3, 3, 3, 5],
    justifications: [
      "18 zahlende Kunden, aber niedriger Umsatz — teilweise validiert.",
      "Skalierbares Plug-in-Modell.",
      "KI sinnvoll, aber Empfehlungen sind Standard-Tech.",
      "Kleines Team, Rollen unklar.",
      "Live, aber Wachstum stagniert.",
      "Präsenz zugesagt.",
    ],
    evidence: [
      "120 Installationen, davon 18 zahlend",
      "Plug-in für Produktempfehlungen per KI",
      "Empfehlungs-Engine auf Basis von Nutzerverhalten",
      "3 Personen, Rollen teils überlappend",
      "Live, aber Wachstum stockt",
      "Ja",
    ],
    red_flags: ["Stagnierendes Wachstum", "KI eher Standard, geringe Differenzierung"],
    summary: "Grenzfall: erste Umsätze, aber schwache Differenzierung und stockendes Wachstum.",
    prefilter: { complete: true, in_scope: true, reason: "Vollständig, im Scope." },
  },
  {
    startup_name: "MediScan",
    founder_name: "Dr. Amir Yilmaz",
    email: "amir@mediscan.health",
    website: "https://mediscan.health",
    answers: {
      problem: "Radiolog:innen sind überlastet, Befundung dauert.",
      solution: "KI-Triage für Röntgenbilder priorisiert kritische Fälle.",
      traction: "2 Klinik-Pilotverträge, erste Umsätze, CE-Zertifizierung läuft.",
      ai_usage: "Eigenes Vision-Modell zur Befund-Priorisierung — Kern.",
      team: "8 Personen, medizinisch + technisch stark.",
      scale_status: "Funktionierend in Pilotkliniken, Skalierung vorbereitet.",
      cologne_presence: "Schwierig — Team in Berlin, Präsenz nur tageweise möglich.",
    },
    status: "in_review",
    verdict: "strong",
    scores: [4, 5, 5, 5, 4, 1],
    justifications: [
      "Pilotverträge und erste Umsätze — solide Validierung.",
      "Hoch skalierbares SaaS im Gesundheitsmarkt.",
      "Vision-Modell ist der Kern.",
      "8-köpfiges, sehr starkes Team.",
      "Funktioniert in Pilotkliniken, Skalierung vorbereitet.",
      "Köln-Präsenz nur tageweise — kritischer Konflikt mit der 4-Monats-Anforderung.",
    ],
    evidence: [
      "2 Klinik-Pilotverträge, erste Umsätze",
      "KI-Triage für Röntgenbilder",
      "Eigenes Vision-Modell … Kern",
      "8 Personen, medizinisch + technisch stark",
      "Funktionierend in Pilotkliniken",
      "Team in Berlin, Präsenz nur tageweise möglich",
    ],
    red_flags: ["Köln-Präsenz (4 Monate) nicht gesichert — Team in Berlin"],
    summary:
      "Inhaltlich sehr stark, aber die 4-monatige Köln-Präsenz ist der offene Knackpunkt. Vor dem Gespräch klären.",
    prefilter: { complete: true, in_scope: true, reason: "Vollständig, im Scope." },
    review: { notes: "Stark, aber Präsenz in Köln klären — evtl. Teilteam vor Ort?" },
  },
  {
    startup_name: "EduBot",
    founder_name: "Sina Vogel",
    email: "sina@edubot.de",
    website: "https://edubot.de",
    answers: {
      problem: "Schüler:innen fehlt individuelle Nachhilfe.",
      solution: "KI-Tutor, der adaptiv erklärt.",
      traction: "Beta mit 400 Nutzer:innen, noch kostenlos.",
      ai_usage: "LLM-gestützter Dialog-Tutor.",
      team: "4 Personen.",
      scale_status: "Funktionierende Beta, Monetarisierung offen.",
      cologne_presence: "Ja.",
    },
    status: "scored",
    verdict: "borderline",
    scores: [1, 4, 4, 4, 3, 5],
    justifications: [
      "Nur kostenlose Beta — kein validiertes Geschäftsmodell.",
      "Skalierbar als App.",
      "LLM-Tutor ist Kernfunktion.",
      "Passendes Team.",
      "Beta funktioniert, Monetarisierung offen.",
      "Präsenz zugesagt.",
    ],
    evidence: [
      "Beta mit 400 Nutzer:innen, noch kostenlos",
      "KI-Tutor, der adaptiv erklärt",
      "LLM-gestützter Dialog-Tutor",
      "4 Personen",
      "Funktionierende Beta, Monetarisierung offen",
      "Ja",
    ],
    red_flags: ["Keine Umsätze, Monetarisierung ungeklärt"],
    summary: "Funktionierendes Produkt, aber Geschäftsmodell noch unbewiesen. Grenzfall.",
    prefilter: { complete: true, in_scope: true, reason: "Vollständig, im Scope." },
  },
  {
    startup_name: "FlowState",
    founder_name: "Markus Lehmann",
    email: "markus@flowstate.app",
    website: "https://flowstate.app",
    answers: {
      problem: "Menschen sind unproduktiv.",
      solution: "To-do-App mit ein paar KI-Features.",
      traction: "Im App Store, keine zahlenden Nutzer:innen.",
      ai_usage: "‚KI-Priorisierung' als Zusatzfunktion, im Kern eine klassische To-do-App.",
      team: "2 Personen.",
      scale_status: "Veröffentlicht, kaum Nutzung.",
      cologne_presence: "Ja.",
    },
    status: "scored",
    verdict: "weak",
    scores: [1, 3, 1, 2, 2, 5],
    justifications: [
      "Keine zahlenden Nutzer:innen.",
      "Skalierbar, aber überfüllter Markt.",
      "KI nur Beiwerk, kein echter Hebel.",
      "Sehr kleines Team.",
      "Veröffentlicht, kaum Traktion.",
      "Präsenz zugesagt.",
    ],
    evidence: [
      "keine zahlenden Nutzer:innen",
      "To-do-App mit ein paar KI-Features",
      "‚KI-Priorisierung' als Zusatzfunktion",
      "2 Personen",
      "Veröffentlicht, kaum Nutzung",
      "Ja",
    ],
    red_flags: ["KI nur als Buzzword", "Keine Traktion", "Generischer Markt"],
    summary:
      "Passt aktuell schwach: KI ist Beiwerk, keine Traktion. Mensch entscheidet — kein automatisches Aus.",
    prefilter: { complete: true, in_scope: true, reason: "Vollständig, im Scope." },
  },
  {
    startup_name: "GreenRoute",
    founder_name: "Paula Schmidt",
    email: "paula@greenroute.eco",
    website: null,
    answers: {
      problem: "Stadtlogistik verursacht zu viel CO₂.",
      solution: "Idee für eine KI-Plattform zur emissionsarmen Routenbündelung.",
      traction: "Noch kein Produkt, erste Gespräche mit Kommunen.",
      ai_usage: "Geplant: Optimierungs-KI für Bündelung.",
      team: "2 Personen, frisch gegründet.",
      scale_status: "Konzeptphase, kein Prototyp.",
      cologne_presence: "Ja.",
    },
    status: "routed_open",
    verdict: "open_accelerator",
    scores: [0, 3, 3, 3, 0, 5],
    justifications: [
      "Kein Produkt, keine Kunden — reine Idee.",
      "Konzept skalierbar, aber unbewiesen.",
      "KI geplant, noch nicht umgesetzt.",
      "Gründungsteam, sehr früh.",
      "Klare Konzeptphase — kein Pre-Scale-up.",
      "Präsenz zugesagt.",
    ],
    evidence: [
      "Noch kein Produkt",
      "Idee für eine KI-Plattform",
      "Geplant: Optimierungs-KI",
      "2 Personen, frisch gegründet",
      "Konzeptphase, kein Prototyp",
      "Ja",
    ],
    red_flags: ["Reine Ideenphase, kein Produkt"],
    summary:
      "Spannende Idee, aber klar in der Konzeptphase. Kein Pre-Scale-up → Richtung Open Accelerator routen (keine Ablehnung).",
    prefilter: { complete: true, in_scope: true, reason: "Vollständig, aber Ideenphase." },
  },
  {
    startup_name: "VoiceForge",
    founder_name: "Niklas Bauer",
    email: "niklas@voiceforge.io",
    website: null,
    answers: {
      problem: "Podcast-Produktion ist aufwändig.",
      solution: "Vision: KI-Studio, das Podcasts automatisch schneidet.",
      traction: "Nur Idee, Landingpage mit Warteliste (60 Anmeldungen).",
      ai_usage: "Audio-KI geplant.",
      team: "1 Gründer, sucht Mitgründer:in.",
      scale_status: "Ideenphase.",
      cologne_presence: "Ja.",
    },
    status: "routed_open",
    verdict: "open_accelerator",
    scores: [0, 3, 3, 1, 0, 5],
    justifications: [
      "Nur Warteliste, kein Produkt und keine Kunden.",
      "Potenziell skalierbar.",
      "KI geplant, nicht vorhanden.",
      "Einzelgründer — unter der 2-Personen-Schwelle.",
      "Reine Ideenphase.",
      "Präsenz zugesagt.",
    ],
    evidence: [
      "Nur Idee, Landingpage mit Warteliste",
      "Vision: KI-Studio",
      "Audio-KI geplant",
      "1 Gründer, sucht Mitgründer:in",
      "Ideenphase",
      "Ja",
    ],
    red_flags: ["Einzelgründer (Team < 2)", "Reine Ideenphase"],
    summary: "Sehr früh, Einzelgründer, keine Validierung → Open Accelerator.",
    prefilter: { complete: true, in_scope: true, reason: "Ideenphase, Einzelgründer." },
  },
  {
    startup_name: "SoloDev Tools",
    founder_name: "Kevin Adams",
    email: "kevin@solodev.tools",
    website: null,
    answers: {
      problem: "—",
      solution: "Tool für Entwickler.",
      traction: "",
      ai_usage: "",
      team: "",
      scale_status: "",
      cologne_presence: "",
    },
    status: "prefiltered",
    verdict: "weak",
    scores: [0, 1, 0, 0, 0, 0],
    justifications: [
      "Keine verwertbaren Angaben.",
      "Unklar.",
      "Kein KI-Bezug erkennbar.",
      "Keine Teamangaben.",
      "Keine Angaben.",
      "Keine Angaben.",
    ],
    evidence: ["—", "Tool für Entwickler", "", "", "", ""],
    red_flags: ["Bewerbung unvollständig", "KI-Bezug fehlt"],
    summary:
      "Vorfilter: unvollständig — die meisten Pflichtfelder fehlen. Eingangsbestätigung + Nachfrage senden, nicht inhaltlich bewerten.",
    prefilter: {
      complete: false,
      in_scope: false,
      reason: "Pflichtfelder leer, KI-Bezug nicht erkennbar.",
    },
  },
];

function buildCriteria(s: Sample): CriterionScore[] {
  return CRITERION_KEYS.map((key, i) => ({
    key,
    score: s.scores[i],
    justification: s.justifications[i],
    evidence_quote: s.evidence[i],
  }));
}

function seed() {
  const db = getDb();
  // Idempotent: clear prior data so re-running gives a clean, predictable demo.
  db.exec("DELETE FROM reviews; DELETE FROM scorecards; DELETE FROM applications;");

  // Spread submitted_at over the past two weeks for realism.
  const now = Date.now();
  SAMPLES.forEach((s, idx) => {
    const submitted = new Date(now - (SAMPLES.length - idx) * 36 * 3600 * 1000).toISOString();
    const app = insertApplication({
      batch: BATCH,
      submitted_at: submitted,
      founder_name: s.founder_name,
      startup_name: s.startup_name,
      email: s.email,
      website: s.website,
      answers: s.answers,
      status: "new",
    });

    const criteria = buildCriteria(s);
    upsertScorecard({
      application_id: app.id,
      model: SCORING_MODEL,
      prompt_version: PROMPT_VERSION,
      overall_score: computeOverallScore(criteria),
      verdict: s.verdict,
      summary: s.summary,
      criteria,
      red_flags: s.red_flags,
      prefilter: s.prefilter,
    });

    updateApplicationStatus(app.id, s.status);

    if (s.review) {
      upsertReview({
        application_id: app.id,
        human_verdict: s.review.human_verdict ?? null,
        human_notes: s.review.notes ?? null,
        shortlisted: s.review.shortlisted ?? false,
        reviewed_by: "Jury (Seed)",
      });
    }
  });

  console.log(`Seeded ${SAMPLES.length} applications into batch "${BATCH}".`);
}

seed();
