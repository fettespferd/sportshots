"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState, useEffect, use } from "react";
import { Toast } from "@/components/ui/toast";
import { EventQRCode } from "@/components/event/event-qr-code";
import { Lightbox } from "@/components/ui/lightbox";

export default function EventDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [event, setEvent] = useState<any>(null);
  const [photos, setPhotos] = useState<any[]>([]);
  const [purchases, setPurchases] = useState<any[]>([]);
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [editingPhoto, setEditingPhoto] = useState<any>(null);
  const [editBibNumber, setEditBibNumber] = useState("");
  const [deletingPhoto, setDeletingPhoto] = useState<string | null>(null);
  const [confirmDeletePhoto, setConfirmDeletePhoto] = useState<string | null>(null);
  const [rotatingPhoto, setRotatingPhoto] = useState<string | null>(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxPhoto, setLightboxPhoto] = useState<any>(null);
  const [selectedPhotos, setSelectedPhotos] = useState<Set<string>>(new Set());
  const [batchDeleting, setBatchDeleting] = useState(false);
  const [toast, setToast] = useState<{
    show: boolean;
    message: string;
    type: "success" | "error" | "info" | "warning";
  }>({
    show: false,
    message: "",
    type: "info",
  });
  const [searchConfig, setSearchConfig] = useState<any>(null);
  const [savingSearchConfig, setSavingSearchConfig] = useState(false);

  const showToast = (message: string, type: "success" | "error" | "info" | "warning" = "info") => {
    setToast({ show: true, message, type });
  };

  useEffect(() => {
    const loadData = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/signin");
        return;
      }

      // Get event details
      const { data: eventData, error } = await supabase
        .from("events")
        .select("*")
        .eq("id", id)
        .eq("photographer_id", user.id)
        .single();

      if (error || !eventData) {
        router.push("/photographer/events");
        return;
      }

      // Get photos for this event (including edited_url)
      const { data: photosData } = await supabase
        .from("photos")
        .select("*")
        .eq("event_id", id)
        .order("created_at", { ascending: false });

      // Get purchases for this event
      const { data: purchasesData } = await supabase
        .from("purchases")
        .select("*")
        .eq("event_id", id)
        .eq("status", "completed");

      setEvent(eventData);
      setPhotos(photosData || []);
      setPurchases(purchasesData || []);
      
      // Load search config or set defaults
      const defaultConfig = {
        bib_number: { enabled: true, visible_by_default: true },
        selfie_search: { enabled: true, visible_by_default: true },
        date_filter: { enabled: true, visible_by_default: true },
        time_filter: { enabled: true, visible_by_default: true },
        show_metadata: { enabled: true, visible_by_default: true },
        show_exact_time: { enabled: true, visible_by_default: true },
      };
      setSearchConfig(eventData.search_config || defaultConfig);
      
      setLoading(false);
    };

    loadData();
  }, [id]);

  const handlePublishToggle = async () => {
    try {
      const { error } = await supabase
        .from("events")
        .update({ is_published: !event.is_published })
        .eq("id", id);

      if (error) {
        console.error("Publish error:", error);
        showToast("Fehler beim Veröffentlichen: " + error.message, "error");
        return;
      }

      // Update local state
      const wasPublished = event.is_published;
      setEvent({ ...event, is_published: !event.is_published });
      
      // Show success message
      showToast(wasPublished ? "Event wurde verborgen" : "Event wurde veröffentlicht!", "success");
    } catch (error) {
      console.error("Publish error:", error);
      showToast("Ein Fehler ist aufgetreten. Bitte versuche es erneut.", "error");
    }
  };

  const handleCoverImageUpload = async (file: File) => {
    setUploadingCover(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("Nicht angemeldet");
      }

      console.log("Uploading cover image:", file.name);
      const fileName = `covers/${user.id}/${Date.now()}-${file.name}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("photos")
        .upload(fileName, file, {
          contentType: file.type,
          cacheControl: "3600",
        });

      if (uploadError) {
        console.error("Cover upload error:", uploadError);
        throw new Error(`Upload fehlgeschlagen: ${uploadError.message}`);
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from("photos").getPublicUrl(fileName);

      // Update event with new cover image
      const { error: updateError } = await supabase
        .from("events")
        .update({ cover_image_url: publicUrl })
        .eq("id", id);

      if (updateError) {
        throw new Error(`Aktualisierung fehlgeschlagen: ${updateError.message}`);
      }

      // Update local state
      setEvent({ ...event, cover_image_url: publicUrl });
      setCoverImage(null);

      showToast("Cover-Bild wurde erfolgreich aktualisiert!", "success");
    } catch (error: any) {
      console.error("Cover upload error:", error);
      showToast(error.message || "Fehler beim Hochladen des Cover-Bildes", "error");
    } finally {
      setUploadingCover(false);
    }
  };

  // Update bib number
  const handleUpdateBibNumber = async () => {
    if (!editingPhoto) return;

    try {
      const { error } = await supabase
        .from("photos")
        .update({ bib_number: editBibNumber || null })
        .eq("id", editingPhoto.id);

      if (error) throw error;

      // Update local state
      setPhotos(
        photos.map((p) =>
          p.id === editingPhoto.id ? { ...p, bib_number: editBibNumber || null } : p
        )
      );

      setEditingPhoto(null);
      setEditBibNumber("");

      showToast("Startnummer wurde aktualisiert!", "success");
    } catch (error: any) {
      showToast(error.message || "Fehler beim Aktualisieren der Startnummer", "error");
    }
  };

  // Delete bib number
  const handleDeleteBibNumber = async (photoId: string) => {
    try {
      const { error } = await supabase
        .from("photos")
        .update({ bib_number: null })
        .eq("id", photoId);

      if (error) throw error;

      // Update local state
      setPhotos(
        photos.map((p) =>
          p.id === photoId ? { ...p, bib_number: null } : p
        )
      );

      showToast("Startnummer wurde gelöscht!", "success");
    } catch (error: any) {
      showToast(error.message || "Fehler beim Löschen der Startnummer", "error");
    }
  };

  // Delete photo
  const handleDeletePhoto = async (photoId: string) => {
    setDeletingPhoto(photoId);

    try {
      const photo = photos.find((p) => p.id === photoId);
      if (!photo) throw new Error("Foto nicht gefunden");

      // Delete from storage
      const watermarkPath = photo.watermark_url.split("/photos/")[1];
      const originalPath = photo.original_url.split("/photos/")[1];

      await Promise.all([
        supabase.storage.from("photos").remove([watermarkPath]),
        supabase.storage.from("photos").remove([originalPath]),
      ]);

      // Delete from database
      const { error } = await supabase.from("photos").delete().eq("id", photoId);

      if (error) throw error;

      // Update local state
      setPhotos(photos.filter((p) => p.id !== photoId));

      showToast("Das Foto wurde erfolgreich gelöscht.", "success");
    } catch (error: any) {
      showToast(error.message || "Fehler beim Löschen des Fotos", "error");
    } finally {
      setDeletingPhoto(null);
    }
  };

  const handleBatchDeletePhotos = async () => {
    if (selectedPhotos.size === 0) return;

    setBatchDeleting(true);

    try {
      const photosToDelete = photos.filter(p => selectedPhotos.has(p.id));
      const photoIds = photosToDelete.map(p => p.id);

      // Batch delete from database (single query)
      const { error: dbError } = await supabase
        .from("photos")
        .delete()
        .in("id", photoIds);

      if (dbError) {
        throw dbError;
      }

      // Batch delete from storage
      const storagePaths: string[] = [];
      photosToDelete.forEach(photo => {
        const watermarkPath = photo.watermark_url.split("/photos/")[1];
        const originalPath = photo.original_url.split("/photos/")[1];
        if (watermarkPath) storagePaths.push(watermarkPath);
        if (originalPath) storagePaths.push(originalPath);
      });

      if (storagePaths.length > 0) {
        await supabase.storage.from("photos").remove(storagePaths);
      }

      // Optimistic update - remove from local state immediately
      setPhotos(photos.filter(p => !selectedPhotos.has(p.id)));
      setSelectedPhotos(new Set());

      showToast(`${photoIds.length} Foto(s) erfolgreich gelöscht.`, "success");
    } catch (error: any) {
      console.error("Batch delete error:", error);
      // Reload on error to restore correct state
      const { data: photosData } = await supabase
        .from("photos")
        .select("*")
        .eq("event_id", id)
        .order("created_at", { ascending: false });
      
      if (photosData) setPhotos(photosData);
      
      showToast(error.message || "Fehler beim Löschen der Fotos", "error");
    } finally {
      setBatchDeleting(false);
    }
  };

  const togglePhotoSelection = (photoId: string) => {
    setSelectedPhotos(prev => {
      const newSet = new Set(prev);
      if (newSet.has(photoId)) {
        newSet.delete(photoId);
      } else {
        newSet.add(photoId);
      }
      return newSet;
    });
  };

  const selectAllPhotos = () => {
    setSelectedPhotos(new Set(photos.map(p => p.id)));
  };

  const deselectAllPhotos = () => {
    setSelectedPhotos(new Set());
  };

  const handleRotatePhoto = async (photoId: string, direction: 'left' | 'right') => {
    setRotatingPhoto(photoId);

    try {
      const photo = photos.find((p) => p.id === photoId);
      if (!photo) throw new Error("Foto nicht gefunden");

      // Calculate new rotation
      // Left: -90°, Right: +90°
      const currentRotation = photo.rotation || 0;
      const change = direction === 'right' ? 90 : -90;
      let newRotation = (currentRotation + change) % 360;
      
      // Ensure rotation is always 0, 90, 180, or 270
      if (newRotation < 0) newRotation += 360;

      // Update database
      const { error } = await supabase
        .from("photos")
        .update({ rotation: newRotation })
        .eq("id", photoId);

      if (error) throw error;

      // Update local state
      setPhotos(
        photos.map((p) =>
          p.id === photoId ? { ...p, rotation: newRotation } : p
        )
      );
    } catch (error: any) {
      showToast(error.message || "Fehler beim Drehen des Fotos", "error");
    } finally {
      setRotatingPhoto(null);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-900">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-zinc-300 border-t-zinc-900 dark:border-zinc-700 dark:border-t-zinc-50"></div>
      </div>
    );
  }

  if (!event) {
    return null;
  }

  const totalRevenue =
    purchases?.reduce((sum, p) => sum + Number(p.photographer_amount), 0) || 0;
  const photoCount = photos?.length || 0;
  const purchaseCount = purchases?.length || 0;

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
            <span className="text-zinc-900 dark:text-zinc-50">
              {event.title}
            </span>
          </div>

          {/* Event Header */}
          <div className="space-y-4">
            <div>
              <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 md:text-3xl">
                {event.title}
              </h1>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
                <span>{event.location}</span>
                <span>•</span>
                <span>
                  {new Date(event.event_date).toLocaleDateString("de-DE")}
                </span>
                <span>•</span>
                <span
                  className={`rounded-full px-2 py-1 text-xs font-medium ${
                    event.is_published
                      ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
                      : "bg-zinc-100 text-zinc-800 dark:bg-zinc-700 dark:text-zinc-300"
                  }`}
                >
                  {event.is_published ? "Veröffentlicht" : "Entwurf"}
                </span>
              </div>
            </div>

            {/* Action Buttons - Mobile optimized */}
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <Link
                href={`/photographer/events/${id}/edit`}
                className="flex-1 rounded-md border border-zinc-300 px-4 py-2.5 text-center text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-700 sm:flex-none"
              >
                ✏️ Bearbeiten
              </Link>
              {photoCount > 0 && (
                <button
                  onClick={handlePublishToggle}
                  className="flex-1 rounded-md border border-zinc-300 px-4 py-2.5 text-center text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-700 sm:flex-none"
                >
                  {event.is_published ? "❌ Verbergen" : "✅ Veröffentlichen"}
                </button>
              )}
              <Link
                href={`/photographer/events/${id}/upload`}
                className="flex-1 rounded-md bg-zinc-900 px-4 py-2.5 text-center text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200 sm:flex-none"
              >
                📸 Fotos hochladen
              </Link>
            </div>
          </div>
        </div>

        {/* Photos Grid - Moved to top as most used feature */}
        <div className="mb-8 rounded-lg bg-white p-6 shadow dark:bg-zinc-800">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              Fotos ({photoCount})
            </h2>
            <Link
              href={`/photographer/events/${id}/upload`}
              className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              📸 Hochladen
            </Link>
          </div>

          {!photos || photos.length === 0 ? (
            <div className="rounded-lg border-2 border-dashed border-zinc-300 bg-zinc-50 p-12 text-center dark:border-zinc-700 dark:bg-zinc-900">
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
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <h3 className="mt-4 text-sm font-medium text-zinc-900 dark:text-zinc-50">
                Keine Fotos hochgeladen
              </h3>
              <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
                Lade deine ersten Fotos für dieses Event hoch.
              </p>
              <Link
                href={`/photographer/events/${id}/upload`}
                className="mt-4 inline-block rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
              >
                Fotos hochladen
              </Link>
            </div>
          ) : (
            <>
              {/* Batch Controls - Floating Bottom Right */}
              {selectedPhotos.size > 0 && (
                <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-lg bg-white p-3 shadow-xl ring-1 ring-zinc-200 dark:bg-zinc-800 dark:ring-zinc-700">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-medium text-zinc-900 dark:text-zinc-100">
                      {selectedPhotos.size} ausgewählt
                    </span>
                    <button
                      onClick={deselectAllPhotos}
                      className="text-xs text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-300"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="h-4 w-px bg-zinc-300 dark:bg-zinc-600" />
                  <button
                    onClick={handleBatchDeletePhotos}
                    disabled={batchDeleting}
                    className="flex items-center gap-1.5 rounded-md bg-red-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-50"
                  >
                    {batchDeleting ? (
                      <>
                        <div className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        <span>Lösche...</span>
                      </>
                    ) : (
                      <>
                        <svg
                          className="h-3.5 w-3.5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                        <span>Löschen</span>
                      </>
                    )}
                  </button>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
                {photos.map((photo) => (
                  <div
                    key={photo.id}
                    className="group relative overflow-hidden rounded-lg bg-zinc-100 dark:bg-zinc-700"
                  >

                    <div 
                      className="aspect-square cursor-zoom-in overflow-hidden"
                      onClick={() => {
                        setLightboxPhoto(photo);
                        setLightboxOpen(true);
                      }}
                    >
                      <img
                        src={photo.watermark_url}
                        alt=""
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        style={{
                          transform: `rotate(${photo.rotation || 0}deg)`,
                        }}
                      />
                      
                      {/* Zoom icon hint */}
                      <div className="pointer-events-none absolute inset-0 z-0 flex items-center justify-center bg-black/0 opacity-0 transition-all group-hover:bg-black/20 group-hover:opacity-100">
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
                            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"
                          />
                        </svg>
                      </div>
                    </div>

                    {/* Bib Number */}
                    <div className="pointer-events-none absolute bottom-2 left-2 z-10 rounded bg-black/70 px-2 py-1 text-xs font-medium text-white">
                      {photo.bib_number ? `#${photo.bib_number}` : "Keine Startnummer"}
                    </div>

                    {/* Edited Version Indicator */}
                    {photo.edited_url && (
                      <div className="pointer-events-none absolute top-2 left-2 z-10 rounded bg-blue-600 px-2 py-1 text-xs font-medium text-white">
                        ✨ Bearbeitet
                      </div>
                    )}

                    {/* Checkbox - Bottom Right */}
                    <label className="absolute bottom-2 right-2 z-20 cursor-pointer" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selectedPhotos.has(photo.id)}
                        onChange={() => togglePhotoSelection(photo.id)}
                        className="h-5 w-5 cursor-pointer rounded border-2 border-white bg-white/80 text-blue-600 transition-all focus:ring-2 focus:ring-blue-500 focus:ring-offset-0"
                      />
                    </label>

                    {/* Action Buttons */}
                    <div className="absolute right-2 top-2 z-10 flex gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                      <button
                        onClick={() => handleRotatePhoto(photo.id, 'left')}
                        disabled={rotatingPhoto === photo.id}
                        className="rounded-full bg-purple-600 p-2 text-white shadow-lg transition-transform hover:scale-110 disabled:opacity-50"
                        title="Nach links drehen"
                      >
                        {rotatingPhoto === photo.id ? (
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        ) : (
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                          </svg>
                        )}
                      </button>
                      <button
                        onClick={() => handleRotatePhoto(photo.id, 'right')}
                        disabled={rotatingPhoto === photo.id}
                        className="rounded-full bg-indigo-600 p-2 text-white shadow-lg transition-transform hover:scale-110 disabled:opacity-50"
                        title="Nach rechts drehen"
                      >
                        {rotatingPhoto === photo.id ? (
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        ) : (
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10h-10a8 8 0 00-8 8v2M21 10l-6 6m6-6l-6-6" />
                          </svg>
                        )}
                      </button>
                      <button
                        onClick={() => {
                          setEditingPhoto(photo);
                          setEditBibNumber(photo.bib_number || "");
                        }}
                        className="rounded-full bg-blue-600 p-2 text-white shadow-lg transition-transform hover:scale-110"
                        title="Startnummer bearbeiten"
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => setConfirmDeletePhoto(photo.id)}
                        disabled={deletingPhoto === photo.id}
                        className="rounded-full bg-red-600 p-2 text-white shadow-lg transition-transform hover:scale-110 disabled:opacity-50"
                        title="Foto löschen"
                      >
                        {deletingPhoto === photo.id ? (
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        ) : (
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Additional Upload Button at bottom */}
              <div className="mt-6 text-center">
                <Link
                  href={`/photographer/events/${id}/upload`}
                  className="inline-flex items-center gap-2 rounded-md border-2 border-dashed border-zinc-300 px-6 py-3 text-sm font-medium text-zinc-700 transition-colors hover:border-zinc-400 hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-300 dark:hover:border-zinc-500 dark:hover:bg-zinc-700"
                >
                  📸 Weitere Fotos hochladen
                </Link>
              </div>
            </>
          )}
        </div>

        {/* Stats Cards */}
        <div className="mb-8 grid gap-6 md:grid-cols-3">
          <div className="rounded-lg bg-white p-6 shadow dark:bg-zinc-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                  Fotos
                </p>
                <p className="mt-2 text-3xl font-bold text-zinc-900 dark:text-zinc-50">
                  {photoCount}
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
                  Verkäufe
                </p>
                <p className="mt-2 text-3xl font-bold text-zinc-900 dark:text-zinc-50">
                  {purchaseCount}
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
                    d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              </div>
            </div>
          </div>

          <div className="rounded-lg bg-white p-6 shadow dark:bg-zinc-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                  Umsatz
                </p>
                <p className="mt-2 text-3xl font-bold text-zinc-900 dark:text-zinc-50">
                  {totalRevenue.toFixed(2)} €
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
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Cover Image */}
        <div className="mb-8 rounded-lg bg-white p-6 shadow dark:bg-zinc-800">
          <h2 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            Event-Titelbild
          </h2>
          
          {event.cover_image_url ? (
            <div className="space-y-4">
              <div className="relative inline-block">
                <img
                  src={event.cover_image_url}
                  alt={event.title}
                  className="h-48 w-auto rounded-lg object-cover shadow-md"
                />
              </div>
              <div>
                <label
                  htmlFor="cover-update"
                  className={`inline-flex cursor-pointer items-center gap-2 rounded-md border border-blue-600 px-4 py-2 text-sm font-medium text-blue-600 transition-colors hover:bg-blue-50 dark:border-blue-400 dark:text-blue-400 dark:hover:bg-blue-900/20 ${
                    uploadingCover ? "cursor-not-allowed opacity-50" : ""
                  }`}
                >
                  {uploadingCover ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
                      Wird hochgeladen...
                    </>
                  ) : (
                    <>
                      🖼️ Bild ändern
                    </>
                  )}
                  <input
                    id="cover-update"
                    type="file"
                    accept="image/*"
                    disabled={uploadingCover}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleCoverImageUpload(file);
                    }}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          ) : (
            <div>
              <p className="mb-3 text-sm text-zinc-600 dark:text-zinc-400">
                Noch kein Titelbild hochgeladen. Füge ein ansprechendes Bild hinzu!
              </p>
              <label
                htmlFor="cover-upload"
                className={`flex cursor-pointer items-center justify-center rounded-md border-2 border-dashed border-zinc-300 px-6 py-8 transition-colors hover:border-zinc-400 dark:border-zinc-600 dark:hover:border-zinc-500 ${
                  uploadingCover ? "cursor-not-allowed opacity-50" : ""
                }`}
              >
                {uploadingCover ? (
                  <div className="text-center">
                    <div className="mx-auto mb-2 h-12 w-12 animate-spin rounded-full border-4 border-zinc-300 border-t-zinc-900 dark:border-zinc-600 dark:border-t-zinc-50" />
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">
                      Wird hochgeladen...
                    </p>
                  </div>
                ) : (
                  <div className="text-center">
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
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 16m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                      Bild hochladen
                    </p>
                  </div>
                )}
                <input
                  id="cover-upload"
                  type="file"
                  accept="image/*"
                  disabled={uploadingCover}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleCoverImageUpload(file);
                  }}
                  className="hidden"
                />
              </label>
            </div>
          )}
        </div>

        {/* Event Details */}
        <div className="mb-8 rounded-lg bg-white p-6 shadow dark:bg-zinc-800">
          <h2 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            Event-Details
          </h2>
          <dl className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <dt className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                Event-Typ
              </dt>
              <dd className="mt-1 text-sm text-zinc-900 dark:text-zinc-50">
                {event.event_type}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                Preis pro Foto
              </dt>
              <dd className="mt-1 text-sm text-zinc-900 dark:text-zinc-50">
                {event.price_per_photo.toFixed(2)} €
              </dd>
            </div>
            {event.package_price && (
              <>
                <div>
                  <dt className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                    Paketpreis
                  </dt>
                  <dd className="mt-1 text-sm text-zinc-900 dark:text-zinc-50">
                    {event.package_price.toFixed(2)} €
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                    Fotos im Paket
                  </dt>
                  <dd className="mt-1 text-sm text-zinc-900 dark:text-zinc-50">
                    {event.package_photo_count}
                  </dd>
                </div>
              </>
            )}
            {event.description && (
              <div className="md:col-span-2">
                <dt className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                  Beschreibung
                </dt>
                <dd className="mt-1 text-sm text-zinc-900 dark:text-zinc-50">
                  {event.description}
                </dd>
              </div>
            )}
            <div className="md:col-span-2">
              <dt className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                Event-URL
              </dt>
              <dd className="mt-1 text-sm text-zinc-900 dark:text-zinc-50">
                <code className="rounded bg-zinc-100 px-2 py-1 dark:bg-zinc-700">
                  {process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}
                  /event/{event.slug}
                </code>
              </dd>
            </div>
          </dl>
        </div>

        {/* Search Configuration */}
        <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-700 dark:bg-zinc-800">
          <h3 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            Suchoptionen & Metadaten konfigurieren
          </h3>
          <p className="mb-4 text-sm text-zinc-600 dark:text-zinc-400">
            Bestimme, welche Suchoptionen für Endkunden verfügbar sind und ob sie standardmäßig sichtbar sind.
          </p>

          {searchConfig && (
            <div className="space-y-4">
              {/* Bib Number Search */}
              <div className="flex items-center justify-between rounded-lg border border-zinc-200 p-4 dark:border-zinc-700">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                      Startnummer-Suche
                    </label>
                    <input
                      type="checkbox"
                      checked={searchConfig.bib_number?.enabled ?? true}
                      onChange={(e) => {
                        setSearchConfig({
                          ...searchConfig,
                          bib_number: {
                            ...searchConfig.bib_number,
                            enabled: e.target.checked,
                          },
                        });
                      }}
                      className="h-4 w-4 rounded border-zinc-300 text-blue-600 focus:ring-blue-500"
                    />
                  </div>
                  {searchConfig.bib_number?.enabled && (
                    <div className="mt-2 flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={searchConfig.bib_number?.visible_by_default ?? true}
                        onChange={(e) => {
                          setSearchConfig({
                            ...searchConfig,
                            bib_number: {
                              ...searchConfig.bib_number,
                              visible_by_default: e.target.checked,
                            },
                          });
                        }}
                        className="h-4 w-4 rounded border-zinc-300 text-blue-600 focus:ring-blue-500"
                      />
                      <label className="text-xs text-zinc-600 dark:text-zinc-400">
                        Standardmäßig sichtbar
                      </label>
                    </div>
                  )}
                </div>
              </div>

              {/* Selfie Search */}
              <div className="flex items-center justify-between rounded-lg border border-zinc-200 p-4 dark:border-zinc-700">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                      Selfie-Suche
                    </label>
                    <input
                      type="checkbox"
                      checked={searchConfig.selfie_search?.enabled ?? true}
                      onChange={(e) => {
                        setSearchConfig({
                          ...searchConfig,
                          selfie_search: {
                            ...searchConfig.selfie_search,
                            enabled: e.target.checked,
                          },
                        });
                      }}
                      className="h-4 w-4 rounded border-zinc-300 text-blue-600 focus:ring-blue-500"
                    />
                  </div>
                  {searchConfig.selfie_search?.enabled && (
                    <div className="mt-2 flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={searchConfig.selfie_search?.visible_by_default ?? true}
                        onChange={(e) => {
                          setSearchConfig({
                            ...searchConfig,
                            selfie_search: {
                              ...searchConfig.selfie_search,
                              visible_by_default: e.target.checked,
                            },
                          });
                        }}
                        className="h-4 w-4 rounded border-zinc-300 text-blue-600 focus:ring-blue-500"
                      />
                      <label className="text-xs text-zinc-600 dark:text-zinc-400">
                        Standardmäßig sichtbar
                      </label>
                    </div>
                  )}
                </div>
              </div>

              {/* Date Filter */}
              <div className="flex items-center justify-between rounded-lg border border-zinc-200 p-4 dark:border-zinc-700">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                      Datum-Filter
                    </label>
                    <input
                      type="checkbox"
                      checked={searchConfig.date_filter?.enabled ?? true}
                      onChange={(e) => {
                        setSearchConfig({
                          ...searchConfig,
                          date_filter: {
                            ...searchConfig.date_filter,
                            enabled: e.target.checked,
                          },
                        });
                      }}
                      className="h-4 w-4 rounded border-zinc-300 text-blue-600 focus:ring-blue-500"
                    />
                  </div>
                  {searchConfig.date_filter?.enabled && (
                    <div className="mt-2 flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={searchConfig.date_filter?.visible_by_default ?? true}
                        onChange={(e) => {
                          setSearchConfig({
                            ...searchConfig,
                            date_filter: {
                              ...searchConfig.date_filter,
                              visible_by_default: e.target.checked,
                            },
                          });
                        }}
                        className="h-4 w-4 rounded border-zinc-300 text-blue-600 focus:ring-blue-500"
                      />
                      <label className="text-xs text-zinc-600 dark:text-zinc-400">
                        Standardmäßig sichtbar
                      </label>
                    </div>
                  )}
                </div>
              </div>

              {/* Time Filter */}
              <div className="flex items-center justify-between rounded-lg border border-zinc-200 p-4 dark:border-zinc-700">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                      Uhrzeit-Filter
                    </label>
                    <input
                      type="checkbox"
                      checked={searchConfig.time_filter?.enabled ?? true}
                      onChange={(e) => {
                        setSearchConfig({
                          ...searchConfig,
                          time_filter: {
                            ...searchConfig.time_filter,
                            enabled: e.target.checked,
                          },
                        });
                      }}
                      className="h-4 w-4 rounded border-zinc-300 text-blue-600 focus:ring-blue-500"
                    />
                  </div>
                  {searchConfig.time_filter?.enabled && (
                    <div className="mt-2 flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={searchConfig.time_filter?.visible_by_default ?? true}
                        onChange={(e) => {
                          setSearchConfig({
                            ...searchConfig,
                            time_filter: {
                              ...searchConfig.time_filter,
                              visible_by_default: e.target.checked,
                            },
                          });
                        }}
                        className="h-4 w-4 rounded border-zinc-300 text-blue-600 focus:ring-blue-500"
                      />
                      <label className="text-xs text-zinc-600 dark:text-zinc-400">
                        Standardmäßig sichtbar
                      </label>
                    </div>
                  )}
                </div>
              </div>

              {/* Show Metadata */}
              <div className="flex items-center justify-between rounded-lg border border-zinc-200 p-4 dark:border-zinc-700">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                      Metadaten anzeigen (Kamera, etc.)
                    </label>
                    <input
                      type="checkbox"
                      checked={searchConfig.show_metadata?.enabled ?? true}
                      onChange={(e) => {
                        setSearchConfig({
                          ...searchConfig,
                          show_metadata: {
                            ...searchConfig.show_metadata,
                            enabled: e.target.checked,
                          },
                        });
                      }}
                      className="h-4 w-4 rounded border-zinc-300 text-blue-600 focus:ring-blue-500"
                    />
                  </div>
                  {searchConfig.show_metadata?.enabled && (
                    <div className="mt-2 flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={searchConfig.show_metadata?.visible_by_default ?? true}
                        onChange={(e) => {
                          setSearchConfig({
                            ...searchConfig,
                            show_metadata: {
                              ...searchConfig.show_metadata,
                              visible_by_default: e.target.checked,
                            },
                          });
                        }}
                        className="h-4 w-4 rounded border-zinc-300 text-blue-600 focus:ring-blue-500"
                      />
                      <label className="text-xs text-zinc-600 dark:text-zinc-400">
                        Standardmäßig sichtbar
                      </label>
                    </div>
                  )}
                </div>
              </div>

              {/* Show Exact Time */}
              <div className="flex items-center justify-between rounded-lg border border-zinc-200 p-4 dark:border-zinc-700">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                      Genaue Uhrzeit anzeigen
                    </label>
                    <input
                      type="checkbox"
                      checked={searchConfig.show_exact_time?.enabled ?? true}
                      onChange={(e) => {
                        setSearchConfig({
                          ...searchConfig,
                          show_exact_time: {
                            ...searchConfig.show_exact_time,
                            enabled: e.target.checked,
                          },
                        });
                      }}
                      className="h-4 w-4 rounded border-zinc-300 text-blue-600 focus:ring-blue-500"
                    />
                  </div>
                  {searchConfig.show_exact_time?.enabled && (
                    <div className="mt-2 flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={searchConfig.show_exact_time?.visible_by_default ?? true}
                        onChange={(e) => {
                          setSearchConfig({
                            ...searchConfig,
                            show_exact_time: {
                              ...searchConfig.show_exact_time,
                              visible_by_default: e.target.checked,
                            },
                          });
                        }}
                        className="h-4 w-4 rounded border-zinc-300 text-blue-600 focus:ring-blue-500"
                      />
                      <label className="text-xs text-zinc-600 dark:text-zinc-400">
                        Standardmäßig sichtbar
                      </label>
                    </div>
                  )}
                </div>
              </div>

              <button
                onClick={async () => {
                  setSavingSearchConfig(true);
                  try {
                    const { error } = await supabase
                      .from("events")
                      .update({ search_config: searchConfig })
                      .eq("id", id);

                    if (error) throw error;
                    showToast("Suchkonfiguration erfolgreich gespeichert!", "success");
                  } catch (error: any) {
                    showToast("Fehler beim Speichern: " + error.message, "error");
                  } finally {
                    setSavingSearchConfig(false);
                  }
                }}
                disabled={savingSearchConfig}
                className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
              >
                {savingSearchConfig ? "Speichere..." : "Konfiguration speichern"}
              </button>
            </div>
          )}
        </div>

        {/* QR Code & Marketing */}
        {event.is_published && (
          <EventQRCode
            eventUrl={`${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/event/${event.slug}`}
            eventTitle={event.title}
          />
        )}

      </div>

      {/* Edit Bib Number Modal */}
      {editingPhoto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl dark:bg-zinc-800">
            <h3 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              Startnummer bearbeiten
            </h3>
            
            <div className="mb-6">
              <label
                htmlFor="bibNumber"
                className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
              >
                Startnummer
              </label>
              <input
                id="bibNumber"
                type="text"
                value={editBibNumber}
                onChange={(e) => setEditBibNumber(e.target.value)}
                placeholder="z.B. 457"
                className="block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-zinc-900 placeholder-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-100 dark:placeholder-zinc-500"
                autoFocus
              />
              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                Lasse das Feld leer, um die Startnummer zu entfernen
              </p>
            </div>

            <div className="flex items-center justify-between gap-3">
              <button
                onClick={() => {
                  handleDeleteBibNumber(editingPhoto.id);
                  setEditingPhoto(null);
                  setEditBibNumber("");
                }}
                className="rounded-md border border-red-300 px-4 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 dark:border-red-600 dark:text-red-400 dark:hover:bg-red-900/20"
              >
                🗑️ Startnummer löschen
              </button>
              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setEditingPhoto(null);
                    setEditBibNumber("");
                  }}
                  className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-700"
                >
                  Abbrechen
                </button>
                <button
                  onClick={handleUpdateBibNumber}
                  className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
                >
                  Speichern
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Photo Confirmation Modal */}
      {confirmDeletePhoto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl dark:bg-zinc-800">
            <h3 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              Foto wirklich löschen?
            </h3>
            
            <p className="mb-6 text-sm text-zinc-600 dark:text-zinc-400">
              Diese Aktion kann nicht rückgängig gemacht werden.
            </p>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setConfirmDeletePhoto(null)}
                className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-700"
              >
                Abbrechen
              </button>
              <button
                onClick={() => {
                  handleDeletePhoto(confirmDeletePhoto);
                  setConfirmDeletePhoto(null);
                }}
                className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700"
              >
                Löschen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      <Toast
        show={toast.show}
        type={toast.type}
        message={toast.message}
        onClose={() => setToast({ ...toast, show: false })}
      />

      {/* Lightbox for photographer - shows original without watermark, with edited version toggle */}
      <Lightbox
        isOpen={lightboxOpen}
        onClose={() => {
          setLightboxOpen(false);
          setLightboxPhoto(null);
        }}
        imageUrl={lightboxPhoto?.original_url || ""}
        alt="Foto Original"
        photoId={lightboxPhoto?.id}
        bibNumber={lightboxPhoto?.bib_number}
        price={lightboxPhoto?.price}
        takenAt={lightboxPhoto?.taken_at}
        cameraMake={lightboxPhoto?.camera_make}
        cameraModel={lightboxPhoto?.camera_model}
        rotation={lightboxPhoto?.rotation || 0}
        editedUrl={lightboxPhoto?.edited_url || null}
      />
    </div>
  );
}


