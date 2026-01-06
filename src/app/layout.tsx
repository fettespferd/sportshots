import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/layout/header";
import { LanguageProvider } from "@/lib/i18n/LanguageContext";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { ToastContainer } from "@/components/ui/toast";
import dynamic from "next/dynamic";

// Lazy load footer as it's below the fold
const Footer = dynamic(() => import("@/components/layout/footer").then(mod => ({ default: mod.Footer })), {
  ssr: true,
});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
  preload: true,
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
  preload: false,
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0a0a' },
  ],
};

export const metadata: Metadata = {
  title: "SportShots - Deine Sportfotos finden & kaufen",
  description:
    "Finde und kaufe deine Sportfotos über Startnummer, Event-Suche oder Selfie-Abgleich. Fotografen können Events erstellen und Fotos verkaufen.",
  keywords: ["Sportfotos", "Lauffotos", "Event-Fotografie", "Gesichtserkennung", "Startnummern-Suche"],
  authors: [{ name: "SportShots" }],
  creator: "SportShots",
  publisher: "SportShots",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: [
      { url: '/icon.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  openGraph: {
    title: "SportShots - Deine Sportfotos finden & kaufen",
    description: "Finde und kaufe deine Sportfotos über Startnummer, Event-Suche oder Selfie-Abgleich.",
    url: "https://sportshots.brainmotion.ai",
    siteName: "SportShots",
    images: [
      {
        url: "/og_image.png", // 1200x630 px
        width: 1200,
        height: 630,
        alt: "SportShots - Deine Sportfotos finden & kaufen",
      },
    ],
    locale: "de_DE",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "SportShots - Deine Sportfotos finden & kaufen",
    description: "Finde und kaufe deine Sportfotos über Startnummer, Event-Suche oder Selfie-Abgleich.",
    images: ["/og_image.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        {/* Skip Navigation für Accessibility */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:rounded-md focus:bg-zinc-900 focus:px-4 focus:py-2 focus:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Zum Hauptinhalt springen
        </a>
        <ErrorBoundary>
          <LanguageProvider>
            <Header />
            <main id="main-content" className="min-h-screen">{children}</main>
            <Footer />
            <ToastContainer />
          </LanguageProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
