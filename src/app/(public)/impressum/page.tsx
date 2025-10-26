import Link from "next/link";

export default function ImpressumPage() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900">
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <h1 className="mb-8 text-4xl font-bold text-zinc-900 dark:text-zinc-50">
          Impressum
        </h1>

        <div className="space-y-8 rounded-lg bg-white p-8 shadow dark:bg-zinc-800">
          {/* Angaben gemäß § 5 TMG */}
          <section>
            <h2 className="mb-4 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
              Angaben gemäß § 5 TMG
            </h2>
            <div className="space-y-2 text-zinc-700 dark:text-zinc-300">
              <p className="font-semibold">Julius Faubel</p>
              <p>Roswitha-von-Gandersheim Weg 15</p>
              <p>42897 Remscheid</p>
              <p>Deutschland</p>
            </div>
          </section>

          {/* Kontakt */}
          <section>
            <h2 className="mb-4 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
              Kontakt
            </h2>
            <div className="space-y-2 text-zinc-700 dark:text-zinc-300">
              <p>
                <span className="font-semibold">Telefon:</span>{" "}
                <a
                  href="tel:+4915222633984"
                  className="text-blue-600 hover:underline dark:text-blue-400"
                >
                  +49 152 22633984
                </a>
              </p>
              <p>
                <span className="font-semibold">E-Mail:</span>{" "}
                <a
                  href="mailto:julius.faubel@brainmotion.ai"
                  className="text-blue-600 hover:underline dark:text-blue-400"
                >
                  julius.faubel@brainmotion.ai
                </a>
              </p>
            </div>
          </section>

          {/* Vertreten durch */}
          <section>
            <h2 className="mb-4 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
              Vertreten durch
            </h2>
            <div className="space-y-2 text-zinc-700 dark:text-zinc-300">
              <p>Julius Faubel</p>
              <p className="text-sm">Freelancer / Softwareentwickler</p>
            </div>
          </section>

          {/* Steuerliche Erfassung */}
          <section>
            <h2 className="mb-4 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
              Steuerliche Erfassung
            </h2>
            <div className="space-y-2 text-zinc-700 dark:text-zinc-300">
              <p>
                <span className="font-semibold">Zuständiges Finanzamt:</span> Finanzamt Remscheid
              </p>
            </div>
          </section>

          {/* Berufsbezeichnung */}
          <section>
            <h2 className="mb-4 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
              Berufsbezeichnung und berufsrechtliche Regelungen
            </h2>
            <div className="space-y-2 text-zinc-700 dark:text-zinc-300">
              <p>
                <span className="font-semibold">Berufsbezeichnung:</span> Freelancer / Softwareentwickler
              </p>
              <p>
                <span className="font-semibold">Verliehen in:</span> Deutschland
              </p>
            </div>
          </section>

          {/* Verantwortlich für den Inhalt */}
          <section>
            <h2 className="mb-4 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
              Verantwortlich für den Inhalt nach § 55 Abs. 2 RStV
            </h2>
            <div className="space-y-2 text-zinc-700 dark:text-zinc-300">
              <p>Julius Faubel</p>
              <p>Roswitha-von-Gandersheim Weg 15</p>
              <p>42897 Remscheid</p>
            </div>
          </section>

          {/* Streitschlichtung */}
          <section>
            <h2 className="mb-4 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
              Streitschlichtung
            </h2>
            <p className="text-zinc-700 dark:text-zinc-300">
              Die Europäische Kommission stellt eine Plattform zur
              Online-Streitbeilegung (OS) bereit:{" "}
              <a
                href="https://ec.europa.eu/consumers/odr"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline dark:text-blue-400"
              >
                https://ec.europa.eu/consumers/odr
              </a>
            </p>
            <p className="mt-4 text-zinc-700 dark:text-zinc-300">
              Meine E-Mail-Adresse finden Sie oben im Impressum.
            </p>
            <p className="mt-4 text-zinc-700 dark:text-zinc-300">
              Ich bin nicht bereit oder verpflichtet, an Streitbeilegungsverfahren
              vor einer Verbraucherschlichtungsstelle teilzunehmen.
            </p>
          </section>

          {/* Haftung für Inhalte */}
          <section>
            <h2 className="mb-4 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
              Haftung für Inhalte
            </h2>
            <p className="text-zinc-700 dark:text-zinc-300">
              Als Diensteanbieter sind wir gemäß § 7 Abs.1 TMG für eigene Inhalte
              auf diesen Seiten nach den allgemeinen Gesetzen verantwortlich. Nach
              §§ 8 bis 10 TMG sind wir als Diensteanbieter jedoch nicht
              verpflichtet, übermittelte oder gespeicherte fremde Informationen zu
              überwachen oder nach Umständen zu forschen, die auf eine rechtswidrige
              Tätigkeit hinweisen.
            </p>
            <p className="mt-4 text-zinc-700 dark:text-zinc-300">
              Verpflichtungen zur Entfernung oder Sperrung der Nutzung von
              Informationen nach den allgemeinen Gesetzen bleiben hiervon unberührt.
              Eine diesbezügliche Haftung ist jedoch erst ab dem Zeitpunkt der
              Kenntnis einer konkreten Rechtsverletzung möglich. Bei Bekanntwerden
              von entsprechenden Rechtsverletzungen werden wir diese Inhalte
              umgehend entfernen.
            </p>
          </section>

          {/* Urheberrecht */}
          <section>
            <h2 className="mb-4 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
              Urheberrecht
            </h2>
            <p className="text-zinc-700 dark:text-zinc-300">
              Die durch die Seitenbetreiber erstellten Inhalte und Werke auf diesen
              Seiten unterliegen dem deutschen Urheberrecht. Die Vervielfältigung,
              Bearbeitung, Verbreitung und jede Art der Verwertung außerhalb der
              Grenzen des Urheberrechtes bedürfen der schriftlichen Zustimmung des
              jeweiligen Autors bzw. Erstellers. Downloads und Kopien dieser Seite
              sind nur für den privaten, nicht kommerziellen Gebrauch gestattet.
            </p>
            <p className="mt-4 text-zinc-700 dark:text-zinc-300">
              Soweit die Inhalte auf dieser Seite nicht vom Betreiber erstellt
              wurden, werden die Urheberrechte Dritter beachtet. Insbesondere werden
              Inhalte Dritter als solche gekennzeichnet. Sollten Sie trotzdem auf
              eine Urheberrechtsverletzung aufmerksam werden, bitten wir um einen
              entsprechenden Hinweis. Bei Bekanntwerden von Rechtsverletzungen
              werden wir derartige Inhalte umgehend entfernen.
            </p>
          </section>

          {/* Back Link */}
          <div className="pt-6">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-blue-600 hover:underline dark:text-blue-400"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Zurück zur Startseite
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

