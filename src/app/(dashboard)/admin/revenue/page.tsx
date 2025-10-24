import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function AdminRevenuePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/signin");
  }

  // Check admin role
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    redirect("/");
  }

  // Get all completed purchases
  const { data: purchases } = await supabase
    .from("purchases")
    .select(
      `
      *,
      buyer:buyer_id (
        full_name,
        email
      ),
      photographer:photographer_id (
        full_name,
        email
      ),
      event:event_id (
        title
      )
    `
    )
    .eq("status", "completed")
    .order("completed_at", { ascending: false });

  const totalRevenue =
    purchases?.reduce((sum, p) => sum + Number(p.total_amount), 0) || 0;
  const platformRevenue =
    purchases?.reduce((sum, p) => sum + Number(p.platform_fee), 0) || 0;
  const photographerPayouts =
    purchases?.reduce((sum, p) => sum + Number(p.photographer_amount), 0) || 0;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
            Umsatz-Übersicht
          </h1>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            Plattform-Einnahmen und Fotografen-Auszahlungen
          </p>
        </div>

        {/* Stats Cards */}
        <div className="mb-8 grid gap-6 md:grid-cols-3">
          <div className="rounded-lg bg-white p-6 shadow dark:bg-zinc-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                  Gesamtumsatz
                </p>
                <p className="mt-2 text-3xl font-bold text-zinc-900 dark:text-zinc-50">
                  {totalRevenue.toFixed(2)} €
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
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
            </div>
            <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
              {purchases?.length || 0} Transaktionen
            </p>
          </div>

          <div className="rounded-lg bg-white p-6 shadow dark:bg-zinc-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                  Plattform-Einnahmen
                </p>
                <p className="mt-2 text-3xl font-bold text-zinc-900 dark:text-zinc-50">
                  {platformRevenue.toFixed(2)} €
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
                    d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                  />
                </svg>
              </div>
            </div>
            <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
              15% Provision
            </p>
          </div>

          <div className="rounded-lg bg-white p-6 shadow dark:bg-zinc-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                  Fotografen-Auszahlungen
                </p>
                <p className="mt-2 text-3xl font-bold text-zinc-900 dark:text-zinc-50">
                  {photographerPayouts.toFixed(2)} €
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
                    d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              </div>
            </div>
            <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
              85% an Fotografen
            </p>
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="rounded-lg bg-white p-6 shadow dark:bg-zinc-800">
          <h2 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            Letzte Transaktionen
          </h2>

          {!purchases || purchases.length === 0 ? (
            <p className="text-center text-sm text-zinc-500 dark:text-zinc-400">
              Noch keine Transaktionen vorhanden
            </p>
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
                      Fotograf
                    </th>
                    <th className="pb-3 font-medium text-zinc-900 dark:text-zinc-50">
                      Gesamt
                    </th>
                    <th className="pb-3 font-medium text-zinc-900 dark:text-zinc-50">
                      Provision
                    </th>
                    <th className="pb-3 font-medium text-zinc-900 dark:text-zinc-50">
                      Auszahlung
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-700">
                  {purchases.map((purchase: any) => (
                    <tr key={purchase.id}>
                      <td className="py-3 text-zinc-600 dark:text-zinc-400">
                        {purchase.completed_at
                          ? new Date(purchase.completed_at).toLocaleDateString(
                              "de-DE"
                            )
                          : "-"}
                      </td>
                      <td className="py-3 text-zinc-900 dark:text-zinc-50">
                        {purchase.event?.title || "-"}
                      </td>
                      <td className="py-3 text-zinc-600 dark:text-zinc-400">
                        {purchase.buyer?.full_name || purchase.buyer?.email || "-"}
                      </td>
                      <td className="py-3 text-zinc-600 dark:text-zinc-400">
                        {purchase.photographer?.full_name ||
                          purchase.photographer?.email ||
                          "-"}
                      </td>
                      <td className="py-3 font-medium text-zinc-900 dark:text-zinc-50">
                        {Number(purchase.total_amount).toFixed(2)} €
                      </td>
                      <td className="py-3 text-green-600 dark:text-green-400">
                        {Number(purchase.platform_fee).toFixed(2)} €
                      </td>
                      <td className="py-3 text-zinc-900 dark:text-zinc-50">
                        {Number(purchase.photographer_amount).toFixed(2)} €
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


