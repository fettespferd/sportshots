import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function AdminPhotographersPage() {
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

  // Get pending photographer requests
  const { data: pendingRequests } = await supabase
    .from("photographer_requests")
    .select(
      `
      *,
      profiles:user_id (
        email,
        full_name
      )
    `
    )
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  // Get all approved photographers
  const { data: photographers } = await supabase
    .from("profiles")
    .select("*")
    .eq("role", "photographer")
    .order("created_at", { ascending: false });

  const handleApprove = async (requestId: string, userId: string) => {
    "use server";
    const supabase = await createClient();

    const {
      data: { user: currentUser },
    } = await supabase.auth.getUser();

    if (!currentUser) return;

    // Update request status
    await supabase
      .from("photographer_requests")
      .update({
        status: "approved",
        reviewed_by: currentUser.id,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", requestId);

    // Update user role
    await supabase
      .from("profiles")
      .update({
        role: "photographer",
        photographer_status: "approved",
      })
      .eq("id", userId);

    redirect("/admin/photographers");
  };

  const handleReject = async (requestId: string) => {
    "use server";
    const supabase = await createClient();

    const {
      data: { user: currentUser },
    } = await supabase.auth.getUser();

    if (!currentUser) return;

    await supabase
      .from("photographer_requests")
      .update({
        status: "rejected",
        reviewed_by: currentUser.id,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", requestId);

    redirect("/admin/photographers");
  };

  const handleSuspend = async (userId: string) => {
    "use server";
    const supabase = await createClient();

    await supabase
      .from("profiles")
      .update({
        photographer_status: "suspended",
      })
      .eq("id", userId);

    redirect("/admin/photographers");
  };

  const handleActivate = async (userId: string) => {
    "use server";
    const supabase = await createClient();

    await supabase
      .from("profiles")
      .update({
        photographer_status: "approved",
      })
      .eq("id", userId);

    redirect("/admin/photographers");
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
            Fotografen-Verwaltung
          </h1>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            Verwalte Fotografen-Anfragen und bestehende Accounts
          </p>
        </div>

        {/* Pending Requests */}
        {pendingRequests && pendingRequests.length > 0 && (
          <div className="mb-8 rounded-lg bg-white p-6 shadow dark:bg-zinc-800">
            <h2 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              Ausstehende Anfragen ({pendingRequests.length})
            </h2>
            <div className="space-y-4">
              {pendingRequests.map((request: any) => (
                <div
                  key={request.id}
                  className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-700"
                >
                  <div className="mb-3 flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-zinc-900 dark:text-zinc-50">
                        {request.full_name}
                      </h3>
                      <p className="text-sm text-zinc-600 dark:text-zinc-400">
                        {request.email}
                      </p>
                    </div>
                    <span className="rounded-full bg-yellow-100 px-2 py-1 text-xs font-medium text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400">
                      Ausstehend
                    </span>
                  </div>

                  {request.portfolio_link && (
                    <div className="mb-2">
                      <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                        Portfolio:{" "}
                      </span>
                      <a
                        href={request.portfolio_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline dark:text-blue-400"
                      >
                        {request.portfolio_link}
                      </a>
                    </div>
                  )}

                  {request.message && (
                    <div className="mb-3">
                      <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                        Nachricht:{" "}
                      </span>
                      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                        {request.message}
                      </p>
                    </div>
                  )}

                  <div className="flex items-center space-x-3">
                    <form action={handleApprove.bind(null, request.id, request.user_id)}>
                      <button
                        type="submit"
                        className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700"
                      >
                        Genehmigen
                      </button>
                    </form>
                    <form action={handleReject.bind(null, request.id)}>
                      <button
                        type="submit"
                        className="rounded-md border border-red-300 px-4 py-2 text-sm font-medium text-red-700 transition-colors hover:bg-red-50 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-900/20"
                      >
                        Ablehnen
                      </button>
                    </form>
                  </div>

                  <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
                    Eingereicht am{" "}
                    {new Date(request.created_at).toLocaleDateString("de-DE")}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Approved Photographers */}
        <div className="rounded-lg bg-white p-6 shadow dark:bg-zinc-800">
          <h2 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            Fotografen ({photographers?.length || 0})
          </h2>

          {!photographers || photographers.length === 0 ? (
            <p className="text-center text-sm text-zinc-500 dark:text-zinc-400">
              Noch keine Fotografen vorhanden
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-zinc-200 dark:border-zinc-700">
                  <tr>
                    <th className="pb-3 font-medium text-zinc-900 dark:text-zinc-50">
                      Name
                    </th>
                    <th className="pb-3 font-medium text-zinc-900 dark:text-zinc-50">
                      E-Mail
                    </th>
                    <th className="pb-3 font-medium text-zinc-900 dark:text-zinc-50">
                      Status
                    </th>
                    <th className="pb-3 font-medium text-zinc-900 dark:text-zinc-50">
                      Registriert
                    </th>
                    <th className="pb-3 font-medium text-zinc-900 dark:text-zinc-50">
                      Aktionen
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-700">
                  {photographers.map((photographer) => (
                    <tr key={photographer.id}>
                      <td className="py-3 text-zinc-900 dark:text-zinc-50">
                        {photographer.full_name || "-"}
                      </td>
                      <td className="py-3 text-zinc-600 dark:text-zinc-400">
                        {photographer.email}
                      </td>
                      <td className="py-3">
                        <span
                          className={`rounded-full px-2 py-1 text-xs font-medium ${
                            photographer.photographer_status === "approved"
                              ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
                              : "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400"
                          }`}
                        >
                          {photographer.photographer_status === "approved"
                            ? "Aktiv"
                            : "Gesperrt"}
                        </span>
                      </td>
                      <td className="py-3 text-zinc-600 dark:text-zinc-400">
                        {new Date(photographer.created_at).toLocaleDateString(
                          "de-DE"
                        )}
                      </td>
                      <td className="py-3">
                        {photographer.photographer_status === "approved" ? (
                          <form action={handleSuspend.bind(null, photographer.id)}>
                            <button
                              type="submit"
                              className="text-sm text-red-600 hover:underline dark:text-red-400"
                            >
                              Sperren
                            </button>
                          </form>
                        ) : (
                          <form action={handleActivate.bind(null, photographer.id)}>
                            <button
                              type="submit"
                              className="text-sm text-green-600 hover:underline dark:text-green-400"
                            >
                              Aktivieren
                            </button>
                          </form>
                        )}
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


