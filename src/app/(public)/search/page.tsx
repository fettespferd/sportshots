"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import Image from "next/image";

interface Event {
  id: string;
  title: string;
  slug: string;
  location: string;
  event_date: string;
  event_type: string;
  cover_image_url: string | null;
  price_per_photo: number;
}

interface Photographer {
  id: string;
  full_name: string;
  username: string;
  account_type: string;
  bio: string | null;
  team_bio: string | null;
  location: string | null;
  avatar_url: string | null;
  team_logo_url: string | null;
  created_at: string;
  first_gallery_image?: string | null;
}

type SearchTab = "events" | "photographers";

export default function SearchPage() {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<SearchTab>("events");
  const [events, setEvents] = useState<Event[]>([]);
  const [photographers, setPhotographers] = useState<Photographer[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const [filteredPhotographers, setFilteredPhotographers] = useState<Photographer[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<string>("");
  const [selectedAccountType, setSelectedAccountType] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const eventTypes = [
    { value: "", label: "Alle Sportarten" },
    { value: "running", label: "Laufen" },
    { value: "cycling", label: "Radfahren" },
    { value: "skiing", label: "Skifahren" },
    { value: "surfing", label: "Surfen" },
    { value: "triathlon", label: "Triathlon" },
    { value: "other", label: "Sonstiges" },
  ];

  const accountTypes = [
    { value: "", label: "Alle" },
    { value: "individual", label: "Einzelne Fotografen" },
    { value: "team", label: "Teams" },
  ];

  useEffect(() => {
    const loadData = async () => {
      // Load events
      const { data: eventsData } = await supabase
        .from("events")
        .select("*")
        .eq("is_published", true)
        .order("event_date", { ascending: false });

      if (eventsData) {
        setEvents(eventsData);
        setFilteredEvents(eventsData);
      }

      // Load photographers (all users with a username are photographers)
      const { data: photographersData } = await supabase
        .from("profiles")
        .select("*")
        .not("username", "is", null)
        .order("created_at", { ascending: false });

      if (photographersData) {
        // Load first gallery image for each photographer as fallback profile picture
        const photographersWithGallery = await Promise.all(
          photographersData.map(async (photographer) => {
            if (!photographer.team_logo_url && !photographer.avatar_url) {
              const { data: galleryImages } = await supabase
                .from("gallery_images")
                .select("image_url")
                .eq("photographer_id", photographer.id)
                .order("display_order", { ascending: true })
                .limit(1);
              
              return {
                ...photographer,
                first_gallery_image: galleryImages?.[0]?.image_url || null,
              };
            }
            return photographer;
          })
        );

        setPhotographers(photographersWithGallery);
        setFilteredPhotographers(photographersWithGallery);
      }

      setLoading(false);
    };

    loadData();
  }, []);

  // Filter events
  useEffect(() => {
    let filtered = events;

    if (searchQuery) {
      filtered = filtered.filter(
        (event) =>
          event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          event.location.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (selectedType) {
      filtered = filtered.filter((event) => event.event_type === selectedType);
    }

    setFilteredEvents(filtered);
  }, [searchQuery, selectedType, events]);

  // Filter photographers
  useEffect(() => {
    let filtered = photographers;

    if (searchQuery) {
      filtered = filtered.filter(
        (photographer) =>
          photographer.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          photographer.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (photographer.location && photographer.location.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (photographer.bio && photographer.bio.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (photographer.team_bio && photographer.team_bio.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    if (selectedAccountType) {
      filtered = filtered.filter((photographer) => photographer.account_type === selectedAccountType);
    }

    setFilteredPhotographers(filtered);
  }, [searchQuery, selectedAccountType, photographers]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-900">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-zinc-300 border-t-zinc-900 dark:border-zinc-700 dark:border-t-zinc-50"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-zinc-900 dark:text-zinc-50">
            Suche
          </h1>
          <p className="mt-2 text-zinc-600 dark:text-zinc-400">
            Finde Events oder entdecke Fotografen und Teams
          </p>
        </div>

        {/* Tabs */}
        <div className="mb-6 border-b border-zinc-200 dark:border-zinc-700">
          <div className="flex gap-4">
            <button
              onClick={() => setActiveTab("events")}
              className={`border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === "events"
                  ? "border-zinc-900 text-zinc-900 dark:border-zinc-50 dark:text-zinc-50"
                  : "border-transparent text-zinc-600 hover:border-zinc-300 hover:text-zinc-900 dark:text-zinc-400 dark:hover:border-zinc-600 dark:hover:text-zinc-50"
              }`}
            >
              📅 Events ({filteredEvents.length})
            </button>
            <button
              onClick={() => setActiveTab("photographers")}
              className={`border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === "photographers"
                  ? "border-zinc-900 text-zinc-900 dark:border-zinc-50 dark:text-zinc-50"
                  : "border-transparent text-zinc-600 hover:border-zinc-300 hover:text-zinc-900 dark:text-zinc-400 dark:hover:border-zinc-600 dark:hover:text-zinc-50"
              }`}
            >
              📸 Fotografen & Teams ({filteredPhotographers.length})
            </button>
          </div>
        </div>

        {/* Search & Filter */}
        <div className="mb-8 rounded-lg bg-white p-6 shadow dark:bg-zinc-800">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label
                htmlFor="search"
                className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
              >
                {activeTab === "events" ? "Event oder Ort suchen" : "Name oder Ort suchen"}
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
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
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </div>
                <input
                  id="search"
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={
                    activeTab === "events"
                      ? "z.B. Berlin Marathon oder München"
                      : "z.B. Max Mustermann oder Berlin"
                  }
                  className="block w-full rounded-md border border-zinc-300 bg-white py-2 pl-10 pr-3 text-zinc-900 placeholder-zinc-400 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-100 dark:placeholder-zinc-500"
                />
              </div>
            </div>

            <div>
              {activeTab === "events" ? (
                <>
                  <label
                    htmlFor="eventType"
                    className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
                  >
                    Sportart
                  </label>
                  <select
                    id="eventType"
                    value={selectedType}
                    onChange={(e) => setSelectedType(e.target.value)}
                    className="block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-zinc-900 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-100"
                  >
                    {eventTypes.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </>
              ) : (
                <>
                  <label
                    htmlFor="accountType"
                    className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
                  >
                    Account-Typ
                  </label>
                  <select
                    id="accountType"
                    value={selectedAccountType}
                    onChange={(e) => setSelectedAccountType(e.target.value)}
                    className="block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-zinc-900 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-100"
                  >
                    {accountTypes.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </>
              )}
            </div>
          </div>

          <div className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">
            {activeTab === "events" ? (
              <>{filteredEvents.length} {filteredEvents.length === 1 ? "Event" : "Events"} gefunden</>
            ) : (
              <>{filteredPhotographers.length} {filteredPhotographers.length === 1 ? "Fotograf" : "Fotografen"} gefunden</>
            )}
          </div>
        </div>

        {/* Results */}
        {activeTab === "events" ? (
          filteredEvents.length === 0 ? (
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
                  d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"
                />
              </svg>
              <h3 className="mt-4 text-lg font-medium text-zinc-900 dark:text-zinc-50">
                Keine Events gefunden
              </h3>
              <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
                Versuche eine andere Suche oder filtere nach einer anderen Sportart
              </p>
            </div>
          ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredEvents.map((event) => (
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
                  <div className="mb-2">
                    <span className="rounded-full bg-zinc-100 px-2 py-1 text-xs font-medium text-zinc-800 dark:bg-zinc-700 dark:text-zinc-300">
                      {eventTypes.find((t) => t.value === event.event_type)
                        ?.label || event.event_type}
                    </span>
                  </div>
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
                    <div className="flex items-center font-medium text-zinc-900 dark:text-zinc-50">
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
                          d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      ab {event.price_per_photo.toFixed(2)} €
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
          )
        ) : (
          filteredPhotographers.length === 0 ? (
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
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
              <h3 className="mt-4 text-lg font-medium text-zinc-900 dark:text-zinc-50">
                Keine Fotografen gefunden
              </h3>
              <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
                Versuche eine andere Suche oder filtere nach einem anderen Account-Typ
              </p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredPhotographers.map((photographer) => (
                <Link
                  key={photographer.id}
                  href={`/${photographer.username}`}
                  className="group overflow-hidden rounded-lg bg-white shadow transition-shadow hover:shadow-lg dark:bg-zinc-800"
                >
                  <div className="p-6">
                    <div className="flex items-center gap-4">
                      {/* Avatar/Logo */}
                      {(photographer.team_logo_url || photographer.avatar_url || photographer.first_gallery_image) ? (
                        <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-full border-2 border-zinc-200 dark:border-zinc-700">
                          <Image
                            src={(photographer.team_logo_url || photographer.avatar_url || photographer.first_gallery_image)!}
                            alt={photographer.full_name}
                            fill
                            loading="lazy"
                            className="object-cover"
                          />
                        </div>
                      ) : (
                        <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-700">
                          <svg
                            className="h-8 w-8 text-zinc-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                            />
                          </svg>
                        </div>
                      )}

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="truncate text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                            {photographer.full_name}
                          </h3>
                          {photographer.account_type === "team" && (
                            <span className="inline-flex flex-shrink-0 items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                              Team
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-zinc-600 dark:text-zinc-400">
                          @{photographer.username}
                        </p>
                      </div>
                    </div>

                    {/* Bio */}
                    {(photographer.team_bio || photographer.bio) && (
                      <p className="mt-4 line-clamp-2 text-sm text-zinc-600 dark:text-zinc-400">
                        {photographer.team_bio || photographer.bio}
                      </p>
                    )}

                    {/* Location */}
                    {photographer.location && (
                      <div className="mt-4 flex items-center text-sm text-zinc-500 dark:text-zinc-500">
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
                        {photographer.location}
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
}


