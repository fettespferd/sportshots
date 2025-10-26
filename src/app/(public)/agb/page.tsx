import Link from "next/link";

export default function AGBPage() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900">
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <h1 className="mb-8 text-4xl font-bold text-zinc-900 dark:text-zinc-50">
          Allgemeine Geschäftsbedingungen (AGB)
        </h1>

        <div className="space-y-8 rounded-lg bg-white p-8 shadow dark:bg-zinc-800">
          {/* 1. Geltungsbereich */}
          <section>
            <h2 className="mb-4 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
              1. Geltungsbereich und Vertragspartner
            </h2>
            <div className="space-y-3 text-zinc-700 dark:text-zinc-300">
              <p>
                Diese Allgemeinen Geschäftsbedingungen (AGB) gelten für die Nutzung der
                Plattform <strong>SportShots</strong> (nachfolgend "Plattform"),
                betrieben durch:
              </p>
              <div className="rounded-lg bg-zinc-100 p-4 dark:bg-zinc-700">
                <p className="font-semibold">Brainmotion</p>
                <p>Julius Faubel</p>
                <p>E-Mail: julius.faubel@brainmotion.ai</p>
              </div>
              <p>
                Die Plattform dient als <strong>Vermittler</strong> zwischen Fotografen
                und Käufern von Sportfotos. SportShots tritt nicht als Verkäufer auf,
                sondern stellt lediglich die technische Infrastruktur bereit.
              </p>
            </div>
          </section>

          {/* 2. WICHTIG: Bildrechte und Verantwortlichkeiten */}
          <section className="rounded-lg border-4 border-red-500 bg-red-50 p-6 dark:border-red-600 dark:bg-red-900/20">
            <h2 className="mb-4 text-2xl font-semibold text-red-900 dark:text-red-300">
              ⚠️ 2. Bildrechte und Haftungsausschluss
            </h2>
            <div className="space-y-4 text-zinc-800 dark:text-zinc-200">
              <div className="rounded-lg bg-white p-4 dark:bg-zinc-800">
                <p className="mb-3 text-lg font-bold text-red-700 dark:text-red-400">
                  WICHTIG: Verantwortung der Fotografen
                </p>
                <ul className="space-y-2 pl-4">
                  <li className="flex gap-2">
                    <span className="font-bold text-red-600">•</span>
                    <span>
                      <strong>Fotografen sind allein verantwortlich</strong> für die
                      Rechtmäßigkeit der hochgeladenen Fotos
                    </span>
                  </li>
                  <li className="flex gap-2">
                    <span className="font-bold text-red-600">•</span>
                    <span>
                      Fotografen müssen sicherstellen, dass sie über alle erforderlichen
                      <strong> Persönlichkeitsrechte, Bildrechte und Nutzungsrechte</strong>{" "}
                      verfügen
                    </span>
                  </li>
                  <li className="flex gap-2">
                    <span className="font-bold text-red-600">•</span>
                    <span>
                      Bei Events müssen Fotografen die Einwilligung der abgebildeten
                      Personen bzw. Veranstalter einholen (z.B. durch Hinweisschilder,
                      Event-Teilnahmebedingungen oder ausdrückliche Zustimmung)
                    </span>
                  </li>
                  <li className="flex gap-2">
                    <span className="font-bold text-red-600">•</span>
                    <span>
                      Die Plattform prüft <strong>nicht</strong> die Rechtmäßigkeit
                      hochgeladener Fotos
                    </span>
                  </li>
                </ul>
              </div>

              <div className="rounded-lg bg-white p-4 dark:bg-zinc-800">
                <p className="mb-3 font-bold">Haftungsausschluss der Plattform:</p>
                <p>
                  SportShots übernimmt <strong>keine Haftung</strong> für
                  Rechtsverletzungen durch Fotografen. Bei Verstößen gegen
                  Persönlichkeits-, Urheber- oder andere Rechte haftet ausschließlich
                  der jeweilige Fotograf.
                </p>
                <p className="mt-3">
                  Sollten Sie auf einem Foto abgebildet sein und die Veröffentlichung
                  widersprechen wollen, kontaktieren Sie bitte umgehend den Fotografen
                  oder uns unter:{" "}
                  <a
                    href="mailto:julius.faubel@brainmotion.ai"
                    className="font-semibold text-blue-600 hover:underline dark:text-blue-400"
                  >
                    julius.faubel@brainmotion.ai
                  </a>
                </p>
              </div>

              <div className="rounded-lg bg-yellow-50 p-4 dark:bg-yellow-900/30">
                <p className="font-bold text-yellow-900 dark:text-yellow-200">
                  📢 Verpflichtungen des Fotografen:
                </p>
                <ul className="mt-2 space-y-1 text-sm text-zinc-800 dark:text-zinc-200">
                  <li>
                    ✓ Sicherstellen, dass abgebildete Personen über die Veröffentlichung
                    informiert sind
                  </li>
                  <li>✓ Einwilligung der Veranstalter einholen (falls erforderlich)</li>
                  <li>
                    ✓ Unverzügliche Löschung von Fotos bei berechtigtem Widerspruch
                  </li>
                  <li>✓ Keine Fotos von Minderjährigen ohne Zustimmung der Eltern</li>
                  <li>
                    ✓ Keine Fotos, die Persönlichkeitsrechte, Markenrechte oder andere
                    Schutzrechte verletzen
                  </li>
                </ul>
              </div>
            </div>
          </section>

          {/* 3. Leistungen der Plattform */}
          <section>
            <h2 className="mb-4 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
              3. Leistungen der Plattform
            </h2>
            <div className="space-y-3 text-zinc-700 dark:text-zinc-300">
              <p>SportShots bietet folgende Dienstleistungen:</p>
              <ul className="list-inside list-disc space-y-2 pl-4">
                <li>
                  <strong>Für Käufer:</strong> Suchfunktion für Sportfotos (per
                  Startnummer, Event oder Selfie), Kaufabwicklung, Download von Fotos
                </li>
                <li>
                  <strong>Für Fotografen:</strong> Hosting von Event-Galerien,
                  Zahlungsabwicklung über Stripe Connect, Gesichtserkennung (optional)
                </li>
                <li>
                  <strong>Technische Infrastruktur:</strong> Speicherung, Bereitstellung
                  und Verkauf von Fotos im Auftrag der Fotografen
                </li>
              </ul>
            </div>
          </section>

          {/* 4. Registrierung und Nutzerkonten */}
          <section>
            <h2 className="mb-4 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
              4. Registrierung und Nutzerkonten
            </h2>
            <div className="space-y-3 text-zinc-700 dark:text-zinc-300">
              <p>
                <strong>4.1 Fotografen:</strong> Die Registrierung als Fotograf erfordert
                die Angabe korrekter Daten. Mit der Registrierung bestätigen Sie, dass
                Sie berechtigt sind, Fotos kommerziell zu verkaufen.
              </p>
              <p>
                <strong>4.2 Käufer:</strong> Für den Kauf von Fotos ist keine
                Registrierung erforderlich (Gastkauf möglich).
              </p>
              <p>
                <strong>4.3 Zugangsdaten:</strong> Sie sind verpflichtet, Ihre
                Zugangsdaten vertraulich zu behandeln und vor dem Zugriff Dritter zu
                schützen.
              </p>
            </div>
          </section>

          {/* 5. Vertragsschluss und Zahlungsbedingungen */}
          <section>
            <h2 className="mb-4 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
              5. Vertragsschluss und Zahlungsbedingungen
            </h2>
            <div className="space-y-3 text-zinc-700 dark:text-zinc-300">
              <p>
                <strong>5.1 Kaufvertrag:</strong> Der Kaufvertrag kommt zwischen dem
                Käufer und dem jeweiligen Fotografen zustande. SportShots tritt lediglich
                als technischer Vermittler auf.
              </p>
              <p>
                <strong>5.2 Preise:</strong> Die Preise werden vom Fotografen festgelegt
                und sind in der Event-Galerie ersichtlich. Alle Preise sind Endpreise
                inkl. gesetzlicher MwSt.
              </p>
              <p>
                <strong>5.3 Zahlung:</strong> Die Zahlungsabwicklung erfolgt über
                <strong> Stripe</strong>. Nach erfolgreicher Zahlung erhalten Sie sofort
                einen Download-Link per E-Mail.
              </p>
              <p>
                <strong>5.4 Provision:</strong> SportShots erhebt eine Provision von 15%
                auf jeden Verkauf. Diese wird automatisch von der Auszahlung an den
                Fotografen abgezogen.
              </p>
            </div>
          </section>

          {/* 6. Widerrufsrecht für Verbraucher */}
          <section>
            <h2 className="mb-4 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
              6. Widerrufsrecht für Verbraucher
            </h2>
            <div className="space-y-3 text-zinc-700 dark:text-zinc-300">
              <div className="rounded-lg bg-blue-50 p-4 dark:bg-blue-900/20">
                <p className="font-semibold">
                  ⚠️ Ausschluss des Widerrufsrechts bei digitalen Inhalten
                </p>
                <p className="mt-2">
                  Gemäß § 356 Abs. 5 BGB erlischt das Widerrufsrecht bei Verträgen zur
                  Lieferung von <strong>digitalen Inhalten</strong> (Fotos), wenn der
                  Verbraucher ausdrücklich zugestimmt hat, dass mit der Ausführung vor
                  Ablauf der Widerrufsfrist begonnen wird.
                </p>
                <p className="mt-2">
                  Da der Download unmittelbar nach der Zahlung erfolgt und Sie hiermit
                  ausdrücklich zustimmen, entfällt Ihr Widerrufsrecht.
                </p>
              </div>
            </div>
          </section>

          {/* 7. Nutzungsrechte */}
          <section>
            <h2 className="mb-4 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
              7. Nutzungsrechte an gekauften Fotos
            </h2>
            <div className="space-y-3 text-zinc-700 dark:text-zinc-300">
              <p>
                <strong>7.1 Privater Gebrauch:</strong> Käufer erwerben ein einfaches,
                nicht übertragbares Nutzungsrecht für den privaten, nicht kommerziellen
                Gebrauch (Social Media, persönliche Website, Druck für private Zwecke).
              </p>
              <p>
                <strong>7.2 Kommerzielle Nutzung:</strong> Jede kommerzielle Nutzung (z.B.
                Werbung, Verkauf, Presseveröffentlichung) bedarf der ausdrücklichen
                schriftlichen Zustimmung des Fotografen.
              </p>
              <p>
                <strong>7.3 Urheberrecht:</strong> Das Urheberrecht verbleibt beim
                Fotografen. Wasserzeichen dürfen nicht entfernt werden.
              </p>
            </div>
          </section>

          {/* 8. Löschung von Fotos */}
          <section>
            <h2 className="mb-4 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
              8. Löschung von Fotos und Widerspruchsrecht
            </h2>
            <div className="space-y-3 text-zinc-700 dark:text-zinc-300">
              <p>
                <strong>8.1 Widerspruch gegen Veröffentlichung:</strong> Sollten Sie auf
                einem Foto abgebildet sein und der Veröffentlichung widersprechen wollen,
                kontaktieren Sie bitte:
              </p>
              <ul className="list-inside list-disc pl-4">
                <li>Den Fotografen direkt (falls Kontaktdaten verfügbar)</li>
                <li>
                  Unseren Support:{" "}
                  <a
                    href="mailto:julius.faubel@brainmotion.ai"
                    className="text-blue-600 hover:underline dark:text-blue-400"
                  >
                    julius.faubel@brainmotion.ai
                  </a>
                </li>
              </ul>
              <p>
                <strong>8.2 Prüfung und Löschung:</strong> Wir prüfen jede Beschwerde
                unverzüglich und leiten diese an den Fotografen weiter. Bei berechtigtem
                Widerspruch wird das Foto innerhalb von 48 Stunden gelöscht.
              </p>
              <p>
                <strong>8.3 Bereits verkaufte Fotos:</strong> Die Löschung betrifft nur
                die Verfügbarkeit in der Galerie. Bereits heruntergeladene Fotos können
                nicht zurückgerufen werden.
              </p>
            </div>
          </section>

          {/* 9. Stripe Connect */}
          <section>
            <h2 className="mb-4 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
              9. Stripe Connect und Zahlungsabwicklung
            </h2>
            <div className="space-y-3 text-zinc-700 dark:text-zinc-300">
              <p>
                Fotografen nutzen <strong>Stripe Connect</strong> für Auszahlungen. Es
                gelten zusätzlich die{" "}
                <a
                  href="https://stripe.com/connect-account/legal"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline dark:text-blue-400"
                >
                  Stripe Connected Account Agreement
                </a>{" "}
                und die{" "}
                <a
                  href="https://stripe.com/de/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline dark:text-blue-400"
                >
                  Stripe Datenschutzerklärung
                </a>
                .
              </p>
              <p>
                SportShots hat keinen Zugriff auf Ihre Zahlungsdaten. Diese werden
                ausschließlich bei Stripe verarbeitet.
              </p>
            </div>
          </section>

          {/* 10. Gewährleistung */}
          <section>
            <h2 className="mb-4 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
              10. Gewährleistung und Haftung
            </h2>
            <div className="space-y-3 text-zinc-700 dark:text-zinc-300">
              <p>
                <strong>10.1 Technische Verfügbarkeit:</strong> Wir bemühen uns um eine
                99% Verfügbarkeit der Plattform. Wartungsarbeiten werden nach Möglichkeit
                angekündigt.
              </p>
              <p>
                <strong>10.2 Qualität der Fotos:</strong> Für die Qualität der Fotos ist
                ausschließlich der Fotograf verantwortlich. SportShots übernimmt keine
                Gewährleistung für Bildqualität, Schärfe oder Belichtung.
              </p>
              <p>
                <strong>10.3 Haftungsbeschränkung:</strong> SportShots haftet nur für
                Vorsatz und grobe Fahrlässigkeit sowie für Schäden aus der Verletzung des
                Lebens, des Körpers oder der Gesundheit. Die Haftung für leichte
                Fahrlässigkeit ist ausgeschlossen, soweit nicht wesentliche
                Vertragspflichten (Kardinalpflichten) verletzt sind.
              </p>
            </div>
          </section>

          {/* 11. Kündigung und Sperrung */}
          <section>
            <h2 className="mb-4 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
              11. Kündigung und Sperrung
            </h2>
            <div className="space-y-3 text-zinc-700 dark:text-zinc-300">
              <p>
                <strong>11.1 Kündigung:</strong> Sie können Ihr Nutzerkonto jederzeit ohne
                Angabe von Gründen in den Kontoeinstellungen löschen.
              </p>
              <p>
                <strong>11.2 Sperrung:</strong> SportShots behält sich vor, Nutzer bei
                Verstößen gegen diese AGB oder geltendes Recht sofort zu sperren. Dies
                betrifft insbesondere:
              </p>
              <ul className="list-inside list-disc pl-4">
                <li>Hochladen rechtswidriger Inhalte (z.B. ohne Bildrechte)</li>
                <li>Verletzung von Persönlichkeitsrechten</li>
                <li>Missbrauch der Plattform</li>
                <li>Zahlungsrückstände</li>
              </ul>
            </div>
          </section>

          {/* 12. Datenschutz */}
          <section>
            <h2 className="mb-4 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
              12. Datenschutz
            </h2>
            <p className="text-zinc-700 dark:text-zinc-300">
              Informationen zur Verarbeitung Ihrer personenbezogenen Daten finden Sie in
              unserer{" "}
              <Link
                href="/datenschutz"
                className="text-blue-600 hover:underline dark:text-blue-400"
              >
                Datenschutzerklärung
              </Link>
              .
            </p>
          </section>

          {/* 13. Schlussbestimmungen */}
          <section>
            <h2 className="mb-4 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
              13. Schlussbestimmungen
            </h2>
            <div className="space-y-3 text-zinc-700 dark:text-zinc-300">
              <p>
                <strong>13.1 Anwendbares Recht:</strong> Es gilt das Recht der
                Bundesrepublik Deutschland unter Ausschluss des UN-Kaufrechts.
              </p>
              <p>
                <strong>13.2 Gerichtsstand:</strong> Sofern Sie Kaufmann sind, ist
                ausschließlicher Gerichtsstand für alle Streitigkeiten aus diesem Vertrag
                unser Geschäftssitz.
              </p>
              <p>
                <strong>13.3 Salvatorische Klausel:</strong> Sollten einzelne Bestimmungen
                dieser AGB unwirksam sein oder werden, bleibt die Wirksamkeit der übrigen
                Bestimmungen hiervon unberührt.
              </p>
              <p>
                <strong>13.4 Änderungen:</strong> Wir behalten uns vor, diese AGB bei
                Bedarf zu ändern. Über wesentliche Änderungen werden Sie per E-Mail
                informiert.
              </p>
            </div>
          </section>

          {/* Stand */}
          <section className="border-t border-zinc-200 pt-6 dark:border-zinc-700">
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

