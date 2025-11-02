"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import Image from "next/image";

interface Event {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  location: string;
  event_date: string;
  event_type: string;
  cover_image_url: string | null;
  photographer: {
    full_name: string | null;
    username: string | null;
  };
}

interface DynamicQRCode {
  id: string;
  code: string;
  event_id: string | null;
}

export default function QRCodeLandingPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = use(params);
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [qrCode, setQrCode] = useState<DynamicQRCode | null>(null);
  const [event, setEvent] = useState<Event | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        // Load QR code
        const { data: qrData, error: qrError } = await supabase
          .from("dynamic_qr_codes")
          .select("*")
          .eq("code", code)
          .single();

        if (qrError || !qrData) {
          setError("QR-Code nicht gefunden");
          setLoading(false);
          return;
        }

        setQrCode(qrData);

        // If event is assigned, load event details
        if (qrData.event_id) {
          const { data: eventData, error: eventError } = await supabase
            .from("events")
            .select(
              `
              id,
              title,
              slug,
              description,
              location,
              event_date,
              event_type,
              cover_image_url,
              photographer:photographer_id (
                full_name,
                username
              )
            `
            )
            .eq("id", qrData.event_id)
            .eq("is_published", true)
            .single();

          if (eventError || !eventData) {
            setError("Event nicht gefunden oder nicht veröffentlicht");
            setLoading(false);
            return;
          }

          setEvent(eventData as Event);
        }
      } catch (err: any) {
        console.error("Error loading QR code:", err);
        setError("Fehler beim Laden der Daten");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [code, supabase]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-900">
        <div className="text-center">
          <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
          <p className="text-zinc-600 dark:text-zinc-400">Laden...</p>
        </div>
      </div>
    );
  }

  if (error || !qrCode) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-900">
        <div className="mx-auto max-w-md rounded-lg border border-zinc-200 bg-white p-8 text-center dark:border-zinc-700 dark:bg-zinc-800">
          <div className="mb-4 text-6xl">📷</div>
          <h1 className="mb-2 text-2xl font-bold text-zinc-900 dark:text-zinc-50">
            QR-Code nicht gefunden
          </h1>
          <p className="mb-6 text-zinc-600 dark:text-zinc-400">
            {error || "Dieser QR-Code ist nicht gültig."}
          </p>
          <Link
            href="/search"
            className="inline-block rounded-md bg-blue-600 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-blue-700"
          >
            Events durchsuchen
          </Link>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-900">
        <div className="mx-auto max-w-md rounded-lg border border-zinc-200 bg-white p-8 text-center dark:border-zinc-700 dark:bg-zinc-800">
          <div className="mb-4 text-6xl">⏳</div>
          <h1 className="mb-2 text-2xl font-bold text-zinc-900 dark:text-zinc-50">
            Noch kein Event zugewiesen
          </h1>
          <p className="mb-6 text-zinc-600 dark:text-zinc-400">
            Dieser QR-Code ist noch keinem Event zugewiesen. Bitte komme später wieder.
          </p>
          <Link
            href="/search"
            className="inline-block rounded-md bg-blue-600 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-blue-700"
          >
            Events durchsuchen
          </Link>
        </div>
      </div>
    );
  }

  const eventDate = new Date(event.event_date);
  const eventUrl = `/event/${event.slug}`;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="rounded-lg border border-zinc-200 bg-white shadow-lg dark:border-zinc-700 dark:bg-zinc-800">
          {/* Cover Image */}
          {event.cover_image_url && (
            <div className="relative h-64 w-full overflow-hidden rounded-t-lg sm:h-80">
              <Image
                src={event.cover_image_url}
                alt={event.title}
                fill
                className="object-cover"
                priority
              />
            </div>
          )}

          {/* Content */}
          <div className="p-6 sm:p-8">
            {/* Header */}
            <div className="mb-6">
              <h1 className="mb-2 text-3xl font-bold text-zinc-900 dark:text-zinc-50">
                {event.title}
              </h1>
              {event.description && (
                <p className="mb-4 text-zinc-600 dark:text-zinc-400">
                  {event.description}
                </p>
              )}
            </div>

            {/* Event Details */}
            <div className="mb-6 grid gap-4 sm:grid-cols-2">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 text-2xl">📅</div>
                <div>
                  <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    Datum
                  </p>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    {eventDate.toLocaleDateString("de-DE", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 text-2xl">📍</div>
                <div>
                  <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    Ort
                  </p>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    {event.location}
                  </p>
                </div>
              </div>

              {event.photographer && (
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 text-2xl">📸</div>
                  <div>
                    <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                      Fotograf
                    </p>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">
                      {event.photographer.full_name || "Unbekannt"}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* CTA Button */}
            <div className="mt-8">
              <Link
                href={eventUrl}
                className="flex w-full items-center justify-center gap-2 rounded-md bg-blue-600 px-6 py-4 text-base font-medium text-white transition-colors hover:bg-blue-700 sm:text-lg"
              >
                <span>📷</span>
                <span>Zu den Fotos</span>
                <svg
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </Link>
            </div>

            {/* Info Box */}
            <div className="mt-6 rounded-lg bg-blue-50 p-4 dark:bg-blue-900/20">
              <p className="text-sm text-blue-800 dark:text-blue-300">
                <strong>💡 Tipp:</strong> Du kannst deine Fotos mit deiner Startnummer finden oder
                ein Selfie hochladen, um automatisch erkannt zu werden.
              </p>
            </div>
          </div>
        </div>

        {/* Footer Link */}
        <div className="mt-6 text-center">
          <Link
            href="/search"
            className="text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
          >
            ← Zurück zur Event-Suche
          </Link>
        </div>
      </div>
    </div>
  );
}

