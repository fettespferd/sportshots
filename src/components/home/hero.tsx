"use client";

import Link from "next/link";
import Image from "next/image";
import { useLanguage } from "@/lib/i18n/LanguageContext";

export function Hero() {
  const { t } = useLanguage();

  return (
    <>
      {/* Hero Section with Background Image */}
      <div className="relative overflow-hidden bg-zinc-900">
        {/* Background Image */}
        <div className="absolute inset-0">
          <Image
            src="/images/knut-robinson-DTHtjyRuozs-unsplash.png"
            alt="Surfing Action"
            fill
            className="object-cover opacity-70"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-b from-zinc-900/40 via-zinc-900/50 to-zinc-900/80"></div>
        </div>

        {/* Hero Content */}
        <div className="relative mx-auto max-w-7xl px-4 py-32 sm:px-6 sm:py-40 lg:px-8">
          <div className="text-center">
            <h1 className="text-5xl font-bold tracking-tight text-white sm:text-7xl">
              {t("home.hero.title")}
              <br />
              <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                {t("home.hero.subtitle")}
              </span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-xl text-zinc-300">
              {t("home.hero.description")}
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                href="/find-photos"
                className="w-full rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 px-10 py-5 text-lg font-bold text-white shadow-2xl transition-all hover:scale-105 hover:shadow-blue-500/50 sm:w-auto"
              >
                📸 {t("home.hero.findPhotos")}
              </Link>
              <Link
                href="/search"
                className="w-full rounded-lg border-2 border-white/30 bg-white/10 px-8 py-4 text-base font-semibold text-white backdrop-blur-sm transition-all hover:scale-105 hover:bg-white/20 sm:w-auto"
              >
                🔍 {t("home.hero.searchEvents")}
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
                  {t("home.gallery.photosAvailable")}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Photographer CTA Section */}
      <div className="bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 py-20">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <div className="rounded-2xl border border-zinc-700/50 bg-zinc-800/50 p-8 shadow-2xl backdrop-blur-sm sm:p-12">
            <div className="mb-6 text-6xl">📸</div>
            <h2 className="mb-4 text-3xl font-bold text-white sm:text-4xl">
              Bist du Sportfotograf?
            </h2>
            <p className="mx-auto mb-8 max-w-2xl text-lg text-zinc-300">
              Verkaufe deine Eventfotos direkt an Athleten. Automatische Gesichtserkennung, 
              sichere Zahlungen und sofortige Auszahlungen über Stripe Connect.
            </p>
            
            <div className="mb-8 grid gap-4 sm:grid-cols-3">
              <div className="rounded-lg bg-zinc-700/30 p-4">
                <div className="mb-2 text-3xl">🤖</div>
                <div className="text-sm font-semibold text-white">KI-Gesichtserkennung</div>
                <div className="mt-1 text-xs text-zinc-400">Automatische Zuordnung</div>
              </div>
              <div className="rounded-lg bg-zinc-700/30 p-4">
                <div className="mb-2 text-3xl">💳</div>
                <div className="text-sm font-semibold text-white">Sichere Zahlungen</div>
                <div className="mt-1 text-xs text-zinc-400">Via Stripe Connect</div>
              </div>
              <div className="rounded-lg bg-zinc-700/30 p-4">
                <div className="mb-2 text-3xl">⚡</div>
                <div className="text-sm font-semibold text-white">Sofort-Auszahlung</div>
                <div className="mt-1 text-xs text-zinc-400">Direkt auf dein Konto</div>
              </div>
            </div>

            <Link
              href="/signup"
              className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 px-8 py-4 text-lg font-bold text-white shadow-lg transition-all hover:scale-105 hover:shadow-blue-500/50"
            >
              🚀 Jetzt als Fotograf starten
            </Link>
            
            <p className="mt-4 text-sm text-zinc-400">
              Kostenlos registrieren • Keine Setup-Gebühren • Nur 10% Provision
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

