"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState, useEffect, use } from "react";
import { Modal } from "@/components/ui/modal";
import { EventQRCode } from "@/components/event/event-qr-code";

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

      // Get photos for this event
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
        setModalState({
          isOpen: true,
          title: "Fehler",
          message: "Fehler beim Veröffentlichen: " + error.message,
          type: "error",
        });
        return;
      }

      // Update local state
      const wasPublished = event.is_published;
      setEvent({ ...event, is_published: !event.is_published });
      
      // Show success message
      setModalState({
        isOpen: true,
        title: "Erfolg",
        message: wasPublished ? "Event wurde verborgen" : "Event wurde veröffentlicht!",
        type: "success",
      });
    } catch (error) {
      console.error("Publish error:", error);
      setModalState({
        isOpen: true,
        title: "Fehler",
        message: "Ein Fehler ist aufgetreten. Bitte versuche es erneut.",
        type: "error",
      });
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

      setModalState({
        isOpen: true,
        title: "Erfolg",
        message: "Cover-Bild wurde erfolgreich aktualisiert!",
        type: "success",
      });
    } catch (error: any) {
      console.error("Cover upload error:", error);
      setModalState({
        isOpen: true,
        title: "Fehler",
        message: error.message || "Fehler beim Hochladen des Cover-Bildes",
        type: "error",
      });
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

      setModalState({
        isOpen: true,
        title: "Erfolg",
        message: "Startnummer wurde aktualisiert!",
        type: "success",
      });
    } catch (error: any) {
      setModalState({
        isOpen: true,
        title: "Fehler",
        message: error.message || "Fehler beim Aktualisieren der Startnummer",
        type: "error",
      });
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

      setModalState({
        isOpen: true,
        title: "Gelöscht",
        message: "Das Foto wurde erfolgreich gelöscht.",
        type: "success",
      });
    } catch (error: any) {
      setModalState({
        isOpen: true,
        title: "Fehler",
        message: error.message || "Fehler beim Löschen des Fotos",
        type: "error",
      });
    } finally {
      setDeletingPhoto(null);
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

        {/* QR Code & Marketing */}
        {event.is_published && (
          <EventQRCode
            eventUrl={`${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/event/${event.slug}`}
            eventTitle={event.title}
          />
        )}

        {/* Photos Grid */}
        <div className="rounded-lg bg-white p-6 shadow dark:bg-zinc-800">
          <h2 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            Fotos ({photoCount})
          </h2>

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
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
              {photos.map((photo) => (
                <div
                  key={photo.id}
                  className="group relative overflow-hidden rounded-lg bg-zinc-100 dark:bg-zinc-700"
                >
                  <div className="aspect-square">
                    <img
                      src={photo.watermark_url}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  </div>

                  {/* Bib Number */}
                  <div className="absolute bottom-2 left-2 rounded bg-black/70 px-2 py-1 text-xs font-medium text-white">
                    {photo.bib_number ? `#${photo.bib_number}` : "Keine Startnummer"}
                  </div>

                  {/* Action Buttons */}
                  <div className="absolute right-2 top-2 flex gap-2 opacity-0 transition-opacity group-hover:opacity-100">
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
                      onClick={() => {
                        if (confirm("Foto wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.")) {
                          handleDeletePhoto(photo.id);
                        }
                      }}
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
          )}
        </div>
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

            <div className="flex justify-end space-x-3">
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
      )}

      {/* Standard Modal for notifications */}
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


