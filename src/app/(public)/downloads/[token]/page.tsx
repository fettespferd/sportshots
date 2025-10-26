"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";

interface Photo {
  id: string;
  original_url: string;
  event_title: string;
  rotation?: number;
}

interface Purchase {
  id: string;
  created_at: string;
  total_amount: number;
  customer_email: string;
  photos: Photo[];
}

export default function DownloadsPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = use(params);
  const [loading, setLoading] = useState(true);
  const [purchase, setPurchase] = useState<Purchase | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadPurchase = async () => {
      try {
        const response = await fetch(`/api/downloads/${token}`);
        const data = await response.json();

        if (!response.ok) {
          setError(data.error || "Bestellung nicht gefunden");
          setLoading(false);
          return;
        }

        setPurchase(data.purchase);
        setLoading(false);
      } catch (err) {
        setError("Fehler beim Laden der Bestellung");
        setLoading(false);
      }
    };

    loadPurchase();
  }, [token]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-900">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-zinc-300 border-t-zinc-900 dark:border-zinc-700 dark:border-t-zinc-50"></div>
      </div>
    );
  }

  if (error || !purchase) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 dark:bg-zinc-900">
        <div className="w-full max-w-md space-y-8">
          <div className="rounded-lg bg-white p-8 shadow dark:bg-zinc-800">
            <div className="mb-6 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
                <svg
                  className="h-8 w-8 text-red-600 dark:text-red-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
                Bestellung nicht gefunden
              </h2>
            </div>

            <p className="text-center text-sm text-zinc-600 dark:text-zinc-400">
              {error}
            </p>

            <div className="mt-8">
              <Link
                href="/"
                className="block w-full rounded-md bg-zinc-900 px-4 py-3 text-center text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
              >
                Zur Startseite
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="mb-6 flex items-center justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20">
              <svg
                className="h-8 w-8 text-green-600 dark:text-green-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
          </div>
          <h1 className="text-center text-3xl font-bold text-zinc-900 dark:text-zinc-50">
            Deine Fotos
          </h1>
          <p className="mt-2 text-center text-zinc-600 dark:text-zinc-400">
            Du kannst deine gekauften Fotos jetzt in hoher Auflösung
            herunterladen
          </p>
        </div>

        {/* Purchase Info */}
        <div className="mb-8 rounded-lg bg-white p-6 shadow dark:bg-zinc-800">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Bestellung vom
              </p>
              <p className="font-semibold text-zinc-900 dark:text-zinc-50">
                {new Date(purchase.created_at).toLocaleDateString("de-DE")}
              </p>
            </div>
            <div>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Anzahl Fotos
              </p>
              <p className="font-semibold text-zinc-900 dark:text-zinc-50">
                {purchase.photos.length}
              </p>
            </div>
          </div>
        </div>

        {/* Photos Grid */}
        <div className="rounded-lg bg-white p-6 shadow dark:bg-zinc-800">
          <h2 className="mb-6 text-xl font-semibold text-zinc-900 dark:text-zinc-50">
            Deine Downloads
          </h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {purchase.photos.map((photo, index) => (
              <div
                key={photo.id}
                className="overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-700"
              >
                <div className="aspect-video w-full overflow-hidden bg-zinc-100 dark:bg-zinc-700">
                  <img
                    src={photo.original_url}
                    alt={`Foto ${index + 1}`}
                    className="h-full w-full object-cover"
                    style={{
                      transform: `rotate(${photo.rotation || 0}deg)`,
                    }}
                  />
                </div>
                <div className="p-4">
                  <p className="mb-3 text-sm font-medium text-zinc-900 dark:text-zinc-50">
                    Foto {index + 1} - {photo.event_title}
                  </p>
                  <a
                    href={photo.original_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full rounded-md bg-zinc-900 px-4 py-2 text-center text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
                  >
                    📥 Herunterladen
                  </a>
                  <p className="mt-2 text-center text-xs text-zinc-500 dark:text-zinc-400">
                    Tippe lang drücken → In Fotos speichern
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Info Box */}
        <div className="mt-8 rounded-lg bg-blue-50 p-6 dark:bg-blue-900/20">
          <div className="flex items-start">
            <svg
              className="mr-3 h-6 w-6 flex-shrink-0 text-blue-600 dark:text-blue-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div>
              <h3 className="font-semibold text-blue-900 dark:text-blue-100">
                Wichtig
              </h3>
              <p className="mt-1 text-sm text-blue-800 dark:text-blue-200">
                Speichere diese Seite als Lesezeichen! Du kannst jederzeit über
                den Link in deiner Bestätigungs-E-Mail hierher zurückkehren, um
                deine Fotos erneut herunterzuladen.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

