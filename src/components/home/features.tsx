"use client";

import { useLanguage } from "@/lib/i18n/LanguageContext";

export function Features() {
  const { t } = useLanguage();

  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <h2 className="mb-12 text-center text-3xl font-bold text-zinc-900 dark:text-zinc-50">
        {t("home.howItWorks")}
      </h2>
      <div className="grid gap-8 md:grid-cols-3">
        <div className="rounded-lg bg-white p-8 shadow dark:bg-zinc-800">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/20">
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
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
          <h3 className="mb-2 text-xl font-semibold text-zinc-900 dark:text-zinc-50">
            1. {t("home.feature.1.title")}
          </h3>
          <p className="text-zinc-600 dark:text-zinc-400">
            {t("home.feature.1.description")}
          </p>
        </div>

        <div className="rounded-lg bg-white p-8 shadow dark:bg-zinc-800">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20">
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
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
          <h3 className="mb-2 text-xl font-semibold text-zinc-900 dark:text-zinc-50">
            2. {t("home.feature.2.title")}
          </h3>
          <p className="text-zinc-600 dark:text-zinc-400">
            {t("home.feature.2.description")}
          </p>
        </div>

        <div className="rounded-lg bg-white p-8 shadow dark:bg-zinc-800">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900/20">
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
                d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
          </div>
          <h3 className="mb-2 text-xl font-semibold text-zinc-900 dark:text-zinc-50">
            3. {t("home.feature.3.title")}
          </h3>
          <p className="text-zinc-600 dark:text-zinc-400">
            {t("home.feature.3.description")}
          </p>
        </div>
      </div>
    </div>
  );
}

