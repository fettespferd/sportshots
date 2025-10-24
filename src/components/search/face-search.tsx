"use client";

import { useState } from "react";

interface FaceSearchProps {
  eventId: string;
  onResults: (photoIds: string[]) => void;
}

export function FaceSearch({ eventId, onResults }: FaceSearchProps) {
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Show preview
    const previewUrl = URL.createObjectURL(file);
    setPreview(previewUrl);

    // Start face search
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
        alert(data.error);
        return;
      }

      // Return matched photo IDs
      const photoIds = data.matches.map((m: any) => m.photoId);
      onResults(photoIds);

      alert(`${photoIds.length} Fotos gefunden!`);
    } catch (error) {
      console.error("Face search error:", error);
      alert("Fehler bei der Gesichtserkennung");
    } finally {
      setLoading(false);
    }
  };

  return (
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
        Lade ein Selfie hoch und wir finden automatisch Fotos von dir!
      </p>

      <div className="flex items-center gap-3">
        {preview && (
          <img
            src={preview}
            alt="Selfie preview"
            className="h-16 w-16 rounded-full object-cover"
          />
        )}

        <label
          htmlFor="selfie-upload"
          className={`flex-1 cursor-pointer rounded-md border-2 border-dashed border-zinc-300 px-4 py-3 text-center text-sm transition-colors hover:border-zinc-400 dark:border-zinc-600 dark:hover:border-zinc-500 ${
            loading ? "opacity-50 cursor-not-allowed" : ""
          }`}
        >
          {loading ? (
            <span className="text-zinc-600 dark:text-zinc-400">
              Suche läuft... ⏳
            </span>
          ) : (
            <span className="text-zinc-700 dark:text-zinc-300">
              {preview ? "Anderes Selfie wählen" : "Selfie hochladen 📸"}
            </span>
          )}
          <input
            id="selfie-upload"
            type="file"
            accept="image/*"
            capture="user"
            onChange={handleFileSelect}
            disabled={loading}
            className="hidden"
          />
        </label>
      </div>

      <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
        💡 Dein Selfie wird nicht gespeichert und nur für die Suche verwendet
      </p>
    </div>
  );
}

