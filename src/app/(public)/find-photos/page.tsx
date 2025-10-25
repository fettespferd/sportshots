"use client";

import { useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { Modal } from "@/components/ui/modal";

interface MatchedPhoto {
  id: string;
  watermark_url: string;
  bib_number: string | null;
  price: number;
  event_id: string;
  event_title: string;
  event_slug: string;
}

export default function FindPhotosPage() {
  const [cameraActive, setCameraActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [matchedPhotos, setMatchedPhotos] = useState<MatchedPhoto[]>([]);
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

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const supabase = createClient();

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: 1280, height: 720 },
      });

      streamRef.current = stream;
      setCameraActive(true);

      // Wait for next render cycle to ensure video element exists
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch((err) => {
            console.error("Video play error:", err);
          });
        }
      }, 100);
    } catch (error) {
      console.error("Camera error:", error);
      setModalState({
        isOpen: true,
        title: "Kamera-Fehler",
        message:
          "Kamera konnte nicht gestartet werden. Bitte erlaube den Kamerazugriff.",
        type: "error",
      });
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  const captureAndSearch = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");

    if (!context) return;

    // Set canvas size to video size
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert to blob
    canvas.toBlob(async (blob) => {
      if (!blob) {
        setModalState({
          isOpen: true,
          title: "Fehler",
          message: "Selfie konnte nicht aufgenommen werden",
          type: "error",
        });
        return;
      }

      setLoading(true);
      stopCamera();

      try {
        // Upload selfie to temporary storage
        const fileName = `selfies/temp/${Date.now()}.jpg`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("photos")
          .upload(fileName, blob, {
            contentType: "image/jpeg",
            cacheControl: "3600",
            upsert: true,
          });

        if (uploadError) {
          console.error("Upload error:", uploadError);
          throw uploadError;
        }

        const {
          data: { publicUrl },
        } = supabase.storage.from("photos").getPublicUrl(fileName);

        // Search for matching photos
        const response = await fetch("/api/photos/search-face", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ selfieUrl: publicUrl }),
        });

        const data = await response.json();

        if (data.error) {
          throw new Error(data.error);
        }

        if (data.matches && data.matches.length > 0) {
          setMatchedPhotos(data.matches);
          setModalState({
            isOpen: true,
            title: "Fotos gefunden! 🎉",
            message: `Wir haben ${data.matches.length} Foto(s) von dir gefunden!`,
            type: "success",
          });
        } else {
          setMatchedPhotos([]);
          setModalState({
            isOpen: true,
            title: "Keine Fotos gefunden",
            message:
              "Leider wurden keine Fotos von dir gefunden. Versuche es mit einem anderen Event oder Selfie.",
            type: "info",
          });
        }

        // Clean up temporary selfie
        await supabase.storage.from("photos").remove([fileName]);
      } catch (error: any) {
        console.error("Search error:", error);
        setModalState({
          isOpen: true,
          title: "Fehler",
          message: error.message || "Suche fehlgeschlagen. Bitte versuche es erneut.",
          type: "error",
        });
      } finally {
        setLoading(false);
      }
    }, "image/jpeg");
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900">
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-zinc-900 dark:text-zinc-50">
            Finde deine Fotos mit einem Selfie
          </h1>
          <p className="mt-4 text-lg text-zinc-600 dark:text-zinc-400">
            Nimm ein Selfie auf und wir finden automatisch alle Fotos von dir aus allen Events
          </p>
        </div>

        {/* Camera Section */}
        <div className="rounded-2xl bg-white p-8 shadow-xl dark:bg-zinc-800">
          {!cameraActive && matchedPhotos.length === 0 && (
            <div className="text-center">
              <div className="mx-auto mb-6 flex h-32 w-32 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600">
                <svg
                  className="h-16 w-16 text-white"
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
              <h2 className="mb-4 text-2xl font-bold text-zinc-900 dark:text-zinc-50">
                Bereit für dein Selfie?
              </h2>
              <p className="mb-8 text-zinc-600 dark:text-zinc-400">
                Klicke auf den Button, um die Kamera zu starten
              </p>
              <button
                onClick={startCamera}
                className="rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 px-8 py-4 text-lg font-bold text-white shadow-xl transition-all hover:scale-105"
              >
                📸 Kamera starten
              </button>
            </div>
          )}

          {cameraActive && (
            <div className="space-y-6">
              <div className="relative aspect-video overflow-hidden rounded-xl bg-zinc-900">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="h-full w-full object-cover"
                  style={{ transform: "scaleX(-1)" }}
                />
                {/* Oval Guide */}
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                  <div
                    className="border-4 border-white/50 shadow-2xl"
                    style={{
                      width: "280px",
                      height: "360px",
                      borderRadius: "50%",
                    }}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  onClick={captureAndSearch}
                  disabled={loading}
                  className="flex-1 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 px-6 py-4 text-lg font-bold text-white transition-all hover:scale-105 disabled:opacity-50"
                >
                  {loading ? "Suche läuft..." : "📸 Foto aufnehmen & suchen"}
                </button>
                <button
                  onClick={stopCamera}
                  disabled={loading}
                  className="rounded-lg border-2 border-zinc-300 px-6 py-4 font-semibold text-zinc-700 transition-colors hover:bg-zinc-100 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-700"
                >
                  ✕ Abbrechen
                </button>
              </div>

              <p className="text-center text-sm text-zinc-500 dark:text-zinc-400">
                💡 Positioniere dein Gesicht im Oval für beste Ergebnisse
              </p>
            </div>
          )}

          {/* Results */}
          {matchedPhotos.length > 0 && (
            <div className="mt-8 space-y-6">
              <div className="text-center">
                <h3 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
                  Deine Fotos ({matchedPhotos.length})
                </h3>
                <p className="mt-2 text-zinc-600 dark:text-zinc-400">
                  Klicke auf ein Foto, um zum Event zu gelangen
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                {matchedPhotos.map((photo) => (
                  <Link
                    key={photo.id}
                    href={`/event/${photo.event_slug}?photo=${photo.id}`}
                    className="group relative aspect-square overflow-hidden rounded-lg bg-zinc-100 shadow-lg transition-all hover:scale-105 hover:shadow-xl dark:bg-zinc-700"
                  >
                    <img
                      src={photo.watermark_url}
                      alt="Dein Foto"
                      className="h-full w-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 transition-opacity group-hover:opacity-100">
                      <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                        <p className="text-sm font-semibold">{photo.event_title}</p>
                        <p className="text-xs">{photo.price.toFixed(2)} €</p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>

              <div className="text-center">
                <button
                  onClick={() => {
                    setMatchedPhotos([]);
                    startCamera();
                  }}
                  className="rounded-lg border-2 border-blue-500 px-6 py-3 font-semibold text-blue-600 transition-colors hover:bg-blue-50 dark:border-blue-400 dark:text-blue-400 dark:hover:bg-blue-900/20"
                >
                  🔄 Neues Selfie aufnehmen
                </button>
              </div>
            </div>
          )}

          <canvas ref={canvasRef} className="hidden" />
        </div>

        {/* Alternative Search Methods */}
        <div className="mt-8 text-center">
          <p className="mb-4 text-sm text-zinc-600 dark:text-zinc-400">
            Oder suche nach einem bestimmten Event:
          </p>
          <Link
            href="/search"
            className="inline-block rounded-lg border-2 border-zinc-300 px-6 py-3 font-semibold text-zinc-700 transition-colors hover:bg-zinc-100 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-700"
          >
            🔍 Events durchsuchen
          </Link>
        </div>
      </div>

      {/* Modal */}
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

