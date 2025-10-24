"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { RevenueChart } from "@/components/charts/revenue-chart";
import { SalesChart } from "@/components/charts/sales-chart";
import { format, subDays, eachDayOfInterval } from "date-fns";
import { de } from "date-fns/locale";

export default function AdminAnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalRevenue: 0,
    platformRevenue: 0,
    totalPhotographers: 0,
    totalEvents: 0,
    totalPhotos: 0,
    totalSales: 0,
  });
  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [photographerData, setPhotographerData] = useState<any[]>([]);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const loadAnalytics = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/signin");
        return;
      }

      // Check admin role
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (profile?.role !== "admin") {
        router.push("/");
        return;
      }

      // Get all purchases
      const { data: purchases } = await supabase
        .from("purchases")
        .select(
          `
          *,
          photographer:photographer_id (
            full_name
          )
        `
        )
        .eq("status", "completed");

      // Get counts
      const { count: totalPhotographers } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .eq("role", "photographer")
        .eq("photographer_status", "approved");

      const { count: totalEvents } = await supabase
        .from("events")
        .select("*", { count: "exact", head: true });

      const { count: totalPhotos } = await supabase
        .from("photos")
        .select("*", { count: "exact", head: true });

      // Calculate stats
      const totalRevenue =
        purchases?.reduce((sum, p) => sum + Number(p.total_amount), 0) || 0;
      const platformRevenue =
        purchases?.reduce((sum, p) => sum + Number(p.platform_fee), 0) || 0;
      const totalSales = purchases?.length || 0;

      setStats({
        totalRevenue: Number(totalRevenue.toFixed(2)),
        platformRevenue: Number(platformRevenue.toFixed(2)),
        totalPhotographers: totalPhotographers || 0,
        totalEvents: totalEvents || 0,
        totalPhotos: totalPhotos || 0,
        totalSales,
      });

      // Prepare revenue over time data (last 30 days)
      const last30Days = eachDayOfInterval({
        start: subDays(new Date(), 29),
        end: new Date(),
      });

      const revenueByDay = last30Days.map((day) => {
        const dayString = format(day, "yyyy-MM-dd");
        const dayPurchases = purchases?.filter(
          (p) =>
            format(new Date(p.completed_at || p.created_at), "yyyy-MM-dd") ===
            dayString
        );
        const revenue =
          dayPurchases?.reduce((sum, p) => sum + Number(p.total_amount), 0) || 0;

        return {
          date: format(day, "dd. MMM", { locale: de }),
          revenue: Number(revenue.toFixed(2)),
          sales: dayPurchases?.length || 0,
        };
      });

      setRevenueData(revenueByDay);

      // Prepare top photographers data
      const photographerMap = new Map<
        string,
        { revenue: number; photos: number }
      >();

      purchases?.forEach((purchase) => {
        const photographerName =
          purchase.photographer?.full_name || "Unbekannter Fotograf";
        const existing = photographerMap.get(photographerName) || {
          revenue: 0,
          photos: 0,
        };

        photographerMap.set(photographerName, {
          revenue: existing.revenue + Number(purchase.photographer_amount),
          photos: existing.photos + (purchase.photo_ids?.length || 0),
        });
      });

      const photographerDataArray = Array.from(photographerMap.entries())
        .map(([name, data]) => ({
          name: name.length > 20 ? name.substring(0, 20) + "..." : name,
          revenue: Number(data.revenue.toFixed(2)),
          photos: data.photos,
        }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 10);

      setPhotographerData(photographerDataArray);
      setLoading(false);
    };

    loadAnalytics();
  }, []);

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
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
            Plattform-Analytics
          </h1>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            Übersicht über alle Aktivitäten auf der Plattform
          </p>
        </div>

        {/* Stats Cards */}
        <div className="mb-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-lg bg-white p-6 shadow dark:bg-zinc-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                  Plattform-Umsatz
                </p>
                <p className="mt-2 text-3xl font-bold text-green-600 dark:text-green-400">
                  {stats.platformRevenue} €
                </p>
                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                  von {stats.totalRevenue} € Gesamtumsatz
                </p>
              </div>
              <div className="rounded-full bg-green-100 p-3 dark:bg-green-900/20">
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
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
            </div>
          </div>

          <div className="rounded-lg bg-white p-6 shadow dark:bg-zinc-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                  Fotografen
                </p>
                <p className="mt-2 text-3xl font-bold text-zinc-900 dark:text-zinc-50">
                  {stats.totalPhotographers}
                </p>
                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                  aktive Fotografen
                </p>
              </div>
              <div className="rounded-full bg-blue-100 p-3 dark:bg-blue-900/20">
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
                    d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              </div>
            </div>
          </div>

          <div className="rounded-lg bg-white p-6 shadow dark:bg-zinc-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                  Events
                </p>
                <p className="mt-2 text-3xl font-bold text-zinc-900 dark:text-zinc-50">
                  {stats.totalEvents}
                </p>
                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                  veröffentlichte Events
                </p>
              </div>
              <div className="rounded-full bg-purple-100 p-3 dark:bg-purple-900/20">
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
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
            </div>
          </div>

          <div className="rounded-lg bg-white p-6 shadow dark:bg-zinc-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                  Fotos
                </p>
                <p className="mt-2 text-3xl font-bold text-zinc-900 dark:text-zinc-50">
                  {stats.totalPhotos}
                </p>
                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                  hochgeladene Fotos
                </p>
              </div>
              <div className="rounded-full bg-orange-100 p-3 dark:bg-orange-900/20">
                <svg
                  className="h-6 w-6 text-orange-600 dark:text-orange-400"
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
            </div>
          </div>

          <div className="rounded-lg bg-white p-6 shadow dark:bg-zinc-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                  Verkäufe
                </p>
                <p className="mt-2 text-3xl font-bold text-zinc-900 dark:text-zinc-50">
                  {stats.totalSales}
                </p>
                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                  abgeschlossene Käufe
                </p>
              </div>
              <div className="rounded-full bg-pink-100 p-3 dark:bg-pink-900/20">
                <svg
                  className="h-6 w-6 text-pink-600 dark:text-pink-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                  />
                </svg>
              </div>
            </div>
          </div>

          <div className="rounded-lg bg-white p-6 shadow dark:bg-zinc-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                  Gesamtumsatz
                </p>
                <p className="mt-2 text-3xl font-bold text-zinc-900 dark:text-zinc-50">
                  {stats.totalRevenue} €
                </p>
                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                  alle Transaktionen
                </p>
              </div>
              <div className="rounded-full bg-indigo-100 p-3 dark:bg-indigo-900/20">
                <svg
                  className="h-6 w-6 text-indigo-600 dark:text-indigo-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Revenue Chart */}
        <div className="mb-8 rounded-lg bg-white p-6 shadow dark:bg-zinc-800">
          <h2 className="mb-4 text-xl font-semibold text-zinc-900 dark:text-zinc-50">
            Plattform-Umsatz über Zeit (Letzte 30 Tage)
          </h2>
          <RevenueChart data={revenueData} />
        </div>

        {/* Top Photographers Chart */}
        <div className="rounded-lg bg-white p-6 shadow dark:bg-zinc-800">
          <h2 className="mb-4 text-xl font-semibold text-zinc-900 dark:text-zinc-50">
            Top 10 Fotografen nach Umsatz
          </h2>
          {photographerData.length > 0 ? (
            <SalesChart data={photographerData} />
          ) : (
            <div className="flex h-80 items-center justify-center text-zinc-500 dark:text-zinc-400">
              Noch keine Verkäufe vorhanden
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


