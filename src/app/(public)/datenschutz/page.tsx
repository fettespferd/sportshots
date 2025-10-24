import Link from "next/link";

export default function DatenschutzPage() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900">
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="mb-6 inline-flex items-center text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
        >
          <svg
            className="mr-2 h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
          Zurück zur Startseite
        </Link>

        <h1 className="mb-8 text-4xl font-bold text-zinc-900 dark:text-zinc-50">
          Datenschutzerklärung
        </h1>

        <div className="prose prose-zinc dark:prose-invert max-w-none">
          <p className="lead text-lg text-zinc-600 dark:text-zinc-400">
            Stand: {new Date().toLocaleDateString("de-DE")}
          </p>

          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-bold text-zinc-900 dark:text-zinc-50">
              1. Verantwortlicher
            </h2>
            <p className="text-zinc-700 dark:text-zinc-300">
              Verantwortlich für die Datenverarbeitung auf dieser Website ist:
            </p>
            <div className="mt-4 rounded-lg bg-zinc-100 p-4 dark:bg-zinc-800">
              <p className="text-zinc-900 dark:text-zinc-50">
                <strong>SportShots</strong>
                <br />
                [Deine Firma/Name]
                <br />
                [Deine Straße und Hausnummer]
                <br />
                [PLZ und Ort]
                <br />
                <br />
                E-Mail: [deine-email@sportshots.app]
                <br />
                Telefon: [Deine Telefonnummer]
              </p>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-bold text-zinc-900 dark:text-zinc-50">
              2. Erhebung und Speicherung personenbezogener Daten
            </h2>
            
            <h3 className="mb-2 mt-4 text-xl font-semibold text-zinc-900 dark:text-zinc-50">
              2.1 Beim Besuch der Website
            </h3>
            <p className="text-zinc-700 dark:text-zinc-300">
              Bei der bloß informatorischen Nutzung der Website, also wenn Sie sich nicht
              registrieren oder uns anderweitig Informationen übermitteln, erheben wir nur
              die personenbezogenen Daten, die Ihr Browser an unseren Server übermittelt:
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-6 text-zinc-700 dark:text-zinc-300">
              <li>IP-Adresse</li>
              <li>Datum und Uhrzeit der Anfrage</li>
              <li>Zeitzonendifferenz zur Greenwich Mean Time (GMT)</li>
              <li>Inhalt der Anforderung (konkrete Seite)</li>
              <li>Zugriffsstatus/HTTP-Statuscode</li>
              <li>jeweils übertragene Datenmenge</li>
              <li>Website, von der die Anforderung kommt</li>
              <li>Browser und Betriebssystem</li>
            </ul>

            <h3 className="mb-2 mt-4 text-xl font-semibold text-zinc-900 dark:text-zinc-50">
              2.2 Bei Registrierung und Nutzung
            </h3>
            <p className="text-zinc-700 dark:text-zinc-300">
              Wenn Sie sich als Nutzer registrieren oder als Fotograf anmelden, erheben wir:
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-6 text-zinc-700 dark:text-zinc-300">
              <li>E-Mail-Adresse</li>
              <li>Name (optional)</li>
              <li>Profilbild (optional)</li>
              <li>Portfolio-Link (nur Fotografen)</li>
              <li>Biografie (nur Fotografen)</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-bold text-zinc-900 dark:text-zinc-50">
              3. Verwendung von Cookies
            </h2>
            <p className="text-zinc-700 dark:text-zinc-300">
              Wir verwenden technisch notwendige Cookies zur Bereitstellung unserer Dienste:
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-6 text-zinc-700 dark:text-zinc-300">
              <li>
                <strong>Session-Cookies:</strong> Zur Authentifizierung und Verwaltung Ihrer
                Sitzung
              </li>
              <li>
                <strong>Funktionale Cookies:</strong> Zum Speichern Ihrer Einstellungen (z.B.
                Dark Mode)
              </li>
            </ul>
            <p className="mt-4 text-zinc-700 dark:text-zinc-300">
              Die Cookies werden nach Ende Ihrer Browser-Sitzung oder nach Ablauf der
              festgelegten Zeit automatisch gelöscht.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-bold text-zinc-900 dark:text-zinc-50">
              4. Zahlungsabwicklung
            </h2>
            <p className="text-zinc-700 dark:text-zinc-300">
              Für die Abwicklung von Zahlungen nutzen wir den Dienst{" "}
              <strong>Stripe</strong>. Bei der Kaufabwicklung werden Ihre Zahlungsdaten
              direkt an Stripe übermittelt und dort verarbeitet. Wir speichern keine
              vollständigen Kreditkartendaten.
            </p>
            <p className="mt-4 text-zinc-700 dark:text-zinc-300">
              Weitere Informationen finden Sie in der{" "}
              <a
                href="https://stripe.com/de/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline dark:text-blue-400"
              >
                Datenschutzerklärung von Stripe
              </a>
              .
            </p>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-bold text-zinc-900 dark:text-zinc-50">
              5. Bildverarbeitung und Gesichtserkennung
            </h2>
            <p className="text-zinc-700 dark:text-zinc-300">
              Unsere Plattform bietet die Möglichkeit, Fotos per Gesichtserkennung zu
              finden. Dabei gilt:
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-6 text-zinc-700 dark:text-zinc-300">
              <li>
                Hochgeladene Selfies werden <strong>nicht dauerhaft gespeichert</strong>
              </li>
              <li>
                Die Gesichtserkennung erfolgt über <strong>AWS Rekognition</strong>
              </li>
              <li>Biometrische Daten werden nur temporär zur Suche verwendet</li>
              <li>
                Nach Abschluss der Suche werden alle temporären Daten gelöscht
              </li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-bold text-zinc-900 dark:text-zinc-50">
              6. Weitergabe von Daten
            </h2>
            <p className="text-zinc-700 dark:text-zinc-300">
              Eine Übermittlung Ihrer persönlichen Daten an Dritte erfolgt nur:
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-6 text-zinc-700 dark:text-zinc-300">
              <li>Mit Ihrer ausdrücklichen Einwilligung</li>
              <li>
                Zur Abwicklung von Zahlungen (Stripe) und Bildverarbeitung (AWS Rekognition)
              </li>
              <li>Wenn dies gesetzlich vorgeschrieben ist</li>
              <li>Zur Durchsetzung unserer Rechte</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-bold text-zinc-900 dark:text-zinc-50">
              7. Ihre Rechte
            </h2>
            <p className="text-zinc-700 dark:text-zinc-300">
              Sie haben folgende Rechte bezüglich Ihrer personenbezogenen Daten:
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-6 text-zinc-700 dark:text-zinc-300">
              <li>Recht auf Auskunft</li>
              <li>Recht auf Berichtigung</li>
              <li>Recht auf Löschung</li>
              <li>Recht auf Einschränkung der Verarbeitung</li>
              <li>Recht auf Datenübertragbarkeit</li>
              <li>Widerspruchsrecht gegen die Verarbeitung</li>
            </ul>
            <p className="mt-4 text-zinc-700 dark:text-zinc-300">
              Zur Ausübung Ihrer Rechte wenden Sie sich bitte an:{" "}
              <a
                href="mailto:[deine-email@sportshots.app]"
                className="text-blue-600 hover:underline dark:text-blue-400"
              >
                [deine-email@sportshots.app]
              </a>
            </p>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-bold text-zinc-900 dark:text-zinc-50">
              8. Datensicherheit
            </h2>
            <p className="text-zinc-700 dark:text-zinc-300">
              Wir verwenden SSL/TLS-Verschlüsselung für die Datenübertragung und setzen
              technische und organisatorische Sicherheitsmaßnahmen ein, um Ihre Daten gegen
              zufällige oder vorsätzliche Manipulationen, Verlust, Zerstörung oder den
              Zugriff unberechtigter Personen zu schützen.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-bold text-zinc-900 dark:text-zinc-50">
              9. Speicherdauer
            </h2>
            <p className="text-zinc-700 dark:text-zinc-300">
              Wir speichern personenbezogene Daten nur so lange, wie dies für die Erfüllung
              der Zwecke, für die sie erhoben wurden, erforderlich ist oder gesetzliche
              Aufbewahrungsfristen bestehen.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-bold text-zinc-900 dark:text-zinc-50">
              10. Änderungen dieser Datenschutzerklärung
            </h2>
            <p className="text-zinc-700 dark:text-zinc-300">
              Wir behalten uns vor, diese Datenschutzerklärung anzupassen, damit sie stets
              den aktuellen rechtlichen Anforderungen entspricht oder um Änderungen unserer
              Leistungen in der Datenschutzerklärung umzusetzen.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

