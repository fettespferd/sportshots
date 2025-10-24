"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState, useEffect, use } from "react";

export default function EventDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [event, setEvent] = useState<any>(null);
  const [photos, setPhotos] = useState<any[]>([]);
  const [purchases, setPurchases] = useState<any[]>([]);

  useEffect(() => {
    const loadData = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/signin");
        return;
      }

      // Get event details
      const { data: eventData, error } = await supabase
        .from("events")
        .select("*")
        .eq("id", id)
        .eq("photographer_id", user.id)
        .single();

      if (error || !eventData) {
        router.push("/photographer/events");
        return;
      }

      // Get photos for this event
      const { data: photosData } = await supabase
        .from("photos")
        .select("*")
        .eq("event_id", id)
        .order("created_at", { ascending: false });

      // Get purchases for this event
      const { data: purchasesData } = await supabase
        .from("purchases")
        .select("*")
        .eq("event_id", id)
        .eq("status", "completed");

      setEvent(eventData);
      setPhotos(photosData || []);
      setPurchases(purchasesData || []);
      setLoading(false);
    };

    loadData();
  }, [id]);

  const handlePublishToggle = async () => {
    try {
      const { error } = await supabase
        .from("events")
        .update({ is_published: !event.is_published })
        .eq("id", id);

      if (error) {
        console.error("Publish error:", error);
        alert("Fehler beim Veröffentlichen: " + error.message);
        return;
      }

      // Update local state
      setEvent({ ...event, is_published: !event.is_published });
      
      // Show success message
      alert(event.is_published ? "Event verborgen" : "Event veröffentlicht!");
    } catch (error) {
      console.error("Publish error:", error);
      alert("Fehler beim Veröffentlichen");
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-900">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-zinc-300 border-t-zinc-900 dark:border-zinc-700 dark:border-t-zinc-50"></div>
      </div>
    );
  }

  if (!event) {
    return null;
  }

  const totalRevenue =
    purchases?.reduce((sum, p) => sum + Number(p.photographer_amount), 0) || 0;
  const photoCount = photos?.length || 0;
  const purchaseCount = purchases?.length || 0;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="mb-4 flex items-center text-sm text-zinc-600 dark:text-zinc-400">
            <Link
              href="/photographer/events"
              className="hover:text-zinc-900 dark:hover:text-zinc-50"
            >
              Meine Events
            </Link>
            <svg
              className="mx-2 h-4 w-4"
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
            <span className="text-zinc-900 dark:text-zinc-50">
              {event.title}
            </span>
          </div>

          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
                {event.title}
              </h1>
              <div className="mt-2 flex items-center space-x-4 text-sm text-zinc-600 dark:text-zinc-400">
                <span>{event.location}</span>
                <span>•</span>
                <span>
                  {new Date(event.event_date).toLocaleDateString("de-DE")}
                </span>
                <span>•</span>
                <span
                  className={`rounded-full px-2 py-1 text-xs font-medium ${
                    event.is_published
                      ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
                      : "bg-zinc-100 text-zinc-800 dark:bg-zinc-700 dark:text-zinc-300"
                  }`}
                >
                  {event.is_published ? "Veröffentlicht" : "Entwurf"}
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              {photoCount > 0 && (
                <button
                  onClick={handlePublishToggle}
                  className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-700"
                >
                  {event.is_published ? "Verbergen" : "Veröffentlichen"}
                </button>
              )}
              <Link
                href={`/photographer/events/${id}/upload`}
                className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
              >
                Fotos hochladen
              </Link>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="mb-8 grid gap-6 md:grid-cols-3">
          <div className="rounded-lg bg-white p-6 shadow dark:bg-zinc-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                  Fotos
                </p>
                <p className="mt-2 text-3xl font-bold text-zinc-900 dark:text-zinc-50">
                  {photoCount}
                </p>
              </div>
              <div className="rounded-full bg-blue-100 p-3 dark:bg-blue-900/20">
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
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
            </div>
          </div>

          <div className="rounded-lg bg-white p-6 shadow dark:bg-zinc-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                  Verkäufe
                </p>
                <p className="mt-2 text-3xl font-bold text-zinc-900 dark:text-zinc-50">
                  {purchaseCount}
                </p>
              </div>
              <div className="rounded-full bg-green-100 p-3 dark:bg-green-900/20">
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
                    d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              </div>
            </div>
          </div>

          <div className="rounded-lg bg-white p-6 shadow dark:bg-zinc-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                  Umsatz
                </p>
                <p className="mt-2 text-3xl font-bold text-zinc-900 dark:text-zinc-50">
                  {totalRevenue.toFixed(2)} €
                </p>
              </div>
              <div className="rounded-full bg-purple-100 p-3 dark:bg-purple-900/20">
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
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Event Details */}
        <div className="mb-8 rounded-lg bg-white p-6 shadow dark:bg-zinc-800">
          <h2 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            Event-Details
          </h2>
          <dl className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <dt className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                Event-Typ
              </dt>
              <dd className="mt-1 text-sm text-zinc-900 dark:text-zinc-50">
                {event.event_type}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                Preis pro Foto
              </dt>
              <dd className="mt-1 text-sm text-zinc-900 dark:text-zinc-50">
                {event.price_per_photo.toFixed(2)} €
              </dd>
            </div>
            {event.package_price && (
              <>
                <div>
                  <dt className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                    Paketpreis
                  </dt>
                  <dd className="mt-1 text-sm text-zinc-900 dark:text-zinc-50">
                    {event.package_price.toFixed(2)} €
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                    Fotos im Paket
                  </dt>
                  <dd className="mt-1 text-sm text-zinc-900 dark:text-zinc-50">
                    {event.package_photo_count}
                  </dd>
                </div>
              </>
            )}
            {event.description && (
              <div className="md:col-span-2">
                <dt className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                  Beschreibung
                </dt>
                <dd className="mt-1 text-sm text-zinc-900 dark:text-zinc-50">
                  {event.description}
                </dd>
              </div>
            )}
            <div className="md:col-span-2">
              <dt className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                Event-URL
              </dt>
              <dd className="mt-1 text-sm text-zinc-900 dark:text-zinc-50">
                <code className="rounded bg-zinc-100 px-2 py-1 dark:bg-zinc-700">
                  {process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}
                  /event/{event.slug}
                </code>
              </dd>
            </div>
          </dl>
        </div>

        {/* Photos Grid */}
        <div className="rounded-lg bg-white p-6 shadow dark:bg-zinc-800">
          <h2 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            Fotos ({photoCount})
          </h2>

          {!photos || photos.length === 0 ? (
            <div className="rounded-lg border-2 border-dashed border-zinc-300 bg-zinc-50 p-12 text-center dark:border-zinc-700 dark:bg-zinc-900">
              <svg
                className="mx-auto h-12 w-12 text-zinc-400"
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
              <h3 className="mt-4 text-sm font-medium text-zinc-900 dark:text-zinc-50">
                Keine Fotos hochgeladen
              </h3>
              <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
                Lade deine ersten Fotos für dieses Event hoch.
              </p>
              <Link
                href={`/photographer/events/${id}/upload`}
                className="mt-4 inline-block rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
              >
                Fotos hochladen
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-6">
              {photos.map((photo) => (
                <div
                  key={photo.id}
                  className="group relative aspect-square overflow-hidden rounded-lg bg-zinc-100 dark:bg-zinc-700"
                >
                  <img
                    src={photo.watermark_url}
                    alt=""
                    className="h-full w-full object-cover transition-transform group-hover:scale-105"
                  />
                  {photo.bib_number && (
                    <div className="absolute bottom-2 right-2 rounded bg-black/70 px-2 py-1 text-xs font-medium text-white">
                      #{photo.bib_number}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


