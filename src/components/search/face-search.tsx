"use client";

import { useState, useRef, useEffect } from "react";
import { Modal } from "@/components/ui/modal";

interface FaceSearchProps {
  eventId: string;
  onResults: (photoIds: string[]) => void;
}

export function FaceSearch({ eventId, onResults }: FaceSearchProps) {
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
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

  // Clean up camera stream on unmount
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [stream]);

  const performFaceSearch = async (file: File) => {
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("selfie", file);
      formData.append("eventId", eventId);

      const response = await fetch("/api/photos/face-search", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (data.error) {
        setModalState({
          isOpen: true,
          title: "Fehler",
          message: data.error,
          type: "error",
        });
        return;
      }

      // Return matched photo IDs
      const photoIds = data.matches.map((m: any) => m.photoId);
      onResults(photoIds);

      setModalState({
        isOpen: true,
        title: "Fotos gefunden!",
        message: `Wir haben ${photoIds.length} Fotos von dir gefunden! ${
          photoIds.length === 0 ? "Versuche es mit einem anderen Foto." : ""
        }`,
        type: photoIds.length > 0 ? "success" : "info",
      });
    } catch (error) {
      console.error("Face search error:", error);
      setModalState({
        isOpen: true,
        title: "Fehler",
        message: "Fehler bei der Gesichtserkennung. Bitte versuche es erneut.",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Show preview
    const previewUrl = URL.createObjectURL(file);
    setPreview(previewUrl);

    // Start face search
    await performFaceSearch(file);
  };

  const openCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
        audio: false,
      });

      setStream(mediaStream);
      setCameraOpen(true);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (error) {
      console.error("Camera error:", error);
      setModalState({
        isOpen: true,
        title: "Kamera-Fehler",
        message: "Kamera konnte nicht geöffnet werden. Bitte erlaube den Zugriff auf die Kamera.",
        type: "error",
      });
    }
  };

  const closeCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    setCameraOpen(false);
  };

  const takePicture = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");

    if (!context) return;

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert canvas to blob
    canvas.toBlob(async (blob) => {
      if (!blob) return;

      // Create file from blob
      const file = new File([blob], "selfie.jpg", { type: "image/jpeg" });

      // Show preview
      const previewUrl = URL.createObjectURL(blob);
      setPreview(previewUrl);

      // Close camera
      closeCamera();

      // Start face search
      await performFaceSearch(file);
    }, "image/jpeg", 0.9);
  };

  return (
    <>
      <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-700">
        <div className="mb-3 flex items-center">
          <svg
            className="mr-2 h-5 w-5 text-blue-600 dark:text-blue-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <h3 className="font-medium text-zinc-900 dark:text-zinc-50">
            Selfie-Suche
          </h3>
        </div>

        <p className="mb-4 text-sm text-zinc-600 dark:text-zinc-400">
          Mache ein Selfie oder lade ein Foto hoch - wir finden automatisch Fotos von dir!
        </p>

        {/* Camera View */}
        {cameraOpen && (
          <div className="mb-4 overflow-hidden rounded-lg border-2 border-blue-500 bg-black">
            <div className="relative aspect-video w-full overflow-hidden bg-zinc-900">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="absolute inset-0 h-full w-full object-cover"
              />
            </div>
            <canvas ref={canvasRef} className="hidden" />
            <div className="flex gap-2 bg-zinc-900 p-3">
              <button
                onClick={takePicture}
                className="flex-1 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
              >
                📸 Foto machen
              </button>
              <button
                onClick={closeCamera}
                className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-300 transition-colors hover:bg-zinc-800 dark:border-zinc-600 dark:hover:bg-zinc-700"
              >
                Abbrechen
              </button>
            </div>
          </div>
        )}

        {/* Preview & Options */}
        {!cameraOpen && (
          <div className="space-y-3">
            {preview && (
              <div className="flex items-center gap-3">
                <img
                  src={preview}
                  alt="Selfie preview"
                  className="h-20 w-20 rounded-lg object-cover"
                />
                <div className="flex-1 text-sm text-zinc-600 dark:text-zinc-400">
                  Gespeichertes Selfie
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={openCamera}
                disabled={loading}
                className={`flex items-center justify-center gap-2 rounded-md border-2 border-zinc-300 px-4 py-3 text-sm font-medium transition-colors hover:border-zinc-400 dark:border-zinc-600 dark:hover:border-zinc-500 ${
                  loading ? "cursor-not-allowed opacity-50" : ""
                }`}
              >
                <svg
                  className="h-5 w-5"
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
                Kamera
              </button>

              <label
                htmlFor="selfie-upload"
                className={`flex cursor-pointer items-center justify-center gap-2 rounded-md border-2 border-dashed border-zinc-300 px-4 py-3 text-sm font-medium transition-colors hover:border-zinc-400 dark:border-zinc-600 dark:hover:border-zinc-500 ${
                  loading ? "cursor-not-allowed opacity-50" : ""
                }`}
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
                Hochladen
                <input
                  id="selfie-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  disabled={loading}
                  className="hidden"
                />
              </label>
            </div>

            {loading && (
              <div className="flex items-center justify-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-900 dark:border-zinc-600 dark:border-t-zinc-50" />
                Suche läuft...
              </div>
            )}
          </div>
        )}

        <p className="mt-3 text-xs text-zinc-500 dark:text-zinc-400">
          💡 Dein Selfie wird nicht gespeichert und nur für die Suche verwendet
        </p>
      </div>

      {/* Modal */}
      <Modal
        isOpen={modalState.isOpen}
        onClose={() => setModalState({ ...modalState, isOpen: false })}
        title={modalState.title}
        message={modalState.message}
        type={modalState.type}
      />
    </>
  );
}

