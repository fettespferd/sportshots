"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Toast } from "@/components/ui/toast";
import { slugify, generateUniqueSlug } from "@/lib/utils/slugify";

const eventTypes = [
  { value: "running", label: "Laufen" },
  { value: "cycling", label: "Radfahren" },
  { value: "skiing", label: "Skifahren" },
  { value: "surfing", label: "Surfen" },
  { value: "triathlon", label: "Triathlon" },
  { value: "other", label: "Sonstiges" },
];

export default function EditEventPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const supabase = createClient();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState("");
  const [originalTitle, setOriginalTitle] = useState("");
  const [currentSlug, setCurrentSlug] = useState("");
  const [description, setDescription] = useState("");
  const [eventType, setEventType] = useState("running");
  const [location, setLocation] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [pricePerPhoto, setPricePerPhoto] = useState("8.00");
  const [packagePrice, setPackagePrice] = useState("");
  const [packagePhotoCount, setPackagePhotoCount] = useState("");
  const [toast, setToast] = useState<{
    show: boolean;
    message: string;
    type: "success" | "error" | "info" | "warning";
  }>({
    show: false,
    message: "",
    type: "info",
  });

  const showToast = (message: string, type: "success" | "error" | "info" | "warning" = "info") => {
    setToast({ show: true, message, type });
  };

  useEffect(() => {
    const loadEvent = async () => {
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
        showToast("Event konnte nicht geladen werden", "error");
        router.push("/photographer/events");
        return;
      }

      // Populate form with existing data
      setTitle(eventData.title);
      setOriginalTitle(eventData.title);
      setCurrentSlug(eventData.slug);
      setDescription(eventData.description || "");
      setEventType(eventData.event_type);
      setLocation(eventData.location);
      setEventDate(eventData.event_date);
      setPricePerPhoto(eventData.price_per_photo.toString());
      setPackagePrice(eventData.package_price?.toString() || "");
      setPackagePhotoCount(eventData.package_photo_count?.toString() || "");
      setLoading(false);
    };

    loadEvent();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const updateData: any = {
        title,
        description: description || null,
        event_type: eventType,
        location,
        event_date: eventDate,
        price_per_photo: parseFloat(pricePerPhoto),
        package_price: packagePrice ? parseFloat(packagePrice) : null,
        package_photo_count: packagePhotoCount
          ? parseInt(packagePhotoCount)
          : null,
      };

      // Update slug if title has changed
      if (title !== originalTitle) {
        // Get all existing slugs except the current one
        const { data: existingEvents } = await supabase
          .from("events")
          .select("slug")
          .neq("id", id);

        const existingSlugs = existingEvents?.map((e) => e.slug) || [];
        const newSlug = generateUniqueSlug(title, existingSlugs);
        updateData.slug = newSlug;
      }

      const { error } = await supabase
        .from("events")
        .update(updateData)
        .eq("id", id);

      if (error) throw error;

      showToast("Event wurde erfolgreich aktualisiert!", "success");

      // Redirect after short delay
      setTimeout(() => {
        router.push(`/photographer/events/${id}`);
      }, 1500);
    } catch (err: any) {
      showToast(err.message || "Event konnte nicht aktualisiert werden", "error");
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-900">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-zinc-300 border-t-zinc-900 dark:border-zinc-700 dark:border-t-zinc-50"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900">
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
            Event bearbeiten
          </h1>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            Ändere die Details deines Events
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-6 rounded-lg bg-white p-8 shadow dark:bg-zinc-800"
        >
          <div>
            <label
              htmlFor="title"
              className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              Event-Titel *
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="mt-1 block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-zinc-900 placeholder-zinc-400 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-100 dark:placeholder-zinc-500"
              placeholder="z.B. Berlin Marathon 2025"
            />
          </div>

          <div>
            <label
              htmlFor="description"
              className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              Beschreibung
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="mt-1 block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-zinc-900 placeholder-zinc-400 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-100 dark:placeholder-zinc-500"
              placeholder="Beschreibe das Event..."
            />
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <label
                htmlFor="eventType"
                className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
              >
                Event-Typ *
              </label>
              <select
                id="eventType"
                value={eventType}
                onChange={(e) => setEventType(e.target.value)}
                required
                className="mt-1 block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-zinc-900 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-100"
              >
                {eventTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="eventDate"
                className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
              >
                Event-Datum *
              </label>
              <input
                id="eventDate"
                type="date"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                required
                className="mt-1 block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-zinc-900 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-100"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="location"
              className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              Ort *
            </label>
            <input
              id="location"
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              required
              className="mt-1 block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-zinc-900 placeholder-zinc-400 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-100 dark:placeholder-zinc-500"
              placeholder="z.B. Berlin, Deutschland"
            />
          </div>

          <div className="border-t border-zinc-200 pt-6 dark:border-zinc-700">
            <h3 className="mb-4 text-lg font-medium text-zinc-900 dark:text-zinc-50">
              Preise
            </h3>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              <div>
                <label
                  htmlFor="pricePerPhoto"
                  className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
                >
                  Preis pro Foto *
                </label>
                <div className="relative mt-1">
                  <input
                    id="pricePerPhoto"
                    type="number"
                    step="0.01"
                    min="0"
                    value={pricePerPhoto}
                    onChange={(e) => setPricePerPhoto(e.target.value)}
                    required
                    className="block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 pr-8 text-zinc-900 placeholder-zinc-400 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-100"
                    placeholder="8.00"
                  />
                  <span className="pointer-events-none absolute right-3 top-2 text-zinc-500 dark:text-zinc-400">
                    €
                  </span>
                </div>
              </div>

              <div>
                <label
                  htmlFor="packagePrice"
                  className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
                >
                  Paketpreis (optional)
                </label>
                <div className="relative mt-1">
                  <input
                    id="packagePrice"
                    type="number"
                    step="0.01"
                    min="0"
                    value={packagePrice}
                    onChange={(e) => setPackagePrice(e.target.value)}
                    className="block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 pr-8 text-zinc-900 placeholder-zinc-400 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-100"
                    placeholder="20.00"
                  />
                  <span className="pointer-events-none absolute right-3 top-2 text-zinc-500 dark:text-zinc-400">
                    €
                  </span>
                </div>
              </div>

              <div>
                <label
                  htmlFor="packagePhotoCount"
                  className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
                >
                  Fotos im Paket
                </label>
                <input
                  id="packagePhotoCount"
                  type="number"
                  min="1"
                  value={packagePhotoCount}
                  onChange={(e) => setPackagePhotoCount(e.target.value)}
                  className="mt-1 block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-zinc-900 placeholder-zinc-400 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-100"
                  placeholder="3"
                  disabled={!packagePrice}
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end space-x-4 border-t border-zinc-200 pt-6 dark:border-zinc-700">
            <button
              type="button"
              onClick={() => router.push(`/photographer/events/${id}`)}
              className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-700"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              {saving ? "Speichert..." : "Änderungen speichern"}
            </button>
          </div>
        </form>
      </div>

      {/* Toast Notification */}
      <Toast
        show={toast.show}
        type={toast.type}
        message={toast.message}
        onClose={() => setToast({ ...toast, show: false })}
      />
    </div>
  );
}

