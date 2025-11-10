"use client";

import { useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { Modal } from "@/components/ui/modal";
import { useLanguage } from "@/lib/i18n/LanguageContext";

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
  const { t } = useLanguage();
  const [cameraActive, setCameraActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState("");
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
      setLoadingStep("Foto wird aufgenommen...");
      stopCamera();

      try {
        // Upload selfie to temporary storage
        setLoadingStep("Selfie wird hochgeladen...");
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
        setLoadingStep("Gesichter werden analysiert...");
        await new Promise(resolve => setTimeout(resolve, 500)); // Short delay for UX
        
        const response = await fetch("/api/photos/search-face", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ selfieUrl: publicUrl }),
        });

        const data = await response.json();

        if (data.error) {
          throw new Error(data.error);
        }

        setLoadingStep("Fotos werden durchsucht...");
        await new Promise(resolve => setTimeout(resolve, 300));

        if (data.matches && data.matches.length > 0) {
          setMatchedPhotos(data.matches);
          setLoadingStep("Fertig!");
          
          setTimeout(() => {
            setModalState({
              isOpen: true,
              title: "Gefunden!",
              message: `${data.matches.length} ${data.matches.length === 1 ? 'Foto' : 'Fotos'} mit deinem Gesicht gefunden 🎉`,
              type: "success",
            });
          }, 300);
        } else {
          setMatchedPhotos([]);
          setModalState({
            isOpen: true,
            title: "Nichts gefunden",
            message:
              "Für dieses Gesicht gibt es noch keine Fotos. Vielleicht warst du bei einem anderen Event?",
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
          message: error.message || "Die Suche hat nicht funktioniert. Versuche es nochmal.",
          type: "error",
        });
      } finally {
        setLoading(false);
        setLoadingStep("");
      }
    }, "image/jpeg");
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900">
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-zinc-900 dark:text-zinc-50 sm:text-5xl">
            {t("findPhotos.title")}
          </h1>
          <p className="mt-3 text-lg text-zinc-600 dark:text-zinc-400">
            {t("findPhotos.subtitle")}
          </p>
        </div>

        {/* Loading Overlay */}
        {loading && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="mx-4 w-full max-w-sm rounded-2xl bg-white p-8 shadow-2xl dark:bg-zinc-800">
              <div className="mb-6 flex justify-center">
                <div className="relative h-16 w-16">
                  <div className="absolute inset-0 animate-spin rounded-full border-4 border-zinc-200 border-t-blue-600 dark:border-zinc-700 dark:border-t-blue-400"></div>
                  <div className="absolute inset-2 animate-ping rounded-full bg-blue-400 opacity-20"></div>
                </div>
              </div>
              <p className="text-center text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                {loadingStep}
              </p>
              <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700">
                <div className="h-full animate-progress bg-gradient-to-r from-blue-500 to-purple-600"></div>
              </div>
            </div>
          </div>
        )}

        {/* Camera Section */}
        <div className="rounded-2xl bg-white p-8 shadow-xl dark:bg-zinc-800">
          {!cameraActive && matchedPhotos.length === 0 && (
            <div className="text-center">
              <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg">
                <svg
                  className="h-12 w-12 text-white"
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
              <h2 className="mb-3 text-2xl font-bold text-zinc-900 dark:text-zinc-50">
                Los geht's!
              </h2>
              <p className="mb-8 text-zinc-600 dark:text-zinc-400">
                Nimm ein Selfie auf und wir suchen deine Fotos
              </p>
              <button
                onClick={startCamera}
                className="group inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 px-8 py-4 text-lg font-semibold text-white shadow-lg transition-all hover:scale-105 hover:shadow-xl"
              >
                <svg className="h-5 w-5 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Kamera starten
              </button>
            </div>
          )}

          {cameraActive && (
            <div className="space-y-6">
              <div className="relative aspect-square overflow-hidden rounded-xl bg-zinc-900 sm:aspect-video">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="h-full w-full object-contain sm:object-cover"
                  style={{ transform: "scaleX(-1)" }}
                />
                {/* Oval Guide */}
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                  <div
                    className="border-4 border-white/50 shadow-2xl"
                    style={{
                      width: "min(280px, 70%)",
                      height: "min(360px, 85%)",
                      borderRadius: "50%",
                    }}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  onClick={captureAndSearch}
                  disabled={loading}
                  className="group flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 px-6 py-4 text-lg font-semibold text-white shadow-lg transition-all hover:scale-105 hover:shadow-xl disabled:opacity-50 disabled:hover:scale-100"
                >
                  {loading ? (
                    <>
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                      <span>Suche läuft...</span>
                    </>
                  ) : (
                    <>
                      <svg className="h-5 w-5 transition-transform group-hover:rotate-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span>Jetzt Foto machen</span>
                    </>
                  )}
                </button>
                <button
                  onClick={stopCamera}
                  disabled={loading}
                  className="rounded-lg border-2 border-zinc-300 px-6 py-4 font-semibold text-zinc-700 transition-all hover:bg-zinc-100 hover:border-zinc-400 disabled:opacity-50 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-700 dark:hover:border-zinc-500"
                >
                  Abbrechen
                </button>
              </div>

              <div className="rounded-lg bg-blue-50 p-4 dark:bg-blue-900/20">
                <p className="text-center text-sm text-blue-900 dark:text-blue-300">
                  <span className="font-semibold">Tipp:</span> Positioniere dein Gesicht im Oval und achte auf gutes Licht
                </p>
              </div>
            </div>
          )}

          {/* Results */}
          {matchedPhotos.length > 0 && (
            <div className="mt-8 space-y-6">
              <div className="rounded-lg bg-green-50 p-6 text-center dark:bg-green-900/20">
                <div className="mb-2 text-4xl">🎉</div>
                <h3 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
                  {matchedPhotos.length} {matchedPhotos.length === 1 ? 'Foto gefunden' : 'Fotos gefunden'}!
                </h3>
                <p className="mt-2 text-zinc-600 dark:text-zinc-400">
                  Klick auf ein Foto um es anzusehen und zu kaufen
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
                  className="inline-flex items-center gap-2 rounded-lg border-2 border-blue-500 px-6 py-3 font-semibold text-blue-600 transition-all hover:bg-blue-50 hover:scale-105 dark:border-blue-400 dark:text-blue-400 dark:hover:bg-blue-900/20"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Nochmal versuchen
                </button>
              </div>
            </div>
          )}

          <canvas ref={canvasRef} className="hidden" />
        </div>

        {/* Alternative Search Methods */}
        <div className="mt-8 rounded-lg border-2 border-dashed border-zinc-300 p-6 text-center dark:border-zinc-700">
          <p className="mb-4 text-sm text-zinc-600 dark:text-zinc-400">
            Weißt du schon bei welchem Event du warst?
          </p>
          <Link
            href="/search"
            className="inline-flex items-center gap-2 rounded-lg border-2 border-zinc-300 px-6 py-3 font-semibold text-zinc-700 transition-all hover:bg-zinc-100 hover:border-zinc-400 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-700"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            Events durchsuchen
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

