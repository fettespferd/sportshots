"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useLanguage } from "@/lib/i18n/LanguageContext";

interface UserMenuProps {
  profile: any;
  user: any;
  onSignOut: () => void;
}

export function UserMenu({ profile, user, onSignOut }: UserMenuProps) {
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Get initials for avatar
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="relative" ref={menuRef}>
      {/* User Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-md border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800"
      >
        {/* Avatar */}
        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-900 text-xs font-semibold text-white dark:bg-zinc-50 dark:text-zinc-900">
          {profile?.full_name ? getInitials(profile.full_name) : "?"}
        </div>
        
        {/* Name + Chevron */}
        <span className="max-w-[120px] truncate">
          {profile?.username || profile?.full_name || "Profil"}
        </span>
        
        <svg
          className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 rounded-lg border border-zinc-200 bg-white shadow-lg dark:border-zinc-700 dark:bg-zinc-800">
          {/* User Info */}
          <div className="border-b border-zinc-200 px-4 py-3 dark:border-zinc-700">
            <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
              {profile?.full_name}
            </p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">{user?.email}</p>
            {profile?.username && (
              <Link
                href={`/${profile.username}`}
                className="mt-1 block text-xs text-blue-600 hover:underline dark:text-blue-400"
              >
                sportshots.brainmotion.ai/{profile.username}
              </Link>
            )}
          </div>

          {/* Menu Items */}
          <div className="py-1">
            {/* Photographer Links */}
            {((profile?.role === "photographer" && profile?.photographer_status === "approved") ||
              profile?.role === "admin") && (
              <>
                <Link
                  href="/photographer/analytics"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-3 px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-700"
                >
                  <span>📊</span>
                  <span>Analytics</span>
                </Link>
                <Link
                  href="/photographer/settings"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-3 px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-700"
                >
                  <span>⚙️</span>
                  <span>Einstellungen</span>
                </Link>
              </>
            )}

            {/* Admin Links */}
            {profile?.role === "admin" && (
              <>
                <div className="border-t border-zinc-200 dark:border-zinc-700" />
                <div className="px-4 py-2">
                  <p className="text-xs font-semibold uppercase text-zinc-500 dark:text-zinc-400">
                    Admin
                  </p>
                </div>
                <Link
                  href="/admin/revenue"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-3 px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-700"
                >
                  <span>💰</span>
                  <span>Umsatz</span>
                </Link>
                <Link
                  href="/admin/analytics"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-3 px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-700"
                >
                  <span>📈</span>
                  <span>Admin Analytics</span>
                </Link>
              </>
            )}
          </div>

          {/* Sign Out */}
          <div className="border-t border-zinc-200 dark:border-zinc-700">
            <button
              onClick={() => {
                setIsOpen(false);
                onSignOut();
              }}
              className="flex w-full items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
            >
              <span>🚪</span>
              <span>{t("nav.signOut")}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

