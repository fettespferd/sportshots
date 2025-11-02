"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import QRCode from "qrcode";

interface DynamicQRCode {
  id: string;
  photographer_id: string;
  code: string;
  event_id: string | null;
  created_at: string;
  updated_at: string;
}

interface Event {
  id: string;
  title: string;
  slug: string;
  event_date: string;
  location: string;
}

export default function QRCodeManagementPage() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [qrCode, setQrCode] = useState<DynamicQRCode | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [qrGenerated, setQrGenerated] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [notification, setNotification] = useState<{
    type: "success" | "error";
    message: string;
  }>({ type: "success", message: "" });

  useEffect(() => {
    const loadData = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/signin");
        return;
      }

      // Check if user is photographer or admin
      const { data: profile } = await supabase
        .from("profiles")
        .select("role, photographer_status")
        .eq("id", user.id)
        .single();

      if (
        !profile ||
        (profile.role !== "admin" &&
          (profile.role !== "photographer" ||
            profile.photographer_status !== "approved"))
      ) {
        router.push("/");
        return;
      }

      // Load QR code
      let { data: qrData } = await supabase
        .from("dynamic_qr_codes")
        .select("*")
        .eq("photographer_id", user.id)
        .single();

      // Auto-create QR code if it doesn't exist
      if (!qrData) {
        // Get profile for code generation
        const { data: profile } = await supabase
          .from("profiles")
          .select("username, full_name")
          .eq("id", user.id)
          .single();

        const baseCode = profile?.username || profile?.full_name || user.id.slice(0, 8);
        const code = `qr-${baseCode.toLowerCase().replace(/[^a-z0-9]/g, "-")}-${Date.now().toString().slice(-6)}`;

        const { data: newQrCode, error: createError } = await supabase
          .from("dynamic_qr_codes")
          .insert({
            photographer_id: user.id,
            code: code,
            event_id: null,
          })
          .select()
          .single();

        if (createError) {
          console.error("Error auto-creating QR code:", createError);
        } else {
          qrData = newQrCode;
        }
      }

      if (qrData) {
        setQrCode(qrData);
        setSelectedEventId(qrData.event_id || "");
      }

      // Load events
      const { data: eventsData } = await supabase
        .from("events")
        .select("id, title, slug, event_date, location")
        .eq("photographer_id", user.id)
        .order("event_date", { ascending: false });

      if (eventsData) {
        setEvents(eventsData);
      }

      setLoading(false);
    };

    loadData();
  }, [router, supabase]);

  useEffect(() => {
    if (!qrCode) return;

    const generateQRCode = () => {
      if (!canvasRef.current) {
        // Retry if canvas is not ready yet
        setTimeout(generateQRCode, 50);
        return;
      }

      const qrUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/qr/${qrCode.code}`;
      
      // Clear canvas first
      const ctx = canvasRef.current.getContext("2d");
      if (ctx) {
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      }

      QRCode.toCanvas(
        canvasRef.current,
        qrUrl,
        {
          width: 300,
          margin: 2,
          color: {
            dark: "#000000",
            light: "#ffffff",
          },
        },
        (error) => {
          if (error) {
            console.error("QR Code generation error:", error);
            setQrGenerated(false);
          } else {
            setQrGenerated(true);
          }
        }
      );
    };

    // Small delay to ensure canvas is rendered
    const timer = setTimeout(generateQRCode, 100);

    return () => clearTimeout(timer);
  }, [qrCode]);


  const showNotificationMessage = (type: "success" | "error", message: string, duration = 3000) => {
    setNotification({ type, message });
    setShowNotification(true);
    setTimeout(() => setShowNotification(false), duration);
  };

  const handleUpdateEvent = async () => {
    if (!qrCode) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from("dynamic_qr_codes")
        .update({
          event_id: selectedEventId || null,
        })
        .eq("id", qrCode.id);

      if (error) throw error;

      setQrCode({ ...qrCode, event_id: selectedEventId || null });
      showNotificationMessage("success", "✅ Event erfolgreich zugewiesen!");
    } catch (error: any) {
      console.error("Error updating QR code:", error);
      showNotificationMessage("error", "Fehler beim Aktualisieren: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  const downloadQRCode = () => {
    if (canvasRef.current) {
      const url = canvasRef.current.toDataURL("image/png");
      const link = document.createElement("a");
      link.download = `qr-code-${qrCode?.code}.png`;
      link.href = url;
      link.click();
    }
  };

  const qrUrl = qrCode
    ? `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/qr/${qrCode.code}`
    : "";

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-900">
        <div className="text-lg text-zinc-600 dark:text-zinc-400">Laden...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 md:text-3xl">
            Dynamischer QR-Code
          </h1>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            Dein QR-Code wurde automatisch erstellt. Weise einfach ein Event zu, um zu beginnen.
          </p>
        </div>

        {qrCode && (
          <div className="space-y-6">
            {/* QR Code Display */}
            <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-700 dark:bg-zinc-800">
              <h2 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                Dein QR-Code
              </h2>

              <div className="mb-4 rounded-lg bg-zinc-50 p-4 dark:bg-zinc-900">
                <p className="mb-2 text-sm text-zinc-600 dark:text-zinc-400">
                  QR-Code URL:
                </p>
                <code className="block rounded bg-zinc-100 p-2 text-xs text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100 break-all">
                  {qrUrl}
                </code>
              </div>

              <div className="mb-4 flex justify-center">
                <div className="rounded-lg border-4 border-zinc-200 bg-white p-4 dark:border-zinc-700">
                  <canvas ref={canvasRef} width={300} height={300} key={qrCode?.id} />
                </div>
              </div>

              <button
                onClick={downloadQRCode}
                disabled={!qrGenerated}
                className="w-full rounded-md bg-blue-600 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
              >
                📥 QR-Code herunterladen (PNG)
              </button>
            </div>

            {/* Event Assignment */}
            <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-700 dark:bg-zinc-800">
              <h2 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                Event zuweisen
              </h2>
              <p className="mb-4 text-sm text-zinc-600 dark:text-zinc-400">
                Wähle ein Event aus, zu dem der QR-Code weiterleiten soll. Du kannst dies jederzeit ändern.
              </p>

              {events.length === 0 ? (
                <div className="rounded-lg bg-yellow-50 p-4 dark:bg-yellow-900/20">
                  <p className="text-sm text-yellow-800 dark:text-yellow-300">
                    Du hast noch keine Events erstellt.{" "}
                    <a
                      href="/photographer/events/new"
                      className="font-medium underline hover:text-yellow-900 dark:hover:text-yellow-200"
                    >
                      Erstelle dein erstes Event
                    </a>
                  </p>
                </div>
              ) : (
                <>
                  <div className="mb-4">
                    <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                      Event auswählen
                    </label>
                    <select
                      value={selectedEventId}
                      onChange={(e) => setSelectedEventId(e.target.value)}
                      className="block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-100"
                    >
                      <option value="">Kein Event zugewiesen</option>
                      {events.map((event) => (
                        <option key={event.id} value={event.id}>
                          {event.title} - {new Date(event.event_date).toLocaleDateString("de-DE")} ({event.location})
                        </option>
                      ))}
                    </select>
                  </div>

                  {qrCode.event_id && (
                    <div className="mb-4 rounded-lg bg-blue-50 p-3 dark:bg-blue-900/20">
                      <p className="text-sm text-blue-800 dark:text-blue-300">
                        <strong>Aktuell zugewiesen:</strong>{" "}
                        {events.find((e) => e.id === qrCode.event_id)?.title || "Unbekannt"}
                      </p>
                    </div>
                  )}

                  <button
                    onClick={handleUpdateEvent}
                    disabled={saving || selectedEventId === qrCode.event_id}
                    className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700 disabled:opacity-50"
                  >
                    {saving ? "Speichere..." : "Event zuweisen"}
                  </button>
                </>
              )}
            </div>

            {/* Usage Tips */}
            <div className="rounded-lg border border-zinc-200 bg-blue-50 p-6 dark:border-zinc-700 dark:bg-blue-900/20">
              <h3 className="mb-3 text-sm font-semibold text-blue-900 dark:text-blue-400">
                💡 Verwendungstipps:
              </h3>
              <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-300">
                <li>• Drucke den QR-Code auf ein Poster oder Schild</li>
                <li>• Stelle es am Strand, im Ziel oder an einem zentralen Ort auf</li>
                <li>• Ändere das zugewiesene Event jederzeit, ohne den QR-Code neu drucken zu müssen</li>
                <li>• Der QR-Code bleibt derselbe, auch wenn du das Event wechselst</li>
              </ul>
            </div>
          </div>
        )}

        {/* Notification Toast */}
        {showNotification && (
          <div className="fixed bottom-8 right-8 z-50 animate-slide-up">
            <div className={`rounded-lg px-6 py-4 shadow-lg ${
              notification.type === "success" 
                ? "bg-green-600 text-white" 
                : "bg-red-600 text-white"
            }`}>
              <div className="flex items-center gap-3">
                <span className="text-lg">{notification.type === "success" ? "✓" : "✕"}</span>
                <span className="font-medium">{notification.message}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

