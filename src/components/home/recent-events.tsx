"use client";

import Link from "next/link";
import Image from "next/image";
import { useLanguage } from "@/lib/i18n/LanguageContext";

interface Event {
  id: string;
  title: string;
  slug: string;
  location: string;
  event_date: string;
  cover_image_url: string | null;
}

interface RecentEventsProps {
  events: Event[];
}

export function RecentEvents({ events }: RecentEventsProps) {
  const { t } = useLanguage();

  if (!events || events.length === 0) {
    return null;
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="mb-8 flex items-center justify-between">
        <h2 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
          {t("home.recentEvents")}
        </h2>
        <Link
          href="/search"
          className="text-sm font-medium text-zinc-700 hover:underline dark:text-zinc-300"
        >
          {t("home.viewAllEvents")}
        </Link>
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {events.map((event) => (
          <Link
            key={event.id}
            href={`/event/${event.slug}`}
            className="group block overflow-hidden rounded-lg bg-white shadow transition-all hover:shadow-lg dark:bg-zinc-800"
          >
            {event.cover_image_url ? (
              <div className="aspect-video w-full overflow-hidden bg-zinc-100 dark:bg-zinc-700">
                <Image
                  src={event.cover_image_url}
                  alt={event.title}
                  width={600}
                  height={338}
                  className="h-full w-full object-cover transition-transform group-hover:scale-105"
                  priority={false}
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
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

