"use client";

import { useState, useEffect, use } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { FaceSearch } from "@/components/search/face-search";
import { Modal } from "@/components/ui/modal";
import { Lightbox } from "@/components/ui/lightbox";
import { ShareButton } from "@/components/ui/share-button";

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
  taken_at: string | null;
  camera_make: string | null;
  camera_model: string | null;
  rotation?: number;
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
  const [dateFilter, setDateFilter] = useState("");
  const [timeRangeStart, setTimeRangeStart] = useState("");
  const [timeRangeEnd, setTimeRangeEnd] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedPhotos, setSelectedPhotos] = useState<Set<string>>(new Set());
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [guestEmail, setGuestEmail] = useState("");
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxImage, setLightboxImage] = useState("");
  const [lightboxPhoto, setLightboxPhoto] = useState<Photo | null>(null);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
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

      // Get photos with metadata
      const { data: photosData } = await supabase
        .from("photos")
        .select("id, watermark_url, bib_number, price, taken_at, camera_make, camera_model")
        .eq("event_id", eventData.id)
        .order("taken_at", { ascending: false, nullsFirst: false });

      if (photosData) {
        setPhotos(photosData);
        setFilteredPhotos(photosData);
      }

      setLoading(false);
    };

    loadEvent();
  }, [slug]);

  useEffect(() => {
    let filtered = photos;

    // Filter by bib number
    if (bibNumberFilter) {
      filtered = filtered.filter((photo) =>
        photo.bib_number?.includes(bibNumberFilter)
      );
    }

    // Filter by date
    if (dateFilter) {
      filtered = filtered.filter((photo) => {
        if (!photo.taken_at) return false;
        const photoDate = new Date(photo.taken_at).toISOString().split('T')[0];
        return photoDate === dateFilter;
      });
    }

    // Filter by time range
    if (timeRangeStart || timeRangeEnd) {
      filtered = filtered.filter((photo) => {
        if (!photo.taken_at) return false;
        const photoTime = new Date(photo.taken_at).toTimeString().slice(0, 5);
        
        if (timeRangeStart && photoTime < timeRangeStart) return false;
        if (timeRangeEnd && photoTime > timeRangeEnd) return false;
        
        return true;
      });
    }

    setFilteredPhotos(filtered);
  }, [bibNumberFilter, dateFilter, timeRangeStart, timeRangeEnd, photos]);

  const handleFaceSearchResults = (photoIds: string[]) => {
    if (photoIds.length > 0) {
      setFilteredPhotos(photos.filter((photo) => photoIds.includes(photo.id)));
    }
  };

  const resetFilters = () => {
    setBibNumberFilter("");
    setDateFilter("");
    setTimeRangeStart("");
    setTimeRangeEnd("");
    setFilteredPhotos(photos);
    setSelectedPhotos(new Set());
  };

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
      <div className="bg-white shadow-sm dark:bg-zinc-800">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
          <div className="grid gap-4 sm:gap-6 md:grid-cols-2 md:gap-8">
            <div>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 sm:text-3xl md:text-4xl">
                  {event.title}
                </h1>
                <ShareButton
                  url={typeof window !== "undefined" ? window.location.href : ""}
                  title={`${event.title} - Fotos ansehen`}
                  text={`Schau dir die Fotos von ${event.title} an!`}
                  className="flex-shrink-0 shadow-md"
                />
              </div>
              <div className="mt-3 space-y-2 text-sm text-zinc-600 dark:text-zinc-400 sm:mt-4">
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

            <div className="overflow-hidden rounded-lg bg-gradient-to-br from-zinc-50 to-zinc-100 p-6 shadow-sm dark:from-zinc-800 dark:to-zinc-700">
              <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                <span className="text-xl">💰</span>
                Preise
              </h2>
              <div className="space-y-3">
                {/* Single Photo Price */}
                <div className="rounded-lg bg-white p-4 shadow-sm dark:bg-zinc-900">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
                        <span className="text-lg">📸</span>
                      </div>
                      <span className="font-medium text-zinc-900 dark:text-zinc-50">
                        Einzelnes Foto
                      </span>
                    </div>
                    <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {event.price_per_photo.toFixed(2)} €
                    </span>
                  </div>
                </div>
                
                {/* Package Price */}
                {event.package_price && event.package_photo_count && (
                  <div className="relative overflow-hidden rounded-lg bg-gradient-to-r from-green-500 to-emerald-600 p-4 shadow-md">
                    <div className="absolute right-0 top-0 -mr-4 -mt-4 h-16 w-16 rounded-full bg-white/10" />
                    <div className="absolute right-4 top-0 -mr-2 -mt-2 h-12 w-12 rounded-full bg-white/10" />
                    <div className="relative flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
                          <span className="text-lg">📦</span>
                        </div>
                        <div className="text-white">
                          <div className="text-xs font-medium uppercase tracking-wide opacity-90">
                            Sparpaket
                          </div>
                          <div className="font-semibold">
                            {event.package_photo_count} Fotos
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-white">
                          {event.package_price.toFixed(2)} €
                        </div>
                        <div className="text-xs text-white/80">
                          {(event.package_price / event.package_photo_count).toFixed(2)} € pro Foto
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Photo Gallery */}
      <div className={`mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8 ${selectedPhotos.size > 0 ? 'pb-32 sm:pb-8' : ''}`}>
        {/* Search Bar */}
        <div className="mb-6 space-y-4">
          {/* Filter Section */}
          <div className="rounded-lg bg-white p-4 shadow dark:bg-zinc-800">
            <div className="space-y-4">
              {/* Startnummer & Datum nebeneinander */}
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
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
                
                <div className="flex-1">
                  <label
                    htmlFor="dateFilter"
                    className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
                  >
                    📅 Nach Datum
                  </label>
                  <input
                    id="dateFilter"
                    type="date"
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                    className="w-full rounded-md border border-zinc-300 bg-white px-4 py-2 text-zinc-900 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-100"
                  />
                </div>
                
                <div className="text-sm text-zinc-600 dark:text-zinc-400 sm:min-w-[140px] sm:text-right">
                  {filteredPhotos.length} von {photos.length} Fotos
                </div>
              </div>

              {/* Ausgeblendete Zeit-Filter */}
              <div className="hidden">
                {/* Zeit-Filter vorübergehend ausgeblendet
                <div>
                  <label
                    htmlFor="timeRangeStart"
                    className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
                  >
                    ⏰ Von Uhrzeit
                  </label>
                  <input
                    id="timeRangeStart"
                    type="time"
                    value={timeRangeStart}
                    onChange={(e) => setTimeRangeStart(e.target.value)}
                    className="w-full rounded-md border border-zinc-300 bg-white px-4 py-2 text-zinc-900 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-100"
                  />
                </div>
                <div>
                  <label
                    htmlFor="timeRangeEnd"
                    className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
                  >
                    ⏰ Bis Uhrzeit
                  </label>
                  <input
                    id="timeRangeEnd"
                    type="time"
                    value={timeRangeEnd}
                    onChange={(e) => setTimeRangeEnd(e.target.value)}
                    className="w-full rounded-md border border-zinc-300 bg-white px-4 py-2 text-zinc-900 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-100"
                  />
                </div>
                */}
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

          {/* Reset Filter Warning - Prominent only when NO photos found */}
          {(bibNumberFilter || dateFilter || timeRangeStart || timeRangeEnd || filteredPhotos.length !== photos.length) && filteredPhotos.length === 0 && (
            <div className="mt-4 flex items-center justify-between rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-900/50 dark:bg-yellow-900/20">
              <div className="flex items-center gap-2">
                <svg
                  className="h-5 w-5 text-yellow-600 dark:text-yellow-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
                <div>
                  <p className="text-sm font-medium text-yellow-900 dark:text-yellow-400">
                    Keine Fotos gefunden
                  </p>
                  <p className="text-xs text-yellow-700 dark:text-yellow-500">
                    Keine Fotos entsprechen deinem Filter
                  </p>
                </div>
              </div>
              <button
                onClick={resetFilters}
                className="rounded-md bg-yellow-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-yellow-700 dark:bg-yellow-500 dark:hover:bg-yellow-600"
              >
                ✕ Filter zurücksetzen
              </button>
            </div>
          )}

          {/* Subtle filter hint - when photos ARE found */}
          {(bibNumberFilter || dateFilter || timeRangeStart || timeRangeEnd || filteredPhotos.length !== photos.length) && filteredPhotos.length > 0 && (
            <div className="mt-4 flex items-center justify-between text-sm text-zinc-600 dark:text-zinc-400">
              <span>
                {filteredPhotos.length} von {photos.length} Fotos werden angezeigt
              </span>
              <button
                onClick={resetFilters}
                className="text-zinc-700 underline transition-colors hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-zinc-50"
              >
                Filter zurücksetzen
              </button>
            </div>
          )}
        </div>

        {/* Selected Photos Bar - Mobile Optimized with Safe Area */}
        {selectedPhotos.size > 0 && (
          <div className="fixed bottom-0 left-0 right-0 z-50 border-t-2 border-white/20 bg-zinc-900 shadow-2xl dark:border-zinc-800 dark:bg-zinc-50 sm:sticky sm:top-4 sm:mb-6 sm:rounded-lg sm:border-0 sm:p-6 sm:shadow-lg" style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 0.5rem)' }}>
            <div className="mx-auto flex max-w-7xl flex-col gap-2 px-3 py-2.5 sm:gap-4 sm:px-0 sm:py-0">
              {/* Compact Summary Row */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-white dark:text-zinc-900 sm:text-base">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-white/20 text-xs font-bold dark:bg-zinc-900/20 sm:h-8 sm:w-8">
                    {selectedPhotos.size}
                  </div>
                  <span className="font-semibold">
                    <span className="hidden xs:inline">Fotos</span>
                    <span className="xs:hidden">Fotos</span>
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-base font-bold text-white dark:text-zinc-900 sm:text-2xl">
                    {calculateTotal().toFixed(2)} €
                  </span>
                </div>
              </div>
              
              {/* Email input for guests - Ultra compact on mobile */}
              {!isAuthenticated && (
                <div className="flex flex-col gap-1 sm:gap-2">
                  <label className="text-[10px] font-medium text-white/80 dark:text-zinc-700 sm:text-sm">
                    📧 E-Mail für Download-Link:
                  </label>
                  <input
                    type="email"
                    value={guestEmail}
                    onChange={(e) => setGuestEmail(e.target.value)}
                    placeholder="deine@email.de"
                    className="w-full rounded-lg border-2 border-white/20 bg-white px-2.5 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 dark:border-zinc-300 dark:bg-zinc-50 sm:px-4 sm:py-3"
                    required
                    autoComplete="email"
                    inputMode="email"
                  />
                </div>
              )}

              <button
                className="w-full rounded-lg bg-gradient-to-r from-green-500 to-emerald-600 px-4 py-2.5 text-sm font-bold text-white shadow-lg transition-all hover:from-green-600 hover:to-emerald-700 disabled:cursor-not-allowed disabled:opacity-50 sm:px-6 sm:py-3.5 sm:text-base"
                disabled={isCheckingOut}
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

                  setIsCheckingOut(true);

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
                      setIsCheckingOut(false);
                      return;
                    }

                    // Redirect to Stripe Checkout
                    if (data.url) {
                      window.location.href = data.url;
                      // Keep loading state active during redirect
                    }
                  } catch (error) {
                    console.error("Checkout error:", error);
                    setModalState({
                      isOpen: true,
                      title: "Fehler",
                      message: "Ein Fehler ist beim Checkout aufgetreten. Bitte versuche es erneut.",
                      type: "error",
                    });
                    setIsCheckingOut(false);
                  }
                }}
              >
                {isCheckingOut ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="h-5 w-5 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Wird geladen...</span>
                  </span>
                ) : (
                  "Zur Kasse"
                )}
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
          <div className="mb-32 grid grid-cols-2 gap-2 sm:mb-6 sm:gap-3 md:grid-cols-3 md:gap-4 lg:grid-cols-4">
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
                    setLightboxPhoto(photo);
                    setLightboxOpen(true);
                  }}
                >
                  <img
                    src={photo.watermark_url}
                    alt=""
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform group-hover:scale-105"
                    style={{
                      transform: `rotate(${photo.rotation || 0}deg) ${selectedPhotos.has(photo.id) ? 'scale(1.05)' : ''}`,
                    }}
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
        onClose={() => {
          setLightboxOpen(false);
          setLightboxPhoto(null);
        }}
        imageUrl={lightboxImage}
        alt="Foto"
        photoId={lightboxPhoto?.id}
        bibNumber={lightboxPhoto?.bib_number}
        price={lightboxPhoto?.price}
        takenAt={lightboxPhoto?.taken_at}
        cameraMake={lightboxPhoto?.camera_make}
        cameraModel={lightboxPhoto?.camera_model}
        rotation={lightboxPhoto?.rotation || 0}
        isInCart={lightboxPhoto ? selectedPhotos.has(lightboxPhoto.id) : false}
        onAddToCart={(photoId) => {
          setSelectedPhotos(prev => new Set([...prev, photoId]));
        }}
        onRemoveFromCart={(photoId) => {
          setSelectedPhotos(prev => {
            const newSet = new Set(prev);
            newSet.delete(photoId);
            return newSet;
          });
        }}
        showShare={true}
        shareUrl={typeof window !== "undefined" && lightboxPhoto ? `${window.location.origin}/event/${slug}?photo=${lightboxPhoto.id}` : ""}
        shareTitle={`${event.title}${lightboxPhoto?.bib_number ? ` - #${lightboxPhoto.bib_number}` : ""}`}
      />
    </div>
  );
}


