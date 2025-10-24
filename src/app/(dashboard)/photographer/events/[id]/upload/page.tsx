"use client";

import { useState, useEffect, use } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface UploadFile {
  file: File;
  preview: string;
  bibNumber: string;
  status: "pending" | "uploading" | "success" | "error";
  error?: string;
}

export default function UploadPhotosPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: eventId } = use(params);
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [eventTitle, setEventTitle] = useState<string>("");
  const router = useRouter();
  const supabase = createClient();

  // Load event title
  useState(() => {
    const loadEvent = async () => {
      const { data } = await supabase
        .from("events")
        .select("title")
        .eq("id", eventId)
        .single();
      if (data) setEventTitle(data.title);
    };
    loadEvent();
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;

    const newFiles = Array.from(e.target.files).map((file) => ({
      file,
      preview: URL.createObjectURL(file),
      bibNumber: "",
      status: "pending" as const,
    }));

    setFiles((prev) => [...prev, ...newFiles]);
  };

  const updateBibNumber = (index: number, bibNumber: string) => {
    setFiles((prev) =>
      prev.map((f, i) => (i === index ? { ...f, bibNumber } : f))
    );
  };

  const removeFile = (index: number) => {
    setFiles((prev) => {
      const file = prev[index];
      URL.revokeObjectURL(file.preview);
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleUpload = async () => {
    setUploading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      alert("Nicht angemeldet");
      return;
    }

    // Get event details for pricing
    const { data: event } = await supabase
      .from("events")
      .select("price_per_photo")
      .eq("id", eventId)
      .single();

    if (!event) {
      alert("Event nicht gefunden");
      return;
    }

    for (let i = 0; i < files.length; i++) {
      const uploadFile = files[i];

      if (uploadFile.status === "success") continue;

      setFiles((prev) =>
        prev.map((f, idx) =>
          idx === i ? { ...f, status: "uploading" } : f
        )
      );

      try {
        // Upload to Supabase Storage
        const fileExt = uploadFile.file.name.split(".").pop();
        const fileName = `${eventId}/${Date.now()}-${Math.random()
          .toString(36)
          .substring(7)}.${fileExt}`;

        // Upload original
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("photos")
          .upload(`originals/${fileName}`, uploadFile.file, {
            cacheControl: "3600",
            upsert: false,
          });

        if (uploadError) throw uploadError;

        // Get public URL
        const {
          data: { publicUrl: originalUrl },
        } = supabase.storage.from("photos").getPublicUrl(`originals/${fileName}`);

        // Generate watermark version
        const watermarkFormData = new FormData();
        watermarkFormData.append("file", uploadFile.file);
        watermarkFormData.append("eventId", eventId);
        watermarkFormData.append("eventName", eventTitle);

        const watermarkResponse = await fetch("/api/photos/watermark", {
          method: "POST",
          body: watermarkFormData,
        });

        if (!watermarkResponse.ok) {
          console.warn("Watermark generation failed, using original");
        }

        const { watermarkUrl, thumbnailUrl } = watermarkResponse.ok
          ? await watermarkResponse.json()
          : { watermarkUrl: originalUrl, thumbnailUrl: originalUrl };

        // Perform OCR for bib number detection if no manual bib number provided
        let detectedBibNumber = uploadFile.bibNumber;
        if (!detectedBibNumber) {
          try {
            const ocrResponse = await fetch("/api/photos/ocr", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ imageUrl: originalUrl }),
            });

            if (ocrResponse.ok) {
              const { bibNumber } = await ocrResponse.json();
              if (bibNumber) {
                detectedBibNumber = bibNumber;
              }
            }
          } catch (ocrError) {
            console.warn("OCR failed:", ocrError);
          }
        }

        // Save to database
        const { error: dbError } = await supabase.from("photos").insert({
          event_id: eventId,
          photographer_id: user.id,
          original_url: originalUrl,
          watermark_url: watermarkUrl,
          thumbnail_url: thumbnailUrl,
          price: event.price_per_photo,
          bib_number: detectedBibNumber || null,
        });

        if (dbError) throw dbError;

        setFiles((prev) =>
          prev.map((f, idx) =>
            idx === i ? { ...f, status: "success" } : f
          )
        );
      } catch (error: any) {
        console.error("Upload error:", error);
        setFiles((prev) =>
          prev.map((f, idx) =>
            idx === i
              ? { ...f, status: "error", error: error.message }
              : f
          )
        );
      }
    }

    setUploading(false);

    // Check if all uploads successful
    const allSuccess = files.every((f) => f.status === "success");
    if (allSuccess) {
      router.push(`/photographer/events/${eventId}`);
    }
  };

  const pendingCount = files.filter((f) => f.status === "pending").length;
  const successCount = files.filter((f) => f.status === "success").length;
  const errorCount = files.filter((f) => f.status === "error").length;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="mb-4 flex items-center text-sm text-zinc-600 dark:text-zinc-400">
            <Link
              href="/photographer/events"
              className="hover:text-zinc-900 dark:hover:text-zinc-50"
            >
              Meine Events
            </Link>
            <svg
              className="mx-2 h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
            <Link
              href={`/photographer/events/${eventId}`}
              className="hover:text-zinc-900 dark:hover:text-zinc-50"
            >
              {eventTitle || "Event"}
            </Link>
            <svg
              className="mx-2 h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
            <span className="text-zinc-900 dark:text-zinc-50">
              Fotos hochladen
            </span>
          </div>

          <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
            Fotos hochladen
          </h1>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            Wähle Fotos aus und weise optional Startnummern zu
          </p>
        </div>

        {/* Upload Stats */}
        {files.length > 0 && (
          <div className="mb-6 flex items-center space-x-4 rounded-lg bg-white p-4 shadow dark:bg-zinc-800">
            <div className="text-sm">
              <span className="font-medium text-zinc-900 dark:text-zinc-50">
                {files.length}
              </span>{" "}
              <span className="text-zinc-600 dark:text-zinc-400">
                Fotos ausgewählt
              </span>
            </div>
            {successCount > 0 && (
              <div className="text-sm text-green-600 dark:text-green-400">
                {successCount} erfolgreich
              </div>
            )}
            {errorCount > 0 && (
              <div className="text-sm text-red-600 dark:text-red-400">
                {errorCount} fehlgeschlagen
              </div>
            )}
          </div>
        )}

        {/* File Input */}
        <div className="mb-8 rounded-lg bg-white p-8 shadow dark:bg-zinc-800">
          <label
            htmlFor="file-upload"
            className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-zinc-300 p-12 transition-colors hover:border-zinc-400 dark:border-zinc-700 dark:hover:border-zinc-600"
          >
            <svg
              className="mb-4 h-12 w-12 text-zinc-400"
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
            <span className="mb-2 text-sm font-medium text-zinc-900 dark:text-zinc-50">
              Klicke zum Auswählen oder ziehe Dateien hierher
            </span>
            <span className="text-xs text-zinc-500 dark:text-zinc-400">
              PNG, JPG, JPEG bis zu 10MB pro Datei
            </span>
            <input
              id="file-upload"
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
              disabled={uploading}
            />
          </label>
        </div>

        {/* Files Grid */}
        {files.length > 0 && (
          <div className="mb-8 rounded-lg bg-white p-6 shadow dark:bg-zinc-800">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {files.map((uploadFile, index) => (
                <div
                  key={index}
                  className="relative overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-700"
                >
                  <div className="aspect-video w-full overflow-hidden bg-zinc-100 dark:bg-zinc-700">
                    <img
                      src={uploadFile.preview}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  </div>

                  {uploadFile.status === "uploading" && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                      <div className="h-8 w-8 animate-spin rounded-full border-4 border-white border-t-transparent"></div>
                    </div>
                  )}

                  {uploadFile.status === "success" && (
                    <div className="absolute right-2 top-2 rounded-full bg-green-500 p-1">
                      <svg
                        className="h-4 w-4 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </div>
                  )}

                  {uploadFile.status === "error" && (
                    <div className="absolute right-2 top-2 rounded-full bg-red-500 p-1">
                      <svg
                        className="h-4 w-4 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </div>
                  )}

                  <div className="p-4">
                    <input
                      type="text"
                      placeholder="Startnummer (optional)"
                      value={uploadFile.bibNumber}
                      onChange={(e) => updateBibNumber(index, e.target.value)}
                      disabled={uploading || uploadFile.status === "success"}
                      className="mb-2 w-full rounded border border-zinc-300 bg-white px-2 py-1 text-sm text-zinc-900 focus:border-zinc-500 focus:outline-none disabled:opacity-50 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-100"
                    />

                    {uploadFile.error && (
                      <p className="mb-2 text-xs text-red-600 dark:text-red-400">
                        {uploadFile.error}
                      </p>
                    )}

                    <button
                      onClick={() => removeFile(index)}
                      disabled={uploading}
                      className="text-xs text-red-600 hover:underline disabled:opacity-50 dark:text-red-400"
                    >
                      Entfernen
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        {files.length > 0 && (
          <div className="flex items-center justify-end space-x-4">
            <button
              onClick={() => router.back()}
              disabled={uploading}
              className="rounded-md border border-zinc-300 px-6 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-700"
            >
              Abbrechen
            </button>
            <button
              onClick={handleUpload}
              disabled={uploading || pendingCount === 0}
              className="rounded-md bg-zinc-900 px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              {uploading
                ? `Uploading... (${successCount}/${files.length})`
                : `${pendingCount} Fotos hochladen`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}


