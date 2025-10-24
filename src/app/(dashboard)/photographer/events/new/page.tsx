"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { slugify } from "@/lib/utils/slugify";

const eventTypes = [
  { value: "running", label: "Laufen" },
  { value: "cycling", label: "Radfahren" },
  { value: "skiing", label: "Skifahren" },
  { value: "surfing", label: "Surfen" },
  { value: "triathlon", label: "Triathlon" },
  { value: "other", label: "Sonstiges" },
];

export default function NewEventPage() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [eventType, setEventType] = useState("running");
  const [location, setLocation] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [pricePerPhoto, setPricePerPhoto] = useState("8.00");
  const [packagePrice, setPackagePrice] = useState("");
  const [packagePhotoCount, setPackagePhotoCount] = useState("");
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [coverImagePreview, setCoverImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  const handleCoverImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCoverImage(file);
      const preview = URL.createObjectURL(file);
      setCoverImagePreview(preview);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("Nicht angemeldet");
      }

      // Generate slug from title
      const slug = slugify(title);

      // Check if slug already exists
      const { data: existingEvent } = await supabase
        .from("events")
        .select("slug")
        .eq("slug", slug)
        .single();

      const finalSlug = existingEvent
        ? `${slug}-${Date.now().toString().slice(-6)}`
        : slug;

      // Upload cover image if provided
      let coverImageUrl = null;
      if (coverImage) {
        console.log("Uploading cover image:", coverImage.name);
        const fileName = `covers/${user.id}/${Date.now()}-${coverImage.name}`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("photos")
          .upload(fileName, coverImage, {
            contentType: coverImage.type,
            cacheControl: "3600",
          });

        if (uploadError) {
          console.error("Cover upload error:", uploadError);
          
          // Check if it's a policy error
          if (uploadError.message.includes("policy") || uploadError.message.includes("not allowed")) {
            throw new Error(
              `Cover-Bild Upload fehlgeschlagen: Storage-Policy fehlt. ` +
              `Bitte führe die Storage-Migration in Supabase aus. ` +
              `Details: ${uploadError.message}`
            );
          }
          
          throw new Error(`Cover-Bild Upload fehlgeschlagen: ${uploadError.message}`);
        }

        console.log("Cover image uploaded successfully:", fileName);
        
        const {
          data: { publicUrl },
        } = supabase.storage.from("photos").getPublicUrl(fileName);
        coverImageUrl = publicUrl;
      }

      const eventData = {
        photographer_id: user.id,
        title,
        slug: finalSlug,
        description: description || null,
        event_type: eventType,
        location,
        event_date: eventDate,
        price_per_photo: parseFloat(pricePerPhoto),
        package_price: packagePrice ? parseFloat(packagePrice) : null,
        package_photo_count: packagePhotoCount
          ? parseInt(packagePhotoCount)
          : null,
        cover_image_url: coverImageUrl,
        is_published: false,
      };

      const { data: newEvent, error: insertError } = await supabase
        .from("events")
        .insert(eventData)
        .select()
        .single();

      if (insertError) throw insertError;

      router.push(`/photographer/events/${newEvent.id}`);
    } catch (err: any) {
      setError(err.message || "Event konnte nicht erstellt werden");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900">
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
            Neues Event erstellen
          </h1>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            Erstelle ein neues Sportevent und lade deine Fotos hoch
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-6 rounded-lg bg-white p-8 shadow dark:bg-zinc-800"
        >
          {error && (
            <div className="rounded-md bg-red-50 p-4 text-sm text-red-800 dark:bg-red-900/20 dark:text-red-400">
              {error}
            </div>
          )}

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

          {/* Cover Image Upload */}
          <div>
            <label
              htmlFor="coverImage"
              className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              Event-Titelbild
            </label>
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              Optional: Lade ein ansprechendes Bild hoch (z.B. vom Veranstaltungsort, Logo, etc.)
            </p>
            
            {coverImagePreview ? (
              <div className="mt-2">
                <div className="relative inline-block">
                  <img
                    src={coverImagePreview}
                    alt="Cover Preview"
                    className="h-32 w-auto rounded-lg object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setCoverImage(null);
                      setCoverImagePreview(null);
                    }}
                    className="absolute -right-2 -top-2 rounded-full bg-red-500 p-1 text-white hover:bg-red-600"
                  >
                    <svg
                      className="h-4 w-4"
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
                  </button>
                </div>
              </div>
            ) : (
              <label
                htmlFor="coverImage"
                className="mt-2 flex cursor-pointer items-center justify-center rounded-md border-2 border-dashed border-zinc-300 px-6 py-8 transition-colors hover:border-zinc-400 dark:border-zinc-600 dark:hover:border-zinc-500"
              >
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
                <input
                  id="coverImage"
                  type="file"
                  accept="image/*"
                  onChange={handleCoverImageChange}
                  className="hidden"
                />
              </label>
            )}
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
              onClick={() => router.back()}
              className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-700"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              {loading ? "Erstelle Event..." : "Event erstellen"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


