"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import { LanguageSelector } from "./language-selector";
import { UserMenu } from "./user-menu";
import { useLanguage } from "@/lib/i18n/LanguageContext";

interface Profile {
  role: string;
  photographer_status: string | null;
  full_name: string | null;
  account_type: string | null;
  username: string | null;
}

export function Header() {
  const { t } = useLanguage();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const loadUser = async () => {
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();

      setUser(currentUser);

      if (currentUser) {
        const { data: profileData } = await supabase
          .from("profiles")
          .select("role, photographer_status, full_name, account_type, username")
          .eq("id", currentUser.id)
          .single();

        setProfile(profileData);
      }

      setLoading(false);
    };

    loadUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") {
        setUser(null);
        setProfile(null);
      } else if (event === "SIGNED_IN" && session) {
        setUser(session.user);
        loadUser();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  return (
    <>
      <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center space-x-8">
              <Link
                href="/"
                className="text-xl font-bold text-zinc-900 dark:text-zinc-50"
              >
                SportShots
              </Link>

              <nav className="hidden items-center space-x-4 md:flex">
              <Link
                href="/search"
                className="text-sm font-medium text-zinc-700 transition-colors hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-zinc-50"
              >
                {t("nav.events")}
              </Link>

              {((profile?.role === "photographer" &&
                profile?.photographer_status === "approved") ||
                profile?.role === "admin") && (
                <>
                  <Link
                    href="/photographer/events"
                    className="text-sm font-medium text-zinc-700 transition-colors hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-zinc-50"
                  >
                    {t("nav.myEvents")}
                  </Link>
                  <Link
                    href="/photographer/sales"
                    className="text-sm font-medium text-zinc-700 transition-colors hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-zinc-50"
                  >
                    {t("nav.sales")}
                  </Link>
                </>
              )}

              {profile?.role === "admin" && (
                <Link
                  href="/admin/photographers"
                  className="text-sm font-medium text-zinc-700 transition-colors hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-zinc-50"
                >
                  Admin
                </Link>
              )}

              {user && profile?.role === "athlete" && (
                <Link
                  href="/orders"
                  className="text-sm font-medium text-zinc-700 transition-colors hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-zinc-50"
                >
                  {t("nav.orders")}
                </Link>
              )}
            </nav>
          </div>

          <div className="flex items-center space-x-3">
            <LanguageSelector />
            
            {/* User menu for logged in users */}
            {!loading && user && (
              <div className="hidden md:block">
                <UserMenu profile={profile} user={user} onSignOut={handleSignOut} />
              </div>
            )}

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="rounded-md p-2 text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800 md:hidden"
              aria-label="Menu"
            >
              {mobileMenuOpen ? (
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>
    </header>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Overlay */}
          <div
            className="fixed inset-0 bg-black/50"
            onClick={() => setMobileMenuOpen(false)}
          />
          
          {/* Menu panel */}
          <div className="fixed right-0 top-0 h-full w-80 bg-white dark:bg-zinc-900 shadow-xl">
            <div className="flex h-16 items-center justify-between border-b border-zinc-200 px-4 dark:border-zinc-800">
              <span className="text-xl font-bold text-zinc-900 dark:text-zinc-50">Menu</span>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-md p-2 text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <nav className="flex flex-col space-y-1 p-4">
              {/* Events suchen */}
              <Link
                href="/search"
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-md px-4 py-3 text-base font-medium text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                {t("nav.events")}
              </Link>

              {/* Photographer Navigation */}
              {((profile?.role === "photographer" && profile?.photographer_status === "approved") || profile?.role === "admin") && (
                <>
                  <div className="border-t border-zinc-200 dark:border-zinc-800 mt-2 pt-2">
                    <div className="px-4 pb-2">
                      <p className="text-xs font-semibold uppercase text-zinc-500 dark:text-zinc-400">
                        Fotograf
                      </p>
                    </div>
                    <Link
                      href="/photographer/events"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 rounded-md px-4 py-3 text-base font-medium text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
                    >
                      <span>📸</span>
                      <span>{t("nav.myEvents")}</span>
                    </Link>
                    <Link
                      href="/photographer/sales"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 rounded-md px-4 py-3 text-base font-medium text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
                    >
                      <span>💰</span>
                      <span>{t("nav.sales")}</span>
                    </Link>
                    <Link
                      href="/photographer/analytics"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 rounded-md px-4 py-3 text-base font-medium text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
                    >
                      <span>📊</span>
                      <span>Analytics</span>
                    </Link>
                    <Link
                      href="/photographer/settings"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 rounded-md px-4 py-3 text-base font-medium text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
                    >
                      <span>⚙️</span>
                      <span>Einstellungen</span>
                    </Link>
                  </div>
                </>
              )}

              {/* Admin Navigation */}
              {profile?.role === "admin" && (
                <>
                  <div className="border-t border-zinc-200 dark:border-zinc-800 mt-2 pt-2">
                    <div className="px-4 pb-2">
                      <p className="text-xs font-semibold uppercase text-zinc-500 dark:text-zinc-400">
                        Admin
                      </p>
                    </div>
                    <Link
                      href="/admin/photographers"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 rounded-md px-4 py-3 text-base font-medium text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
                    >
                      <span>👥</span>
                      <span>{t("nav.photographers")}</span>
                    </Link>
                    <Link
                      href="/admin/revenue"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 rounded-md px-4 py-3 text-base font-medium text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
                    >
                      <span>💰</span>
                      <span>{t("nav.revenue")}</span>
                    </Link>
                    <Link
                      href="/admin/analytics"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 rounded-md px-4 py-3 text-base font-medium text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
                    >
                      <span>📈</span>
                      <span>Admin Analytics</span>
                    </Link>
                  </div>
                </>
              )}

              {/* Orders for athletes */}
              {user && profile?.role === "athlete" && (
                <Link
                  href="/orders"
                  onClick={() => setMobileMenuOpen(false)}
                  className="rounded-md px-4 py-3 text-base font-medium text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
                >
                  {t("nav.orders")}
                </Link>
              )}

              {/* User section - only show if logged in */}
              {user && (
                <div className="border-t border-zinc-200 dark:border-zinc-800 mt-4 pt-4">
                  <div className="space-y-1">
                    {profile?.full_name && (
                      <div className="px-4 py-2">
                        <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">{profile.full_name}</p>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">{user.email}</p>
                        {profile?.username && (
                          <Link
                            href={`/${profile.username}`}
                            onClick={() => setMobileMenuOpen(false)}
                            className="mt-1 block text-xs text-blue-600 hover:underline dark:text-blue-400"
                          >
                            sportshots.brainmotion.ai/{profile.username}
                          </Link>
                        )}
                      </div>
                    )}
                    <button
                      onClick={() => {
                        handleSignOut();
                        setMobileMenuOpen(false);
                      }}
                      className="flex w-full items-center gap-2 rounded-md px-4 py-3 text-left text-base font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                    >
                      <span>🚪</span>
                      <span>{t("nav.signOut")}</span>
                    </button>
                  </div>
                </div>
              )}
            </nav>
          </div>
        </div>
      )}
    </>
  );
}


