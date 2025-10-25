import Link from "next/link";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-8 md:grid-cols-3">
          {/* Company Info */}
          <div>
            <h3 className="mb-4 text-lg font-bold text-zinc-900 dark:text-zinc-50">
              SportShots
            </h3>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Die Plattform für Sportfotografie. Finde deine Fotos mit Selfie-Suche oder Startnummer.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-zinc-900 dark:text-zinc-50">
              Schnellzugriff
            </h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/find-photos"
                  className="text-sm text-zinc-600 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
                >
                  Fotos finden
                </Link>
              </li>
              <li>
                <Link
                  href="/search"
                  className="text-sm text-zinc-600 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
                >
                  Events suchen
                </Link>
              </li>
              <li>
                <Link
                  href="/signup/photographer"
                  className="text-sm text-zinc-600 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
                >
                  Als Fotograf registrieren
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-zinc-900 dark:text-zinc-50">
              Rechtliches
            </h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/impressum"
                  className="text-sm text-zinc-600 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
                >
                  Impressum
                </Link>
              </li>
              <li>
                <Link
                  href="/datenschutz"
                  className="text-sm text-zinc-600 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
                >
                  Datenschutz
                </Link>
              </li>
              <li>
                <a
                  href="mailto:julius.faubel@brainmotion.ai"
                  className="text-sm text-zinc-600 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
                >
                  Kontakt
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-8 border-t border-zinc-200 pt-8 dark:border-zinc-800">
          <p className="text-center text-sm text-zinc-600 dark:text-zinc-400">
            © {currentYear} SportShots by Brainmotion. Alle Rechte vorbehalten.
          </p>
        </div>
      </div>
    </footer>
  );
}

