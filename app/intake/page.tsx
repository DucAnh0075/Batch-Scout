import { IntakeForm } from "@/components/IntakeForm";
import { hasApiKey } from "@/lib/scoring";

export const dynamic = "force-dynamic";

export default function IntakePage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Intake — neue Bewerbung</h1>
        <p className="mt-1 text-sm text-slate-500">
          Simuliert den Typeform-Eingang (Schritt [1]/[2]). In Produktion füllt n8n diese
          Felder automatisch; hier kannst du eine Bewerbung manuell anlegen und direkt
          bewerten lassen.
        </p>
      </div>
      <IntakeForm canScore={hasApiKey()} />
    </div>
  );
}
