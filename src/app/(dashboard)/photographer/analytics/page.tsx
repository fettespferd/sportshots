"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { RevenueChart } from "@/components/charts/revenue-chart";
import { SalesChart } from "@/components/charts/sales-chart";
import { format, subDays, eachDayOfInterval } from "date-fns";
import { de } from "date-fns/locale";

export default function PhotographerAnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalPhotos: 0,
    totalSales: 0,
    conversionRate: 0,
    avgPhotoPrice: 0,
  });
  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [eventData, setEventData] = useState<any[]>([]);
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

      // Get all purchases for this photographer
      const { data: purchases } = await supabase
        .from("purchases")
        .select(
          `
          *,
          event:event_id (
            title
          ),
          purchase_photos (
            photo_id
          )
        `
        )
        .eq("photographer_id", user.id)
        .eq("status", "completed");

      // Get total photos uploaded
      const { count: totalPhotos } = await supabase
        .from("photos")
        .select("*", { count: "exact", head: true })
        .eq("photographer_id", user.id);

      // Calculate stats
      const totalRevenue =
        purchases?.reduce((sum, p) => sum + Number(p.photographer_amount), 0) || 0;
      const totalSales = purchases?.length || 0;
      const photosSold =
        purchases?.reduce(
          (sum, p) => sum + (p.purchase_photos?.length || 0),
          0
        ) || 0;
      const conversionRate = totalPhotos
        ? ((photosSold / totalPhotos) * 100).toFixed(1)
        : 0;
      const avgPhotoPrice = photosSold ? (totalRevenue / photosSold).toFixed(2) : 0;

      setStats({
        totalRevenue: Number(totalRevenue.toFixed(2)),
        totalPhotos: totalPhotos || 0,
        totalSales,
        conversionRate: Number(conversionRate),
        avgPhotoPrice: Number(avgPhotoPrice),
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
          dayPurchases?.reduce((sum, p) => sum + Number(p.photographer_amount), 0) ||
          0;

        return {
          date: format(day, "dd. MMM", { locale: de }),
          revenue: Number(revenue.toFixed(2)),
          sales: dayPurchases?.length || 0,
        };
      });

      setRevenueData(revenueByDay);

      // Prepare event data
      const eventMap = new Map<string, { revenue: number; photos: number }>();

      purchases?.forEach((purchase) => {
        const eventName = purchase.event?.title || "Unbekanntes Event";
        const existing = eventMap.get(eventName) || { revenue: 0, photos: 0 };

        eventMap.set(eventName, {
          revenue: existing.revenue + Number(purchase.photographer_amount),
          photos: existing.photos + (purchase.purchase_photos?.length || 0),
        });
      });

      const eventDataArray = Array.from(eventMap.entries())
        .map(([name, data]) => ({
          name: name.length > 20 ? name.substring(0, 20) + "..." : name,
          revenue: Number(data.revenue.toFixed(2)),
          photos: data.photos,
        }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 10);

      setEventData(eventDataArray);
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
            Analytics
          </h1>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            Übersicht über deine Verkäufe und Einnahmen
          </p>
        </div>

        {/* Stats Cards */}
        <div className="mb-8 grid gap-6 md:grid-cols-2 lg:grid-cols-5">
          <div className="rounded-lg bg-white p-6 shadow dark:bg-zinc-800">
            <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
              Gesamtumsatz
            </p>
            <p className="mt-2 text-3xl font-bold text-zinc-900 dark:text-zinc-50">
              {stats.totalRevenue} €
            </p>
          </div>

          <div className="rounded-lg bg-white p-6 shadow dark:bg-zinc-800">
            <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
              Fotos hochgeladen
            </p>
            <p className="mt-2 text-3xl font-bold text-zinc-900 dark:text-zinc-50">
              {stats.totalPhotos}
            </p>
          </div>

          <div className="rounded-lg bg-white p-6 shadow dark:bg-zinc-800">
            <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
              Verkäufe
            </p>
            <p className="mt-2 text-3xl font-bold text-zinc-900 dark:text-zinc-50">
              {stats.totalSales}
            </p>
          </div>

          <div className="rounded-lg bg-white p-6 shadow dark:bg-zinc-800">
            <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
              Konversionsrate
            </p>
            <p className="mt-2 text-3xl font-bold text-zinc-900 dark:text-zinc-50">
              {stats.conversionRate}%
            </p>
          </div>

          <div className="rounded-lg bg-white p-6 shadow dark:bg-zinc-800">
            <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
              Ø Preis/Foto
            </p>
            <p className="mt-2 text-3xl font-bold text-zinc-900 dark:text-zinc-50">
              {stats.avgPhotoPrice} €
            </p>
          </div>
        </div>

        {/* Revenue Chart */}
        <div className="mb-8 rounded-lg bg-white p-6 shadow dark:bg-zinc-800">
          <h2 className="mb-4 text-xl font-semibold text-zinc-900 dark:text-zinc-50">
            Umsatz über Zeit (Letzte 30 Tage)
          </h2>
          <RevenueChart data={revenueData} />
        </div>

        {/* Event Sales Chart */}
        <div className="rounded-lg bg-white p-6 shadow dark:bg-zinc-800">
          <h2 className="mb-4 text-xl font-semibold text-zinc-900 dark:text-zinc-50">
            Top 10 Events nach Umsatz
          </h2>
          {eventData.length > 0 ? (
            <SalesChart data={eventData} />
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


