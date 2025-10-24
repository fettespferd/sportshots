import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function PhotographerSalesPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/signin");
  }

  // Get photographer's sales
  const { data: sales } = await supabase
    .from("purchases")
    .select(
      `
      *,
      event:event_id (
        title
      ),
      buyer:buyer_id (
        full_name,
        email
      )
    `
    )
    .eq("photographer_id", user.id)
    .eq("status", "completed")
    .order("completed_at", { ascending: false });

  const totalRevenue =
    sales?.reduce((sum, s) => sum + Number(s.photographer_amount), 0) || 0;
  const totalSales = sales?.length || 0;
  const totalPhotos =
    sales?.reduce((sum, s) => sum + (s.photo_ids?.length || 0), 0) || 0;

  // Get sales by event
  const salesByEvent = sales?.reduce((acc: any, sale: any) => {
    const eventId = sale.event_id;
    if (!acc[eventId]) {
      acc[eventId] = {
        eventTitle: sale.event?.title || "Unbekannt",
        count: 0,
        revenue: 0,
      };
    }
    acc[eventId].count += 1;
    acc[eventId].revenue += Number(sale.photographer_amount);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
            Meine Verkäufe
          </h1>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            Übersicht über deine Einnahmen und verkaufte Fotos
          </p>
        </div>

        {/* Stats Cards */}
        <div className="mb-8 grid gap-6 md:grid-cols-3">
          <div className="rounded-lg bg-white p-6 shadow dark:bg-zinc-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                  Gesamteinnahmen
                </p>
                <p className="mt-2 text-3xl font-bold text-zinc-900 dark:text-zinc-50">
                  {totalRevenue.toFixed(2)} €
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
            <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
              Nach 15% Plattform-Gebühr
            </p>
          </div>

          <div className="rounded-lg bg-white p-6 shadow dark:bg-zinc-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                  Verkäufe
                </p>
                <p className="mt-2 text-3xl font-bold text-zinc-900 dark:text-zinc-50">
                  {totalSales}
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
                    d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              </div>
            </div>
            <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
              Transaktionen gesamt
            </p>
          </div>

          <div className="rounded-lg bg-white p-6 shadow dark:bg-zinc-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                  Verkaufte Fotos
                </p>
                <p className="mt-2 text-3xl font-bold text-zinc-900 dark:text-zinc-50">
                  {totalPhotos}
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
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
            </div>
            <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
              Einzelne Foto-Verkäufe
            </p>
          </div>
        </div>

        {/* Sales by Event */}
        {salesByEvent && Object.keys(salesByEvent).length > 0 && (
          <div className="mb-8 rounded-lg bg-white p-6 shadow dark:bg-zinc-800">
            <h2 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              Verkäufe nach Event
            </h2>
            <div className="space-y-4">
              {Object.entries(salesByEvent).map(([eventId, data]: [string, any]) => (
                <div
                  key={eventId}
                  className="flex items-center justify-between rounded-lg border border-zinc-200 p-4 dark:border-zinc-700"
                >
                  <div>
                    <h3 className="font-medium text-zinc-900 dark:text-zinc-50">
                      {data.eventTitle}
                    </h3>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">
                      {data.count} {data.count === 1 ? "Verkauf" : "Verkäufe"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
                      {data.revenue.toFixed(2)} €
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Sales */}
        <div className="rounded-lg bg-white p-6 shadow dark:bg-zinc-800">
          <h2 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            Letzte Verkäufe
          </h2>

          {!sales || sales.length === 0 ? (
            <div className="rounded-lg border-2 border-dashed border-zinc-300 p-12 text-center dark:border-zinc-700">
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
                  d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                />
              </svg>
              <h3 className="mt-4 text-lg font-medium text-zinc-900 dark:text-zinc-50">
                Noch keine Verkäufe
              </h3>
              <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
                Deine ersten Verkäufe werden hier angezeigt
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-zinc-200 dark:border-zinc-700">
                  <tr>
                    <th className="pb-3 font-medium text-zinc-900 dark:text-zinc-50">
                      Datum
                    </th>
                    <th className="pb-3 font-medium text-zinc-900 dark:text-zinc-50">
                      Event
                    </th>
                    <th className="pb-3 font-medium text-zinc-900 dark:text-zinc-50">
                      Käufer
                    </th>
                    <th className="pb-3 font-medium text-zinc-900 dark:text-zinc-50">
                      Fotos
                    </th>
                    <th className="pb-3 font-medium text-zinc-900 dark:text-zinc-50">
                      Betrag
                    </th>
                    <th className="pb-3 font-medium text-zinc-900 dark:text-zinc-50">
                      Dein Anteil
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-700">
                  {sales.map((sale: any) => (
                    <tr key={sale.id}>
                      <td className="py-3 text-zinc-600 dark:text-zinc-400">
                        {new Date(
                          sale.completed_at || sale.created_at
                        ).toLocaleDateString("de-DE")}
                      </td>
                      <td className="py-3 text-zinc-900 dark:text-zinc-50">
                        {sale.event?.title || "-"}
                      </td>
                      <td className="py-3 text-zinc-600 dark:text-zinc-400">
                        {sale.buyer?.full_name || sale.buyer?.email || "-"}
                      </td>
                      <td className="py-3 text-zinc-600 dark:text-zinc-400">
                        {sale.photo_ids?.length || 0}
                      </td>
                      <td className="py-3 text-zinc-900 dark:text-zinc-50">
                        {Number(sale.total_amount).toFixed(2)} €
                      </td>
                      <td className="py-3 font-medium text-green-600 dark:text-green-400">
                        {Number(sale.photographer_amount).toFixed(2)} €
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


