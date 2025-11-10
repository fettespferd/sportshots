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
                href="/search"
                className="w-full rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 px-10 py-5 text-lg font-bold text-white shadow-2xl transition-all hover:scale-105 hover:shadow-blue-500/50 sm:w-auto"
              >
                🔍 {t("home.hero.searchEvents")}
              </Link>
              <Link
                href="/find-photos"
                className="w-full rounded-lg border-2 border-white/30 bg-white/10 px-8 py-4 text-base font-semibold text-white backdrop-blur-sm transition-all hover:scale-105 hover:bg-white/20 sm:w-auto"
              >
                📸 {t("home.hero.findPhotos")}
              </Link>
            </div>

          </div>
        </div>
      </div>

      {/* Image Gallery Showcase - Modern Visual Effects */}
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mb-8 text-center">
          <h2 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50 sm:text-4xl">
            Entdecke die Vielfalt
          </h2>
          <p className="mt-2 text-lg text-zinc-600 dark:text-zinc-400">
            Von Surfen bis CrossFit – finde deine Sportfotos
          </p>
        </div>
        
        {/* Modern Grid Layout - Uniform Heights */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
          {[
            { src: "/images/jack-delulio-oro0KHgeQ_g-unsplash.jpg", alt: "Paddleboarding" },
            { src: "/images/jeremy-bishop-_CFv3bntQlQ-unsplash.jpg", alt: "Surfing Barrel" },
            { src: "/images/jeremy-bishop-pikyGuAmwpM-unsplash.jpg", alt: "Surfing Action" },
            { src: "/images/oleg-kukharuk-cVeJlVvQ3JI-unsplash.jpg", alt: "Cycling" },
            { src: "/images/coen-van-de-broek-OFyh9TpMyM8-unsplash.jpg", alt: "Mountain Biking" },
            { src: "/images/knut-robinson-DTHtjyRuozs-unsplashold.jpg", alt: "Surfing Wave" },
            { src: "/images/alexandre-ricart-tbjIlLVmamQ-unsplash.jpg", alt: "CrossFit Training" },
            { src: "/images/florian-kurrasch-HyivyCRdz14-unsplash.jpg", alt: "Parkour" },
            { src: "/images/patrick-malleret-L5o5ainVP_I-unsplash.jpg", alt: "Yoga on Paddleboard" },
            { src: "/images/quan-you-zhang-nWnRRmbyK_0-unsplash.jpg", alt: "Running Race" },
            { src: "/images/tower-paddle-boards-sozkrZTVRjA-unsplash.jpg", alt: "Paddleboarding at Moon" },
            { src: "/images/knut-robinson-DTHtjyRuozs-unsplash.png", alt: "Surfing" },
          ].map((image, index) => (
            <Link
              key={image.src}
              href="/search"
              className="group relative aspect-square overflow-hidden rounded-2xl shadow-xl transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl hover:shadow-blue-500/20"
              style={{
                animation: `fadeInUp 0.6s ease-out ${index * 50}ms forwards`,
                opacity: 0,
              }}
            >
              {/* Image Container */}
              <div className="relative h-full w-full">
                <Image
                  src={image.src}
                  alt={image.alt}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-110"
                  sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                />
                
                {/* Shine Effect */}
                <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 transition-all duration-1000 group-hover:translate-x-full group-hover:opacity-100" />
              </div>
            </Link>
          ))}
        </div>
      </div>

      <style jsx global>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>

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

            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                href="/signup"
                className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 px-8 py-4 text-lg font-bold text-white shadow-lg transition-all hover:scale-105 hover:shadow-blue-500/50"
              >
                🚀 Jetzt als Fotograf starten
              </Link>
              <Link
                href="/signin"
                className="inline-flex items-center gap-2 rounded-lg border-2 border-zinc-600 bg-zinc-700/50 px-8 py-4 text-lg font-semibold text-white backdrop-blur-sm transition-all hover:scale-105 hover:bg-zinc-700"
              >
                🔐 Als Fotograf anmelden
              </Link>
            </div>
            
            <p className="mt-4 text-sm text-zinc-400">
              Kostenlos registrieren • Keine Setup-Gebühren • Nur 15% Provision
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

