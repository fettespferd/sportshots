"use client";

import { useState, useEffect, use } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { FaceSearch } from "@/components/search/face-search";
import { Modal } from "@/components/ui/modal";
import { Lightbox } from "@/components/ui/lightbox";
import { ShareButton } from "@/components/ui/share-button";
import { CartModal } from "@/components/ui/cart-modal";
import { useLanguage } from "@/lib/i18n/LanguageContext";

interface SearchConfig {
  bib_number?: { enabled: boolean; visible_by_default: boolean };
  selfie_search?: { enabled: boolean; visible_by_default: boolean };
  date_filter?: { enabled: boolean; visible_by_default: boolean };
  time_filter?: { enabled: boolean; visible_by_default: boolean };
  show_metadata?: { enabled: boolean; visible_by_default: boolean };
  show_exact_time?: { enabled: boolean; visible_by_default: boolean };
}

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
  search_config?: SearchConfig | null;
}

interface Photo {
  id: string;
  watermark_url: string;
  original_url?: string;
  edited_url?: string | null;
  bib_number: string | null;
  price: number;
  taken_at: string | null;
  camera_make: string | null;
  camera_model: string | null;
  rotation?: number;
  isPurchased?: boolean;
}

export default function PublicEventPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const { t } = useLanguage();
  const [event, setEvent] = useState<Event | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [filteredPhotos, setFilteredPhotos] = useState<Photo[]>([]);
  const [bibNumberFilter, setBibNumberFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [timeRangeStart, setTimeRangeStart] = useState("");
  const [timeRangeEnd, setTimeRangeEnd] = useState("");
  const [loading, setLoading] = useState(true);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [searchConfig, setSearchConfig] = useState<SearchConfig | null>(null);
  const [selectedPhotos, setSelectedPhotos] = useState<Set<string>>(new Set());
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [guestEmail, setGuestEmail] = useState("");
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxImage, setLightboxImage] = useState("");
  const [lightboxPhoto, setLightboxPhoto] = useState<Photo | null>(null);
  const [cartModalOpen, setCartModalOpen] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followEmail, setFollowEmail] = useState("");
  const [isFollowingLoading, setIsFollowingLoading] = useState(false);
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
      
      // Set follow email from user if authenticated
      if (user?.email) {
        setFollowEmail(user.email);
      }

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

      // Check if user is following this event
      if (eventData.id) {
        const checkEmail = user?.email || followEmail;
        if (checkEmail) {
          const { data: follower } = await supabase
            .from("event_followers")
            .select("id")
            .eq("event_id", eventData.id)
            .eq("email", checkEmail)
            .single();
          setIsFollowing(!!follower);
        }
      }

      // Load search config or set defaults
      const defaultConfig: SearchConfig = {
        bib_number: { enabled: true, visible_by_default: true },
        selfie_search: { enabled: true, visible_by_default: true },
        date_filter: { enabled: true, visible_by_default: true },
        time_filter: { enabled: true, visible_by_default: true },
        show_metadata: { enabled: true, visible_by_default: true },
        show_exact_time: { enabled: true, visible_by_default: true },
      };
      
      // Parse search_config if it's a string (JSONB can come as string)
      let config: SearchConfig = defaultConfig;
      if (eventData.search_config) {
        try {
          const parsedConfig = typeof eventData.search_config === 'string' 
            ? JSON.parse(eventData.search_config) 
            : eventData.search_config;
          
          // Merge with defaults to ensure all fields exist
          config = {
            bib_number: parsedConfig.bib_number || defaultConfig.bib_number,
            selfie_search: parsedConfig.selfie_search || defaultConfig.selfie_search,
            date_filter: parsedConfig.date_filter || defaultConfig.date_filter,
            time_filter: parsedConfig.time_filter || defaultConfig.time_filter,
            show_metadata: parsedConfig.show_metadata || defaultConfig.show_metadata,
            show_exact_time: parsedConfig.show_exact_time || defaultConfig.show_exact_time,
          };
        } catch (e) {
          console.error("Error parsing search_config:", e);
          config = defaultConfig;
        }
      }
      
      setSearchConfig(config);

      // Initialize expanded sections - start empty, sections with visible_by_default: false should be collapsed
      // Only add to expandedSections when user clicks to expand
      setExpandedSections(new Set<string>());

      // Get photos with metadata (including edited_url for purchased photos)
      // Check if user has purchased photos from this event
      let purchasedPhotoIds: string[] = [];
      if (user) {
        const { data: purchases } = await supabase
          .from("purchases")
          .select(`
            purchase_photos (
              photo_id
            )
          `)
          .eq("buyer_id", user.id)
          .eq("event_id", eventData.id)
          .eq("status", "completed");
        
        if (purchases) {
          purchasedPhotoIds = purchases.flatMap((p: any) => 
            p.purchase_photos?.map((pp: any) => pp.photo_id) || []
          );
        }
      }

      const { data: photosData } = await supabase
        .from("photos")
        .select("id, watermark_url, original_url, edited_url, bib_number, price, taken_at, camera_make, camera_model, rotation")
        .eq("event_id", eventData.id)
        .order("taken_at", { ascending: false, nullsFirst: false });

      if (photosData) {
        // Mark purchased photos and include original_url for purchased photos
        const photosWithPurchaseStatus = photosData.map((photo: any) => ({
          ...photo,
          isPurchased: purchasedPhotoIds.includes(photo.id),
          // Only include original_url if purchased
          original_url: purchasedPhotoIds.includes(photo.id) ? photo.original_url : undefined,
        }));
        setPhotos(photosWithPurchaseStatus);
        setFilteredPhotos(photosWithPurchaseStatus);
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

  const handleFollow = async () => {
    if (!event) return;

    const emailToUse = isAuthenticated ? followEmail : followEmail;
    if (!emailToUse || !emailToUse.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      setModalState({
        isOpen: true,
        title: "E-Mail erforderlich",
        message: "Bitte gib eine gültige E-Mail-Adresse ein",
        type: "warning",
      });
      return;
    }

    setIsFollowingLoading(true);
    try {
      const response = await fetch(`/api/events/${event.id}/follow`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailToUse }),
      });

      const data = await response.json();

      if (data.success) {
        setIsFollowing(true);
        setModalState({
          isOpen: true,
          title: "Erfolg",
          message: data.message || "Du folgst diesem Event jetzt!",
          type: "success",
        });
      } else {
        setModalState({
          isOpen: true,
          title: "Fehler",
          message: data.error || "Fehler beim Folgen des Events",
          type: "error",
        });
      }
    } catch (error) {
      setModalState({
        isOpen: true,
        title: "Fehler",
        message: "Fehler beim Folgen des Events",
        type: "error",
      });
    } finally {
      setIsFollowingLoading(false);
    }
  };

  const handleUnfollow = async () => {
    if (!event) return;

    const emailToUse = isAuthenticated ? followEmail : followEmail;
    if (!emailToUse) return;

    setIsFollowingLoading(true);
    try {
      const response = await fetch(`/api/events/${event.id}/unfollow`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailToUse }),
      });

      const data = await response.json();

      if (data.success) {
        setIsFollowing(false);
        setModalState({
          isOpen: true,
          title: "Erfolg",
          message: data.message || "Du folgst diesem Event nicht mehr",
          type: "success",
        });
      } else {
        setModalState({
          isOpen: true,
          title: "Fehler",
          message: data.error || "Fehler beim Entfolgen",
          type: "error",
        });
      }
    } catch (error) {
      setModalState({
        isOpen: true,
        title: "Fehler",
        message: "Fehler beim Entfolgen",
        type: "error",
      });
    } finally {
      setIsFollowingLoading(false);
    }
  };

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
    <div className="min-h-screen overflow-x-hidden bg-zinc-50 dark:bg-zinc-900">
      {/* Event Header */}
      <div className="bg-white shadow-sm dark:bg-zinc-800">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
          <div className="grid gap-4 sm:gap-6 md:grid-cols-2 md:gap-8">
            <div>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 sm:text-3xl md:text-4xl">
                  {event.title}
                </h1>
                <div className="flex flex-shrink-0 gap-2">
                  {!isFollowing ? (
                    <div className="flex gap-2">
                      {!isAuthenticated && (
                        <input
                          type="email"
                          placeholder="Deine E-Mail"
                          value={followEmail}
                          onChange={(e) => setFollowEmail(e.target.value)}
                          className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-100"
                        />
                      )}
                      <button
                        onClick={handleFollow}
                        disabled={isFollowingLoading || (!isAuthenticated && !followEmail)}
                        className="flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50 dark:bg-blue-500 dark:hover:bg-blue-600"
                      >
                        {isFollowingLoading ? (
                          <>
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                            <span>Wird geladen...</span>
                          </>
                        ) : (
                          <>
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                            </svg>
                            <span>Event folgen</span>
                          </>
                        )}
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={handleUnfollow}
                      disabled={isFollowingLoading}
                      className="flex items-center gap-2 rounded-md bg-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-300 disabled:opacity-50 dark:bg-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-600"
                    >
                      {isFollowingLoading ? (
                        <>
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-700 border-t-transparent"></div>
                          <span>Wird geladen...</span>
                        </>
                      ) : (
                        <>
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span>Gefolgt</span>
                        </>
                      )}
                    </button>
                  )}
                  <ShareButton
                    url={typeof window !== "undefined" ? window.location.href : ""}
                    title={`${event.title} - Fotos ansehen`}
                    text={`Schau dir die Fotos von ${event.title} an!`}
                    className="flex-shrink-0 shadow-md"
                  />
                </div>
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
                {t("event.pricing")}
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
                        {t("event.singlePhoto")}
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
                            {t("event.package")}
                          </div>
                          <div className="font-semibold">
                            {t("event.photosInPackage", { count: event.package_photo_count })}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-white">
                          {event.package_price.toFixed(2)} €
                        </div>
                        <div className="text-xs text-white/80">
                          {(event.package_price / event.package_photo_count).toFixed(2)} € {t("event.perPhoto")}
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
          {searchConfig && (
            <div className="rounded-lg bg-white p-4 shadow dark:bg-zinc-800">
              <h3 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                Filter
              </h3>
              <div className="space-y-4 overflow-hidden">
                {/* Startnummer & Datum - Responsive Layout */}
                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {/* Bib Number Filter */}
                    {searchConfig.bib_number?.enabled && (
                      <div className={`min-w-0 ${searchConfig.bib_number?.visible_by_default ? '' : 'hidden'}`}>
                        <label
                          htmlFor="bibNumber"
                          className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
                        >
                          {t("event.filterByBibNumber")}
                        </label>
                        <input
                          id="bibNumber"
                          type="text"
                          value={bibNumberFilter}
                          onChange={(e) => setBibNumberFilter(e.target.value)}
                          placeholder={t("event.bibPlaceholder")}
                          className="w-full min-w-0 rounded-md border border-zinc-300 bg-white px-3 py-2 text-zinc-900 placeholder-zinc-400 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-100 dark:placeholder-zinc-500"
                          style={{ fontSize: '16px', maxWidth: '100%' }}
                        />
                      </div>
                    )}

                    {/* Date Filter */}
                    {searchConfig.date_filter?.enabled && (
                      <div className={`min-w-0 ${searchConfig.date_filter?.visible_by_default ? '' : 'hidden'}`}>
                        <label
                          htmlFor="dateFilter"
                          className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
                        >
                          📅 {t("event.filterByDate")}
                        </label>
                        <div className="relative">
                          <input
                            id="dateFilter"
                            type="date"
                            value={dateFilter}
                            onChange={(e) => setDateFilter(e.target.value)}
                            className="w-full min-w-0 rounded-md border border-zinc-300 bg-white px-3 py-2 pr-10 text-zinc-900 placeholder-zinc-400 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-100 dark:placeholder-zinc-500"
                            style={{ fontSize: '16px', maxWidth: '100%' }}
                          />
                          {dateFilter && (
                            <button
                              onClick={() => setDateFilter("")}
                              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-zinc-500 transition-colors hover:bg-zinc-200 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-600 dark:hover:text-zinc-50"
                              aria-label="Datum zurücksetzen"
                            >
                              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="text-sm text-zinc-600 dark:text-zinc-400 sm:text-right">
                    {t("event.resultsCount", { filtered: filteredPhotos.length, total: photos.length })}
                  </div>
                </div>

                {/* Collapsible Sections for Hidden Options */}
                {/* Bib Number Toggle */}
                {searchConfig.bib_number?.enabled && !searchConfig.bib_number?.visible_by_default && (
                  <div className="border-t border-zinc-200 pt-4 dark:border-zinc-700">
                    <button
                      onClick={() => {
                        const newExpanded = new Set(expandedSections);
                        if (newExpanded.has("bib_number")) {
                          newExpanded.delete("bib_number");
                        } else {
                          newExpanded.add("bib_number");
                        }
                        setExpandedSections(newExpanded);
                      }}
                      className="flex w-full items-center justify-between text-sm font-medium text-zinc-700 dark:text-zinc-300"
                    >
                      <span>{t("event.filterByBibNumber")}</span>
                      <svg
                        className={`h-5 w-5 transition-transform ${expandedSections.has("bib_number") ? "rotate-180" : ""}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    {expandedSections.has("bib_number") && (
                      <div className="mt-3">
                        <input
                          type="text"
                          value={bibNumberFilter}
                          onChange={(e) => setBibNumberFilter(e.target.value)}
                          placeholder={t("event.bibPlaceholder")}
                          className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-zinc-900 placeholder-zinc-400 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-100 dark:placeholder-zinc-500"
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* Date Filter Toggle */}
                {searchConfig.date_filter?.enabled && !searchConfig.date_filter?.visible_by_default && (
                  <div className="border-t border-zinc-200 pt-4 dark:border-zinc-700">
                    <button
                      onClick={() => {
                        const newExpanded = new Set(expandedSections);
                        if (newExpanded.has("date_filter")) {
                          newExpanded.delete("date_filter");
                        } else {
                          newExpanded.add("date_filter");
                        }
                        setExpandedSections(newExpanded);
                      }}
                      className="flex w-full items-center justify-between text-sm font-medium text-zinc-700 dark:text-zinc-300"
                    >
                      <span>📅 {t("event.filterByDate")}</span>
                      <svg
                        className={`h-5 w-5 transition-transform ${expandedSections.has("date_filter") ? "rotate-180" : ""}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    {expandedSections.has("date_filter") && (
                      <div className="mt-3">
                        <input
                          type="date"
                          value={dateFilter}
                          onChange={(e) => setDateFilter(e.target.value)}
                          className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-zinc-900 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-100"
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* Time Filter Toggle */}
                {searchConfig.time_filter?.enabled && (
                  <div className={`border-t border-zinc-200 pt-4 dark:border-zinc-700 ${searchConfig.time_filter?.visible_by_default ? '' : ''}`}>
                    {!searchConfig.time_filter?.visible_by_default ? (
                      <>
                        <button
                          onClick={() => {
                            const newExpanded = new Set(expandedSections);
                            if (newExpanded.has("time_filter")) {
                              newExpanded.delete("time_filter");
                            } else {
                              newExpanded.add("time_filter");
                            }
                            setExpandedSections(newExpanded);
                          }}
                          className="flex w-full items-center justify-between text-sm font-medium text-zinc-700 dark:text-zinc-300"
                        >
                          <span>⏰ Uhrzeit-Filter</span>
                          <svg
                            className={`h-5 w-5 transition-transform ${expandedSections.has("time_filter") ? "rotate-180" : ""}`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                        {expandedSections.has("time_filter") && (
                          <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div>
                              <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                                Von Uhrzeit
                              </label>
                              <input
                                type="time"
                                value={timeRangeStart}
                                onChange={(e) => setTimeRangeStart(e.target.value)}
                                className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-zinc-900 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-100"
                              />
                            </div>
                            <div>
                              <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                                Bis Uhrzeit
                              </label>
                              <input
                                type="time"
                                value={timeRangeEnd}
                                onChange={(e) => setTimeRangeEnd(e.target.value)}
                                className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-zinc-900 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-100"
                              />
                            </div>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                          <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                            ⏰ Von Uhrzeit
                          </label>
                          <input
                            type="time"
                            value={timeRangeStart}
                            onChange={(e) => setTimeRangeStart(e.target.value)}
                            className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-zinc-900 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-100"
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                            ⏰ Bis Uhrzeit
                          </label>
                          <input
                            type="time"
                            value={timeRangeEnd}
                            onChange={(e) => setTimeRangeEnd(e.target.value)}
                            className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-zinc-900 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-100"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Face Search */}
          {searchConfig?.selfie_search?.enabled && (
            <div className={searchConfig.selfie_search?.visible_by_default ? '' : ''}>
              {!searchConfig.selfie_search?.visible_by_default ? (
                <div className="rounded-lg bg-white p-4 shadow dark:bg-zinc-800">
                  <button
                    onClick={() => {
                      const newExpanded = new Set(expandedSections);
                      if (newExpanded.has("selfie_search")) {
                        newExpanded.delete("selfie_search");
                      } else {
                        newExpanded.add("selfie_search");
                      }
                      setExpandedSections(newExpanded);
                    }}
                    className="flex w-full items-center justify-between text-sm font-medium text-zinc-700 dark:text-zinc-300"
                  >
                    <span>😊 Selfie-Suche</span>
                    <svg
                      className={`h-5 w-5 transition-transform ${expandedSections.has("selfie_search") ? "rotate-180" : ""}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {expandedSections.has("selfie_search") && (
                    <div className="mt-4">
                      <FaceSearch
                        eventId={event.id}
                        onResults={(photoIds) => {
                          const matchedPhotos = photos.filter((p) =>
                            photoIds.includes(p.id)
                          );
                          setFilteredPhotos(matchedPhotos);
                          setBibNumberFilter("");
                        }}
                      />
                    </div>
                  )}
                </div>
              ) : (
                <FaceSearch
                  eventId={event.id}
                  onResults={(photoIds) => {
                    const matchedPhotos = photos.filter((p) =>
                      photoIds.includes(p.id)
                    );
                    setFilteredPhotos(matchedPhotos);
                    setBibNumberFilter("");
                  }}
                />
              )}
            </div>
          )}

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
                    {t("event.noPhotos")}
                  </p>
                  <p className="text-xs text-yellow-700 dark:text-yellow-500">
                    {t("search.noResults")}
                  </p>
                </div>
              </div>
              <button
                onClick={resetFilters}
                className="rounded-md bg-yellow-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-yellow-700 dark:bg-yellow-500 dark:hover:bg-yellow-600"
              >
                ✕ {t("event.resetFilter")}
              </button>
            </div>
          )}

          {/* Subtle filter hint - when photos ARE found */}
          {(bibNumberFilter || dateFilter || timeRangeStart || timeRangeEnd || filteredPhotos.length !== photos.length) && filteredPhotos.length > 0 && (
            <div className="mt-4 flex items-center justify-between text-sm text-zinc-600 dark:text-zinc-400">
              <span>
                {t("event.resultsCount", { filtered: filteredPhotos.length, total: photos.length })}
              </span>
              <button
                onClick={resetFilters}
                className="text-zinc-700 underline transition-colors hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-zinc-50"
              >
                {t("event.resetFilter")}
              </button>
            </div>
          )}
        </div>

        {/* Selected Photos Bar - Two Row Layout */}
        {selectedPhotos.size > 0 && (
          <div className="fixed bottom-0 left-0 right-0 z-50 border-t-2 border-white/20 bg-zinc-900 shadow-2xl dark:border-zinc-800 dark:bg-zinc-50 sm:sticky sm:top-4 sm:mb-6 sm:rounded-lg sm:border-0 sm:p-6 sm:shadow-lg" style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 0.75rem)', maxWidth: '100vw' }}>
            <div className="mx-auto flex max-w-7xl flex-col gap-2.5 overflow-hidden px-3 py-3 sm:gap-4 sm:px-0 sm:py-0">
              {/* Two Row Layout for Guest Checkout */}
              {!isAuthenticated ? (
                <>
                  {/* Top row: Counter + Price */}
                  <div className="flex items-center justify-between">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white/20 text-xs font-bold text-white dark:bg-zinc-900/20 dark:text-zinc-900 sm:h-8 sm:w-8">
                      {selectedPhotos.size}
                    </div>
                    <span className="text-lg font-bold text-white dark:text-zinc-900 sm:text-2xl">
                      {calculateTotal().toFixed(2)} €
                    </span>
                  </div>
                  
                  {/* Email Row (Full Width) */}
                  <input
                    type="email"
                    value={guestEmail}
                    onChange={(e) => setGuestEmail(e.target.value)}
                    placeholder={t("event.emailForDownload")}
                    className="w-full rounded-lg border-2 border-white/20 bg-white px-3.5 py-2.5 text-zinc-900 placeholder-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500/50 dark:border-zinc-300 dark:bg-zinc-50 sm:px-4 sm:py-3"
                    style={{ fontSize: '16px' }}
                    required
                    autoComplete="email"
                    inputMode="email"
                  />
                  
                  {/* Button Row (Full Width) */}
                  <button
                    className="w-full rounded-lg bg-gradient-to-r from-green-500 to-emerald-600 px-6 py-3 text-base font-bold text-white shadow-lg transition-all hover:from-green-600 hover:to-emerald-700 disabled:cursor-not-allowed disabled:opacity-50 sm:py-3.5"
                    disabled={isCheckingOut}
                onClick={async () => {
                  // Validate guest email
                  if (!isAuthenticated && !guestEmail) {
                    setModalState({
                      isOpen: true,
                      title: t("common.error"),
                      message: t("event.guestEmail"),
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
                        title: t("common.error"),
                        message: t("common.email"),
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
                        title: t("common.error"),
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
                      title: t("common.error"),
                      message: t("common.error"),
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
                    <span>{t("common.loadingFull")}</span>
                  </span>
                ) : (
                  t("event.buy")
                )}
                  </button>
                </>
              ) : (
                <>
                  {/* Authenticated users - Two Row Layout */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-white dark:text-zinc-900">
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white/20 text-xs font-bold dark:bg-zinc-900/20 sm:h-8 sm:w-8">
                        {selectedPhotos.size}
                      </div>
                      <span className="text-sm font-medium sm:text-base">{t("common.photos")}</span>
                    </div>
                    <span className="text-lg font-bold text-white dark:text-zinc-900 sm:text-2xl">
                      {calculateTotal().toFixed(2)} €
                    </span>
                  </div>
                  
                  <button
                    className="w-full rounded-lg bg-gradient-to-r from-green-500 to-emerald-600 px-6 py-3 text-base font-bold text-white shadow-lg transition-all hover:from-green-600 hover:to-emerald-700 disabled:cursor-not-allowed disabled:opacity-50 sm:py-3.5"
                    disabled={isCheckingOut}
                    onClick={async () => {
                      setIsCheckingOut(true);

                      try {
                        const response = await fetch("/api/stripe/checkout", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            photoIds: Array.from(selectedPhotos),
                            eventId: event.id,
                          }),
                        });

                        const data = await response.json();

                        if (data.error) {
                          setModalState({
                            isOpen: true,
                            title: t("common.error"),
                            message: data.error,
                            type: "error",
                          });
                          setIsCheckingOut(false);
                          return;
                        }

                        if (data.url) {
                          window.location.href = data.url;
                        }
                      } catch (error) {
                        console.error("Checkout error:", error);
                        setModalState({
                          isOpen: true,
                          title: t("common.error"),
                          message: t("common.error"),
                          type: "error",
                        });
                        setIsCheckingOut(false);
                      }
                    }}
                  >
                    {isCheckingOut ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="h-4 w-4 animate-spin sm:h-5 sm:w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span>{t("common.loading")}</span>
                      </span>
                    ) : (
                      t("event.checkout")
                    )}
                  </button>
                </>
              )}
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
                    // Use original_url if purchased, otherwise watermark_url
                    const imageToShow = photo.isPurchased && photo.original_url 
                      ? photo.original_url 
                      : photo.watermark_url;
                    setLightboxImage(imageToShow);
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

                {/* Top left badges */}
                <div className="absolute left-2 top-2 flex flex-col gap-1">
                  {photo.bib_number && (
                    <div className="rounded bg-black/70 px-2 py-1 text-xs font-medium text-white backdrop-blur-sm">
                      #{photo.bib_number}
                    </div>
                  )}
                  
                  {/* Edited Version Indicator - Only show for purchased photos */}
                  {photo.isPurchased && photo.edited_url && (
                    <div className="rounded bg-blue-600 px-2 py-1 text-xs font-medium text-white backdrop-blur-sm">
                      ✨ Bearbeitet
                    </div>
                  )}
                  
                  {/* Cart indicator badge */}
                  {selectedPhotos.has(photo.id) && (
                    <div className="flex items-center gap-1 rounded-full bg-green-600 px-2 py-1 text-xs font-bold text-white shadow-lg">
                      <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>{Array.from(selectedPhotos).indexOf(photo.id) + 1}</span>
                    </div>
                  )}
                </div>

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
        takenAt={searchConfig?.show_exact_time?.enabled ? lightboxPhoto?.taken_at : null}
        cameraMake={searchConfig?.show_metadata?.enabled ? lightboxPhoto?.camera_make : null}
        cameraModel={searchConfig?.show_metadata?.enabled ? lightboxPhoto?.camera_model : null}
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
        onViewCart={() => {
          setLightboxOpen(false);
          setCartModalOpen(true);
        }}
        showShare={true}
        shareUrl={typeof window !== "undefined" && lightboxPhoto ? `${window.location.origin}/event/${slug}?photo=${lightboxPhoto.id}` : ""}
        shareTitle={`${event.title}${lightboxPhoto?.bib_number ? ` - #${lightboxPhoto.bib_number}` : ""}`}
        editedUrl={lightboxPhoto?.isPurchased && lightboxPhoto?.edited_url ? lightboxPhoto.edited_url : null}
      />

      {/* Cart Modal */}
      <CartModal
        isOpen={cartModalOpen}
        onClose={() => setCartModalOpen(false)}
        photos={photos.filter(p => selectedPhotos.has(p.id))}
        onRemovePhoto={(photoId) => {
          setSelectedPhotos(prev => {
            const newSet = new Set(prev);
            newSet.delete(photoId);
            return newSet;
          });
        }}
        isAuthenticated={isAuthenticated}
        guestEmail={guestEmail}
        onGuestEmailChange={setGuestEmail}
        onCheckout={async () => {
          // Validate guest email if not authenticated
          if (!isAuthenticated && !guestEmail) {
            setCartModalOpen(false);
            setModalState({
              isOpen: true,
              title: t("common.error"),
              message: t("event.guestEmail"),
              type: "warning",
            });
            return;
          }

          // Validate email format
          if (!isAuthenticated && guestEmail) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(guestEmail)) {
              setCartModalOpen(false);
              setModalState({
                isOpen: true,
                title: t("common.error"),
                message: t("common.email"),
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
                title: t("common.error"),
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
              title: t("common.error"),
              message: t("common.error"),
              type: "error",
            });
            setIsCheckingOut(false);
          }
        }}
        totalPrice={calculateTotal()}
        isCheckingOut={isCheckingOut}
      />
    </div>
  );
}


