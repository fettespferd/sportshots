"use client";

import { useLocale } from "next-intl";
import { usePathname, useRouter } from "next/navigation";
import { locales } from "@/i18n";

export function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const switchLanguage = (newLocale: string) => {
    // Remove current locale from pathname
    const pathWithoutLocale = pathname.replace(`/${locale}`, "");
    // Navigate to new locale
    router.push(`/${newLocale}${pathWithoutLocale || ""}`);
  };

  return (
    <div className="flex items-center space-x-2 rounded-md bg-zinc-100 p-1 dark:bg-zinc-800">
      {locales.map((loc) => (
        <button
          key={loc}
          onClick={() => switchLanguage(loc)}
          className={`rounded px-3 py-1 text-sm font-medium transition-colors ${
            locale === loc
              ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-700 dark:text-zinc-50"
              : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
          }`}
        >
          {loc.toUpperCase()}
        </button>
      ))}
    </div>
  );
}


