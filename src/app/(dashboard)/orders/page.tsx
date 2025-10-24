import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function OrdersPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/signin");
  }

  // Get user's purchases
  const { data: purchases } = await supabase
    .from("purchases")
    .select(
      `
      *,
      event:event_id (
        title,
        slug
      ),
      purchase_photos (
        photo:photo_id (
          id,
          original_url,
          watermark_url
        )
      )
    `
    )
    .eq("buyer_id", user.id)
    .order("created_at", { ascending: false });

  const completedPurchases = purchases?.filter((p) => p.status === "completed") || [];
  const totalSpent =
    completedPurchases.reduce((sum, p) => sum + Number(p.total_amount), 0) || 0;
  const totalPhotos =
    completedPurchases.reduce(
      (sum, p) => sum + (p.purchase_photos?.length || 0),
      0
    ) || 0;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
            Meine Bestellungen
          </h1>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            Übersicht über alle deine gekauften Fotos
          </p>
        </div>

        {/* Stats */}
        <div className="mb-8 grid gap-6 md:grid-cols-2">
          <div className="rounded-lg bg-white p-6 shadow dark:bg-zinc-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                  Gekaufte Fotos
                </p>
                <p className="mt-2 text-3xl font-bold text-zinc-900 dark:text-zinc-50">
                  {totalPhotos}
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
                  Gesamt ausgegeben
                </p>
                <p className="mt-2 text-3xl font-bold text-zinc-900 dark:text-zinc-50">
                  {totalSpent.toFixed(2)} €
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
        </div>

        {/* Orders List */}
        {!completedPurchases || completedPurchases.length === 0 ? (
          <div className="rounded-lg border-2 border-dashed border-zinc-300 bg-white p-12 text-center dark:border-zinc-700 dark:bg-zinc-800">
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
              Noch keine Bestellungen
            </h3>
            <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
              Finde deine Events und kaufe deine ersten Fotos
            </p>
            <Link
              href="/search"
              className="mt-6 inline-block rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              Events durchsuchen
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {completedPurchases.map((purchase: any) => (
              <div
                key={purchase.id}
                className="overflow-hidden rounded-lg bg-white shadow dark:bg-zinc-800"
              >
                <div className="border-b border-zinc-200 bg-zinc-50 px-6 py-4 dark:border-zinc-700 dark:bg-zinc-900">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                        {purchase.event?.title || "Event"}
                      </h3>
                      <p className="text-sm text-zinc-600 dark:text-zinc-400">
                        Bestellt am{" "}
                        {new Date(purchase.completed_at || purchase.created_at).toLocaleDateString(
                          "de-DE",
                          {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          }
                        )}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
                        {Number(purchase.total_amount).toFixed(2)} €
                      </p>
                      <p className="text-sm text-zinc-600 dark:text-zinc-400">
                        {purchase.purchase_photos?.length || 0}{" "}
                        {purchase.purchase_photos?.length === 1 ? "Foto" : "Fotos"}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-6">
                  {purchase.purchase_photos && purchase.purchase_photos.length > 0 ? (
                    <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-6">
                      {purchase.purchase_photos.map((pp: any) => (
                        <div
                          key={pp.photo.id}
                          className="group relative aspect-square overflow-hidden rounded-lg bg-zinc-100 dark:bg-zinc-700"
                        >
                          <img
                            src={pp.photo.original_url}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                          <a
                            href={pp.photo.original_url}
                            download
                            className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition-all group-hover:bg-black/50 group-hover:opacity-100"
                          >
                            <svg
                              className="h-8 w-8 text-white"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                              />
                            </svg>
                          </a>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">
                      Keine Fotos verfügbar
                    </p>
                  )}
                </div>

                {purchase.event?.slug && (
                  <div className="border-t border-zinc-200 bg-zinc-50 px-6 py-4 dark:border-zinc-700 dark:bg-zinc-900">
                    <Link
                      href={`/event/${purchase.event.slug}`}
                      className="text-sm font-medium text-zinc-700 hover:underline dark:text-zinc-300"
                    >
                      Weitere Fotos von diesem Event ansehen →
                    </Link>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}


