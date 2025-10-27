"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/modal";

interface PhotographerStats {
  id: string;
  full_name: string;
  email: string;
  username: string | null;
  photographer_status: string;
  stripe_account_id: string | null;
  stripe_onboarding_complete: boolean;
  created_at: string;
  event_count: number;
  photo_count: number;
  total_revenue: number;
  platform_revenue: number;
}

export default function AdminPhotographersPage() {
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [photographers, setPhotographers] = useState<PhotographerStats[]>([]);
  const [selectedPhotographer, setSelectedPhotographer] = useState<PhotographerStats | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: "info" | "success" | "error" | "warning";
  }>({
    isOpen: false,
    title: "",
    message: "",
    type: "info",
  });
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const loadData = async () => {
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

      // Get pending photographer requests
      const { data: pendingData } = await supabase
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

      // Get all photographers with their stats
      const { data: photographersData } = await supabase
        .from("profiles")
        .select("*")
        .eq("role", "photographer")
        .order("created_at", { ascending: false });

      if (photographersData) {
        // Enrich with statistics
        const enrichedPhotographers = await Promise.all(
          photographersData.map(async (photographer) => {
            // Count events
            const { count: eventCount } = await supabase
              .from("events")
              .select("*", { count: "exact", head: true })
              .eq("photographer_id", photographer.id);

            // Count photos
            const { count: photoCount } = await supabase
              .from("photos")
              .select("*", { count: "exact", head: true })
              .eq("photographer_id", photographer.id);

            // Calculate revenue
            const { data: purchases } = await supabase
              .from("purchases")
              .select("total_amount")
              .eq("photographer_id", photographer.id)
              .eq("status", "completed");

            const totalRevenue = purchases?.reduce(
              (sum, purchase) => sum + (purchase.total_amount || 0),
              0
            ) || 0;

            const platformRevenue = totalRevenue * 0.15; // 15% platform fee

            return {
              ...photographer,
              event_count: eventCount || 0,
              photo_count: photoCount || 0,
              total_revenue: totalRevenue,
              platform_revenue: platformRevenue,
            } as PhotographerStats;
          })
        );

        setPhotographers(enrichedPhotographers);
      }

      setPendingRequests(pendingData || []);
      setLoading(false);
    };

    loadData();
  }, []);

  const handleApprove = async (requestId: string) => {
    try {
      const response = await fetch("/api/admin/approve-photographer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId, action: "approved" }),
      });

      if (response.ok) {
        setModalState({
          isOpen: true,
          title: "Erfolg",
          message: "Fotograf wurde erfolgreich freigeschaltet!",
          type: "success",
        });
        // Reload data after modal close
        setTimeout(() => window.location.reload(), 1500);
      } else {
        setModalState({
          isOpen: true,
          title: "Fehler",
          message: "Freischaltung fehlgeschlagen. Bitte versuche es erneut.",
          type: "error",
        });
      }
    } catch (error) {
      console.error("Approval error:", error);
      setModalState({
        isOpen: true,
        title: "Fehler",
        message: "Freischaltung fehlgeschlagen. Bitte versuche es erneut.",
        type: "error",
      });
    }
  };

  const handleReject = async (requestId: string) => {
    try {
      const response = await fetch("/api/admin/approve-photographer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId, action: "rejected" }),
      });

      if (response.ok) {
        setModalState({
          isOpen: true,
          title: "Erfolg",
          message: "Anfrage wurde abgelehnt.",
          type: "success",
        });
        // Reload data after modal close
        setTimeout(() => window.location.reload(), 1500);
      } else {
        setModalState({
          isOpen: true,
          title: "Fehler",
          message: "Ablehnung fehlgeschlagen. Bitte versuche es erneut.",
          type: "error",
        });
      }
    } catch (error) {
      console.error("Rejection error:", error);
      setModalState({
        isOpen: true,
        title: "Fehler",
        message: "Ablehnung fehlgeschlagen. Bitte versuche es erneut.",
        type: "error",
      });
    }
  };

  const handleSuspend = async (userId: string) => {
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          photographer_status: "suspended",
        })
        .eq("id", userId);

      if (error) throw error;

      setModalState({
        isOpen: true,
        title: "Erfolg",
        message: "Fotograf wurde gesperrt.",
        type: "success",
      });
      setTimeout(() => window.location.reload(), 1500);
    } catch (error) {
      console.error("Suspend error:", error);
      setModalState({
        isOpen: true,
        title: "Fehler",
        message: "Sperrung fehlgeschlagen. Bitte versuche es erneut.",
        type: "error",
      });
    }
  };

  const handleActivate = async (userId: string) => {
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          photographer_status: "approved",
        })
        .eq("id", userId);

      if (error) throw error;

      setModalState({
        isOpen: true,
        title: "Erfolg",
        message: "Fotograf wurde aktiviert.",
        type: "success",
      });
      setTimeout(() => window.location.reload(), 1500);
    } catch (error) {
      console.error("Activation error:", error);
      setModalState({
        isOpen: true,
        title: "Fehler",
        message: "Aktivierung fehlgeschlagen. Bitte versuche es erneut.",
        type: "error",
      });
    }
  };

  const handleDelete = async (userId: string, userName: string) => {
    const confirmed = confirm(
      `Account "${userName}" wirklich PERMANENT löschen?\n\n⚠️ WARNUNG: Diese Aktion kann NICHT rückgängig gemacht werden!\n\n` +
      `Folgendes wird gelöscht:\n` +
      `• Account & Profil\n` +
      `• Alle Events\n` +
      `• Alle hochgeladenen Fotos\n` +
      `• Alle Verkäufe & Bestellungen\n\n` +
      `Bist du dir absolut sicher?`
    );

    if (!confirmed) return;

    // Double confirmation
    const doubleConfirm = confirm(
      `Letzte Bestätigung!\n\nAccount "${userName}" wird jetzt PERMANENT gelöscht.`
    );

    if (!doubleConfirm) return;

    try {
      // Delete profile (CASCADE should handle related data)
      const { error } = await supabase
        .from("profiles")
        .delete()
        .eq("id", userId);

      if (error) throw error;

      setModalState({
        isOpen: true,
        title: "Erfolg",
        message: "Account wurde permanent gelöscht.",
        type: "success",
      });
      setTimeout(() => window.location.reload(), 1500);
    } catch (error) {
      console.error("Delete error:", error);
      setModalState({
        isOpen: true,
        title: "Fehler",
        message: "Löschen fehlgeschlagen. Bitte versuche es erneut.",
        type: "error",
      });
    }
  };

  // Filter photographers based on search term
  const filteredPhotographers = photographers.filter((photographer) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      photographer.full_name?.toLowerCase().includes(searchLower) ||
      photographer.email?.toLowerCase().includes(searchLower) ||
      photographer.username?.toLowerCase().includes(searchLower)
    );
  });

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
                    <button
                      onClick={() => handleApprove(request.id)}
                      className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700"
                    >
                      Genehmigen
                    </button>
                    <button
                      onClick={() => handleReject(request.id)}
                      className="rounded-md border border-red-300 px-4 py-2 text-sm font-medium text-red-700 transition-colors hover:bg-red-50 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-900/20"
                    >
                      Ablehnen
                    </button>
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

        {/* Statistics Cards */}
        <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-4">
          <div className="rounded-lg bg-white p-6 shadow dark:bg-zinc-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">Gesamt Fotografen</p>
                <p className="mt-2 text-3xl font-bold text-zinc-900 dark:text-zinc-50">
                  {photographers.length}
                </p>
              </div>
              <div className="rounded-full bg-blue-100 p-3 dark:bg-blue-900/20">
                <svg className="h-6 w-6 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="rounded-lg bg-white p-6 shadow dark:bg-zinc-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">Aktive</p>
                <p className="mt-2 text-3xl font-bold text-green-600 dark:text-green-400">
                  {photographers.filter((p) => p.photographer_status === "approved").length}
                </p>
              </div>
              <div className="rounded-full bg-green-100 p-3 dark:bg-green-900/20">
                <svg className="h-6 w-6 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
          </div>

          <div className="rounded-lg bg-white p-6 shadow dark:bg-zinc-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">Gesamt Events</p>
                <p className="mt-2 text-3xl font-bold text-zinc-900 dark:text-zinc-50">
                  {photographers.reduce((sum, p) => sum + p.event_count, 0)}
                </p>
              </div>
              <div className="rounded-full bg-purple-100 p-3 dark:bg-purple-900/20">
                <svg className="h-6 w-6 text-purple-600 dark:text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="rounded-lg bg-white p-6 shadow dark:bg-zinc-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">Plattform-Umsatz</p>
                <p className="mt-2 text-3xl font-bold text-green-600 dark:text-green-400">
                  {photographers.reduce((sum, p) => sum + p.platform_revenue, 0).toFixed(2)} €
                </p>
              </div>
              <div className="rounded-full bg-green-100 p-3 dark:bg-green-900/20">
                <svg className="h-6 w-6 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="mb-6 rounded-lg bg-white p-4 shadow dark:bg-zinc-800">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="🔍 Suche nach Name, E-Mail oder Username..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm text-zinc-900 placeholder:text-zinc-500 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-100 dark:placeholder:text-zinc-400"
              />
            </div>
          </div>
        </div>

        {/* Photographers Table */}
        <div className="rounded-lg bg-white p-6 shadow dark:bg-zinc-800">
          <h2 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            Fotografen ({filteredPhotographers.length})
          </h2>

          {filteredPhotographers.length === 0 ? (
            <p className="text-center text-sm text-zinc-500 dark:text-zinc-400">
              Keine Fotografen gefunden
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
                      Username
                    </th>
                    <th className="pb-3 font-medium text-zinc-900 dark:text-zinc-50">
                      Status
                    </th>
                    <th className="pb-3 font-medium text-zinc-900 dark:text-zinc-50">
                      Events
                    </th>
                    <th className="pb-3 font-medium text-zinc-900 dark:text-zinc-50">
                      Fotos
                    </th>
                    <th className="pb-3 font-medium text-zinc-900 dark:text-zinc-50">
                      Umsatz (15%)
                    </th>
                    <th className="pb-3 font-medium text-zinc-900 dark:text-zinc-50">
                      Stripe
                    </th>
                    <th className="pb-3 font-medium text-zinc-900 dark:text-zinc-50">
                      Aktionen
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-700">
                  {filteredPhotographers.map((photographer) => (
                    <tr key={photographer.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-700/50">
                      <td className="py-3">
                        <div>
                          <div className="font-medium text-zinc-900 dark:text-zinc-50">
                            {photographer.full_name || "-"}
                          </div>
                          <div className="text-xs text-zinc-500 dark:text-zinc-400">
                            {photographer.email}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 text-zinc-600 dark:text-zinc-400">
                        {photographer.username ? (
                          <a
                            href={`/${photographer.username}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline dark:text-blue-400"
                          >
                            @{photographer.username}
                          </a>
                        ) : (
                          <span className="text-zinc-400 dark:text-zinc-500">-</span>
                        )}
                      </td>
                      <td className="py-3">
                        <span
                          className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                            photographer.photographer_status === "approved"
                              ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
                              : "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400"
                          }`}
                        >
                          {photographer.photographer_status === "approved"
                            ? "✓ Aktiv"
                            : "✗ Gesperrt"}
                        </span>
                      </td>
                      <td className="py-3 text-zinc-900 dark:text-zinc-50">
                        {photographer.event_count}
                      </td>
                      <td className="py-3 text-zinc-900 dark:text-zinc-50">
                        {photographer.photo_count}
                      </td>
                      <td className="py-3 font-medium text-green-600 dark:text-green-400">
                        {photographer.platform_revenue.toFixed(2)} €
                      </td>
                      <td className="py-3">
                        {photographer.stripe_onboarding_complete ? (
                          <span className="inline-flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            Aktiv
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs text-zinc-400 dark:text-zinc-500">
                            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                            Nicht aktiv
                          </span>
                        )}
                      </td>
                      <td className="py-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setSelectedPhotographer(photographer);
                              setShowDetailModal(true);
                            }}
                            className="text-sm text-blue-600 hover:underline dark:text-blue-400"
                          >
                            Details
                          </button>
                          {photographer.photographer_status === "approved" ? (
                            <button
                              onClick={() => handleSuspend(photographer.id)}
                              className="text-sm text-orange-600 hover:underline dark:text-orange-400"
                            >
                              Sperren
                            </button>
                          ) : (
                            <button
                              onClick={() => handleActivate(photographer.id)}
                              className="text-sm text-green-600 hover:underline dark:text-green-400"
                            >
                              Aktivieren
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(photographer.id, photographer.full_name || photographer.email)}
                            className="text-sm text-red-600 hover:underline dark:text-red-400"
                          >
                            Löschen
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedPhotographer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-lg bg-white p-6 shadow-xl dark:bg-zinc-800">
            {/* Header */}
            <div className="mb-6 flex items-start justify-between border-b border-zinc-200 pb-4 dark:border-zinc-700">
              <div>
                <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                  {selectedPhotographer.full_name}
                </h2>
                <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                  {selectedPhotographer.email}
                </p>
                {selectedPhotographer.username && (
                  <a
                    href={`/${selectedPhotographer.username}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 inline-block text-sm text-blue-600 hover:underline dark:text-blue-400"
                  >
                    sportshots.brainmotion.ai/{selectedPhotographer.username}
                  </a>
                )}
              </div>
              <button
                onClick={() => setShowDetailModal(false)}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
              >
                ✕
              </button>
            </div>

            {/* Statistics Grid */}
            <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
              <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-900">
                <p className="text-xs text-zinc-600 dark:text-zinc-400">Events</p>
                <p className="mt-1 text-2xl font-bold text-zinc-900 dark:text-zinc-50">
                  {selectedPhotographer.event_count}
                </p>
              </div>
              <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-900">
                <p className="text-xs text-zinc-600 dark:text-zinc-400">Hochgeladene Fotos</p>
                <p className="mt-1 text-2xl font-bold text-zinc-900 dark:text-zinc-50">
                  {selectedPhotographer.photo_count}
                </p>
              </div>
              <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-900">
                <p className="text-xs text-zinc-600 dark:text-zinc-400">Gesamtumsatz</p>
                <p className="mt-1 text-2xl font-bold text-green-600 dark:text-green-400">
                  {selectedPhotographer.total_revenue.toFixed(2)} €
                </p>
              </div>
              <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-900">
                <p className="text-xs text-zinc-600 dark:text-zinc-400">Plattform (15%)</p>
                <p className="mt-1 text-2xl font-bold text-green-600 dark:text-green-400">
                  {selectedPhotographer.platform_revenue.toFixed(2)} €
                </p>
              </div>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {/* Account Information */}
              <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-900">
                <h3 className="mb-3 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                  📋 Account-Informationen
                </h3>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium text-zinc-700 dark:text-zinc-300">Status:</span>
                    <span className={`ml-2 ${
                      selectedPhotographer.photographer_status === "approved"
                        ? "text-green-600 dark:text-green-400"
                        : "text-red-600 dark:text-red-400"
                    }`}>
                      {selectedPhotographer.photographer_status === "approved" ? "✓ Aktiv" : "✗ Gesperrt"}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-zinc-700 dark:text-zinc-300">Registriert:</span>
                    <span className="ml-2 text-zinc-900 dark:text-zinc-100">
                      {new Date(selectedPhotographer.created_at).toLocaleDateString("de-DE", {
                        year: "numeric",
                        month: "long",
                        day: "numeric"
                      })}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-zinc-700 dark:text-zinc-300">User ID:</span>
                    <span className="ml-2 font-mono text-xs text-zinc-600 dark:text-zinc-400">
                      {selectedPhotographer.id}
                    </span>
                  </div>
                </div>
              </div>

              {/* Payment Information */}
              <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-900">
                <h3 className="mb-3 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                  💳 Zahlungsinformationen
                </h3>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium text-zinc-700 dark:text-zinc-300">Stripe Connect:</span>
                    <span className={`ml-2 ${
                      selectedPhotographer.stripe_onboarding_complete
                        ? "text-green-600 dark:text-green-400"
                        : "text-red-600 dark:text-red-400"
                    }`}>
                      {selectedPhotographer.stripe_onboarding_complete ? "✓ Aktiv" : "✗ Nicht eingerichtet"}
                    </span>
                  </div>
                  {selectedPhotographer.stripe_account_id && (
                    <div>
                      <span className="font-medium text-zinc-700 dark:text-zinc-300">Stripe Account ID:</span>
                      <div className="mt-1 font-mono text-xs text-zinc-600 dark:text-zinc-400 break-all">
                        {selectedPhotographer.stripe_account_id}
                      </div>
                    </div>
                  )}
                  <div className="mt-3 pt-3 border-t border-zinc-200 dark:border-zinc-700">
                    <span className="font-medium text-zinc-700 dark:text-zinc-300">Fotografen-Anteil (85%):</span>
                    <span className="ml-2 font-bold text-zinc-900 dark:text-zinc-100">
                      {(selectedPhotographer.total_revenue * 0.85).toFixed(2)} €
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-6 flex gap-3 border-t border-zinc-200 pt-4 dark:border-zinc-700">
              {selectedPhotographer.photographer_status === "approved" ? (
                <button
                  onClick={() => {
                    handleSuspend(selectedPhotographer.id);
                    setShowDetailModal(false);
                  }}
                  className="rounded-md bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700"
                >
                  🚫 Fotograf sperren
                </button>
              ) : (
                <button
                  onClick={() => {
                    handleActivate(selectedPhotographer.id);
                    setShowDetailModal(false);
                  }}
                  className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
                >
                  ✓ Fotograf aktivieren
                </button>
              )}
              <button
                onClick={() => {
                  setShowDetailModal(false);
                  handleDelete(selectedPhotographer.id, selectedPhotographer.full_name || selectedPhotographer.email);
                }}
                className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
              >
                🗑️ Account löschen
              </button>
              <button
                onClick={() => setShowDetailModal(false)}
                className="flex-1 rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-700"
              >
                Schließen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Status Modal */}
      <Modal
        isOpen={modalState.isOpen}
        onClose={() => setModalState({ ...modalState, isOpen: false })}
        title={modalState.title}
        message={modalState.message}
        type={modalState.type}
      />
    </div>
  );
}


