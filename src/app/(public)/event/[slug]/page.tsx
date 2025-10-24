"use client";

import { useState, useEffect, use } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { FaceSearch } from "@/components/search/face-search";
import { Modal } from "@/components/ui/modal";
import { Lightbox } from "@/components/ui/lightbox";

interface Event {
  id: string;
  title: string;
  description: string;
  location: string;
  event_date: string;
  event_type: string;
  price_per_photo: number;
  package_price: number | null;
  package_photo_count: number | null;
  cover_image_url: string | null;
}

interface Photo {
  id: string;
  watermark_url: string;
  bib_number: string | null;
  price: number;
}

export default function PublicEventPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const [event, setEvent] = useState<Event | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [filteredPhotos, setFilteredPhotos] = useState<Photo[]>([]);
  const [bibNumberFilter, setBibNumberFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedPhotos, setSelectedPhotos] = useState<Set<string>>(new Set());
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [guestEmail, setGuestEmail] = useState("");
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxImage, setLightboxImage] = useState("");
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: "info" | "success" | "error" | "warning";
  }>({
    isOpen: false,
    title: "",
    message: "",
    type: "info",
  });
  const supabase = createClient();

  useEffect(() => {
    const loadEvent = async () => {
      // Check if user is authenticated
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setIsAuthenticated(!!user);

      // Get event
      const { data: eventData, error: eventError } = await supabase
        .from("events")
        .select("*")
        .eq("slug", slug)
        .eq("is_published", true)
        .single();

      if (eventError || !eventData) {
        setLoading(false);
        return;
      }

      setEvent(eventData);

      // Get photos
      const { data: photosData } = await supabase
        .from("photos")
        .select("id, watermark_url, bib_number, price")
        .eq("event_id", eventData.id)
        .order("created_at", { ascending: false });

      if (photosData) {
        setPhotos(photosData);
        setFilteredPhotos(photosData);
      }

      setLoading(false);
    };

    loadEvent();
  }, [slug]);

  useEffect(() => {
    if (bibNumberFilter) {
      setFilteredPhotos(
        photos.filter((photo) =>
          photo.bib_number?.includes(bibNumberFilter)
        )
      );
    } else {
      setFilteredPhotos(photos);
    }
  }, [bibNumberFilter, photos]);

  const togglePhotoSelection = (photoId: string) => {
    setSelectedPhotos((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(photoId)) {
        newSet.delete(photoId);
      } else {
        newSet.add(photoId);
      }
      return newSet;
    });
  };

  const calculateTotal = () => {
    if (
      event?.package_price &&
      event?.package_photo_count &&
      selectedPhotos.size >= event.package_photo_count
    ) {
      const packageCount = Math.floor(
        selectedPhotos.size / event.package_photo_count
      );
      const remainingPhotos =
        selectedPhotos.size % event.package_photo_count;
      return (
        packageCount * event.package_price +
        remainingPhotos * event.price_per_photo
      );
    }
    return selectedPhotos.size * (event?.price_per_photo || 0);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-900">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-zinc-300 border-t-zinc-900 dark:border-zinc-700 dark:border-t-zinc-50"></div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-900">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
            Event nicht gefunden
          </h1>
          <p className="mt-2 text-zinc-600 dark:text-zinc-400">
            Dieses Event existiert nicht oder wurde noch nicht veröffentlicht.
          </p>
          <Link
            href="/"
            className="mt-4 inline-block rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            Zur Startseite
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900">
      {/* Event Header */}
      <div className="bg-white dark:bg-zinc-800">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="grid gap-8 md:grid-cols-2">
            <div>
              <h1 className="text-4xl font-bold text-zinc-900 dark:text-zinc-50">
                {event.title}
              </h1>
              <div className="mt-4 space-y-2 text-zinc-600 dark:text-zinc-400">
                <div className="flex items-center">
                  <svg
                    className="mr-2 h-5 w-5"
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
                    className="mr-2 h-5 w-5"
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
                  {new Date(event.event_date).toLocaleDateString("de-DE", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </div>
              </div>
              {event.description && (
                <p className="mt-4 text-zinc-700 dark:text-zinc-300">
                  {event.description}
                </p>
              )}
            </div>

            <div className="rounded-lg bg-zinc-50 p-6 dark:bg-zinc-700">
              <h2 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                Preise
              </h2>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-zinc-600 dark:text-zinc-400">
                    Einzelnes Foto
                  </span>
                  <span className="font-semibold text-zinc-900 dark:text-zinc-50">
                    {event.price_per_photo.toFixed(2)} €
                  </span>
                </div>
                {event.package_price && event.package_photo_count && (
                  <div className="flex justify-between border-t border-zinc-200 pt-2 dark:border-zinc-600">
                    <span className="text-zinc-600 dark:text-zinc-400">
                      {event.package_photo_count} Fotos Paket
                    </span>
                    <span className="font-semibold text-zinc-900 dark:text-zinc-50">
                      {event.package_price.toFixed(2)} €
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Photo Gallery */}
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Search Bar */}
        <div className="mb-6 space-y-4">
          {/* Startnummer-Suche */}
          <div className="rounded-lg bg-white p-4 shadow dark:bg-zinc-800">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex-1">
                <label
                  htmlFor="bibNumber"
                  className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
                >
                  Nach Startnummer filtern
                </label>
                <input
                  id="bibNumber"
                  type="text"
                  value={bibNumberFilter}
                  onChange={(e) => setBibNumberFilter(e.target.value)}
                  placeholder="z.B. 243"
                  className="w-full rounded-md border border-zinc-300 bg-white px-4 py-2 text-zinc-900 placeholder-zinc-400 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-100 dark:placeholder-zinc-500"
                />
              </div>
              <div className="text-sm text-zinc-600 dark:text-zinc-400">
                {filteredPhotos.length} von {photos.length} Fotos
              </div>
            </div>
          </div>

          {/* Face Search */}
          <FaceSearch
            eventId={event.id}
            onResults={(photoIds) => {
              // Filter photos to show only matched ones
              const matchedPhotos = photos.filter((p) =>
                photoIds.includes(p.id)
              );
              setFilteredPhotos(matchedPhotos);
              setBibNumberFilter(""); // Clear bib filter
            }}
          />
        </div>

        {/* Selected Photos Bar */}
        {selectedPhotos.size > 0 && (
          <div className="sticky top-4 z-10 mb-6 rounded-lg bg-zinc-900 p-6 shadow-lg dark:bg-zinc-50">
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="text-white dark:text-zinc-900">
                  <span className="font-semibold">{selectedPhotos.size}</span>{" "}
                  Fotos ausgewählt
                </div>
                <span className="text-2xl font-bold text-white dark:text-zinc-900">
                  {calculateTotal().toFixed(2)} €
                </span>
              </div>
              
              {/* Email input for guests - always visible */}
              {!isAuthenticated && (
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-white dark:text-zinc-900">
                    Deine E-Mail-Adresse für den Download-Link:
                  </label>
                  <input
                    type="email"
                    value={guestEmail}
                    onChange={(e) => setGuestEmail(e.target.value)}
                    placeholder="beispiel@email.de"
                    className="rounded-md border border-zinc-300 px-4 py-3 text-sm text-zinc-900 placeholder-zinc-400 focus:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-500"
                    required
                  />
                </div>
              )}

              <button
                onClick={async () => {
                  // Validate guest email
                  if (!isAuthenticated && !guestEmail) {
                    setModalState({
                      isOpen: true,
                      title: "E-Mail erforderlich",
                      message: "Bitte gib deine E-Mail-Adresse ein, um die Fotos nach dem Kauf zu erhalten.",
                      type: "warning",
                    });
                    return;
                  }

                  // Validate email format
                  if (!isAuthenticated && guestEmail) {
                    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                    if (!emailRegex.test(guestEmail)) {
                      setModalState({
                        isOpen: true,
                        title: "Ungültige E-Mail",
                        message: "Bitte gib eine gültige E-Mail-Adresse ein.",
                        type: "error",
                      });
                      return;
                    }
                  }

                  try {
                    const response = await fetch("/api/stripe/checkout", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        photoIds: Array.from(selectedPhotos),
                        eventId: event.id,
                        guestEmail: !isAuthenticated ? guestEmail : undefined,
                      }),
                    });

                    const data = await response.json();

                    if (data.error) {
                      setModalState({
                        isOpen: true,
                        title: "Fehler",
                        message: data.error,
                        type: "error",
                      });
                      return;
                    }

                    // Redirect to Stripe Checkout
                    if (data.url) {
                      window.location.href = data.url;
                    }
                  } catch (error) {
                    console.error("Checkout error:", error);
                    setModalState({
                      isOpen: true,
                      title: "Fehler",
                      message: "Ein Fehler ist beim Checkout aufgetreten. Bitte versuche es erneut.",
                      type: "error",
                    });
                  }
                }}
                className="w-full rounded-md bg-white px-6 py-3 text-base font-medium text-zinc-900 transition-colors hover:bg-zinc-100 dark:bg-zinc-900 dark:text-zinc-50 dark:hover:bg-zinc-800"
              >
                Zur Kasse
              </button>
            </div>
          </div>
        )}

        {/* Photos Grid */}
        {filteredPhotos.length === 0 ? (
          <div className="rounded-lg bg-white p-12 text-center shadow dark:bg-zinc-800">
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
            <h3 className="mt-4 text-lg font-medium text-zinc-900 dark:text-zinc-50">
              Keine Fotos gefunden
            </h3>
            <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
              {bibNumberFilter
                ? "Versuche eine andere Startnummer"
                : "Es wurden noch keine Fotos für dieses Event hochgeladen"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {filteredPhotos.map((photo) => (
              <div
                key={photo.id}
                className={`group relative overflow-hidden rounded-lg border-2 transition-all ${
                  selectedPhotos.has(photo.id)
                    ? "border-zinc-900 dark:border-zinc-50"
                    : "border-transparent"
                }`}
              >
                <div 
                  className="aspect-square w-full cursor-zoom-in overflow-hidden bg-zinc-100 dark:bg-zinc-700"
                  onClick={() => {
                    setLightboxImage(photo.watermark_url);
                    setLightboxOpen(true);
                  }}
                >
                  <img
                    src={photo.watermark_url}
                    alt=""
                    className="h-full w-full object-cover transition-transform group-hover:scale-105"
                  />
                  
                  {/* Zoom icon hint */}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition-all group-hover:bg-black/20 group-hover:opacity-100">
                    <svg
                      className="h-8 w-8 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7"
                      />
                    </svg>
                  </div>
                </div>

                {photo.bib_number && (
                  <div className="absolute left-2 top-2 rounded bg-black/70 px-2 py-1 text-xs font-medium text-white">
                    #{photo.bib_number}
                  </div>
                )}

                {/* Selection checkbox */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    togglePhotoSelection(photo.id);
                  }}
                  className="absolute right-2 top-2 rounded-full bg-white/90 p-2 transition-colors hover:bg-white dark:bg-zinc-800/90 dark:hover:bg-zinc-800"
                >
                  {selectedPhotos.has(photo.id) ? (
                    <svg
                      className="h-5 w-5 text-zinc-900 dark:text-zinc-50"
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
                  ) : (
                    <svg
                      className="h-5 w-5 text-zinc-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                      />
                    </svg>
                  )}
                </button>

                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                  <span className="text-xs font-medium text-white">
                    {photo.price.toFixed(2)} €
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      <Modal
        isOpen={modalState.isOpen}
        onClose={() => setModalState({ ...modalState, isOpen: false })}
        title={modalState.title}
        message={modalState.message}
        type={modalState.type}
      />

      {/* Lightbox */}
      <Lightbox
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        imageUrl={lightboxImage}
        alt="Foto"
      />
    </div>
  );
}


