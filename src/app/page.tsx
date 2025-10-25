import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = await createClient();

  // Get recent published events
  const { data: events } = await supabase
    .from("events")
    .select("*")
    .eq("is_published", true)
    .order("event_date", { ascending: false })
    .limit(6);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900">
      {/* Hero Section with Background Image */}
      <div className="relative overflow-hidden bg-zinc-900">
        {/* Background Image */}
        <div className="absolute inset-0">
          <Image
            src="/images/knut-robinson-DTHtjyRuozs-unsplash.jpg"
            alt="Sport Action"
            fill
            className="object-cover opacity-40"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-b from-zinc-900/50 via-zinc-900/70 to-zinc-900"></div>
        </div>

        {/* Hero Content */}
        <div className="relative mx-auto max-w-7xl px-4 py-32 sm:px-6 sm:py-40 lg:px-8">
          <div className="text-center">
            <h1 className="text-5xl font-bold tracking-tight text-white sm:text-7xl">
              Deine Sportfotos.
              <br />
              <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                Schnell gefunden.
              </span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-xl text-zinc-300">
              Finde und kaufe deine Sportfotos über Startnummer, Event-Suche
              oder Selfie-Abgleich. Fotografen können ihre Events erstellen und
              Fotos verkaufen.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                href="/search"
                className="w-full rounded-lg bg-white px-8 py-4 text-base font-semibold text-zinc-900 shadow-xl transition-all hover:scale-105 hover:bg-zinc-100 sm:w-auto"
              >
                🔍 Event suchen
              </Link>
              <Link
                href="/signup/photographer"
                className="w-full rounded-lg border-2 border-white/30 bg-white/10 px-8 py-4 text-base font-semibold text-white backdrop-blur-sm transition-all hover:scale-105 hover:bg-white/20 sm:w-auto"
              >
                📸 Als Fotograf starten
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Image Gallery Showcase */}
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
          <div className="relative aspect-square overflow-hidden rounded-2xl shadow-lg">
            <Image
              src="/images/jack-delulio-oro0KHgeQ_g-unsplash.jpg"
              alt="Sport Action"
              fill
              className="object-cover transition-transform hover:scale-110"
            />
          </div>
          <div className="relative aspect-square overflow-hidden rounded-2xl shadow-lg">
            <Image
              src="/images/jeremy-bishop-_CFv3bntQlQ-unsplash.jpg"
              alt="Sport Action"
              fill
              className="object-cover transition-transform hover:scale-110"
            />
          </div>
          <div className="relative aspect-square overflow-hidden rounded-2xl shadow-lg">
            <Image
              src="/images/jeremy-bishop-pikyGuAmwpM-unsplash.jpg"
              alt="Sport Action"
              fill
              className="object-cover transition-transform hover:scale-110"
            />
          </div>
          <div className="relative aspect-square overflow-hidden rounded-2xl shadow-lg">
            <Image
              src="/images/oleg-kukharuk-cVeJlVvQ3JI-unsplash.jpg"
              alt="Sport Action"
              fill
              className="object-cover transition-transform hover:scale-110"
            />
          </div>
          <div className="relative aspect-square overflow-hidden rounded-2xl shadow-lg">
            <Image
              src="/images/coen-van-de-broek-OFyh9TpMyM8-unsplash.jpg"
              alt="Sport Action"
              fill
              className="object-cover transition-transform hover:scale-110"
            />
          </div>
          <div className="relative aspect-square overflow-hidden rounded-2xl shadow-lg md:col-span-1">
            <div className="flex h-full items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600 p-8 text-center">
              <div>
                <p className="text-4xl font-bold text-white">10.000+</p>
                <p className="mt-2 text-sm font-medium text-white/90">
                  Sportfotos verfügbar
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <h2 className="mb-12 text-center text-3xl font-bold text-zinc-900 dark:text-zinc-50">
          Wie es funktioniert
        </h2>
        <div className="grid gap-8 md:grid-cols-3">
          <div className="rounded-lg bg-white p-8 shadow dark:bg-zinc-800">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/20">
              <svg
                className="h-6 w-6 text-blue-600 dark:text-blue-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
            <h3 className="mb-2 text-xl font-semibold text-zinc-900 dark:text-zinc-50">
              1. Event finden
            </h3>
            <p className="text-zinc-600 dark:text-zinc-400">
              Suche nach deinem Event über Datum, Ort oder Namen. Oder scanne
              den QR-Code am Event.
            </p>
          </div>

          <div className="rounded-lg bg-white p-8 shadow dark:bg-zinc-800">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20">
              <svg
                className="h-6 w-6 text-green-600 dark:text-green-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
            <h3 className="mb-2 text-xl font-semibold text-zinc-900 dark:text-zinc-50">
              2. Fotos finden
            </h3>
            <p className="text-zinc-600 dark:text-zinc-400">
              Gib deine Startnummer ein oder lade ein Selfie hoch, um deine
              Fotos zu finden.
            </p>
          </div>

          <div className="rounded-lg bg-white p-8 shadow dark:bg-zinc-800">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900/20">
              <svg
                className="h-6 w-6 text-purple-600 dark:text-purple-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
            </div>
            <h3 className="mb-2 text-xl font-semibold text-zinc-900 dark:text-zinc-50">
              3. Fotos kaufen
            </h3>
            <p className="text-zinc-600 dark:text-zinc-400">
              Wähle deine Fotos aus und kaufe sie einzeln oder als Paket. Sofortiger
              Download nach dem Kauf.
            </p>
          </div>
        </div>
      </div>

      {/* Recent Events */}
      {events && events.length > 0 && (
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="mb-8 flex items-center justify-between">
            <h2 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
              Aktuelle Events
            </h2>
            <Link
              href="/search"
              className="text-sm font-medium text-zinc-700 hover:underline dark:text-zinc-300"
            >
              Alle Events ansehen →
            </Link>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {events.map((event) => (
              <Link
                key={event.id}
                href={`/event/${event.slug}`}
                className="group overflow-hidden rounded-lg bg-white shadow transition-shadow hover:shadow-lg dark:bg-zinc-800"
              >
                {event.cover_image_url ? (
                  <div className="aspect-video w-full overflow-hidden bg-zinc-100 dark:bg-zinc-700">
                    <img
                      src={event.cover_image_url}
                      alt={event.title}
                      className="h-full w-full object-cover transition-transform group-hover:scale-105"
                    />
                  </div>
                ) : (
                  <div className="flex aspect-video w-full items-center justify-center bg-zinc-100 dark:bg-zinc-700">
                    <svg
                      className="h-12 w-12 text-zinc-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                )}
                <div className="p-6">
                  <h3 className="mb-2 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                    {event.title}
                  </h3>
                  <div className="space-y-1 text-sm text-zinc-600 dark:text-zinc-400">
                    <div className="flex items-center">
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
                          d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                        />
                      </svg>
                      {event.location}
                    </div>
                    <div className="flex items-center">
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
                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                      {new Date(event.event_date).toLocaleDateString("de-DE")}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* CTA Section */}
      <div className="bg-white dark:bg-zinc-800">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
              Bist du Sportfotograf?
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-zinc-600 dark:text-zinc-400">
              Erstelle Events, lade Fotos hoch und verkaufe sie direkt an die
              Athleten. Mit automatischer Auszahlung über Stripe Connect.
            </p>
            <Link
              href="/signup/photographer"
              className="mt-8 inline-block rounded-md bg-zinc-900 px-6 py-3 text-base font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              Jetzt als Fotograf registrieren
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
