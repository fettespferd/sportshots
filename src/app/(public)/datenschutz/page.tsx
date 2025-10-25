import Link from "next/link";

export default function DatenschutzPage() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900">
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <h1 className="mb-8 text-4xl font-bold text-zinc-900 dark:text-zinc-50">
          Datenschutzerklärung
        </h1>

        <div className="space-y-8 rounded-lg bg-white p-8 shadow dark:bg-zinc-800">
          {/* Intro */}
          <section>
            <p className="text-zinc-700 dark:text-zinc-300">
              Der Schutz Ihrer persönlichen Daten ist uns ein besonderes Anliegen.
              Wir verarbeiten Ihre Daten daher ausschließlich auf Grundlage der
              gesetzlichen Bestimmungen (DSGVO, TKG 2003). In diesen
              Datenschutzinformationen informieren wir Sie über die wichtigsten
              Aspekte der Datenverarbeitung im Rahmen unserer Website.
            </p>
          </section>

          {/* Verantwortlicher */}
          <section>
            <h2 className="mb-4 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
              1. Verantwortlicher
            </h2>
            <div className="space-y-2 text-zinc-700 dark:text-zinc-300">
              <p>Verantwortlich für die Datenverarbeitung ist:</p>
              <p className="font-semibold">Brainmotion</p>
              <p>Julius Faubel</p>
              <p>
                E-Mail:{" "}
                <a
                  href="mailto:julius.faubel@brainmotion.ai"
                  className="text-blue-600 hover:underline dark:text-blue-400"
                >
                  julius.faubel@brainmotion.ai
                </a>
              </p>
            </div>
          </section>

          {/* Gesichtserkennung - WICHTIG! */}
          <section className="rounded-lg bg-yellow-50 p-6 dark:bg-yellow-900/20">
            <h2 className="mb-4 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
              2. Gesichtserkennung und biometrische Daten
            </h2>
            <div className="space-y-4 text-zinc-700 dark:text-zinc-300">
              <p className="font-semibold">
                Wichtiger Hinweis zur Verarbeitung biometrischer Daten:
              </p>
              <p>
                Unsere Plattform bietet eine Selfie-Suchfunktion, bei der Sie freiwillig
                ein Foto Ihres Gesichts hochladen können, um Fotos von Sportveranstaltungen
                zu finden, auf denen Sie abgebildet sind.
              </p>
              
              <div className="rounded-lg border-2 border-yellow-500 bg-white p-4 dark:border-yellow-600 dark:bg-zinc-800">
                <p className="font-semibold text-yellow-800 dark:text-yellow-300">
                  ⚠️ Rechtsgrundlage und Einwilligung
                </p>
                <p className="mt-2">
                  Die Verarbeitung biometrischer Daten erfolgt ausschließlich auf
                  Grundlage Ihrer <strong>ausdrücklichen Einwilligung</strong> gemäß
                  Art. 9 Abs. 2 lit. a DSGVO. Diese Einwilligung erteilen Sie durch
                  das aktive Hochladen eines Selfies.
                </p>
              </div>

              <div className="space-y-2">
                <p className="font-semibold">Wie funktioniert die Gesichtserkennung?</p>
                <ul className="list-inside list-disc space-y-1 pl-4">
                  <li>Sie laden freiwillig ein Selfie hoch</li>
                  <li>
                    Das Bild wird temporär an Amazon Rekognition (AWS) übermittelt
                  </li>
                  <li>
                    AWS analysiert Gesichtsmerkmale und vergleicht sie mit Fotos in
                    unserer Datenbank
                  </li>
                  <li>
                    Ihre Selfie-Datei wird <strong>sofort nach der Suche gelöscht</strong>
                  </li>
                  <li>Es werden keine biometrischen Daten dauerhaft gespeichert</li>
                </ul>
              </div>

              <div className="rounded-lg bg-green-50 p-4 dark:bg-green-900/20">
                <p className="font-semibold text-green-800 dark:text-green-300">
                  ✓ Ihre Rechte
                </p>
                <ul className="mt-2 space-y-1 text-sm">
                  <li>• Sie können Ihre Einwilligung jederzeit widerrufen</li>
                  <li>• Die Nutzung der Plattform ist auch ohne Selfie-Suche möglich</li>
                  <li>• Alternativ können Sie nach Startnummer oder Event suchen</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Datenverarbeitung */}
          <section>
            <h2 className="mb-4 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
              3. Welche Daten wir verarbeiten
            </h2>
            <div className="space-y-4 text-zinc-700 dark:text-zinc-300">
              <div>
                <p className="font-semibold">3.1 Registrierung und Nutzerkonto</p>
                <ul className="mt-2 list-inside list-disc space-y-1 pl-4">
                  <li>E-Mail-Adresse</li>
                  <li>Name</li>
                  <li>Passwort (verschlüsselt gespeichert)</li>
                </ul>
                <p className="mt-2 text-sm">
                  Rechtsgrundlage: Art. 6 Abs. 1 lit. b DSGVO (Vertragserfüllung)
                </p>
              </div>

              <div>
                <p className="font-semibold">3.2 Fotografen-Profil</p>
                <ul className="mt-2 list-inside list-disc space-y-1 pl-4">
                  <li>Portfolio-Link</li>
                  <li>Stripe-Kontoinformationen (für Auszahlungen)</li>
                  <li>Hochgeladene Eventfotos</li>
                </ul>
                <p className="mt-2 text-sm">
                  Rechtsgrundlage: Art. 6 Abs. 1 lit. b DSGVO (Vertragserfüllung)
                </p>
              </div>

              <div>
                <p className="font-semibold">3.3 Käufe und Zahlungen</p>
                <ul className="mt-2 list-inside list-disc space-y-1 pl-4">
                  <li>Zahlungsinformationen (verarbeitet durch Stripe)</li>
                  <li>Bestellhistorie</li>
                  <li>Rechnungsdaten</li>
                </ul>
                <p className="mt-2 text-sm">
                  Rechtsgrundlage: Art. 6 Abs. 1 lit. b DSGVO (Vertragserfüllung) und
                  lit. c (gesetzliche Aufbewahrungspflicht)
                </p>
              </div>

              <div>
                <p className="font-semibold">3.4 Selfie-Suche (optional)</p>
                <ul className="mt-2 list-inside list-disc space-y-1 pl-4">
                  <li>Temporäres Selfie-Foto (wird sofort nach Suche gelöscht)</li>
                  <li>Keine dauerhafte Speicherung biometrischer Daten</li>
                </ul>
                <p className="mt-2 text-sm">
                  Rechtsgrundlage: Art. 9 Abs. 2 lit. a DSGVO (ausdrückliche
                  Einwilligung)
                </p>
              </div>
            </div>
          </section>

          {/* Drittanbieter */}
          <section>
            <h2 className="mb-4 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
              4. Weitergabe an Drittanbieter
            </h2>
            <div className="space-y-4 text-zinc-700 dark:text-zinc-300">
              <div>
                <p className="font-semibold">4.1 Supabase (Hosting & Datenbank)</p>
                <p>
                  Wir nutzen Supabase für Hosting, Authentifizierung und
                  Datenspeicherung. Server-Standort: EU. Datenschutzerklärung:{" "}
                  <a
                    href="https://supabase.com/privacy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline dark:text-blue-400"
                  >
                    supabase.com/privacy
                  </a>
                </p>
              </div>

              <div>
                <p className="font-semibold">4.2 Stripe (Zahlungsabwicklung)</p>
                <p>
                  Zahlungen werden über Stripe abgewickelt. Stripe ist PCI-DSS
                  zertifiziert. Datenschutzerklärung:{" "}
                  <a
                    href="https://stripe.com/de/privacy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline dark:text-blue-400"
                  >
                    stripe.com/de/privacy
                  </a>
                </p>
              </div>

              <div>
                <p className="font-semibold">4.3 Amazon Rekognition (AWS)</p>
                <p>
                  Für die Gesichtserkennung nutzen wir Amazon Rekognition. Ihre
                  Selfie-Daten werden verschlüsselt übertragen und sofort nach der
                  Analyse gelöscht. AWS-Rechenzentrum: Frankfurt (eu-central-1).
                  Datenschutzerklärung:{" "}
                  <a
                    href="https://aws.amazon.com/de/privacy/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline dark:text-blue-400"
                  >
                    aws.amazon.com/de/privacy
                  </a>
                </p>
              </div>

              <div>
                <p className="font-semibold">4.4 Resend (E-Mail-Versand)</p>
                <p>
                  Für Transaktions-E-Mails (Bestellbestätigungen, etc.) nutzen wir
                  Resend. Datenschutzerklärung:{" "}
                  <a
                    href="https://resend.com/legal/privacy-policy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline dark:text-blue-400"
                  >
                    resend.com/legal/privacy-policy
                  </a>
                </p>
              </div>
            </div>
          </section>

          {/* Speicherdauer */}
          <section>
            <h2 className="mb-4 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
              5. Speicherdauer
            </h2>
            <div className="space-y-2 text-zinc-700 dark:text-zinc-300">
              <ul className="list-inside list-disc space-y-1 pl-4">
                <li>
                  <strong>Selfie-Fotos:</strong> Sofortige Löschung nach Abschluss der
                  Suche (max. 5 Minuten)
                </li>
                <li>
                  <strong>Nutzerkonto:</strong> Bis zur Löschung durch Sie oder nach 3
                  Jahren Inaktivität
                </li>
                <li>
                  <strong>Rechnungsdaten:</strong> 10 Jahre (gesetzliche
                  Aufbewahrungspflicht)
                </li>
                <li>
                  <strong>Eventfotos:</strong> Bis zur Löschung durch den Fotografen
                </li>
              </ul>
            </div>
          </section>

          {/* Ihre Rechte */}
          <section>
            <h2 className="mb-4 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
              6. Ihre Rechte
            </h2>
            <div className="space-y-2 text-zinc-700 dark:text-zinc-300">
              <p>Sie haben jederzeit das Recht auf:</p>
              <ul className="list-inside list-disc space-y-1 pl-4">
                <li>
                  <strong>Auskunft</strong> über Ihre gespeicherten Daten (Art. 15
                  DSGVO)
                </li>
                <li>
                  <strong>Berichtigung</strong> unrichtiger Daten (Art. 16 DSGVO)
                </li>
                <li>
                  <strong>Löschung</strong> Ihrer Daten (Art. 17 DSGVO)
                </li>
                <li>
                  <strong>Einschränkung</strong> der Verarbeitung (Art. 18 DSGVO)
                </li>
                <li>
                  <strong>Datenübertragbarkeit</strong> (Art. 20 DSGVO)
                </li>
                <li>
                  <strong>Widerspruch</strong> gegen die Verarbeitung (Art. 21 DSGVO)
                </li>
                <li>
                  <strong>Widerruf</strong> Ihrer Einwilligung zur Gesichtserkennung
                </li>
              </ul>
              <p className="mt-4">
                Zur Ausübung dieser Rechte kontaktieren Sie uns bitte unter:{" "}
                <a
                  href="mailto:julius.faubel@brainmotion.ai"
                  className="text-blue-600 hover:underline dark:text-blue-400"
                >
                  julius.faubel@brainmotion.ai
                </a>
              </p>
            </div>
          </section>

          {/* Cookies */}
          <section>
            <h2 className="mb-4 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
              7. Cookies und lokaler Speicher
            </h2>
            <div className="space-y-2 text-zinc-700 dark:text-zinc-300">
              <p>
                Unsere Website verwendet Cookies ausschließlich für technisch
                notwendige Funktionen (Session-Verwaltung, Authentifizierung). Diese
                sind für den Betrieb der Seite erforderlich.
              </p>
              <p className="mt-2">
                Wir setzen <strong>keine</strong> Tracking- oder Analyse-Cookies ein.
              </p>
            </div>
          </section>

          {/* Sicherheit */}
          <section>
            <h2 className="mb-4 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
              8. Datensicherheit
            </h2>
            <div className="space-y-2 text-zinc-700 dark:text-zinc-300">
              <p>Wir treffen umfangreiche Sicherheitsmaßnahmen:</p>
              <ul className="list-inside list-disc space-y-1 pl-4">
                <li>SSL/TLS-Verschlüsselung für alle Datenübertragungen</li>
                <li>Verschlüsselte Speicherung von Passwörtern</li>
                <li>Regelmäßige Sicherheitsupdates</li>
                <li>Zugriffsbeschränkungen auf Servern</li>
                <li>Automatische Löschung temporärer Selfie-Daten</li>
              </ul>
            </div>
          </section>

          {/* Beschwerderecht */}
          <section>
            <h2 className="mb-4 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
              9. Beschwerderecht
            </h2>
            <p className="text-zinc-700 dark:text-zinc-300">
              Sie haben das Recht, sich bei einer Aufsichtsbehörde zu beschweren. Die
              für uns zuständige Behörde ist die Datenschutzbehörde Ihres
              Bundeslandes.
            </p>
          </section>

          {/* Stand */}
          <section>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Stand: {new Date().toLocaleDateString("de-DE", { 
                year: "numeric", 
                month: "long", 
                day: "numeric" 
              })}
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
