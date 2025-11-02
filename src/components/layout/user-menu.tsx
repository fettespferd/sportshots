"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
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

  // Get account type label with emoji
  const getAccountTypeLabel = () => {
    if (profile?.role === "admin") return { label: "Admin", emoji: "👑", color: "text-purple-600 dark:text-purple-400" };
    if (profile?.account_type === "team") return { label: "Team", emoji: "👥", color: "text-blue-600 dark:text-blue-400" };
    if (profile?.account_type === "individual") return { label: "Fotograf", emoji: "📷", color: "text-green-600 dark:text-green-400" };
    return null;
  };

  const accountType = getAccountTypeLabel();
  const avatarUrl = profile?.team_logo_url || profile?.avatar_url;

  return (
    <div className="relative" ref={menuRef}>
      {/* User Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2.5 rounded-lg border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 transition-all hover:border-zinc-400 hover:bg-zinc-50 hover:shadow-sm dark:border-zinc-600 dark:text-zinc-300 dark:hover:border-zinc-500 dark:hover:bg-zinc-800"
      >
        {/* Avatar with Image Support */}
        {avatarUrl ? (
          <div className="relative h-7 w-7 flex-shrink-0 overflow-hidden rounded-full ring-2 ring-zinc-200 dark:ring-zinc-700">
            <Image
              src={avatarUrl}
              alt={profile?.full_name || "Avatar"}
              fill
              className="object-cover"
            />
          </div>
        ) : (
          <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-purple-600 text-xs font-bold text-white ring-2 ring-zinc-200 dark:ring-zinc-700">
            {profile?.full_name ? getInitials(profile.full_name) : "?"}
          </div>
        )}
        
        {/* Name (not username!) */}
        <span className="hidden max-w-[140px] truncate sm:block">
          {profile?.full_name || "Profil"}
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
        <div className="absolute right-0 z-50 mt-2 w-72 overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-xl dark:border-zinc-700 dark:bg-zinc-800">
          {/* User Info Header - Enhanced */}
          <div className="border-b border-zinc-200 bg-gradient-to-br from-zinc-50 to-white px-4 py-4 dark:border-zinc-700 dark:from-zinc-800 dark:to-zinc-800">
            <div className="flex items-start gap-3">
              {/* Larger Avatar in Dropdown */}
              {avatarUrl ? (
                <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-full ring-2 ring-zinc-300 dark:ring-zinc-600">
                  <Image
                    src={avatarUrl}
                    alt={profile?.full_name || "Avatar"}
                    fill
                    className="object-cover"
                  />
                </div>
              ) : (
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-purple-600 text-base font-bold text-white ring-2 ring-zinc-300 dark:ring-zinc-600">
                  {profile?.full_name ? getInitials(profile.full_name) : "?"}
                </div>
              )}

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                    {profile?.full_name}
                  </p>
                  {accountType && (
                    <span className={`flex-shrink-0 text-base ${accountType.color}`} title={accountType.label}>
                      {accountType.emoji}
                    </span>
                  )}
                </div>
                <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">
                  {user?.email}
                </p>
                {profile?.username && (
                  <Link
                    href={`/${profile.username}`}
                    onClick={() => setIsOpen(false)}
                    className="mt-1.5 inline-flex items-center gap-1 rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 transition-colors hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50"
                  >
                    <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                    <span>Profil ansehen</span>
                  </Link>
                )}
              </div>
            </div>
          </div>

          {/* Menu Items */}
          <div className="py-1.5">
            {/* Photographer Links */}
            {((profile?.role === "photographer" && profile?.photographer_status === "approved") ||
              profile?.role === "admin") && (
              <>
                <Link
                  href="/photographer/analytics"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-blue-50 hover:text-blue-700 dark:text-zinc-300 dark:hover:bg-blue-900/20 dark:hover:text-blue-400"
                >
                  <span className="text-base">📊</span>
                  <span>Analytics</span>
                </Link>
                <Link
                  href="/photographer/qr-codes"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-blue-50 hover:text-blue-700 dark:text-zinc-300 dark:hover:bg-blue-900/20 dark:hover:text-blue-400"
                >
                  <span className="text-base">📱</span>
                  <span>QR-Code</span>
                </Link>
                <Link
                  href="/photographer/settings"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-blue-50 hover:text-blue-700 dark:text-zinc-300 dark:hover:bg-blue-900/20 dark:hover:text-blue-400"
                >
                  <span className="text-base">⚙️</span>
                  <span>Einstellungen</span>
                </Link>
              </>
            )}

            {/* Admin Links */}
            {profile?.role === "admin" && (
              <>
                <div className="my-1.5 border-t border-zinc-200 dark:border-zinc-700" />
                <div className="px-4 py-2">
                  <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">
                    <span>👑</span>
                    <span>Admin-Bereich</span>
                  </p>
                </div>
                <Link
                  href="/admin/photographers"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-purple-50 hover:text-purple-700 dark:text-zinc-300 dark:hover:bg-purple-900/20 dark:hover:text-purple-400"
                >
                  <span className="text-base">👥</span>
                  <span>Fotografen</span>
                </Link>
                <Link
                  href="/admin/revenue"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-purple-50 hover:text-purple-700 dark:text-zinc-300 dark:hover:bg-purple-900/20 dark:hover:text-purple-400"
                >
                  <span className="text-base">💰</span>
                  <span>Umsatz</span>
                </Link>
                <Link
                  href="/admin/analytics"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-purple-50 hover:text-purple-700 dark:text-zinc-300 dark:hover:bg-purple-900/20 dark:hover:text-purple-400"
                >
                  <span className="text-base">📈</span>
                  <span>Admin Analytics</span>
                </Link>
                <Link
                  href="/admin/leads"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-purple-50 hover:text-purple-700 dark:text-zinc-300 dark:hover:bg-purple-900/20 dark:hover:text-purple-400"
                >
                  <span className="text-base">📧</span>
                  <span>Leads & CRM</span>
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
              className="flex w-full items-center gap-3 px-4 py-2.5 text-sm font-semibold text-red-600 transition-all hover:bg-red-50 active:scale-[0.98] dark:text-red-400 dark:hover:bg-red-900/20"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span>{t("nav.signOut")}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

