"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";

interface Profile {
  role: string;
  photographer_status: string | null;
  full_name: string | null;
}

export function Header() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
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
          .select("role, photographer_status, full_name")
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

            <nav className="hidden space-x-6 md:flex">
              <Link
                href="/search"
                className="text-sm font-medium text-zinc-700 transition-colors hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-zinc-50"
              >
                Events suchen
              </Link>

              {((profile?.role === "photographer" &&
                profile?.photographer_status === "approved") ||
                profile?.role === "admin") && (
                <>
                  <Link
                    href="/photographer/events"
                    className="text-sm font-medium text-zinc-700 transition-colors hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-zinc-50"
                  >
                    Meine Events
                  </Link>
                  <Link
                    href="/photographer/sales"
                    className="text-sm font-medium text-zinc-700 transition-colors hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-zinc-50"
                  >
                    Verkäufe
                  </Link>
                  <Link
                    href="/photographer/analytics"
                    className="text-sm font-medium text-zinc-700 transition-colors hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-zinc-50"
                  >
                    Analytics
                  </Link>
                </>
              )}

              {profile?.role === "admin" && (
                <>
                  <Link
                    href="/admin/photographers"
                    className="text-sm font-medium text-zinc-700 transition-colors hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-zinc-50"
                  >
                    Fotografen
                  </Link>
                  <Link
                    href="/admin/revenue"
                    className="text-sm font-medium text-zinc-700 transition-colors hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-zinc-50"
                  >
                    Umsatz
                  </Link>
                  <Link
                    href="/admin/analytics"
                    className="text-sm font-medium text-zinc-700 transition-colors hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-zinc-50"
                  >
                    Analytics
                  </Link>
                </>
              )}

              {user && profile?.role === "athlete" && (
                <Link
                  href="/orders"
                  className="text-sm font-medium text-zinc-700 transition-colors hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-zinc-50"
                >
                  Meine Bestellungen
                </Link>
              )}
            </nav>
          </div>

          <div className="flex items-center space-x-4">
            {loading ? (
              <div className="h-4 w-16 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700"></div>
            ) : user ? (
              <div className="flex items-center space-x-4">
                {profile?.full_name && (
                  <span className="hidden text-sm text-zinc-700 dark:text-zinc-300 sm:block">
                    {profile.full_name}
                  </span>
                )}
                <button
                  onClick={handleSignOut}
                  className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800"
                >
                  Abmelden
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <span className="hidden text-xs text-zinc-500 dark:text-zinc-400 lg:block">
                  Fotograf?
                </span>
                <Link
                  href="/signin"
                  className="text-sm font-medium text-zinc-700 transition-colors hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-zinc-50"
                >
                  Anmelden
                </Link>
                <Link
                  href="/signup"
                  className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
                >
                  Registrieren
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}


