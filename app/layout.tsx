import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Batch Scout — Bewerbungs-Screening",
  description:
    "KI-gestütztes Vorsortieren von Bewerbungen für den STARTPLATZ KI Accelerator NRW. Entscheidungshilfe, keine Entscheidung.",
};

const NAV = [
  { href: "/", label: "Review-Queue" },
  { href: "/batch", label: "Batch-Vergleich" },
  { href: "/intake", label: "Intake" },
  { href: "/kriterien", label: "Kriterien & Transparenz" },
];

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="de">
      <body className="min-h-screen">
        <header className="border-b border-slate-200 bg-white">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-4">
            <Link href="/" className="flex items-center gap-2">
              <span className="text-lg font-bold tracking-tight">Batch Scout</span>
              <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
                Konzept-Prototyp
              </span>
            </Link>
            <nav className="flex flex-wrap gap-1 text-sm">
              {NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded-md px-3 py-1.5 font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="border-t border-amber-200 bg-amber-50">
            <div className="mx-auto max-w-6xl px-6 py-2 text-xs text-amber-800">
              <strong>Entscheidungshilfe, keine Entscheidung.</strong> Das Tool sortiert
              vor und priorisiert — die Auswahl trifft die Jury. Es lehnt nichts
              eigenständig ab (DSGVO Art. 22).
            </div>
          </div>
        </header>
        <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
        <footer className="mx-auto max-w-6xl px-6 py-8 text-xs text-slate-400">
          Batch Scout · Konzept-Prototyp / Bewerbungsstück · nicht offiziell mit
          STARTPLATZ verbunden.
        </footer>
      </body>
    </html>
  );
}
